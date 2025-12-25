import CreateOrJoinForm from '@/components/room/CreateOrJoinForm/CreateOrJoinForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function RoomEntry() {
  return (
    <div className="container mx-auto min-h-screen flex justify-center items-center p-4 bg-gradient-to-tr from-background to-secondary/20">
      <Card className="w-full max-w-md border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Anime Tinder
          </CardTitle>
          <CardDescription className="text-lg">
            Create a room or join a friend to start matching!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrJoinForm />
        </CardContent>
      </Card>
    </div>
  )
}

export default RoomEntry
