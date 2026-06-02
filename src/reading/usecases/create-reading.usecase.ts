import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { IReadingRepository, READING_REPOSITORY } from '../domain/reading.repository.interface';
import { CreateReadingDto } from '../reading.dto';
import { ReadingWithCommands } from '../domain/reading.usecase.interface';

@Injectable()
export class CreateReadingUseCase {
  private readonly logger = new Logger(CreateReadingUseCase.name);

  constructor(
    @Inject(READING_REPOSITORY)
    private readonly readingRepository: IReadingRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: CreateReadingDto): Promise<ReadingWithCommands> {
    // 1. Verificar que el userPlant existe y obtener parámetros de la planta
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id: dto.userPlantId },
      include: { plant: true },
    });

    if (!userPlant || !userPlant.plant) {
      throw new NotFoundException('Instancia de planta no encontrada');
    }

    if (userPlant.archivedAt !== null) {
      throw new NotFoundException('Esta planta está archivada');
    }

    const plant = userPlant.plant;

    // 2. Guardar la lectura — datos validados por el DTO, no por el ESP32
    const reading = await this.readingRepository.create({
      userPlantId: dto.userPlantId,
      temperature: dto.temperature,
      humidity: dto.humidity,
      soilMoisture: dto.soilMoisture,
      lightHours: dto.lightHours,
      waterLevel: dto.waterLevel,
    });

    // 3. Evaluar si hay que activar la bomba automáticamente
    // La lógica vive en el backend, no en el ESP32
    const pumpOn = this.shouldActivatePump(dto, plant);

    // 4. Generar alertas si algún parámetro está fuera de rango
    await this.checkAndCreateAlerts(dto, plant, dto.userPlantId);

    // 5. Actualizar estado de la bomba en la BD
    await this.prisma.userPlant.update({
      where: { id: dto.userPlantId },
      data: { /* pumpStatus si lo necesitas */ },
    }).catch(() => {}); // silencioso si no hay campo

    this.logger.log(`Lectura creada para userPlant ${dto.userPlantId} — pump: ${pumpOn}`);

    return {
      reading,
      commands: { pump: pumpOn },
    };
  }

  // Lógica de activación automática de bomba — solo backend decide
  private shouldActivatePump(reading: CreateReadingDto, plant: any): boolean {
    const soilTooLow = reading.soilMoisture < (plant.minSoilMoisture ?? 30);
    const waterTooLow = reading.waterLevel < plant.minWaterLevel;

    // Activa la bomba si la humedad del suelo está baja Y hay agua disponible
    return soilTooLow && !waterTooLow;
  }

  private async checkAndCreateAlerts(
    reading: CreateReadingDto,
    plant: any,
    userPlantId: number,
  ): Promise<void> {
    const checks = [
      {
        condition: reading.temperature < plant.minTemperature || reading.temperature > plant.maxTemperature,
        type: 'temperature',
        message: `Temperatura fuera de rango: ${reading.temperature}°C (óptimo: ${plant.minTemperature}-${plant.maxTemperature}°C)`,
      },
      {
        condition: reading.humidity < plant.minHumidity || reading.humidity > plant.maxHumidity,
        type: 'humidity',
        message: `Humedad fuera de rango: ${reading.humidity}% (óptimo: ${plant.minHumidity}-${plant.maxHumidity}%)`,
      },
      {
        condition: reading.waterLevel < plant.minWaterLevel,
        type: 'water',
        message: `Nivel de agua bajo: ${reading.waterLevel}% (mínimo: ${plant.minWaterLevel}%)`,
      },
      {
        condition: plant.minSoilMoisture && reading.soilMoisture < plant.minSoilMoisture,
        type: 'soilMoisture',
        message: `Humedad del suelo baja: ${reading.soilMoisture}% (mínimo: ${plant.minSoilMoisture}%)`,
      },
    ];

    for (const check of checks) {
      if (!check.condition) continue;

      // Evitar alertas duplicadas no resueltas del mismo tipo
      const existing = await this.prisma.alert.findFirst({
        where: { userPlantId, type: check.type, resolved: false },
      });

      if (!existing) {
        await this.prisma.alert.create({
          data: { userPlantId, type: check.type, message: check.message },
        });
      }
    }
  }
}