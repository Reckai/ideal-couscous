import type { RoomData, UserDTO } from '@netflix-tinder/shared'
import { useEffect, useState } from 'react'
import { useSocket } from '@/providers/SocketProvider'

export function useRoomState(inviteCode: string) {
  const { socket, isConnected } = useSocket()
  const [roomState, setRoomState] = useState<RoomData | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected)
      return

    if (!roomState) {
      setIsPending(true)

      socket?.emit('join_room', { roomId: inviteCode }, (response) => {
        setIsPending(false)
        if (response.success) {
          setRoomState(response.data)
        } else {
          setError(response.error.message)
        }
      })
    }
  }, [isConnected])

  useEffect(() => {
    if (!socket || !isConnected)
      return
    const handleUserJoined = (data: UserDTO & { usersCount: number }) => {
      if (roomState && roomState.users[0])
        return
      setRoomState((prev) => {
        if (!prev)
          return prev
        return { ...prev, users: [...prev.users, data], usersCount: data.usersCount }
      })
    }
    const handleUserLeft = (data: { userId: string }) => {
      setRoomState((prev) => {
        if (!prev)
          return prev
        return { ...prev, users: prev.users.filter((user) => user.userId !== data.userId) }
      })
    }
    socket?.on('user_joined', handleUserJoined)
    socket?.on('user_left', handleUserLeft)

    return () => {
      socket?.off('user_joined', handleUserJoined)
      socket?.off('user_left', handleUserLeft)
    }
  }, [socket, isConnected])
  return {
    roomState,
    isPending,
    error,
  }
}
