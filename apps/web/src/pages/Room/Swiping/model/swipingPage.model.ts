import type { MatchFoundData, SwipeAction } from '@netflix-tinder/shared'
import type { Media } from '../../AnimeSelect/types/media'
import { action, atom, effect, withAsync, withLocalStorage, wrap } from '@reatom/core'
import { roomDataAtom } from '@/models/room.model'
import { socket } from '@/providers/socket'
import { api } from '../../AnimeSelect/animeSelect.model'

export const BATCH_SIZE = 20
export const PREFETCH_THRESHOLD = 2
export const mediaDetailsAtom = atom<Media[]>([], 'mediaDetailsAtom')

export const currentMediaIndexAtom = atom(0, 'currentMediaIndex').extend(withLocalStorage('swipe-current-index'))
export const swipeRoomIdAtom = atom<string | null>(null, 'swipeRoomIdAtom')
  .extend(withLocalStorage('swipe-room-id'))
export const startIndexAtom = atom(0, 'startIndexAtom')
export const hasInitialFetchedAtom = atom(false, 'hasInitialFetchedAtom')
export const isLoadingAtom = atom(false, 'isLoadingAtom')
export const foundedMatchAtom = atom<MatchFoundData | null>(null, 'foundedMatch')
export const queueFinishedAtom = atom(false, 'queueFinishedAtom')

export const loadMediaBatchAction = action(async (ids: string[]) => {
  if (ids.length === 0)
    return
  isLoadingAtom.set(true)
  const response = await wrap(api.post('/media/batch', { ids }))
  mediaDetailsAtom.set([...mediaDetailsAtom(), ...response.data])
  isLoadingAtom.set(false)
}, 'loadMediaBatchAction').extend(withAsync())

export const initSwapAction = action(async () => {
  const roomData = roomDataAtom()
  if (!roomData || roomData.status !== 'SWIPING')
    return
  if (hasInitialFetchedAtom())
    return

  const savedRoomId = swipeRoomIdAtom()
  const currentRoomId = roomData.inviteCode
  if (savedRoomId !== currentRoomId) {
    currentMediaIndexAtom.set(0)
    swipeRoomIdAtom.set(currentRoomId)
  }
  const mediaQueue = roomData.mediaQueue
  const startIndex = currentMediaIndexAtom()

  startIndexAtom.set(startIndex)
  mediaDetailsAtom.set([])

  await loadMediaBatchAction(mediaQueue.slice(startIndex, startIndex + BATCH_SIZE))
  hasInitialFetchedAtom.set(true)
}, 'initSwipingAction').extend(withAsync())

export const swipeAction = action(async (action: SwipeAction) => {
  const roomData = roomDataAtom()

  if (!roomData || roomData.status !== 'SWIPING')
    return
  const currentMediaIndex = currentMediaIndexAtom()
  const mediaQueue = roomData.mediaQueue
  const startIndex = startIndexAtom()

  if (mediaQueue.length <= currentMediaIndex)
    return
  const localIndex = currentMediaIndex - startIndex
  const currentCard = mediaDetailsAtom()[localIndex]

  if (!currentCard || mediaQueue.length <= currentMediaIndex)
    return

  const mediaId = currentCard.id
  await wrap(socket.emitWithAck('swipe', { mediaId, action }))

  const newGlobalIndex = currentMediaIndex + 1
  currentMediaIndexAtom.set(newGlobalIndex)

  if (newGlobalIndex >= mediaQueue.length) {
    queueFinishedAtom.set(true)
    return
  }

  const loadedCount = mediaDetailsAtom().length
  const newLocalIndex = newGlobalIndex - startIndex
  const remaining = loadedCount - newLocalIndex

  if (remaining <= PREFETCH_THRESHOLD) {
    const nextBatchStart = startIndex + loadedCount
    const nextBatchIds = mediaQueue.slice(nextBatchStart, nextBatchStart + BATCH_SIZE)
    await loadMediaBatchAction(nextBatchIds)
  }
}, 'swipeAction').extend(withAsync())

effect(() => {
  const onMatchFound = (data: MatchFoundData) => {
    foundedMatchAtom.set(data)
  }
  socket.on('match_found', wrap(onMatchFound))
  return () => socket.off('match_found', onMatchFound)
}, 'matchFoundEffect')

effect(() => {
  const roomData = roomDataAtom()
  if (roomData?.status === 'SWIPING') {
    initSwapAction()
  }
}, 'initSwipingEffect')

effect(() => {
  if (roomDataAtom()?.status === 'SWIPING')
    return

  mediaDetailsAtom.set([])
  currentMediaIndexAtom.set(0)
  startIndexAtom.set(0)
  hasInitialFetchedAtom.set(false)
  isLoadingAtom.set(false)
  foundedMatchAtom.set(null)
  queueFinishedAtom.set(false)
}, 'clearSwipingEffect')
