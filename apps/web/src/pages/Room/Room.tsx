import { reatomComponent } from '@reatom/react'
import { useParams } from 'react-router-dom'

import { roomIdAtom } from '@/models/room.model'
import { GameRouter } from './components/GameRouter'

const Room = reatomComponent(() => {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const currentRoomId = roomIdAtom()

  if (inviteCode && inviteCode !== currentRoomId) {
    roomIdAtom.set(inviteCode)
  }

  return (
    <div className="container mx-auto min-h-screen relative p-4 flex justify-center items-center">
      <GameRouter />
    </div>
  )
}, 'Room')

export default Room
