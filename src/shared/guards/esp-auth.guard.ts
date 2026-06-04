import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EspAuthGuard implements CanActivate {
  private readonly logger = new Logger(EspAuthGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractToken(request);
    const boxId = this.extractBoxId(request);

    if (!token || !boxId) {
      throw new UnauthorizedException('Token o boxId no proporcionado');
    }

    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      select: { id: true, espToken: true },
    });

    if (!box || !box.espToken) {
      this.logger.warn(`Box ${boxId} no encontrado o sin token configurado`);
      throw new UnauthorizedException('Dispositivo no autorizado');
    }

    if (box.espToken !== token) {
      this.logger.warn(`Token inválido para box ${boxId}`);
      throw new UnauthorizedException('Token inválido');
    }

    request.boxId = boxId;
    return true;
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.split('Bearer ')[1];
  }

  private extractBoxId(request: any): number | null {
    const raw = request.headers['x-box-id'];
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? null : parsed;
  }
}