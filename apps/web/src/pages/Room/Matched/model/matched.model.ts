import type { MatchedRoomState, MatchFoundData } from '@netflix-tinder/shared'

import { action, atom, effect, withAsync } from '@reatom/core'
import { roomDataAtom } from '@/models/room.model'
import { api } from '../../AnimeSelect/animeSelect.model'
import { foundedMatchAtom } from '../../Swiping/model/swipingPage.model'

export const isLoadingAtom = atom(false, 'isMatchedLoadingAtom')
export const matchedMediaDataAtom = atom<MatchFoundData | null>(null, 'metchedMediaDataAtom')

const initMatchedAction = action(async () => {
  if (foundedMatchAtom()) {
    matchedMediaDataAtom.set(foundedMatchAtom())
    return
  }
  const roomData = roomDataAtom() as MatchedRoomState
  if (!roomData)
    return
  isLoadingAtom.set(true)

  const response = await api.get(`/media/${roomData.matchId}`)
  matchedMediaDataAtom.set(response.data)
  isLoadingAtom.set(false)
}, 'initMatchedAction').extend(withAsync())

effect(() => {
  const roomData = roomDataAtom()
  if (roomData?.status === 'MATCHED') {
    initMatchedAction()
  }
}, 'initSwipingEffect')
