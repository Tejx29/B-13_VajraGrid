import {
  FIRMSHotspotEvent,
  FIRMSSensorType,
  FIRMSFeedStatusInfo,
  Incident,
  Severity,
} from '../types';
import { useState, useEffect } from 'react';

/**
 * Supported NASA FIRMS Satellite Sensors
 * Prioritizes NOAA-20 and NOAA-21 VIIRS (375m high spatial resolution).
 * Source: https://firms.modaps.eosdis.nasa.gov/api/
 */
export const FIRMS_SENSORS: Record<
  FIRMSSensorType,
  { name: string; instrument: string; resolution: string; description: string }
> = {
  VIIRS_NOAA20_NRT: {
    name: 'VIIRS NOAA-20 NRT',
    instrument: 'VIIRS (NOAA-20 / JPSS-1)',
    resolution: '375m',
    description: 'NOAA-20 375m high-resolution active fire / thermal hotspot detection (Recommended primary)',
  },
  VIIRS_NOAA21_NRT: {
    name: 'VIIRS NOAA-21 NRT',
    instrument: 'VIIRS (NOAA-21 / JPSS-2)',
    resolution: '375m',
    description: 'NOAA-21 375m high-resolution near-real-time sensor telemetry',
  },
  VIIRS_SNPP_NRT: {
    name: 'VIIRS Suomi NPP NRT',
    instrument: 'VIIRS (Suomi NPP)',
    resolution: '375m',
    description: 'Suomi NPP VIIRS 375m thermal anomaly product',
  },
  MODIS_NRT: {
    name: 'MODIS NRT (Terra/Aqua)',
    instrument: 'MODIS (Terra & Aqua)',
    resolution: '1km',
    description: 'NASA EOS MODIS 1km global fire detection feed',
  },
};

/**
 * Standard Regional Extents for Fire Monitoring
 */
export const FIRMS_EXTENTS = {
  palghar_region: {
    name: 'Palghar & Western Maharashtra',
    value: '72.0,18.0,74.5,21.0',
    description: 'Palghar District, Western Ghats forest zone, and Mumbai Metropolitan border',
  },
  india: {
    name: 'All India (Country)',
    value: 'IND',
    description: 'Subcontinent-wide active satellite detections (ISO3: IND)',
  },
  world: {
    name: 'Global Extent',
    value: 'world',
    description: 'Worldwide satellite thermal detections',
  },
};

export type FIRMSExtentKey = keyof typeof FIRMS_EXTENTS;

const CACHE_STORAGE_KEY = 'vajragrid_firms_hotspots_cache';
const CACHE_META_KEY = 'vajragrid_firms_meta';
const REFRESH_INTERVAL_MS = 300000; // 5 minutes (matches satellite processing cadences)
const STALE_THRESHOLD_MS = 21600000; // 6 hours (satellite orbits occur 1-2 times daily)

/**
 * Normalizes detection confidence into a human-readable label
 */
export function normalizeFIRMSConfidence(
  rawConf: any,
  sensor: string
): { label: 'High' | 'Nominal' | 'Low' | string; value: string } {
  if (rawConf === undefined || rawConf === null) {
    return { label: 'Nominal', value: 'nominal' };
  }

  const str = String(rawConf).trim().toLowerCase();

  // VIIRS categorical confidence: 'h', 'n', 'l'
  if (str === 'h' || str === 'high') {
    return { label: 'High', value: 'high' };
  }
  if (str === 'n' || str === 'nominal') {
    return { label: 'Nominal', value: 'nominal' };
  }
  if (str === 'l' || str === 'low') {
    return { label: 'Low', value: 'low' };
  }

  // MODIS percentage confidence: 0 - 100
  const num = parseInt(str, 10);
  if (!isNaN(num)) {
    if (num >= 80) return { label: `High (${num}%)`, value: str };
    if (num >= 30) return { label: `Nominal (${num}%)`, value: str };
    return { label: `Low (${num}%)`, value: str };
  }

  return { label: str.toUpperCase(), value: str };
}

/**
 * Normalizes raw FIRMS data feature into a validated FIRMSHotspotEvent
 */
export function normalizeFIRMSEvent(feature: any, retrievedAt: string): FIRMSHotspotEvent | null {
  if (!feature || typeof feature !== 'object') return null;

  const lat = typeof feature.latitude === 'number' ? feature.latitude : parseFloat(feature.latitude);
  const lon = typeof feature.longitude === 'number' ? feature.longitude : parseFloat(feature.longitude);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  const dateStr = feature.acq_date || new Date().toISOString().slice(0, 10);
  let timeStr = feature.acq_time ? String(feature.acq_time).trim() : '0000';
  while (timeStr.length < 4) {
    timeStr = '0' + timeStr;
  }

  const hours = timeStr.slice(0, 2);
  const minutes = timeStr.slice(2, 4);
  const isoTimestamp = `${dateStr}T${hours}:${minutes}:00.000Z`;

  const satelliteCode = feature.satellite || 'N20';
  const sensorType = feature.instrument || 'VIIRS';

  // Construct stable, deterministic composite ID
  const sourceId = `firms_${satelliteCode}_${lat.toFixed(4)}_${lon.toFixed(4)}_${dateStr}_${timeStr}`;

  const bt4 = typeof feature.bright_ti4 === 'number' ? feature.bright_ti4 : feature.bright_ti4 ? parseFloat(feature.bright_ti4) : undefined;
  const bt5 = typeof feature.bright_ti5 === 'number' ? feature.bright_ti5 : feature.bright_ti5 ? parseFloat(feature.bright_ti5) : undefined;
  const frp = typeof feature.frp === 'number' ? feature.frp : feature.frp ? parseFloat(feature.frp) : undefined;

  const confInfo = normalizeFIRMSConfidence(feature.confidence, sensorType);

  let instrumentTitle = 'VIIRS (NOAA-20)';
  if (satelliteCode === 'N21') instrumentTitle = 'VIIRS (NOAA-21)';
  else if (satelliteCode === 'N') instrumentTitle = 'VIIRS (Suomi NPP)';
  else if (satelliteCode === 'T') instrumentTitle = 'MODIS (Terra)';
  else if (satelliteCode === 'A') instrumentTitle = 'MODIS (Aqua)';

  return {
    sourceId,
    type: 'Fire Hotspot',
    latitude: lat,
    longitude: lon,
    brightnessTempI4: bt4,
    brightnessTempI5: bt5,
    fireRadiativePower: frp,
    acqDate: dateStr,
    acqTime: `${hours}:${minutes} UTC`,
    timestamp: isoTimestamp,
    satellite: satelliteCode,
    sensor: sensorType,
    instrument: instrumentTitle,
    confidence: confInfo.value,
    confidenceLabel: confInfo.label,
    dayNight: feature.daynight === 'D' || feature.daynight === 'N' ? feature.daynight : undefined,
    scan: feature.scan,
    track: feature.track,
    version: feature.version,
    source: 'NASA FIRMS',
    sourceUrl: `https://firms.modaps.eosdis.nasa.gov/map/#d:${dateStr}..${dateStr};@${lon.toFixed(2)},${lat.toFixed(2)},12z`,
    retrievedAt,
    isRealData: true,
    rawProperties: feature,
  };
}

/**
 * Projects a FIRMSHotspotEvent into an operational Incident record.
 * Crucial: Labeled as a satellite observation, NOT automatically a confirmed disaster or emergency.
 */
export function fireToIncident(event: FIRMSHotspotEvent): Incident {
  const frpStr = event.fireRadiativePower !== undefined ? ` • FRP: ${event.fireRadiativePower.toFixed(1)} MW` : '';
  const bt4Str = event.brightnessTempI4 !== undefined ? ` • Temp: ${(event.brightnessTempI4 - 273.15).toFixed(1)}°C` : '';

  // Determine operational triage severity from FRP and confidence
  // Note: This is an application triage classification, not an official NASA rating.
  let severity: Severity = 'medium';
  if ((event.fireRadiativePower && event.fireRadiativePower >= 50) || event.confidence === 'high') {
    severity = 'high';
  } else if (event.confidence === 'low') {
    severity = 'low';
  }

  return {
    id: `firms_${event.sourceId}`,
    title: `Satellite Thermal Hotspot (${event.instrument})`,
    description: `NASA FIRMS Hotspot Detection: Observed by ${event.instrument} at ${event.acqTime} on ${event.acqDate}${frpStr}${bt4Str}. Confidence: ${event.confidenceLabel}. Ground verification recommended.`,
    location: {
      lat: event.latitude,
      lng: event.longitude,
      address: `Thermal Hotspot (${event.latitude.toFixed(3)}°, ${event.longitude.toFixed(3)}°)`,
      district: 'Palghar Region',
      state: 'Maharashtra',
      country: 'India',
      verificationStatus: 'unverified', // Satellite hotspots require ground confirmation
    },
    timestamp: event.timestamp,
    reporterId: 'nasa_firms_lance',
    reporterRole: 'authority',
    source: 'NASA FIRMS',
    type: 'Fire',
    urgency: severity === 'high' ? 'High' : 'Medium',
    status: 'pending',
    assignedTeam: 'Unassigned (Satellite Telemetry)',
    mediaUrls: [],
    isRealData: true,
    aiAnalysis: {
      severity,
      confidenceScore: 0.9,
      tags: ['fire', 'nasa-firms', 'thermal-hotspot', event.satellite.toLowerCase()],
      isDuplicate: false,
      recommendedAction:
        'Awaiting operator ground verification. Cross-reference forest beat patrols or local civil defense prior to dispatch.',
    },
    externalMeta: {
      source: 'NASA FIRMS',
      sourceId: event.sourceId,
      satellite: event.satellite,
      sensor: event.sensor,
      instrument: event.instrument,
      brightnessTempI4: event.brightnessTempI4,
      brightnessTempI5: event.brightnessTempI5,
      fireRadiativePower: event.fireRadiativePower,
      confidence: event.confidence,
      confidenceLabel: event.confidenceLabel,
      dayNight: event.dayNight,
      acqDate: event.acqDate,
      acqTime: event.acqTime,
      url: event.sourceUrl,
      retrievedAt: event.retrievedAt,
      isRealData: true,
    },
  };
}

class FIRMSService {
  private eventsMap = new Map<string, FIRMSHotspotEvent>();
  private activeSensor: FIRMSSensorType = 'VIIRS_NOAA20_NRT';
  private activeExtentKey: FIRMSExtentKey = 'palghar_region';
  private isLoading = false;
  private lastSuccessfulUpdate: string | null = null;
  private error: string | null = null;
  private isConfigured = false;
  private pollingTimer: any = null;
  private subscribers = new Set<(status: FIRMSFeedStatusInfo, events: FIRMSHotspotEvent[]) => void>();

  constructor() {
    this.loadFromCache();
    this.checkConfigStatus();
  }

  private loadFromCache() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY);
      const meta = localStorage.getItem(CACHE_META_KEY);

      if (cached) {
        const parsed: FIRMSHotspotEvent[] = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          this.eventsMap.clear();
          for (const ev of parsed) {
            if (ev.sourceId && typeof ev.latitude === 'number' && typeof ev.longitude === 'number') {
              this.eventsMap.set(ev.sourceId, ev);
            }
          }
        }
      }

      if (meta) {
        const metaObj = JSON.parse(meta);
        this.lastSuccessfulUpdate = metaObj.lastSuccessfulUpdate || null;
        if (metaObj.activeSensor && FIRMS_SENSORS[metaObj.activeSensor as FIRMSSensorType]) {
          this.activeSensor = metaObj.activeSensor;
        }
        if (metaObj.activeExtentKey && FIRMS_EXTENTS[metaObj.activeExtentKey as FIRMSExtentKey]) {
          this.activeExtentKey = metaObj.activeExtentKey;
        }
      }
    } catch (err) {
      console.warn('Failed to parse cached FIRMS data:', err);
    }
  }

  private saveToCache() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    try {
      const events = Array.from(this.eventsMap.values());
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(events));
      localStorage.setItem(
        CACHE_META_KEY,
        JSON.stringify({
          lastSuccessfulUpdate: this.lastSuccessfulUpdate,
          activeSensor: this.activeSensor,
          activeExtentKey: this.activeExtentKey,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }

  public async checkConfigStatus(): Promise<boolean> {
    try {
      const res = await fetch('/api/firms/status');
      if (res.ok) {
        const data = await res.json();
        this.isConfigured = Boolean(data.configured);
      } else {
        this.isConfigured = false;
      }
    } catch {
      // In case server proxy is not reachable yet
      this.isConfigured = false;
    }
    this.notifySubscribers();
    return this.isConfigured;
  }

  public getActiveSensor(): FIRMSSensorType {
    return this.activeSensor;
  }

  public getActiveExtentKey(): FIRMSExtentKey {
    return this.activeExtentKey;
  }

  public setSensor(sensor: FIRMSSensorType) {
    if (this.activeSensor !== sensor && FIRMS_SENSORS[sensor]) {
      this.activeSensor = sensor;
      this.fetchHotspots();
    }
  }

  public setExtent(extentKey: FIRMSExtentKey) {
    if (this.activeExtentKey !== extentKey && FIRMS_EXTENTS[extentKey]) {
      this.activeExtentKey = extentKey;
      this.fetchHotspots();
    }
  }

  public getStatusInfo(): FIRMSFeedStatusInfo {
    const sensorInfo = FIRMS_SENSORS[this.activeSensor];
    const extentInfo = FIRMS_EXTENTS[this.activeExtentKey];

    let status: FIRMSFeedStatusInfo['status'] = 'idle';

    if (!this.isConfigured && !this.lastSuccessfulUpdate) {
      status = 'unconfigured';
    } else if (this.isLoading) {
      status = 'loading';
    } else if (this.error) {
      if (this.error.toLowerCase().includes('not configured')) {
        status = 'unconfigured';
      } else {
        status = 'offline';
      }
    } else if (this.lastSuccessfulUpdate) {
      const elapsed = Date.now() - new Date(this.lastSuccessfulUpdate).getTime();
      status = elapsed > STALE_THRESHOLD_MS ? 'stale' : 'live';
    } else {
      status = 'unconfigured';
    }

    return {
      status,
      lastSuccessfulUpdate: this.lastSuccessfulUpdate,
      error: this.error,
      totalCount: this.eventsMap.size,
      sensor: this.activeSensor,
      sensorName: sensorInfo?.name || this.activeSensor,
      extent: extentInfo?.name || this.activeExtentKey,
      isConfigured: this.isConfigured,
    };
  }

  public getHotspots(): FIRMSHotspotEvent[] {
    return Array.from(this.eventsMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getHotspotIncidents(): Incident[] {
    return this.getHotspots().map(fireToIncident);
  }

  public subscribe(callback: (status: FIRMSFeedStatusInfo, events: FIRMSHotspotEvent[]) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getStatusInfo(), this.getHotspots());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    const status = this.getStatusInfo();
    const events = this.getHotspots();
    this.subscribers.forEach((cb) => {
      try {
        cb(status, events);
      } catch (err) {
        console.error('FIRMS subscriber callback error:', err);
      }
    });
  }

  /**
   * Fetches NASA FIRMS hotspots via the secure server proxy endpoint.
   * Handles deduplication: updates existing records by composite sourceId.
   */
  public async fetchHotspots(): Promise<{ success: boolean; count: number; error?: string }> {
    this.isLoading = true;
    this.error = null;
    this.notifySubscribers();

    const extentConfig = FIRMS_EXTENTS[this.activeExtentKey];
    const queryParams = new URLSearchParams({
      sensor: this.activeSensor,
      extent: extentConfig.value,
      days: '1',
    });

    try {
      const response = await fetch(`/api/firms/hotspots?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Server proxy error: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'unconfigured') {
        this.isConfigured = false;
        this.error = data.message || 'NASA MAP_KEY is unconfigured in server environment.';
        return {
          success: false,
          count: this.eventsMap.size,
          error: this.error,
        };
      }

      this.isConfigured = true;

      if (data.status === 'error' || data.status === 'offline') {
        throw new Error(data.error || 'Failed to query NASA FIRMS feed');
      }

      const retrievalTimestamp = data.retrievedAt || new Date().toISOString();
      const rawEvents = Array.isArray(data.events) ? data.events : [];

      for (const item of rawEvents) {
        const normalized = normalizeFIRMSEvent(item, retrievalTimestamp);
        if (normalized) {
          if (this.eventsMap.has(normalized.sourceId)) {
            // Update existing observation with latest calibration fields
            const existing = this.eventsMap.get(normalized.sourceId)!;
            this.eventsMap.set(normalized.sourceId, {
              ...existing,
              brightnessTempI4: normalized.brightnessTempI4,
              brightnessTempI5: normalized.brightnessTempI5,
              fireRadiativePower: normalized.fireRadiativePower,
              confidence: normalized.confidence,
              confidenceLabel: normalized.confidenceLabel,
              retrievedAt: retrievalTimestamp,
            });
          } else {
            this.eventsMap.set(normalized.sourceId, normalized);
          }
        }
      }

      this.lastSuccessfulUpdate = retrievalTimestamp;
      this.error = null;
      this.saveToCache();

      return {
        success: true,
        count: this.eventsMap.size,
      };
    } catch (err: any) {
      const msg = err?.message || 'Unable to connect to NASA FIRMS service';
      this.error = msg;
      return {
        success: false,
        count: this.eventsMap.size,
        error: msg,
      };
    } finally {
      this.isLoading = false;
      this.notifySubscribers();
    }
  }

  public startPolling(intervalMs: number = REFRESH_INTERVAL_MS) {
    if (this.pollingTimer) return;
    this.fetchHotspots();
    this.pollingTimer = setInterval(() => {
      this.fetchHotspots();
    }, intervalMs);
  }

  public stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}

// Export singleton instance
export const firmsService = new FIRMSService();

if (typeof window !== 'undefined') {
  firmsService.startPolling();
}

/**
 * Custom React Hook for components to consume NASA FIRMS fire detection telemetry
 */
export function useFIRMSHotspots() {
  const [events, setEvents] = useState<FIRMSHotspotEvent[]>(() => firmsService.getHotspots());
  const [statusInfo, setStatusInfo] = useState<FIRMSFeedStatusInfo>(() => firmsService.getStatusInfo());

  useEffect(() => {
    const unsubscribe = firmsService.subscribe((newStatus, newEvents) => {
      setStatusInfo(newStatus);
      setEvents(newEvents);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refresh = () => firmsService.fetchHotspots();
  const setSensor = (s: FIRMSSensorType) => firmsService.setSensor(s);
  const setExtent = (e: FIRMSExtentKey) => firmsService.setExtent(e);
  const hotspotIncidents = events.map(fireToIncident);

  return {
    events,
    incidents: hotspotIncidents,
    statusInfo,
    refresh,
    setSensor,
    setExtent,
    activeSensor: firmsService.getActiveSensor(),
    activeExtent: firmsService.getActiveExtentKey(),
  };
}
