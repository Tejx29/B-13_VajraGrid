import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  Maximize2,
  Minimize2,
  Plus,
  Activity,
  Layers,
  MapPin,
  X,
  Clock,
  Radio,
  Flame,
  Droplets,
  AlertCircle,
  Megaphone,
  Siren,
  AlertTriangle,
  RefreshCw,
  Globe,
  Waves,
  Wifi,
  ExternalLink,
  Wind
} from 'lucide-react';
import { MockAPI, PALGHAR_GEOGRAPHIC_LOCATIONS } from '../../services/mockApi';
import { Incident, Resource, Volunteer, Alert, Severity, USGSEarthquakeEvent, USGSFeedFrequency, FIRMSHotspotEvent, FIRMSSensorType, GDACSEvent } from '../../types';
import { LiveMap, PALGHAR_CENTER } from '../../components/map/LiveMap';
import { useUSGSEarthquakes, USGS_FEEDS } from '../../services/usgsService';
import { useFIRMSHotspots, FIRMS_SENSORS, FIRMS_EXTENTS, FIRMSExtentKey } from '../../services/firmsService';
import { useGDACEvents, GDACS_FEEDS } from '../../services/gdacsService';

export function AuthorityLiveMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const outletContext = useOutletContext<{ globalSearchQuery?: string }>() || {};

  // USGS Real-Time Earthquake Telemetry Hook
  const {
    events: usgsEvents,
    statusInfo: usgsStatus,
    refresh: refreshUSGS,
    setFeed: setUSGSFeed,
    activeFeedKey: activeUSGSFeedKey,
  } = useUSGSEarthquakes();

  // NASA FIRMS Real-Time Fire Telemetry Hook
  const {
    events: firmsEvents,
    statusInfo: firmsStatus,
    refresh: refreshFIRMS,
    setSensor: setFIRMSSensor,
    setExtent: setFIRMSExtent,
    activeSensor: activeFIRMSSensor,
    activeExtent: activeFIRMSExtent,
  } = useFIRMSHotspots();

  // GDACS Multi-Hazard Telemetry Hook (Floods & Cyclones)
  const {
    events: gdacsEvents,
    statusInfo: gdacsStatus,
    refresh: refreshGDACS,
    setEventType: setGDACSEventType,
  } = useGDACEvents();

  // Operational Data States
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [panelTab, setPanelTab] = useState<'incidents' | 'usgs' | 'firms' | 'gdacs'>('incidents');
  const [isRefreshingUSGS, setIsRefreshingUSGS] = useState<boolean>(false);
  const [isRefreshingFIRMS, setIsRefreshingFIRMS] = useState<boolean>(false);
  const [isRefreshingGDACS, setIsRefreshingGDACS] = useState<boolean>(false);

  // Command & Filter States
  const [commandMode, setCommandMode] = useState<'normal' | 'disaster' | 'evacuation'>('disaster');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || outletContext.globalSearchQuery || '');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Map Basemap & Layer Toggles (Default to Satellite matching Stitch design)
  const [basemap, setBasemap] = useState<'dark' | 'osm' | 'satellite'>('satellite');
  const [showLayersDropdown, setShowLayersDropdown] = useState<boolean>(false);
  const layersDropdownRef = useRef<HTMLDivElement>(null);

  const [layers, setLayers] = useState({
    incidents: true,
    earthquakes: true,
    fires: true,
    gdacs: true,
    volunteers: true,
    resources: true,
    alerts: true,
    reliefPoints: true,
  });

  // Map Interaction Triggers
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<number>(0);
  const [locateMeTrigger, setLocateMeTrigger] = useState<number>(0);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Real-time clock (matches 9:50:18 PM format in reference)
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' })
  );

  // Action Modals State
  const [showSendAlertModal, setShowSendAlertModal] = useState<boolean>(false);
  const [showEWSModal, setShowEWSModal] = useState<boolean>(false);

  // Send Alert Form State
  const [alertTitle, setAlertTitle] = useState('Flash Flood & High Water Advisory');
  const [alertTaluka, setAlertTaluka] = useState('Manor / Palghar Coastal');
  const [alertSeverity, setAlertSeverity] = useState<Severity>('critical');
  const [alertRadius, setAlertRadius] = useState<number>(10);
  const [alertDescription, setAlertDescription] = useState('Surya River water level near danger mark. Evacuation teams alerted.');

  // EWS Activation State
  const [ewsConfirmed, setEwsConfirmed] = useState(false);
  const [ewsActive, setEwsActive] = useState(false);

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync search query from global header if changed
  useEffect(() => {
    if (outletContext.globalSearchQuery !== undefined) {
      setSearchQuery(outletContext.globalSearchQuery);
    }
  }, [outletContext.globalSearchQuery]);

  // Click outside to close layers dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layersDropdownRef.current && !layersDropdownRef.current.contains(event.target as Node)) {
        setShowLayersDropdown(false);
      }
    };
    if (showLayersDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLayersDropdown]);

  // Fetch all GIS and operational data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [incidentsData, resourcesData, volunteersData, alertsData] = await Promise.all([
        MockAPI.getIncidents(),
        MockAPI.getResources(),
        MockAPI.getVolunteers(),
        MockAPI.getAlerts(),
      ]);

      setIncidents(incidentsData);
      setResources(resourcesData);
      setVolunteers(volunteersData);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to fetch command center data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Filter incidents based on search query, severity, and command mode
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        incident.title.toLowerCase().includes(q) ||
        (incident.location.address && incident.location.address.toLowerCase().includes(q)) ||
        (incident.id && incident.id.toLowerCase().includes(q)) ||
        (incident.type && incident.type.toLowerCase().includes(q));

      const sev = (incident.aiAnalysis?.severity || 'medium').toLowerCase();
      const matchesSeverity =
        selectedSeverity === 'all' ||
        sev === selectedSeverity.toLowerCase() ||
        (selectedSeverity === 'crit' && sev === 'critical') ||
        (selectedSeverity === 'med' && sev === 'medium');

      // Command Mode filtering
      if (commandMode === 'evacuation') {
        const matchesEvac =
          incident.status === 'in_progress' ||
          incident.status === 'responding' ||
          sev === 'critical' ||
          sev === 'high';
        return matchesSearch && matchesSeverity && matchesEvac;
      }

      return matchesSearch && matchesSeverity;
    });
  }, [incidents, searchQuery, selectedSeverity, commandMode]);

  // Filter USGS earthquakes based on search query and severity
  const filteredEarthquakes = useMemo(() => {
    return usgsEvents.filter((eq) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        eq.title.toLowerCase().includes(q) ||
        eq.place.toLowerCase().includes(q) ||
        eq.sourceId.toLowerCase().includes(q);

      const matchesSeverity =
        selectedSeverity === 'all' ||
        eq.derivedSeverity === selectedSeverity.toLowerCase() ||
        (selectedSeverity === 'crit' && eq.derivedSeverity === 'critical') ||
        (selectedSeverity === 'med' && eq.derivedSeverity === 'medium');

      return matchesSearch && matchesSeverity;
    });
  }, [usgsEvents, searchQuery, selectedSeverity]);

  // Filter NASA FIRMS fires based on search query and severity
  const filteredFires = useMemo(() => {
    return firmsEvents.filter((fire) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        fire.instrument.toLowerCase().includes(q) ||
        fire.sourceId.toLowerCase().includes(q) ||
        fire.confidenceLabel.toLowerCase().includes(q);

      const matchesSeverity =
        selectedSeverity === 'all' ||
        (selectedSeverity === 'critical' && (fire.confidence === 'high' || (fire.fireRadiativePower || 0) >= 50)) ||
        (selectedSeverity === 'high' && ((fire.fireRadiativePower || 0) >= 20 || fire.confidence === 'high')) ||
        (selectedSeverity === 'medium' && fire.confidence === 'nominal') ||
        (selectedSeverity === 'low' && fire.confidence === 'low');

      return matchesSearch && matchesSeverity;
    });
  }, [firmsEvents, searchQuery, selectedSeverity]);

  // Filter GDACS multi-hazard events based on search query and severity
  const filteredGDACS = useMemo(() => {
    return gdacsEvents.filter((ev) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ev.name.toLowerCase().includes(q) ||
        (ev.country && ev.country.toLowerCase().includes(q)) ||
        ev.eventTypeLabel.toLowerCase().includes(q) ||
        ev.alertLevel.toLowerCase().includes(q) ||
        ev.sourceId.toLowerCase().includes(q);

      const matchesSeverity =
        selectedSeverity === 'all' ||
        ev.derivedSeverity === selectedSeverity.toLowerCase() ||
        (selectedSeverity === 'critical' && ev.alertLevel.toLowerCase() === 'red') ||
        (selectedSeverity === 'high' && ev.alertLevel.toLowerCase() === 'orange') ||
        (selectedSeverity === 'medium' && ev.alertLevel.toLowerCase() === 'green');

      return matchesSearch && matchesSeverity;
    });
  }, [gdacsEvents, searchQuery, selectedSeverity]);

  // Center & Select incident on map
  const handleFocusIncident = (incident: Incident) => {
    setSelectedIncidentId(incident.id);
    if (incident.location?.lat && incident.location?.lng) {
      setFlyToTarget({
        lat: incident.location.lat,
        lng: incident.location.lng,
        zoom: 14,
      });
    }
  };

  // Send Alert Handler
  const handleSendAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedLoc = PALGHAR_GEOGRAPHIC_LOCATIONS.find((l) => l.name.includes(alertTaluka)) || {
        name: alertTaluka,
        lat: 19.6967,
        lng: 72.7699,
      };

      const newAlert: Alert = {
        id: `alert_${Date.now()}`,
        type: 'evacuation',
        title: alertTitle,
        description: alertDescription,
        severity: alertSeverity,
        affectedArea: {
          name: selectedLoc.name,
          lat: selectedLoc.lat,
          lng: selectedLoc.lng,
          radiusKm: alertRadius,
        },
        issuedAt: new Date().toISOString(),
        active: true,
      };

      const createdAlert = await MockAPI.createAlert(newAlert);
      setAlerts((prev) => [createdAlert, ...prev.filter(a => a.id !== createdAlert.id)]);
      setShowSendAlertModal(false);
      setLayers((prev) => ({ ...prev, alerts: true }));
      setFlyToTarget({ lat: selectedLoc.lat, lng: selectedLoc.lng, zoom: 12 });
    } catch (err) {
      console.error('Failed to dispatch alert:', err);
    }
  };

  // Activate EWS handler
  const handleActivateEWS = () => {
    setEwsActive(true);
    setShowEWSModal(false);
    MockAPI.addNotification('warning', 'high', 'EMERGENCY EARLY WARNING SYSTEM (EWS) ACTIVATED FOR PALGHAR DISTRICT.');
  };

  // Time elapsed formatter (e.g. 21h, 22h, 1d)
  const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) return '2h';
    try {
      const diff = Math.max(0, Date.now() - new Date(timestamp).getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) {
        const mins = Math.floor(diff / (1000 * 60));
        return `${Math.max(1, mins)}m`;
      }
      if (hours < 24) return `${hours}h`;
      const days = Math.floor(hours / 24);
      return `${days}d`;
    } catch {
      return '1h';
    }
  };

  // Status pill styling helper
  const formatStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'pending') {
      return { label: 'pending', cls: 'border-[#B45309] text-[#F5A23A] bg-[#211B14]' };
    }
    if (s === 'in_progress' || s === 'responding') {
      return { label: 'Responding', cls: 'border-[#C2410C] text-[#FB923C] bg-[#241812]' };
    }
    if (s === 'verified' || s === 'validated') {
      return { label: 'Validated', cls: 'border-[#7E22CE] text-[#C084FC] bg-[#1D1424]' };
    }
    if (s === 'resolved') {
      return { label: 'resolved', cls: 'border-[#047857] text-[#34D399] bg-[#11221B]' };
    }
    return { label: status.replace(/_/g, ' '), cls: 'border-[#38302A] text-[#AAA29A] bg-[#191715]' };
  };

  // Disaster Icon Helper matching Stitch design
  const getDisasterIcon = (type?: string, severity?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('flood') || t.includes('water')) {
      return (
        <div className="w-5.5 h-5.5 rounded bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
          <Droplets className="h-3 w-3" />
        </div>
      );
    }
    if (t.includes('fire')) {
      return (
        <div className="w-5.5 h-5.5 rounded bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
          <Flame className="h-3 w-3" />
        </div>
      );
    }
    if (t.includes('medical') || t.includes('emergency')) {
      return (
        <div className="w-5.5 h-5.5 rounded bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
          <Activity className="h-3 w-3" />
        </div>
      );
    }
    return (
      <div className={`w-5.5 h-5.5 rounded ${severity === 'critical' ? 'bg-[#E53946]/15 border border-[#E53946]/30 text-[#E53946]' : 'bg-[#F5A23A]/15 border border-[#F5A23A]/30 text-[#F5A23A]'} flex items-center justify-center shrink-0`}>
        <AlertTriangle className="h-3 w-3" />
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full min-h-0 bg-[#090909] text-[#F4F0EB] overflow-hidden relative font-sans">
      {/* =========================================================================
          COMMAND TOOLBAR (Matches Stitch Reference Exactly)
          Left: Unified Command title + Segmented toggle [ Normal | Disaster | Evacuation ]
          Right: + Add Incident | Send Alert | Activate EWS | Clock | Fullscreen
      ========================================================================= */}
      <div className="h-12 bg-[#090909] border-b border-[#26211C] px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-10">
        {/* Left: Unified Command title + Segmented Command Mode */}
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm sm:text-base text-[#F4F0EB] tracking-tight whitespace-nowrap">
            Unified Command
          </span>

          {/* Segmented Mode Selector: Normal | Disaster | Evacuation */}
          <div className="flex items-center rounded-lg bg-[#141210] border border-[#2A241F] p-0.5 text-xs font-semibold">
            <button
              onClick={() => setCommandMode('normal')}
              className={`px-3 py-1 rounded-md transition-colors ${
                commandMode === 'normal'
                  ? 'bg-[#221D17] text-[#F4F0EB] border border-[#453A30] shadow-xs'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB]'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setCommandMode('disaster')}
              className={`px-3 py-1 rounded-md transition-colors ${
                commandMode === 'disaster'
                  ? 'bg-[#221D17] text-[#F4F0EB] border border-[#453A30] shadow-xs'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB]'
              }`}
            >
              Disaster
            </button>
            <button
              onClick={() => setCommandMode('evacuation')}
              className={`px-3 py-1 rounded-md transition-colors ${
                commandMode === 'evacuation'
                  ? 'bg-[#221D17] text-[#F4F0EB] border border-[#453A30] shadow-xs'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB]'
              }`}
            >
              Evacuation
            </button>
          </div>
        </div>

        {/* Right: Actions, Live Clock, Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          {/* EWS Active Status Banner if triggered */}
          {ewsActive && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2D0D11] border border-[#E53946] text-[#F4F0EB] text-[11px] font-mono font-bold animate-pulse">
              <Siren className="h-3.5 w-3.5 text-[#E53946]" />
              <span>EWS BROADCAST ACTIVE</span>
            </div>
          )}

          {/* + Add Incident Button (Directly routes to existing Add Incident page) */}
          <button
            onClick={() => navigate('/admin/incidents/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181614] hover:bg-[#221D18] border border-[#3D352E] text-[#F4F0EB] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-[#AAA29A]" />
            <span>Add Incident</span>
          </button>

          {/* Send Alert Button */}
          <button
            onClick={() => setShowSendAlertModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181614] hover:bg-[#221D18] border border-[#3D352E] text-[#F4F0EB] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Megaphone className="h-3.5 w-3.5 text-[#F5A23A]" />
            <span>Send Alert</span>
          </button>

          {/* Activate EWS Button (Amber-Crimson Glowing Gradient) */}
          <button
            onClick={() => setShowEWSModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#F46B27] via-[#EA4533] to-[#E53946] hover:brightness-110 text-white text-xs font-bold shadow-[0_0_15px_rgba(244,107,39,0.35)] transition-all cursor-pointer"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Activate EWS</span>
          </button>

          {/* Live UTC/Local Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 text-xs font-mono text-[#AAA29A]">
            <Clock className="h-3 w-3 text-[#7C756E]" />
            <span>{currentTime}</span>
          </div>

          {/* Fullscreen Expand Control */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715] rounded transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE LAYOUT (2-Panel Desktop Structure)
          Left: Active Incidents Panel (Warm Charcoal with subtle amber edge glow)
          Right: Large Interactive Map (Satellite Imagery filling all remaining space)
      ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden relative">
        {/* =======================================================================
            B. ACTIVE INCIDENTS PANEL
            Directly to the right of the navigation sidebar.
            Width: ~340px to 360px (~21-22% desktop viewport)
            Surfaces: #12110F with subtle localized amber glow along outer edges
        ======================================================================= */}
        <div className="w-full lg:w-[340px] xl:w-[360px] shrink-0 flex flex-col bg-[#12110F] border-r border-[#26211C] h-full min-h-0 z-10 shadow-[0_0_24px_-4px_rgba(245,162,58,0.12)]">
          {/* Panel Header & Tabs */}
          <div className="p-3 border-b border-[#26211C] bg-[#12110F] space-y-2 shrink-0">
            {/* Tab Switcher: Local Incidents vs USGS Quakes vs NASA FIRMS Fires vs GDACS Multi-Hazard */}
            <div className="grid grid-cols-4 p-0.5 rounded-lg bg-[#191715] border border-[#2E2721] text-xs font-semibold">
              <button
                onClick={() => setPanelTab('incidents')}
                className={`py-1.5 px-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  panelTab === 'incidents'
                    ? 'bg-[#26211C] text-[#F4F0EB] border border-[#3E342B] shadow-xs'
                    : 'text-[#AAA29A] hover:text-[#F4F0EB]'
                }`}
                title="Palghar Operational Incidents"
              >
                <AlertTriangle className="h-3 w-3 text-[#F5A23A] shrink-0" />
                <span className="truncate text-[10px]">Local ({filteredIncidents.length})</span>
              </button>
              <button
                onClick={() => setPanelTab('usgs')}
                className={`py-1.5 px-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  panelTab === 'usgs'
                    ? 'bg-[#26211C] text-[#F4F0EB] border border-[#3E342B] shadow-xs'
                    : 'text-[#AAA29A] hover:text-[#F4F0EB]'
                }`}
                title="USGS Real-Time Earthquakes"
              >
                <Activity className="h-3 w-3 text-amber-400 shrink-0" />
                <span className="truncate text-[10px]">USGS ({usgsEvents.length})</span>
              </button>
              <button
                onClick={() => setPanelTab('firms')}
                className={`py-1.5 px-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  panelTab === 'firms'
                    ? 'bg-[#26211C] text-[#F4F0EB] border border-[#3E342B] shadow-xs'
                    : 'text-[#AAA29A] hover:text-[#F4F0EB]'
                }`}
                title="NASA FIRMS Thermal Hotspots"
              >
                <Flame className="h-3 w-3 text-orange-400 shrink-0" />
                <span className="truncate text-[10px]">Fires ({firmsEvents.length})</span>
              </button>
              <button
                onClick={() => setPanelTab('gdacs')}
                className={`py-1.5 px-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  panelTab === 'gdacs'
                    ? 'bg-[#26211C] text-[#F4F0EB] border border-[#3E342B] shadow-xs'
                    : 'text-[#AAA29A] hover:text-[#F4F0EB]'
                }`}
                title="GDACS Multi-Hazard Alerts (Floods & Cyclones)"
              >
                <Droplets className="h-3 w-3 text-cyan-400 shrink-0" />
                <span className="truncate text-[10px]">GDACS ({gdacsEvents.length})</span>
              </button>
            </div>

            {/* Header info based on selected tab */}
            {panelTab === 'incidents' ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#AAA29A] tracking-wide">
                  Palghar Incident Queue
                </span>
                <span className="text-[10px] font-mono text-[#7C756E]">
                  DEMO DATA
                </span>
              </div>
            ) : panelTab === 'usgs' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    USGS Real-Time Feed
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#AAA29A]">
                    <button
                      onClick={async () => {
                        setIsRefreshingUSGS(true);
                        await refreshUSGS();
                        setTimeout(() => setIsRefreshingUSGS(false), 500);
                      }}
                      className="hover:text-white p-0.5"
                      title="Refresh USGS feed"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRefreshingUSGS ? 'animate-spin text-[#F5A23A]' : ''}`} />
                    </button>
                    <span>{usgsStatus.lastSuccessfulUpdate ? new Date(usgsStatus.lastSuccessfulUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Syncing'}</span>
                  </div>
                </div>

                {/* Feed Selector Dropdown */}
                <select
                  value={activeUSGSFeedKey}
                  onChange={(e) => setUSGSFeed(e.target.value as USGSFeedFrequency)}
                  className="w-full bg-[#191715] border border-[#2E2721] rounded px-2 py-1 text-[11px] font-medium text-[#F4F0EB] focus:outline-none focus:border-[#F5A23A] cursor-pointer"
                >
                  {Object.entries(USGS_FEEDS).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : panelTab === 'firms' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                    NASA FIRMS Satellites
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#AAA29A]">
                    <button
                      onClick={async () => {
                        setIsRefreshingFIRMS(true);
                        await refreshFIRMS();
                        setTimeout(() => setIsRefreshingFIRMS(false), 500);
                      }}
                      className="hover:text-white p-0.5"
                      title="Refresh NASA FIRMS feed"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRefreshingFIRMS ? 'animate-spin text-orange-400' : ''}`} />
                    </button>
                    <span>{firmsStatus.lastSuccessfulUpdate ? new Date(firmsStatus.lastSuccessfulUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : firmsStatus.status.toUpperCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={activeFIRMSSensor}
                    onChange={(e) => setFIRMSSensor(e.target.value as FIRMSSensorType)}
                    className="w-full bg-[#191715] border border-[#2E2721] rounded px-1.5 py-1 text-[10px] font-medium text-[#F4F0EB] focus:outline-none focus:border-orange-500 cursor-pointer truncate"
                    title="Select Satellite Sensor"
                  >
                    {Object.entries(FIRMS_SENSORS).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={activeFIRMSExtent}
                    onChange={(e) => setFIRMSExtent(e.target.value as FIRMSExtentKey)}
                    className="w-full bg-[#191715] border border-[#2E2721] rounded px-1.5 py-1 text-[10px] font-medium text-[#F4F0EB] focus:outline-none focus:border-orange-500 cursor-pointer truncate"
                    title="Select Region Extent"
                  >
                    {Object.entries(FIRMS_EXTENTS).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    GDACS Multi-Hazard
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#AAA29A]">
                    <button
                      onClick={async () => {
                        setIsRefreshingGDACS(true);
                        await refreshGDACS();
                        setTimeout(() => setIsRefreshingGDACS(false), 500);
                      }}
                      className="hover:text-white p-0.5"
                      title="Refresh GDACS feed"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRefreshingGDACS ? 'animate-spin text-cyan-400' : ''}`} />
                    </button>
                    <span>{gdacsStatus.lastSuccessfulUpdate ? new Date(gdacsStatus.lastSuccessfulUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : gdacsStatus.status.toUpperCase()}</span>
                  </div>
                </div>

                <select
                  value={gdacsStatus.activeEventType}
                  onChange={(e) => setGDACSEventType(e.target.value as any)}
                  className="w-full bg-[#191715] border border-[#2E2721] rounded px-2 py-1 text-[11px] font-medium text-[#F4F0EB] focus:outline-none focus:border-cyan-500 cursor-pointer"
                  title="Filter GDACS Hazard Type"
                >
                  <option value="all">All Hazards (Floods & Cyclones)</option>
                  <option value="FL">Floods Only (GLOFAS)</option>
                  <option value="TC">Tropical Cyclones Only</option>
                </select>
              </div>
            )}

            {/* Search inside incident / earthquake / fire / GDACS list */}
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C756E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  panelTab === 'incidents'
                    ? 'Filter by title, address, type...'
                    : panelTab === 'usgs'
                    ? 'Filter earthquakes by place...'
                    : panelTab === 'firms'
                    ? 'Filter fires by instrument, confidence...'
                    : 'Filter hazards by name, country...'
                }
                className="w-full bg-[#191715] border border-[#2E2721] rounded-md pl-8 pr-7 py-1 text-xs text-[#F4F0EB] placeholder:text-[#7C756E] focus:outline-none focus:border-[#F5A23A]/70 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7C756E] hover:text-[#F4F0EB]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Severity Filter Strip matching Stitch [ All | Critical | High | Medium | Low ] */}
            <div className="flex items-center gap-1 pt-1 text-[11px]">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => {
                const isActive = selectedSeverity === sev;
                return (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`flex-1 py-1 rounded text-[10px] font-semibold capitalize transition-colors border ${
                      isActive
                        ? 'bg-[#27211B] border-[#483C32] text-[#F4F0EB]'
                        : 'bg-[#191715] border-[#2E2721] text-[#AAA29A] hover:text-[#F4F0EB]'
                    }`}
                  >
                    {sev === 'all' ? 'All' : sev[0].toUpperCase() + sev.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertically Stacked, Scrollable Incidents List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-0 divide-y-0">
            {panelTab === 'incidents' ? (
              filteredIncidents.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <AlertCircle className="h-8 w-8 mx-auto text-[#7C756E]" />
                  <p className="text-xs font-semibold text-[#F4F0EB]">No matching incidents found</p>
                  <p className="text-[11px] text-[#7C756E]">Try adjusting your search query or severity filters.</p>
                  {(searchQuery || selectedSeverity !== 'all' || commandMode !== 'disaster') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSeverity('all');
                        setCommandMode('disaster');
                      }}
                      className="mt-2 text-xs text-[#F5A23A] hover:underline cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredIncidents.map((incident) => {
                  const isSelected = incident.id === selectedIncidentId;
                  const severity = incident.aiAnalysis?.severity || 'medium';
                  const isCritical = severity === 'critical';
                  const statusInfo = formatStatus(incident.status);

                  return (
                    <div
                      key={incident.id}
                      onClick={() => handleFocusIncident(incident)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative group ${
                        isSelected || isCritical
                          ? 'border-[#F46B27]/60 bg-[#221C16] shadow-[0_0_12px_rgba(244,107,39,0.15)] ring-1 ring-[#F46B27]/40'
                          : 'border-[#2F2822] bg-[#191715] hover:border-[#453A30] hover:bg-[#221D18]'
                      }`}
                    >
                      {/* Line 1: Type Icon + Title + Elapsed Time */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {getDisasterIcon(incident.type, severity)}
                          <h3 className="font-bold text-[#F4F0EB] text-xs leading-snug truncate group-hover:text-white transition-colors">
                            {incident.title}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-[#7C756E] shrink-0">
                          {formatTimeAgo(incident.timestamp)}
                        </span>
                      </div>

                      {/* Line 2: Location pin + Address */}
                      <div className="flex items-center gap-1 text-[11px] text-[#AAA29A] mb-2 truncate">
                        <MapPin className="h-3 w-3 text-[#7C756E] shrink-0" />
                        <span className="truncate">{incident.location.address || 'Palghar District'}</span>
                      </div>

                      {/* Line 3: Status Badge on Left + Assigned Unit on Right */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#26211C] text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-medium border text-[9.5px] ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>

                        <span className="text-[#7C756E] font-medium truncate max-w-[130px]">
                          {incident.assignedTeam || (incident.status === 'pending' ? '2 units' : 'Palghar Response Unit')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            ) : panelTab === 'usgs' ? (
              /* USGS Earthquakes Panel */
              usgsStatus.status === 'loading' && usgsEvents.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <RefreshCw className="h-7 w-7 mx-auto text-amber-400 animate-spin" />
                  <p className="text-xs font-semibold text-[#F4F0EB]">Connecting to USGS feed...</p>
                  <p className="text-[11px] text-[#7C756E]">Fetching real-time global seismic observations.</p>
                </div>
              ) : usgsStatus.status === 'error' && usgsEvents.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-2">
                  <AlertCircle className="h-7 w-7 mx-auto text-red-400" />
                  <p className="text-xs font-semibold text-red-300">Feed Connection Notice</p>
                  <p className="text-[11px] text-[#AAA29A]">{usgsStatus.error}</p>
                  <button
                    onClick={() => refreshUSGS()}
                    className="mt-2 px-3 py-1 bg-[#191715] hover:bg-[#221D18] border border-[#38302A] text-xs font-bold text-[#F4F0EB] rounded-md transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : filteredEarthquakes.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <Waves className="h-8 w-8 mx-auto text-[#7C756E]" />
                  <p className="text-xs font-semibold text-[#F4F0EB]">No earthquakes found</p>
                  <p className="text-[11px] text-[#7C756E]">Try choosing a broader USGS feed or clearing search query.</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs text-[#F5A23A] hover:underline cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                filteredEarthquakes.map((eq) => {
                  const isSelected = selectedIncidentId === `usgs_${eq.sourceId}` || selectedIncidentId === eq.sourceId;
                  const isCritical = eq.derivedSeverity === 'critical';
                  const magColor =
                    eq.derivedSeverity === 'critical'
                      ? 'bg-[#DC2626]/20 text-[#ff6363] border-[#DC2626]/50'
                      : eq.derivedSeverity === 'high'
                      ? 'bg-[#EA580C]/20 text-[#ff8c4a] border-[#EA580C]/50'
                      : eq.derivedSeverity === 'medium'
                      ? 'bg-[#D97706]/20 text-[#fbbf24] border-[#D97706]/50'
                      : 'bg-blue-900/30 text-blue-300 border-blue-600/40';

                  return (
                    <div
                      key={eq.sourceId}
                      onClick={() => {
                        setSelectedIncidentId(`usgs_${eq.sourceId}`);
                        setFlyToTarget({ lat: eq.latitude, lng: eq.longitude, zoom: 7 });
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative group ${
                        isSelected || isCritical
                          ? 'border-amber-500/60 bg-[#221C16] shadow-[0_0_12px_rgba(245,162,58,0.2)] ring-1 ring-amber-500/40'
                          : 'border-[#2F2822] bg-[#191715] hover:border-[#453A30] hover:bg-[#221D18]'
                      }`}
                    >
                      {/* Line 1: Mag Badge + Place + Elapsed Time */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border ${magColor}`}>
                            M {eq.magnitude !== null ? eq.magnitude.toFixed(1) : '?'}
                          </span>
                          <h3 className="font-bold text-[#F4F0EB] text-xs leading-snug truncate group-hover:text-white transition-colors">
                            {eq.place}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-[#7C756E] shrink-0">
                          {formatTimeAgo(eq.eventTime)}
                        </span>
                      </div>

                      {/* Line 2: Coordinates + Depth */}
                      <div className="flex items-center justify-between text-[11px] text-[#AAA29A] mb-1.5">
                        <span className="font-mono text-[10px] text-[#7C756E]">
                          {eq.latitude.toFixed(2)}°, {eq.longitude.toFixed(2)}°
                        </span>
                        <span className="text-[10px] text-[#AAA29A]">
                          {eq.depthKm !== undefined ? `${eq.depthKm.toFixed(1)} km depth` : ''}
                        </span>
                      </div>

                      {/* Line 3: Real USGS Tag + Status */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#26211C] text-[10px]">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/40 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-emerald-400" />
                          REAL DATA (USGS)
                        </span>

                        <span className="text-[#7C756E] font-medium capitalize">
                          {eq.status || 'Recorded'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            ) : panelTab === 'firms' ? (
              /* NASA FIRMS Satellites Fire Hotspots List */
              firmsStatus.status === 'unconfigured' ? (
                <div className="py-8 px-4 text-center space-y-3 bg-[#16120E] border border-orange-500/30 rounded-xl m-1">
                  <div className="h-10 w-10 mx-auto rounded-full bg-orange-950/60 border border-orange-500/40 text-orange-400 flex items-center justify-center">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#F4F0EB]">NASA MAP_KEY Required</h3>
                    <p className="text-[11px] text-[#AAA29A] mt-1 leading-normal">
                      Live satellite fire telemetry requires a free NASA Earthdata MAP_KEY. Set <code className="text-orange-400 font-mono">NASA_MAP_KEY</code> in server environment variables.
                    </p>
                  </div>
                  <a
                    href="https://firms.modaps.eosdis.nasa.gov/api/map_key/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors cursor-pointer w-full"
                  >
                    <span>Request Free NASA MAP_KEY</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : filteredFires.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <Flame className="h-8 w-8 mx-auto text-[#7C756E]" />
                  <p className="text-xs font-semibold text-[#F4F0EB]">No thermal hotspots detected</p>
                  <p className="text-[11px] text-[#7C756E]">
                    No satellite thermal anomalies found in selected region ({FIRMS_EXTENTS[activeFIRMSExtent].name}).
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      onClick={() => setFIRMSExtent('india')}
                      className="text-xs text-orange-400 hover:underline cursor-pointer"
                    >
                      Search All India
                    </button>
                    <span className="text-[#38302A]">•</span>
                    <button
                      onClick={() => setFIRMSExtent('world')}
                      className="text-xs text-orange-400 hover:underline cursor-pointer"
                    >
                      Global Extent
                    </button>
                  </div>
                </div>
              ) : (
                filteredFires.map((fire) => {
                  const isSelected = selectedIncidentId === `firms_${fire.sourceId}` || selectedIncidentId === fire.sourceId;
                  const isCritical = fire.confidence === 'high' && (fire.fireRadiativePower || 0) >= 40;
                  const tempC = fire.brightnessTempI4 !== undefined ? (fire.brightnessTempI4 - 273.15).toFixed(1) : null;

                  return (
                    <div
                      key={fire.sourceId}
                      onClick={() => {
                        setSelectedIncidentId(`firms_${fire.sourceId}`);
                        setFlyToTarget({ lat: fire.latitude, lng: fire.longitude, zoom: 12 });
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative group ${
                        isSelected || isCritical
                          ? 'border-orange-500/60 bg-[#221A14] shadow-[0_0_12px_rgba(249,115,22,0.2)] ring-1 ring-orange-500/40'
                          : 'border-[#2F2822] bg-[#191715] hover:border-[#453A30] hover:bg-[#221D18]'
                      }`}
                    >
                      {/* Line 1: Flame Icon + FRP + Overpass Time */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black border bg-orange-950/50 text-orange-400 border-orange-500/50 flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {fire.fireRadiativePower !== undefined ? `${fire.fireRadiativePower.toFixed(1)} MW` : 'DETECTED'}
                          </span>
                          <h3 className="font-bold text-[#F4F0EB] text-xs leading-snug truncate group-hover:text-white transition-colors">
                            {fire.instrument}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-[#7C756E] shrink-0">
                          {formatTimeAgo(fire.timestamp)}
                        </span>
                      </div>

                      {/* Line 2: Coordinates + Brightness Temp */}
                      <div className="flex items-center justify-between text-[11px] text-[#AAA29A] mb-1.5">
                        <span className="font-mono text-[10px] text-[#7C756E]">
                          {fire.latitude.toFixed(3)}°, {fire.longitude.toFixed(3)}°
                        </span>
                        <span className="text-[10px] text-[#AAA29A]">
                          {tempC ? `Temp: ${tempC}°C` : ''}
                        </span>
                      </div>

                      {/* Line 3: Real NASA Tag + Confidence + Action */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#26211C] text-[10px]">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-orange-400 font-bold bg-orange-950/40 border border-orange-500/40 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-orange-400" />
                          REAL DATA (NASA)
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[#AAA29A] font-medium">
                            Conf: <span className="font-bold text-[#F4F0EB]">{fire.confidenceLabel}</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const desc = `Observed by NASA FIRMS ${fire.instrument} on ${fire.acqDate} ${fire.acqTime}. FRP: ${fire.fireRadiativePower || 'N/A'} MW, Temp: ${tempC || 'N/A'}°C. Confidence: ${fire.confidenceLabel}. Ground verification recommended.`;
                              navigate(`/admin/incidents/new?type=Fire&lat=${fire.latitude}&lng=${fire.longitude}&title=Thermal Hotspot (${fire.instrument})&desc=${encodeURIComponent(desc)}`);
                            }}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-orange-950/60 hover:bg-orange-900 border border-orange-500/40 text-orange-300 font-bold hover:text-white transition-colors cursor-pointer"
                            title="Create formal incident from hotspot"
                          >
                            + Incident
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* GDACS Multi-Hazard Events List */
              gdacsStatus.status === 'loading' && gdacsEvents.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <RefreshCw className="h-7 w-7 mx-auto text-cyan-400 animate-spin" />
                  <p className="text-xs font-semibold text-[#F4F0EB]">Connecting to GDACS feed...</p>
                  <p className="text-[11px] text-[#7C756E]">Fetching real-time flood and tropical cyclone alerts.</p>
                </div>
              ) : gdacsStatus.status === 'error' && gdacsEvents.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-2">
                  <AlertCircle className="h-7 w-7 mx-auto text-red-400" />
                  <p className="text-xs font-semibold text-red-300">Feed Connection Notice</p>
                  <p className="text-[11px] text-[#AAA29A]">{gdacsStatus.error || 'Failed to load GDACS data'}</p>
                  <button
                    onClick={() => refreshGDACS()}
                    className="mt-2 px-3 py-1 bg-[#191715] hover:bg-[#221D18] border border-[#38302A] text-xs font-bold text-[#F4F0EB] rounded-md transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : filteredGDACS.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <Droplets className="h-8 w-8 mx-auto text-[#7C756E]" />
                  <p className="text-xs font-semibold text-[#F4F0EB]">No GDACS hazard events found</p>
                  <p className="text-[11px] text-[#7C756E]">Try clearing your search query or severity filters.</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs text-cyan-400 hover:underline cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                filteredGDACS.map((ev) => {
                  const isSelected = selectedIncidentId === `gdacs_${ev.sourceId}` || selectedIncidentId === ev.sourceId;
                  const isCritical = ev.derivedSeverity === 'critical';
                  const alertBg =
                    ev.alertLevel.toLowerCase() === 'red'
                      ? 'bg-red-950/60 text-red-400 border-red-500/50'
                      : ev.alertLevel.toLowerCase() === 'orange'
                      ? 'bg-orange-950/60 text-orange-400 border-orange-500/50'
                      : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50';

                  return (
                    <div
                      key={ev.sourceId}
                      onClick={() => {
                        setSelectedIncidentId(`gdacs_${ev.sourceId}`);
                        setFlyToTarget({ lat: ev.latitude, lng: ev.longitude, zoom: 6 });
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative group ${
                        isSelected || isCritical
                          ? 'border-cyan-500/60 bg-[#142025] shadow-[0_0_12px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/40'
                          : 'border-[#2F2822] bg-[#191715] hover:border-[#453A30] hover:bg-[#221D18]'
                      }`}
                    >
                      {/* Line 1: Type Icon + Name + Alert Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border flex items-center gap-1 ${alertBg}`}>
                            {ev.eventType === 'TC' ? <Wind className="h-3 w-3" /> : <Droplets className="h-3 w-3" />}
                            {ev.alertLevel.toUpperCase()}
                          </span>
                          <h3 className="font-bold text-[#F4F0EB] text-xs leading-snug truncate group-hover:text-white transition-colors">
                            {ev.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-[#7C756E] shrink-0">
                          {ev.fromDate ? new Date(ev.fromDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Active'}
                        </span>
                      </div>

                      {/* Line 2: Country + Coordinates */}
                      <div className="flex items-center justify-between text-[11px] text-[#AAA29A] mb-1.5">
                        <span className="truncate text-[11px] text-[#AAA29A]">
                          {ev.country || 'International waters'}
                        </span>
                        <span className="font-mono text-[10px] text-[#7C756E] shrink-0 ml-1">
                          {ev.latitude.toFixed(2)}°, {ev.longitude.toFixed(2)}°
                        </span>
                      </div>

                      {/* Line 3: Real GDACS Tag + Action */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#26211C] text-[10px]">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-500/40 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-cyan-400" />
                          REAL DATA (GDACS)
                        </span>

                        <div className="flex items-center gap-2">
                          <a
                            href={ev.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[9px] text-[#AAA29A] hover:text-white flex items-center gap-0.5 cursor-pointer"
                            title="Open GDACS Report"
                          >
                            <span>Report</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const desc = `GDACS ${ev.alertLevel} Alert: ${ev.name} (${ev.eventTypeLabel}). Country: ${ev.country || 'N/A'}. Score: ${ev.alertScore ?? 'N/A'}. Requires local operational verification.`;
                              navigate(`/admin/incidents/new?type=${ev.eventType === 'TC' ? 'Cyclone' : 'Flood'}&lat=${ev.latitude}&lng=${ev.longitude}&title=${encodeURIComponent(ev.name)}&desc=${encodeURIComponent(desc)}`);
                            }}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold hover:text-white transition-colors cursor-pointer"
                            title="Create formal incident from GDACS alert"
                          >
                            + Incident
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>

          {/* Incident / Earthquake / Fire / GDACS Panel Footer */}
          <div className="p-2.5 border-t border-[#26211C] bg-[#0E0D0C] flex items-center justify-between text-[11px] text-[#7C756E] font-mono shrink-0">
            {panelTab === 'incidents' ? (
              <>
                <span>Showing {filteredIncidents.length} of {incidents.length}</span>
                <button
                  onClick={() => navigate('/admin/incidents/new')}
                  className="text-[#F5A23A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  + Full Incident Form
                </button>
              </>
            ) : panelTab === 'usgs' ? (
              <>
                <span>{filteredEarthquakes.length} of {usgsEvents.length} earthquakes</span>
                <span className="text-emerald-400 font-semibold">Source: USGS NEIC</span>
              </>
            ) : panelTab === 'firms' ? (
              <>
                <span>{filteredFires.length} of {firmsEvents.length} hotspots</span>
                <span className="text-orange-400 font-semibold">Source: NASA FIRMS / LANCE</span>
              </>
            ) : (
              <>
                <span>{filteredGDACS.length} of {gdacsEvents.length} hazard events</span>
                <span className="text-cyan-400 font-semibold">Source: GDACS (UN / EC)</span>
              </>
            )}
          </div>
        </div>

        {/* =======================================================================
            C. MAIN INTERACTIVE MAP
            Occupies ALL remaining space to the far right edge!
            Satellite imagery by default, unobstructed, matching Stitch reference.
        ======================================================================= */}
        <div className="flex-1 h-full min-w-0 relative flex flex-col overflow-hidden bg-[#090909]">
          <div className="flex-1 w-full h-full relative">
            <LiveMap
              mode="authority"
              incidents={filteredIncidents}
              earthquakes={layers.earthquakes ? usgsEvents : []}
              fires={layers.fires ? firmsEvents : []}
              gdacsEvents={layers.gdacs ? gdacsEvents : []}
              resources={resources}
              volunteers={volunteers}
              alerts={alerts}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={handleFocusIncident}
              onSelectEarthquake={(eq) => {
                setSelectedIncidentId(`usgs_${eq.sourceId}`);
                setFlyToTarget({ lat: eq.latitude, lng: eq.longitude, zoom: 7 });
              }}
              onSelectFire={(fire) => {
                setSelectedIncidentId(`firms_${fire.sourceId}`);
                setFlyToTarget({ lat: fire.latitude, lng: fire.longitude, zoom: 12 });
              }}
              onSelectGDACS={(ev) => {
                setSelectedIncidentId(`gdacs_${ev.sourceId}`);
                setFlyToTarget({ lat: ev.latitude, lng: ev.longitude, zoom: 6 });
              }}
              onCreateIncidentFromGDACS={(ev) => {
                const desc = `GDACS ${ev.alertLevel} Alert: ${ev.name} (${ev.eventTypeLabel}). Country: ${ev.country || 'N/A'}. Score: ${ev.alertScore ?? 'N/A'}. Requires local operational verification.`;
                navigate(`/admin/incidents/new?type=${ev.eventType === 'TC' ? 'Cyclone' : 'Flood'}&lat=${ev.latitude}&lng=${ev.longitude}&title=${encodeURIComponent(ev.name)}&desc=${encodeURIComponent(desc)}`);
              }}
              layerVisibility={layers}
              flyToTarget={flyToTarget}
              resetTrigger={resetTrigger}
              fitBoundsTrigger={fitBoundsTrigger}
              locateMeTrigger={locateMeTrigger}
              basemap={basemap}
              height="100%"
              className="w-full h-full"
            />

            {/* -------------------------------------------------------------
                FLOATING MAP CONTROLS
            ------------------------------------------------------------- */}

            {/* Top-Left: Palghar District HQ • LIVE pill */}
            <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
              <div className="flex items-center gap-2 bg-[#161412]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#38302A] text-xs shadow-xl">
                <span className="font-semibold text-xs text-[#F4F0EB]">
                  Palghar District HQ
                </span>
                <span className="text-[#38302A]">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16B58A] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16B58A]"></span>
                  </span>
                  <span className="text-[10px] font-bold font-mono text-[#F5A23A] uppercase tracking-wider">
                    LIVE
                  </span>
                </div>
              </div>

              {/* USGS Real-Time Telemetry Status Pill */}
              <div className="flex items-center gap-2 bg-[#161412]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#38302A] text-xs shadow-xl">
                <span className="font-semibold text-xs text-[#F4F0EB] flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-amber-400" />
                  USGS Telemetry
                </span>
                <span className="text-[#38302A]">•</span>
                <div className="flex items-center gap-1.5">
                  {usgsStatus.status === 'live' ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-wider">
                        LIVE ({usgsEvents.length})
                      </span>
                    </>
                  ) : usgsStatus.status === 'loading' ? (
                    <>
                      <RefreshCw className="h-3 w-3 text-amber-400 animate-spin" />
                      <span className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-wider">
                        UPDATING...
                      </span>
                    </>
                  ) : usgsStatus.status === 'stale' ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-wider">
                        STALE ({usgsEvents.length})
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      <span className="text-[10px] font-bold font-mono text-red-400 uppercase tracking-wider">
                        OFFLINE
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={async () => {
                    setIsRefreshingUSGS(true);
                    await refreshUSGS();
                    setTimeout(() => setIsRefreshingUSGS(false), 500);
                  }}
                  className="ml-0.5 p-1 text-[#AAA29A] hover:text-[#F4F0EB] rounded hover:bg-[#221D18] transition-colors"
                  title="Refresh USGS Earthquake Feed"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshingUSGS ? 'animate-spin text-[#F5A23A]' : ''}`} />
                </button>
              </div>

              {/* NASA FIRMS Satellite Telemetry Status Pill */}
              <div className="flex items-center gap-2 bg-[#161412]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#38302A] text-xs shadow-xl">
                <span className="font-semibold text-xs text-[#F4F0EB] flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  NASA FIRMS
                </span>
                <span className="text-[#38302A]">•</span>
                <div className="flex items-center gap-1.5">
                  {firmsStatus.status === 'live' ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                      <span className="text-[10px] font-bold font-mono text-orange-400 uppercase tracking-wider">
                        LIVE ({firmsEvents.length})
                      </span>
                    </>
                  ) : firmsStatus.status === 'loading' ? (
                    <>
                      <RefreshCw className="h-3 w-3 text-amber-400 animate-spin" />
                      <span className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-wider">
                        UPDATING...
                      </span>
                    </>
                  ) : firmsStatus.status === 'stale' ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-wider">
                        STALE ({firmsEvents.length})
                      </span>
                    </>
                  ) : firmsStatus.status === 'unconfigured' ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-[#7C756E]"></span>
                      <span className="text-[10px] font-bold font-mono text-[#AAA29A] uppercase tracking-wider">
                        KEY REQUIRED
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      <span className="text-[10px] font-bold font-mono text-red-400 uppercase tracking-wider">
                        OFFLINE
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={async () => {
                    setIsRefreshingFIRMS(true);
                    await refreshFIRMS();
                    setTimeout(() => setIsRefreshingFIRMS(false), 500);
                  }}
                  className="ml-0.5 p-1 text-[#AAA29A] hover:text-[#F4F0EB] rounded hover:bg-[#221D18] transition-colors"
                  title="Refresh NASA FIRMS Fire Feed"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshingFIRMS ? 'animate-spin text-orange-400' : ''}`} />
                </button>
              </div>

              {/* GDACS Multi-Hazard Telemetry Status Pill */}
              <div className="flex items-center gap-2 bg-[#161412]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#38302A] text-xs shadow-xl">
                <span className="font-semibold text-xs text-[#F4F0EB] flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                  GDACS
                </span>
                <span className="text-[#38302A]">•</span>
                <div className="flex items-center gap-1.5">
                  {gdacsStatus.status === 'live' ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                      </span>
                      <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wider">
                        LIVE ({gdacsEvents.length})
                      </span>
                    </>
                  ) : gdacsStatus.status === 'loading' ? (
                    <>
                      <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                      <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wider">
                        UPDATING...
                      </span>
                    </>
                  ) : gdacsStatus.status === 'stale' ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-wider">
                        STALE ({gdacsEvents.length})
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      <span className="text-[10px] font-bold font-mono text-red-400 uppercase tracking-wider">
                        OFFLINE
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={async () => {
                    setIsRefreshingGDACS(true);
                    await refreshGDACS();
                    setTimeout(() => setIsRefreshingGDACS(false), 500);
                  }}
                  className="ml-0.5 p-1 text-[#AAA29A] hover:text-[#F4F0EB] rounded hover:bg-[#221D18] transition-colors"
                  title="Refresh GDACS Feed"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshingGDACS ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>

              {/* Compact zoom out control directly underneath */}
              <button
                onClick={() => {
                  setFlyToTarget((prev) => ({
                    lat: prev ? prev.lat : PALGHAR_CENTER[0],
                    lng: prev ? prev.lng : PALGHAR_CENTER[1],
                    zoom: prev && prev.zoom ? Math.max(prev.zoom - 1, 6) : 10,
                  }));
                }}
                className="w-7 h-7 bg-[#161412]/90 hover:bg-[#221D18] backdrop-blur-md rounded-lg border border-[#38302A] text-[#F4F0EB] text-sm font-bold flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
            </div>

            {/* Top-Right: Layers & Basemap Control (CLOSED by default on initial page load) */}
            <div ref={layersDropdownRef} className="absolute top-3 right-3 z-[1000] flex flex-col items-end pointer-events-auto">
              <button
                onClick={() => setShowLayersDropdown((prev) => !prev)}
                className="flex items-center gap-1.5 bg-[#161412]/90 hover:bg-[#221D18] backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#38302A] text-xs font-semibold text-[#F4F0EB] shadow-xl transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-[#AAA29A]" />
                <span>Layers</span>
              </button>

              {/* Layer Dropdown Menu (Only rendered when user explicitly clicks Layers) */}
              {showLayersDropdown && (
                <div className="mt-2 w-56 bg-[#161412]/95 backdrop-blur-md p-3 rounded-xl border border-[#38302A] shadow-2xl text-xs space-y-3 animate-in fade-in zoom-in-95 duration-100">
                  {/* Basemap Selection */}
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C756E] block mb-1.5">
                      Basemap Imagery
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => {
                          setBasemap('satellite');
                          setShowLayersDropdown(false);
                        }}
                        className={`py-1 text-[11px] font-bold rounded ${
                          basemap === 'satellite'
                            ? 'bg-[#F46B27] text-white'
                            : 'bg-[#191715] text-[#AAA29A] hover:text-[#F4F0EB]'
                        }`}
                      >
                        Satellite
                      </button>
                      <button
                        onClick={() => {
                          setBasemap('dark');
                          setShowLayersDropdown(false);
                        }}
                        className={`py-1 text-[11px] font-bold rounded ${
                          basemap === 'dark'
                            ? 'bg-[#F46B27] text-white'
                            : 'bg-[#191715] text-[#AAA29A] hover:text-[#F4F0EB]'
                        }`}
                      >
                        Tactical
                      </button>
                      <button
                        onClick={() => {
                          setBasemap('osm');
                          setShowLayersDropdown(false);
                        }}
                        className={`py-1 text-[11px] font-bold rounded ${
                          basemap === 'osm'
                            ? 'bg-[#F46B27] text-white'
                            : 'bg-[#191715] text-[#AAA29A] hover:text-[#F4F0EB]'
                        }`}
                      >
                        OSM
                      </button>
                    </div>
                  </div>

                  {/* Layer Toggles */}
                  <div className="pt-2 border-t border-[#26211C] space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C756E] block mb-1">
                      Data Layers
                    </span>

                    <label className="flex items-center justify-between cursor-pointer text-[#AAA29A] hover:text-[#F4F0EB]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#E53946]"></span>
                        <span>Incidents ({filteredIncidents.length})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={layers.incidents}
                        onChange={(e) => setLayers((p) => ({ ...p, incidents: e.target.checked }))}
                        className="rounded accent-[#F46B27]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer text-[#AAA29A] hover:text-[#F4F0EB]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                        <span>USGS Earthquakes ({usgsEvents.length})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={layers.earthquakes}
                        onChange={(e) => setLayers((p) => ({ ...p, earthquakes: e.target.checked }))}
                        className="rounded accent-[#F46B27]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer text-[#AAA29A] hover:text-[#F4F0EB]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                        <span>NASA FIRMS Fires ({firmsEvents.length})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={layers.fires}
                        onChange={(e) => setLayers((p) => ({ ...p, fires: e.target.checked }))}
                        className="rounded accent-[#F46B27]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer text-[#AAA29A] hover:text-[#F4F0EB]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                        <span>GDACS Hazards ({gdacsEvents.length})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={layers.gdacs}
                        onChange={(e) => setLayers((p) => ({ ...p, gdacs: e.target.checked }))}
                        className="rounded accent-[#F46B27]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer text-[#AAA29A] hover:text-[#F4F0EB]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#16B58A]"></span>
                        <span>Volunteers ({volunteers.length})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={layers.volunteers}
                        onChange={(e) => setLayers((p) => ({ ...p, volunteers: e.target.checked }))}
                        className="rounded accent-[#F46B27]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer text-[#AAA29A] hover:text-[#F4F0EB]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#8B5CF6]"></span>
                        <span>Resources ({resources.length})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={layers.resources}
                        onChange={(e) => setLayers((p) => ({ ...p, resources: e.target.checked }))}
                        className="rounded accent-[#F46B27]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer text-[#AAA29A] hover:text-[#F4F0EB]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#F5A23A]"></span>
                        <span>Hazard Zones ({alerts.length})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={layers.alerts}
                        onChange={(e) => setLayers((p) => ({ ...p, alerts: e.target.checked }))}
                        className="rounded accent-[#F46B27]"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom-Right: Reset View & Fit Incidents controls (Matches Stitch layout) */}
            <div className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => {
                  setSelectedIncidentId(null);
                  setResetTrigger((p) => p + 1);
                }}
                className="bg-[#161412]/90 hover:bg-[#221D18] backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#38302A] text-xs font-semibold text-[#F4F0EB] shadow-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset View to Palghar District Center"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#AAA29A]" />
                <span>Reset View</span>
              </button>

              <button
                onClick={() => setFitBoundsTrigger((p) => p + 1)}
                className="bg-[#161412]/90 hover:bg-[#221D18] backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#38302A] text-xs font-semibold text-[#F4F0EB] shadow-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Fit to All Incidents"
              >
                <Maximize2 className="h-3.5 w-3.5 text-[#AAA29A]" />
                <span>Fit Incidents</span>
              </button>
            </div>

            {/* Bottom-Left: Map Legend matching Stitch reference */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-[#161412]/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[#38302A] shadow-xl flex items-center gap-3 text-xs pointer-events-auto">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C756E] mr-0.5">
                LEGEND:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E53946] shadow-xs shadow-red-600/50"></span>
                <span className="text-[#AAA29A] text-[11px] font-medium">Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F46B27] shadow-xs shadow-orange-500/50"></span>
                <span className="text-[#AAA29A] text-[11px] font-medium">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F5A23A] shadow-xs shadow-amber-500/50"></span>
                <span className="text-[#AAA29A] text-[11px] font-medium">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#16B58A] shadow-xs shadow-emerald-500/50"></span>
                <span className="text-[#AAA29A] text-[11px] font-medium">Volunteer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6] shadow-xs shadow-indigo-500/50"></span>
                <span className="text-[#AAA29A] text-[11px] font-medium">Resource</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-dashed border-[#E53946] bg-[#E53946]/30"></span>
                <span className="text-[#AAA29A] text-[11px] font-medium">Risk Zone</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ACTION MODALS (Send Alert, Activate EWS)
      ========================================================================= */}

      {/* 1. Send Alert Modal */}
      {showSendAlertModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#12110F] border border-[#38302A] max-w-lg w-full rounded-2xl shadow-2xl p-6 text-[#F4F0EB] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#26211C] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40 flex items-center justify-center">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#F4F0EB]">Broadcast Public Advisory</h3>
                  <p className="text-[11px] text-[#7C756E]">Palghar District Emergency Advisory Channel</p>
                </div>
              </div>
              <button
                onClick={() => setShowSendAlertModal(false)}
                className="text-[#AAA29A] hover:text-[#F4F0EB] p-1 rounded-lg hover:bg-[#191715]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendAlertSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#AAA29A] mb-1">Advisory Title</label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full bg-[#191715] border border-[#2E2721] rounded-lg p-2 text-xs text-[#F4F0EB] focus:outline-none focus:border-[#F5A23A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#AAA29A] mb-1">Target Zone / Taluka</label>
                  <select
                    value={alertTaluka}
                    onChange={(e) => setAlertTaluka(e.target.value)}
                    className="w-full bg-[#191715] border border-[#2E2721] rounded-lg p-2 text-xs text-[#F4F0EB] focus:outline-none focus:border-[#F5A23A]"
                  >
                    <option value="Palghar HQ">Palghar HQ / Coastal</option>
                    <option value="Manor">Manor / Surya Basin</option>
                    <option value="Vasai">Vasai / Virar</option>
                    <option value="Dahanu">Dahanu Block</option>
                    <option value="Boisar">Boisar MIDC</option>
                    <option value="Jawhar">Jawhar Ghat</option>
                    <option value="Wada">Wada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#AAA29A] mb-1">Alert Radius (km)</label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={alertRadius}
                    onChange={(e) => setAlertRadius(Number(e.target.value))}
                    className="w-full bg-[#191715] border border-[#2E2721] rounded-lg p-2 text-xs text-[#F4F0EB] focus:outline-none focus:border-[#F5A23A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA29A] mb-1">Severity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['critical', 'high', 'medium'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setAlertSeverity(sev)}
                      className={`py-1.5 rounded-lg border text-xs font-bold capitalize transition-colors ${
                        alertSeverity === sev
                          ? sev === 'critical'
                            ? 'bg-[#E53946] text-white border-[#E53946]'
                            : sev === 'high'
                            ? 'bg-[#F46B27] text-white border-[#F46B27]'
                            : 'bg-[#F5A23A] text-white border-[#F5A23A]'
                          : 'bg-[#191715] border-[#2E2721] text-[#AAA29A] hover:text-[#F4F0EB]'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA29A] mb-1">Advisory Text / Citizen Instructions</label>
                <textarea
                  rows={3}
                  value={alertDescription}
                  onChange={(e) => setAlertDescription(e.target.value)}
                  className="w-full bg-[#191715] border border-[#2E2721] rounded-lg p-2 text-xs text-[#F4F0EB] focus:outline-none focus:border-[#F5A23A] resize-none"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[#221B14] border border-[#B45309]/50 text-[11px] text-[#F5A23A] flex items-center gap-2">
                <Megaphone className="h-4 w-4 shrink-0 text-[#F5A23A]" />
                <span>Will dispatch to Citizen Live Map and generate an official hazard buffer ring.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#26211C]">
                <button
                  type="button"
                  onClick={() => setShowSendAlertModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#191715] hover:bg-[#221D18] border border-[#2E2721] text-xs font-semibold text-[#AAA29A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#F46B27] hover:bg-[#F5A23A] text-xs font-semibold text-white shadow-md shadow-orange-600/30 cursor-pointer"
                >
                  Dispatch Advisory Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Activate EWS Modal */}
      {showEWSModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#12110F] border border-[#E53946]/70 max-w-md w-full rounded-2xl shadow-2xl p-6 text-[#F4F0EB] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#E53946]/20 text-[#E53946] border border-[#E53946]/50 flex items-center justify-center animate-pulse">
                <Siren className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#F4F0EB]">Activate Early Warning System</h3>
                <p className="text-xs text-[#E53946] font-mono">Palghar District Emergency Protocol</p>
              </div>
            </div>

            <p className="text-xs text-[#AAA29A] leading-relaxed mb-4 bg-[#191715] p-3 rounded-lg border border-[#26211C]">
              Activating EWS triggers automated sirens at coastal installations, pushes high-priority notifications to citizen mobile apps, and alerts District Disaster Management Authority (DDMA) response battalions.
            </p>

            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#231215] border border-[#E53946]/40 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={ewsConfirmed}
                onChange={(e) => setEwsConfirmed(e.target.checked)}
                className="mt-0.5 rounded accent-[#E53946]"
              />
              <span className="text-xs text-[#F4F0EB]">
                I confirm that an imminent regional threat warrants district-wide EWS activation.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#26211C]">
              <button
                type="button"
                onClick={() => {
                  setShowEWSModal(false);
                  setEwsConfirmed(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#191715] hover:bg-[#221D18] border border-[#2E2721] text-xs font-semibold text-[#AAA29A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!ewsConfirmed}
                onClick={handleActivateEWS}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#F46B27] to-[#E53946] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-lg shadow-red-600/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Siren className="h-4 w-4" />
                Confirm & Sound EWS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
