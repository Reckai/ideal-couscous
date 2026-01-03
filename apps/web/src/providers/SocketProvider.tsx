import type { TypedSocket } from '@/providers/socket'
import React, { createContext, use, useEffect, useState } from 'react'
import { socket } from '@/providers/socket'

interface SocketContextType {
  socket: TypedSocket | null
  isConnected: boolean
  connectionError: Error | null
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
})

export function useSocket() {
  const context = use(SocketContext)
  if (context === undefined) {
    throw new Error('\'useSocket must be used within a SocketProvider')
  }
  return context
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<Error | null>(null)

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true)
      setConnectionError(null)
    }

    const onDisconnect = () => {
      setIsConnected(false)
    }
    const onConnectionError = (error: Error) => {
      setIsConnected(false)
      setConnectionError(error)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectionError)

    socket.on('connect_error', onConnectionError)

    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
      if (match) {
        try {
          return JSON.parse(decodeURIComponent(match[2])).data
        } catch (e) {
          console.error('Failed to parse cookie', e)
          return null
        }
      }
      return null
    }

    const userId = getCookie('user-session')
    if (userId) {
      socket.auth = { userId }
    }

    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.disconnect()
    }
  }, [])

  return (
    <SocketContext value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext>
  )
}
