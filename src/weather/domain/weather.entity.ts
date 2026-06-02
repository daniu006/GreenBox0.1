export class WeatherData {
  constructor(
    public readonly latitude:        number,
    public readonly longitude:       number,
    public readonly locationName:    string,
    public readonly temperature:     number,   
    public readonly feelsLike:       number,   
    public readonly humidity:        number,   
    public readonly uvIndex:         number,   
    public readonly windSpeed:       number,   
    public readonly weatherCode:     number,   
    public readonly weatherDesc:     string,   
    public readonly isDay:           boolean,  
    public readonly fetchedAt:       Date,
  ) {}
  uvLevel(): string {
    if (this.uvIndex <= 2)  return 'Bajo';
    if (this.uvIndex <= 5)  return 'Moderado';
    if (this.uvIndex <= 7)  return 'Alto';
    if (this.uvIndex <= 10) return 'Muy alto';
    return 'Extremo';
  }
  isGoodForWatering(): boolean {
    const rainingCodes = [51, 53, 55, 61, 63, 65, 71, 73, 75, 80, 81, 82, 95, 96, 99];
    return !rainingCodes.includes(this.weatherCode) && this.temperature < 35;
  }
}
export const WMO_DESCRIPTIONS: Record<number, string> = {
  0:  'Despejado',
  1:  'Mayormente despejado',
  2:  'Parcialmente nublado',
  3:  'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia intensa',
  71: 'Nevada ligera',
  73: 'Nevada moderada',
  75: 'Nevada intensa',
  80: 'Chubascos ligeros',
  81: 'Chubascos moderados',
  82: 'Chubascos intensos',
  95: 'Tormenta',
  96: 'Tormenta con granizo',
  99: 'Tormenta con granizo intenso',
};
