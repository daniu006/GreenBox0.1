import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { GetWeatherUseCase } from './usecases/get-weather.usecase';
import { OpenMeteoService } from './open-meteo.service';

/**
 * WeatherModule
 *
 * Módulo de clima exterior basado en Open-Meteo (gratuito, sin API key).
 * Exporta GetWeatherUseCase por si otros módulos lo necesitan
 * (e.g., para enriquecer alertas con contexto climático).
 */
@Module({
  controllers: [WeatherController],
  providers: [
    GetWeatherUseCase,
    OpenMeteoService,
  ],
  exports: [GetWeatherUseCase, OpenMeteoService],
})
export class WeatherModule {}
