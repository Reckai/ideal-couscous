import { wrap } from '@reatom/core'
import { reatomComponent } from '@reatom/react'
import { LogOut, Users } from 'lucide-react'

import { useParams } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import { isHost, leaveRoomAction, roomDataAtom, roomIdAtom } from '@/models/room.model'
import { InviteCodeCoppier } from './components/InviteCodeCoppier'
import { StartGameButton } from './components/StartGameButton'

const Room = reatomComponent(() => {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const roomState = roomDataAtom()
  const currentRoomId = roomIdAtom()
  const leaveRoomPending = leaveRoomAction.pending() > 0

  if (inviteCode && inviteCode !== currentRoomId) {
    roomIdAtom.set(inviteCode)
  }

  // Navigate when roomId becomes null after leaving

  const handleLeaveRoom = wrap(async () => {
    try {
      const response = await wrap(leaveRoomAction())
      console.log(response)
    } catch (error) {
      console.log(error)
    }
  })
  console.log(roomState)
  return (
    <div className="container mx-auto min-h-screen relative p-4">

      <div className="min-h-screen flex justify-center items-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Комната</CardTitle>
                <CardDescription>Список активных участников</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1 gap-2">
                  <Users size={16} />
                  {roomState?.usersCount ?? 0}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  disabled={leaveRoomPending}
                  onClick={handleLeaveRoom}
                  title="Leave Room"
                >
                  <LogOut size={20} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 flex flex-col gap-6">
            {/* Invite Code Section */}
            {isHost() && <InviteCodeCoppier />}
            <ScrollArea className=" w-full pr-4">
              {
                roomState?.users
                && roomState.users.length > 0
                  ? (
                      <div className="flex flex-col gap-3">
                        {roomState.users.map((user) => (
                          <div
                            key={user.userId}
                            className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                          >
                            <Avatar className="h-10 w-10">
                              {/* Если есть аватарка URL, можно добавить <AvatarImage src={...} /> */}
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {user.nickName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col">
                              <span className="font-medium text-sm leading-none">
                                {user.nickName}
                              </span>
                              {/* Пример отображения ID пользователя мелким шрифтом, если нужно */}
                              <span className="text-xs text-muted-foreground mt-1">
                                ID:
                                {' '}
                                {user.userId.slice(0, 8)}
                                ...
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                        <Users className="h-10 w-10 mb-2 opacity-20" />
                        <p>Ожидание участников...</p>
                      </div>
                    )
              }
            </ScrollArea>

            {isHost() && roomState?.usersCount === 2 && <StartGameButton />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}, 'Room')

export default Room
