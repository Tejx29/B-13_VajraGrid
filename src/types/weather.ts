export interface WeatherDistrict {
  id: string;
  name: string;
  state: string;
  division: string;
  representativePointName: string;
  lat: number;
  lng: number;
  description: string;
  imdDistrictName: string;
  areaSqKm?: number;
  subDistricts?: string[]; // Talukas/tehsils for supporting geographic detail
}

// Backwards-compatible alias for existing imports
export type WeatherRegion = WeatherDistrict;

export type WeatherRiskLevel = 'Normal' | 'Elevated' | 'Heavy' | 'Critical' | 'Unavailable';

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  weatherCode: number;
  weatherText: string;
  windSpeed: number;
  windDirection: number;
  windDirectionCardinal: string;
  windGusts?: number;
  precipitationRate: number; // mm/hr
  visibilityKm?: number;
  surfacePressureHpa?: number;
  observationTime: string;
  isDay: boolean;
  dataSource: string;
  dataSourceUrl: string;
  representativePoint: string;
  isCached?: boolean;
  isStale?: boolean;
}

export interface HourlyForecastPoint {
  time: string; // ISO
  formattedTime: string; // "14:00"
  temperature: number;
  precipitation: number; // mm
  precipitationProbability: number; // %
  weatherCode: number;
  weatherText: string;
  windSpeed: number; // km/h
  isDay: boolean;
}

export interface DailyForecastPoint {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Today", "Mon", "Tue"
  weatherCode: number;
  weatherText: string;
  tempMin: number;
  tempMax: number;
  precipitationSum: number; // mm
  precipitationProbabilityMax: number; // %
  windSpeedMax: number; // km/h
  uvIndexMax?: number;
}

export interface WeatherWarningInfo {
  status: 'active' | 'no_active_warning' | 'unconfigured' | 'offline';
  warningLevel?: 'Green' | 'Yellow' | 'Orange' | 'Red' | 'None';
  hazardType?: string;
  title: string;
  issueTime?: string;
  validUntil?: string;
  affectedArea?: string;
  recommendedPrecautions?: string;
  source: string;
  sourceUrl: string;
  configured: boolean;
  message?: string;
  lastChecked: string;
  districtId: string;
  districtName: string;
}

export interface DistrictComparisonItem {
  districtId: string;
  districtName: string;
  state: string;
  division: string;
  representativePoint: string;
  lat: number;
  lng: number;
  currentTemp: number | null;
  weatherText: string;
  weatherCode: number | null;
  currentPrecipitation: number | null; // mm/h
  forecastRainfall24h: number | null; // mm / 24h
  precipProbability: number | null; // %
  maxWindSpeed: number | null; // km/h
  imdWarningStatus: 'active' | 'no_active_warning' | 'unconfigured' | 'offline';
  imdWarningLevel?: 'Green' | 'Yellow' | 'Orange' | 'Red' | 'None';
  ruleBasedWeatherRisk: WeatherRiskLevel;
  ruleExplanation: string;
  operationalProtocol: string;
  lastUpdated: string | null;
  status: 'live' | 'cached' | 'error' | 'loading';
  isStale?: boolean;
  errorMessage?: string;
}

// Backwards-compatible alias for existing imports
export type RegionalComparisonItem = DistrictComparisonItem;

export interface PalgharTalukaStation {
  id: string;
  name: string;
  taluka: string;
  lat: number;
  lng: number;
  temp: number | null;
  weatherText: string;
  forecast24h: number | null;
}

export interface DistrictDashboardState {
  selectedDistrict: WeatherDistrict;
  currentWeather: CurrentWeather | null;
  hourlyForecast: HourlyForecastPoint[];
  dailyForecast: DailyForecastPoint[];
  forecastRainfall24h: number;
  warningInfo: WeatherWarningInfo | null;
  districtComparison: DistrictComparisonItem[];
  isLoadingCurrent: boolean;
  isLoadingForecast: boolean;
  isLoadingWarnings: boolean;
  isLoadingComparison: boolean;
  errorCurrent: string | null;
  errorForecast: string | null;
  errorWarnings: string | null;
  errorComparison: string | null;
  lastSuccessfulUpdate: string | null;
  isStale: boolean;
}
