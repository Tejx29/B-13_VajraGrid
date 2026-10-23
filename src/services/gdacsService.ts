import { GDACSEvent, GDACSEventType, GDACSAlertLevel, GDACSFeedStatusInfo, Incident, Severity } from '../types';
import { useState, useEffect } from 'react';

/**
 * Official GDACS (Global Disaster Alert and Coordination System) API Endpoints
 * GDACS is a cooperation framework between the United Nations and the European Commission.
 * Source: https://www.gdacs.org/gdacsapi/swagger/index.html
 */
export const GDACS_FEEDS = {
  all: {
    name: 'All Multi-Hazard Feeds (Floods & Cyclones)',
    type: 'all' as const,
    description: 'Near-real-time global flood and tropical cyclone disaster observations',
  },
  FL: {
    name: 'GDACS Floods (GLOFAS)',
    type: 'FL' as const,
    url: 'https://www.gdacs.org/gdacsapi/api/Events/geteventlist/map?eventtype=FL',
    description: 'Global Flood Awareness System satellite & hydrological flood detections',
  },
  TC: {
    name: 'GDACS Tropical Cyclones',
    type: 'TC' as const,
    url: 'https://www.gdacs.org/gdacsapi/api/Events/geteventlist/map?eventtype=TC',
    description: 'Near-real-time tropical cyclone tracking, storm tracks and intensity models',
  },
};

const CACHE_STORAGE_KEY = 'vajragrid_gdacs_events_cache';
const CACHE_META_KEY = 'vajragrid_gdacs_meta';
const REFRESH_INTERVAL_MS = 300000; // 5 minutes
const STALE_THRESHOLD_MS = 900000; // 15 minutes

/**
 * Operational Application Classification:
 * Maps official GDACS Alert Level ('Red' | 'Orange' | 'Green') to internal triage severity.
 * Crucial: Preserves official GDACS alert rating explicitly while providing application severity.
 */
export function deriveGDACSSeverity(
  alertLevel: string,
  alertScore?: number
): { severity: Severity; explanation: string } {
  const level = (alertLevel || '').trim().toLowerCase();

  if (level === 'red') {
    return {
      severity: 'critical',
      explanation: 'Application Classification: Critical (GDACS Official Red Alert: Major humanitarian impact expected)',
    };
  }
  if (level === 'orange') {
    return {
      severity: 'high',
      explanation: 'Application Classification: High (GDACS Official Orange Alert: Moderate humanitarian impact expected)',
    };
  }
  if (level === 'green') {
    if (typeof alertScore === 'number' && alertScore >= 1) {
      return {
        severity: 'medium',
        explanation: 'Application Classification: Medium (GDACS Official Green Alert with elevated score)',
      };
    }
    return {
      severity: 'low',
      explanation: 'Application Classification: Low (GDACS Official Green Alert: Low humanitarian impact expected)',
    };
  }

  return {
    severity: 'medium',
    explanation: 'Application Classification: Medium (GDACS Advisory observation)',
  };
}

/**
 * Normalizes a raw GDACS GeoJSON feature into a typed GDACSEvent.
 * Validates coordinates, sanitizes strings, retains source event ID and episode ID.
 */
export function normalizeGDACSEvent(feature: any, retrievedAt: string): GDACSEvent | null {
  if (!feature || typeof feature !== 'object') return null;

  const props = feature.properties || {};
  const geom = feature.geometry || {};
  const coords = geom.coordinates;

  // Standard GeoJSON Point coordinates: [longitude, latitude]
  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }

  const longitude = Number(coords[0]);
  const latitude = Number(coords[1]);

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

  const rawEventType = String(props.eventtype || 'FL').toUpperCase();
  const eventId = Number(props.eventid) || 0;
  const episodeId = Number(props.episodeid) || 0;

  // Stable, deterministic composite key
  const sourceId = `gdacs_${rawEventType}_${eventId}_${episodeId}`;

  const officialAlertLevel = (props.alertlevel || props.episodealertlevel || 'Green') as GDACSAlertLevel;
  const alertScore = typeof props.alertscore === 'number' ? props.alertscore : undefined;
  const { severity, explanation } = deriveGDACSSeverity(officialAlertLevel, alertScore);

  const eventTypeLabel =
    rawEventType === 'FL'
      ? 'Flood'
      : rawEventType === 'TC'
      ? 'Tropical Cyclone'
      : rawEventType === 'DR'
      ? 'Drought'
      : rawEventType === 'EQ'
      ? 'Earthquake'
      : rawEventType === 'VO'
      ? 'Volcano'
      : rawEventType;

  const name = props.name || props.eventname || `${eventTypeLabel} in ${props.country || 'Region'}`;
  const description = props.description || props.htmldescription?.replace(/<[^>]*>?/gm, '') || `${officialAlertLevel} alert for ${name}`;

  const reportUrl =
    props.url?.report ||
    `https://www.gdacs.org/report.aspx?eventid=${eventId}&episodeid=${episodeId}&eventtype=${rawEventType}`;

  let bbox: [number, number, number, number] | undefined;
  if (Array.isArray(feature.bbox) && feature.bbox.length === 4) {
    bbox = [
      Number(feature.bbox[0]),
      Number(feature.bbox[1]),
      Number(feature.bbox[2]),
      Number(feature.bbox[3]),
    ];
  }

  return {
    sourceId,
    eventId,
    episodeId,
    eventType: rawEventType,
    eventTypeLabel,
    eventName: props.eventname || '',
    name,
    description,
    htmlDescription: props.htmldescription,
    alertLevel: officialAlertLevel,
    alertScore,
    episodeAlertLevel: props.episodealertlevel,
    episodeAlertScore: props.episodealertscore,
    country: props.country,
    iso3: props.iso3,
    latitude,
    longitude,
    bbox,
    fromDate: props.fromdate,
    toDate: props.todate,
    dateModified: props.datemodified,
    source: props.source || 'GDACS',
    sourceUrl: reportUrl,
    geometryUrl: props.url?.geometry,
    detailsUrl: props.url?.details,
    severityText: props.severitydata?.severitytext,
    derivedSeverity: severity,
    derivedSeverityExplanation: explanation,
    retrievedAt,
    isRealData: true,
    rawProperties: props,
  };
}

/**
 * Projects a GDACSEvent into an operational Incident record for unified viewing.
 * Crucial: Labeled as an external GDACS observation, requiring local authority assessment.
 */
export function gdacsToIncident(event: GDACSEvent): Incident {
  const alertBadge = `[GDACS ${event.alertLevel.toUpperCase()} ALERT]`;
  const dates = event.fromDate ? ` • From: ${new Date(event.fromDate).toLocaleDateString()}` : '';

  return {
    id: `gdacs_${event.sourceId}`,
    title: `${event.name}`,
    description: `${alertBadge} ${event.description}${dates}. Source: ${event.source} / GDACS. External hazard advisory - requires district operational assessment prior to response.`,
    location: {
      lat: event.latitude,
      lng: event.longitude,
      address: `${event.name} (${event.country || 'International'})`,
      country: event.country || 'International',
      district: 'GDACS Monitoring Area',
      verificationStatus: 'unverified',
    },
    timestamp: event.dateModified || event.fromDate || event.retrievedAt,
    reporterId: 'gdacs_un_ec',
    reporterRole: 'authority',
    source: 'GDACS',
    type: event.eventTypeLabel,
    urgency: event.derivedSeverity === 'critical' ? 'Critical' : event.derivedSeverity === 'high' ? 'High' : 'Medium',
    status: 'pending',
    assignedTeam: 'Unassigned (External Observation)',
    mediaUrls: [],
    isRealData: true,
    aiAnalysis: {
      severity: event.derivedSeverity,
      confidenceScore: event.alertLevel === 'Red' ? 0.95 : event.alertLevel === 'Orange' ? 0.85 : 0.75,
      tags: ['gdacs', event.eventType.toLowerCase(), event.alertLevel.toLowerCase(), event.country?.toLowerCase() || 'international'],
      isDuplicate: false,
      recommendedAction: event.derivedSeverityExplanation,
    },
    externalMeta: {
      source: 'GDACS',
      sourceId: event.sourceId,
      eventId: event.eventId,
      episodeId: event.episodeId,
      eventType: event.eventType,
      eventName: event.eventName,
      alertLevel: event.alertLevel,
      alertScore: event.alertScore,
      country: event.country,
      fromDate: event.fromDate,
      toDate: event.toDate,
      severityText: event.severityText,
      url: event.sourceUrl,
      retrievedAt: event.retrievedAt,
      isRealData: true,
    },
  };
}

class GDACSService {
  private eventsMap = new Map<string, GDACSEvent>();
  private activeEventType: 'all' | 'FL' | 'TC' = 'all';
  private isLoading = false;
  private lastSuccessfulUpdate: string | null = null;
  private error: string | null = null;
  private pollingTimer: any = null;
  private subscribers = new Set<(status: GDACSFeedStatusInfo, events: GDACSEvent[]) => void>();

  constructor() {
    this.loadFromCache();
    this.fetchEvents();
    this.startPolling();
  }

  private loadFromCache() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY);
      const meta = localStorage.getItem(CACHE_META_KEY);

      if (cached) {
        const parsed: GDACSEvent[] = JSON.parse(cached);
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
        if (metaObj.activeEventType) {
          this.activeEventType = metaObj.activeEventType;
        }
      }
    } catch (err) {
      console.warn('Failed to parse cached GDACS data:', err);
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
          activeEventType: this.activeEventType,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }

  public getEvents(): GDACSEvent[] {
    const list = Array.from(this.eventsMap.values());
    if (this.activeEventType === 'all') return list;
    return list.filter((e) => e.eventType === this.activeEventType);
  }

  public getIncidentProjections(): Incident[] {
    return this.getEvents().map(gdacsToIncident);
  }

  public getStatusInfo(): GDACSFeedStatusInfo {
    let status: GDACSFeedStatusInfo['status'] = 'idle';

    if (this.isLoading) {
      status = 'loading';
    } else if (this.error && this.eventsMap.size === 0) {
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
      activeEventType: this.activeEventType,
    };
  }

  public setEventType(type: 'all' | 'FL' | 'TC') {
    if (this.activeEventType === type) return;
    this.activeEventType = type;
    this.saveToCache();
    this.fetchEvents();
  }

  public async fetchEvents(): Promise<GDACSEvent[]> {
    this.isLoading = true;
    this.error = null;
    this.notifySubscribers();

    const retrievedAt = new Date().toISOString();
    const typesToFetch = this.activeEventType === 'all' ? ['FL', 'TC'] : [this.activeEventType];

    // Helper: try proxy endpoint first, fallback to direct GDACS API
    const fetchFeatures = async (type: string): Promise<any[]> => {
      // 1. Try server proxy
      try {
        const proxyRes = await fetch(`/api/gdacs/events?eventtype=${type}`);
        if (proxyRes.ok) {
          const json = await proxyRes.json();
          if (Array.isArray(json.features) && json.features.length > 0) {
            return json.features;
          }
        }
      } catch {
        // Fall through to direct fetch
      }

      // 2. Direct GDACS endpoint with CORS
      const directUrl = `https://www.gdacs.org/gdacsapi/api/Events/geteventlist/map?eventtype=${type}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);

      try {
        const res = await fetch(directUrl, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });
        clearTimeout(timeout);
        const text = await res.text();
        if (!res.ok || !text.trim().startsWith('{')) {
          return [];
        }
        const json = JSON.parse(text);
        return Array.isArray(json.features) ? json.features : [];
      } catch (e: any) {
        clearTimeout(timeout);
        return [];
      }
    };

    try {
      let addedOrUpdated = 0;

      for (const t of typesToFetch) {
        const features = await fetchFeatures(t);
        for (const f of features) {
          const normalized = normalizeGDACSEvent(f, retrievedAt);
          if (normalized) {
            this.eventsMap.set(normalized.sourceId, normalized);
            addedOrUpdated++;
          }
        }
      }

      if (addedOrUpdated > 0 || this.eventsMap.size > 0) {
        this.lastSuccessfulUpdate = retrievedAt;
        this.error = null;
        this.saveToCache();
      } else {
        this.error = 'No events returned from GDACS feed';
      }
    } catch (err: any) {
      this.error = err?.message || 'Failed to connect to GDACS';
    } finally {
      this.isLoading = false;
      this.notifySubscribers();
    }

    return this.getEvents();
  }

  public subscribe(cb: (status: GDACSFeedStatusInfo, events: GDACSEvent[]) => void): () => void {
    this.subscribers.add(cb);
    cb(this.getStatusInfo(), this.getEvents());
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notifySubscribers() {
    const status = this.getStatusInfo();
    const events = this.getEvents();
    this.subscribers.forEach((cb) => cb(status, events));
  }

  private startPolling() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    this.pollingTimer = setInterval(() => {
      this.fetchEvents();
    }, REFRESH_INTERVAL_MS);
  }

  public destroy() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    this.subscribers.clear();
  }
}

export const gdacsService = new GDACSService();

/**
 * React Hook for consuming GDACS events and feed status
 */
export function useGDACEvents() {
  const [events, setEvents] = useState<GDACSEvent[]>(() => gdacsService.getEvents());
  const [statusInfo, setStatusInfo] = useState<GDACSFeedStatusInfo>(() => gdacsService.getStatusInfo());

  useEffect(() => {
    const unsubscribe = gdacsService.subscribe((newStatus, newEvents) => {
      setStatusInfo(newStatus);
      setEvents(newEvents);
    });
    return () => unsubscribe();
  }, []);

  return {
    events,
    statusInfo,
    refresh: () => gdacsService.fetchEvents(),
    setEventType: (t: 'all' | 'FL' | 'TC') => gdacsService.setEventType(t),
  };
}
