import { animeListAtom, fetchAnimeAction } from './animeSelect.model'

export function AnimeSelectingPage() {
  fetchAnimeAction()
  return (
    <div>
      {
        animeListAtom() && animeListAtom()?.data[0].id
      }
    </div>
  )
}
