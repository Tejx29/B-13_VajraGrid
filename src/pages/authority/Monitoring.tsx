import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useUSGSEarthquakes } from '../../services/usgsService';
import { useFIRMSHotspots } from '../../services/firmsService';
import { useGDACEvents } from '../../services/gdacsService';
import { useNavigate } from 'react-router-dom';
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  Eye,
  AlertTriangle,
  MapPin,
  Megaphone,
  Plus,
  Activity,
  Globe,
  RefreshCw,
  Waves,
  ExternalLink,
  Flame,
  Droplets
} from 'lucide-react';

// Mock Data representing external sensor hooks (Weather, Environmental telemetry)
const currentConditions = {
  weather: 'Heavy Monsoonal Rain',
  rainfall: '45 mm/hr',
  temperature: '26°C',
  wind: '35 km/h SE',
  visibility: '1.2 km'
};

const activeWarning = {
  title: 'Severe Rainfall Warning & Inundation Risk',
  location: 'Palghar District (Surya & Vaitarna Basins)',
  risk: 'CRITICAL',
  expectedRainfall: '120–150 mm / 24 hrs',
  recommendedAction: 'Stage NDRF/SDRF teams and deploy mobile pumping stations in low-lying sectors.'
};

const highRiskAreas = [
  { id: '1', area: 'Palghar Coastal Sector', risk: 'Critical', reason: 'High-tide Inundation + Heavy Rainfall', action: 'Deploy Water Rescue Teams' },
  { id: '2', area: 'Vasai Lowlands', risk: 'High', reason: 'Surya River Overflow Risk', action: 'Activate Alert Siren & Evac Warning' },
  { id: '3', area: 'Dahanu Beachfront', risk: 'Moderate', reason: 'Wind Gusts & Soil Saturation', action: 'Continuous Telemetry Monitoring' },
  { id: '4', area: 'Manor Bridge Sector', risk: 'High', reason: 'Flash Flood Hazard Level II', action: 'Bridge Traffic Restriction' },
];

export function Monitoring() {
  const navigate = useNavigate();
  const { events: usgsEvents, statusInfo: usgsStatus, refresh: refreshUSGS } = useUSGSEarthquakes();
  const { events: firmsEvents, statusInfo: firmsStatus, refresh: refreshFIRMS } = useFIRMSHotspots();
  const { events: gdacsEvents, statusInfo: gdacsStatus, refresh: refreshGDACS } = useGDACEvents();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* PAGE TITLE & SUBTITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">Early Warning & Proactive Monitoring</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40">
              TELEMETRY LIVE
            </span>
          </div>
          <p className="text-sm font-medium text-[#AAA29A]">Real-time hydrometeorological radar, flood warnings, and pre-escalation dispatch indicators.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            onClick={() => navigate('/admin/map')}
            className="gap-2 bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-semibold shadow-xs"
          >
            <MapPin className="h-4 w-4" />
            Live Tactical Map
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION: ACTIVE WARNINGS */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-mono font-bold text-[#7C756E] uppercase tracking-wider">Active Hazard Warnings</h2>
            <Card className="border border-[#F5A23A]/40 bg-[#191715] rounded-xl overflow-hidden shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-[#F5A23A]/15 flex items-center justify-center border border-[#F5A23A]/40 text-[#F5A23A] shadow-sm">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                      <h3 className="text-lg font-bold text-[#F4F0EB]">{activeWarning.title}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#E53946]/20 text-[#ff727f] border border-[#E53946]/40">
                        RISK: {activeWarning.risk}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-[#AAA29A] mb-4">
                      <MapPin className="h-3.5 w-3.5 text-[#F5A23A]" />
                      <span>{activeWarning.location}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-4 bg-[#12110F] rounded-lg border border-[#38302A]">
                      <div>
                        <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Expected Rainfall</p>
                        <p className="text-sm font-bold text-[#F4F0EB] mt-0.5">{activeWarning.expectedRainfall}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Recommended Action</p>
                        <p className="text-sm font-semibold text-[#AAA29A] mt-0.5">{activeWarning.recommendedAction}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button 
                        onClick={() => navigate('/admin/map')}
                        className="bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-semibold h-9 rounded-lg gap-1.5"
                      >
                        <MapPin className="h-4 w-4" />
                        View on Map
                      </Button>
                      <Button 
                        onClick={() => navigate('/admin/incidents/new')}
                        variant="outline" 
                        className="bg-[#191715] border-[#38302A] text-[#F4F0EB] hover:bg-[#27211B] font-semibold h-9 rounded-lg gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        Create Incident
                      </Button>
                      <Button 
                        onClick={() => navigate('/admin/notifications')}
                        variant="outline" 
                        className="bg-[#191715] border-[#38302A] text-[#F4F0EB] hover:bg-[#27211B] font-semibold h-9 rounded-lg gap-1.5"
                      >
                        <Megaphone className="h-4 w-4" />
                        Broadcast Alert
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SECTION: HIGH-RISK SECTORS TABLE */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-mono font-bold text-[#7C756E] uppercase tracking-wider">High-Risk Sectors & Inundation Watch</h2>
            <Card className="border border-[#38302A] rounded-xl bg-[#191715] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#12110F] border-b border-[#38302A] text-xs font-semibold text-[#AAA29A] uppercase tracking-wider font-mono">
                    <tr>
                      <th className="px-5 py-3.5">Sector / Taluka</th>
                      <th className="px-5 py-3.5">Risk Level</th>
                      <th className="px-5 py-3.5">Environmental Trigger</th>
                      <th className="px-5 py-3.5">Operational Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26211C]">
                    {highRiskAreas.map((item) => (
                      <tr key={item.id} className="hover:bg-[#27211B]/60 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-[#F4F0EB] whitespace-nowrap">
                          {item.area}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            item.risk === 'Critical' 
                              ? 'bg-[#E53946]/20 text-[#ff727f] border border-[#E53946]/40' 
                              : item.risk === 'High'
                              ? 'bg-[#F46B27]/20 text-[#F46B27] border border-[#F46B27]/40'
                              : 'bg-[#F5A23A]/20 text-[#F5A23A] border border-[#F5A23A]/40'
                          }`}>
                            {item.risk}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[#AAA29A] font-medium whitespace-nowrap text-xs">
                          {item.reason}
                        </td>
                        <td className="px-5 py-3.5 text-[#F4F0EB] font-semibold whitespace-nowrap text-xs">
                          {item.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* SECTION: CURRENT CONDITIONS TELEMETRY */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-mono font-bold text-[#7C756E] uppercase tracking-wider">Current Conditions</h2>
          <Card className="border border-[#38302A] rounded-xl bg-[#191715] overflow-hidden">
            <div className="divide-y divide-[#26211C]">
              
              <div className="p-4 flex items-center justify-between hover:bg-[#27211B]/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#27211B] border border-[#38302A] text-[#F5A23A] flex items-center justify-center">
                    <CloudRain className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Atmospheric Condition</p>
                    <p className="text-sm font-bold text-[#F4F0EB]">{currentConditions.weather}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-[#27211B]/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#27211B] border border-[#38302A] text-[#16B58A] flex items-center justify-center">
                    <CloudRain className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Precipitation Rate</p>
                    <p className="text-sm font-bold text-[#F4F0EB]">{currentConditions.rainfall}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-[#27211B]/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#27211B] border border-[#38302A] text-[#F46B27] flex items-center justify-center">
                    <Thermometer className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Ambient Temperature</p>
                    <p className="text-sm font-bold text-[#F4F0EB]">{currentConditions.temperature}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-[#27211B]/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#27211B] border border-[#38302A] text-[#AAA29A] flex items-center justify-center">
                    <Wind className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Wind Velocity & Heading</p>
                    <p className="text-sm font-bold text-[#F4F0EB]">{currentConditions.wind}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-[#27211B]/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#27211B] border border-[#38302A] text-[#AAA29A] flex items-center justify-center">
                    <Eye className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Optical Visibility</p>
                    <p className="text-sm font-bold text-[#F4F0EB]">{currentConditions.visibility}</p>
                  </div>
                </div>
              </div>

            </div>
          </Card>

          {/* SECTION: REAL USGS SEISMIC NETWORK TELEMETRY */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold text-[#7C756E] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-amber-400" />
                USGS Seismic Telemetry
              </h2>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                REAL DATA
              </span>
            </div>

            <Card className="border border-emerald-500/30 rounded-xl bg-[#191715] overflow-hidden shadow-sm">
              <div className="p-4 bg-[#12110F] border-b border-[#26211C] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F4F0EB]">Global Seismic Feed</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#181614] border border-[#38302A] text-amber-400">
                      {usgsStatus.status === 'live' ? `LIVE (${usgsEvents.length})` : usgsStatus.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7C756E] font-mono mt-0.5">
                    Sync: {usgsStatus.lastSuccessfulUpdate ? new Date(usgsStatus.lastSuccessfulUpdate).toLocaleTimeString() : 'Pending'}
                  </p>
                </div>
                <button
                  onClick={() => refreshUSGS()}
                  className="p-1.5 rounded bg-[#191715] hover:bg-[#221D18] border border-[#38302A] text-[#AAA29A] hover:text-[#F4F0EB] transition-colors"
                  title="Refresh USGS Seismic Feed"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {usgsEvents.length === 0 ? (
                  <p className="text-xs text-[#AAA29A] text-center py-4">No earthquake records in current feed.</p>
                ) : (
                  usgsEvents.slice(0, 4).map((eq) => {
                    const isCrit = eq.derivedSeverity === 'critical';
                    const magCls = isCrit
                      ? 'bg-[#DC2626]/20 text-[#ff6363] border-[#DC2626]/50'
                      : eq.derivedSeverity === 'high'
                      ? 'bg-[#EA580C]/20 text-[#ff8c4a] border-[#EA580C]/50'
                      : 'bg-[#D97706]/20 text-[#fbbf24] border-[#D97706]/50';

                    return (
                      <div
                        key={eq.sourceId}
                        className="p-2.5 rounded-lg bg-[#12110F] border border-[#2E2721] hover:border-[#453A30] transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border ${magCls}`}>
                            M {eq.magnitude !== null ? eq.magnitude.toFixed(1) : '?'}
                          </span>
                          <span className="text-[10px] font-mono text-[#7C756E]">
                            {new Date(eq.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#F4F0EB] line-clamp-1">{eq.place}</p>
                        <div className="flex items-center justify-between text-[10px] text-[#AAA29A] font-mono">
                          <span>{eq.latitude.toFixed(2)}°, {eq.longitude.toFixed(2)}°</span>
                          <span>{eq.depthKm !== undefined ? `${eq.depthKm.toFixed(1)} km depth` : ''}</span>
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="pt-2 border-t border-[#26211C] flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => navigate('/admin/map')}
                    className="w-full bg-[#191715] hover:bg-[#221D18] border border-[#38302A] text-[#F4F0EB] text-xs font-semibold h-8 gap-1.5"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#F5A23A]" />
                    View Earthquakes on Live Map
                  </Button>
                </div>

                <p className="text-[9px] text-[#7C756E] italic text-center leading-tight">
                  Official real-time observations from USGS NEIC. External detections require authority assessment.
                </p>
              </div>
            </Card>
          </div>

          {/* SECTION: NASA FIRMS SATELLITE FIRE TELEMETRY */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold text-[#7C756E] uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                NASA FIRMS Satellite Telemetry
              </h2>
              <span className="text-[9px] font-mono font-bold text-orange-400 bg-orange-950/40 border border-orange-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                REAL DATA
              </span>
            </div>

            <Card className="border border-orange-500/30 rounded-xl bg-[#191715] overflow-hidden shadow-sm">
              <div className="p-4 bg-[#12110F] border-b border-[#26211C] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F4F0EB]">Thermal Hotspots Feed</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#181614] border border-[#38302A] text-orange-400">
                      {firmsStatus.status === 'live' 
                        ? `LIVE (${firmsEvents.length})` 
                        : firmsStatus.status === 'unconfigured' 
                        ? 'MAP_KEY NEEDED' 
                        : firmsStatus.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7C756E] font-mono mt-0.5">
                    Sensor: NOAA-20 / VIIRS (375m) &bull; Extent: Palghar Region
                  </p>
                </div>
                {firmsStatus.status === 'unconfigured' ? (
                  <a
                    href="https://firms.modaps.eosdis.nasa.gov/api/map_key/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded bg-[#191715] hover:bg-[#221D18] border border-orange-500/30 text-orange-400 hover:text-orange-300 transition-colors"
                    title="Get free NASA MAP_KEY"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={() => refreshFIRMS()}
                    className="p-1.5 rounded bg-[#191715] hover:bg-[#221D18] border border-[#38302A] text-[#AAA29A] hover:text-[#F4F0EB] transition-colors"
                    title="Refresh NASA FIRMS Telemetry"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-orange-400" />
                  </button>
                )}
              </div>

              <div className="p-4 space-y-3">
                {firmsStatus.status === 'unconfigured' ? (
                  <div className="p-3 rounded-lg bg-[#12110F] border border-orange-500/20 text-center space-y-2">
                    <p className="text-xs font-semibold text-[#F4F0EB]">NASA Earthdata MAP_KEY Unconfigured</p>
                    <p className="text-[11px] text-[#AAA29A] leading-normal">
                      Configure <code className="text-orange-400 font-mono text-[10px]">NASA_MAP_KEY</code> on server to fetch live thermal observations.
                    </p>
                    <a
                      href="https://firms.modaps.eosdis.nasa.gov/api/map_key/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 hover:underline"
                    >
                      <span>Request Free Key from NASA</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : firmsEvents.length === 0 ? (
                  <p className="text-xs text-[#AAA29A] text-center py-4">No thermal hotspot anomalies detected in current overpass.</p>
                ) : (
                  firmsEvents.slice(0, 4).map((fire) => (
                    <div
                      key={fire.sourceId}
                      className="p-2.5 rounded-lg bg-[#12110F] border border-[#2E2721] hover:border-[#453A30] transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black border bg-orange-950/50 text-orange-400 border-orange-500/50 flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {fire.fireRadiativePower !== undefined ? `${fire.fireRadiativePower.toFixed(1)} MW` : 'HOTSPOT'}
                        </span>
                        <span className="text-[10px] font-mono text-[#7C756E]">
                          {fire.acqTime} UTC
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#F4F0EB] line-clamp-1">{fire.instrument}</p>
                      <div className="flex items-center justify-between text-[10px] text-[#AAA29A] font-mono">
                        <span>{fire.latitude.toFixed(3)}°, {fire.longitude.toFixed(3)}°</span>
                        <span>Confidence: {fire.confidenceLabel}</span>
                      </div>
                    </div>
                  ))
                )}

                <div className="pt-2 border-t border-[#26211C] flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => navigate('/admin/map')}
                    className="w-full bg-[#191715] hover:bg-[#221D18] border border-[#38302A] text-[#F4F0EB] text-xs font-semibold h-8 gap-1.5"
                  >
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    View Fire Hotspots on Live Map
                  </Button>
                </div>

                <p className="text-[9px] text-[#7C756E] italic text-center leading-tight">
                  Satellite thermal telemetry from NASA EOSDIS LANCE / FIRMS. Ground check mandatory prior to operational response.
                </p>
              </div>
            </Card>
          </div>

          {/* SECTION: GDACS MULTI-HAZARD OBSERVATION TELEMETRY */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold text-[#7C756E] uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                GDACS Multi-Hazard Telemetry
              </h2>
              <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                REAL DATA
              </span>
            </div>

            <Card className="border border-cyan-500/30 rounded-xl bg-[#191715] overflow-hidden shadow-sm">
              <div className="p-4 bg-[#12110F] border-b border-[#26211C] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F4F0EB]">Global Floods & Cyclones</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#181614] border border-[#38302A] text-cyan-400">
                      {gdacsStatus.status === 'live'
                        ? `LIVE (${gdacsEvents.length})`
                        : gdacsStatus.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7C756E] font-mono mt-0.5">
                    Sync: {gdacsStatus.lastSuccessfulUpdate ? new Date(gdacsStatus.lastSuccessfulUpdate).toLocaleTimeString() : 'Pending'}
                  </p>
                </div>
                <button
                  onClick={() => refreshGDACS()}
                  className="p-1.5 rounded bg-[#191715] hover:bg-[#221D18] border border-[#38302A] text-[#AAA29A] hover:text-[#F4F0EB] transition-colors"
                  title="Refresh GDACS Feed"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {gdacsEvents.length === 0 ? (
                  <p className="text-xs text-[#AAA29A] text-center py-4">No active hazard alerts in GDACS feed.</p>
                ) : (
                  gdacsEvents.slice(0, 4).map((ev) => {
                    const alertCls =
                      ev.alertLevel.toLowerCase() === 'red'
                        ? 'bg-red-950/60 text-red-400 border-red-500/50'
                        : ev.alertLevel.toLowerCase() === 'orange'
                        ? 'bg-orange-950/60 text-orange-400 border-orange-500/50'
                        : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50';

                    return (
                      <div
                        key={ev.sourceId}
                        className="p-2.5 rounded-lg bg-[#12110F] border border-[#2E2721] hover:border-[#453A30] transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border flex items-center gap-1 ${alertCls}`}>
                            {ev.eventType === 'TC' ? <Wind className="h-3 w-3" /> : <Droplets className="h-3 w-3" />}
                            {ev.alertLevel.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-[#7C756E]">
                            {ev.fromDate ? new Date(ev.fromDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Active'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#F4F0EB] line-clamp-1">{ev.name}</p>
                        <div className="flex items-center justify-between text-[10px] text-[#AAA29A] font-mono">
                          <span>{ev.country || 'International waters'}</span>
                          <span>{ev.latitude.toFixed(2)}°, {ev.longitude.toFixed(2)}°</span>
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="pt-2 border-t border-[#26211C] flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => navigate('/admin/map')}
                    className="w-full bg-[#191715] hover:bg-[#221D18] border border-[#38302A] text-[#F4F0EB] text-xs font-semibold h-8 gap-1.5"
                  >
                    <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                    View GDACS Hazards on Live Map
                  </Button>
                </div>

                <p className="text-[9px] text-[#7C756E] italic text-center leading-tight">
                  Official alert telemetry from GDACS (UN / European Commission). Requires operational assessment.
                </p>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
