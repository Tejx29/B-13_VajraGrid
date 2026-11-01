import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useUSGSEarthquakes } from '../../services/usgsService';
import { useFIRMSHotspots } from '../../services/firmsService';
import { useGDACEvents } from '../../services/gdacsService';
import { useWeatherDashboard } from '../../services/weatherService';
import { useNavigate } from 'react-router-dom';
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  AlertTriangle,
  MapPin,
  Megaphone,
  Plus,
  Activity,
  RefreshCw,
  ExternalLink,
  Flame,
  Droplets,
  Sun,
  Cloud,
  CloudSun,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Snowflake,
  CheckCircle2,
  Gauge,
  Info,
  ChevronDown,
  ChevronUp,
  Building2
} from 'lucide-react';

function getWeatherIcon(code: number, isDay: boolean = true) {
  if (code === 0) return isDay ? <Sun className="h-5 w-5 text-amber-400" /> : <Sun className="h-5 w-5 text-indigo-300" />;
  if (code === 1 || code === 2) return <CloudSun className="h-5 w-5 text-amber-300" />;
  if (code === 3) return <Cloud className="h-5 w-5 text-stone-300" />;
  if (code === 45 || code === 48) return <CloudFog className="h-5 w-5 text-stone-400" />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className="h-5 w-5 text-cyan-400" />;
  if (code >= 61 && code <= 67) return <CloudRain className="h-5 w-5 text-blue-400" />;
  if (code >= 71 && code <= 77) return <Snowflake className="h-5 w-5 text-sky-200" />;
  if (code >= 80 && code <= 82) return <CloudRain className="h-5 w-5 text-blue-400" />;
  if (code >= 95) return <CloudLightning className="h-5 w-5 text-yellow-400" />;
  return <Cloud className="h-5 w-5 text-stone-300" />;
}

export function Monitoring() {
  const navigate = useNavigate();
  const [showPalgharTalukas, setShowPalgharTalukas] = useState<boolean>(true);

  // Live hazard telemetry
  const { events: usgsEvents, statusInfo: usgsStatus, refresh: refreshUSGS } = useUSGSEarthquakes();
  const { events: firmsEvents, statusInfo: firmsStatus, refresh: refreshFIRMS } = useFIRMSHotspots();
  const { events: gdacsEvents, statusInfo: gdacsStatus, refresh: refreshGDACS } = useGDACEvents();

  // District-wise live weather & forecast dashboard
  const {
    districts,
    selectedDistrict,
    setSelectedDistrictId,
    currentWeather,
    forecastRainfall24h,
    hourlyForecast,
    dailyForecast,
    palgharSubdistricts,
    isLoading,
    isLoadingCurrent,
    isLoadingForecast,
    errorCurrent,
    lastSuccessfulUpdate,
    isStale,
    refresh: refreshWeather,
  } = useWeatherDashboard();

  const handleRefreshAll = async () => {
    await Promise.all([
      refreshWeather(),
      refreshUSGS(),
      refreshFIRMS(),
      refreshGDACS(),
    ]);
  };

  const isPalgharSelected = selectedDistrict.id === 'palghar_district';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* PAGE HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">
              Early Warning & Proactive Monitoring
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* PRIMARY DISTRICT SELECTOR */}
          <div className="flex items-center gap-2 bg-[#191715] border border-[#38302A] rounded-lg px-3 py-2">
            <Building2 className="h-4 w-4 text-[#F5A23A] shrink-0" />
            <div className="flex flex-col gap-1">
              <label htmlFor="weather-district-select" className="text-[9px] font-mono uppercase tracking-wider text-[#7C756E]">
                Administrative District
              </label>
              <select
                id="weather-district-select"
                value={selectedDistrict.id}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#F4F0EB] focus:outline-none cursor-pointer pr-2"
              >
                {districts.map((dist) => (
                  <option key={dist.id} value={dist.id} className="bg-[#191715] text-[#F4F0EB]">
                    {dist.name} ({dist.division})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* REFRESH BUTTON */}
          <button
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-[#191715] hover:bg-[#221D18] border border-[#38302A] text-[#AAA29A] hover:text-[#F4F0EB] transition-colors disabled:opacity-50"
            title="Refresh All Feeds & Forecasts"
          >
            <RefreshCw className={`h-4 w-4 text-[#F5A23A] ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* TACTICAL MAP LINK */}
          <Button 
            onClick={() => navigate('/admin/map')}
            className="gap-2 bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-semibold shadow-xs h-9"
          >
            <MapPin className="h-4 w-4" />
            Live Tactical Map
          </Button>
        </div>
      </div>

      {/* DISTRICT WEATHER OVERVIEW HERO BANNER */}
      <Card className="border border-[#38302A] bg-[#191715] rounded-xl overflow-hidden shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* District Metadata */}
            <div className="space-y-2">
              {isStale && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/40">
                    CACHED (STALE DATA)
                  </span>
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl font-black text-[#F4F0EB]">
                {selectedDistrict.name}
              </h2>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#F4F0EB]/90 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#F5A23A]" />
                  <span className="text-xs font-mono text-[#7C756E]">
                    ({selectedDistrict.lat.toFixed(4)}°N, {selectedDistrict.lng.toFixed(4)}°E)
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              
              {/* Atmospheric Condition */}
              <div className="p-3.5 rounded-lg bg-[#12110F] border border-[#2E2721] flex flex-col justify-between min-w-[120px] gap-2.5">
                <div className="flex items-center justify-between text-[#7C756E]">
                  <span className="text-[10px] font-mono font-bold uppercase">Condition</span>
                  {currentWeather ? getWeatherIcon(currentWeather.weatherCode, currentWeather.isDay) : <Cloud className="h-4 w-4" />}
                </div>
                {isLoadingCurrent ? (
                  <div className="h-4 bg-[#26211C] rounded animate-pulse my-1" />
                ) : (
                  <p className="text-sm font-bold text-[#F4F0EB] line-clamp-1">
                    {currentWeather ? currentWeather.weatherText : 'Unavailable'}
                  </p>
                )}
                <span className="text-[10px] font-mono text-[#AAA29A]">
                  {currentWeather ? `${currentWeather.apparentTemperature.toFixed(1)}°C feels` : '---'}
                </span>
              </div>

              {/* Temperature */}
              <div className="p-3.5 rounded-lg bg-[#12110F] border border-[#2E2721] flex flex-col justify-between min-w-[120px] gap-2.5">
                <div className="flex items-center justify-between text-[#7C756E]">
                  <span className="text-[10px] font-mono font-bold uppercase">Temperature</span>
                  <Thermometer className="h-4 w-4 text-[#F46B27]" />
                </div>
                {isLoadingCurrent ? (
                  <div className="h-5 bg-[#26211C] rounded animate-pulse my-1" />
                ) : (
                  <p className="text-lg font-black text-[#F4F0EB]">
                    {currentWeather ? `${currentWeather.temperature.toFixed(1)}°C` : '---'}
                  </p>
                )}
                <span className="text-[10px] font-mono text-[#AAA29A]">
                  {currentWeather ? `Humidity: ${currentWeather.relativeHumidity}%` : '---'}
                </span>
              </div>

              {/* 24h Forecast Rainfall */}
              <div className="p-3.5 rounded-lg bg-[#12110F] border border-[#2E2721] flex flex-col justify-between min-w-[120px] gap-2.5">
                <div className="flex items-center justify-between text-[#7C756E]">
                  <span className="text-[10px] font-mono font-bold uppercase">24h Rain Outlook</span>
                  <CloudRain className="h-4 w-4 text-cyan-400" />
                </div>
                {isLoadingForecast ? (
                  <div className="h-5 bg-[#26211C] rounded animate-pulse my-1" />
                ) : (
                  <p className="text-lg font-black text-cyan-400">
                    {forecastRainfall24h.toFixed(1)} mm
                  </p>
                )}
                <span className="text-[10px] font-mono text-[#AAA29A]">
                  Rate: {currentWeather ? `${currentWeather.precipitationRate.toFixed(1)} mm/h` : '0 mm/h'}
                </span>
              </div>

              {/* Wind Speed & Direction */}
              <div className="p-3.5 rounded-lg bg-[#12110F] border border-[#2E2721] flex flex-col justify-between min-w-[120px] gap-2.5">
                <div className="flex items-center justify-between text-[#7C756E]">
                  <span className="text-[10px] font-mono font-bold uppercase">Surface Wind</span>
                  <Wind className="h-4 w-4 text-emerald-400" />
                </div>
                {isLoadingCurrent ? (
                  <div className="h-4 bg-[#26211C] rounded animate-pulse my-1" />
                ) : (
                  <p className="text-sm font-bold text-[#F4F0EB]">
                    {currentWeather ? `${currentWeather.windSpeed.toFixed(1)} km/h` : '---'}
                  </p>
                )}
                <span className="text-[10px] font-mono text-[#AAA29A]">
                  Heading: {currentWeather?.windDirectionCardinal || '---'} ({currentWeather?.windDirection || 0}°)
                </span>
              </div>

            </div>

          </div>

          {/* Freshness, Aggregation & Attribution Notice */}
          <div className="mt-4 pt-3 border-t border-[#26211C] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#7C756E] font-mono gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Representative-Location Forecast: Open-Meteo High-Resolution Model (Asia/Kolkata IST)</span>
            </div>
            <div>
              Observation Time: {currentWeather ? new Date(currentWeather.observationTime).toLocaleTimeString('en-IN') : 'Syncing...'} &bull; Updated: {lastSuccessfulUpdate ? new Date(lastSuccessfulUpdate).toLocaleTimeString('en-IN') : 'Just now'}
            </div>
          </div>
        </CardContent>
      </Card>



      {/* MAIN DASHBOARD CONTENT */}
      <div className="w-full">
        
        {/* MAIN COLUMN: OFFICIAL WARNINGS, FORECASTS, TELEMETRY */}
        <div className="w-full space-y-8">

          {/* SECTION: 24-HOUR HOURLY FORECAST TIMELINE */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold text-[#7C756E] uppercase tracking-wider flex items-center gap-1.5">
                <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
                24-Hour Hourly Forecast Timeline &bull; {selectedDistrict.name}
              </h2>
              <span className="text-[10px] font-mono text-[#7C756E]">
                Representative Point: {selectedDistrict.representativePointName} (IST)
              </span>
            </div>

            <Card className="border border-[#38302A] rounded-xl bg-[#191715] overflow-hidden">
              <CardContent className="p-4">
                {isLoadingForecast ? (
                  <div className="flex gap-2.5 overflow-x-auto py-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div key={n} className="w-24 h-28 bg-[#26211C] rounded-lg animate-pulse shrink-0" />
                    ))}
                  </div>
                ) : hourlyForecast.length === 0 ? (
                  <p className="text-xs text-[#AAA29A] text-center py-6">No hourly forecast data returned for this district.</p>
                ) : (
                  <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#38302A]">
                    <div className="flex gap-2.5 min-w-max">
                      {hourlyForecast.map((hour, idx) => (
                        <div
                          key={hour.time}
                          className={`p-3 rounded-lg border text-center flex flex-col justify-between w-24 shrink-0 transition-all ${
                            idx === 0 
                              ? 'bg-[#27211B] border-[#F5A23A]/50 shadow-xs' 
                              : 'bg-[#12110F] border-[#2E2721] hover:border-[#453A30]'
                          }`}
                        >
                          <span className="text-[11px] font-mono font-bold text-[#AAA29A]">
                            {idx === 0 ? 'Now' : hour.formattedTime}
                          </span>
                          
                          <div className="my-2 flex justify-center">
                            {getWeatherIcon(hour.weatherCode, hour.isDay)}
                          </div>

                          <span className="text-sm font-bold text-[#F4F0EB]">
                            {Math.round(hour.temperature)}°C
                          </span>

                          <div className="mt-2 pt-1.5 border-t border-[#26211C] space-y-0.5">
                            <span className="text-[10px] font-mono font-semibold text-cyan-400 block">
                              {hour.precipitation > 0 ? `${hour.precipitation.toFixed(1)} mm` : '0 mm'}
                            </span>
                            <span className="text-[9px] font-mono text-[#7C756E] block">
                              {hour.precipitationProbability}% prob
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SECTION: 7-DAY EXTENDED METEOROLOGICAL OUTLOOK */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-mono font-bold text-[#7C756E] uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              7-Day Meteorological Outlook &bull; {selectedDistrict.name}
            </h2>

            <Card className="border border-[#38302A] rounded-xl bg-[#191715] overflow-hidden">
              <CardContent className="p-4">
                {isLoadingForecast ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <div key={n} className="h-28 bg-[#26211C] rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : dailyForecast.length === 0 ? (
                  <p className="text-xs text-[#AAA29A] text-center py-6">No extended outlook data available.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {dailyForecast.map((day, idx) => (
                      <div
                        key={day.date}
                        className={`p-3 rounded-lg border text-center flex flex-col justify-between ${
                          idx === 0
                            ? 'bg-[#27211B] border-[#F5A23A]/40'
                            : 'bg-[#12110F] border-[#2E2721]'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-[#F4F0EB]">{day.dayLabel}</p>
                          <p className="text-[10px] font-mono text-[#7C756E]">{day.date.slice(5)}</p>
                        </div>

                        <div className="my-2.5 flex justify-center">
                          {getWeatherIcon(day.weatherCode, true)}
                        </div>

                        <p className="text-[11px] font-semibold text-[#AAA29A] line-clamp-1">
                          {day.weatherText}
                        </p>

                        <div className="mt-2 text-xs font-mono font-bold text-[#F4F0EB]">
                          <span>{Math.round(day.tempMax)}°</span>
                          <span className="text-[#7C756E] font-normal mx-1">/</span>
                          <span className="text-[#AAA29A] font-normal">{Math.round(day.tempMin)}°</span>
                        </div>

                        <div className="mt-1 text-[10px] font-mono text-cyan-400">
                          {day.precipitationSum > 0 ? `${day.precipitationSum.toFixed(1)} mm` : '0 mm'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SECTION: GDACS MULTI-HAZARD OBSERVATION TELEMETRY */}
          <div className="flex flex-col gap-3">
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
                    <span className="text-xs font-bold text-[#F4F0EB]">Global Floods &amp; Cyclones</span>
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

          {/* SECTION: NASA FIRMS SATELLITE FIRE TELEMETRY */}
          <div className="flex flex-col gap-3">
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

          {/* SECTION: REAL USGS SEISMIC NETWORK TELEMETRY */}
          <div className="flex flex-col gap-3">
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
        </div>

      </div>
    </div>
  );
}
