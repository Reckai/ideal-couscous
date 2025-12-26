import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function StartGameButton() {
  return (
    <Button className="w-full" size="lg">
      <Play className="mr-2 h-4 w-4" />
      Играть
    </Button>
  )
}
