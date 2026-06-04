import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

export interface Box {
  id: number;
  code: string;
  userId: string | null;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  fcmTokens: string[];
  createdAt: Date;
}

@Injectable()
export class BoxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string): Promise<Box | null> {
    return this.prisma.box.findUnique({ where: { code } });
  }

  async findById(id: number): Promise<Box | null> {
    return this.prisma.box.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Box[]> {
    return this.prisma.box.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async assignToUser(boxId: number, userId: string): Promise<Box> {
    return this.prisma.box.update({
      where: { id: boxId },
      data: { userId },
    });
  }

  async updateLocation(
    boxId: number,
    latitude: number,
    longitude: number,
    locationName: string,
  ): Promise<Box> {
    return this.prisma.box.update({
      where: { id: boxId },
      data: { latitude, longitude, locationName },
    });
  }

  async addFcmToken(boxId: number, token: string): Promise<void> {
    await this.prisma.box.update({
      where: { id: boxId },
      data: { fcmTokens: { push: token } },
    });
  }

  async removeFcmToken(token: string): Promise<void> {
    const boxes = await this.prisma.box.findMany({
      where: { fcmTokens: { has: token } },
    });
    for (const box of boxes) {
      await this.prisma.box.update({
        where: { id: box.id },
        data: { fcmTokens: { set: box.fcmTokens.filter(t => t !== token) } },
      });
    }
  }

  async getFcmTokens(boxId: number): Promise<string[]> {
    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      select: { fcmTokens: true },
    });
    return box?.fcmTokens ?? [];
  }
}