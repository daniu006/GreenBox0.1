import { Inject, Injectable } from '@nestjs/common';
import { IAlertRepository, ALERT_REPOSITORY } from '../domain/alert.repository.interface';
import { Alert } from '../domain/alert.entity';

@Injectable()
export class GetActiveAlertsUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: IAlertRepository,
  ) {}

  async getActive(userPlantId: number): Promise<Alert[]> {
    return this.alertRepository.findActive(userPlantId);
  }

  async getAll(userPlantId: number): Promise<Alert[]> {
    return this.alertRepository.findAll(userPlantId);
  }
}