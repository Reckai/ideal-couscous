import type { Media } from './types/media'
import { action, atom, effect, sleep, withAsync, wrap } from '@reatom/core'
import axios from 'axios'
import { roomDataAtom } from '@/models/room.model'

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api',
})

export const animeListAtom = atom<Media[]>([], 'animeListAtom')
export const selectedAnimeListAtom = atom<Media[]>([], 'selectedAnimeList')
export const paginationAtom = atom<{ hasMore: boolean, nextCursor?: string } | null>(null)

export const searchQueryAtom = atom<string>('')
export const debouncedSearchQueryAtom = atom<string | null>(null)

export const isLoadingInitialAtom = atom<boolean>(false)
export const isLoadingMoreAtom = atom<boolean>(false)
export const hasInitialFetchedAtom = atom<boolean>(false)
export const toggleAnimeSelectionAction = action((media: Media) => {
  const currentSelected = selectedAnimeListAtom()
  const isSelected = currentSelected.some((item) => item.id === media.id)

  if (isSelected) {
    selectedAnimeListAtom.set(currentSelected.filter((item) => item.id !== media.id))
  } else {
    selectedAnimeListAtom.set([...currentSelected, media])
  }
}, 'toggleAnimeSelectionAction')

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
  paginationAtom.set(response.data.pagination)
  console.log('Fetched anime:', response.data)
  if (append) {
    animeListAtom.set((state) => {
      return [...state, ...response.data.data,
      ]
    })
  } else {
    animeListAtom.set(response.data.data)
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
  selectedAnimeListAtom.set(response.data)
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
}, 'clearEffect')
