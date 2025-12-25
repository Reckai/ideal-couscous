// This hook is no longer needed with reatomComponent.
// Components can directly read atoms and call actions.
// Kept for backwards compatibility, but consider removing.

import { useNavigate } from 'react-router-dom'
import { createRoomAction, joinRoomAction } from '@/models/room.model'

export function useRoomConnection() {
  const navigate = useNavigate()

  return {
    createRoom: createRoomAction,
    joinRoom: joinRoomAction,
    navigate,
  }
}
