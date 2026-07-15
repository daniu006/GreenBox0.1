import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { ReadingModule } from 'src/reading/reading.module';
import { SensorsController } from './sensors.controller';
import { SensorsService } from './sensors.service';

@Module({
  imports: [PrismaModule, forwardRef(() => ReadingModule)],
  controllers: [SensorsController],
  providers: [SensorsService],
  exports: [SensorsService],
})
export class SensorsModule {}
