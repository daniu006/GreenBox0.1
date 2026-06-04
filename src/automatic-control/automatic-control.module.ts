import { Module } from '@nestjs/common';
import { AutomaticControlService } from './automatic-control.service';

@Module({
  providers: [AutomaticControlService],
  exports: [AutomaticControlService],
})
export class AutomaticControlModule {}