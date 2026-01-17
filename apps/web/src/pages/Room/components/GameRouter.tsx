import { reatomComponent } from '@reatom/react'
import { Loader2 } from 'lucide-react'

import { roomDataAtom } from '@/models/room.model'
import { AnimeSelectingPage } from '../AnimeSelect/AnimeSelectingPage'
import { Lobby } from './Lobby'

export const GameRouter = reatomComponent(() => {
  const roomState = roomDataAtom()

  if (!roomState) {
    return (
      <div className="container mx-auto min-h-screen p-4 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse">Подключение к комнате...</p>
      </div>
    )
  }

  // Debug - remove in production or keep for dev
  console.log('[GameRouter] Status:', roomState.status)

  switch (roomState.status) {
    case 'WAITING':
    case 'READY':
      return (
        <div className="container mx-auto min-h-screen p-4 flex justify-center items-center">
          <Lobby />
        </div>
      )

    case 'SELECTING':
      return (
        <AnimeSelectingPage /> // TODO: Add Selecting component
      )

    case 'SWIPING':
      return (
        <div className="container mx-auto min-h-screen p-4 flex justify-center items-center">
          <div>
            <h2>Swiping Stage</h2>
            {/* TODO: Add Swiping Component */}
          </div>
        </div>
      )

    case 'MATCHED':
      return (
        <div className="container mx-auto min-h-screen p-4 flex justify-center items-center">
          <div>
            <h2>Matched!</h2>
            {/* TODO: Add Match Component */}
          </div>
        </div>
      )

    default:
      return <div>Unknown state</div>
  }
}, 'GameRouter')
