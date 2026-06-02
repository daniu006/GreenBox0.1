import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { GetWeatherUseCase } from './usecases/get-weather.usecase';
import { OpenMeteoService } from './open-meteo.service';
@Module({
  controllers: [WeatherController],
  providers: [
    GetWeatherUseCase,
    OpenMeteoService,
  ],
  exports: [GetWeatherUseCase, OpenMeteoService],
})
export class WeatherModule {}
