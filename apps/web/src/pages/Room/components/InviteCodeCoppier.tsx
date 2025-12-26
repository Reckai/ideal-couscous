import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { roomIdAtom } from '@/models/room.model'

export function InviteCodeCoppier() {
  const currentRoomId = roomIdAtom()
  const [hasCopied, setHasCopied] = useState(false)
  return (
    <div>
      <div className="flex flex-col gap-2 mb-6">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Код приглашения
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center text-muted-foreground">
            {currentRoomId}
          </div>
          <Button
            size="icon"
            variant="outline"
            className="shrink-0"
            onClick={() => {
              if (!currentRoomId)
                return
              navigator.clipboard.writeText(currentRoomId)
              setHasCopied(true)
              setTimeout(() => setHasCopied(false), 2000)
            }}
          >
            {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

    </div>
  )
}
