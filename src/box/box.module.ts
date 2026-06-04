import { Module } from '@nestjs/common';
import { BoxController } from './box.controller';
import { BoxService } from './box.service';
import { BoxRepository } from './box.repository';

@Module({
  controllers: [BoxController],
  providers: [BoxService, BoxRepository],
  exports: [BoxService, BoxRepository],
})
export class BoxModule {}