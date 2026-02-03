export abstract class AbstractSelectionService {
  abstract addMediaToDraft(userId: string, roomId: string, mediaId: string): Promise<boolean>
  abstract deleteMediaFromDraft(userId: string, roomId: string, mediaId: string): Promise<boolean>
}
