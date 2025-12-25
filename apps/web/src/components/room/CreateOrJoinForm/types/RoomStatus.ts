export const RoomStatus = {
  WAITING: 'WAITING',
  SELECTING: 'SELECTING',
  READY: 'READY',
  SWIPING: 'SWIPING',
  MATCHED: 'MATCHED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const
export type TRoomStatus = keyof typeof RoomStatus
