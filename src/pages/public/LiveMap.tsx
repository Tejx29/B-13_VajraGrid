import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Layers, 
  RotateCcw, 
  Crosshair, 
  ShieldAlert, 
  AlertTriangle, 
  MapPin, 
  Home, 
  X, 
  Plus, 
  Minus, 
  Info, 
  ExternalLink, 
  Filter, 
  Phone,
  CheckCircle2,
  ChevronRight,
  Menu,
  LifeBuoy,
  Globe,
  RefreshCw,
  Activity,
  Flame,
  Droplets,
  Wind
} from 'lucide-react';
import { VajraGridLogo } from '../../components/brand/VajraGridLogo';
import { MockAPI } from '../../services/mockApi';
import { Incident, Alert, ReliefPoint, Severity, USGSEarthquakeEvent, FIRMSHotspotEvent, GDACSEvent } from '../../types';
import { LiveMap, PALGHAR_CENTER } from '../../components/map/LiveMap';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useUSGSEarthquakes, earthquakeToIncident } from '../../services/usgsService';
import { useFIRMSHotspots, fireToIncident } from '../../services/firmsService';
import { useGDACEvents, gdacsToIncident } from '../../services/gdacsService';

export function LiveMapPage() {
  const navigate = useNavigate();

  // USGS Real-Time Earthquakes Hook
  const {
    events: usgsEvents,
    statusInfo: usgsStatus,
    refresh: refreshUSGS,
  } = useUSGSEarthquakes();

  // NASA FIRMS Real-Time Fire Hotspots Hook
  const {
    events: firmsEvents,
    statusInfo: firmsStatus,
    refresh: refreshFIRMS,
  } = useFIRMSHotspots();

  // GDACS Multi-Hazard Hook (Floods & Cyclones)
  const {
    events: gdacsEvents,
    statusInfo: gdacsStatus,
    refresh: refreshGDACS,
  } = useGDACEvents();

  // Data states
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reliefPoints, setReliefPoints] = useState<ReliefPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  // Basemap & Layer states - Satellite-first by default
  const [basemap, setBasemap] = useState<'satellite' | 'dark' | 'osm'>('satellite');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [layers, setLayers] = useState({
    incidents: true,
    earthquakes: true,
    fires: true,
    gdacs: true,
    alerts: true,
    advisories: true,
    reliefPoints: true,
  });

  // UI Panels & Controls
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);
  const [isFeedOpen, setIsFeedOpen] = useState<boolean>(false);
  const [isAlertBannerVisible, setIsAlertBannerVisible] = useState<boolean>(true);

  // Map Camera Triggers
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [locateMeTrigger, setLocateMeTrigger] = useState<number>(0);

  // Fetch Public GIS Data
  const fetchData = async () => {
    try {
      const [incidentsData, alertsData, reliefData] = await Promise.all([
        MockAPI.getIncidents(),
        MockAPI.getAlerts(),
        MockAPI.getReliefPoints(),
      ]);

      // Public filter: Active incidents only, omitting dismissed ones
      const publicActive = incidentsData.filter(i => i.status !== 'dismissed');
      setIncidents(publicActive);
      setAlerts(alertsData.filter(a => a.active));
      setReliefPoints(reliefData);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load Public GIS data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filtered public incidents based on search query and severity
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const displayId = inc.id.replace('inc_', 'inc-').toLowerCase();
        const matches =
          inc.title.toLowerCase().includes(q) ||
          displayId.includes(q) ||
          inc.location.address?.toLowerCase().includes(q) ||
          inc.location.district?.toLowerCase().includes(q) ||
          inc.aiAnalysis?.recommendedAction?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Severity Filter
      if (selectedSeverity !== 'all') {
        const sev = inc.aiAnalysis?.severity?.toLowerCase();
        if (sev !== selectedSeverity.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, searchQuery, selectedSeverity]);

  // Priority banner alert
  const activeTopAlert = useMemo(() => {
    const critical = alerts.find(a => a.severity === 'critical' && a.active);
    return critical || alerts.find(a => a.active) || null;
  }, [alerts]);

  const criticalCount = useMemo(() => {
    return incidents.filter(i => i.aiAnalysis?.severity === 'critical').length;
  }, [incidents]);

  const openReliefCount = useMemo(() => {
    return reliefPoints.filter(r => r.status === 'open').length;
  }, [reliefPoints]);

  const handleResetPalghar = () => {
    setResetTrigger(prev => prev + 1);
    setSelectedIncident(null);
  };

  const handleLocateMe = () => {
    setLocateMeTrigger(prev => prev + 1);
  };

  const handleSelectIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    if (incident.location?.lat && incident.location?.lng) {
      setFlyToTarget({
        lat: incident.location.lat,
        lng: incident.location.lng,
        zoom: 14,
      });
    }
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-[#090909] text-[#F4F0EB] font-sans selection:bg-[#4F8DFF]/30 selection:text-white">
      {/* 1. Public Top Header */}
      <header className="h-16 bg-[#0B0B0A] border-b border-[#38302A] z-30 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-lg relative">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity" aria-label="VajraGrid Home">
            <VajraGridLogo variant="full" height={34} />
            <div className="hidden sm:flex flex-col border-l border-[#38302A] pl-3 py-0.5">
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-[#4F8DFF] font-mono leading-none">Palghar District</span>
              <span className="text-[9px] text-[#AAA29A] font-medium leading-none mt-1">Disaster Intelligence</span>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#AAA29A] md:absolute md:left-1/2 md:-translate-x-1/2">
          <Link to="/" className="text-[#D0D4DC] hover:text-white transition-colors">Home</Link>
          <Link to="/live-map" className="text-white font-bold border-b-2 border-[#4F8DFF] pb-1">Live Map</Link>
          <Link to="/report" className="text-[#D0D4DC] hover:text-white transition-colors">Citizen Report</Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Prominent Emergency Report Action */}
          <Link 
            to="/report" 
            className="bg-[#E53946] hover:bg-[#f04856] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-950/40 transition-all flex items-center gap-2 group"
          >
            <LifeBuoy className="h-4 w-4 shrink-0 group-hover:rotate-45 transition-transform" />
            <span>Report Emergency</span>
          </Link>

          <Link 
            to="/auth/select" 
            className="hidden sm:inline-flex bg-[#191715] hover:bg-[#27211B] text-[#F4F0EB] px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#38302A] transition-colors"
          >
            Responder Login
          </Link>
        </div>
      </header>

      {/* 2. Top Emergency Advisory Banner (Collapsible) */}
      {isAlertBannerVisible && activeTopAlert && (
        <div className="bg-[#851D2A]/90 border-b border-[#E53946]/50 px-4 py-2.5 z-20 shrink-0 flex items-center justify-between gap-3 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-[#FF525A] animate-ping shrink-0" />
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#090909]/80 text-[#FF525A] border border-[#FF525A]/50 shrink-0">
              OFFICIAL ADVISORY
            </span>
            <span className="font-bold text-[#F4F0EB] truncate">
              {activeTopAlert.title}:
            </span>
            <span className="text-[#C0C4CC] truncate hidden sm:inline">
              {activeTopAlert.description}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-[#FFB454] hidden md:inline">
              Zone: {activeTopAlert.affectedArea.name} ({activeTopAlert.affectedArea.radiusKm} km)
            </span>
            <button 
              onClick={() => setIsAlertBannerVisible(false)}
              className="text-[#AAA29A] hover:text-white p-1 rounded"
              title="Dismiss banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Map Viewport Container */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Full Leaflet Real Geographic Basemap - Satellite First */}
        <div className="w-full h-full relative">
          <LiveMap
            mode="public"
            basemap={basemap}
            incidents={filteredIncidents}
            earthquakes={layers.earthquakes ? usgsEvents : []}
            fires={layers.fires ? firmsEvents : []}
            gdacsEvents={layers.gdacs ? gdacsEvents : []}
            alerts={layers.alerts ? alerts : []}
            reliefPoints={layers.reliefPoints ? reliefPoints : []}
            selectedIncidentId={selectedIncident?.id || null}
            onSelectIncident={handleSelectIncident}
            onSelectEarthquake={(eq) => {
              const asInc = earthquakeToIncident(eq);
              setSelectedIncident(asInc);
              setFlyToTarget({ lat: eq.latitude, lng: eq.longitude, zoom: 7 });
            }}
            onSelectFire={(fire) => {
              const asInc = fireToIncident(fire);
              setSelectedIncident(asInc);
              setFlyToTarget({ lat: fire.latitude, lng: fire.longitude, zoom: 12 });
            }}
            onSelectGDACS={(ev) => {
              const asInc = gdacsToIncident(ev);
              setSelectedIncident(asInc);
              setFlyToTarget({ lat: ev.latitude, lng: ev.longitude, zoom: 6 });
            }}
            layerVisibility={{
              incidents: layers.incidents,
              earthquakes: layers.earthquakes,
              fires: layers.fires,
              gdacs: layers.gdacs,
              alerts: layers.alerts,
              advisories: layers.advisories,
              reliefPoints: layers.reliefPoints,
            }}
            flyToTarget={flyToTarget}
            resetTrigger={resetTrigger}
            locateMeTrigger={locateMeTrigger}
            className="w-full h-full rounded-none border-0"
            height="100%"
          />
        </div>

        {/* 4. Floating Layer & Search Controls (Top-Left) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {/* USGS Live Telemetry Status Pill */}
          <div className="pointer-events-auto bg-[#12110F]/90 backdrop-blur-md rounded-xl border border-[#38302A] px-3 py-1.5 shadow-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                {usgsStatus.status === 'live' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : usgsStatus.status === 'loading' ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-spin"></span>
                ) : usgsStatus.status === 'stale' ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                )}
              </span>
              <span className="font-semibold text-[#F4F0EB] text-[11px]">
                USGS Earthquakes:
              </span>
              <span className="text-[10px] font-mono text-[#AAA29A]">
                {usgsStatus.status === 'live' ? `${usgsEvents.length} Active` : usgsStatus.status.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => refreshUSGS()}
              className="text-[#AAA29A] hover:text-[#F4F0EB] p-1 rounded hover:bg-[#221D18] transition-colors"
              title="Refresh USGS Earthquake Feed"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          {/* NASA FIRMS Live Telemetry Status Pill */}
          <div className="pointer-events-auto bg-[#12110F]/90 backdrop-blur-md rounded-xl border border-[#38302A] px-3 py-1.5 shadow-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                {firmsStatus.status === 'live' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </>
                ) : firmsStatus.status === 'loading' ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 animate-spin"></span>
                ) : firmsStatus.status === 'unconfigured' ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500"></span>
                ) : firmsStatus.status === 'stale' ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                )}
              </span>
              <span className="font-semibold text-[#F4F0EB] text-[11px] flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-400" />
                NASA FIRMS:
              </span>
              <span className="text-[10px] font-mono text-[#AAA29A]">
                {firmsStatus.status === 'live'
                  ? `${firmsEvents.length} Hotspots`
                  : firmsStatus.status === 'unconfigured'
                  ? 'Key Required'
                  : firmsStatus.status.toUpperCase()}
              </span>
            </div>
            {firmsStatus.status === 'unconfigured' ? (
              <a
                href="https://firms.modaps.eosdis.nasa.gov/api/map_key/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 text-[10px] flex items-center gap-0.5 ml-1"
                title="Request free NASA MAP_KEY"
              >
                <span>Get Key</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : (
              <button
                onClick={() => refreshFIRMS()}
                className="text-[#AAA29A] hover:text-[#F4F0EB] p-1 rounded hover:bg-[#221D18] transition-colors"
                title="Refresh NASA FIRMS Satellite Feed"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* GDACS Live Multi-Hazard Status Pill */}
          <div className="pointer-events-auto bg-[#12110F]/90 backdrop-blur-md rounded-xl border border-[#38302A] px-3 py-1.5 shadow-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                {gdacsStatus.status === 'live' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </>
                ) : gdacsStatus.status === 'loading' ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 animate-spin"></span>
                ) : gdacsStatus.status === 'stale' ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                )}
              </span>
              <span className="font-semibold text-[#F4F0EB] text-[11px] flex items-center gap-1">
                <Droplets className="h-3 w-3 text-cyan-400" />
                GDACS Hazards:
              </span>
              <span className="text-[10px] font-mono text-[#AAA29A]">
                {gdacsStatus.status === 'live' ? `${gdacsEvents.length} Active` : gdacsStatus.status.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => refreshGDACS()}
              className="text-[#AAA29A] hover:text-[#F4F0EB] p-1 rounded hover:bg-[#221D18] transition-colors"
              title="Refresh GDACS Feed"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="pointer-events-auto bg-[#12110F]/95 backdrop-blur-md rounded-xl border border-[#38302A] p-2 shadow-2xl flex items-center gap-2">
            <Search className="h-4 w-4 text-[#7C756E] ml-1.5 shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search disasters by area (Virar, Wada...), type..."
              className="w-full bg-transparent text-xs text-[#F4F0EB] placeholder:text-[#7C756E] focus:outline-none py-1 font-medium"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#AAA29A] hover:text-white px-1.5 py-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsLayersOpen(prev => !prev)}
              className={`p-1.5 rounded-lg border text-xs transition-colors shrink-0 ${
                isLayersOpen 
                  ? 'bg-[#F5A23A] border-[#F5A23A] text-stone-950 font-bold' 
                  : 'bg-[#191715] border-[#38302A] text-[#AAA29A] hover:bg-[#27211B] hover:text-[#F4F0EB]'
              }`}
              title="Toggle Map Layers & Filters"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>

          {/* Expandable Layer & Basemap Filters */}
          {isLayersOpen && (
            <div className="pointer-events-auto bg-[#12110F]/95 backdrop-blur-md rounded-xl border border-[#38302A] p-3 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Basemap Selection */}
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C756E] mb-1.5 flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-[#F5A23A]" /> Basemap Style
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBasemap('satellite')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                      basemap === 'satellite'
                        ? 'bg-[#F5A23A] text-stone-950 border-[#F5A23A]'
                        : 'bg-[#191715] text-[#AAA29A] border-[#38302A] hover:bg-[#27211B]'
                    }`}
                  >
                    Satellite
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemap('dark')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                      basemap === 'dark'
                        ? 'bg-[#F5A23A] text-stone-950 border-[#F5A23A]'
                        : 'bg-[#191715] text-[#AAA29A] border-[#38302A] hover:bg-[#27211B]'
                    }`}
                  >
                    Dark Vector
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemap('osm')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                      basemap === 'osm'
                        ? 'bg-[#F5A23A] text-stone-950 border-[#F5A23A]'
                        : 'bg-[#191715] text-[#AAA29A] border-[#38302A] hover:bg-[#27211B]'
                    }`}
                  >
                    Street
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-[#F4F0EB] pb-1.5 border-b border-[#26211C]">
                <span className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-[#F5A23A]" /> Operational Layers
                </span>
                <span className="text-[10px] text-[#AAA29A] font-mono">
                  {filteredIncidents.length} shown
                </span>
              </div>

              {/* Layer checkboxes */}
              <div className="grid grid-cols-2 gap-2 text-xs text-[#AAA29A]">
                <label className="flex items-center gap-2 cursor-pointer hover:text-[#F4F0EB] transition-colors p-1.5 rounded bg-[#191715] border border-[#38302A]">
                  <input
                    type="checkbox"
                    checked={layers.incidents}
                    onChange={(e) => setLayers(prev => ({ ...prev, incidents: e.target.checked }))}
                    className="accent-[#F5A23A] rounded"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E53946] inline-block shrink-0" />
                  <span className="truncate">Active Disasters ({incidents.length})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-[#F4F0EB] transition-colors p-1.5 rounded bg-[#191715] border border-[#38302A]">
                  <input
                    type="checkbox"
                    checked={layers.earthquakes}
                    onChange={(e) => setLayers(prev => ({ ...prev, earthquakes: e.target.checked }))}
                    className="accent-[#F5A23A] rounded"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shrink-0" />
                  <span className="truncate">USGS Earthquakes ({usgsEvents.length})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-[#F4F0EB] transition-colors p-1.5 rounded bg-[#191715] border border-[#38302A]">
                  <input
                    type="checkbox"
                    checked={layers.fires}
                    onChange={(e) => setLayers(prev => ({ ...prev, fires: e.target.checked }))}
                    className="accent-orange-500 rounded"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shrink-0" />
                  <span className="truncate">NASA FIRMS Fires ({firmsEvents.length})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-[#F4F0EB] transition-colors p-1.5 rounded bg-[#191715] border border-[#38302A]">
                  <input
                    type="checkbox"
                    checked={layers.gdacs}
                    onChange={(e) => setLayers(prev => ({ ...prev, gdacs: e.target.checked }))}
                    className="accent-cyan-400 rounded"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shrink-0" />
                  <span className="truncate">GDACS Hazards ({gdacsEvents.length})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-[#F4F0EB] transition-colors p-1.5 rounded bg-[#191715] border border-[#38302A]">
                  <input
                    type="checkbox"
                    checked={layers.alerts}
                    onChange={(e) => setLayers(prev => ({ ...prev, alerts: e.target.checked }))}
                    className="accent-[#F5A23A] rounded"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F46B27] inline-block shrink-0" />
                  <span className="truncate">Warnings & Hazards ({alerts.length})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-[#F4F0EB] transition-colors p-1.5 rounded bg-[#191715] border border-[#38302A]">
                  <input
                    type="checkbox"
                    checked={layers.advisories}
                    onChange={(e) => setLayers(prev => ({ ...prev, advisories: e.target.checked }))}
                    className="accent-[#F5A23A] rounded"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#75A9FF] inline-block shrink-0" />
                  <span className="truncate">Official Advisories</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-[#F4F0EB] transition-colors p-1.5 rounded bg-[#191715] border border-[#38302A]">
                  <input
                    type="checkbox"
                    checked={layers.reliefPoints}
                    onChange={(e) => setLayers(prev => ({ ...prev, reliefPoints: e.target.checked }))}
                    className="accent-[#F5A23A] rounded"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16B58A] inline-block shrink-0" />
                  <span className="truncate">Relief Centers ({reliefPoints.length})</span>
                </label>
              </div>

              {/* Severity Filter Pills */}
              <div className="pt-2 border-t border-[#26211C] flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-[#7C756E] mr-1">Severity:</span>
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSelectedSeverity(sev)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize transition-colors ${
                      selectedSeverity === sev
                        ? sev === 'critical'
                          ? 'bg-[#E53946] text-white'
                          : sev === 'high'
                          ? 'bg-[#F46B27] text-white'
                          : 'bg-[#F5A23A] text-stone-950'
                        : 'bg-[#191715] text-[#AAA29A] hover:bg-[#27211B] hover:text-[#F4F0EB] border border-[#38302A]'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Map Camera Controls (Top-Right) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Zoom In */}
          <button
            onClick={() => {
              const mapEl = document.querySelector('.leaflet-container');
              if (mapEl && (mapEl as any)._leaflet_map) {
                (mapEl as any)._leaflet_map.zoomIn();
              }
            }}
            className="bg-[#12110F]/95 backdrop-blur-md p-2.5 rounded-xl border border-[#38302A] shadow-2xl text-[#AAA29A] hover:bg-[#27211B] hover:text-white transition-colors"
            title="Zoom In"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => {
              const mapEl = document.querySelector('.leaflet-container');
              if (mapEl && (mapEl as any)._leaflet_map) {
                (mapEl as any)._leaflet_map.zoomOut();
              }
            }}
            className="bg-[#12110F]/95 backdrop-blur-md p-2.5 rounded-xl border border-[#38302A] shadow-2xl text-[#AAA29A] hover:bg-[#27211B] hover:text-white transition-colors"
            title="Zoom Out"
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Reset Center */}
          <button
            onClick={handleResetPalghar}
            className="bg-[#12110F]/95 backdrop-blur-md p-2.5 rounded-xl border border-[#38302A] shadow-2xl text-[#AAA29A] hover:bg-[#27211B] hover:text-white transition-colors"
            title="Reset to Palghar District Center"
          >
            <RotateCcw className="h-4 w-4 text-[#F5A23A]" />
          </button>

          {/* Locate Me (GPS) */}
          <button
            onClick={handleLocateMe}
            className="bg-[#12110F]/95 backdrop-blur-md p-2.5 rounded-xl border border-[#38302A] shadow-2xl text-[#AAA29A] hover:bg-[#27211B] hover:text-white transition-colors"
            title="Locate My Position via GPS"
          >
            <Crosshair className="h-4 w-4 text-[#16B58A]" />
          </button>

          {/* Toggle Incident Feed List */}
          <button
            onClick={() => setIsFeedOpen(prev => !prev)}
            className={`p-2.5 rounded-xl border shadow-2xl transition-colors ${
              isFeedOpen 
                ? 'bg-[#F5A23A] border-[#F5A23A] text-stone-950 font-bold' 
                : 'bg-[#12110F]/95 backdrop-blur-md border-[#38302A] text-[#AAA29A] hover:bg-[#27211B] hover:text-white'
            }`}
            title="Toggle Incident List Feed"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* 6. Incident Feed Drawer (Expandable on Right) */}
        {isFeedOpen && (
          <div className="absolute top-20 right-4 bottom-14 z-20 w-80 bg-[#12110F]/95 backdrop-blur-md rounded-2xl border border-[#38302A] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-150">
            <div className="p-3 bg-[#191715] border-b border-[#26211C] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#F4F0EB]">
                  Public Incident Feed
                </h3>
                <span className="text-[10px] text-[#AAA29A] font-mono">
                  {filteredIncidents.length} incidents in view
                </span>
              </div>
              <button 
                onClick={() => setIsFeedOpen(false)}
                className="text-[#AAA29A] hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#26211C] p-2 space-y-1.5">
              {filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const sev = inc.aiAnalysis?.severity || 'medium';

                return (
                  <div
                    key={inc.id}
                    onClick={() => handleSelectIncident(inc)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[#27211B] border-[#F5A23A] shadow-md'
                        : 'bg-[#191715]/70 border-[#38302A] hover:bg-[#27211B] hover:border-[#F5A23A]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        sev === 'critical'
                          ? 'bg-[#851D2A] text-[#FF525A] border-[#FF525A]/50'
                          : sev === 'high'
                          ? 'bg-[#F46B27]/20 text-[#F46B27] border-[#F46B27]/40'
                          : 'bg-[#F5A23A]/20 text-[#F5A23A] border-[#F5A23A]/40'
                      }`}>
                        {sev}
                      </span>
                      <span className="text-[10px] font-mono text-[#7C756E]">
                        {inc.id.replace('inc_', 'INC-').toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-[#F4F0EB] truncate">
                      {inc.title}
                    </h4>

                    <p className="text-[11px] text-[#AAA29A] flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="h-3 w-3 text-[#7C756E] shrink-0" />
                      {inc.location.address || 'Palghar District'}
                    </p>
                  </div>
                );
              })}

              {filteredIncidents.length === 0 && (
                <div className="p-6 text-center text-xs text-[#7C756E]">
                  No active incidents matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Public-Safe Selected Incident Details Card (Floating on Bottom-Right) */}
        {selectedIncident && (
          <div className="absolute bottom-14 right-4 z-20 w-96 max-w-[calc(100vw-2rem)] bg-[#12110F]/95 backdrop-blur-md p-4 rounded-2xl border border-[#F5A23A]/50 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-3 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  selectedIncident.aiAnalysis?.severity === 'critical'
                    ? 'bg-[#851D2A] text-[#FF525A] border-[#FF525A]/50'
                    : selectedIncident.aiAnalysis?.severity === 'high'
                    ? 'bg-[#F46B27]/20 text-[#F46B27] border-[#F46B27]/40'
                    : 'bg-[#F5A23A]/20 text-[#F5A23A] border-[#F5A23A]/40'
                }`}>
                  {selectedIncident.aiAnalysis?.severity?.toUpperCase() || 'ALERT'}
                </span>
                <span className="font-mono text-[11px] text-[#AAA29A]">
                  ID: {selectedIncident.id.replace('inc_', 'INC-').toUpperCase()}
                </span>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="text-[#AAA29A] hover:text-white p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h3 className="font-bold text-[#F4F0EB] text-base leading-snug">
                {selectedIncident.title}
              </h3>
              <p className="text-xs text-[#AAA29A] flex items-start gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5 text-[#F5A23A] shrink-0 mt-0.5" />
                <span>
                  {selectedIncident.location.address || 'Location Coordinates Pinpointed'}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1 pl-5 text-[10px] font-mono text-[#7C756E]">
                <span>{selectedIncident.location.lat.toFixed(4)}° N, {selectedIncident.location.lng.toFixed(4)}° E</span>
                {selectedIncident.location.district && (
                  <span>&bull; District: {selectedIncident.location.district}</span>
                )}
              </div>
            </div>

            {/* Public Advisory Box */}
            <div className="bg-[#191715] p-3 rounded-xl border border-[#38302A] flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5A23A] flex items-center gap-1">
                <Info className="h-3 w-3" /> Published Public Safety Advisory
              </span>
              <p className="text-xs text-[#F4F0EB] leading-relaxed">
                {selectedIncident.aiAnalysis?.recommendedAction || selectedIncident.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-[#AAA29A]">
              <span>Reported: {new Date(selectedIncident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <Link
                to="/report"
                className="text-xs bg-[#E53946] hover:bg-[#f04856] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors shadow-sm"
              >
                Report Related Update
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* 8. Compact Floating Legend (Bottom-Left) */}
        <div className="absolute bottom-14 left-4 z-20 bg-[#12110F]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#38302A] shadow-2xl flex flex-wrap items-center gap-3 text-xs text-[#AAA29A]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E53946] inline-block shadow-sm" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F46B27] inline-block shadow-sm" />
            <span>High/Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5A23A] inline-block shadow-sm" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4F8DFF] inline-block shadow-sm" />
            <span>Hazard Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16B58A] inline-block shadow-sm" />
            <span>Relief Shelter</span>
          </div>
        </div>
      </main>

      {/* 9. Bottom Operational Status Bar */}
      <footer className="h-10 bg-[#0B0B0A] border-t border-[#38302A] z-30 flex items-center justify-between px-4 sm:px-6 text-[11px] font-mono text-[#AAA29A] shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#16B58A] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#16B58A] animate-ping inline-block" />
            PUBLIC GIS LIVE FEED
          </span>
          <span className="text-[#38302A]">|</span>
          <span className="hidden sm:inline">Palghar District & Adjacent Sectors</span>
          <span className="text-[#38302A] hidden sm:inline">|</span>
          <span>Updated: {lastRefreshed}</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <span>Active: <strong className="text-[#F4F0EB]">{incidents.length}</strong></span>
          <span>Critical: <strong className="text-[#FF525A]">{criticalCount}</strong></span>
          <span className="hidden md:inline">Shelters: <strong className="text-[#16B58A]">{openReliefCount} Open</strong></span>
          <span className="text-[#7C756E] hidden lg:inline">Emergency Helpline: <strong>112 / 02525-252020</strong></span>
        </div>
      </footer>
    </div>
  );
}

export { LiveMapPage as LiveMap };
