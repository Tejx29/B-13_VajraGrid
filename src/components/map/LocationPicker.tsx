import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Check, 
  Crosshair, 
  AlertCircle, 
  AlertTriangle,
  Loader2, 
  Globe, 
  ChevronDown, 
  Sparkles,
  Info,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { 
  SUPPORTED_COUNTRIES,
  SUPPORTED_STATES,
  SUPPORTED_DISTRICTS,
  getDistrictById,
  validateDistrictLocation,
  geocodingService,
  getProviderInfo,
  fallbackReverseGeocode,
  GeocodingResult,
  DistrictValidationResult,
  AdministrativeDistrict,
  AddressVerificationStatus,
  BoundaryValidationStatus
} from '../../services/geocodingService';

// Pin icon for the Location Picker - visual appearance adjusts if point is outside active district boundary
const createPickerIcon = (isOutOfDistrict: boolean = false) => {
  const bgColor = isOutOfDistrict ? 'bg-amber-600 ring-amber-400' : 'bg-blue-600 ring-blue-400';
  const pingColor = isOutOfDistrict ? 'bg-amber-500/20' : 'bg-blue-500/30';
  
  const iconSvg = isOutOfDistrict
    ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>`;

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer" style="width: 38px; height: 38px;">
      <div class="absolute -inset-1 rounded-full ${pingColor} animate-ping pointer-events-none"></div>
      <div class="w-full h-full rounded-full ${bgColor} border-2 border-white shadow-xl flex items-center justify-center text-white ring-2">
        ${iconSvg}
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'resqai-picker-marker',
    html,
    iconSize: [38, 38],
    iconAnchor: [19, 36],
    popupAnchor: [0, -36],
  });
};

// Map click handler and camera sync
function MapEventsHandler({ 
  onLocationSelect, 
  selectedPos,
  districtId,
  districtCenter,
  districtZoom,
}: { 
  onLocationSelect: (lat: number, lng: number) => void;
  selectedPos: [number, number] | null;
  districtId: string;
  districtCenter: [number, number];
  districtZoom: number;
}) {
  const map = useMap();
  const lastDistrictIdRef = useRef<string>(districtId);
  const lastPosRef = useRef<[number, number] | null>(selectedPos);

  // Users can click anywhere on the visible map without boundary blocking
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  // When district selector changes, pan map to newly selected district context
  useEffect(() => {
    if (lastDistrictIdRef.current !== districtId) {
      lastDistrictIdRef.current = districtId;
      map.flyTo(districtCenter, districtZoom, { duration: 0.8 });
    }
  }, [districtId, districtCenter, districtZoom, map]);

  // Center on valid point selection when newly selected
  useEffect(() => {
    if (selectedPos) {
      const isNewPoint =
        !lastPosRef.current ||
        Math.abs(lastPosRef.current[0] - selectedPos[0]) > 0.0001 ||
        Math.abs(lastPosRef.current[1] - selectedPos[1]) > 0.0001;

      if (isNewPoint) {
        lastPosRef.current = selectedPos;
        map.flyTo(selectedPos, Math.max(map.getZoom(), 12), { duration: 0.8 });
      }
    } else {
      lastPosRef.current = null;
    }
  }, [selectedPos, map]);

  // Invalidate size on mount to handle card layout transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        // ignore
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export type CoordinateStatus = 'exact' | 'missing';

export interface LocationValue {
  lat: number | null;
  lng: number | null;
  address: string;
  country?: string;
  state?: string;
  district?: string;
  verificationStatus?: 'verified' | 'unverified' | 'boundary_unverified';
  coordinateStatus?: CoordinateStatus;
  boundaryStatus?: BoundaryValidationStatus;
  addressStatus?: AddressVerificationStatus;
}

export interface LocationPickerProps {
  value: LocationValue;
  onChange: (loc: {
    lat: number;
    lng: number;
    address: string;
    country?: string;
    state?: string;
    district?: string;
    verificationStatus?: 'verified' | 'unverified' | 'boundary_unverified';
    coordinateStatus?: CoordinateStatus;
    boundaryStatus?: BoundaryValidationStatus;
    addressStatus?: AddressVerificationStatus;
  }) => void;
  required?: boolean;
  className?: string;
  defaultDistrictId?: string;
  mapHeight?: string;
}

export function LocationPicker({
  value,
  onChange,
  required = true,
  className = '',
  defaultDistrictId = 'palghar',
  mapHeight = 'h-[440px] sm:h-[480px]',
}: LocationPickerProps) {
  // 1. Administrative Hierarchy State
  const [selectedCountry, setSelectedCountry] = useState<string>('IND');
  const [selectedState, setSelectedState] = useState<string>('MH');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(() => {
    if (value.district) {
      const match = SUPPORTED_DISTRICTS.find(
        d => d.name.toLowerCase() === value.district?.toLowerCase()
      );
      if (match) return match.id;
    }
    return defaultDistrictId;
  });

  // User acknowledgement state for warning when point is outside district boundary
  const [warningAcknowledged, setWarningAcknowledged] = useState<boolean>(false);
  const [showDistrictChangeDropdown, setShowDistrictChangeDropdown] = useState<boolean>(false);
  const [detectedDistrictName, setDetectedDistrictName] = useState<string | null>(null);

  const currentDistrict: AdministrativeDistrict =
    getDistrictById(selectedDistrictId) || SUPPORTED_DISTRICTS[0];

  // 2. Search & Provider State
  const providerInfo = getProviderInfo();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isReverseResolving, setIsReverseResolving] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<DistrictValidationResult | null>(null);
  
  // Track address verification status: 'verified', 'inferred', or 'unverified'
  const [addressStatus, setAddressStatus] = useState<AddressVerificationStatus>(() => {
    if (value.addressStatus) return value.addressStatus;
    if (value.address && value.address.includes('[Approximate / Inferred]')) return 'inferred';
    if (value.lat && value.lng && value.address) return 'verified';
    return 'unverified';
  });

  // Map tile style: Satellite-First by default
  const [mapStyle, setMapStyle] = useState<'satellite' | 'street'>('satellite');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const districtMenuRef = useRef<HTMLDivElement>(null);

  // Epoch counter and abort controllers to prevent race conditions & slow stale responses
  const districtEpochRef = useRef<number>(0);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const reverseAbortControllerRef = useRef<AbortController | null>(null);

  // Validate coordinates whenever value or active district changes
  useEffect(() => {
    if (typeof value.lat === 'number' && typeof value.lng === 'number' && !isNaN(value.lat) && !isNaN(value.lng)) {
      const val = validateDistrictLocation(value.lat, value.lng, selectedDistrictId);
      setValidationResult(val);
    } else {
      setValidationResult(null);
    }
  }, [value.lat, value.lng, selectedDistrictId]);

  // Keep internal addressStatus in sync with external value
  useEffect(() => {
    if (value.addressStatus) {
      setAddressStatus(value.addressStatus);
    } else if (value.address && value.address.includes('[Approximate / Inferred]')) {
      setAddressStatus('inferred');
    }
  }, [value.addressStatus, value.address]);

  // Handle outside click to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (districtMenuRef.current && !districtMenuRef.current.contains(e.target as Node)) {
        setShowDistrictChangeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // District switching handler: updates reference context and re-validates point without moving marker
  const handleDistrictChange = (newDistrictId: string) => {
    if (newDistrictId === selectedDistrictId) {
      setShowDistrictChangeDropdown(false);
      return;
    }

    setSelectedDistrictId(newDistrictId);
    setShowDistrictChangeDropdown(false);
    setWarningAcknowledged(false);

    // Increment epoch and cancel in-flight requests to prevent stale responses from overwriting
    districtEpochRef.current += 1;
    const currentEpoch = districtEpochRef.current;

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
      searchAbortControllerRef.current = null;
    }
    if (reverseAbortControllerRef.current) {
      reverseAbortControllerRef.current.abort();
      reverseAbortControllerRef.current = null;
    }

    // Clear stale search state
    setSearchResults([]);
    setSearchQuery('');
    setHasSearched(false);
    setSearchError(null);
    setShowDropdown(false);
    setGeoNotice(null);

    const newDist = getDistrictById(newDistrictId);
    if (!newDist) return;

    // Check if user has an existing coordinate point
    if (typeof value.lat === 'number' && typeof value.lng === 'number' && !isNaN(value.lat) && !isNaN(value.lng)) {
      const exactLat = value.lat;
      const exactLng = value.lng;

      // Revalidate coordinates against the newly selected district boundary
      const val = validateDistrictLocation(exactLat, exactLng, newDistrictId);
      setValidationResult(val);

      // Trigger address refresh/reverse-geocoding without moving the point
      setIsReverseResolving(true);
      const revController = new AbortController();
      reverseAbortControllerRef.current = revController;

      geocodingService.reverse(exactLat, exactLng, revController.signal)
        .then((rev) => {
          if (currentEpoch !== districtEpochRef.current) return;
          setIsReverseResolving(false);

          let refreshedAddr = rev?.displayName;
          let refreshedAddrStatus: AddressVerificationStatus = rev?.addressStatus || 'verified';
          const detectedDist = rev?.district || rev?.city || null;
          setDetectedDistrictName(detectedDist);

          if (!refreshedAddr) {
            const fallback = fallbackReverseGeocode(exactLat, exactLng, newDistrictId);
            refreshedAddr = fallback.displayName;
            refreshedAddrStatus = 'inferred';
          }

          setAddressStatus(refreshedAddrStatus);

          const legacyStatus: 'verified' | 'unverified' | 'boundary_unverified' =
            val.status === 'verified' && refreshedAddrStatus === 'verified'
              ? 'verified'
              : val.status === 'outside'
              ? 'unverified'
              : 'boundary_unverified';

          onChange({
            lat: exactLat, // Exact coordinates preserved
            lng: exactLng, // Exact coordinates preserved
            address: refreshedAddr,
            country: 'India',
            state: 'Maharashtra',
            district: newDist.name,
            verificationStatus: legacyStatus,
            coordinateStatus: 'exact',
            boundaryStatus: val.status,
            addressStatus: refreshedAddrStatus,
          });
        })
        .catch((err) => {
          if (currentEpoch !== districtEpochRef.current || err.name === 'AbortError') return;
          setIsReverseResolving(false);

          const fallback = fallbackReverseGeocode(exactLat, exactLng, newDistrictId);
          setAddressStatus('inferred');

          onChange({
            lat: exactLat,
            lng: exactLng,
            address: fallback.displayName,
            country: 'India',
            state: 'Maharashtra',
            district: newDist.name,
            verificationStatus: val.status === 'outside' ? 'unverified' : 'boundary_unverified',
            coordinateStatus: 'exact',
            boundaryStatus: val.status,
            addressStatus: 'inferred',
          });
        });
    }
  };

  // Country and State handlers
  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
  };

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
  };

  // Perform geocoding search for ANY location within or beyond selected district
  const executeSearch = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    const currentEpoch = districtEpochRef.current;
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setShowDropdown(true);

    try {
      const results = await geocodingService.search(
        q,
        {
          district: currentDistrict.name,
          state: 'Maharashtra',
          country: 'India',
          bbox: currentDistrict.bbox,
          limit: 8,
        },
        controller.signal
      );

      if (currentEpoch !== districtEpochRef.current) return;
      setSearchResults(results);
    } catch (err: any) {
      if (currentEpoch !== districtEpochRef.current || err.name === 'AbortError') return;
      console.warn('Geocoding search failed:', err);
      setSearchError('Search query could not be resolved. Please try a different term or click directly on the map.');
      setSearchResults([]);
    } finally {
      if (currentEpoch === districtEpochRef.current) {
        setIsSearching(false);
      }
    }
  };

  // Live autocomplete debounce if provider supports it
  useEffect(() => {
    if (!providerInfo.supportsAutocomplete) return;
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(searchQuery);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedDistrictId]);

  // Handle selection of a search result
  const handleSelectResult = (item: GeocodingResult) => {
    setShowDropdown(false);
    setSearchError(null);
    setGeoNotice(null);

    const exactLat = item.lat;
    const exactLng = item.lng;
    const val = validateDistrictLocation(exactLat, exactLng, selectedDistrictId);
    setValidationResult(val);
    setAddressStatus('verified');
    setWarningAcknowledged(false);

    if (item.district) {
      setDetectedDistrictName(item.district);
    }

    const legacyStatus: 'verified' | 'unverified' | 'boundary_unverified' =
      val.status === 'verified'
        ? 'verified'
        : val.status === 'outside'
        ? 'unverified'
        : 'boundary_unverified';

    onChange({
      lat: exactLat,
      lng: exactLng,
      address: item.displayName || item.name,
      country: item.country || 'India',
      state: item.state || 'Maharashtra',
      district: currentDistrict.name,
      verificationStatus: legacyStatus,
      coordinateStatus: 'exact',
      boundaryStatus: val.status,
      addressStatus: 'verified',
    });
  };

  // Handle selection of a catalog landmark preset
  const handleSelectLandmarkPreset = (landmark: { name: string; lat: number; lng: number; description: string }) => {
    const exactLat = landmark.lat;
    const exactLng = landmark.lng;
    const val = validateDistrictLocation(exactLat, exactLng, selectedDistrictId);
    setValidationResult(val);
    setAddressStatus('verified');
    setWarningAcknowledged(false);

    const legacyStatus: 'verified' | 'unverified' | 'boundary_unverified' =
      val.status === 'verified'
        ? 'verified'
        : val.status === 'outside'
        ? 'unverified'
        : 'boundary_unverified';

    onChange({
      lat: exactLat,
      lng: exactLng,
      address: `${landmark.description}, ${currentDistrict.name} District, Maharashtra`,
      country: 'India',
      state: 'Maharashtra',
      district: currentDistrict.name,
      verificationStatus: legacyStatus,
      coordinateStatus: 'exact',
      boundaryStatus: val.status,
      addressStatus: 'verified',
    });
  };

  // Handle map click or marker drag: PERMITS ANY POINT on the map, preserving exact lat/lng
  const handleCoordinatesSelected = (lat: number, lng: number) => {
    // EXACT user clicked or dragged coordinates are preserved without snapping
    const exactLat = lat;
    const exactLng = lng;

    const val = validateDistrictLocation(exactLat, exactLng, selectedDistrictId);
    setValidationResult(val);
    setGeoNotice(null);
    setWarningAcknowledged(false);

    // 1. Immediately emit exact coordinates synchronously so marker and parent form update instantly
    const initialStatus: 'verified' | 'unverified' | 'boundary_unverified' =
      val.status === 'outside' ? 'unverified' : 'boundary_unverified';

    const provisionalAddress = `Point at ${exactLat.toFixed(4)}° N, ${exactLng.toFixed(4)}° E`;

    onChange({
      lat: exactLat,
      lng: exactLng,
      address: value.address && value.lat === exactLat && value.lng === exactLng ? value.address : provisionalAddress,
      country: 'India',
      state: 'Maharashtra',
      district: currentDistrict.name,
      verificationStatus: initialStatus,
      coordinateStatus: 'exact',
      boundaryStatus: val.status,
      addressStatus: 'unverified',
    });

    // 2. Asynchronously resolve reverse geocoding to enrich the human-readable address
    setIsReverseResolving(true);
    districtEpochRef.current += 1;
    const currentEpoch = districtEpochRef.current;

    if (reverseAbortControllerRef.current) {
      reverseAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    reverseAbortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 2500);

    geocodingService.reverse(exactLat, exactLng, controller.signal)
      .then((rev) => {
        clearTimeout(timeoutId);
        if (currentEpoch !== districtEpochRef.current) return;
        setIsReverseResolving(false);

        let resolvedAddress = '';
        let currentAddrStatus: AddressVerificationStatus = 'unverified';

        if (rev && rev.displayName) {
          resolvedAddress = rev.displayName;
          currentAddrStatus = rev.addressStatus || 'verified';
          const detected = rev.district || rev.city || null;
          setDetectedDistrictName(detected);
        }

        if (!resolvedAddress) {
          const fallback = fallbackReverseGeocode(exactLat, exactLng, selectedDistrictId);
          resolvedAddress = fallback.displayName;
          currentAddrStatus = 'inferred';
        }

        setAddressStatus(currentAddrStatus);

        const legacyStatus: 'verified' | 'unverified' | 'boundary_unverified' =
          val.status === 'verified' && currentAddrStatus === 'verified'
            ? 'verified'
            : val.status === 'outside'
            ? 'unverified'
            : 'boundary_unverified';

        onChange({
          lat: exactLat,
          lng: exactLng,
          address: resolvedAddress,
          country: 'India',
          state: 'Maharashtra',
          district: currentDistrict.name,
          verificationStatus: legacyStatus,
          coordinateStatus: 'exact',
          boundaryStatus: val.status,
          addressStatus: currentAddrStatus,
        });
      })
      .catch(() => {
        clearTimeout(timeoutId);
        if (currentEpoch !== districtEpochRef.current) return;
        setIsReverseResolving(false);

        const fallback = fallbackReverseGeocode(exactLat, exactLng, selectedDistrictId);
        setAddressStatus('inferred');

        onChange({
          lat: exactLat,
          lng: exactLng,
          address: fallback.displayName,
          country: 'India',
          state: 'Maharashtra',
          district: currentDistrict.name,
          verificationStatus: val.status === 'outside' ? 'unverified' : 'boundary_unverified',
          coordinateStatus: 'exact',
          boundaryStatus: val.status,
          addressStatus: 'inferred',
        });
      });
  };

  // Handle GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.');
      return;
    }

    setGeoNotice(null);
    setIsReverseResolving(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await handleCoordinatesSelected(latitude, longitude);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setIsReverseResolving(false);
        setGeoNotice('Unable to acquire GPS position. Please search a location or click directly on the map.');
      },
      { timeout: 8000 }
    );
  };

  const hasValidCoordinates =
    typeof value.lat === 'number' &&
    typeof value.lng === 'number' &&
    !isNaN(value.lat) &&
    !isNaN(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180;

  const isSelectionOutOfDistrict =
    hasValidCoordinates && validationResult?.status === 'outside';

  const markerPosition: [number, number] | null = hasValidCoordinates
    ? [value.lat!, value.lng!]
    : null;

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* 1. Administrative Selection: Country -> State -> District */}
      <div className="bg-[#12110F] border border-[#38302A] rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-[#AAA29A]">
          <span className="flex items-center gap-1.5 text-[#F5A23A]">
            <Globe className="h-3.5 w-3.5 text-[#F5A23A]" />
            Administrative Sector
          </span>
          <span className="text-[11px] text-[#7C756E] font-normal">
            Select sector reference &middot; Emergency reporting is permitted anywhere
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Country */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[#7C756E] tracking-wider">Country</label>
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full h-9 px-2.5 bg-[#191715] border border-[#38302A] rounded-lg text-xs font-semibold text-[#AAA29A] appearance-none cursor-not-allowed"
                disabled
              >
                {SUPPORTED_COUNTRIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* State */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[#7C756E] tracking-wider">State</label>
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full h-9 px-2.5 bg-[#191715] border border-[#38302A] rounded-lg text-xs font-semibold text-[#AAA29A] appearance-none cursor-not-allowed"
                disabled
              >
                {SUPPORTED_STATES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* District (Dynamic selection) */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[#F5A23A] tracking-wider">District</label>
            <div className="relative">
              <select
                value={selectedDistrictId}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full h-9 pl-2.5 pr-8 bg-[#191715] border border-[#38302A] rounded-lg text-xs font-bold text-[#F4F0EB] focus:outline-none focus:border-[#F5A23A] appearance-none cursor-pointer shadow-2xs"
              >
                {SUPPORTED_DISTRICTS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.id === 'palghar' ? '(VajraGrid Primary Sector)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#AAA29A] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Requirement 2 & 3: Clear Amber Warning when Point is Outside Selected District */}
      {isSelectionOutOfDistrict && (
        <div className="p-3.5 rounded-xl bg-[#221B14] border border-[#F5A23A]/40 text-[#F4F0EB] shadow-2xs space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 rounded-full bg-[#27211B] border border-[#F5A23A]/50 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4 text-[#F5A23A]" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#F5A23A]">
                  Location Outside Selected District Boundary
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#27211B] text-[#F5A23A] border border-[#F5A23A]/50 font-bold">
                  Outside {currentDistrict.name}
                </span>
              </div>
              <p className="text-xs text-[#AAA29A] font-medium">
                This location is outside the selected district. You can still report the incident.
              </p>
              <p className="text-[11px] text-[#7C756E] leading-relaxed">
                Selected coordinates: <span className="font-mono font-semibold text-[#F4F0EB]">{value.lat?.toFixed(4)}° N, {value.lng?.toFixed(4)}° E</span>
                {detectedDistrictName && (
                  <span> &bull; Detected administrative area: <strong className="text-[#F4F0EB]">{detectedDistrictName}</strong></span>
                )}
              </p>
            </div>
          </div>

          {/* Two Clear Actions: "Use This Location Anyway" and "Change District" */}
          <div className="pt-2 border-t border-[#38302A] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#AAA29A]">
              <Info className="h-3.5 w-3.5 text-[#F5A23A] shrink-0" />
              <span>District boundaries do not prevent emergency response reporting.</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Action 1: "Use This Location Anyway" */}
              <button
                type="button"
                onClick={() => setWarningAcknowledged(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-colors ${
                  warningAcknowledged
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {warningAcknowledged ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Location Confirmed for Report
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Use This Location Anyway
                  </>
                )}
              </button>

              {/* Action 2: "Change District" (Optional, never mandatory) */}
              <div className="relative" ref={districtMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowDistrictChangeDropdown(prev => !prev)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#27211B] border border-[#38302A] hover:bg-[#342c24] text-[#F4F0EB] rounded-lg text-xs font-semibold transition-colors"
                >
                  <Compass className="h-3.5 w-3.5 text-[#F5A23A]" />
                  Change District
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showDistrictChangeDropdown && (
                  <div className="absolute right-0 bottom-full mb-1.5 w-56 bg-[#191715] border border-[#38302A] rounded-xl shadow-xl z-50 p-1.5 divide-y divide-[#26211C] animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1 text-[10px] font-bold text-[#7C756E] uppercase tracking-wider font-mono">
                      Switch Sector Reference
                    </div>
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {SUPPORTED_DISTRICTS.map(d => {
                        const isDetected = detectedDistrictName && d.name.toLowerCase().includes(detectedDistrictName.toLowerCase());
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => handleDistrictChange(d.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                              d.id === selectedDistrictId
                                ? 'bg-[#27211B] text-[#F5A23A] font-bold'
                                : 'hover:bg-[#27211B]/60 text-[#AAA29A]'
                            }`}
                          >
                            <span>{d.name}</span>
                            {isDetected && (
                              <span className="text-[9px] bg-[#16B58A]/15 text-[#16B58A] px-1.5 py-0.2 rounded font-mono">
                                Detected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Constraint validation hidden input: validates only that coordinates exist and are numeric */}
      <input
        type="text"
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        readOnly
        value={hasValidCoordinates ? 'valid' : ''}
        required={required}
        ref={(inputEl) => {
          if (inputEl) {
            if (!hasValidCoordinates && required) {
              inputEl.setCustomValidity('Please select a geographic point on the map or search an address.');
            } else {
              inputEl.setCustomValidity('');
            }
          }
        }}
      />

      {/* 2. Search for ANY location */}
      <div className="relative" ref={dropdownRef}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch(searchQuery);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C756E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!providerInfo.supportsAutocomplete) {
                  setShowDropdown(false);
                }
              }}
              onFocus={() => {
                if (searchResults.length > 0 || hasSearched) {
                  setShowDropdown(true);
                }
              }}
              placeholder={`Search any street, road, landmark, village, building in ${currentDistrict.name}...`}
              className="w-full pl-10 pr-24 py-2.5 bg-[#12110F] border border-[#38302A] rounded-lg text-xs text-[#F4F0EB] placeholder:text-[#7C756E] focus:outline-none focus:border-[#F5A23A] transition-colors shadow-2xs font-medium"
              required={required && !hasValidCoordinates}
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                  setHasSearched(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#AAA29A] hover:text-[#F4F0EB] px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-[#F5A23A] hover:bg-[#f6ab4e] disabled:opacity-50 text-stone-950 rounded-lg shadow-2xs transition-colors shrink-0"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
              </>
            )}
          </button>

          {/* GPS Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isReverseResolving}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold bg-[#27211B] border border-[#38302A] hover:bg-[#342c24] text-[#F4F0EB] rounded-lg shadow-2xs transition-colors shrink-0"
            title={`Use device GPS in ${currentDistrict.name}`}
          >
            <Navigation className="h-3.5 w-3.5 text-[#F5A23A]" />
            <span className="hidden sm:inline">Use GPS</span>
          </button>
        </form>

        {/* Provider info pill */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3 text-slate-400" />
            Search Provider: <strong>{providerInfo.name}</strong>
            {providerInfo.supportsAutocomplete && ' (Live Autocomplete)'}
          </span>
          {!providerInfo.hasApiKey && (
            <span className="text-slate-400 hidden sm:inline">
              Configure VITE_GEOAPIFY_API_KEY for live typing autocomplete
            </span>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#191715] border border-[#38302A] rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-[#26211C] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 bg-[#12110F] text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider flex items-center justify-between">
              <span>Results for {searchQuery}</span>
              {isSearching && <Loader2 className="h-3 w-3 animate-spin text-[#F5A23A]" />}
            </div>

            {/* Loading State */}
            {isSearching && (
              <div className="p-4 text-center text-xs text-[#AAA29A] flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#F5A23A]" />
                <span>Searching {currentDistrict.name} administrative sector...</span>
              </div>
            )}

            {/* Error State */}
            {!isSearching && searchError && (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-[#ff727f]">{searchError}</p>
                <button
                  type="button"
                  onClick={() => executeSearch(searchQuery)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#E53946]/20 text-[#ff727f] hover:bg-[#E53946]/30 rounded text-xs font-semibold"
                >
                  Retry Search
                </button>
              </div>
            )}

            {/* No Results State */}
            {!isSearching && !searchError && hasSearched && searchResults.length === 0 && (
              <div className="p-4 text-center space-y-1">
                <p className="text-xs font-medium text-[#AAA29A]">No matching places found for &quot;{searchQuery}&quot;</p>
                <p className="text-[11px] text-[#7C756E]">
                  Try searching a different landmark or click directly anywhere on the map below.
                </p>
              </div>
            )}

            {/* Successful Results */}
            {!isSearching && searchResults.map((item) => (
              <div
                key={item.id}
                onMouseDown={() => handleSelectResult(item)}
                className="p-3 text-left hover:bg-[#27211B] cursor-pointer transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#F5A23A] shrink-0" />
                    <span className="text-xs font-bold text-[#F4F0EB] truncate group-hover:text-[#F5A23A]">
                      {item.name}
                    </span>
                    {item.suburb && (
                      <span className="text-[10px] bg-[#27211B] text-[#AAA29A] px-1.5 py-0.2 rounded font-mono truncate">
                        {item.suburb}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#AAA29A] truncate pl-5">{item.displayName}</p>
                </div>
                <div className="text-[10px] font-mono text-[#7C756E] shrink-0 pt-0.5">
                  {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Quick Landmarks / Suggestions for Selected District */}
      {currentDistrict.popularLandmarks && currentDistrict.popularLandmarks.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#7C756E]">
            <Sparkles className="h-3 w-3 text-[#F5A23A]" />
            <span>Popular Landmarks in {currentDistrict.name} (Quick Presets):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentDistrict.popularLandmarks.slice(0, 8).map((landmark) => {
              const isSelected =
                hasValidCoordinates &&
                Math.abs(landmark.lat - value.lat!) < 0.003 &&
                Math.abs(landmark.lng - value.lng!) < 0.003;

              return (
                <button
                  key={landmark.name}
                  type="button"
                  onClick={() => handleSelectLandmarkPreset(landmark)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                    isSelected
                      ? 'bg-[#F5A23A] border-[#F5A23A] text-stone-950 font-bold shadow-2xs'
                      : 'bg-[#191715] border-[#38302A] text-[#AAA29A] hover:border-[#F5A23A]/50 hover:bg-[#27211B] hover:text-[#F4F0EB]'
                  }`}
                >
                  {landmark.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Geolocation Notice / Warning */}
      {geoNotice && (
        <div className="p-2.5 rounded-lg bg-[#221B14] border border-[#F5A23A]/40 text-[#F5A23A] text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#F5A23A] shrink-0" />
          <span>{geoNotice}</span>
        </div>
      )}

      {/* 4. Interactive Leaflet Map for Direct Point Selection - Free Panning & Selection Anywhere */}
      <div className="rounded-xl border border-[#38302A] overflow-hidden shadow-2xs bg-[#090909]">
        <div className="p-2 px-3 bg-[#12110F] border-b border-[#38302A] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#AAA29A] flex items-center gap-1.5">
              <Crosshair className="h-3.5 w-3.5 text-[#F5A23A]" />
              Click or drag marker on map to pinpoint emergency
            </span>

            {/* Satellite / Street Switcher */}
            <div className="inline-flex rounded-md border border-[#38302A] p-0.5 bg-[#191715]">
              <button
                type="button"
                onClick={() => setMapStyle('satellite')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  mapStyle === 'satellite'
                    ? 'bg-[#F5A23A] text-stone-950 shadow-2xs'
                    : 'text-[#AAA29A] hover:text-[#F4F0EB]'
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('street')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  mapStyle === 'street'
                    ? 'bg-[#F5A23A] text-stone-950 shadow-2xs'
                    : 'text-[#AAA29A] hover:text-[#F4F0EB]'
                }`}
              >
                Street
              </button>
            </div>
          </div>

          <div>
            {isReverseResolving ? (
              <span className="text-[11px] font-mono text-[#4F8DFF] flex items-center gap-1 font-semibold">
                <Loader2 className="h-3 w-3 animate-spin" /> Resolving address...
              </span>
            ) : isSelectionOutOfDistrict ? (
              <span className="text-[11px] font-mono text-[#F5A23A] bg-[#27211B] px-2 py-0.5 rounded border border-[#F5A23A]/40 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-[#F5A23A]" />
                Outside {currentDistrict.name} boundary (Report allowed)
              </span>
            ) : hasValidCoordinates ? (
              <span className="text-[11px] font-mono text-[#16B58A] bg-[#16B58A]/15 px-2 py-0.5 rounded border border-[#16B58A]/40 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" />
                {value.lat!.toFixed(4)}° N, {value.lng!.toFixed(4)}° E
              </span>
            ) : (
              <span className="text-[11px] font-mono text-[#AAA29A] bg-[#191715] px-2 py-0.5 rounded border border-[#38302A]">
                No point selected
              </span>
            )}
          </div>
        </div>

        <div className={`${mapHeight || 'h-[440px] sm:h-[480px]'} w-full relative`}>
          <MapContainer
            center={currentDistrict.center}
            zoom={currentDistrict.zoom}
            minZoom={4}
            maxZoom={18}
            style={{ width: '100%', height: '100%' }}
            className="z-0 h-full w-full"
          >
            {mapStyle === 'satellite' ? (
              <React.Fragment key="picker-sat-group">
                <TileLayer
                  key="picker-satellite"
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, USGS'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                />
                <TileLayer
                  key="picker-satellite-labels"
                  attribution='&copy; Esri &mdash; Boundaries & Places'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                />
              </React.Fragment>
            ) : (
              <TileLayer
                key="picker-osm"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            )}

            {/* Selected District Boundary Polygon as situational visual reference */}
            {currentDistrict.polygon && (
              <Polygon
                positions={currentDistrict.polygon}
                pathOptions={{
                  color: isSelectionOutOfDistrict ? '#f59e0b' : '#2563eb',
                  weight: 2,
                  dashArray: '5, 5',
                  fillColor: isSelectionOutOfDistrict ? '#fbbf24' : '#3b82f6',
                  fillOpacity: 0.05,
                }}
              />
            )}

            <MapEventsHandler
              onLocationSelect={handleCoordinatesSelected}
              selectedPos={markerPosition}
              districtId={selectedDistrictId}
              districtCenter={currentDistrict.center}
              districtZoom={currentDistrict.zoom}
            />

            {markerPosition && (
              <Marker
                position={markerPosition}
                icon={createPickerIcon(isSelectionOutOfDistrict)}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    handleCoordinatesSelected(pos.lat, pos.lng);
                  },
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {/* 5. Selected Confirmation Banner & 3 Distinct Verification Statuses */}
      {hasValidCoordinates ? (
        <div className="space-y-2.5">
          {/* Main Location Header */}
          <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs ${
            isSelectionOutOfDistrict
              ? 'bg-[#221B14] border-[#F5A23A]/40 text-[#F4F0EB]'
              : 'bg-[#191715] border-[#38302A] text-[#F4F0EB]'
          }`}>
            <div className="flex items-start gap-2.5 min-w-0">
              <MapPin className={`h-4 w-4 shrink-0 mt-0.5 ${isSelectionOutOfDistrict ? 'text-[#F5A23A]' : 'text-[#F5A23A]'}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[#F4F0EB]">
                    Selected Incident Location:
                  </span>
                  {isSelectionOutOfDistrict && (
                    <span className="px-1.5 py-0.2 rounded bg-[#F5A23A]/20 text-[#F5A23A] text-[10px] font-mono font-bold border border-[#F5A23A]/40">
                      Outside {currentDistrict.name} Sector
                    </span>
                  )}
                  {!isSelectionOutOfDistrict && addressStatus === 'inferred' && (
                    <span className="px-1.5 py-0.2 rounded bg-[#F5A23A]/20 text-[#F5A23A] text-[10px] font-mono font-bold border border-[#F5A23A]/40">
                      Approximate / Inferred Address
                    </span>
                  )}
                  {!isSelectionOutOfDistrict && addressStatus === 'verified' && (
                    <span className="px-1.5 py-0.2 rounded bg-[#16B58A]/20 text-[#16B58A] text-[10px] font-mono font-bold border border-[#16B58A]/40">
                      Verified Address
                    </span>
                  )}
                  {addressStatus === 'unverified' && (
                    <span className="px-1.5 py-0.2 rounded bg-[#27211B] text-[#AAA29A] text-[10px] font-mono font-bold border border-[#38302A]">
                      Coordinates Pinpointed
                    </span>
                  )}
                </div>
                <span className="text-[#AAA29A] font-medium block truncate mt-0.5 text-xs">
                  {value.address || `Point at ${value.lat!.toFixed(4)}° N, ${value.lng!.toFixed(4)}° E`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <span className={`font-mono text-[10px] font-bold px-2 py-1 rounded border ${
                isSelectionOutOfDistrict
                  ? 'bg-[#27211B] text-[#F5A23A] border-[#F5A23A]/40'
                  : 'bg-[#12110F] text-[#F4F0EB] border-[#38302A]'
              }`}>
                {value.lat!.toFixed(4)}° N, {value.lng!.toFixed(4)}° E
              </span>
            </div>
          </div>

        </div>
      ) : (
        <div className="p-3 rounded-lg bg-[#12110F] border border-[#38302A] text-[#AAA29A] text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#F5A23A] shrink-0" />
          <span>
            Search any address, pick a preset landmark, or click directly anywhere on the map to pinpoint coordinates.
          </span>
        </div>
      )}
    </div>
  );
}
