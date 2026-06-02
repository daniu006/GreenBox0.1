import { Inject, Injectable } from '@nestjs/common';
import { IBoxRepository, BOX_REPOSITORY } from '../domain/box.repository.interface';
import { Box } from '../domain/box.entity';

@Injectable()
export class GetBoxesByUserUseCase {
  constructor(
    @Inject(BOX_REPOSITORY)
    private readonly boxRepository: IBoxRepository,
  ) {}

  async execute(userId: string): Promise<Box[]> {
    return this.boxRepository.findByUserId(userId);
  }
}