import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { spawn, ChildProcess } from 'child_process'
import cors from 'cors'
import path from 'path'

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

// API endpoint to check server health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', sessions: sessions.size })
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)
  
  const scenarioId = socket.handshake.query.scenarioId as string
  
  if (!scenarioId) {
    socket.emit('output', '\\r\\nError: No scenario ID provided\\r\\n')
    socket.disconnect()
    return
  }
  
  console.log(`Starting scenario '${scenarioId}' for socket ${socket.id}`)
  
  // Start a new container for this scenario
  startScenarioContainer(socket, scenarioId).catch((error) => {
    console.error(`Failed to start scenario ${scenarioId}:`, error)
    socket.emit('output', `\\r\\nError: Failed to start scenario: ${error.message}\\r\\n`)
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

async function checkDockerImage(imageName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const checkImage = spawn('docker', ['image', 'inspect', imageName])
    checkImage.on('exit', (code) => {
      resolve(code === 0)
    })
  })
}

async function startScenarioContainer(socket: any, scenarioId: string) {
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
    socket.emit('output', `\r\nError: Docker image '${imageName}' not found.\r\n`)
    socket.emit('output', `Please run 'make scenario-build' to build the scenario images.\r\n`)
    socket.emit('output', `\r\nDisconnecting...\r\n`)
    socket.disconnect()
    return
  }
  
  // Build Docker run arguments
  const args = [
    'run',
    '-it',
    '--rm',
    '--name', `devops-dojo-${socket.id}`,
    '--network', 'devops-dojo-net',
  ]
  
  // Mount Docker socket for Kubernetes scenarios that need it
  const k8sScenarios = ['k8s-crashloop', 'k8s-dns', 'k8s-istio']
  if (k8sScenarios.includes(scenarioId)) {
    args.push('-v', '/var/run/docker.sock:/var/run/docker.sock')
  }
  
  args.push(imageName)
  
  // Start Docker container with TTY
  const dockerProcess = spawn('docker', args, {
    env: { ...process.env, TERM: 'xterm-256color' }
  })
  
  // Store session
  sessions.set(socket.id, {
    containerId: `devops-dojo-${socket.id}`,
    process: dockerProcess,
    scenarioId
  })
  
  // Handle Docker output
  dockerProcess.stdout.on('data', (data) => {
    socket.emit('output', data.toString())
  })
  
  dockerProcess.stderr.on('data', (data) => {
    const errorMessage = data.toString()
    console.error(`Container ${scenarioId} stderr:`, errorMessage)
    socket.emit('output', errorMessage)
  })
  
  dockerProcess.on('error', (error) => {
    console.error(`Failed to start container for scenario ${scenarioId}:`, error)
    socket.emit('output', `\\r\\nError: Failed to start container: ${error.message}\\r\\n`)
    sessions.delete(socket.id)
  })
  
  dockerProcess.on('exit', (code) => {
    console.log(`Container for scenario ${scenarioId} exited with code ${code}`)
    socket.emit('output', `\\r\\nContainer exited with code ${code}\\r\\n`)
    sessions.delete(socket.id)
  })
  
  // Notify client that scenario is ready after a short delay
  // TODO: Replace with actual readiness check
  setTimeout(() => {
    // Check if container is still running
    if (sessions.has(socket.id)) {
      socket.emit('scenario-ready')
      console.log(`Scenario ${scenarioId} is ready for socket ${socket.id}`)
    }
  }, 2000)
}

function cleanupSession(socketId: string) {
  const session = sessions.get(socketId)
  if (session) {
    console.log(`Cleaning up session for ${socketId}, scenario: ${session.scenarioId}`)
    // Kill the Docker container
    const killProcess = spawn('docker', ['kill', session.containerId])
    killProcess.on('error', (error) => {
      console.error(`Error killing container ${session.containerId}:`, error)
    })
    sessions.delete(socketId)
  }
}

// Check if Docker daemon is accessible
async function checkDockerDaemon(): Promise<boolean> {
  return new Promise((resolve) => {
    const checkDocker = spawn('docker', ['version'])
    checkDocker.on('exit', (code) => {
      resolve(code === 0)
    })
    checkDocker.on('error', () => {
      resolve(false)
    })
  })
}

// Ensure Docker network exists
async function ensureDockerNetwork() {
  try {
    // Check if network exists
    const checkNetwork = spawn('docker', ['network', 'inspect', 'devops-dojo-net'])
    
    await new Promise((resolve) => {
      checkNetwork.on('exit', (code) => {
        if (code !== 0) {
          // Network doesn't exist, create it
          console.log('Creating Docker network: devops-dojo-net')
          const createNetwork = spawn('docker', ['network', 'create', 'devops-dojo-net'])
          createNetwork.on('exit', (createCode) => {
            if (createCode === 0) {
              console.log('Docker network created successfully')
            } else {
              console.error('Failed to create Docker network')
            }
            resolve(null)
          })
        } else {
          console.log('Docker network already exists')
          resolve(null)
        }
      })
    })
  } catch (error) {
    console.error('Error checking/creating Docker network:', error)
  }
}

const PORT = process.env.PORT || 3001

// Initialize server with Docker checks
async function initializeServer() {
  console.log('Checking Docker daemon...')
  const dockerAvailable = await checkDockerDaemon()
  
  if (!dockerAvailable) {
    console.error('Error: Docker daemon is not accessible')
    console.error('Please ensure Docker is installed and running')
    process.exit(1)
  }
  
  console.log('Docker daemon is accessible')
  
  await ensureDockerNetwork()
  
  server.listen(PORT, () => {
    console.log(`DevOps Dojo server running on port ${PORT}`)
  })
}

// Start the server
initializeServer().catch((error) => {
  console.error('Failed to initialize server:', error)
  process.exit(1)
})