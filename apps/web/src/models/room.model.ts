import type { RoomData, UserDTO } from '@netflix-tinder/shared'
import { action, atom, effect, withAsync, withLocalStorage, wrap } from '@reatom/core'

import { socket } from '@/providers/socket'
import { router } from '@/router'

export const roomIdAtom = atom<string | null>(null, 'roomIdAtom').extend(
  withLocalStorage('room-id'),
)

export const roomDataAtom = atom<RoomData | null>(null, 'roomDataAtom')

export const errorAtom = atom<string | null>(null, 'errorAtom')
export const isPendingAtom = atom(false, 'isPendingAtom')

// Effect to manage WebSocket connection and events based on roomId
// Must be called within the app's Reatom context (after context.start())
export function initRoomEffect() {
  effect(() => {
    const roomId = roomIdAtom()

    if (!roomId) {
      roomDataAtom.set(null)
      return
    }

    // Event Handlers
    const handleUserJoined = wrap((data: UserDTO & { usersCount: number }) => {
      const current = roomDataAtom()
      if (current) {
        roomDataAtom.set({
          ...current,
          users: [...current.users.filter((u) => u.userId !== data.userId), data],
          usersCount: data.usersCount,
        })
      }
    })

    const handleUserLeft = wrap((data: { userId: string }) => {
      const current = roomDataAtom()
      if (current) {
        const updatedUsers = current.users.filter((u) => u.userId !== data.userId)
        roomDataAtom.set({
          ...current,
          users: updatedUsers,
          usersCount: updatedUsers.length,
        })
      }
    })

    const join = async () => {
      const response = await wrap(socket.emitWithAck('join_room', { roomId }))

      if (response.success) {
        console.log('[join] Setting roomData to:', response.data)
        roomDataAtom.set(response.data)
      } else {
        errorAtom.set(response.error?.message || 'Failed to join')
      }
    }

    socket.on('user_joined', handleUserJoined)
    socket.on('user_left', handleUserLeft)
    socket.on('connect', wrap(join))

    if (socket.connected) {
      join()
    }

    return () => {
      socket.off('user_joined', handleUserJoined)
      socket.off('user_left', handleUserLeft)
      socket.off('connect', join)
    }
  })
}

// Actions to Create/Join room (initiate the flow)
export const createRoomAction = action(async () => {
  console.log('[createRoomAction] Starting...')
  errorAtom.set(null)

  const response = await wrap(socket.emitWithAck('create_room'))

  console.log('[createRoomAction] Response:', response)
  if (response.success) {
    console.log('[createRoomAction] Setting roomId to:', response.data.inviteCode)
    roomIdAtom.set(response.data.inviteCode)
    console.log('[createRoomAction] Setting roomData to:', response.data)
    roomDataAtom.set(response.data)
    router.navigate(`/room/${response.data.inviteCode}`)
  } else {
    const error = response.error.message
    errorAtom.set(error)
    throw new Error(error)
  }
}, 'createRoomAction').extend(withAsync())

export const joinRoomAction = action(async (inviteCode: string) => {
  console.log('[joinRoomAction] Starting with code:', inviteCode)
  errorAtom.set(null)

  const response = await wrap(socket.emitWithAck('join_room', { roomId: inviteCode }))

  console.log('[joinRoomAction] Response:', response)
  if (response.success) {
    roomIdAtom.set(inviteCode)
    console.log('[joinRoomAction] Setting roomId to:', response.data.inviteCode)

    roomDataAtom.set(response.data)
    return response.data
  } else {
    const error = response.error.message
    errorAtom.set(error)
    throw new Error(error)
  }
}, 'joinRoomAction').extend(withAsync())

export const leaveRoomAction = action(async () => {
  console.log('[leaveRoomAction] Starting...')
  errorAtom.set(null)
  const roomId = roomIdAtom()
  if (!roomId) {
    errorAtom.set('No room ID found')
    console.log('[leaveRoomAction] No room ID found')
    return { shouldRedirect: false }
  }
  const response = await wrap(socket.emitWithAck('leave_room', { roomId }))

  console.log('[leaveRoomAction] Response:', response)
  if (response.success || response.error?.code === 'NOT_IN_ROOM') {
    // Clear state for both success and NOT_IN_ROOM
    roomIdAtom.set(null)
    roomDataAtom.set(null)
    return router.navigate('/room')
  }

  const errorMessage = response.error.message
  errorAtom.set(errorMessage)
  throw new Error(errorMessage)
}, 'leaveRoomAction').extend(withAsync())
