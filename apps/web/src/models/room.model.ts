import type { ConnectionData, Error, RoomData, UserDTO } from '@netflix-tinder/shared'
import { action, atom, computed, effect, getCalls, take, withAsync, withCookieStore, withLocalStorage, wrap } from '@reatom/core'

import { socket } from '@/providers/socket'
import { router } from '@/router'

export const roomIdAtom = atom<string | null>(null, 'roomIdAtom').extend(
  withLocalStorage('room-id'),
)

export const roomDataAtom = atom<RoomData | null>(null, 'roomDataAtom')

export const errorAtom = atom<string | null>(null, 'errorAtom')
export const isPendingAtom = atom(false, 'isPendingAtom')

export const userIdAtom = atom<string | null>(null, 'userIdAtom').extend(
  withCookieStore({
    key: 'user-session',
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/',
  }),
)
const userJoined = action((payload: UserDTO & { usersCount: number }) => payload, 'userJoined')

const userLeft = action((payload: { userId: string }) => payload, 'userLeft')
const socketConnected = action((payload?: undefined) => payload, 'socketConnected')
const connectionEstablished = action((payload: ConnectionData) => payload, 'connectionEstablished')
const syncState = action((payload: RoomData) => payload, 'syncState')
const coonectError = action((payload: Error) => payload, 'coonectError')
export const userReadyChanged = action((payload: { userId: string, isReady: boolean }) => payload, 'userReadyChanged')
export const joinRoomAction = action(async (inviteCode: string) => {
  console.log('[joinRoomAction] Starting with code:', inviteCode)
  errorAtom.set(null)

  const response = await wrap(socket.emitWithAck('join_room', { roomId: inviteCode }))

  console.log('[joinRoomAction] Response:', response)
  if (response.success) {
    roomIdAtom.set(inviteCode)
    console.log('[joinRoomAction] Setting roomId to:', response.data.inviteCode)

    roomDataAtom.set(response.data)
    router.navigate(`/room/${inviteCode}`)
  } else {
    const error = response.error.message
    errorAtom.set(error)
    router.navigate(`/room`)
    throw new Error(error)
  }
}, 'joinRoomAction').extend(withAsync())

effect(() => {
  const onUserJoined = (data: UserDTO & { usersCount: number }) => userJoined(data)
  const onUserLeft = (data: { userId: string }) => userLeft(data)
  const onConnect = () => socketConnected()
  const onConnectionEstablished = (data: ConnectionData) => connectionEstablished(data)
  const onSyncState = (data: RoomData) => syncState(data)
  const onTryToJoin = () => joinRoomAction(roomIdAtom()!)
  const onConnectError = (data: Error) => coonectError(data)
  const onUserReadyChanged = (data: { userId: string, isReady: boolean }) => userReadyChanged(data)
  socket.on('user_joined', wrap(onUserJoined))
  socket.on('user_left', wrap(onUserLeft))
  socket.on('connect', wrap(onConnect))
  socket.on('connection_established', wrap(onConnectionEstablished))
  socket.on('sync_state', wrap(onSyncState))
  socket.on('try_to_join', onTryToJoin)
  socket.on('error_leave', onConnectError)
  socket.on('user_ready_changed', wrap(onUserReadyChanged))

  return () => {
    socket.off('user_joined', wrap(onUserJoined)) // Важно отписываться от той же ссылки, что и подписывались
    socket.off('user_left', wrap(onUserLeft))
    socket.off('connect', wrap(onConnect))
    socket.off('sync_state', wrap(onSyncState))
    socket.off('try_to_join', onTryToJoin)
    socket.off('error_leave', onConnectError)
    socket.off('user_ready_changed', wrap(onUserReadyChanged))
  }
}, 'socketEventHandlersEffect')

if (socket.connected) {
  socketConnected()
}

effect(async () => {
  console.log('asd')
  getCalls(syncState).forEach(({ payload: data }) => {
    console.log('[syncState] Received data:', data)
    roomDataAtom.set(data)
    roomIdAtom.set(data.inviteCode)
  })
}, 'handleSyncStateEffect')

effect(
  async () => {
    getCalls(userJoined).forEach(({ payload: data }) => {
      roomDataAtom.set((current) => {
        if (current) {
          return {
            ...current,
            users: [
              ...current.users.filter((u) => u.userId !== data.userId),
              data,
            ],
            usersCount: data.usersCount,
          }
        }
        return current // Или возвращаем null, если current был null
      })
    })
  },
  'handleUserJoinedEffect',
)

effect(
  async () => {
    getCalls(userLeft).forEach(({ payload: data }) => {
      roomDataAtom.set((current) => {
        if (current) {
          const updatedUsers = current.users.filter((u) => u.userId !== data.userId)
          return {
            ...current,
            users: updatedUsers,
            usersCount: updatedUsers.length,
          }
        }
        return current // Или возвращаем null, если current был null
      })
    })
  },
  'handleUserLeftEffect',
)
effect(async () => {
  getCalls(coonectError).forEach(({ payload: error }) => {
    roomDataAtom.set(null)
    roomIdAtom.set(null)
    errorAtom.set(error.message)
    router.navigate(`/room`)
  })
})

effect(async () => {
  const data = await wrap(take(connectionEstablished))
  console.log('[connectionEstablished] Setting userId to:', data)
  userIdAtom.set(data.userId)
  // Update socket auth for future reconnections
  socket.auth = { userId: data.userId }
}, 'handleConnectionEstablishedEffect')

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

export const isHost = computed(() => {
  const roomData = roomDataAtom()
  return roomData?.users.find((user) => user.userId === userIdAtom())?.isHost ?? false
})

export const changeStatusToSelecting = action(async () => {
  console.log('asd')
  const roomId = roomIdAtom()
  if (!roomId)
    return
  await wrap(socket.emitWithAck('start_selecting', { roomId }))
}, 'changeStatus').extend(withAsync())
