'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useSocket } from '@/providers/SocketProvider'

export function useRoomConnection() {
  const { socket, isConnected } = useSocket()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const createRoom = () => {
    if (!isConnected)
      return
    setIsPending(true)
    setError(null)
    socket?.emit('create_room', (response) => {
      setIsPending(false)
      if (response.success) {
        router.push({
          pathname: '/room/[inviteCode]',
          params: { inviteCode: response.data.inviteCode },
        })
      } else {
        setError(response.error.message)
      }
    })
  }

  const joinRoom = (inviteCode: string) => {
    if (!isConnected)
      return
    setIsPending(true)
    setError(null)

    socket?.emit('join_room', { roomId: inviteCode }, (response) => {
      setIsPending(false)
      if (response.success) {
        router.push({
          pathname: '/room/[inviteCode]',
          params: { inviteCode: response.data.inviteCode },
        })
      } else {
        setError(response.error.message)
      }
    })
  }
  return {
    createRoom,
    joinRoom,
    isPending,
    isConnected,
    error,
  }
}
