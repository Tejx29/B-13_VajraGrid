import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, Resource, Volunteer, Alert, ReliefPoint, USGSEarthquakeEvent, FIRMSHotspotEvent, GDACSEvent } from '../../types';
import { MapPin, ArrowRight, Eye, AlertCircle, Shield, Phone, Home, Activity, ExternalLink, Radio, Globe, Waves, AlertTriangle, Flame, Wind, Droplets, Layers } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

// Palghar District HQ coordinates (Maharashtra, India)
export const PALGHAR_CENTER: [number, number] = [19.6967, 72.7699];
export const DEFAULT_ZOOM = 11;

// Fix standard Leaflet default icons if any fallbacks are needed
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Distinctive GDACS flood / tropical cyclone disaster icon
export const createGDACSIcon = (eventType: string, alertLevel: string = 'Green', isSelected: boolean = false) => {
  const lvl = (alertLevel || '').toLowerCase();
  const isRed = lvl === 'red';
  const isOrange = lvl === 'orange';

  let bgClass = 'bg-[#059669] text-white';
  let pulseRing = '';
  const size = isSelected ? 42 : 36;
  const typeCode = (eventType || 'FL').toUpperCase();

  if (isRed) {
    bgClass = 'bg-[#DC2626] text-white';
    pulseRing = '<div class="absolute -inset-2.5 rounded-full bg-[#DC2626]/40 animate-ping pointer-events-none"></div><div class="absolute -inset-1.5 rounded-full bg-[#DC2626]/30 pointer-events-none"></div>';
  } else if (isOrange) {
    bgClass = 'bg-[#EA580C] text-white';
    pulseRing = '<div class="absolute -inset-1.5 rounded-full bg-[#EA580C]/30 animate-pulse pointer-events-none"></div>';
  } else {
    bgClass = 'bg-[#059669] text-white';
  }

  const selectedRing = isSelected
    ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-[#090909] scale-110 shadow-2xl'
    : 'shadow-md';

  const iconSvg = typeCode === 'TC'
    ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200" style="width: ${size}px; height: ${size}px;">
      ${pulseRing}
      <div class="w-full h-full rounded-2xl ${bgClass} border-2 border-white flex flex-col items-center justify-center ${selectedRing}">
        ${iconSvg}
        <span class="text-[8px] font-black leading-none font-mono tracking-tighter mt-0.5">${typeCode}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'resqai-gdacs-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

// Distinctive NASA FIRMS fire / thermal hotspot icon displaying FRP or Flame
export const createFireIcon = (confidence?: string, frp?: number, isSelected: boolean = false) => {
  const conf = (confidence || '').toLowerCase();
  const isHigh = conf === 'high' || conf === 'h' || (typeof frp === 'number' && frp >= 50);
  const isNominal = conf === 'nominal' || conf === 'n' || (typeof frp === 'number' && frp >= 15);

  let bgClass = 'bg-[#EA580C] text-white';
  let pulseRing = '';
  const size = isSelected ? 42 : 36;
  const frpText = frp !== undefined && frp !== null && !isNaN(frp) ? `${Math.round(frp)}M` : 'FIRE';

  if (isHigh) {
    bgClass = 'bg-[#DC2626] text-white';
    pulseRing = '<div class="absolute -inset-2.5 rounded-full bg-[#DC2626]/40 animate-ping pointer-events-none"></div><div class="absolute -inset-1.5 rounded-full bg-[#DC2626]/30 pointer-events-none"></div>';
  } else if (isNominal) {
    bgClass = 'bg-[#EA580C] text-white';
    pulseRing = '<div class="absolute -inset-1.5 rounded-full bg-[#EA580C]/30 animate-pulse pointer-events-none"></div>';
  } else {
    bgClass = 'bg-[#D97706] text-white';
  }

  const selectedRing = isSelected
    ? 'ring-4 ring-[#F97316] ring-offset-2 ring-offset-[#090909] scale-110 shadow-2xl'
    : 'shadow-md';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200" style="width: ${size}px; height: ${size}px;">
      ${pulseRing}
      <div class="w-full h-full rounded-2xl ${bgClass} border-2 border-white flex flex-col items-center justify-center ${selectedRing}">
        <!-- Flame Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
        <span class="text-[8px] font-black leading-none font-mono tracking-tighter mt-0.5">${frpText}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'resqai-firms-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

// Distinctive earthquake icon displaying magnitude directly on map
const createEarthquakeIcon = (magnitude: number | null, severity: string, isSelected: boolean) => {
  const sev = severity?.toLowerCase() || 'medium';
  let bgClass = 'bg-[#D97706] text-white';
  let pulseRing = '';
  const size = isSelected ? 42 : 36;
  const magText = magnitude !== null && !isNaN(magnitude) ? magnitude.toFixed(1) : '?';

  if (sev === 'critical') {
    bgClass = 'bg-[#DC2626] text-white';
    pulseRing = '<div class="absolute -inset-3 rounded-full bg-[#DC2626]/40 animate-ping pointer-events-none"></div><div class="absolute -inset-1.5 rounded-full bg-[#DC2626]/30 pointer-events-none"></div>';
  } else if (sev === 'high') {
    bgClass = 'bg-[#EA580C] text-white';
    pulseRing = '<div class="absolute -inset-2 rounded-full bg-[#EA580C]/30 animate-pulse pointer-events-none"></div>';
  } else if (sev === 'medium') {
    bgClass = 'bg-[#D97706] text-white';
    pulseRing = '<div class="absolute -inset-1 rounded-full bg-[#D97706]/20 pointer-events-none"></div>';
  } else {
    bgClass = 'bg-[#2563EB] text-white';
  }

  const selectedRing = isSelected
    ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-[#090909] scale-110 shadow-2xl'
    : 'shadow-lg';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200" style="width: ${size}px; height: ${size}px;">
      ${pulseRing}
      <div class="w-full h-full rounded-2xl ${bgClass} border-2 border-white flex flex-col items-center justify-center ${selectedRing}">
        <!-- Seismometer Wave Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12h3l2-6 3 12 3-8 2 5 2-3h5"/>
        </svg>
        <span class="text-[9px] font-black leading-none font-mono tracking-tighter mt-0.5">${magText}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'resqai-earthquake-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

// Create custom DivIcons for incidents based on severity and optional count for co-located incidents
const createIncidentIcon = (severity: string, isSelected: boolean, count: number = 1) => {
  const sev = severity?.toLowerCase() || 'medium';
  let bgClass = 'bg-[#F5A23A] text-white';
  let pulseRing = '';
  const size = isSelected ? 40 : 32;

  if (sev === 'critical') {
    bgClass = 'bg-[#E53946] text-white';
    pulseRing = '<div class="absolute -inset-2.5 rounded-full bg-[#E53946]/40 animate-ping pointer-events-none"></div><div class="absolute -inset-1.5 rounded-full bg-[#E53946]/30 pointer-events-none"></div>';
  } else if (sev === 'high') {
    bgClass = 'bg-[#F46B27] text-white';
    pulseRing = '<div class="absolute -inset-1 rounded-full bg-[#F46B27]/25 pointer-events-none"></div>';
  } else if (sev === 'medium') {
    bgClass = 'bg-[#F5A23A] text-white';
  } else {
    bgClass = 'bg-[#2563EB] text-white';
  }

  const selectedRing = isSelected
    ? 'ring-4 ring-[#F5A23A] ring-offset-2 ring-offset-[#090909] scale-110 shadow-2xl'
    : 'shadow-md';

  const badgeHtml = count > 1
    ? `<div class="absolute -top-1.5 -right-1.5 bg-[#F5A23A] text-stone-950 border-2 border-[#12110F] font-black text-[9px] rounded-full min-w-4.5 h-4.5 px-1 flex items-center justify-center shadow-lg font-mono leading-none z-10 pointer-events-none">${count}</div>`
    : '';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200" style="width: ${size}px; height: ${size}px;">
      ${pulseRing}
      ${badgeHtml}
      <div class="w-full h-full rounded-full ${bgClass} border-2 border-white flex items-center justify-center ${selectedRing}">
        <svg xmlns="http://www.w3.org/2000/svg" class="${isSelected ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'resqai-incident-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

const createVolunteerIcon = () => {
  const html = `
    <div class="relative flex items-center justify-center cursor-pointer" style="width: 30px; height: 30px;">
      <div class="w-full h-full rounded-full bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'resqai-volunteer-marker',
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
};

const createResourceIcon = () => {
  const html = `
    <div class="relative flex items-center justify-center cursor-pointer" style="width: 30px; height: 30px;">
      <div class="w-full h-full rounded-full bg-indigo-600 border-2 border-white shadow-md flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m7.5 4.27 9 5.15"/>
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
          <path d="m3.3 7 8.7 5 8.7-5"/>
          <path d="M12 22V12"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'resqai-resource-marker',
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
};

const createAlertCenterIcon = () => {
  const html = `
    <div class="relative flex items-center justify-center cursor-pointer" style="width: 32px; height: 32px;">
      <div class="absolute -inset-1 rounded-full bg-purple-500/30 animate-pulse pointer-events-none"></div>
      <div class="w-full h-full rounded-full bg-purple-700 border-2 border-white shadow-lg flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v2"/>
          <path d="m4.93 4.93 1.41 1.41"/>
          <path d="M20 12h2"/>
          <path d="m19.07 4.93-1.41 1.41"/>
          <path d="M15.94 13.06A4.5 4.5 0 0 1 12 17a4.5 4.5 0 0 1-3.94-3.94"/>
          <circle cx="12" cy="12" r="7"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'resqai-alert-marker',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
};

const createReliefCenterIcon = (isSelected: boolean = false) => {
  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200" style="width: 32px; height: 32px;">
      <div class="w-full h-full rounded-full bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center text-white ${isSelected ? 'ring-4 ring-emerald-400 scale-110' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'resqai-relief-marker',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Map controller component to handle camera flyTo, reset, fitBounds, locateMe, and container resizing
function MapCameraController({
  flyToTarget,
  resetTrigger,
  fitBoundsTrigger,
  locateMeTrigger,
  incidents
}: {
  flyToTarget: { lat: number; lng: number; zoom?: number } | null;
  resetTrigger: number;
  fitBoundsTrigger: number;
  locateMeTrigger?: number;
  incidents: Incident[];
}) {
  const map = useMap();

  // Invalidate map size so Leaflet recalculates dimensions when container layout stabilizes
  useEffect(() => {
    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch {
        // ignore
      }
    };

    handleResize();
    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 400);
    const t3 = setTimeout(handleResize, 1000);

    let resizeObserver: ResizeObserver | null = null;
    const container = map.getContainer();
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [map]);

  useEffect(() => {
    if (flyToTarget && typeof flyToTarget.lat === 'number' && typeof flyToTarget.lng === 'number') {
      map.flyTo([flyToTarget.lat, flyToTarget.lng], flyToTarget.zoom || 13, {
        duration: 1.2,
      });
    }
  }, [flyToTarget, map]);

  useEffect(() => {
    if (resetTrigger > 0) {
      map.flyTo(PALGHAR_CENTER, DEFAULT_ZOOM, {
        duration: 1.0,
      });
    }
  }, [resetTrigger, map]);

  useEffect(() => {
    if (locateMeTrigger && locateMeTrigger > 0 && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { duration: 1.0 });
        },
        (err) => console.warn('Locate me error:', err),
        { timeout: 8000 }
      );
    }
  }, [locateMeTrigger, map]);

  useEffect(() => {
    if (fitBoundsTrigger > 0 && incidents.length > 0) {
      const validPoints: [number, number][] = incidents
        .filter(i => i.location && typeof i.location.lat === 'number' && typeof i.location.lng === 'number' && !isNaN(i.location.lat) && !isNaN(i.location.lng))
        .map(i => [i.location.lat, i.location.lng] as [number, number]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 14,
          animate: true,
        });
      }
    }
  }, [fitBoundsTrigger, incidents, map]);

  return null;
}

export interface LiveMapProps {
  mode?: 'authority' | 'public';
  incidents?: Incident[];
  earthquakes?: USGSEarthquakeEvent[];
  fires?: FIRMSHotspotEvent[];
  gdacsEvents?: GDACSEvent[];
  resources?: Resource[];
  volunteers?: Volunteer[];
  alerts?: Alert[];
  reliefPoints?: ReliefPoint[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: Incident) => void;
  onSelectEarthquake?: (earthquake: USGSEarthquakeEvent) => void;
  onSelectFire?: (fire: FIRMSHotspotEvent) => void;
  onSelectGDACS?: (event: GDACSEvent) => void;
  onCreateIncidentFromFire?: (fire: FIRMSHotspotEvent) => void;
  onCreateIncidentFromGDACS?: (event: GDACSEvent) => void;
  layerVisibility?: {
    incidents?: boolean;
    earthquakes?: boolean;
    fires?: boolean;
    gdacs?: boolean;
    volunteers?: boolean;
    resources?: boolean;
    alerts?: boolean;
    reliefPoints?: boolean;
    advisories?: boolean;
  };
  flyToTarget?: { lat: number; lng: number; zoom?: number } | null;
  resetTrigger?: number;
  fitBoundsTrigger?: number;
  locateMeTrigger?: number;
  className?: string;
  height?: string;
  basemap?: 'dark' | 'osm' | 'satellite';
}

export function LiveMap({
  mode = 'authority',
  incidents = [],
  earthquakes = [],
  fires = [],
  gdacsEvents = [],
  resources = [],
  volunteers = [],
  alerts = [],
  reliefPoints = [],
  selectedIncidentId = null,
  onSelectIncident,
  onSelectEarthquake,
  onSelectFire,
  onSelectGDACS,
  onCreateIncidentFromFire,
  onCreateIncidentFromGDACS,
  layerVisibility = { incidents: true, earthquakes: true, fires: true, gdacs: true, volunteers: true, resources: true, alerts: true, reliefPoints: true, advisories: true },
  flyToTarget = null,
  resetTrigger = 0,
  fitBoundsTrigger = 0,
  locateMeTrigger = 0,
  className = '',
  height = '100%',
  basemap = 'satellite',
}: LiveMapProps) {
  const navigate = useNavigate();
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const [tileErrorOccurred, setTileErrorOccurred] = useState<boolean>(false);

  // Filter valid coordinates to prevent any map crashes
  const validEarthquakes = useMemo(() => {
    return (earthquakes || []).filter(
      (eq) =>
        typeof eq.latitude === 'number' &&
        typeof eq.longitude === 'number' &&
        !isNaN(eq.latitude) &&
        !isNaN(eq.longitude) &&
        eq.latitude >= -90 &&
        eq.latitude <= 90 &&
        eq.longitude >= -180 &&
        eq.longitude <= 180
    );
  }, [earthquakes]);

  // Filter valid coordinates for NASA FIRMS fire hotspots
  const validFires = useMemo(() => {
    return (fires || []).filter(
      (f) =>
        typeof f.latitude === 'number' &&
        typeof f.longitude === 'number' &&
        !isNaN(f.latitude) &&
        !isNaN(f.longitude) &&
        f.latitude >= -90 &&
        f.latitude <= 90 &&
        f.longitude >= -180 &&
        f.longitude <= 180
    );
  }, [fires]);

  // Filter valid coordinates for GDACS multi-hazard observations
  const validGDACSEvents = useMemo(() => {
    return (gdacsEvents || []).filter(
      (ev) =>
        typeof ev.latitude === 'number' &&
        typeof ev.longitude === 'number' &&
        !isNaN(ev.latitude) &&
        !isNaN(ev.longitude) &&
        ev.latitude >= -90 &&
        ev.latitude <= 90 &&
        ev.longitude >= -180 &&
        ev.longitude <= 180
    );
  }, [gdacsEvents]);

  // Filter valid coordinates to prevent any map crashes
  const validIncidents = useMemo(() => {
    return incidents.filter(
      (inc) =>
        inc.location &&
        typeof inc.location.lat === 'number' &&
        typeof inc.location.lng === 'number' &&
        !isNaN(inc.location.lat) &&
        !isNaN(inc.location.lng)
    );
  }, [incidents]);

  // Group incidents by spatial coordinates (tolerance ~10m / 4 decimal places)
  // Ensures distinct positions render distinct markers, and genuinely identical coordinates
  // are grouped with multi-incident accessibility rather than one marker hiding another.
  const incidentGroups = useMemo(() => {
    const groups: { [key: string]: Incident[] } = {};
    validIncidents.forEach((inc) => {
      const key = `${inc.location.lat.toFixed(4)},${inc.location.lng.toFixed(4)}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(inc);
    });
    return Object.values(groups);
  }, [validIncidents]);

  const [activeGroupIncidentIds, setActiveGroupIncidentIds] = useState<{ [groupKey: string]: string }>({});

  const validResources = useMemo(() => {
    return resources.filter(
      (res) =>
        res.location &&
        typeof res.location.lat === 'number' &&
        typeof res.location.lng === 'number' &&
        !isNaN(res.location.lat) &&
        !isNaN(res.location.lng)
    );
  }, [resources]);

  const validVolunteers = useMemo(() => {
    return volunteers.filter(
      (vol) =>
        vol.location &&
        typeof vol.location.lat === 'number' &&
        typeof vol.location.lng === 'number' &&
        !isNaN(vol.location.lat) &&
        !isNaN(vol.location.lng)
    );
  }, [volunteers]);

  const validAlerts = useMemo(() => {
    return alerts.filter(
      (alt) =>
        alt.affectedArea &&
        typeof alt.affectedArea.lat === 'number' &&
        typeof alt.affectedArea.lng === 'number' &&
        !isNaN(alt.affectedArea.lat) &&
        !isNaN(alt.affectedArea.lng)
    );
  }, [alerts]);

  const validReliefPoints = useMemo(() => {
    return reliefPoints.filter(
      (rel) =>
        rel.location &&
        typeof rel.location.lat === 'number' &&
        typeof rel.location.lng === 'number' &&
        !isNaN(rel.location.lat) &&
        !isNaN(rel.location.lng)
    );
  }, [reliefPoints]);

  // Open popup when selectedIncidentId changes
  useEffect(() => {
    if (selectedIncidentId && markerRefs.current[selectedIncidentId]) {
      markerRefs.current[selectedIncidentId]?.openPopup();
    }
  }, [selectedIncidentId]);

  return (
    <div
      className={`relative w-full h-full min-h-[520px] overflow-hidden rounded-none border-0 bg-[#090909] ${className}`}
      style={{ height }}
    >
      {/* Explicit Tile Error Warning Banner if tile network requests fail (Requirement 8) */}
      {tileErrorOccurred && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-amber-950/90 border border-amber-600 text-amber-200 px-4 py-2 rounded-lg text-xs shadow-md flex items-center gap-2 max-w-md backdrop-blur-md">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Notice: Tile request warning detected (switching to geographic fallback).</span>
        </div>
      )}

      <MapContainer
        center={PALGHAR_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={4}
        maxZoom={18}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '520px' }}
        className="z-0 h-full w-full"
      >
        {/* Basemap Tile Layer */}
        {basemap === 'dark' ? (
          <TileLayer
            key="carto-dark"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
            eventHandlers={{
              tileerror: () => {
                setTileErrorOccurred(true);
              },
            }}
          />
        ) : basemap === 'satellite' ? (
          <React.Fragment key="satellite-group">
            <TileLayer
              key="esri-satellite"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
              eventHandlers={{
                tileerror: () => {
                  setTileErrorOccurred(true);
                },
              }}
            />
            <TileLayer
              key="esri-satellite-labels"
              attribution='&copy; Esri &mdash; Boundaries & Places'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </React.Fragment>
        ) : (
          <TileLayer
            key="osm-standard"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            eventHandlers={{
              tileerror: () => {
                setTileErrorOccurred(true);
              },
            }}
          />
        )}

        <MapCameraController
          flyToTarget={flyToTarget}
          resetTrigger={resetTrigger}
          fitBoundsTrigger={fitBoundsTrigger}
          locateMeTrigger={locateMeTrigger}
          incidents={validIncidents}
        />

        {/* Proactive Risk / Hazard Areas (Circles) */}
        {layerVisibility.alerts !== false &&
          validAlerts.map((alert) => {
            const lat = alert.affectedArea.lat!;
            const lng = alert.affectedArea.lng!;
            const radiusMeters = (alert.affectedArea.radiusKm || 10) * 1000;
            const isCritical = alert.severity === 'critical';

            return (
              <React.Fragment key={alert.id}>
                <Circle
                  center={[lat, lng]}
                  radius={radiusMeters}
                  pathOptions={{
                    color: isCritical ? '#E53946' : '#F5A23A',
                    fillColor: isCritical ? '#E53946' : '#F5A23A',
                    fillOpacity: 0.12,
                    weight: 2,
                    dashArray: '8, 8',
                  }}
                />
                <Marker
                  position={[lat, lng]}
                  icon={createAlertCenterIcon()}
                >
                  <Popup className="resqai-map-popup">
                    <div className="p-1 min-w-[240px] text-[#F4F0EB]">
                      <div className="flex items-center justify-between gap-2 border-b border-[#38302A] pb-2 mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold bg-[#851D2A]/30 text-[#FF525A] border border-[#FF525A]/40">
                          Official Advisory
                        </Badge>
                        <span className="text-[10px] font-mono text-[#7C756E]">DEMO ADVISORY</span>
                      </div>
                      <h4 className="font-bold text-[#F4F0EB] text-sm leading-snug mb-1">{alert.title}</h4>
                      <p className="text-xs text-[#AAA29A] mb-2">{alert.description}</p>
                      <div className="text-[11px] bg-[#191715] p-2.5 rounded-lg border border-[#38302A] text-[#AAA29A] space-y-1">
                        <div><strong className="text-[#F4F0EB]">Zone:</strong> {alert.affectedArea.name}</div>
                        <div><strong className="text-[#F4F0EB]">Radius:</strong> {alert.affectedArea.radiusKm} km</div>
                        <div><strong className="text-[#F4F0EB]">Severity:</strong> <span className="capitalize font-semibold text-[#FF525A]">{alert.severity}</span></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* Public Relief & Safety Points Layer */}
        {layerVisibility.reliefPoints !== false &&
          validReliefPoints.map((rel) => (
            <Marker
              key={rel.id}
              position={[rel.location.lat, rel.location.lng]}
              icon={createReliefCenterIcon()}
            >
              <Popup className="resqai-map-popup">
                <div className="p-1 min-w-[240px] text-[#F4F0EB]">
                  <div className="flex items-center justify-between gap-2 border-b border-[#38302A] pb-2 mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold bg-[#16B58A]/15 text-[#16B58A] border border-[#16B58A]/40 flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {rel.type}
                    </Badge>
                    <span className="text-[10px] font-bold text-[#16B58A] bg-[#16B58A]/15 border border-[#16B58A]/30 px-1.5 py-0.5 rounded">
                      {rel.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#F4F0EB] text-sm leading-snug mb-1">{rel.name}</h4>
                  <p className="text-xs text-[#AAA29A] mb-2">{rel.description}</p>
                  <div className="text-[11px] bg-[#191715] p-2.5 rounded-lg border border-[#38302A] text-[#AAA29A] space-y-1 mb-2">
                    <div><strong className="text-[#F4F0EB]">Location:</strong> {rel.location.address}</div>
                    {rel.capacity && (
                      <div><strong className="text-[#F4F0EB]">Occupancy:</strong> {rel.currentOccupancy || 0} / {rel.capacity} persons</div>
                    )}
                    {rel.contact && (
                      <div className="flex items-center gap-1 text-[#AAA29A]">
                        <Phone className="h-3 w-3 text-[#16B58A]" />
                        <strong className="text-[#F4F0EB]">Helpline:</strong> {rel.contact}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-[#16B58A] bg-[#16B58A]/10 rounded px-2 py-1 border border-[#16B58A]/30">
                    Official Public Relief &amp; Safety Facility (Demo)
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Resources Layer - ONLY in Authority Mode (Privacy Requirement 4) */}
        {mode !== 'public' && layerVisibility.resources &&
          validResources.map((res) => (
            <Marker
              key={res.id}
              position={[res.location.lat, res.location.lng]}
              icon={createResourceIcon()}
            >
              <Popup className="resqai-map-popup">
                <div className="p-1 min-w-[220px] text-[#F4F0EB]">
                  <div className="flex items-center justify-between gap-2 border-b border-[#38302A] pb-2 mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold bg-blue-500/15 text-blue-300 border border-blue-500/40">
                      Resource
                    </Badge>
                    <span className="text-[10px] font-mono text-[#AAA29A]">{res.status}</span>
                  </div>
                  <h4 className="font-bold text-[#F4F0EB] text-sm leading-snug mb-1">{res.name}</h4>
                  <div className="text-xs text-[#AAA29A] space-y-1 mb-2 bg-[#191715] p-2.5 rounded-lg border border-[#38302A]">
                    <div><strong className="text-[#F4F0EB]">Type:</strong> {res.type}</div>
                    <div><strong className="text-[#F4F0EB]">Quantity:</strong> {res.quantity || 1} Unit(s)</div>
                    <div><strong className="text-[#F4F0EB]">Location:</strong> {res.location.address || `${res.location.lat.toFixed(4)}, ${res.location.lng.toFixed(4)}`}</div>
                  </div>
                  <div className="text-[10px] text-[#F5A23A] bg-[#27211B] rounded px-2 py-1 border border-[#38302A]">
                    Simulated asset allocation (Demo Data)
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Volunteers Layer - ONLY in Authority Mode (Privacy Requirement 4) */}
        {mode !== 'public' && layerVisibility.volunteers &&
          validVolunteers.map((vol) => (
            <Marker
              key={vol.id}
              position={[vol.location!.lat, vol.location!.lng]}
              icon={createVolunteerIcon()}
            >
              <Popup className="resqai-map-popup">
                <div className="p-1 min-w-[220px] text-[#F4F0EB]">
                  <div className="flex items-center justify-between gap-2 border-b border-[#38302A] pb-2 mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold bg-[#16B58A]/15 text-[#16B58A] border border-[#16B58A]/40">
                      Volunteer
                    </Badge>
                    <span className="text-[10px] font-mono text-[#AAA29A] capitalize">{vol.status}</span>
                  </div>
                  <h4 className="font-bold text-[#F4F0EB] text-sm leading-snug mb-1">{vol.name}</h4>
                  <div className="text-xs text-[#AAA29A] space-y-1 mb-2 bg-[#191715] p-2.5 rounded-lg border border-[#38302A]">
                    <div><strong className="text-[#F4F0EB]">Skills:</strong> {vol.skills.join(', ')}</div>
                    <div><strong className="text-[#F4F0EB]">Location:</strong> {vol.location?.address || `${vol.location?.lat.toFixed(4)}, ${vol.location?.lng.toFixed(4)}`}</div>
                  </div>
                  <div className="text-[10px] text-[#F5A23A] bg-[#27211B] rounded px-2 py-1 border border-[#38302A]">
                    Volunteer dispatch position (Demo Data)
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Incidents Layer */}
        {layerVisibility.incidents !== false &&
          incidentGroups.map((group) => {
            const groupKey = `${group[0].location.lat.toFixed(4)},${group[0].location.lng.toFixed(4)}`;
            const isGroupSelected = group.some(i => i.id === selectedIncidentId);
            const activeId = activeGroupIncidentIds[groupKey] || (isGroupSelected ? selectedIncidentId : group[0].id);
            const incident = group.find(i => i.id === activeId) || group[0];
            const isSelected = incident.id === selectedIncidentId;
            const count = group.length;

            const severities = group.map(i => i.aiAnalysis?.severity || 'medium');
            const topSeverity = severities.includes('critical')
              ? 'critical'
              : severities.includes('high')
              ? 'high'
              : severities.includes('medium')
              ? 'medium'
              : 'low';

            const displayId = incident.id.replace('inc_', 'INC-').toUpperCase();
            const currentSeverity = incident.aiAnalysis?.severity || 'medium';

            return (
              <Marker
                key={incident.id}
                position={[incident.location.lat, incident.location.lng]}
                icon={createIncidentIcon(topSeverity, isSelected || isGroupSelected, count)}
                zIndexOffset={isSelected || isGroupSelected ? 1000 : 100}
                ref={(el) => {
                  group.forEach(i => {
                    markerRefs.current[i.id] = el;
                  });
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectIncident) {
                      onSelectIncident(incident);
                    }
                  },
                }}
              >
                <Popup className="resqai-map-popup">
                  <div className="p-1.5 min-w-[280px] max-w-[320px] text-[#F4F0EB]">
                    {/* Multi-incident switcher if multiple incidents share this exact position */}
                    {count > 1 && (
                      <div className="bg-[#12110F] p-2 rounded-lg border border-[#38302A] mb-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#F5A23A] flex items-center gap-1 font-mono">
                            <Layers className="h-3 w-3" />
                            {count} Incidents Co-located
                          </span>
                          <span className="text-[10px] text-[#AAA29A] font-mono">
                            #{group.findIndex(i => i.id === incident.id) + 1} of {count}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveGroupIncidentIds(prev => ({ ...prev, [groupKey]: item.id }));
                                if (onSelectIncident) onSelectIncident(item);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                item.id === incident.id
                                  ? 'bg-[#F5A23A] text-stone-950 shadow-xs'
                                  : 'bg-[#191715] text-[#AAA29A] hover:text-[#F4F0EB] border border-[#38302A]'
                              }`}
                            >
                              {item.id.replace('inc_', 'INC-').toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#38302A] pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#F5A23A]">{displayId}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 font-bold uppercase border-0 ${
                            currentSeverity === 'critical'
                              ? 'bg-[#E53946]/20 text-[#E53946] border border-[#E53946]/40'
                              : currentSeverity === 'high'
                              ? 'bg-[#F46B27]/20 text-[#F46B27] border border-[#F46B27]/40'
                              : currentSeverity === 'medium'
                              ? 'bg-[#F5A23A]/20 text-[#F5A23A] border border-[#F5A23A]/40'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          }`}
                        >
                          {currentSeverity}
                        </Badge>
                      </div>
                      <span className="text-[11px] font-semibold text-[#AAA29A] capitalize">
                        {incident.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-[#F4F0EB] text-sm leading-snug mb-1">
                      {incident.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-start gap-1.5 text-xs text-[#AAA29A] mb-2.5">
                      <MapPin className="h-3.5 w-3.5 text-[#F5A23A] shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="leading-tight font-medium text-[#F4F0EB]">
                          {incident.location.address || 'Palghar District & Environs'}
                        </span>
                        <span className="text-[10px] font-mono text-[#7C756E] mt-0.5">
                          {incident.location.lat.toFixed(4)}° N, {incident.location.lng.toFixed(4)}° E
                        </span>
                      </div>
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-[#AAA29A] line-clamp-2 mb-3 bg-[#191715] p-2 rounded border border-[#2E2721]">
                      {incident.description}
                    </p>

                    {/* Public vs Authority popup details (Privacy Requirement 4) */}
                    {mode === 'public' ? (
                      <div className="space-y-2 mb-3 border-t border-[#38302A] pt-2">
                        {incident.aiAnalysis?.recommendedAction && (
                          <div className="text-[11px] bg-[#191715] text-[#F5A23A] p-2 rounded border border-[#38302A]">
                            <strong>Public Safety Advice:</strong> {incident.aiAnalysis.recommendedAction}
                          </div>
                        )}
                        <div className="flex justify-between text-[11px] text-[#AAA29A]">
                          <span>Reported: {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="font-mono text-[10px] text-[#7C756E]">SIMULATED RECORD</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (onSelectIncident) {
                              onSelectIncident(incident);
                            }
                          }}
                          className="w-full h-8 text-xs bg-[#191715] hover:bg-[#27211B] border border-[#38302A] text-[#F4F0EB] font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#F5A23A]" />
                          View Safety Guidance & Advisory
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Authority Metadata fields */}
                        <div className="space-y-1.5 text-xs text-[#AAA29A] mb-3 border-t border-[#38302A] pt-2">
                          <div className="flex justify-between">
                            <span className="text-[#7C756E]">Assigned Team:</span>
                            <span className="font-medium text-[#F4F0EB]">{incident.assignedTeam || 'Unassigned'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#7C756E]">Source:</span>
                            <span className="font-medium text-[#F4F0EB]">{incident.source || 'Citizen Report'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#7C756E]">Reported:</span>
                            <span className="font-medium text-[#F4F0EB]">
                              {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {incident.aiAnalysis?.recommendedAction && (
                            <div className="text-[11px] bg-[#191715] text-[#F5A23A] p-2 rounded border border-[#38302A] mt-1">
                              <strong>AI Triage:</strong> {incident.aiAnalysis.recommendedAction}
                            </div>
                          )}
                        </div>

                        {/* Authority Action Button */}
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/incidents/${incident.id}`)}
                          className="w-full h-8 text-xs bg-[#191715] hover:bg-[#27211B] border border-[#38302A] text-[#F4F0EB] hover:text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#F5A23A]" />
                          View Incident Details
                          <ArrowRight className="h-3.5 w-3.5 ml-0.5 text-[#AAA29A]" />
                        </Button>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* USGS Earthquakes Layer (Official Real-Time Telemetry Feed) */}
        {layerVisibility.earthquakes !== false &&
          validEarthquakes.map((eq) => {
            const markerKey = `usgs_${eq.sourceId}`;
            const isSelected = selectedIncidentId === markerKey || selectedIncidentId === eq.sourceId;
            const formattedTime = new Date(eq.eventTime).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
            const relativeMinutes = Math.max(0, Math.round((Date.now() - new Date(eq.eventTime).getTime()) / 60000));
            const timeAgoStr = relativeMinutes < 60
              ? `${relativeMinutes}m ago`
              : `${Math.floor(relativeMinutes / 60)}h ${relativeMinutes % 60}m ago`;

            return (
              <Marker
                key={markerKey}
                position={[eq.latitude, eq.longitude]}
                icon={createEarthquakeIcon(eq.magnitude, eq.derivedSeverity, isSelected)}
                zIndexOffset={isSelected ? 1000 : 90}
                ref={(el) => {
                  markerRefs.current[markerKey] = el;
                  markerRefs.current[eq.sourceId] = el;
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectEarthquake) {
                      onSelectEarthquake(eq);
                    }
                  },
                }}
              >
                <Popup className="resqai-map-popup">
                  <div className="p-1.5 min-w-[290px] max-w-[340px] text-[#F4F0EB]">
                    {/* Header: Clear Real Data Attribution */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#38302A] pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/50 flex items-center gap-1.5 px-2 py-0.5"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          REAL DATA: USGS SEISMIC
                        </Badge>
                      </div>
                      <span className="text-[10px] font-mono text-[#AAA29A]">
                        {eq.sourceId}
                      </span>
                    </div>

                    {/* Title & Location */}
                    <h3 className="font-bold text-[#F4F0EB] text-sm leading-snug mb-1">
                      {eq.title}
                    </h3>

                    <div className="flex items-start gap-1.5 text-xs text-[#AAA29A] mb-2.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="leading-tight font-medium text-[#F4F0EB]">
                          {eq.place}
                        </span>
                        <span className="text-[10px] font-mono text-[#7C756E] mt-0.5">
                          {eq.latitude.toFixed(4)}° N, {eq.longitude.toFixed(4)}° E
                          {eq.depthKm !== undefined ? ` • Depth: ${eq.depthKm.toFixed(1)} km` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Telemetry Metrics & Documented Application Classification */}
                    <div className="bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#AAA29A]">Magnitude:</span>
                        <span className="font-mono font-bold text-sm text-[#F5A23A]">
                          {eq.magnitude !== null ? `M ${eq.magnitude.toFixed(1)}` : 'Uncalculated'}
                          {eq.magnitudeType ? ` (${eq.magnitudeType})` : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#AAA29A]">App Classification:</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.2 border ${
                            eq.derivedSeverity === 'critical'
                              ? 'bg-[#DC2626]/20 text-[#ff6363] border-[#DC2626]/50'
                              : eq.derivedSeverity === 'high'
                              ? 'bg-[#EA580C]/20 text-[#ff8c4a] border-[#EA580C]/50'
                              : eq.derivedSeverity === 'medium'
                              ? 'bg-[#D97706]/20 text-[#fbbf24] border-[#D97706]/50'
                              : 'bg-blue-900/30 text-blue-300 border-blue-600/40'
                          }`}
                        >
                          {eq.derivedSeverity}
                        </Badge>
                      </div>

                      <div className="text-[10px] text-[#8C827A] italic leading-tight border-t border-[#26211C] pt-1.5">
                        * Application classification derived from magnitude. Not an official USGS severity rating.
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-[#26211C] pt-1.5 text-[#AAA29A]">
                        <div>
                          <span className="text-[#7C756E] block text-[9.5px] uppercase font-mono">Event Time</span>
                          <span className="text-[#F4F0EB] font-medium">{timeAgoStr}</span>
                        </div>
                        <div>
                          <span className="text-[#7C756E] block text-[9.5px] uppercase font-mono">Status</span>
                          <span className="text-[#F4F0EB] capitalize font-medium">{eq.status || 'Verified'}</span>
                        </div>
                      </div>

                      {eq.tsunami === 1 && (
                        <div className="bg-[#851D2A]/40 border border-[#E53946]/50 text-[#FF858B] p-1.5 rounded text-[11px] font-bold flex items-center gap-1.5">
                          <Waves className="h-3.5 w-3.5 shrink-0" />
                          <span>TSUNAMI ADVISORY ISSUED</span>
                        </div>
                      )}
                    </div>

                    {/* Source Attribution & Official External Link */}
                    <div className="space-y-2 border-t border-[#38302A] pt-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#7C756E]">
                        <span>DATA SOURCE: USGS NEIC</span>
                        <span>{formattedTime}</span>
                      </div>

                      <a
                        href={eq.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-8 text-xs bg-[#141A29] hover:bg-[#1E2942] border border-[#2B3B5B] text-[#93C5FD] hover:text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Globe className="h-3.5 w-3.5 text-[#60A5FA]" />
                        <span>View Official Event on USGS.gov</span>
                        <ExternalLink className="h-3 w-3 ml-0.5 text-[#93C5FD]" />
                      </a>

                      <p className="text-[9.5px] text-[#7C756E] text-center leading-tight">
                        External telemetry observation. Requires local authority review before emergency dispatch.
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* NASA FIRMS Fire Detections Layer (Official Satellite Telemetry Feed) */}
        {layerVisibility.fires !== false &&
          validFires.map((fire) => {
            const markerKey = `firms_${fire.sourceId}`;
            const isSelected = selectedIncidentId === markerKey || selectedIncidentId === fire.sourceId;
            const formattedTime = new Date(fire.timestamp).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
            const relativeMinutes = Math.max(0, Math.round((Date.now() - new Date(fire.timestamp).getTime()) / 60000));
            const timeAgoStr = relativeMinutes < 60
              ? `${relativeMinutes}m ago`
              : `${Math.floor(relativeMinutes / 60)}h ${relativeMinutes % 60}m ago`;

            const tempC = fire.brightnessTempI4 !== undefined ? (fire.brightnessTempI4 - 273.15).toFixed(1) : null;

            return (
              <Marker
                key={markerKey}
                position={[fire.latitude, fire.longitude]}
                icon={createFireIcon(fire.confidence, fire.fireRadiativePower, isSelected)}
                zIndexOffset={isSelected ? 1000 : 92}
                ref={(el) => {
                  markerRefs.current[markerKey] = el;
                  markerRefs.current[fire.sourceId] = el;
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectFire) {
                      onSelectFire(fire);
                    }
                  },
                }}
              >
                <Popup className="resqai-map-popup">
                  <div className="p-1.5 min-w-[290px] max-w-[340px] text-[#F4F0EB]">
                    {/* Header: Clear Real Data Attribution */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#38302A] pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold tracking-wider bg-orange-950/60 text-orange-400 border border-orange-500/50 flex items-center gap-1.5 px-2 py-0.5"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                          REAL DATA: NASA FIRMS
                        </Badge>
                      </div>
                      <span className="text-[10px] font-mono text-[#AAA29A]">
                        {fire.satellite}
                      </span>
                    </div>

                    {/* Title & Sensor */}
                    <h3 className="font-bold text-[#F4F0EB] text-sm leading-snug mb-1 flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-400 shrink-0" />
                      Satellite Thermal Hotspot
                    </h3>

                    <div className="flex items-start gap-1.5 text-xs text-[#AAA29A] mb-2.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="leading-tight font-medium text-[#F4F0EB]">
                          {fire.instrument}
                        </span>
                        <span className="text-[11px] font-mono text-[#7C756E] mt-0.5">
                          {fire.latitude.toFixed(4)}°N, {fire.longitude.toFixed(4)}°E
                        </span>
                      </div>
                    </div>

                    {/* Primary Scientific Metrics Card */}
                    <div className="bg-[#12110F] border border-[#26211C] rounded-lg p-2.5 mb-2.5 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#191715] p-2 rounded border border-[#2E2721]">
                          <span className="text-[9.5px] uppercase font-mono text-[#7C756E] block mb-0.5">Radiative Power</span>
                          <span className="font-mono text-sm font-black text-amber-400">
                            {fire.fireRadiativePower !== undefined ? `${fire.fireRadiativePower.toFixed(1)} MW` : 'N/A'}
                          </span>
                        </div>

                        <div className="bg-[#191715] p-2 rounded border border-[#2E2721]">
                          <span className="text-[9.5px] uppercase font-mono text-[#7C756E] block mb-0.5">Brightness Temp</span>
                          <span className="font-mono text-sm font-bold text-[#F4F0EB]">
                            {tempC ? `${tempC}°C` : 'N/A'}
                            {fire.brightnessTempI4 ? <span className="text-[10px] text-[#7C756E] ml-1">({Math.round(fire.brightnessTempI4)}K)</span> : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#26211C]">
                        <span className="text-xs text-[#AAA29A]">Detection Confidence:</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.2 border ${
                            fire.confidence === 'high'
                              ? 'bg-red-950/40 text-red-400 border-red-500/50'
                              : fire.confidence === 'nominal'
                              ? 'bg-orange-950/40 text-orange-400 border-orange-500/50'
                              : 'bg-amber-950/40 text-amber-300 border-amber-600/40'
                          }`}
                        >
                          {fire.confidenceLabel}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-[#26211C] pt-1.5 text-[#AAA29A]">
                        <div>
                          <span className="text-[#7C756E] block text-[9.5px] uppercase font-mono">Acquired</span>
                          <span className="text-[#F4F0EB] font-medium">{timeAgoStr}</span>
                        </div>
                        <div>
                          <span className="text-[#7C756E] block text-[9.5px] uppercase font-mono">Overpass</span>
                          <span className="text-[#F4F0EB] capitalize font-medium">{fire.dayNight === 'D' ? 'Daytime' : 'Nighttime'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Action: Create Incident / Review Hotspot */}
                    {mode === 'authority' && (
                      <div className="mb-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (onCreateIncidentFromFire) {
                              onCreateIncidentFromFire(fire);
                            } else {
                              const desc = `Observed by NASA FIRMS ${fire.instrument} on ${fire.acqDate} ${fire.acqTime}. FRP: ${fire.fireRadiativePower || 'N/A'} MW, Temp: ${tempC || 'N/A'}°C. Confidence: ${fire.confidenceLabel}.`;
                              navigate(`/admin/incidents/new?type=Fire&lat=${fire.latitude}&lng=${fire.longitude}&title=Potential Hotspot (${fire.instrument})&desc=${encodeURIComponent(desc)}`);
                            }
                          }}
                          className="w-full h-8 text-xs bg-[#EA580C] hover:bg-[#f26317] text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Flame className="h-3.5 w-3.5 text-white" />
                          <span>Review & Create Incident</span>
                        </Button>
                      </div>
                    )}

                    {/* Source Attribution & Official External Link */}
                    <div className="space-y-2 border-t border-[#38302A] pt-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#7C756E]">
                        <span>SOURCE: NASA FIRMS / LANCE</span>
                        <span>{formattedTime}</span>
                      </div>

                      <a
                        href={fire.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-8 text-xs bg-[#1C1510] hover:bg-[#2B1F17] border border-[#482F1E] text-[#FDBA74] hover:text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Globe className="h-3.5 w-3.5 text-orange-400" />
                        <span>View on NASA FIRMS Map</span>
                        <ExternalLink className="h-3 w-3 ml-0.5 text-[#FDBA74]" />
                      </a>

                      <p className="text-[9.5px] text-[#7C756E] text-center leading-tight">
                        Satellite thermal anomaly observation. Requires ground verification before emergency response.
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* GDACS Multi-Hazard Observations Layer (Floods & Cyclones) */}
        {layerVisibility.gdacs !== false &&
          validGDACSEvents.map((gdacs) => {
            const markerKey = `gdacs_${gdacs.sourceId}`;
            const isSelected = selectedIncidentId === markerKey || selectedIncidentId === gdacs.sourceId;
            const formattedTime = gdacs.dateModified || gdacs.fromDate || gdacs.retrievedAt;
            const timeAgoStr = formattedTime
              ? new Date(formattedTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent';

            const alertBg =
              gdacs.alertLevel.toLowerCase() === 'red'
                ? 'bg-red-950/60 text-red-400 border-red-500/50'
                : gdacs.alertLevel.toLowerCase() === 'orange'
                ? 'bg-orange-950/60 text-orange-400 border-orange-500/50'
                : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50';

            return (
              <Marker
                key={markerKey}
                position={[gdacs.latitude, gdacs.longitude]}
                icon={createGDACSIcon(gdacs.eventType, gdacs.alertLevel, isSelected)}
                zIndexOffset={isSelected ? 1000 : 91}
                ref={(el) => {
                  markerRefs.current[markerKey] = el;
                  markerRefs.current[gdacs.sourceId] = el;
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectGDACS) {
                      onSelectGDACS(gdacs);
                    }
                  },
                }}
              >
                <Popup className="resqai-map-popup">
                  <div className="p-1.5 min-w-[290px] max-w-[340px] text-[#F4F0EB]">
                    {/* Header: Clear Real Data Attribution */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#38302A] pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/50 flex items-center gap-1.5 px-2 py-0.5"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          REAL DATA: GDACS
                        </Badge>
                      </div>
                      <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${alertBg}`}>
                        {gdacs.alertLevel} Alert
                      </span>
                    </div>

                    {/* Title & Type */}
                    <h3 className="font-bold text-[#F4F0EB] text-sm leading-snug mb-1 flex items-center gap-1.5">
                      {gdacs.eventType === 'TC' ? (
                        <Wind className="h-4 w-4 text-cyan-400 shrink-0" />
                      ) : (
                        <Droplets className="h-4 w-4 text-blue-400 shrink-0" />
                      )}
                      {gdacs.name}
                    </h3>

                    <div className="flex items-start gap-1.5 text-xs text-[#AAA29A] mb-2.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="leading-tight font-medium text-[#F4F0EB]">
                          {gdacs.country || 'International Waters'}
                        </span>
                        <span className="text-[11px] font-mono text-[#7C756E] mt-0.5">
                          {gdacs.latitude.toFixed(3)}°N, {gdacs.longitude.toFixed(3)}°E
                        </span>
                      </div>
                    </div>

                    {/* Primary Observational Metrics Card */}
                    <div className="bg-[#12110F] border border-[#26211C] rounded-lg p-2.5 mb-2.5 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#191715] p-2 rounded border border-[#2E2721]">
                          <span className="text-[9.5px] uppercase font-mono text-[#7C756E] block mb-0.5">Hazard Type</span>
                          <span className="font-mono text-xs font-bold text-[#F4F0EB]">
                            {gdacs.eventTypeLabel}
                          </span>
                        </div>

                        <div className="bg-[#191715] p-2 rounded border border-[#2E2721]">
                          <span className="text-[9.5px] uppercase font-mono text-[#7C756E] block mb-0.5">Alert Score</span>
                          <span className="font-mono text-sm font-bold text-amber-400">
                            {gdacs.alertScore !== undefined ? gdacs.alertScore.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#26211C]">
                        <span className="text-xs text-[#AAA29A]">App Classification:</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.2 border ${
                            gdacs.derivedSeverity === 'critical'
                              ? 'bg-red-950/40 text-red-400 border-red-500/50'
                              : gdacs.derivedSeverity === 'high'
                              ? 'bg-orange-950/40 text-orange-400 border-orange-500/50'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40'
                          }`}
                        >
                          {gdacs.derivedSeverity}
                        </Badge>
                      </div>

                      <div className="text-[9.5px] text-[#8C827A] italic leading-tight border-t border-[#26211C] pt-1">
                        * {gdacs.derivedSeverityExplanation}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-[#26211C] pt-1.5 text-[#AAA29A]">
                        <div>
                          <span className="text-[#7C756E] block text-[9.5px] uppercase font-mono">Date Reported</span>
                          <span className="text-[#F4F0EB] font-medium">{timeAgoStr}</span>
                        </div>
                        <div>
                          <span className="text-[#7C756E] block text-[9.5px] uppercase font-mono">Event ID</span>
                          <span className="text-[#F4F0EB] font-mono text-[10px]">{gdacs.eventId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Action: Review & Create Incident */}
                    {mode === 'authority' && (
                      <div className="mb-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (onCreateIncidentFromGDACS) {
                              onCreateIncidentFromGDACS(gdacs);
                            } else {
                              const desc = `GDACS ${gdacs.alertLevel} Alert: ${gdacs.name}. Source: ${gdacs.source}. Event ID: ${gdacs.eventId}. Official advisory: ${gdacs.description}`;
                              navigate(`/admin/incidents/new?type=${encodeURIComponent(gdacs.eventTypeLabel)}&lat=${gdacs.latitude}&lng=${gdacs.longitude}&title=${encodeURIComponent(gdacs.name)}&desc=${encodeURIComponent(desc)}`);
                            }
                          }}
                          className="w-full h-8 text-xs bg-[#059669] hover:bg-[#10B981] text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Activity className="h-3.5 w-3.5 text-white" />
                          <span>Review & Create Incident</span>
                        </Button>
                      </div>
                    )}

                    {/* Source Attribution & Official External Link */}
                    <div className="space-y-2 border-t border-[#38302A] pt-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#7C756E]">
                        <span>SOURCE: {gdacs.source} (GDACS)</span>
                        <span>{gdacs.iso3 || gdacs.country || 'Global'}</span>
                      </div>

                      <a
                        href={gdacs.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-8 text-xs bg-[#10241A] hover:bg-[#183627] border border-[#1E4D36] text-[#A7F3D0] hover:text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Globe className="h-3.5 w-3.5 text-emerald-400" />
                        <span>View Official GDACS Report</span>
                        <ExternalLink className="h-3 w-3 ml-0.5 text-[#A7F3D0]" />
                      </a>

                      <p className="text-[9.5px] text-[#7C756E] text-center leading-tight">
                        External disaster observation from GDACS. Local operational decisions require verification.
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
