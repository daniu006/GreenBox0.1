import { Module } from '@nestjs/common';
import { StatisticController } from './statistic.controller';
import { CalculateStatisticsUseCase } from './usecases/calculate-statistics.usecase';
import { GetStatisticsByPeriodUseCase } from './usecases/get-statistics-by-period.usecase';
import { StatisticPrismaRepository } from './statistic.repository';
import { STATISTIC_REPOSITORY } from './domain/statistic.repository.interface';

@Module({
  controllers: [StatisticController],
  providers: [
    CalculateStatisticsUseCase,
    GetStatisticsByPeriodUseCase,
    StatisticPrismaRepository,
    {
      provide: STATISTIC_REPOSITORY,
      useClass: StatisticPrismaRepository,
    },
  ],
  exports: [CalculateStatisticsUseCase, STATISTIC_REPOSITORY],
})
export class StatisticModule {}