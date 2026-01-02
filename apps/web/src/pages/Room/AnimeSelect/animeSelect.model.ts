import type { MediaListResponse } from './types/media'
import { action, atom, withAsync, wrap } from '@reatom/core'
import axios from 'axios'
import { roomDataAtom } from '@/models/room.model'

// API client with Vite env variable
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api',
})

// Atom for storing fetched anime list
export const animeListAtom = atom<MediaListResponse | null>(null, 'animeListAtom')

// Action for fetching anime
export const fetchAnimeAction = action(async () => {
  const roomData = roomDataAtom()

  if (roomData?.status !== 'SELECTING') {
    console.log('Room status is not SELECTING, skipping fetch')
    return
  }

  const response = await wrap(api.get('/media', {
    params: { limit: 20 },
  }))

  console.log('Fetched anime:', response.data)
  animeListAtom.set(response.data)

  return response.data
}, 'fetchAnimeAction').extend(withAsync())
