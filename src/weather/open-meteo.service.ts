import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { WeatherData, WMO_DESCRIPTIONS } from './domain/weather.entity';

/**
 * OpenMeteoService
 *
 * Cliente para la API de Open-Meteo (https://open-meteo.com/).
 * API gratuita, sin key, con variables actuales de clima.
 *
 * Variables que pedimos:
 *   - temperature_2m       → temperatura a 2 metros del suelo
 *   - apparent_temperature → sensación térmica
 *   - relative_humidity_2m → humedad relativa exterior
 *   - uv_index             → índice UV
 *   - wind_speed_10m       → velocidad del viento a 10m
 *   - weather_code         → código WMO del estado del tiempo
 *   - is_day               → indicador día/noche
 */
@Injectable()
export class OpenMeteoService {
  private readonly logger = new Logger(OpenMeteoService.name);
  private readonly BASE_URL = 'https://api.open-meteo.com/v1/forecast';

  async getCurrentWeather(
    latitude:     number,
    longitude:    number,
    locationName: string = 'Ubicación del Box',
  ): Promise<WeatherData> {
    const params = new URLSearchParams({
      latitude:         latitude.toString(),
      longitude:        longitude.toString(),
      current:          [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'uv_index',
        'wind_speed_10m',
        'weather_code',
        'is_day',
      ].join(','),
      timezone:         'auto',
      forecast_days:    '1',
    });

    const url = `${this.BASE_URL}?${params.toString()}`;

    try {
      // fetch nativo — Node 18+ lo soporta sin librerías adicionales
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Open-Meteo respondió con status ${response.status}`);
      }

      const data = await response.json() as any;
      const current = data.current;

      if (!current) {
        throw new Error('Respuesta de Open-Meteo sin datos de clima actual');
      }

      const weatherCode  = current.weather_code ?? 0;
      const weatherDesc  = WMO_DESCRIPTIONS[weatherCode] ?? 'Desconocido';

      const weather = new WeatherData(
        latitude,
        longitude,
        locationName,
        current.temperature_2m       ?? 0,
        current.apparent_temperature ?? 0,
        current.relative_humidity_2m ?? 0,
        current.uv_index             ?? 0,
        current.wind_speed_10m       ?? 0,
        weatherCode,
        weatherDesc,
        current.is_day === 1,
        new Date(),
      );

      this.logger.log(
        `Clima obtenido para (${latitude}, ${longitude}): ${weather.temperature}°C — ${weatherDesc}`,
      );

      return weather;
    } catch (error) {
      this.logger.error(`Error al obtener clima de Open-Meteo: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudo obtener el clima. Intenta de nuevo.',
      );
    }
  }
}
