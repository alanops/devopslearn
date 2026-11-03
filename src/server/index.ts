import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { spawn, ChildProcess } from 'child_process'
import cors from 'cors'
import path from 'path'
import fs from 'fs'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')))

// Catch-all handler for frontend routes (except WebSocket and API)
app.get('*', (req, res, next) => {
  // Skip serving static files for socket.io and API routes
  if (req.path.startsWith('/socket.io') || req.path.startsWith('/api')) {
    return next()
  }
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

interface ScenarioSession {
  containerId: string
  process: ChildProcess
  scenarioId: string
}

const sessions = new Map<string, ScenarioSession>()

const DOCKER_NETWORK = 'devops-dojo-net'
const DOCKER_SOCKET = '/var/run/docker.sock'
const READINESS_POLL_MS = 500
const READINESS_TIMEOUT_MS = 5 * 60 * 1000

// Printed by a scenario's setup script once it has finished. Scenarios listed
// here are only ready after the marker appears, not just when the container runs.
const SETUP_COMPLETE_MARKERS: Record<string, string> = {
  'k8s-crashloop': '=== SCENARIO READY ===',
}

// The server's stdio is piped, so `docker run -t` would be rejected with "the
// input device is not a TTY". Allocate the PTY inside the container instead.
const SCENARIO_COMMAND =
  '[ -x /home/devops/entrypoint.sh ] && exec /home/devops/entrypoint.sh || exec /bin/bash'

// API endpoint to check server health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', sessions: sessions.size })
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)
  
  const scenarioId = socket.handshake.query.scenarioId as string
  
  if (!scenarioId) {
    socket.emit('output', '\r\nError: No scenario ID provided\r\n')
    socket.disconnect()
    return
  }
  
  console.log(`Starting scenario '${scenarioId}' for socket ${socket.id}`)
  
  // Start a new container for this scenario
  startScenarioContainer(socket, scenarioId).catch((error) => {
    console.error(`Failed to start scenario ${scenarioId}:`, error)
    socket.emit('output', `\r\nError: Failed to start scenario: ${error.message}\r\n`)
    socket.disconnect()
  })
  
  socket.on('input', (data: string) => {
    const session = sessions.get(socket.id)
    if (session?.process.stdin) {
      session.process.stdin.write(data)
    }
  })
  
  socket.on('resize', (size: { cols: number, rows: number }) => {
    const session = sessions.get(socket.id)
    if (session?.process.stdin) {
      // Handle terminal resize if needed
    }
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    cleanupSession(socket.id)
  })
})

// Run a docker CLI command to completion. Never rejects: a missing docker binary
// is reported as a null exit code with the error message in stderr.
function runDocker(args: string[]): Promise<{ code: number | null, stdout: string, stderr: string }> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    const child = spawn('docker', args)
    child.stdout.on('data', (data) => { stdout += data })
    child.stderr.on('data', (data) => { stderr += data })
    child.on('error', (error) => resolve({ code: null, stdout, stderr: error.message }))
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

async function checkDockerImage(imageName: string): Promise<boolean> {
  return (await runDocker(['image', 'inspect', imageName])).code === 0
}

async function isContainerRunning(containerName: string): Promise<boolean> {
  const { code, stdout } = await runDocker(['inspect', '-f', '{{.State.Running}}', containerName])
  return code === 0 && stdout.trim() === 'true'
}

// The scenario user isn't in the host's docker group, so it needs the socket's
// group to use the mounted socket.
function dockerSocketGroupArgs(): string[] {
  try {
    return ['--group-add', String(fs.statSync(DOCKER_SOCKET).gid)]
  } catch (error) {
    console.error(`Could not read group of ${DOCKER_SOCKET}:`, error)
    return []
  }
}

async function waitForScenarioReady(
  socketId: string,
  containerName: string,
  setupComplete: () => boolean
): Promise<boolean> {
  const deadline = Date.now() + READINESS_TIMEOUT_MS
  while (sessions.has(socketId) && Date.now() < deadline) {
    if (setupComplete() && await isContainerRunning(containerName)) {
      return sessions.has(socketId)
    }
    await new Promise((resolve) => setTimeout(resolve, READINESS_POLL_MS))
  }
  return false
}

async function startScenarioContainer(socket: any, scenarioId: string) {
  // Check if Docker is available
  const dockerAvailable = await checkDockerDaemon()
  if (!dockerAvailable) {
    console.error(`Docker unavailable, cannot start scenario ${scenarioId}`)
    socket.emit('output', '\r\nDocker scenarios are not available in this deployment.\r\n')
    socket.emit('output', 'This is a demo version - Docker scenarios require a Docker-enabled host.\r\n')
    socket.emit('output', '\r\nYou can still explore the frontend interface!\r\n')
    socket.emit('scenario-ready')
    return
  }

  // Map scenario IDs to Docker images
  const scenarioImages: Record<string, string> = {
    'k8s-crashloop': 'devopslearn/scenario-keycloak-crashloop',
    'tf-drift': 'devopslearn/scenario-terraform-drift',
    'rds-failure': 'devopslearn/scenario-rds-failure',
    // Add more scenarios here
  }
  
  const imageName = scenarioImages[scenarioId] || 'devopslearn/scenario-base'
  
  // Check if Docker image exists
  const imageExists = await checkDockerImage(imageName)
  if (!imageExists) {
    console.error(`Docker image '${imageName}' not found for scenario ${scenarioId}`)
    socket.emit('output', `\r\nError: Docker image '${imageName}' not found.\r\n`)
    socket.emit('output', `Please run 'make scenario-build' to build the scenario images.\r\n`)
    socket.emit('output', `\r\nDisconnecting...\r\n`)
    socket.disconnect()
    return
  }
  
  // The network may be gone, or Docker may have been unavailable at server startup
  if (!await ensureDockerNetwork()) {
    socket.emit('output', `\r\nError: Could not create Docker network '${DOCKER_NETWORK}'.\r\n`)
    socket.emit('output', `\r\nDisconnecting...\r\n`)
    socket.disconnect()
    return
  }

  // The client may have left during the checks above; nothing would clean up after it
  if (!socket.connected) {
    console.log(`Client ${socket.id} left before scenario ${scenarioId} started`)
    return
  }

  const containerName = `devops-dojo-${socket.id}`

  // Build Docker run arguments
  const args = [
    'run',
    '-i',
    '--rm',
    '--name', containerName,
    '--network', DOCKER_NETWORK,
    '--env', 'TERM=xterm-256color',
    '--entrypoint', 'script',
  ]
  
  // Mount Docker socket for Kubernetes scenarios that need it
  const k8sScenarios = ['k8s-crashloop', 'k8s-dns', 'k8s-istio']
  if (k8sScenarios.includes(scenarioId)) {
    args.push('-v', `${DOCKER_SOCKET}:${DOCKER_SOCKET}`, ...dockerSocketGroupArgs())
  }
  
  args.push(imageName, '-qfec', SCENARIO_COMMAND, '/dev/null')
  
  // Start Docker container
  const dockerProcess = spawn('docker', args)
  
  // Store session
  sessions.set(socket.id, {
    containerId: containerName,
    process: dockerProcess,
    scenarioId
  })
  
  const marker = SETUP_COMPLETE_MARKERS[scenarioId]
  let setupComplete = !marker
  let recentOutput = ''
  
  // Handle Docker output
  dockerProcess.stdout.on('data', (data) => {
    const text = data.toString()
    if (!setupComplete) {
      // Keep a tail so a marker split across chunks is still found
      recentOutput = (recentOutput + text).slice(-(text.length + marker.length))
      setupComplete = recentOutput.includes(marker)
    }
    socket.emit('output', text)
  })
  
  // A write after the container has gone must not crash the server
  dockerProcess.stdin.on('error', (error) => {
    console.error(`Stdin error for scenario ${scenarioId}:`, error)
  })
  
  dockerProcess.stderr.on('data', (data) => {
    const errorMessage = data.toString()
    console.error(`Container ${scenarioId} stderr:`, errorMessage)
    socket.emit('output', errorMessage)
  })
  
  dockerProcess.on('error', (error) => {
    console.error(`Failed to start container for scenario ${scenarioId}:`, error)
    socket.emit('output', `\r\nError: Failed to start container: ${error.message}\r\n`)
    cleanupSession(socket.id)
  })
  
  dockerProcess.on('exit', (code) => {
    console.log(`Container for scenario ${scenarioId} exited with code ${code}`)
    socket.emit('output', `\r\nContainer exited with code ${code}\r\n`)
    if (code === 0) {
      sessions.delete(socket.id)
    } else {
      // A failed `docker run` can leave a created container behind
      cleanupSession(socket.id)
    }
  })
  
  // Notify client once the container is running and its setup has finished
  const ready = await waitForScenarioReady(socket.id, containerName, () => setupComplete)
  if (ready) {
    socket.emit('scenario-ready')
    console.log(`Scenario ${scenarioId} is ready for socket ${socket.id}`)
  } else if (sessions.has(socket.id)) {
    console.error(`Scenario ${scenarioId} not ready after ${READINESS_TIMEOUT_MS}ms for socket ${socket.id}`)
    socket.emit('output', '\r\nWarning: Scenario setup did not finish in time. The environment may be incomplete.\r\n')
  }
}

async function cleanupSession(socketId: string) {
  const session = sessions.get(socketId)
  if (session) {
    console.log(`Cleaning up session for ${socketId}, scenario: ${session.scenarioId}`)
    sessions.delete(socketId)
    // Remove the Docker container, whether it is running or was only created
    const { code, stderr } = await runDocker(['rm', '-f', session.containerId])
    if (code !== 0 && !stderr.includes('No such container')) {
      console.error(`Error removing container ${session.containerId}:`, stderr)
    }
  }
}

// Check if Docker daemon is accessible
async function checkDockerDaemon(): Promise<boolean> {
  const { code, stderr } = await runDocker(['version'])
  if (code !== 0) {
    console.error('Docker daemon check failed:', stderr)
  }
  return code === 0
}

// Ensure Docker network exists
async function ensureDockerNetwork(): Promise<boolean> {
  const networkExists = async () => (await runDocker(['network', 'inspect', DOCKER_NETWORK])).code === 0
  
  if (await networkExists()) {
    return true
  }
  
  console.log(`Creating Docker network: ${DOCKER_NETWORK}`)
  const { code, stderr } = await runDocker(['network', 'create', DOCKER_NETWORK])
  // Creation can also fail because a concurrent session has just created it
  if (code === 0 || await networkExists()) {
    return true
  }
  
  console.error(`Failed to create Docker network ${DOCKER_NETWORK}:`, stderr)
  return false
}

// Don't leave scenario containers running when the server stops
async function shutdown(signal: string) {
  console.log(`Received ${signal}, removing ${sessions.size} scenario container(s)`)
  await Promise.all(Array.from(sessions.keys()).map(cleanupSession))
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

const PORT = process.env.PORT || 3001

// Build scenario images on startup
async function buildScenarioImages() {
  console.log('Building scenario images...')
  try {
    const buildProcess = spawn('make', ['scenario-build'], { cwd: '..' })
    
    await new Promise((resolve, reject) => {
      buildProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('Scenario images built successfully')
          resolve(null)
        } else {
          console.log('Scenario image build failed, will build on demand')
          resolve(null) // Don't fail startup if images can't be built
        }
      })
      buildProcess.on('error', (error) => {
        console.log('Scenario image build error, will build on demand:', error.message)
        resolve(null) // Don't fail startup
      })
    })
  } catch (error) {
    console.log('Scenario image build error, will build on demand:', error)
  }
}

// Initialize server with optional Docker checks
async function initializeServer() {
  console.log('Starting DevOps Dojo server...')
  
  const dockerAvailable = await checkDockerDaemon()
  
  if (dockerAvailable) {
    console.log('Docker daemon is accessible - scenario support enabled')
    await ensureDockerNetwork()
    
    // Build scenario images in background
    buildScenarioImages().catch(error => {
      console.log('Background scenario build failed:', error.message)
    })
  } else {
    console.log('Docker daemon not available - running in demo mode (no scenarios)')
    console.log('Frontend will work, but Docker scenarios will be unavailable')
  }
  
  server.listen(PORT, () => {
    console.log(`DevOps Dojo server running on port ${PORT}`)
    if (!dockerAvailable) {
      console.log('Note: Running in demo mode - Docker scenarios disabled')
    }
  })
}

// Start the server
initializeServer().catch((error) => {
  console.error('Failed to initialize server:', error)
  process.exit(1)
})