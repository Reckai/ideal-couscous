import { wrap } from '@reatom/core'
import { reatomComponent } from '@reatom/react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { changeStatusToSelecting } from '@/models/room.model'

export const StartGameButton = reatomComponent(() => {
  const isPending = changeStatusToSelecting.pending() > 0
  const handleLeaveRoom = wrap(async () => {
    try {
      const response = await wrap(changeStatusToSelecting())
      console.log(response)
    } catch (error) {
      console.log(error)
    }
  })
  return (
    <Button onClick={handleLeaveRoom} disabled={isPending} className="w-full" size="lg">
      <Play className="mr-2 h-4 w-4" />
      Играть
    </Button>
  )
}, 'StartGameButton')
