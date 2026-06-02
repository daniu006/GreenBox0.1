import { Module } from '@nestjs/common';
import { AutomaticControlService } from './automatic-control.service';
import { EvaluateReadingUseCase } from './usecases/evaluate-reading.usecase';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
@Module({
  providers: [
    PrismaModule,
    AutomaticControlService,
    EvaluateReadingUseCase,
  ],
  exports: [AutomaticControlService],
})
export class AutomaticControlModule {}
