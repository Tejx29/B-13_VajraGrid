// Dedicated typed geocoding provider service for VajraGrid

export interface AdministrativeCountry {
  id: string;
  name: string;
}

export interface AdministrativeState {
  id: string;
  name: string;
  countryId: string;
}

export interface AdministrativeDistrict {
  id: string;
  name: string;
  stateId: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  polygon?: [number, number][]; // Array of [lat, lng] boundary vertices
  isApproximatedBoundary?: boolean; // True when polygon is an approximated vector model rather than official cadastral survey
  popularLandmarks?: { name: string; lat: number; lng: number; description: string }[];
}

export type AddressVerificationStatus = 'verified' | 'inferred' | 'unverified';
export type BoundaryValidationStatus = 'verified' | 'uncertain' | 'outside' | 'boundary_unverified';

export interface GeocodingResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  suburb?: string;
  road?: string;
  addressStatus?: AddressVerificationStatus;
}

export interface GeocodingSearchOptions {
  country?: string;
  state?: string;
  district?: string;
  bbox?: [number, number, number, number];
  limit?: number;
}

export interface DistrictValidationResult {
  valid: boolean;
  status: BoundaryValidationStatus;
  isOfficialGeometry: boolean;
  boundaryType: 'official_polygon' | 'approximated_polygon' | 'bounding_box';
  message: string;
}

// Supported Administrative Hierarchy
export const SUPPORTED_COUNTRIES: AdministrativeCountry[] = [
  { id: 'IND', name: 'India' }
];

export const SUPPORTED_STATES: AdministrativeState[] = [
  { id: 'MH', name: 'Maharashtra', countryId: 'IND' }
];

// Palghar District official boundary approximation (encompassing Vasai, Virar, Palghar, Dahanu, Talasari, Jawhar, Mokhada, Wada, Vikramgad)
export const PALGHAR_BOUNDARY_POLYGON: [number, number][] = [
  // Southern boundary: Vasai Creek & Arabian Sea estuary
  [19.3200, 72.8100],
  [19.3400, 72.8700],
  [19.3900, 72.9300],
  // Southeastern boundary: Vaitarna river & Wada/Bhiwandi border
  [19.4800, 73.0500],
  [19.5700, 73.1800],
  [19.6500, 73.2600],
  // Eastern boundary: Mokhada & Jawhar Western Ghats border with Nashik
  [19.7800, 73.3800],
  [19.9200, 73.3900],
  [20.0200, 73.3200],
  // Northeastern boundary: Talasari / Gujarat border
  [20.1200, 73.1500],
  [20.2400, 73.0100],
  [20.2500, 72.9000],
  // Northern boundary: Dahanu / Bordi coastline
  [20.1600, 72.7400],
  [20.1100, 72.7200],
  // Western Arabian Sea coastline (Bordi -> Dahanu -> Satpati -> Kelwa -> Virar -> Vasai)
  [19.9700, 72.7200],
  [19.8200, 72.7300],
  [19.7000, 72.7200],
  [19.6000, 72.7100],
  [19.4700, 72.7800],
  [19.3600, 72.7900],
  [19.3200, 72.8100] // closes polygon
];

export const THANE_BOUNDARY_POLYGON: [number, number][] = [
  [19.1600, 72.9400],
  [19.2200, 72.9800],
  [19.3400, 73.1200],
  [19.4500, 73.2500],
  [19.3800, 73.3500],
  [19.2200, 73.2800],
  [19.1400, 73.0800],
  [19.1600, 72.9400]
];

export const MUMBAI_SUBURBAN_POLYGON: [number, number][] = [
  [19.0000, 72.8200],
  [19.0500, 72.9000],
  [19.1500, 72.9500],
  [19.2500, 72.8800],
  [19.2800, 72.8200],
  [19.1800, 72.8000],
  [19.0500, 72.8100],
  [19.0000, 72.8200]
];

export const SUPPORTED_DISTRICTS: AdministrativeDistrict[] = [
  {
    id: 'palghar',
    name: 'Palghar',
    stateId: 'MH',
    center: [19.6967, 72.7699],
    zoom: 10,
    bbox: [72.60, 19.28, 73.40, 20.25],
    polygon: PALGHAR_BOUNDARY_POLYGON,
    isApproximatedBoundary: true,
    popularLandmarks: [
      { name: 'Virar', lat: 19.4674, lng: 72.8080, description: 'Virar City & Railway Station, Vasai Taluka' },
      { name: 'Vasai', lat: 19.3644, lng: 72.8105, description: 'Vasai West & Fort Area, Vasai Taluka' },
      { name: 'Palghar HQ', lat: 19.6967, lng: 72.7699, description: 'District Collectorate & HQ, Palghar Town' },
      { name: 'Boisar', lat: 19.8016, lng: 72.7538, description: 'Tarapur MIDC & Railway Station, Boisar' },
      { name: 'Dahanu', lat: 19.9715, lng: 72.7303, description: 'Coastal Road & Port, Dahanu' },
      { name: 'Manor', lat: 19.7420, lng: 72.9080, description: 'Surya River Basin & Highway Junction, Manor' },
      { name: 'Wada', lat: 19.6548, lng: 73.1384, description: 'Wada MIDC & Vaitarna Basin' },
      { name: 'Jawhar', lat: 19.9215, lng: 73.2310, description: 'Jawhar Ghat & Tribal Sub-district' },
      { name: 'Nalasopara', lat: 19.4174, lng: 72.7933, description: 'Nalasopara West / East, Vasai Taluka' },
      { name: 'Bordi', lat: 20.1060, lng: 72.7330, description: 'Bordi Beach Coastal Road, Dahanu' }
    ]
  },
  {
    id: 'thane',
    name: 'Thane',
    stateId: 'MH',
    center: [19.2183, 72.9781],
    zoom: 10,
    bbox: [72.85, 19.10, 73.50, 19.60],
    polygon: THANE_BOUNDARY_POLYGON,
    isApproximatedBoundary: true,
    popularLandmarks: [
      { name: 'Thane Station', lat: 19.1860, lng: 72.9759, description: 'Thane City Central' },
      { name: 'Kalyan', lat: 19.2437, lng: 73.1355, description: 'Kalyan Junction Area' }
    ]
  },
  {
    id: 'mumbai_suburban',
    name: 'Mumbai Suburban',
    stateId: 'MH',
    center: [19.1136, 72.8697],
    zoom: 11,
    bbox: [72.75, 19.00, 72.99, 19.30],
    polygon: MUMBAI_SUBURBAN_POLYGON,
    isApproximatedBoundary: true,
    popularLandmarks: [
      { name: 'Andheri', lat: 19.1197, lng: 72.8464, description: 'Andheri West/East' },
      { name: 'Borivali', lat: 19.2307, lng: 72.8567, description: 'Borivali Station & National Park' }
    ]
  },
  {
    id: 'raigad',
    name: 'Raigad',
    stateId: 'MH',
    center: [18.5158, 73.1812],
    zoom: 9,
    bbox: [72.80, 17.85, 73.60, 19.05],
    popularLandmarks: [
      { name: 'Alibag', lat: 18.6414, lng: 72.8722, description: 'Alibag Coastal Town' },
      { name: 'Panvel', lat: 18.9894, lng: 73.1175, description: 'Panvel City & Junction' }
    ]
  },
  {
    id: 'pune',
    name: 'Pune',
    stateId: 'MH',
    center: [18.5204, 73.8567],
    zoom: 10,
    bbox: [73.30, 18.00, 75.10, 19.30],
    popularLandmarks: [
      { name: 'Shivajinagar', lat: 18.5314, lng: 73.8446, description: 'Shivajinagar Pune' }
    ]
  },
  {
    id: 'nashik',
    name: 'Nashik',
    stateId: 'MH',
    center: [19.9975, 73.7898],
    zoom: 10,
    bbox: [73.20, 19.50, 74.80, 20.90],
    popularLandmarks: [
      { name: 'Nashik Road', lat: 19.9534, lng: 73.8340, description: 'Nashik Road Station' }
    ]
  }
];

// Ray-casting point-in-polygon algorithm for true administrative geometry verification
export function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getDistrictById(districtId: string): AdministrativeDistrict | undefined {
  return SUPPORTED_DISTRICTS.find(d => d.id === districtId.toLowerCase());
}

export function validateDistrictLocation(
  lat: number,
  lng: number,
  districtId: string
): DistrictValidationResult {
  const district = getDistrictById(districtId);
  if (!district) {
    return {
      valid: false,
      status: 'outside',
      isOfficialGeometry: false,
      boundaryType: 'bounding_box',
      message: 'Unknown district selected.'
    };
  }

  // 1. Ray-casting verification if boundary polygon geometry is defined
  if (district.polygon && district.polygon.length > 3) {
    const inside = pointInPolygon([lat, lng], district.polygon);
    if (inside) {
      if (district.isApproximatedBoundary) {
        return {
          valid: true,
          status: 'uncertain',
          isOfficialGeometry: false,
          boundaryType: 'approximated_polygon',
          message: `Point falls within approximated ${district.name} boundary model. Official cadastral boundary geometry unavailable; validation is uncertain.`
        };
      }
      return {
        valid: true,
        status: 'verified',
        isOfficialGeometry: true,
        boundaryType: 'official_polygon',
        message: `Verified inside official ${district.name} district administrative boundary geometry.`
      };
    } else {
      return {
        valid: false,
        status: 'outside',
        isOfficialGeometry: false,
        boundaryType: district.isApproximatedBoundary ? 'approximated_polygon' : 'official_polygon',
        message: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)}) is outside ${district.name} boundary.`
      };
    }
  }

  // 2. Regional bounding box check when polygon geometry is not provided
  const [minLng, minLat, maxLng, maxLat] = district.bbox;
  if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
    return {
      valid: true,
      status: 'uncertain',
      isOfficialGeometry: false,
      boundaryType: 'bounding_box',
      message: `Point is within ${district.name} regional bounding box. Official boundary geometry is unavailable; validation is uncertain.`
    };
  }

  return {
    valid: false,
    status: 'outside',
    isOfficialGeometry: false,
    boundaryType: 'bounding_box',
    message: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)}) is outside ${district.name} regional bounds.`
  };
}

// Configurable Geocoding Provider Interface
export interface GeocodingProvider {
  name: string;
  supportsAutocomplete: boolean;
  search(query: string, options: GeocodingSearchOptions, signal?: AbortSignal): Promise<GeocodingResult[]>;
  reverse(lat: number, lng: number, signal?: AbortSignal): Promise<GeocodingResult | null>;
}

// 1. OpenStreetMap Nominatim Provider (Default / Free / No API Key required)
// Adheres strictly to Nominatim TOS: Explicit submit only, NO keystroke autocomplete.
export class NominatimProvider implements GeocodingProvider {
  name = 'OpenStreetMap (Nominatim)';
  supportsAutocomplete = false;

  async search(query: string, options: GeocodingSearchOptions, signal?: AbortSignal): Promise<GeocodingResult[]> {
    if (!query || !query.trim()) return [];

    const district = options.district || 'Palghar';
    const state = options.state || 'Maharashtra';
    const country = options.country || 'India';
    const limit = options.limit || 8;

    const fullQuery = `${query.trim()}, ${district}, ${state}, ${country}`;
    let url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${encodeURIComponent(fullQuery)}`;

    if (options.bbox) {
      const [minLng, minLat, maxLng, maxLat] = options.bbox;
      // Nominatim viewbox format: left,top,right,bottom (minLng, maxLat, maxLng, minLat)
      url += `&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1`;
    }

    try {
      const response = await fetch(url, {
        signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VajraGrid-DisasterResponseSystem/2.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim request failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        // If bounded search returned empty, attempt broader query within state/district
        if (options.bbox) {
          const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query.trim() + ', ' + district)}`;
          const fallbackResp = await fetch(fallbackUrl, {
            signal,
            headers: { 'Accept': 'application/json', 'User-Agent': 'VajraGrid-DisasterResponseSystem/2.0' }
          });
          if (fallbackResp.ok) {
            const fallbackData = await fallbackResp.json();
            if (Array.isArray(fallbackData)) {
              return this.formatResults(fallbackData, options);
            }
          }
        }
        return [];
      }

      return this.formatResults(data, options);
    } catch (err: any) {
      if (err.name === 'AbortError') return [];
      console.warn('Nominatim geocoding error:', err);
      throw err;
    }
  }

  async reverse(lat: number, lng: number, signal?: AbortSignal): Promise<GeocodingResult | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`;
    try {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 2500);

      if (signal) {
        signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
      }

      const response = await fetch(url, {
        signal: timeoutController.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VajraGrid-DisasterResponseSystem/2.0'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) return null;
      const data = await response.json();
      if (!data || !data.display_name) return null;

      const addr = data.address || {};
      const primaryName = addr.amenity || addr.road || addr.suburb || addr.village || addr.town || addr.city || 'Selected Location';

      return {
        id: data.place_id ? String(data.place_id) : `pos_${lat}_${lng}`,
        name: primaryName,
        displayName: data.display_name,
        lat,
        lng,
        country: addr.country,
        state: addr.state,
        district: addr.county || addr.state_district,
        city: addr.city || addr.town || addr.village,
        suburb: addr.suburb || addr.neighbourhood,
        road: addr.road,
        addressStatus: 'verified'
      };
    } catch (err) {
      console.warn('Nominatim reverse geocoding error or timeout:', err);
      return null;
    }
  }

  private formatResults(items: any[], options: GeocodingSearchOptions): GeocodingResult[] {
    return items
      .filter((item: any) => {
        const addr = item.address || {};
        // Ensure state and district match if provided
        if (options.state && addr.state && !addr.state.toLowerCase().includes(options.state.toLowerCase())) {
          return false;
        }
        return true;
      })
      .map((item: any) => {
        const addr = item.address || {};
        const primary = addr.amenity || addr.road || addr.suburb || addr.village || addr.town || addr.city || item.name || 'Location';
        return {
          id: String(item.place_id || Math.random()),
          name: primary,
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          country: addr.country,
          state: addr.state,
          district: addr.county || addr.state_district,
          city: addr.city || addr.town || addr.village,
          suburb: addr.suburb,
          road: addr.road,
          addressStatus: 'verified'
        };
      });
  }
}

// 2. Geoapify Provider (Optional, when VITE_GEOAPIFY_API_KEY is configured)
export class GeoapifyProvider implements GeocodingProvider {
  name = 'Geoapify (Autocomplete Enabled)';
  supportsAutocomplete = true;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, options: GeocodingSearchOptions, signal?: AbortSignal): Promise<GeocodingResult[]> {
    if (!this.apiKey || !query.trim()) return [];
    let url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&apiKey=${this.apiKey}`;
    if (options.bbox) {
      url += `&filter=rect:${options.bbox.join(',')}`;
    }

    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Geoapify error: ${response.status}`);
      const data = await response.json();
      return (data.features || []).map((f: any) => ({
        id: f.properties.place_id || String(Math.random()),
        name: f.properties.name || f.properties.street || f.properties.formatted,
        displayName: f.properties.formatted,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        district: f.properties.county || f.properties.district,
        state: f.properties.state,
        country: f.properties.country,
        addressStatus: 'verified'
      }));
    } catch (err: any) {
      if (err.name === 'AbortError') return [];
      throw err;
    }
  }

  async reverse(lat: number, lng: number, signal?: AbortSignal): Promise<GeocodingResult | null> {
    if (!this.apiKey) return null;
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${this.apiKey}`;
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) return null;
      const data = await response.json();
      const f = data.features?.[0];
      if (!f) return null;
      return {
        id: f.properties.place_id || `pos_${lat}_${lng}`,
        name: f.properties.name || f.properties.street || 'Selected Point',
        displayName: f.properties.formatted,
        lat,
        lng,
        district: f.properties.county || f.properties.district,
        state: f.properties.state,
        country: f.properties.country,
        addressStatus: 'verified'
      };
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      return null;
    }
  }
}

// 3. LocationIQ Provider (Optional, when VITE_LOCATIONIQ_API_KEY is configured)
export class LocationIQProvider implements GeocodingProvider {
  name = 'LocationIQ (Autocomplete Enabled)';
  supportsAutocomplete = true;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, options: GeocodingSearchOptions, signal?: AbortSignal): Promise<GeocodingResult[]> {
    if (!this.apiKey || !query.trim()) return [];
    let url = `https://api.locationiq.com/v1/autocomplete?key=${this.apiKey}&q=${encodeURIComponent(query)}&limit=${options.limit || 8}&countrycodes=in&format=json`;
    if (options.bbox) {
      const [minLng, minLat, maxLng, maxLat] = options.bbox;
      url += `&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1`;
    }

    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`LocationIQ error: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        id: String(item.place_id || Math.random()),
        name: item.display_name?.split(',')[0] || item.display_place || 'Location',
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        district: options.district,
        state: options.state || 'Maharashtra',
        country: 'India',
        addressStatus: 'verified'
      }));
    } catch (err: any) {
      if (err.name === 'AbortError') return [];
      throw err;
    }
  }

  async reverse(lat: number, lng: number, signal?: AbortSignal): Promise<GeocodingResult | null> {
    if (!this.apiKey) return null;
    const url = `https://us1.locationiq.com/v1/reverse?key=${this.apiKey}&lat=${lat}&lon=${lng}&format=json`;
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data || !data.display_name) return null;
      return {
        id: String(data.place_id || `pos_${lat}_${lng}`),
        name: data.display_name.split(',')[0] || 'Selected Point',
        displayName: data.display_name,
        lat,
        lng,
        district: data.address?.county || data.address?.state_district,
        state: data.address?.state,
        country: data.address?.country,
        addressStatus: 'verified'
      };
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      return null;
    }
  }
}

export interface ProviderStatusInfo {
  providerId: 'nominatim' | 'geoapify' | 'locationiq';
  name: string;
  supportsAutocomplete: boolean;
  hasApiKey: boolean;
  instructions?: string;
}

export function getProviderInfo(): ProviderStatusInfo {
  const env = (import.meta as any).env || {};
  const preferred = env.VITE_GEOCODING_PROVIDER?.toLowerCase();

  if (preferred === 'geoapify' && env.VITE_GEOAPIFY_API_KEY) {
    return {
      providerId: 'geoapify',
      name: 'Geoapify Geocoding API',
      supportsAutocomplete: true,
      hasApiKey: true
    };
  }

  if (preferred === 'locationiq' && env.VITE_LOCATIONIQ_API_KEY) {
    return {
      providerId: 'locationiq',
      name: 'LocationIQ Autocomplete API',
      supportsAutocomplete: true,
      hasApiKey: true
    };
  }

  return {
    providerId: 'nominatim',
    name: 'OpenStreetMap Nominatim',
    supportsAutocomplete: false,
    hasApiKey: false,
    instructions: 'Explicit search & map selection active. Configure VITE_GEOAPIFY_API_KEY in .env for keystroke autocomplete.'
  };
}

// Provider Factory to instantiate configured provider
export function getActiveGeocodingProvider(): GeocodingProvider {
  const env = (import.meta as any).env || {};
  const preferred = env.VITE_GEOCODING_PROVIDER?.toLowerCase();

  if (preferred === 'geoapify' && env.VITE_GEOAPIFY_API_KEY) {
    return new GeoapifyProvider(env.VITE_GEOAPIFY_API_KEY);
  }

  if (preferred === 'locationiq' && env.VITE_LOCATIONIQ_API_KEY) {
    return new LocationIQProvider(env.VITE_LOCATIONIQ_API_KEY);
  }

  // Default to Nominatim (OpenStreetMap, explicit search, no API key required)
  return new NominatimProvider();
}

export const geocodingService = getActiveGeocodingProvider();

// Deterministic fallback address generator when remote reverse geocoding is unavailable
// Returns an inferred/approximate address label and PRESERVES the exact user-clicked or dragged coordinates (lat, lng).
// Sets addressStatus: 'inferred' - NEVER marks the address as verified.
export function fallbackReverseGeocode(lat: number, lng: number, districtId: string = 'palghar'): GeocodingResult {
  const district = getDistrictById(districtId) || SUPPORTED_DISTRICTS[0];
  const landmarks = district.popularLandmarks || [];

  if (landmarks.length === 0) {
    return {
      id: `pos_${lat.toFixed(4)}_${lng.toFixed(4)}`,
      name: `Point in ${district.name} (Inferred)`,
      displayName: `[Approximate / Inferred] Point at ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E, ${district.name} District, Maharashtra, India`,
      lat, // Exact user-selected coordinate preserved
      lng, // Exact user-selected coordinate preserved
      district: district.name,
      state: 'Maharashtra',
      country: 'India',
      addressStatus: 'inferred'
    };
  }

  let closest = landmarks[0];
  let minDistance = Number.MAX_VALUE;

  for (const item of landmarks) {
    const d = Math.hypot(item.lat - lat, item.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = item;
    }
  }

  const distKm = minDistance * 111;
  const isClose = distKm < 0.6;
  const displayName = isClose
    ? `[Approximate / Inferred] Vicinity of ${closest.name} (${closest.description}), ${district.name} District, Maharashtra`
    : `[Approximate / Inferred] ~${distKm.toFixed(1)} km from ${closest.name}, ${district.name} District, Maharashtra`;

  return {
    id: `pos_${lat.toFixed(4)}_${lng.toFixed(4)}`,
    name: `Near ${closest.name} (Inferred)`,
    displayName,
    lat, // Exact user-selected coordinate preserved
    lng, // Exact user-selected coordinate preserved
    district: district.name,
    state: 'Maharashtra',
    country: 'India',
    addressStatus: 'inferred'
  };
}

