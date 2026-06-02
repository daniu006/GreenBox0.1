export class Box {
  constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly userId: string | null,
    public readonly latitude: number | null,
    public readonly longitude: number | null,
    public readonly locationName: string | null,
    public readonly fcmTokens: string[],
    public readonly createdAt: Date,
  ) {}

  isAssigned(): boolean {
    return this.userId !== null;
  }

  hasLocation(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }
}