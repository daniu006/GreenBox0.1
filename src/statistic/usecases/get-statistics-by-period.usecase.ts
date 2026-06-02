import { Inject, Injectable } from '@nestjs/common';
import { IStatisticRepository, STATISTIC_REPOSITORY } from '../domain/statistic.repository.interface';
import { Statistic } from '../domain/statistic.entity';

@Injectable()
export class GetStatisticsByPeriodUseCase {
  constructor(
    @Inject(STATISTIC_REPOSITORY)
    private readonly statisticRepository: IStatisticRepository,
  ) {}

  async getLatest(userPlantId: number): Promise<Statistic | null> {
    return this.statisticRepository.findLatest(userPlantId);
  }

  async getAll(userPlantId: number): Promise<Statistic[]> {
    return this.statisticRepository.findAll(userPlantId);
  }

  async getByWeek(userPlantId: number, week: number): Promise<Statistic | null> {
    return this.statisticRepository.findByWeek(userPlantId, week);
  }
}