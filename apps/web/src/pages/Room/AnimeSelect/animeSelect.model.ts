import type { Media } from './types/media'
import { action, atom, effect, getCalls, sleep, withAsync, wrap } from '@reatom/core'
import axios from 'axios'
import { toast } from 'sonner'
import { roomDataAtom, userReadyChanged } from '@/models/room.model'
import { socket } from '@/providers/socket'

function getBaseUrl() {
  let url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api'
  if (!url.startsWith('http')) {
    url = `https://${url}`
  }
  return url
}

export const api = axios.create({
  baseURL: getBaseUrl(),
})

export const animeListAtom = atom<Media[]>([], 'animeListAtom')
export const selectedAnimeListAtom = atom<Media[]>([], 'selectedAnimeList')
export const paginationAtom = atom<{ hasMore: boolean, nextCursor?: string } | null>(null)

export const searchQueryAtom = atom<string>('')
export const debouncedSearchQueryAtom = atom<string | null>(null)

export const isLoadingInitialAtom = atom<boolean>(false)
export const isLoadingMoreAtom = atom<boolean>(false)
export const hasInitialFetchedAtom = atom<boolean>(false)
export const isReadyAtom = atom<boolean>(false, 'isReadyAtom')
export const isSettingReadyAtom = atom<boolean>(false, 'isSettingReadyAtom')
export const otherUserReadyAtom = atom<boolean>(false, 'otherUserReadyAtom')
export const toggleAnimeSelectionAction = action(async (media: Media) => {
  const currentSelected = selectedAnimeListAtom()
  const isSelected = currentSelected.some((item) => item.id === media.id)

  if (isSelected) {
    const response = await socket.emitWithAck('remove_media_from_draft', { mediaId: media.id })
    if (response.success) {
      selectedAnimeListAtom.set(currentSelected.filter((item) => item.id !== media.id))
    } else {
      toast('Something went wrong')
    }
  } else {
    const response = await socket.emitWithAck('add_anime', { mediaId: media.id })
    if (response.success) {
      selectedAnimeListAtom.set([...currentSelected, media])
    } else {
      toast('Something went wrong')
    }
  }
}, 'toggleAnimeSelectionAction').extend(withAsync())

export const setReadyAction = action(async () => {
  const currentReady = isReadyAtom()
  const newReady = !currentReady

  isSettingReadyAtom.set(true)
  const response = await wrap(socket.emitWithAck('set_ready', { isReady: newReady }))
  isSettingReadyAtom.set(false)

  if (response.success) {
    isReadyAtom.set(newReady)
  } else {
    toast(response.error?.message || 'Failed to set ready status')
  }
}, 'setReadyAction').extend(withAsync())

export const fetchAnimeListAction = action(async (append: boolean, cursor?: string, search?: string) => {
  const roomData = roomDataAtom()

  if (roomData?.status !== 'SELECTING') {
    console.log('Room status is not SELECTING, skipping fetch')
    return
  }
  if (append) {
    isLoadingMoreAtom.set(true)
  } else {
    isLoadingInitialAtom.set(true)
  }
  const response = await wrap(api.get('/media', {
    params: { limit: 20, cursor, search },
  }))
  const payload = response.data.data
  paginationAtom.set(payload.pagination)
  console.log('Fetched anime:', payload)
  if (append) {
    animeListAtom.set([...animeListAtom(), ...payload.data])
  } else {
    animeListAtom.set(payload.data)
  }
  isLoadingInitialAtom.set(false)
  isLoadingMoreAtom.set(false)
  return response.data
}, 'fetchAnimeAction').extend(withAsync())

export const fetchSelectedAnimeList = action(async () => {
  const roomData = roomDataAtom()

  if (roomData?.status !== 'SELECTING') {
    console.log('Room status is not SELECTING, skipping fetch')
    return
  }
  if (roomData.selectedAnime.length === 0) {
    return
  }
  const selectedAnime = roomData.selectedAnime
  const response = await wrap(api.post('/media/batch', {
    ids: selectedAnime,
  }))
  selectedAnimeListAtom.set(response.data.data)
}, 'fetchSelectedAnimeList').extend(withAsync())

export const loadMoreAnimeAction = action((search: string) => {
  const pagination = paginationAtom()
  if (!pagination?.hasMore || !paginationAtom()?.nextCursor)
    return

  fetchAnimeListAction(true, pagination.nextCursor!, search)
}, 'loadMoreAnimeAction')

export const updateSearchQueryAction = action((query: string) => {
  searchQueryAtom.set(query)
}, 'updateSearchQueryAction')
effect(() => {
  if (roomDataAtom()?.status === 'SELECTING' && !hasInitialFetchedAtom())
    fetchAnimeListAction(false, undefined, undefined)
  fetchSelectedAnimeList()
  hasInitialFetchedAtom.set(true)
}, 'initializingEffect')

effect(async () => {
  const searchString = searchQueryAtom()
  if (searchString.trim().length > 3) {
    await wrap(sleep(300))
  }

  debouncedSearchQueryAtom.set(searchString)
}, 'debounceEfffect')

effect(async () => {
  if (!hasInitialFetchedAtom())
    return
  const debouncedSearchString = debouncedSearchQueryAtom()
  if (debouncedSearchString === null)
    return
  animeListAtom.set([])
  fetchAnimeListAction(false, undefined, debouncedSearchString)
}, 'searchEffect')
effect(() => {
  if (roomDataAtom()?.status === 'SELECTING')
    return
  animeListAtom.set([])
  selectedAnimeListAtom.set([])
  paginationAtom.set(null)
  isLoadingInitialAtom.set(false)
  isLoadingMoreAtom.set(false)
  hasInitialFetchedAtom.set(false)
  searchQueryAtom.set('')
  debouncedSearchQueryAtom.set('')
  isReadyAtom.set(false)
  isSettingReadyAtom.set(false)
  otherUserReadyAtom.set(false)
}, 'clearEffect')

effect(() => {
  getCalls(userReadyChanged).forEach(({ payload }) => {
    otherUserReadyAtom.set(payload.isReady)
  })
}, 'handleUserReadyChangedEffect')
