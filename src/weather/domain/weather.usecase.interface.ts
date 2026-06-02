import { WeatherData } from './weather.entity';

export interface IGetWeatherUseCase {
  execute(latitude: number, longitude: number, locationName?: string): Promise<WeatherData>;
}

export const GET_WEATHER_USE_CASE = 'GET_WEATHER_USE_CASE';
