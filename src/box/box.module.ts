import { Module } from '@nestjs/common';
import { BoxController } from './box.controller';
import { ValidateCodeUseCase } from './usecases/validate-code.usecase';
import { UpdateLocationUseCase } from './usecases/update-location.usecase';
import { RegisterFcmTokenUseCase } from './usecases/register-token.usecase';
import { GetBoxesByUserUseCase } from './usecases/assign-box.usecase';
import { BoxPrismaRepository } from './box.repository';
import { BOX_REPOSITORY } from './domain/box.repository.interface';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BoxController],
  providers: [
    // Casos de uso
    ValidateCodeUseCase,
    UpdateLocationUseCase,
    RegisterFcmTokenUseCase,
    GetBoxesByUserUseCase,

    // Repositorio — permite cambiar de ORM sin tocar los casos de uso
    {
      provide: BOX_REPOSITORY,
      useClass: BoxPrismaRepository,
    },
  ],
  exports: [ValidateCodeUseCase, GetBoxesByUserUseCase, BOX_REPOSITORY],
})
export class BoxModule {}