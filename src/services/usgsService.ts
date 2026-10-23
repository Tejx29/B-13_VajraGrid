import { USGSEarthquakeEvent, Incident, Severity, USGSFeedFrequency, USGSFeedStatusInfo } from '../types';
import { useState, useEffect } from 'react';

/**
 * Official USGS Earthquake GeoJSON Feeds
 * Source: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 * Updated every minute by USGS National Earthquake Information Center (NEIC).
 */
export const USGS_FEEDS: Record<USGSFeedFrequency, { name: string; url: string; description: string }> = {
  past_day_m25: {
    name: 'M2.5+ Earthquakes (Past 24h)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
    description: 'Worldwide earthquakes M2.5 and greater detected in the past 24 hours (Recommended default)',
  },
  past_day_all: {
    name: 'All Earthquakes (Past 24h)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
    description: 'All recorded earthquakes worldwide in the past 24 hours (includes micro-tremors)',
  },
  past_day_m45: {
    name: 'M4.5+ Earthquakes (Past 24h)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
    description: 'Moderate to major worldwide earthquakes (M4.5+) in the past 24 hours',
  },
  past_hour: {
    name: 'All Earthquakes (Past Hour)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
    description: 'Rapid near-realtime feed of all earthquakes recorded in the last 60 minutes',
  },
  past_month_sig: {
    name: 'Significant Earthquakes (Past 30d)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson',
    description: 'Significant earthquakes with widespread impact or high magnitude over the past 30 days',
  },
};

const CACHE_STORAGE_KEY = 'vajragrid_usgs_earthquakes_cache';
const CACHE_META_KEY = 'vajragrid_usgs_meta';
const REFRESH_INTERVAL_MS = 60000; // 60 seconds (matches USGS feed generation interval)
const STALE_THRESHOLD_MS = 180000; // 3 minutes without successful update marks feed as stale

/**
 * Operational Application Classification:
 * Magnitude to Severity indicator mapping.
 * NOTE: This is an application-level operational triage classification based on standard Richter/Moment
 * magnitude scale brackets. It is explicitly NOT an official USGS severity rating.
 */
export function deriveEarthquakeSeverity(magnitude: number | null): {
  severity: Severity;
  explanation: string;
} {
  if (magnitude === null || magnitude === undefined || isNaN(magnitude)) {
    return {
      severity: 'low',
      explanation: 'Application Classification: Low (Unspecified magnitude)',
    };
  }
  if (magnitude >= 6.0) {
    return {
      severity: 'critical',
      explanation: 'Application Classification: Critical (Magnitude ≥ 6.0, major seismic potential)',
    };
  }
  if (magnitude >= 4.5) {
    return {
      severity: 'high',
      explanation: 'Application Classification: High (Magnitude 4.5–5.9, moderate to strong event)',
    };
  }
  if (magnitude >= 2.5) {
    return {
      severity: 'medium',
      explanation: 'Application Classification: Medium (Magnitude 2.5–4.4, light to minor event)',
    };
  }
  return {
    severity: 'low',
    explanation: 'Application Classification: Low (Magnitude < 2.5, micro-earthquake)',
  };
}

/**
 * Normalizes a raw USGS GeoJSON feature into a robust USGSEarthquakeEvent.
 * Validates coordinates, handles missing fields safely, preserves stable IDs.
 */
export function normalizeUSGSEvent(feature: any, retrievedAt: string): USGSEarthquakeEvent | null {
  if (!feature || typeof feature !== 'object') return null;

  const props = feature.properties || {};
  const geom = feature.geometry || {};
  const coords = geom.coordinates;

  // GeoJSON coordinate format: [longitude, latitude, depth]
  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }

  const longitude = Number(coords[0]);
  const latitude = Number(coords[1]);
  const depthKm = coords.length > 2 && typeof coords[2] === 'number' && !isNaN(coords[2]) ? Number(coords[2]) : undefined;

  // Strictly validate latitude (-90 to 90) and longitude (-180 to 180)
  if (
    isNaN(longitude) ||
    isNaN(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  const rawMag = props.mag;
  const magnitude = typeof rawMag === 'number' && !isNaN(rawMag) ? rawMag : null;
  const { severity, explanation } = deriveEarthquakeSeverity(magnitude);

  const sourceId = String(feature.id || props.code || `usgs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const eventTimeMs = typeof props.time === 'number' ? props.time : Date.now();
  const eventTime = new Date(eventTimeMs).toISOString();
  const updatedTime = typeof props.updated === 'number' ? new Date(props.updated).toISOString() : undefined;

  const place = (props.place && typeof props.place === 'string') ? props.place.trim() : 'Location not specified';
  const defaultTitle = magnitude !== null ? `M ${magnitude.toFixed(1)} - ${place}` : `Earthquake - ${place}`;
  const title = (props.title && typeof props.title === 'string') ? props.title.trim() : defaultTitle;
  const sourceUrl = (props.url && typeof props.url === 'string') ? props.url : `https://earthquake.usgs.gov/earthquakes/eventpage/${sourceId}`;

  return {
    sourceId,
    type: 'Earthquake',
    title,
    magnitude,
    magnitudeType: props.magType || undefined,
    latitude,
    longitude,
    depthKm,
    eventTime,
    updatedTime,
    retrievedAt,
    source: 'USGS',
    sourceUrl,
    detailUrl: props.detail || undefined,
    place,
    status: props.status || undefined,
    significance: typeof props.sig === 'number' ? props.sig : undefined,
    tsunami: typeof props.tsunami === 'number' ? props.tsunami : 0,
    derivedSeverity: severity,
    severityExplanation: explanation,
    isRealData: true,
  };
}

/**
 * Projects a USGSEarthquakeEvent into an Incident record for seamless integration
 * with map markers and existing incident detail popups.
 * Crucially distinguishes real observations from manual demo records.
 */
export function earthquakeToIncident(event: USGSEarthquakeEvent): Incident {
  const urgencyMap: Record<Severity, 'Low' | 'Medium' | 'High' | 'Critical'> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  const magStr = event.magnitude !== null ? `M${event.magnitude.toFixed(1)}` : 'M?';
  const depthStr = event.depthKm !== undefined ? ` • Depth: ${event.depthKm.toFixed(1)} km` : '';
  const tsunamiWarning = event.tsunami === 1 ? ' • TSUNAMI ADVISORY ISSUED' : '';

  return {
    id: `usgs_${event.sourceId}`,
    title: event.title,
    description: `Official USGS Seismic Detection: ${magStr} earthquake near ${event.place}${depthStr}${tsunamiWarning}. Status: ${event.status || 'recorded'}. Official USGS Event ID: ${event.sourceId}. Application triage classification: ${event.derivedSeverity.toUpperCase()}.`,
    location: {
      lat: event.latitude,
      lng: event.longitude,
      address: event.place,
      verificationStatus: 'verified',
    },
    timestamp: event.eventTime,
    reporterId: 'usgs_neic',
    reporterRole: 'authority',
    source: 'USGS Live Feed',
    type: 'Earthquake',
    urgency: urgencyMap[event.derivedSeverity],
    assignedTeam: 'External Sensor Telemetry',
    status: 'pending', // NOT automatically verified as emergency or dispatched
    mediaUrls: [],
    isRealData: true,
    aiAnalysis: {
      severity: event.derivedSeverity,
      confidenceScore: 1.0, // Real instrument telemetry
      tags: ['earthquake', 'usgs-real-feed', 'seismic', magStr.toLowerCase()],
      isDuplicate: false,
      recommendedAction: event.derivedSeverity === 'critical' || event.derivedSeverity === 'high'
        ? 'Monitor regional seismic aftershocks and review coastal tsunami advisories.'
        : 'Automated seismic telemetry record. No immediate local action required.',
    },
    externalMeta: {
      source: 'USGS',
      sourceId: event.sourceId,
      magnitude: event.magnitude,
      magnitudeType: event.magnitudeType,
      depthKm: event.depthKm,
      place: event.place,
      url: event.sourceUrl,
      detailUrl: event.detailUrl,
      eventStatus: event.status,
      retrievedAt: event.retrievedAt,
      tsunami: event.tsunami,
      significance: event.significance,
      derivedSeverityExplanation: event.severityExplanation,
      isRealData: true,
    },
  };
}

class USGSService {
  private eventsMap = new Map<string, USGSEarthquakeEvent>();
  private activeFeedKey: USGSFeedFrequency = 'past_day_m25';
  private isLoading = false;
  private lastSuccessfulUpdate: string | null = null;
  private error: string | null = null;
  private pollingTimer: any = null;
  private subscribers = new Set<(status: USGSFeedStatusInfo, events: USGSEarthquakeEvent[]) => void>();

  constructor() {
    this.loadFromCache();
  }

  private loadFromCache() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY);
      const meta = localStorage.getItem(CACHE_META_KEY);

      if (cached) {
        const parsed: USGSEarthquakeEvent[] = JSON.parse(cached);
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
        if (metaObj.activeFeedKey && USGS_FEEDS[metaObj.activeFeedKey as USGSFeedFrequency]) {
          this.activeFeedKey = metaObj.activeFeedKey;
        }
      }
    } catch (err) {
      console.warn('Failed to parse USGS cached data:', err);
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
          activeFeedKey: this.activeFeedKey,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }

  public getActiveFeedKey(): USGSFeedFrequency {
    return this.activeFeedKey;
  }

  public setFeed(frequency: USGSFeedFrequency) {
    if (this.activeFeedKey !== frequency && USGS_FEEDS[frequency]) {
      this.activeFeedKey = frequency;
      this.fetchEarthquakes();
    }
  }

  public getFeedInfo(): { key: USGSFeedFrequency; name: string; url: string; description: string } {
    const config = USGS_FEEDS[this.activeFeedKey];
    return {
      key: this.activeFeedKey,
      name: config.name,
      url: config.url,
      description: config.description,
    };
  }

  public getStatusInfo(): USGSFeedStatusInfo {
    const config = USGS_FEEDS[this.activeFeedKey];
    let status: USGSFeedStatusInfo['status'] = 'idle';

    if (this.isLoading) {
      status = 'loading';
    } else if (this.error) {
      status = 'error';
    } else if (this.lastSuccessfulUpdate) {
      const elapsed = Date.now() - new Date(this.lastSuccessfulUpdate).getTime();
      status = elapsed > STALE_THRESHOLD_MS ? 'stale' : 'live';
    }

    return {
      status,
      lastSuccessfulUpdate: this.lastSuccessfulUpdate,
      error: this.error,
      totalCount: this.eventsMap.size,
      feedUrl: config.url,
      feedName: config.name,
    };
  }

  public getEarthquakes(): USGSEarthquakeEvent[] {
    return Array.from(this.eventsMap.values()).sort(
      (a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
    );
  }

  public getEarthquakeIncidents(): Incident[] {
    return this.getEarthquakes().map(earthquakeToIncident);
  }

  public subscribe(callback: (status: USGSFeedStatusInfo, events: USGSEarthquakeEvent[]) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getStatusInfo(), this.getEarthquakes());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    const status = this.getStatusInfo();
    const events = this.getEarthquakes();
    this.subscribers.forEach((cb) => {
      try {
        cb(status, events);
      } catch (err) {
        console.error('USGS subscriber error:', err);
      }
    });
  }

  /**
   * Fetches the selected USGS earthquake GeoJSON feed.
   * Handles deduplication: updates existing records by sourceId, avoiding duplicate database entries.
   */
  public async fetchEarthquakes(): Promise<{ success: boolean; count: number; error?: string }> {
    const feedConfig = USGS_FEEDS[this.activeFeedKey];
    this.isLoading = true;
    this.error = null;
    this.notifySubscribers();

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = setTimeout(() => {
      if (controller) controller.abort();
    }, 12000);

    try {
      const response = await fetch(feedConfig.url, {
        signal: controller ? controller.signal : undefined,
        headers: {
          Accept: 'application/geo+json, application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`USGS feed HTTP ${response.status}: ${response.statusText}`);
      }

      const geoJson = await response.json();

      if (!geoJson || !Array.isArray(geoJson.features)) {
        throw new Error('Invalid GeoJSON payload: missing features collection');
      }

      const retrievalTimestamp = new Date().toISOString();
      let updatedCount = 0;
      let newCount = 0;

      for (const feature of geoJson.features) {
        const normalized = normalizeUSGSEvent(feature, retrievalTimestamp);
        if (normalized) {
          if (this.eventsMap.has(normalized.sourceId)) {
            // Update existing event to avoid duplicate records
            const existing = this.eventsMap.get(normalized.sourceId)!;
            this.eventsMap.set(normalized.sourceId, {
              ...existing,
              title: normalized.title,
              magnitude: normalized.magnitude,
              magnitudeType: normalized.magnitudeType,
              latitude: normalized.latitude,
              longitude: normalized.longitude,
              depthKm: normalized.depthKm,
              updatedTime: normalized.updatedTime,
              retrievedAt: retrievalTimestamp,
              status: normalized.status,
              significance: normalized.significance,
              tsunami: normalized.tsunami,
              derivedSeverity: normalized.derivedSeverity,
              severityExplanation: normalized.severityExplanation,
            });
            updatedCount++;
          } else {
            this.eventsMap.set(normalized.sourceId, normalized);
            newCount++;
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
      clearTimeout(timeoutId);
      const isAbort = err?.name === 'AbortError';
      const msg = isAbort
        ? 'USGS feed request timed out (12s). Using cached seismic telemetry.'
        : (err?.message || 'Failed to connect to USGS Earthquake feed');

      this.error = msg;
      console.warn('USGS feed fetch warning:', msg);

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
    // Initial fetch if cache is empty or older than 60s
    if (this.eventsMap.size === 0 || !this.lastSuccessfulUpdate || Date.now() - new Date(this.lastSuccessfulUpdate).getTime() > 60000) {
      this.fetchEarthquakes();
    }
    this.pollingTimer = setInterval(() => {
      this.fetchEarthquakes();
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
export const usgsService = new USGSService();

// Auto-start polling in browser environments
if (typeof window !== 'undefined') {
  usgsService.startPolling();
}

/**
 * Custom React Hook for components to subscribe to USGS earthquake telemetry
 */
export function useUSGSEarthquakes() {
  const [events, setEvents] = useState<USGSEarthquakeEvent[]>(() => usgsService.getEarthquakes());
  const [statusInfo, setStatusInfo] = useState<USGSFeedStatusInfo>(() => usgsService.getStatusInfo());

  useEffect(() => {
    const unsubscribe = usgsService.subscribe((newStatus, newEvents) => {
      setStatusInfo(newStatus);
      setEvents(newEvents);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refresh = () => usgsService.fetchEarthquakes();
  const setFeed = (freq: USGSFeedFrequency) => usgsService.setFeed(freq);
  const earthquakeIncidents = events.map(earthquakeToIncident);

  return {
    events,
    incidents: earthquakeIncidents,
    statusInfo,
    refresh,
    setFeed,
    activeFeedKey: usgsService.getActiveFeedKey(),
  };
}
