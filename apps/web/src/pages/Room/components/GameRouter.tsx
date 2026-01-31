import { reatomComponent } from '@reatom/react'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { roomDataAtom } from '@/models/room.model'
import { AnimeSelectingPage } from '../AnimeSelect/AnimeSelectingPage'
import { MatchedPage } from '../Matched/MatchedPage'
import { ReadyPage } from '../Ready/ReadyPage'
import { SwipingPage } from '../Swiping/SwipingPage'
import { Lobby } from './Lobby'

export const GameRouter = reatomComponent(() => {
  const roomState = roomDataAtom()
  const [showReadyAnimation, setShowReadyAnimation] = useState(false)
  const previousStatusRef = useRef<string | null>(null)

  useEffect(() => {
    // Show 3-second animation when transitioning from SELECTING to SWIPING
    if (roomState?.status === 'SWIPING' && previousStatusRef.current === 'SELECTING') {
      setShowReadyAnimation(true)
      const timer = setTimeout(() => setShowReadyAnimation(false), 3000)
      return () => clearTimeout(timer)
    }
    previousStatusRef.current = roomState?.status ?? null
  }, [roomState?.status])

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
      if (showReadyAnimation) {
        return <ReadyPage />
      }
      return <SwipingPage />

    case 'MATCHED':
      return <MatchedPage />
    default:
      return <div>Unknown state</div>
  }
}, 'GameRouter')
