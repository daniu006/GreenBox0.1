import { Module } from '@nestjs/common';
import { AutomaticControlService } from './automatic-control.service';
import { EvaluateReadingUseCase } from './usecases/evaluate-reading.usecase';


@Module({
  providers: [
    AutomaticControlService,
    EvaluateReadingUseCase,
  ],
  exports: [AutomaticControlService],
})
export class AutomaticControlModule {}
