import { wrap } from '@reatom/core'
import { reatomComponent } from '@reatom/react'
import { Crown, LogOut, Users } from 'lucide-react' // 1. Добавили иконку Crown

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

import { isHost, leaveRoomAction, roomDataAtom } from '@/models/room.model'
import { InviteCodeCoppier } from './InviteCodeCoppier'
import { StartGameButton } from './StartGameButton'

export const Lobby = reatomComponent(() => {
  const roomState = roomDataAtom()
  const leaveRoomPending = leaveRoomAction.pending() > 0

  const handleLeaveRoom = wrap(async () => {
    try {
      const response = await wrap(leaveRoomAction())
      console.log(response)
    } catch (error) {
      console.log(error)
    }
  })

  return (
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
        {isHost() && <InviteCodeCoppier />}

        <ScrollArea className="w-full pr-4">
          {roomState?.users
            && roomState.users.length > 0
            ? (
                <div className="flex flex-col gap-3">
                  {roomState.users.map((user) => {
                    const isHostUser = roomState.users.filter((user) => user.isHost)[0]!.userId === user.userId

                    return (
                      <div
                        key={user.userId}
                        className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {user.nickName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* 3. Дополнительный индикатор (абсолютный) на аватаре, если нужно */}
                          {isHostUser && (
                            <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
                              <Crown size={12} className="text-yellow-500 fill-yellow-500" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm leading-none">
                              {user.nickName}
                            </span>
                            {/* 4. Явный индикатор рядом с именем */}
                            {isHostUser && (
                              <Crown
                                size={14}
                                className="text-yellow-500 fill-yellow-500/20"
                                aria-label="Host"
                              />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            ID:
                            {' '}
                            {user.userId.slice(0, 8)}
                            ...
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                  <Users className="h-10 w-10 mb-2 opacity-20" />
                  <p>Ожидание участников...</p>
                </div>
              )}
        </ScrollArea>

        {isHost() && roomState?.usersCount === 2 && <StartGameButton />}
      </CardContent>
    </Card>
  )
}, 'Lobby')
