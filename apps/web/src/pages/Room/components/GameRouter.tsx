import { reatomComponent } from '@reatom/react'
import { roomDataAtom } from '@/models/room.model'
import { Lobby } from './Lobby'

export const GameRouter = reatomComponent(() => {
  const roomState = roomDataAtom()

  if (!roomState) {
    return <div>Загрузка...</div>
  }
  // Debug - remove in production or keep for dev
  console.log('[GameRouter] Status:', roomState.status)
  switch (roomState.status) {
    case 'WAITING':
      return <Lobby />
    case 'SELECTING':
      return (
        <>
          <div>SELECTING</div>
          <div>
            Selected Anime:
            {' '}
            {roomState.selectedAnime?.length && roomState.selectedAnime}
          </div>
        </>
        // TODO: Add Selecting component
      )
    default:
      return <div>Unknown state</div>
  }
}, 'GameRouter')
