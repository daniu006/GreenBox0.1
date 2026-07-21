import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseFloatPipe,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../shared/guards/firebase-auth.guard';
import { GetWeatherUseCase } from './usecases/get-weather.usecase';
@Controller('weather')
@UseGuards(FirebaseAuthGuard)
export class WeatherController {
  constructor(private readonly getWeatherUseCase: GetWeatherUseCase) {}
  @Get('current')
  async getCurrent(
    @Query('lat') latStr: string,
    @Query('lon') lonStr: string,
    @Query('location') location?: string,
  ) {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) {
      throw new BadRequestException(
        'Los parámetros "lat" y "lon" son requeridos y deben ser números válidos',
      );
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new BadRequestException('Coordenadas fuera de rango');
    }
    const weather = await this.getWeatherUseCase.execute(lat, lon, location);
    return {
      message: 'Clima obtenido exitosamente',
      data: this.formatWeather(weather),
    };
  }
  @Get('box/:boxId')
  async getByBox(@Param('boxId', ParseIntPipe) boxId: number) {
    const weather = await this.getWeatherUseCase.executeByBoxId(boxId);
    return {
      message: 'Clima del Box obtenido exitosamente',
      data: this.formatWeather(weather),
    };
  }
  private formatWeather(weather: any) {
    return {
      location: weather.locationName,
      latitude: weather.latitude,
      longitude: weather.longitude,
      temperature: weather.temperature,
      feelsLike: weather.feelsLike,
      humidity: weather.humidity,
      uvIndex: weather.uvIndex,
      uvLevel: weather.uvLevel(),
      windSpeed: weather.windSpeed,
      weatherCode: weather.weatherCode,
      weatherDescription: weather.weatherDesc,
      isDay: weather.isDay,
      isGoodForWatering: weather.isGoodForWatering(),
      fetchedAt: weather.fetchedAt,
    };
  }
}
