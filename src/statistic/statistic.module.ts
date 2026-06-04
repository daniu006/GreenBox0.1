import { Module } from '@nestjs/common';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';
import { StatisticRepository } from './statistic.repository';

@Module({
  controllers: [StatisticController],
  providers: [StatisticService, StatisticRepository],
  exports: [StatisticService, StatisticRepository],
})
export class StatisticModule {}