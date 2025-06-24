import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { spawn, ChildProcess } from 'child_process'
import cors from 'cors'

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
  
  // Start a new container for this scenario
  startScenarioContainer(socket, scenarioId)
  
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

function startScenarioContainer(socket: any, scenarioId: string) {
  // Map scenario IDs to Docker images
  const scenarioImages: Record<string, string> = {
    'k8s-crashloop': 'devopslearn/scenario-keycloak-crashloop',
    'tf-drift': 'devopslearn/scenario-terraform-drift',
    'rds-failure': 'devopslearn/scenario-rds-failure',
    // Add more scenarios here
  }
  
  const imageName = scenarioImages[scenarioId] || 'devopslearn/scenario-base'
  
  // Start Docker container with TTY
  const dockerProcess = spawn('docker', [
    'run',
    '-it',
    '--rm',
    '--name', `devops-dojo-${socket.id}`,
    '--network', 'devops-dojo-net',
    imageName
  ], {
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
    socket.emit('output', data.toString())
  })
  
  dockerProcess.on('exit', (code) => {
    socket.emit('output', `\\r\\nContainer exited with code ${code}\\r\\n`)
    sessions.delete(socket.id)
  })
  
  // Notify client that scenario is ready
  setTimeout(() => {
    socket.emit('scenario-ready')
  }, 2000)
}

function cleanupSession(socketId: string) {
  const session = sessions.get(socketId)
  if (session) {
    // Kill the Docker container
    spawn('docker', ['kill', session.containerId])
    sessions.delete(socketId)
  }
}

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`DevOps Dojo server running on port ${PORT}`)
})