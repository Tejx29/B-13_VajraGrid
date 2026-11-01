import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  WeatherDistrict,
  CurrentWeather,
  HourlyForecastPoint,
  DailyForecastPoint,
  WeatherWarningInfo,
  DistrictComparisonItem,
  PalgharTalukaStation,
} from '../types/weather';

export const MAHARASHTRA_DEFAULT_DISTRICTS: WeatherDistrict[] = [
  {
    id: 'palghar_district',
    name: 'Palghar District',
    state: 'Maharashtra',
    division: 'Konkan Division',
    representativePointName: 'Palghar Collectorate & HQ',
    lat: 19.6967,
    lng: 72.7699,
    imdDistrictName: 'palghar',
    areaSqKm: 5344,
    description: 'Northern coastal Konkan district; Surya & Vaitarna river basins, extensive coastline & tribal watersheds',
    subDistricts: ['Palghar', 'Dahanu', 'Vasai', 'Wada', 'Jawhar', 'Mokhada', 'Talasari', 'Vikramgad'],
  },
  {
    id: 'thane_district',
    name: 'Thane District',
    state: 'Maharashtra',
    division: 'Konkan Division',
    representativePointName: 'Thane Collectorate / Court Naka',
    lat: 19.1860,
    lng: 72.9759,
    imdDistrictName: 'thane',
    areaSqKm: 4214,
    description: 'Urban-industrial corridor district, Ulhas river basin and Sanjay Gandhi National Park boundary',
    subDistricts: ['Thane', 'Kalyan', 'Murbad', 'Bhiwandi', 'Shahapur', 'Ulhasnagar', 'Ambarnath'],
  },
  {
    id: 'mumbai_suburban_district',
    name: 'Mumbai Suburban District',
    state: 'Maharashtra',
    division: 'Konkan Division',
    representativePointName: 'Bandra East Administrative HQ',
    lat: 19.0600,
    lng: 72.8530,
    imdDistrictName: 'mumbai suburban',
    areaSqKm: 446,
    description: 'High-density coastal metropolis; Mithi river catchment and western coastal creek network',
    subDistricts: ['Kurla', 'Andheri', 'Borivali'],
  },
  {
    id: 'raigad_district',
    name: 'Raigad District',
    state: 'Maharashtra',
    division: 'Konkan Division',
    representativePointName: 'Alibag District Collectorate',
    lat: 18.6414,
    lng: 72.8722,
    imdDistrictName: 'raigad',
    areaSqKm: 7152,
    description: 'Coastal Konkan district with rugged Western Ghats escarpments; Amba & Savitri river basins',
    subDistricts: ['Alibag', 'Pen', 'Panvel', 'Roha', 'Mahad', 'Mangaon', 'Karjat', 'Murud'],
  },
  {
    id: 'ratnagiri_district',
    name: 'Ratnagiri District',
    state: 'Maharashtra',
    division: 'Konkan Division',
    representativePointName: 'Ratnagiri Town District HQ',
    lat: 16.9902,
    lng: 73.3120,
    imdDistrictName: 'ratnagiri',
    areaSqKm: 8208,
    description: 'High monsoonal precipitation coastal district; Vashishti & Shastri river basins and ghat passes',
    subDistricts: ['Ratnagiri', 'Chiplun', 'Khed', 'Guhagar', 'Dapoli', 'Rajapur', 'Lanja', 'Sangameshwar', 'Mandangad'],
  },
  {
    id: 'sindhudurg_district',
    name: 'Sindhudurg District',
    state: 'Maharashtra',
    division: 'Konkan Division',
    representativePointName: 'Oros Administrative Center',
    lat: 16.1130,
    lng: 73.7042,
    imdDistrictName: 'sindhudurg',
    areaSqKm: 5207,
    description: 'Southern Konkan coastal district bordering Goa; Tillari & Karli river catchment zones',
    subDistricts: ['Kudal', 'Sawantwadi', 'Malvan', 'Vengurla', 'Kankavli', 'Devgad', 'Vaibhavwadi', 'Dodamarg'],
  },
  {
    id: 'nashik_district',
    name: 'Nashik District',
    state: 'Maharashtra',
    division: 'Nashik Division',
    representativePointName: 'Nashik District Collectorate',
    lat: 19.9975,
    lng: 73.7898,
    imdDistrictName: 'nashik',
    areaSqKm: 15530,
    description: 'Northern Maharashtra highland plateau and Western Ghats origin; Godavari river headwaters',
    subDistricts: ['Nashik', 'Trimbakeshwar', 'Igatpuri', 'Dindori', 'Sinnar', 'Niphad', 'Malegaon', 'Kalwan'],
  },
  {
    id: 'pune_district',
    name: 'Pune District',
    state: 'Maharashtra',
    division: 'Pune Division',
    representativePointName: 'Pune Collectorate / Central Building',
    lat: 18.5204,
    lng: 73.8567,
    imdDistrictName: 'pune',
    areaSqKm: 15643,
    description: 'Western Ghats rain-shadow transition district; Mutha-Mula, Bhima & Nira river systems',
    subDistricts: ['Pune City', 'Haveli', 'Maval', 'Mulshi', 'Bhor', 'Velhe', 'Khed', 'Junnar', 'Ambegaon', 'Shirur', 'Daund', 'Indapur', 'Baramati'],
  },
];

// Backwards-compatible export for existing tests/modules
export const PALGHAR_DEFAULT_REGIONS = MAHARASHTRA_DEFAULT_DISTRICTS;

const DISTRICT_STORAGE_KEY = 'vajragrid_selected_weather_district';
const LEGACY_STORAGE_KEY = 'vajragrid_selected_weather_region';

export function getPersistedDistrictId(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(DISTRICT_STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved && MAHARASHTRA_DEFAULT_DISTRICTS.some((d) => d.id === saved)) {
        return saved;
      }
    }
  } catch {
    // Ignore localStorage access failures
  }
  return 'palghar_district';
}

export function persistDistrictId(districtId: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DISTRICT_STORAGE_KEY, districtId);
      window.localStorage.setItem(LEGACY_STORAGE_KEY, districtId);
    }
  } catch {
    // Ignore localStorage access failures
  }
}

// Backwards-compatible functions
export const getPersistedRegionId = getPersistedDistrictId;
export const persistRegionId = persistDistrictId;

export async function fetchWeatherDistricts(): Promise<WeatherDistrict[]> {
  try {
    const res = await fetch('/api/weather/districts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.districts) && data.districts.length > 0 ? data.districts : MAHARASHTRA_DEFAULT_DISTRICTS;
  } catch {
    return MAHARASHTRA_DEFAULT_DISTRICTS;
  }
}

export const fetchWeatherRegions = fetchWeatherDistricts;

export async function fetchCurrentWeather(districtId: string): Promise<{
  district: WeatherDistrict;
  current: CurrentWeather;
  region?: WeatherDistrict;
}> {
  const res = await fetch(`/api/weather/current?districtId=${encodeURIComponent(districtId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}: Failed to fetch current weather for ${districtId}`);
  }
  return res.json();
}

export async function fetchWeatherForecast(districtId: string): Promise<{
  district: WeatherDistrict;
  region?: WeatherDistrict;
  representativePoint: string;
  forecastRainfall24h: number;
  hourly: HourlyForecastPoint[];
  daily: DailyForecastPoint[];
  dataSource: string;
  isCached?: boolean;
}> {
  const res = await fetch(`/api/weather/forecast?districtId=${encodeURIComponent(districtId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}: Failed to fetch forecast for ${districtId}`);
  }
  return res.json();
}

export async function fetchWeatherWarnings(districtId: string): Promise<WeatherWarningInfo> {
  const res = await fetch(`/api/weather/warnings?districtId=${encodeURIComponent(districtId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}: Failed to fetch warnings for ${districtId}`);
  }
  return res.json();
}

export async function fetchDistrictComparison(): Promise<{
  count: number;
  items: DistrictComparisonItem[];
  retrievedAt: string;
}> {
  const res = await fetch('/api/weather/comparison');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}: Failed to fetch district comparison`);
  }
  return res.json();
}

export const fetchRegionalComparison = fetchDistrictComparison;

export async function fetchPalgharSubdistricts(): Promise<{
  district: string;
  stations: PalgharTalukaStation[];
}> {
  try {
    const res = await fetch('/api/weather/palghar-subdistricts');
    if (!res.ok) return { district: 'Palghar District', stations: [] };
    return res.json();
  } catch {
    return { district: 'Palghar District', stations: [] };
  }
}

export interface UseWeatherDashboardReturn {
  // District-wise primary API
  districts: WeatherDistrict[];
  selectedDistrict: WeatherDistrict;
  setSelectedDistrictId: (id: string) => void;
  currentWeather: CurrentWeather | null;
  forecastRainfall24h: number;
  hourlyForecast: HourlyForecastPoint[];
  dailyForecast: DailyForecastPoint[];
  warningInfo: WeatherWarningInfo | null;
  districtComparison: DistrictComparisonItem[];
  palgharSubdistricts: PalgharTalukaStation[];
  isLoading: boolean;
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
  refresh: () => Promise<void>;

  // Backwards-compatible aliases
  regions: WeatherDistrict[];
  selectedRegion: WeatherDistrict;
  setSelectedRegionId: (id: string) => void;
  regionalComparison: DistrictComparisonItem[];
}

export function useWeatherDashboard(initialDistrictId?: string): UseWeatherDashboardReturn {
  const [districts, setDistricts] = useState<WeatherDistrict[]>(MAHARASHTRA_DEFAULT_DISTRICTS);
  const [selectedDistrictId, setSelectedDistrictIdState] = useState<string>(() => {
    return initialDistrictId || getPersistedDistrictId();
  });

  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecastRainfall24h, setForecastRainfall24h] = useState<number>(0);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastPoint[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecastPoint[]>([]);
  const [warningInfo, setWarningInfo] = useState<WeatherWarningInfo | null>(null);
  const [districtComparison, setDistrictComparison] = useState<DistrictComparisonItem[]>([]);
  const [palgharSubdistricts, setPalgharSubdistricts] = useState<PalgharTalukaStation[]>([]);

  const [isLoadingCurrent, setIsLoadingCurrent] = useState<boolean>(true);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(true);
  const [isLoadingWarnings, setIsLoadingWarnings] = useState<boolean>(true);
  const [isLoadingComparison, setIsLoadingComparison] = useState<boolean>(true);

  const [errorCurrent, setErrorCurrent] = useState<string | null>(null);
  const [errorForecast, setErrorForecast] = useState<string | null>(null);
  const [errorWarnings, setErrorWarnings] = useState<string | null>(null);
  const [errorComparison, setErrorComparison] = useState<string | null>(null);

  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState<string | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  // In-memory cache of last-known-good data per district
  const lastKnownGoodCache = useRef<Map<string, { current: CurrentWeather; forecast: any; warnings: WeatherWarningInfo; timestamp: string }>>(new Map());

  // Request race-condition counter: protects against slower responses overwriting newer district selection
  const activeRequestIdRef = useRef<number>(0);

  const selectedDistrict = useMemo(() => {
    return districts.find((d) => d.id === selectedDistrictId) || districts[0] || MAHARASHTRA_DEFAULT_DISTRICTS[0];
  }, [districts, selectedDistrictId]);

  const setSelectedDistrictId = useCallback((id: string) => {
    setSelectedDistrictIdState(id);
    persistDistrictId(id);
  }, []);

  // Fetch districts on mount
  useEffect(() => {
    fetchWeatherDistricts().then((loaded) => {
      setDistricts(loaded);
    });
  }, []);

  // Fetch Palghar subdistricts on mount
  useEffect(() => {
    fetchPalgharSubdistricts().then((res) => {
      if (res.stations) setPalgharSubdistricts(res.stations);
    });
  }, []);

  // Load district data with race-condition protection
  const loadDistrictData = useCallback(async (distId: string) => {
    // Increment request ID to invalidate any prior in-flight requests
    const requestId = ++activeRequestIdRef.current;

    setIsLoadingCurrent(true);
    setIsLoadingForecast(true);
    setIsLoadingWarnings(true);
    setErrorCurrent(null);
    setErrorForecast(null);
    setErrorWarnings(null);

    // 1. Fetch Current Weather
    fetchCurrentWeather(distId)
      .then((data) => {
        // Drop response if a newer district has been selected
        if (requestId !== activeRequestIdRef.current) return;
        setCurrentWeather(data.current);
        setIsStale(false);
        setLastSuccessfulUpdate(new Date().toISOString());

        // Update last-known-good cache
        const prev = lastKnownGoodCache.current.get(distId) || ({} as any);
        lastKnownGoodCache.current.set(distId, {
          ...prev,
          current: data.current,
          timestamp: new Date().toISOString(),
        });
      })
      .catch((err) => {
        if (requestId !== activeRequestIdRef.current) return;
        // Check if last-known-good cache is available for this specific district
        const cached = lastKnownGoodCache.current.get(distId);
        if (cached?.current) {
          setCurrentWeather({ ...cached.current, isStale: true });
          setIsStale(true);
          setLastSuccessfulUpdate(cached.timestamp);
          setErrorCurrent(`${err?.message || 'Connection failure'}. Displaying last known cached observation.`);
        } else {
          setCurrentWeather(null);
          setErrorCurrent(err?.message || 'Failed to fetch current weather for this district.');
        }
      })
      .finally(() => {
        if (requestId === activeRequestIdRef.current) {
          setIsLoadingCurrent(false);
        }
      });

    // 2. Fetch Forecast
    fetchWeatherForecast(distId)
      .then((data) => {
        if (requestId !== activeRequestIdRef.current) return;
        setForecastRainfall24h(data.forecastRainfall24h);
        setHourlyForecast(data.hourly);
        setDailyForecast(data.daily);

        const prev = lastKnownGoodCache.current.get(distId) || ({} as any);
        lastKnownGoodCache.current.set(distId, {
          ...prev,
          forecast: data,
          timestamp: new Date().toISOString(),
        });
      })
      .catch((err) => {
        if (requestId !== activeRequestIdRef.current) return;
        const cached = lastKnownGoodCache.current.get(distId);
        if (cached?.forecast) {
          setForecastRainfall24h(cached.forecast.forecastRainfall24h);
          setHourlyForecast(cached.forecast.hourly);
          setDailyForecast(cached.forecast.daily);
          setErrorForecast(`${err?.message || 'Connection failure'}. Displaying cached forecast.`);
        } else {
          setHourlyForecast([]);
          setDailyForecast([]);
          setForecastRainfall24h(0);
          setErrorForecast(err?.message || 'Failed to fetch weather forecast.');
        }
      })
      .finally(() => {
        if (requestId === activeRequestIdRef.current) {
          setIsLoadingForecast(false);
        }
      });

    // 3. Fetch Official IMD Warnings
    fetchWeatherWarnings(distId)
      .then((data) => {
        if (requestId !== activeRequestIdRef.current) return;
        setWarningInfo(data);

        const prev = lastKnownGoodCache.current.get(distId) || ({} as any);
        lastKnownGoodCache.current.set(distId, {
          ...prev,
          warnings: data,
          timestamp: new Date().toISOString(),
        });
      })
      .catch((err) => {
        if (requestId !== activeRequestIdRef.current) return;
        const cached = lastKnownGoodCache.current.get(distId);
        if (cached?.warnings) {
          setWarningInfo(cached.warnings);
          setErrorWarnings('Official warning feed offline. Showing last checked verification state.');
        } else {
          setWarningInfo({
            status: 'offline',
            configured: true,
            districtId: distId,
            districtName: districts.find((d) => d.id === distId)?.name || 'District',
            title: 'Official Warning Verification Temporarily Unavailable',
            message: err?.message || 'Unable to connect to IMD warning feed.',
            source: 'India Meteorological Department (IMD)',
            sourceUrl: 'https://mausam.imd.gov.in/',
            portalUrl: 'https://api.imd.gov.in/public/api_reference.html',
            lastChecked: new Date().toISOString(),
          });
          setErrorWarnings(err?.message || 'Failed to verify official warnings.');
        }
      })
      .finally(() => {
        if (requestId === activeRequestIdRef.current) {
          setIsLoadingWarnings(false);
        }
      });
  }, [districts]);

  // Load district comparison data
  const loadComparisonData = useCallback(async () => {
    setIsLoadingComparison(true);
    setErrorComparison(null);

    fetchDistrictComparison()
      .then((res) => {
        setDistrictComparison(res.items);
      })
      .catch((err) => {
        setErrorComparison(err?.message || 'Failed to load district comparison');
      })
      .finally(() => {
        setIsLoadingComparison(false);
      });
  }, []);

  useEffect(() => {
    loadDistrictData(selectedDistrictId);
  }, [selectedDistrictId, loadDistrictData]);

  useEffect(() => {
    loadComparisonData();
  }, [loadComparisonData]);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadDistrictData(selectedDistrictId),
      loadComparisonData(),
      fetchPalgharSubdistricts().then((res) => {
        if (res.stations) setPalgharSubdistricts(res.stations);
      }),
    ]);
  }, [loadDistrictData, loadComparisonData, selectedDistrictId]);

  const isLoading = isLoadingCurrent || isLoadingForecast || isLoadingWarnings;

  return {
    districts,
    selectedDistrict,
    setSelectedDistrictId,
    currentWeather,
    forecastRainfall24h,
    hourlyForecast,
    dailyForecast,
    warningInfo,
    districtComparison,
    palgharSubdistricts,
    isLoading,
    isLoadingCurrent,
    isLoadingForecast,
    isLoadingWarnings,
    isLoadingComparison,
    errorCurrent,
    errorForecast,
    errorWarnings,
    errorComparison,
    lastSuccessfulUpdate,
    isStale,
    refresh,

    // Backwards-compatible aliases
    regions: districts,
    selectedRegion: selectedDistrict,
    setSelectedRegionId: setSelectedDistrictId,
    regionalComparison: districtComparison,
  };
}
