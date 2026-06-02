import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OpenMeteoService } from '../open-meteo.service';
import { WeatherData } from '../domain/weather.entity';
import { IGetWeatherUseCase } from '../domain/weather.usecase.interface';

/**
 * GetWeatherUseCase
 *
 * Obtiene el clima actual para las coordenadas del Box.
 *
 * Flujo:
 *  1. Acepta coordenadas directas O un boxId para buscarlas en la BD
 *  2. Llama a Open-Meteo con las coordenadas
 *  3. Retorna WeatherData enriquecida con descripción y recomendaciones
 *
 * El frontend manda las coords del Box o el boxId.
 * Nunca calcula condiciones climáticas — solo muestra lo que retorna el backend.
 */
@Injectable()
export class GetWeatherUseCase implements IGetWeatherUseCase {
  private readonly logger = new Logger(GetWeatherUseCase.name);

  constructor(
    private readonly openMeteoService: OpenMeteoService,
    private readonly prisma:           PrismaService,
  ) {}

  /**
   * Obtener clima por coordenadas directas.
   */
  async execute(
    latitude:     number,
    longitude:    number,
    locationName: string = 'Ubicación del Box',
  ): Promise<WeatherData> {
    return this.openMeteoService.getCurrentWeather(latitude, longitude, locationName);
  }

  /**
   * Obtener clima usando el boxId — busca las coords en la BD.
   * Útil cuando el app solo tiene el boxId disponible.
   */
  async executeByBoxId(boxId: number): Promise<WeatherData> {
    const box = await this.prisma.box.findUnique({ where: { id: boxId } });

    if (!box) {
      throw new NotFoundException(`Box ${boxId} no encontrado`);
    }

    if (!box.latitude || !box.longitude) {
      throw new NotFoundException(
        `El Box ${boxId} no tiene ubicación configurada. ` +
        'Actualiza las coordenadas desde la app.',
      );
    }

    return this.openMeteoService.getCurrentWeather(
      box.latitude,
      box.longitude,
      box.locationName ?? 'Ubicación del Box',
    );
  }
}
