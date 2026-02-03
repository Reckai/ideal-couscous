export const REDIS_KEYS = {
  roomState: (roomId: string) => `room:${roomId}:state`,
  roomDraft: (roomId: string) => `room:${roomId}:draft`,
  userSelections: (roomId: string, userId: string) => `room:${roomId}:user:${userId}:selections`,
  mediaPool: (roomId: string) => `room:${roomId}:media_pool`,
  swipes: (roomId: string) => `room:${roomId}:swipes`,
  users: (roomId: string) => `room:${roomId}:users`,
  userInRoom: (userId: string) => `user:${userId}:room`,
  userStatus: (roomId: string, userId: string) => `room:${roomId}:user:${userId}:status`,
}
