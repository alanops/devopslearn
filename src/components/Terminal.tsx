import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import io, { Socket } from 'socket.io-client'

interface TerminalComponentProps {
  scenarioId: string
}

export default function TerminalComponent({ scenarioId }: TerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminal = useRef<Terminal | null>(null)
  const socket = useRef<Socket | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    // Initialize terminal
    terminal.current = new Terminal({
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        cursor: '#a9b1d6',
        black: '#32344a',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#ad8ee6',
        cyan: '#449dab',
        white: '#787c99',
        brightBlack: '#444b6a',
        brightRed: '#ff7a93',
        brightGreen: '#b9f27c',
        brightYellow: '#ff9e64',
        brightBlue: '#7da6ff',
        brightMagenta: '#bb9af7',
        brightCyan: '#0db9d7',
        brightWhite: '#acb0d0',
      },
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      cursorBlink: true,
    })

    // Initialize addons
    fitAddon.current = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    
    terminal.current.loadAddon(fitAddon.current)
    terminal.current.loadAddon(webLinksAddon)
    
    terminal.current.open(terminalRef.current)
    fitAddon.current.fit()

    // Connect to backend WebSocket
    socket.current = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      query: { scenarioId }
    })

    // Handle socket events
    socket.current.on('connect', () => {
      terminal.current?.writeln('Connected to DevOps Dojo environment...')
      terminal.current?.writeln(`Loading scenario: ${scenarioId}`)
      terminal.current?.writeln('')
    })

    socket.current.on('output', (data: string) => {
      terminal.current?.write(data)
    })

    socket.current.on('scenario-ready', () => {
      terminal.current?.writeln('Scenario environment ready!')
      terminal.current?.writeln('Type "help" for available commands')
      terminal.current?.writeln('')
      terminal.current?.write('$ ')
    })

    // Handle terminal input
    terminal.current.onData((data) => {
      socket.current?.emit('input', data)
    })

    // Handle window resize
    const handleResize = () => {
      fitAddon.current?.fit()
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      socket.current?.disconnect()
      terminal.current?.dispose()
    }
  }, [scenarioId])

  return (
    <div className="w-full h-full p-4 bg-terminal-bg">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  )
}