// Entidad de dominio para el clima exterior
// Los datos vienen de Open-Meteo (API gratuita, sin key)
// Se usan para contextualizar las lecturas del sensor y ajustar recomendaciones

export class WeatherData {
  constructor(
    public readonly latitude:        number,
    public readonly longitude:       number,
    public readonly locationName:    string,
    public readonly temperature:     number,   // °C actual exterior
    public readonly feelsLike:       number,   // sensación térmica
    public readonly humidity:        number,   // % humedad relativa exterior
    public readonly uvIndex:         number,   // índice UV actual
    public readonly windSpeed:       number,   // km/h
    public readonly weatherCode:     number,   // WMO weather code
    public readonly weatherDesc:     string,   // descripción en español
    public readonly isDay:           boolean,  // true = día, false = noche
    public readonly fetchedAt:       Date,
  ) {}

  // Nivel de radiación UV en texto
  uvLevel(): string {
    if (this.uvIndex <= 2)  return 'Bajo';
    if (this.uvIndex <= 5)  return 'Moderado';
    if (this.uvIndex <= 7)  return 'Alto';
    if (this.uvIndex <= 10) return 'Muy alto';
    return 'Extremo';
  }

  // ¿Es un buen día para regar? (no está lloviendo y temp es moderada)
  isGoodForWatering(): boolean {
    const rainingCodes = [51, 53, 55, 61, 63, 65, 71, 73, 75, 80, 81, 82, 95, 96, 99];
    return !rainingCodes.includes(this.weatherCode) && this.temperature < 35;
  }
}

// Mapa de códigos WMO → descripción en español
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
