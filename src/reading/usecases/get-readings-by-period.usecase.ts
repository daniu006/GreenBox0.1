import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IReadingRepository, READING_REPOSITORY } from '../domain/reading.repository.interface';
import { PeriodReadings } from '../domain/reading.usecase.interface';
import { Reading } from '../domain/reading.entity';

export type Period = 'day' | 'week' | 'month';

@Injectable()
export class GetReadingsByPeriodUseCase {
  constructor(
    @Inject(READING_REPOSITORY)
    private readonly readingRepository: IReadingRepository,
  ) {}

  async execute(
    userPlantId: number,
    period: Period,
    dateStr?: string,
  ): Promise<PeriodReadings> {
    // Período validado en backend — no se confía en el frontend
    const validPeriods: Period[] = ['day', 'week', 'month'];
    if (!validPeriods.includes(period)) {
      throw new BadRequestException('Período inválido. Use: day, week o month');
    }

    const refDate = dateStr ? new Date(dateStr) : new Date();
    let readings: Reading[] = [];

    if (period === 'day') {
      readings = await this.readingRepository.findByDay(userPlantId, refDate);
    } else if (period === 'week') {
      const start = this.getWeekStart(refDate);
      const end = this.getWeekEnd(refDate);
      readings = await this.readingRepository.findByWeek(userPlantId, start, end);
    } else if (period === 'month') {
      readings = await this.readingRepository.findByMonth(
        userPlantId,
        refDate.getFullYear(),
        refDate.getMonth() + 1,
      );
    }

    return {
      readings,
      peaks: this.calculatePeaks(readings),
    };
  }

  // Calcula picos máximos y mínimos con su timestamp
  // Para mostrar en la info debajo de la gráfica lineal
  private calculatePeaks(readings: Reading[]) {
    if (readings.length === 0) {
      return {
        temperature: { max: 0, maxAt: new Date(), min: 0, minAt: new Date() },
        humidity: { max: 0, maxAt: new Date(), min: 0, minAt: new Date() },
        soilMoisture: { max: 0, maxAt: new Date(), min: 0, minAt: new Date() },
        waterLevel: { max: 0, maxAt: new Date(), min: 0, minAt: new Date() },
      };
    }

    const findPeaks = (getValue: (r: Reading) => number) => {
      const maxReading = readings.reduce((a, b) => getValue(a) > getValue(b) ? a : b);
      const minReading = readings.reduce((a, b) => getValue(a) < getValue(b) ? a : b);
      return {
        max: getValue(maxReading),
        maxAt: maxReading.timestamp,
        min: getValue(minReading),
        minAt: minReading.timestamp,
      };
    };

    return {
      temperature: findPeaks(r => r.temperature),
      humidity: findPeaks(r => r.humidity),
      soilMoisture: findPeaks(r => r.soilMoisture),
      waterLevel: findPeaks(r => r.waterLevel),
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getWeekEnd(date: Date): Date {
    const start = this.getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}