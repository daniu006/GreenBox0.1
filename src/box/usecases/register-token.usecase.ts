import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IBoxRepository, BOX_REPOSITORY } from '../domain/box.repository.interface';

@Injectable()
export class RegisterFcmTokenUseCase {
  constructor(
    @Inject(BOX_REPOSITORY)
    private readonly boxRepository: IBoxRepository,
  ) {}

  async register(boxId: number, token: string): Promise<void> {
    const box = await this.boxRepository.findById(boxId);
    if (!box) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    // Solo agrega si no existe ya — evita duplicados
    const tokens = await this.boxRepository.getFcmTokens(boxId);
    if (!tokens.includes(token)) {
      await this.boxRepository.addFcmToken(boxId, token);
    }
  }

  async remove(token: string): Promise<void> {
    // Remueve el token de todos los boxes donde esté
    await this.boxRepository.removeFcmToken(token);
  }
}