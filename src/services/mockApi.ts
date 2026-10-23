import { Incident, Alert, Resource, Volunteer, Notification, ReliefPoint, IncidentTimelineEvent, AITriageAssessment, CandidateRoster } from '../types';
import { generateId } from '../lib/utils';
import { usgsService } from './usgsService';
import { firmsService } from './firmsService';
import { gdacsService } from './gdacsService';

export interface PalgharLocationOption {
  name: string;
  taluka: string;
  lat: number;
  lng: number;
  description: string;
}

export const PALGHAR_GEOGRAPHIC_LOCATIONS: PalgharLocationOption[] = [
  {
    name: 'Virar',
    taluka: 'Vasai',
    lat: 19.4674,
    lng: 72.8080,
    description: 'Virar (West/East), Palghar District, Maharashtra'
  },
  {
    name: 'Virar Railway Station',
    taluka: 'Vasai',
    lat: 19.4539,
    lng: 72.8115,
    description: 'Station Road, Virar, Palghar District, Maharashtra'
  },
  {
    name: 'Vasai',
    taluka: 'Vasai',
    lat: 19.3644,
    lng: 72.8105,
    description: 'Vasai (West), Palghar District, Maharashtra'
  },
  {
    name: 'Vasai Road Station',
    taluka: 'Vasai',
    lat: 19.3822,
    lng: 72.8315,
    description: 'Vasai Road Station Area, Palghar District, Maharashtra'
  },
  {
    name: 'Nalasopara',
    taluka: 'Vasai',
    lat: 19.4174,
    lng: 72.7933,
    description: 'Nalasopara, Palghar District, Maharashtra'
  },
  {
    name: 'Palghar HQ',
    taluka: 'Palghar',
    lat: 19.6967,
    lng: 72.7699,
    description: 'District Collectorate & HQ, Palghar Town, Maharashtra'
  },
  {
    name: 'Palghar Railway Station',
    taluka: 'Palghar',
    lat: 19.6936,
    lng: 72.7656,
    description: 'Station Road, Palghar, Maharashtra'
  },
  {
    name: 'Manor',
    taluka: 'Palghar',
    lat: 19.7420,
    lng: 72.9080,
    description: 'Surya River Basin, Manor, Palghar District, Maharashtra'
  },
  {
    name: 'Boisar',
    taluka: 'Palghar',
    lat: 19.8016,
    lng: 72.7538,
    description: 'Tarapur MIDC & Station, Boisar, Palghar District, Maharashtra'
  },
  {
    name: 'Dahanu',
    taluka: 'Dahanu',
    lat: 19.9715,
    lng: 72.7303,
    description: 'Coastal Road & Town, Dahanu, Palghar District, Maharashtra'
  },
  {
    name: 'Bordi',
    taluka: 'Dahanu',
    lat: 20.1060,
    lng: 72.7330,
    description: 'Bordi Coastal Beach, Dahanu, Palghar District, Maharashtra'
  },
  {
    name: 'Wada',
    taluka: 'Wada',
    lat: 19.6548,
    lng: 73.1384,
    description: 'Wada Town & MIDC, Palghar District, Maharashtra'
  },
  {
    name: 'Jawhar',
    taluka: 'Jawhar',
    lat: 19.9215,
    lng: 73.2310,
    description: 'Jawhar Ghat & Town, Palghar District, Maharashtra'
  },
  {
    name: 'Vikramgad',
    taluka: 'Vikramgad',
    lat: 19.7997,
    lng: 73.0955,
    description: 'Vikramgad, Palghar District, Maharashtra'
  },
  {
    name: 'Mokhada',
    taluka: 'Mokhada',
    lat: 19.9360,
    lng: 73.3400,
    description: 'Mokhada Tribal Block, Palghar District, Maharashtra'
  },
  {
    name: 'Safale',
    taluka: 'Palghar',
    lat: 19.5770,
    lng: 72.8180,
    description: 'Safale, Palghar District, Maharashtra'
  },
  {
    name: 'Kelwa (Kelve)',
    taluka: 'Palghar',
    lat: 19.6200,
    lng: 72.7300,
    description: 'Kelwa Beach & Fort, Palghar District, Maharashtra'
  },
  {
    name: 'Satpati',
    taluka: 'Palghar',
    lat: 19.7280,
    lng: 72.7050,
    description: 'Satpati Fishing Port, Palghar District, Maharashtra'
  },
  {
    name: 'Talasari',
    taluka: 'Talasari',
    lat: 20.1250,
    lng: 72.9230,
    description: 'Talasari, Palghar District, Maharashtra'
  },
  {
    name: 'Kasa Khurd',
    taluka: 'Dahanu',
    lat: 19.9500,
    lng: 72.9500,
    description: 'Kasa / Charoti Junction, Palghar District, Maharashtra'
  }
];

export function searchPalgharLocations(query: string): PalgharLocationOption[] {
  if (!query || !query.trim()) return PALGHAR_GEOGRAPHIC_LOCATIONS.slice(0, 8);
  const q = query.toLowerCase().trim();
  return PALGHAR_GEOGRAPHIC_LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(q) ||
    loc.taluka.toLowerCase().includes(q) ||
    loc.description.toLowerCase().includes(q)
  );
}

export function resolvePalgharLocation(query: string): { lat: number; lng: number; address: string } | null {
  if (!query || !query.trim()) return null;
  const q = query.toLowerCase().trim();

  // 1. Direct match on name or description
  const directMatch = PALGHAR_GEOGRAPHIC_LOCATIONS.find(loc => 
    loc.name.toLowerCase() === q ||
    q.includes(loc.name.toLowerCase()) ||
    loc.description.toLowerCase().includes(q)
  );

  if (directMatch) {
    return {
      lat: directMatch.lat,
      lng: directMatch.lng,
      address: directMatch.description
    };
  }

  // 2. Partial match on words
  const partial = PALGHAR_GEOGRAPHIC_LOCATIONS.find(loc => 
    q.split(/\s+/).some(word => word.length > 2 && loc.name.toLowerCase().includes(word))
  );

  if (partial) {
    return {
      lat: partial.lat,
      lng: partial.lng,
      address: `${query.trim()}, ${partial.taluka} Taluka, Palghar District, Maharashtra`
    };
  }

  return null;
}

export function reverseGeocodePalghar(lat: number, lng: number): string {
  let closest: PalgharLocationOption = PALGHAR_GEOGRAPHIC_LOCATIONS[0];
  let minDistance = Number.MAX_VALUE;

  for (const loc of PALGHAR_GEOGRAPHIC_LOCATIONS) {
    const d = Math.hypot(loc.lat - lat, loc.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = loc;
    }
  }

  const distKm = minDistance * 111;
  if (distKm < 0.6) {
    return closest.description;
  }
  return `Near ${closest.name} (${distKm.toFixed(1)} km), ${closest.taluka} Taluka, Palghar District`;
}

// Initial Mock State
const INCIDENTS_KEY = 'vajragrid_incidents';
const LEGACY_INCIDENTS_KEY = 'resqai_incidents';
const ALERTS_KEY = 'vajragrid_alerts';
const LEGACY_ALERTS_KEY = 'resqai_alerts';
let initialIncidents: Incident[] = [
  {
    id: 'inc_ocpc013b1',
    title: 'Coastal High-Tide Surge & Inundation',
    description: 'Rapid tidal seawater ingress affecting residential shoreline clusters and coastal highway. Immediate tactical evacuation and flood rescue units required.',
    location: { lat: 19.6967, lng: 72.7699, address: 'Coastal Sector, Palghar District, Maharashtra' },
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    reporterId: 'auth_1',
    reporterRole: 'authority',
    source: 'Authority Created',
    type: 'Flood',
    urgency: 'Critical',
    assignedTeam: 'Rahul Patil',
    assignedVolunteerId: 'vol_5',
    status: 'assigned',
    mediaUrls: [],
    aiAnalysis: {
      severity: 'critical',
      confidenceScore: 0.96,
      tags: ['flood', 'high tide', 'coastal ingress', 'urgent evacuation'],
      isDuplicate: false,
      recommendedAction: 'Dispatch certified water rescue responders and deploy high-volume dewatering pumps.'
    },
    timeline: [
      {
        id: 'tl_ocpc013b1_0',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'pending',
        actor: 'Palghar EOC Dispatch',
        note: 'High-tide alert reported from coastal observation outpost.'
      },
      {
        id: 'tl_ocpc013b1_1',
        timestamp: new Date(Date.now() - 2700000).toISOString(),
        status: 'verified',
        actor: 'District Disaster Management Authority',
        note: 'Field verification confirmed severe seawater ingress. Incident marked verified for mobilization.'
      },
      {
        id: 'tl_ocpc013b1_2',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        status: 'assigned',
        actor: 'Palghar Command EOC',
        note: 'Field responder "Rahul Patil" (ID: vol_5) assigned to incident.'
      }
    ]
  },
  {
    id: 'inc_100',
    title: 'Virar',
    description: 'Monsoon flooding causing 2 feet standing water near Virar approach. Vehicular traffic diverted.',
    location: { lat: 19.4674, lng: 72.8080, address: 'Station Road, Virar West, Palghar District' },
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    reporterId: 'auth_1',
    reporterRole: 'authority',
    source: 'Authority Created',
    type: 'Flood',
    urgency: 'Medium',
    assignedTeam: '2 units',
    status: 'pending',
    mediaUrls: [],
    aiAnalysis: {
      severity: 'medium',
      confidenceScore: 0.95,
      tags: ['flood', 'virar', 'traffic diversion'],
      isDuplicate: false,
      recommendedAction: 'Deploy high-volume dewatering pumps.',
    }
  },
  {
    id: 'inc_101',
    title: 'Surya River Flash Flooding',
    description: 'Surya River overflowing after heavy rainfall. Waterlogging Manor-Palghar highway, low-lying settlements impacted.',
    location: { lat: 19.7420, lng: 72.9080, address: 'Surya River Bank, Manor, Palghar' },
    timestamp: new Date(Date.now() - 75600000).toISOString(), // ~21h
    reporterId: 'cit_1',
    reporterRole: 'citizen',
    source: 'Citizen Report',
    type: 'Flood',
    urgency: 'Critical',
    assignedTeam: 'NDRF Palghar Unit A',
    status: 'in_progress',
    mediaUrls: [],
    aiAnalysis: {
      severity: 'critical',
      confidenceScore: 0.96,
      tags: ['flood', 'river overflow', 'urgent evacuation'],
      isDuplicate: false,
      recommendedAction: 'Dispatch water rescue teams and inflatable boats immediately.',
    }
  },
  {
    id: 'inc_102',
    title: 'Fallen Banyan Tree on Power Lines',
    description: 'Large banyan tree fell across coastal highway with snapped 33kV electricity lines.',
    location: { lat: 19.9720, lng: 72.7320, address: 'Coastal Highway, Dahanu West' },
    timestamp: new Date(Date.now() - 79200000).toISOString(), // ~22h
    reporterId: 'auth_1',
    reporterRole: 'authority',
    source: 'Authority Created',
    type: 'Tree Fall',
    urgency: 'High',
    assignedTeam: 'MSEDCL & Fire Crew',
    status: 'verified',
    mediaUrls: [],
    aiAnalysis: {
      severity: 'high',
      confidenceScore: 0.88,
      tags: ['power outage', 'road blockage', 'high hazard'],
      isDuplicate: false,
      recommendedAction: 'De-energize grid section and dispatch clearing machinery.',
    }
  },
  {
    id: 'inc_103',
    title: 'Medical Emergency Transport - Jawhar',
    description: 'Landslide debris blocking ghat bypass. Patient requires emergency dialysis transport to Palghar Civil Hospital.',
    location: { lat: 19.9215, lng: 73.2310, address: 'Ghat Bypass Rd, Jawhar' },
    timestamp: new Date(Date.now() - 86400000).toISOString(), // ~1d
    reporterId: 'vol_2',
    reporterRole: 'volunteer',
    source: 'External Alert',
    type: 'Medical',
    urgency: 'Critical',
    assignedTeam: 'Ambulance Unit 108',
    status: 'in_progress',
    mediaUrls: [],
    aiAnalysis: {
      severity: 'critical',
      confidenceScore: 0.92,
      tags: ['medical', 'transport', 'landslide barrier'],
      isDuplicate: false,
      recommendedAction: 'Dispatch 4x4 ambulance via alternate forest route.',
    }
  },
  {
    id: 'inc_104',
    title: 'Drinking Water & Ration Shortage',
    description: 'Local supply contaminated post storm. 80 displaced residents at community center need potable water.',
    location: { lat: 19.6550, lng: 73.1370, address: 'Wada Community Center, Wada' },
    timestamp: new Date(Date.now() - 86400000).toISOString(), // ~1d
    reporterId: 'citizen_3',
    reporterRole: 'citizen',
    source: 'Citizen Report',
    type: 'Supplies',
    urgency: 'Medium',
    assignedTeam: 'Palghar Relief Corps',
    status: 'resolved',
    mediaUrls: [],
    aiAnalysis: {
      severity: 'medium',
      confidenceScore: 0.85,
      tags: ['potable water', 'food rations'],
      isDuplicate: false,
      recommendedAction: 'Dispatch water tanker and ration packages.',
    },
    reliefDetails: {
      peopleAssisted: 80,
      resourcesUsed: 2,
      reliefDistributed: '80 food packets, 5000 liters potable water',
      shelterStatus: '80 residents sheltered at Wada Community Center; stable',
      responseDuration: '2.5 hours',
      resolutionNotes: 'Water pipeline repaired by Municipal Council engineering squad. Potable water restoration confirmed; incident resolved.'
    },
    timeline: [
      {
        id: 'tl_104_1',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'pending',
        actor: 'Citizen Reporter',
        note: 'Drinking water shortage reported at Wada Community Center.'
      },
      {
        id: 'tl_104_2',
        timestamp: new Date(Date.now() - 82800000).toISOString(),
        status: 'verified',
        actor: 'Wada Taluka EOC',
        note: 'Wada EOC verified contamination and approved emergency relief dispatch.'
      },
      {
        id: 'tl_104_3',
        timestamp: new Date(Date.now() - 79200000).toISOString(),
        status: 'assigned',
        actor: 'Palghar Relief Corps',
        note: 'Palghar Relief Corps dispatched with 2 water tankers and ration kits.'
      },
      {
        id: 'tl_104_4',
        timestamp: new Date(Date.now() - 72000000).toISOString(),
        status: 'completed',
        actor: 'Palghar Relief Corps',
        note: 'Water tankers deployed and 80 displaced residents provided rations.'
      },
      {
        id: 'tl_104_5',
        timestamp: new Date(Date.now() - 64800000).toISOString(),
        status: 'resolved',
        actor: 'District Collectorate EOC',
        note: 'Municipal pipeline flushed and tested. Officially resolved and closed by District EOC.'
      }
    ]
  },
  {
    id: 'inc_105',
    title: 'Urban Waterlogging at Boisar Underpass',
    description: 'Stormwater accumulation of 2.5 feet under railway bridge. Heavy transit slowdown between Boisar Station and MIDC.',
    location: { lat: 19.8016, lng: 72.7538, address: 'Station Road Underpass, Boisar' },
    timestamp: new Date(Date.now() - 72000000).toISOString(), // ~20h
    reporterId: 'auth_2',
    reporterRole: 'authority',
    source: 'Authority Created',
    type: 'Flood',
    urgency: 'Low',
    assignedTeam: '1 units',
    status: 'pending',
    mediaUrls: [],
    aiAnalysis: {
      severity: 'low',
      confidenceScore: 0.89,
      tags: ['waterlogging', 'underpass', 'traffic delay'],
      isDuplicate: false,
      recommendedAction: 'Deploy trailer-mounted suction pump and signpost detour.',
    }
  },
  {
    id: 'inc_107',
    title: 'Coastal High Tide Warning & Sea Wall Erosion',
    description: 'Rough sea conditions along Kelwa-Danda beach sector. Fishing vessels instructed to dock.',
    location: { lat: 19.6200, lng: 72.7300, address: 'Kelwa Beach Approach, Palghar' },
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    reporterId: 'auth_3',
    reporterRole: 'authority',
    source: 'Authority Created',
    type: 'Flood',
    urgency: 'High',
    assignedTeam: 'Coastal Guard & Police',
    status: 'verified',
    mediaUrls: [],
    aiAnalysis: {
      severity: 'high',
      confidenceScore: 0.94,
      tags: ['high tide', 'coastal alert'],
      isDuplicate: false,
      recommendedAction: 'Restricted coastal access patrol.',
    }
  }
];

let incidents: Incident[] = [];

const getPersistedIncidents = (): Incident[] => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return incidents.length > 0 ? incidents : [...initialIncidents];
  }
  const saved = localStorage.getItem(INCIDENTS_KEY) || localStorage.getItem(LEGACY_INCIDENTS_KEY);
  if (saved) {
    try {
      let parsed: Incident[] = JSON.parse(saved);
      let needsResave = false;

      // Correct existing demo records whose names and coordinates contradict each other
      parsed = parsed.map(inc => {
        const titleLower = (inc.title || '').toLowerCase();
        const addrLower = (inc.location?.address || '').toLowerCase();
        
        // Only correct existing demo record 'inc_100' if its coordinates were corrupted
        if (inc.id === 'inc_100' && (titleLower.includes('virar') || addrLower.includes('virar'))) {
          if (
            !inc.location ||
            Math.abs(inc.location.lat - 19.4674) > 0.05 ||
            Math.abs(inc.location.lng - 72.8080) > 0.05
          ) {
            needsResave = true;
            return {
              ...inc,
              location: {
                lat: 19.4674,
                lng: 72.8080,
                address: inc.location?.address || 'Station Road, Virar West, Palghar District'
              }
            };
          }
        }
        // Ensure incident has a timeline
        if (!inc.timeline || inc.timeline.length === 0) {
          const baseTime = new Date(inc.timestamp || Date.now()).getTime();
          const autoTimeline: IncidentTimelineEvent[] = [
            {
              id: `tl_init_${inc.id}`,
              timestamp: new Date(baseTime).toISOString(),
              status: 'pending',
              actor: inc.reporterRole === 'citizen' ? 'Citizen Reporter' : 'Palghar EOC Dispatch',
              note: inc.reporterRole === 'citizen' ? 'Citizen submitted emergency report.' : 'Operational incident recorded by EOC.'
            }
          ];
          if (['verified', 'assigned', 'on_the_way', 'reached', 'in_progress', 'rescue_in_progress', 'completed', 'relief', 'resolved'].includes(inc.status)) {
            autoTimeline.push({
              id: `tl_ver_${inc.id}`,
              timestamp: new Date(baseTime + 10 * 60000).toISOString(),
              status: 'verified',
              actor: 'Palghar District EOC',
              note: 'Incident verified by emergency dispatch authority.'
            });
          }
          if (['assigned', 'on_the_way', 'reached', 'rescue_in_progress', 'completed', 'relief', 'resolved'].includes(inc.status)) {
            autoTimeline.push({
              id: `tl_asg_${inc.id}`,
              timestamp: new Date(baseTime + 20 * 60000).toISOString(),
              status: 'assigned',
              actor: 'Palghar Command EOC',
              note: `Field unit "${inc.assignedTeam || 'Tactical Team'}" deployed.`
            });
          }
          if (['completed', 'relief', 'resolved'].includes(inc.status)) {
            autoTimeline.push({
              id: `tl_cmp_${inc.id}`,
              timestamp: new Date(baseTime + 90 * 60000).toISOString(),
              status: 'completed',
              actor: inc.assignedTeam || 'Field Responder',
              note: 'Rescue and field stabilization mission completed.'
            });
          }
          if (inc.status === 'resolved') {
            autoTimeline.push({
              id: `tl_res_${inc.id}`,
              timestamp: new Date(baseTime + 150 * 60000).toISOString(),
              status: 'resolved',
              actor: 'District Collectorate EOC',
              note: inc.reliefDetails?.resolutionNotes || 'Incident officially closed with post-disaster recovery verified.'
            });
          }
          needsResave = true;
          return {
            ...inc,
            timeline: autoTimeline
          };
        }
        return inc;
      });

      // Ensure target test incident inc_ocpc013b1 is present in initial incidents if missing
      const hasOcpc = parsed.some(
        i => i.id === 'inc_ocpc013b1' || i.id === 'INC-OCPC013B1' || i.id.toLowerCase().includes('ocpc013b1')
      );
      if (!hasOcpc) {
        const ocpcSeed = initialIncidents.find(i => i.id === 'inc_ocpc013b1');
        if (ocpcSeed) {
          parsed = [ocpcSeed, ...parsed];
          needsResave = true;
        }
      } else {
        // Backfill assignedVolunteerId ONLY if the incident already claims Rahul Patil
        // AND Rahul is not currently assigned or deployed to another active incident
        const savedVols = typeof localStorage !== 'undefined' ? (localStorage.getItem('vajragrid_volunteers') || localStorage.getItem('resqai_volunteers')) : null;
        let rahulAssignedElsewhere = false;
        if (savedVols) {
          try {
            const vList = JSON.parse(savedVols);
            const r = Array.isArray(vList) ? vList.find((v: any) => v.id === 'vol_5') : null;
            if (r && r.currentAssignmentId && !r.currentAssignmentId.toLowerCase().includes('ocpc013b1')) {
              rahulAssignedElsewhere = true;
            }
          } catch {
            // ignore
          }
        }
        parsed = parsed.map(inc => {
          const isOcpc = inc.id === 'inc_ocpc013b1' || inc.id === 'INC-OCPC013B1' || inc.id.toLowerCase().includes('ocpc013b1');
          if (isOcpc && !inc.assignedVolunteerId && inc.assignedTeam && inc.assignedTeam.toLowerCase().includes('rahul') && !rahulAssignedElsewhere) {
            needsResave = true;
            return {
              ...inc,
              assignedVolunteerId: 'vol_5'
            };
          }
          return inc;
        });
      }

      // Validate coordinates: filter out any invalid or corrupt records safely without wiping valid records
      const validParsed = parsed.filter(
        i => i.location && typeof i.location.lat === 'number' && typeof i.location.lng === 'number' && !isNaN(i.location.lat) && !isNaN(i.location.lng) && i.location.lat >= -90 && i.location.lat <= 90 && i.location.lng >= -180 && i.location.lng <= 180
      );

      if (validParsed.length > 0) {
        if (needsResave || validParsed.length !== parsed.length) {
          localStorage.setItem(INCIDENTS_KEY, JSON.stringify(validParsed));
        }
        return validParsed;
      }
    } catch {
      // Fall through to initial
    }
  }
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(initialIncidents));
  return initialIncidents;
};

const saveIncidents = (data: Incident[]) => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(data));
  }
};

incidents = getPersistedIncidents();

const initialAlerts: Alert[] = [
  {
    id: 'alt_1',
    type: 'weather',
    title: 'Coastal High Tide & Cyclone Surge Alert',
    description: 'Heavy precipitation and 4.2m Arabian Sea high tide expected over Palghar coast. Avoid shorelines.',
    severity: 'critical',
    affectedArea: { name: 'Dahanu & Palghar Coastline', radiusKm: 14, lat: 19.7800, lng: 72.8200 },
    issuedAt: new Date(Date.now() - 1800000).toISOString(),
    active: true
  },
  {
    id: 'alt_2',
    type: 'infrastructure',
    title: 'Surya River Basin & Ghat Flood Warning',
    description: 'Surya dam overflow discharge and ghat runoff. Flash flood vulnerability.',
    severity: 'high',
    affectedArea: { name: 'Jawhar & Mokhada Mountain Sector', radiusKm: 15, lat: 19.8800, lng: 73.1800 },
    issuedAt: new Date(Date.now() - 3600000).toISOString(),
    active: true
  }
];

let alerts: Alert[] = [];

const getPersistedAlerts = (): Alert[] => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return alerts.length > 0 ? alerts : [...initialAlerts];
  }
  const saved = localStorage.getItem(ALERTS_KEY) || localStorage.getItem(LEGACY_ALERTS_KEY);
  if (saved) {
    try {
      const parsed: Alert[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  localStorage.setItem(ALERTS_KEY, JSON.stringify(initialAlerts));
  return initialAlerts;
};

const saveAlerts = (data: Alert[]) => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(data));
  }
};

alerts = getPersistedAlerts();

let reliefPoints: ReliefPoint[] = [
  {
    id: 'rel_1',
    name: 'Palghar Municipal Community Relief Shelter',
    type: 'Shelter',
    location: {
      lat: 19.6975,
      lng: 72.7660,
      address: 'Near District Collectorate Ground, Palghar Town',
      district: 'Palghar',
      state: 'Maharashtra',
      country: 'India',
      verificationStatus: 'verified'
    },
    capacity: 250,
    currentOccupancy: 85,
    contact: '02525-252101',
    status: 'Open',
    description: 'Clean drinking water, emergency medical station, dry rations, and charging facilities.'
  },
  {
    id: 'rel_2',
    name: 'Wada Community Emergency Distribution Hub',
    type: 'Food & Water Point',
    location: {
      lat: 19.6548,
      lng: 73.1384,
      address: 'Wada Tehsil Ground, Wada',
      district: 'Palghar',
      state: 'Maharashtra',
      country: 'India',
      verificationStatus: 'verified'
    },
    capacity: 150,
    currentOccupancy: 40,
    contact: '02526-271222',
    status: 'Open',
    description: 'Drinking water tankers, packed food supply distribution, and basic first aid.'
  },
  {
    id: 'rel_3',
    name: 'Dahanu Coastal Cyclone Evacuation Center',
    type: 'Evacuation Center',
    location: {
      lat: 19.9720,
      lng: 72.7320,
      address: 'Coastal High School Compound, Dahanu West',
      district: 'Palghar',
      state: 'Maharashtra',
      country: 'India',
      verificationStatus: 'verified'
    },
    capacity: 300,
    currentOccupancy: 60,
    contact: '02528-222110',
    status: 'Open',
    description: 'High-elevation storm shelter with emergency power generation and medical personnel on site.'
  },
  {
    id: 'rel_4',
    name: 'Manor Primary Health Center & Relief Camp',
    type: 'Medical Camp',
    location: {
      lat: 19.7435,
      lng: 72.9090,
      address: 'Manor-Palghar Highway, Manor',
      district: 'Palghar',
      state: 'Maharashtra',
      country: 'India',
      verificationStatus: 'verified'
    },
    capacity: 100,
    currentOccupancy: 25,
    contact: '02525-247012',
    status: 'Open',
    description: 'Emergency trauma and first aid post, water purification tablets, and ORS packets.'
  }
];

const RESOURCES_KEY = 'vajragrid_resources';
const LEGACY_RESOURCES_KEY = 'resqai_resources';

const initialResources: Resource[] = [
  { id: 'res_1', name: 'Palghar Civil Hospital Ambulance A1', type: 'Ambulance', quantity: 1, location: { lat: 19.6970, lng: 72.7680, address: 'Civil Hospital, Palghar' }, status: 'Available' },
  { id: 'res_2', name: 'Coastal Rescue Boat Alpha', type: 'Rescue Boat', quantity: 2, location: { lat: 19.9750, lng: 72.7290, address: 'Dahanu Jetty Base' }, status: 'Allocated', currentIncidentId: 'inc_101' },
  { id: 'res_3', name: 'Trauma Kit & First Aid Cache', type: 'Medical Kit', quantity: 50, location: { lat: 19.6950, lng: 72.7720, address: 'District Collectorate, Palghar' }, status: 'Available' },
  { id: 'res_4', name: 'Heavy Excavator (JCB 3DX)', type: 'Vehicle', quantity: 1, location: { lat: 19.7400, lng: 72.9050, address: 'PWD Depot, Manor' }, status: 'Available' },
  { id: 'res_5', name: 'High-Capacity Dewatering Pump', type: 'Rescue Equipment', quantity: 2, location: { lat: 19.8030, lng: 72.7560, address: 'Boisar MIDC Fire Station' }, status: 'In Use', currentIncidentId: 'inc_101' },
];

let resources: Resource[] = [];

const syncResourcesWithIncidents = (
  rList: Resource[],
  incList: Incident[]
): { resources: Resource[]; changed: boolean } => {
  let changed = false;
  const activeIncidents = incList.filter(i => i.status !== 'resolved' && i.status !== 'dismissed');
  const activeIds = new Set(activeIncidents.map(i => i.id));
  const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();
  const activeNormIds = new Set(activeIncidents.map(i => normalizeId(i.id)));

  const updated = rList.map(res => {
    if (res.currentIncidentId) {
      const isActive = activeIds.has(res.currentIncidentId) || activeNormIds.has(normalizeId(res.currentIncidentId));
      if (!isActive) {
        changed = true;
        return {
          ...res,
          status: 'Available' as const,
          currentIncidentId: undefined
        };
      }
    } else if (res.status !== 'Available') {
      changed = true;
      return {
        ...res,
        status: 'Available' as const,
        currentIncidentId: undefined
      };
    }
    return res;
  });

  return { resources: updated, changed };
};

const getPersistedResources = (): Resource[] => {
  let loadedResources: Resource[];
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    loadedResources = resources.length > 0 ? resources : [...initialResources];
  } else {
    const saved = localStorage.getItem(RESOURCES_KEY) || localStorage.getItem(LEGACY_RESOURCES_KEY);
    if (saved) {
      try {
        const parsed: Resource[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const missing = initialResources.filter(ir => !parsed.some(pr => pr.id === ir.id));
          loadedResources = missing.length > 0 ? [...parsed, ...missing] : parsed;
        } else {
          loadedResources = [...initialResources];
        }
      } catch {
        loadedResources = [...initialResources];
      }
    } else {
      loadedResources = [...initialResources];
    }
  }

  // Cross-synchronize with current incidents
  const currentIncidents = getPersistedIncidents();
  const syncResult = syncResourcesWithIncidents(loadedResources, currentIncidents);
  if (syncResult.changed) {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(RESOURCES_KEY, JSON.stringify(syncResult.resources));
    }
    resources = syncResult.resources;
  } else {
    resources = loadedResources;
  }
  return resources;
};

const saveResources = (data: Resource[]) => {
  resources = data;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(RESOURCES_KEY, JSON.stringify(data));
  }
};

resources = getPersistedResources();

const initialVolunteers: Volunteer[] = [
  { id: 'vol_1', name: 'Sarah Jenkins', skills: ['First Aid', 'Search & Rescue'], status: 'available', location: { lat: 19.6990, lng: 72.7660, address: 'Palghar West' } },
  { id: 'vol_2', name: 'Marcus Chen', skills: ['Logistics', 'Driving'], status: 'available', location: { lat: 19.7410, lng: 72.9090, address: 'Manor' } },
  { id: 'vol_3', name: 'Dr. Anita Desai', skills: ['Medical', 'Triage'], status: 'available', location: { lat: 19.6940, lng: 72.7710, address: 'Palghar Civil Hospital' } },
  { id: 'vol_4', name: 'James Wilson', skills: ['Heavy Machinery'], status: 'offline', location: { lat: 19.6580, lng: 73.1350, address: 'Wada' } },
  { id: 'vol_5', name: 'Rahul Patil', skills: ['Search & Rescue', 'Water Rescue'], status: 'assigned', currentAssignmentId: 'inc_ocpc013b1', location: { lat: 19.9680, lng: 72.7350, address: 'Dahanu' } },
  { id: 'vol_6', name: 'Amit Shah', skills: ['Medical', 'Paramedic'], status: 'available', location: { lat: 19.8020, lng: 72.7510, address: 'Boisar' } },
  { id: 'vol_7', name: 'Neha Joshi', skills: ['Rescue', 'Community Shelter'], status: 'available', location: { lat: 19.9200, lng: 73.2280, address: 'Jawhar' } },
];

const VOLUNTEERS_KEY = 'vajragrid_volunteers';
const LEGACY_VOLUNTEERS_KEY = 'resqai_volunteers';

const syncVolunteersWithIncidents = (
  vList: Volunteer[], 
  incList: Incident[]
): { volunteers: Volunteer[]; incidents: Incident[]; changed: boolean } => {
  let changedVolunteers = false;
  let changedIncidents = false;

  const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();

  // Active operational incidents (exclude resolved and dismissed)
  const activeIncidents = incList.filter(i => i.status !== 'resolved' && i.status !== 'dismissed');

  // Track verified single assignment for each volunteer across active incidents: Map<volunteerId, Incident>
  const volunteerAssignments = new Map<string, Incident>();

  let updatedIncidents = [...incList];

  // Pass 0: Reconcile active incidents claiming non-existent volunteer IDs
  updatedIncidents = updatedIncidents.map(inc => {
    if (inc.assignedVolunteerId && !vList.some(v => v.id === inc.assignedVolunteerId)) {
      changedIncidents = true;
      const shouldRevert = inc.status === 'assigned';
      return {
        ...inc,
        assignedVolunteerId: undefined,
        assignedTeam: 'Unassigned',
        status: shouldRevert ? 'verified' : inc.status
      };
    }
    return inc;
  });

  // Helper to extract the latest timestamp of an event mentioning a volunteer
  const getLatestVolunteerEventTimestamp = (inc: Incident, vol: Volunteer): number => {
    if (!inc.timeline || inc.timeline.length === 0) return 0;
    const vNameLower = vol.name.toLowerCase();
    const vIdLower = vol.id.toLowerCase();
    let latest = 0;
    for (const tl of inc.timeline) {
      const match = (tl.id && (tl.id.toLowerCase().includes(vIdLower) || tl.id.toLowerCase().includes('_mob_') || tl.id.toLowerCase().includes('_asg_'))) ||
        (tl.note && (tl.note.toLowerCase().includes(vNameLower) || tl.note.toLowerCase().includes(vIdLower)));
      if (match) {
        const t = new Date(tl.timestamp).getTime();
        if (t > latest) latest = t;
      }
    }
    return latest;
  };

  // Helper to check if incident has genuine mobilization for a volunteer
  const hasVolunteerMobilization = (inc: Incident, vol: Volunteer): boolean => {
    if (!inc.timeline) return false;
    return inc.timeline.some(tl => {
      const isVerification = tl.status === 'verified' || (tl.note && /verification confirmed/i.test(tl.note));
      if (isVerification) return false;
      const hasMobId = tl.id && (tl.id.includes('_mob_') || tl.id.includes(`mob_${vol.id}`));
      const hasMobNote = tl.note && (/mobilized and dispatched/i.test(tl.note) || /tactical mobilization confirmed/i.test(tl.note));
      return Boolean(hasMobId || hasMobNote);
    });
  };

  // Pass 1: For each volunteer, find all active incidents claiming this volunteer
  for (const vol of vList) {
    const vNameLower = vol.name.toLowerCase().trim();
    const vIdLower = vol.id.toLowerCase().trim();

    // Find all active incidents claiming this volunteer
    const claimingIncidents = activeIncidents.filter(inc => {
      // 1. Direct ID match
      if (inc.assignedVolunteerId && inc.assignedVolunteerId === vol.id) {
        return true;
      }
      // 2. Legacy team name match
      if (inc.assignedTeam && inc.assignedTeam !== 'Unassigned') {
        const teamLower = inc.assignedTeam.toLowerCase().trim();
        if (teamLower === vNameLower || teamLower === vIdLower || teamLower.includes(vNameLower)) {
          return true;
        }
      }
      // 3. Current assignment ID pointer match IF incident is unassigned
      if (vol.currentAssignmentId) {
        const isTarget = inc.id === vol.currentAssignmentId || normalizeId(inc.id) === normalizeId(vol.currentAssignmentId);
        if (isTarget && (!inc.assignedVolunteerId || inc.assignedVolunteerId === vol.id) && (!inc.assignedTeam || inc.assignedTeam === 'Unassigned' || inc.assignedTeam.toLowerCase().includes(vNameLower))) {
          return true;
        }
      }
      return false;
    });

    if (claimingIncidents.length === 0) {
      // No active incident claims this volunteer
      continue;
    }

    let authoritativeInc: Incident;

    if (claimingIncidents.length === 1) {
      authoritativeInc = claimingIncidents[0];
    } else {
      // Multiple active incidents claim this volunteer! Enforce single-active-assignment invariant.
      // Sort to find authoritative incident:
      // 1. Matches vol.currentAssignmentId
      // 2. Latest volunteer-specific timeline event timestamp
      // 3. Has mobilization event
      // 4. Incident timestamp
      const sortedClaims = [...claimingIncidents].sort((a, b) => {
        const aMatchesAsg = vol.currentAssignmentId && (a.id === vol.currentAssignmentId || normalizeId(a.id) === normalizeId(vol.currentAssignmentId));
        const bMatchesAsg = vol.currentAssignmentId && (b.id === vol.currentAssignmentId || normalizeId(b.id) === normalizeId(vol.currentAssignmentId));
        if (aMatchesAsg && !bMatchesAsg) return -1;
        if (!aMatchesAsg && bMatchesAsg) return 1;

        const aLatest = getLatestVolunteerEventTimestamp(a, vol);
        const bLatest = getLatestVolunteerEventTimestamp(b, vol);
        if (aLatest !== bLatest) return bLatest - aLatest;

        const aMob = hasVolunteerMobilization(a, vol);
        const bMob = hasVolunteerMobilization(b, vol);
        if (aMob && !bMob) return -1;
        if (!aMob && bMob) return 1;

        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      authoritativeInc = sortedClaims[0];
      const losingClaims = sortedClaims.slice(1);

      // Release all losing claims
      for (const losingInc of losingClaims) {
        updatedIncidents = updatedIncidents.map(i => {
          if (i.id === losingInc.id) {
            changedIncidents = true;
            const authDisplay = authoritativeInc.id.replace(/^inc_/i, 'INC-').toUpperCase();
            const shouldRevertStatus = i.status === 'assigned';
            const newStatus = shouldRevertStatus ? 'verified' : i.status;
            
            // Check if reconciliation note already exists to keep idempotent
            const alreadyHasNote = i.timeline?.some(tl => tl.note && tl.note.includes('authoritative assignment') && tl.note.includes(vol.name));
            const newTimeline = alreadyHasNote ? (i.timeline || []) : [
              ...(i.timeline || []),
              {
                id: `tl_${Date.now()}_sync_rel_${vol.id}_${i.id}`,
                timestamp: new Date().toISOString(),
                status: newStatus,
                actor: 'System Integrity Monitor',
                note: `Conflicting secondary responder assignment reconciled. Unit "${vol.name}" authoritative assignment is ${authDisplay}. Released to enforce single-active-assignment invariant.`
              }
            ];

            return {
              ...i,
              assignedVolunteerId: undefined,
              assignedTeam: 'Unassigned',
              status: newStatus,
              timeline: newTimeline
            };
          }
          return i;
        });
      }
    }

    // Ensure authoritative incident has canonical assignment fields
    updatedIncidents = updatedIncidents.map(i => {
      if (i.id === authoritativeInc.id) {
        if (i.assignedVolunteerId !== vol.id || i.assignedTeam !== vol.name) {
          changedIncidents = true;
          return {
            ...i,
            assignedVolunteerId: vol.id,
            assignedTeam: vol.name
          };
        }
      }
      return i;
    });

    volunteerAssignments.set(vol.id, authoritativeInc);
  }

  // Pass 2: Reconcile all volunteers against verified active assignments
  const updatedVolunteers = vList.map(v => {
    // If responder is explicitly offline, preserve offline status and clear any dangling assignment
    if (v.status === 'offline') {
      if (v.currentAssignmentId !== undefined) {
        changedVolunteers = true;
        return {
          ...v,
          currentAssignmentId: undefined
        };
      }
      return v;
    }

    const assignedInc = volunteerAssignments.get(v.id);

    if (assignedInc) {
      // Traceable active incident exists
      const incId = assignedInc.id;

      // Determine deployment status:
      // Deployed IF explicitly mobilized (incident timeline records mobilization dispatch, or incident in active field execution, or already deployed to this assignment)
      const hasMobilizationTimeline = assignedInc.timeline?.some(tl => {
        const isVerification = tl.status === 'verified' || (tl.note && /verification confirmed/i.test(tl.note));
        if (isVerification) return false;
        return (
          Boolean(tl.id && tl.id.includes('_mob_')) ||
          Boolean(tl.note && /mobilized and dispatched/i.test(tl.note)) ||
          Boolean(tl.note && /tactical mobilization confirmed/i.test(tl.note))
        );
      });
      const isIncidentInAction = ['in_progress', 'on_the_way', 'reached', 'rescue_in_progress'].includes(assignedInc.status);
      const wasAlreadyDeployedToThis = v.status === 'deployed' && (v.currentAssignmentId === incId || normalizeId(v.currentAssignmentId || '') === normalizeId(incId));

      const targetStatus: 'assigned' | 'deployed' = (hasMobilizationTimeline || isIncidentInAction || wasAlreadyDeployedToThis) 
        ? 'deployed' 
        : 'assigned';

      if (v.status !== targetStatus || v.currentAssignmentId !== incId) {
        changedVolunteers = true;
        return {
          ...v,
          status: targetStatus,
          currentAssignmentId: incId
        };
      }
      return v;
    }

    // No traceable active incident association exists!
    // Eliminate orphaned status: Reconcile to 'available'
    if (v.status !== 'available' || v.currentAssignmentId !== undefined) {
      changedVolunteers = true;
      return {
        ...v,
        status: 'available' as const,
        currentAssignmentId: undefined
      };
    }

    return v;
  });

  return {
    volunteers: updatedVolunteers,
    incidents: updatedIncidents,
    changed: changedVolunteers || changedIncidents
  };
};

const getPersistedVolunteers = (): Volunteer[] => {
  let loadedVolunteers: Volunteer[];
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    loadedVolunteers = [...initialVolunteers];
  } else {
    const saved = localStorage.getItem(VOLUNTEERS_KEY) || localStorage.getItem(LEGACY_VOLUNTEERS_KEY);
    if (saved) {
      try {
        const parsed: Volunteer[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const missing = initialVolunteers.filter(iv => !parsed.some(pv => pv.id === iv.id));
          loadedVolunteers = missing.length > 0 ? [...parsed, ...missing] : parsed;
        } else {
          loadedVolunteers = [...initialVolunteers];
        }
      } catch {
        loadedVolunteers = [...initialVolunteers];
      }
    } else {
      loadedVolunteers = [...initialVolunteers];
    }
  }

  // Cross-synchronize with current incidents
  const currentIncidents = getPersistedIncidents();
  const syncResult = syncVolunteersWithIncidents(loadedVolunteers, currentIncidents);
  if (syncResult.changed) {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(VOLUNTEERS_KEY, JSON.stringify(syncResult.volunteers));
      localStorage.setItem(INCIDENTS_KEY, JSON.stringify(syncResult.incidents));
    }
    volunteers = syncResult.volunteers;
    incidents = syncResult.incidents;
  }
  return syncResult.volunteers;
};

const saveVolunteers = (data: Volunteer[]) => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(VOLUNTEERS_KEY, JSON.stringify(data));
  }
};

let volunteers: Volunteer[] = getPersistedVolunteers();

let analytics = [
  { date: 'Mon', incidents: 4, resolved: 3 },
  { date: 'Tue', incidents: 7, resolved: 5 },
  { date: 'Wed', incidents: 3, resolved: 6 },
  { date: 'Thu', incidents: 12, resolved: 8 },
  { date: 'Fri', incidents: 18, resolved: 10 },
  { date: 'Sat', incidents: 8, resolved: 15 },
  { date: 'Sun', incidents: 5, resolved: 7 },
];

let notifications: Notification[] = [
  { id: 'notif_1', type: 'warning', priority: 'high', message: 'Heavy rainfall warning issued for Palghar.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: 'notif_2', type: 'incident', priority: 'high', message: 'High-priority flood incident created.', timestamp: new Date(Date.now() - 3500000).toISOString(), read: false },
  { id: 'notif_3', type: 'verification', priority: 'medium', message: 'Incident INC-1035 requires verification.', timestamp: new Date(Date.now() - 1800000).toISOString(), read: false },
  { id: 'notif_4', type: 'volunteer', priority: 'low', message: 'Team Alpha accepted assignment INC-1035.', timestamp: new Date(Date.now() - 1500000).toISOString(), read: true },
  { id: 'notif_5', type: 'resource', priority: 'medium', message: 'Ambulance allocated to INC-1035.', timestamp: new Date(Date.now() - 1200000).toISOString(), read: true },
];

// Simulated Delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper functions for responder proximity and disaster skill matching
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function getIncidentSkillKeywords(incident?: Incident | null): string[] {
  if (!incident) return ['rescue', 'first aid', 'logistics', 'medical'];
  const typeLower = (incident.type || '').toLowerCase();
  const descLower = (incident.description || '').toLowerCase();
  const titleLower = (incident.title || '').toLowerCase();
  const tags = (incident.aiAnalysis?.tags || []).map(t => t.toLowerCase());

  const keywords = new Set<string>();

  if (typeLower.includes('flood') || descLower.includes('flood') || descLower.includes('water') || descLower.includes('tide') || descLower.includes('surge') || tags.includes('flood')) {
    ['water rescue', 'search & rescue', 'rescue', 'first aid', 'logistics'].forEach(k => keywords.add(k));
  }
  if (typeLower.includes('medical') || descLower.includes('medical') || descLower.includes('patient') || descLower.includes('casualty') || descLower.includes('hospital') || tags.includes('medical')) {
    ['medical', 'triage', 'paramedic', 'first aid'].forEach(k => keywords.add(k));
  }
  if (typeLower.includes('tree') || descLower.includes('tree') || descLower.includes('electric') || descLower.includes('line') || descLower.includes('power')) {
    ['heavy machinery', 'rescue', 'logistics', 'driving'].forEach(k => keywords.add(k));
  }
  if (typeLower.includes('landslide') || descLower.includes('landslide') || descLower.includes('debris') || descLower.includes('collapse') || tags.includes('landslide')) {
    ['search & rescue', 'rescue', 'heavy machinery', 'medical', 'first aid', 'triage'].forEach(k => keywords.add(k));
  }
  if (typeLower.includes('supplies') || descLower.includes('water') || descLower.includes('ration') || descLower.includes('shortage') || descLower.includes('food') || descLower.includes('shelter')) {
    ['community shelter', 'logistics', 'driving', 'first aid'].forEach(k => keywords.add(k));
  }
  if (typeLower.includes('fire') || descLower.includes('fire') || tags.includes('fire')) {
    ['search & rescue', 'first aid', 'medical', 'rescue'].forEach(k => keywords.add(k));
  }

  tags.forEach(t => keywords.add(t));

  if (keywords.size === 0) {
    ['rescue', 'first aid', 'search & rescue', 'logistics'].forEach(k => keywords.add(k));
  }

  return Array.from(keywords);
}

export const MockAPI = {
  // --- Notifications ---
  getNotifications: async () => {
    await delay(200);
    return [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
  markNotificationRead: async (id: string) => {
    await delay(100);
    notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    return { success: true };
  },

  markAllNotificationsRead: async () => {
    await delay(200);
    notifications = notifications.map(n => ({ ...n, read: true }));
    return { success: true };
  },

  addNotification: async (type: Notification['type'], priority: Notification['priority'], message: string) => {
    const newNotif: Notification = {
      id: 'notif_' + generateId(),
      type,
      priority,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    notifications = [newNotif, ...notifications];
    return newNotif;
  },

  // --- Incidents ---
  getIncidents: async () => {
    await delay(200);
    volunteers = getPersistedVolunteers(); // triggers cross-synchronization and conflict resolution
    incidents = getPersistedIncidents(); // re-read from local storage for cross-tab sync
    return [...incidents];
  },
  
  getIncidentById: async (id: string) => {
    await delay(300);
    volunteers = getPersistedVolunteers(); // triggers cross-synchronization and conflict resolution
    incidents = getPersistedIncidents();
    const cleanId = id.trim();
    const normalize = (s: string) => s.replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase();
    const targetNorm = normalize(cleanId);

    const local = incidents.find(i => 
      i.id === cleanId || 
      i.id.toLowerCase() === cleanId.toLowerCase() ||
      normalize(i.id) === targetNorm
    );
    if (local) return local;
    const usgsExternals = usgsService.getEarthquakeIncidents();
    const usgsMatch = usgsExternals.find(i => i.id === id || i.id === `usgs_${id}` || i.externalMeta?.sourceId === id);
    if (usgsMatch) return usgsMatch;
    const firmsExternals = firmsService.getHotspotIncidents();
    const firmsMatch = firmsExternals.find(i => i.id === id || i.id === `firms_${id}` || i.externalMeta?.sourceId === id);
    if (firmsMatch) return firmsMatch;
    const gdacsExternals = gdacsService.getIncidentProjections();
    return gdacsExternals.find(i => i.id === id || i.id === `gdacs_${id}` || i.externalMeta?.sourceId === id);
  },

  reportIncident: async (data: Partial<Incident>) => {
    await delay(600); // Simulate upload and initial processing
    
    // Validate and resolve coordinates
    let loc = data.location;
    if (loc && typeof loc.lat !== 'undefined' && typeof loc.lng !== 'undefined') {
      const parsedLat = typeof loc.lat === 'number' ? loc.lat : parseFloat(String(loc.lat));
      const parsedLng = typeof loc.lng === 'number' ? loc.lng : parseFloat(String(loc.lng));
      if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        loc = {
          ...loc,
          lat: parsedLat,
          lng: parsedLng,
        };
      }
    }

    const hasValidCoordinates =
      loc &&
      typeof loc.lat === 'number' &&
      typeof loc.lng === 'number' &&
      !isNaN(loc.lat) &&
      !isNaN(loc.lng) &&
      loc.lat >= -90 &&
      loc.lat <= 90 &&
      loc.lng >= -180 &&
      loc.lng <= 180;

    if (!hasValidCoordinates) {
      // Try to resolve using address or title (e.g. "Virar")
      const addressQuery = loc?.address || data.title || '';
      const resolved = resolvePalgharLocation(addressQuery);
      if (resolved) {
        loc = {
          lat: resolved.lat,
          lng: resolved.lng,
          address: loc?.address || resolved.address,
          country: loc?.country || 'India',
          state: loc?.state || 'Maharashtra',
          district: loc?.district || 'Palghar',
          verificationStatus: loc?.verificationStatus || 'verified',
        };
      } else {
        throw new Error(
          `Unable to establish valid coordinates for: "${addressQuery}". Please select a location on the map or choose a verified area.`
        );
      }
    }

    // Simulate AI Analysis Engine processing
    const isFlood = data.description?.toLowerCase().includes('water') || data.description?.toLowerCase().includes('flood');
    
    const initialTimeline: IncidentTimelineEvent[] = [
      {
        id: `tl_${Date.now()}_0`,
        timestamp: new Date().toISOString(),
        status: (data.status || 'pending') as Incident['status'],
        actor: data.reporterRole === 'citizen' ? 'Citizen Reporter' : 'Palghar EOC Dispatch',
        note: data.reporterRole === 'citizen'
          ? `Citizen submitted emergency report: ${data.title || 'Emergency incident'}.`
          : `Authority logged operational incident: ${data.title || 'Emergency incident'}.`
      }
    ];

    const newIncident: Incident = {
      id: `inc_${generateId()}`,
      title: data.title || 'Untitled Incident',
      description: data.description || '',
      location: loc,
      timestamp: new Date().toISOString(),
      reporterId: data.reporterId || 'cit_unknown',
      reporterRole: data.reporterRole || 'citizen',
      source: data.source || 'Citizen Report',
      type: data.type || 'Other',
      urgency: data.urgency || 'Medium',
      status: data.status || 'pending',
      assignedTeam: data.assignedTeam || 'Unassigned',
      mediaUrls: data.mediaUrls || [],
      timeline: initialTimeline,
      aiAnalysis: {
        severity: isFlood ? 'critical' : 'medium',
        confidenceScore: 0.85 + (Math.random() * 0.1),
        tags: isFlood ? ['flood', 'water'] : ['general'],
        isDuplicate: Math.random() > 0.8, // 20% chance of being flagged as duplicate
        recommendedAction: isFlood ? 'Monitor water levels and dispatch rescue.' : 'Assess situation.',
      }
    };
    
    if (data.source === 'Authority Created') {
      const severityMap: Record<string, string> = { 'Low': 'low', 'Medium': 'medium', 'High': 'high', 'Critical': 'critical' };
      newIncident.aiAnalysis = {
        severity: (severityMap[data.urgency || 'Medium'] || 'medium') as any,
        confidenceScore: 1.0, 
        tags: [data.type?.toLowerCase() || 'general'],
        isDuplicate: false,
        recommendedAction: 'Authority initiated response.',
      }
    }
    
    const currentPersisted = getPersistedIncidents();
    incidents = [newIncident, ...currentPersisted.filter(i => i.id !== newIncident.id)];
    saveIncidents(incidents);
    
    // Add notification
    const priority = newIncident.aiAnalysis?.severity === 'critical' ? 'high' : 'medium';
    MockAPI.addNotification('incident', priority, `${newIncident.urgency}-priority ${newIncident.type.toLowerCase()} incident reported.`);

    return newIncident;
  },

  updateIncidentStatus: async (id: string, status: Incident['status'], note?: string, actor?: string) => {
    await delay(300);
    const prefix = id.replace('inc_', 'INC-').toUpperCase();
    
    let defaultNote = '';
    let defaultActor = actor || 'Palghar District EOC';
    let notifType: Notification['type'] = 'incident';
    let notifPriority: Notification['priority'] = 'medium';
    let notifMsg = `Incident ${prefix} status changed to ${status.replace(/_/g, ' ')}.`;

    switch (status) {
      case 'verified':
        defaultNote = 'Authority verified report as confirmed emergency incident.';
        notifType = 'verification';
        notifPriority = 'medium';
        notifMsg = `Incident ${prefix} has been verified by District EOC.`;
        break;
      case 'dismissed':
        defaultNote = 'Report reviewed and rejected/dismissed (duplicate or invalid report).';
        notifType = 'incident';
        notifPriority = 'low';
        notifMsg = `Incident ${prefix} was reviewed and dismissed.`;
        break;
      case 'assigned':
        defaultNote = 'Responder unit assigned by Palghar Command Center.';
        notifType = 'volunteer';
        notifPriority = 'medium';
        notifMsg = `Field responder team dispatched to ${prefix}.`;
        break;
      case 'accepted':
        defaultNote = 'Field responder accepted the tactical mission assignment.';
        defaultActor = 'Field Responder';
        notifType = 'volunteer';
        notifPriority = 'low';
        notifMsg = `Field responder accepted assignment for ${prefix}.`;
        break;
      case 'on_the_way':
        defaultNote = 'Field responder is en route to scene coordinates.';
        defaultActor = 'Field Responder';
        notifType = 'volunteer';
        notifPriority = 'low';
        notifMsg = `Responder unit is en route to ${prefix}.`;
        break;
      case 'reached':
        defaultNote = 'Field responder arrived on-scene at emergency location.';
        defaultActor = 'Field Responder';
        notifType = 'volunteer';
        notifPriority = 'medium';
        notifMsg = `Responder arrived on-scene at ${prefix}.`;
        break;
      case 'rescue_in_progress':
        defaultNote = 'Tactical search, rescue, or field containment commenced.';
        defaultActor = 'Field Responder';
        notifType = 'incident';
        notifPriority = 'high';
        notifMsg = `Rescue operations underway for ${prefix}.`;
        break;
      case 'completed':
        defaultNote = 'Field rescue operation completed. Ready for recovery and relief phase.';
        defaultActor = 'Field Responder';
        notifType = 'incident';
        notifPriority = 'medium';
        notifMsg = `Field rescue operations completed for ${prefix}.`;
        break;
      case 'relief':
        defaultNote = 'Relief distribution, potable water supplies, and shelter operations underway.';
        defaultActor = 'Palghar Relief Operations';
        notifType = 'resource';
        notifPriority = 'low';
        notifMsg = `Relief distribution underway for ${prefix}.`;
        break;
      case 'resolved':
        defaultNote = note || 'Incident successfully resolved and officially closed by Palghar District EOC.';
        defaultActor = 'District Collectorate EOC';
        notifType = 'incident';
        notifPriority = 'low';
        notifMsg = `Incident ${prefix} has been officially resolved and closed.`;
        break;
      default:
        defaultNote = note || `Status transitioned to ${status}.`;
    }

    const newTimelineEvent: IncidentTimelineEvent = {
      id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      status,
      actor: defaultActor,
      note: note || defaultNote
    };

    incidents = incidents.map(inc => {
      if (inc.id === id) {
        const existingTimeline = inc.timeline && inc.timeline.length > 0 ? inc.timeline : [
          {
            id: `tl_init_${inc.id}`,
            timestamp: inc.timestamp,
            status: 'pending' as const,
            actor: inc.reporterRole === 'citizen' ? 'Citizen Reporter' : 'Palghar EOC Dispatch',
            note: 'Initial incident report logged.'
          }
        ];
        return {
          ...inc,
          assignedTeam: status === 'dismissed' ? 'Unassigned' : inc.assignedTeam,
          assignedVolunteerId: status === 'dismissed' ? undefined : inc.assignedVolunteerId,
          status,
          timeline: [...existingTimeline, newTimelineEvent]
        };
      }
      return inc;
    });

    saveIncidents(incidents);
    MockAPI.addNotification(notifType, notifPriority, notifMsg);

    // If resolved, completed, or dismissed, free up any volunteer and resources assigned to this incident
    if (status === 'resolved' || status === 'completed' || status === 'dismissed') {
      const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();
      const targetNorm = normalizeId(id);

      // Free assigned volunteer
      volunteers = getPersistedVolunteers();
      let volChanged = false;
      volunteers = volunteers.map(v => {
        const isAssigned = v.currentAssignmentId === id || (v.currentAssignmentId && normalizeId(v.currentAssignmentId) === targetNorm);
        if (isAssigned) {
          volChanged = true;
          return {
            ...v,
            status: 'available' as const,
            currentAssignmentId: undefined
          };
        }
        return v;
      });
      if (volChanged) {
        saveVolunteers(volunteers);
      }

      // If resolved or dismissed: release allocated resources back to Available
      if (status === 'resolved' || status === 'dismissed') {
        resources = getPersistedResources();
        let resChanged = false;
        resources = resources.map(r => {
          const isAllocated = r.currentIncidentId === id || (r.currentIncidentId && normalizeId(r.currentIncidentId) === targetNorm);
          if (isAllocated) {
            resChanged = true;
            return {
              ...r,
              status: 'Available' as const,
              currentIncidentId: undefined
            };
          }
          return r;
        });
        if (resChanged) {
          saveResources(resources);
        }
      }
    }

    return incidents.find(i => i.id === id);
  },

  updateReliefDetails: async (id: string, details: any) => {
    await delay(400);
    incidents = incidents.map(inc => inc.id === id ? { ...inc, reliefDetails: details } : inc);
    saveIncidents(incidents);
    return incidents.find(i => i.id === id);
  },

  updateIncidentAITriage: async (id: string, assessment: AITriageAssessment) => {
    await delay(200);
    const prefix = id.replace('inc_', 'INC-').toUpperCase();
    
    const timelineEvent: IncidentTimelineEvent = {
      id: `tl_${Date.now()}_ai_triage`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      actor: `${assessment.modelUsed || 'Gemini 3.8 Flash'} (AI Triage)`,
      note: `AI decision-support analysis completed. Suggested Category: ${assessment.hazardCategory}. Recommended Priority: ${assessment.recommendedPriority}. (Advisory: Requires human review).`
    };

    incidents = incidents.map(inc => {
      if (inc.id === id) {
        timelineEvent.status = inc.status;
        const existingTimeline = inc.timeline && inc.timeline.length > 0 ? inc.timeline : [
          {
            id: `tl_init_${inc.id}`,
            timestamp: inc.timestamp,
            status: inc.status,
            actor: inc.reporterRole === 'citizen' ? 'Citizen Reporter' : 'Palghar EOC Dispatch',
            note: 'Initial incident report logged.'
          }
        ];
        // Filter out any previous AI triage timeline events to prevent duplication on re-run
        const filteredTimeline = existingTimeline.filter(tl => !tl.id.includes('ai_triage') && !tl.actor.includes('AI Triage'));
        return {
          ...inc,
          aiTriageAssessment: assessment,
          timeline: [...filteredTimeline, timelineEvent]
        };
      }
      return inc;
    });

    saveIncidents(incidents);
    MockAPI.addNotification('verification', 'low', `Gemini AI triage analysis recorded for ${prefix}. Recommended: ${assessment.recommendedPriority}.`);

    return incidents.find(i => i.id === id);
  },

  // --- Alerts & Relief ---
  getAlerts: async () => {
    await delay(200);
    alerts = getPersistedAlerts();
    return [...alerts];
  },

  createAlert: async (data: Partial<Alert>) => {
    await delay(300);
    const newAlert: Alert = {
      id: data.id || `alt_${Date.now()}`,
      type: data.type || 'evacuation',
      title: data.title || 'Official Advisory',
      description: data.description || 'Public safety advisory for Palghar District.',
      severity: data.severity || 'high',
      affectedArea: data.affectedArea || {
        name: 'Palghar Sector',
        radiusKm: 10,
        lat: 19.6967,
        lng: 72.7699,
      },
      issuedAt: new Date().toISOString(),
      active: true,
    };
    alerts = [newAlert, ...getPersistedAlerts().filter(a => a.id !== newAlert.id)];
    saveAlerts(alerts);
    MockAPI.addNotification('warning', newAlert.severity === 'critical' ? 'high' : 'medium', `Public advisory broadcast: ${newAlert.title}`);
    return newAlert;
  },
  
  getWeatherAlerts: async () => {
    await delay(300);
    return [...alerts].filter(a => a.type === 'weather');
  },

  getReliefPoints: async () => {
    await delay(300);
    return [...reliefPoints];
  },

  // --- Coordination & Resources ---
  getResources: async () => {
    await delay(200);
    resources = getPersistedResources();
    return [...resources];
  },

  getAllocatedResources: async (incidentId: string) => {
    await delay(150);
    resources = getPersistedResources();
    const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();
    const targetNorm = normalizeId(incidentId);
    return resources.filter(r => r.currentIncidentId === incidentId || (r.currentIncidentId && normalizeId(r.currentIncidentId) === targetNorm));
  },

  allocateResource: async (resourceId: string, incidentId: string) => {
    await delay(300);
    resources = getPersistedResources();
    incidents = getPersistedIncidents();

    const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();
    const targetNorm = normalizeId(incidentId);
    const targetIncident = incidents.find(i => i.id === incidentId || normalizeId(i.id) === targetNorm);
    if (!targetIncident) {
      throw new Error(`Target incident "${incidentId}" not found.`);
    }
    if (targetIncident.status === 'resolved' || targetIncident.status === 'dismissed') {
      throw new Error(`Cannot allocate resources to ${targetIncident.status} incident "${targetIncident.id.replace(/^inc_/i, 'INC-').toUpperCase()}".`);
    }

    const resIndex = resources.findIndex(r => r.id === resourceId);
    if (resIndex === -1) {
      throw new Error(`Resource with ID "${resourceId}" not found.`);
    }

    const resource = resources[resIndex];
    if (resource.status !== 'Available' && resource.currentIncidentId && normalizeId(resource.currentIncidentId) !== targetNorm) {
      throw new Error(`Resource "${resource.name}" is already allocated to another operation.`);
    }

    const updatedResource: Resource = {
      ...resource,
      status: 'Allocated',
      currentIncidentId: targetIncident.id
    };
    resources[resIndex] = updatedResource;
    saveResources(resources);

    // Record timeline note on incident
    const incidentPrefix = targetIncident.id.replace(/^inc_/i, 'INC-').toUpperCase();
    const timelineEvent: IncidentTimelineEvent = {
      id: `tl_${Date.now()}_res_${resourceId}`,
      timestamp: new Date().toISOString(),
      status: targetIncident.status,
      actor: 'Palghar Logistics Depot',
      note: `Resource "${resource.name}" (${resource.type}${resource.quantity && resource.quantity > 1 ? ` x${resource.quantity}` : ''}) allocated to incident.`
    };

    incidents = incidents.map(inc => {
      if (inc.id === targetIncident.id || normalizeId(inc.id) === targetNorm) {
        const existingTimeline = inc.timeline && inc.timeline.length > 0 ? inc.timeline : [];
        return {
          ...inc,
          timeline: [...existingTimeline, timelineEvent]
        };
      }
      return inc;
    });
    saveIncidents(incidents);

    MockAPI.addNotification('resource', 'medium', `${resource.type} allocated to ${incidentPrefix}.`);
    return { success: true, resource: updatedResource };
  },

  updateResourceStatus: async (resourceId: string, status: Resource['status']) => {
    await delay(250);
    resources = getPersistedResources();
    incidents = getPersistedIncidents();
    const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();

    const resIndex = resources.findIndex(r => r.id === resourceId);
    if (resIndex === -1) {
      throw new Error(`Resource with ID "${resourceId}" not found.`);
    }

    const resource = resources[resIndex];
    const oldIncidentId = resource.currentIncidentId;
    const newIncidentId = status === 'Available' ? undefined : oldIncidentId;

    const updatedResource: Resource = {
      ...resource,
      status,
      currentIncidentId: newIncidentId
    };
    resources[resIndex] = updatedResource;
    saveResources(resources);

    // If attached to an incident, log timeline note
    if (oldIncidentId) {
      const targetNorm = normalizeId(oldIncidentId);
      const targetIncident = incidents.find(i => i.id === oldIncidentId || normalizeId(i.id) === targetNorm);
      if (targetIncident) {
        const actionNote = status === 'Available'
          ? `Resource "${resource.name}" released back to available depot inventory.`
          : `Resource "${resource.name}" status updated to "${status}".`;

        const timelineEvent: IncidentTimelineEvent = {
          id: `tl_${Date.now()}_res_stat_${resourceId}`,
          timestamp: new Date().toISOString(),
          status: targetIncident.status,
          actor: 'Palghar Logistics Depot',
          note: actionNote
        };

        incidents = incidents.map(inc => {
          if (inc.id === targetIncident.id || normalizeId(inc.id) === targetNorm) {
            const existingTimeline = inc.timeline && inc.timeline.length > 0 ? inc.timeline : [];
            return {
              ...inc,
              timeline: [...existingTimeline, timelineEvent]
            };
          }
          return inc;
        });
        saveIncidents(incidents);
      }
    }

    return { success: true, resource: updatedResource };
  },

  // --- Volunteers & Responders ---
  getVolunteers: async () => {
    await delay(200);
    volunteers = getPersistedVolunteers();
    return [...volunteers];
  },

  getResponderCandidateRoster: async (incidentId: string): Promise<CandidateRoster> => {
    await delay(150);
    volunteers = getPersistedVolunteers();
    incidents = getPersistedIncidents();
    const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();
    const targetNorm = normalizeId(incidentId);
    const incident = incidents.find(i => i.id === incidentId || normalizeId(i.id) === targetNorm);

    const relevantKeywords = getIncidentSkillKeywords(incident);
    const hasIncCoord = Boolean(
      incident?.location &&
      typeof incident.location.lat === 'number' &&
      typeof incident.location.lng === 'number' &&
      !isNaN(incident.location.lat) &&
      !isNaN(incident.location.lng)
    );

    const allAvailable: Volunteer[] = [];
    const unavailable: (Volunteer & { ineligibleReason: string })[] = [];

    for (const v of volunteers) {
      if (v.status !== 'available') {
        let reason = 'Unavailable for deployment';
        if (v.status === 'offline') {
          reason = 'Offline / Standby (Off Duty)';
        } else if (v.status === 'assigned') {
          const asg = v.currentAssignmentId ? v.currentAssignmentId.replace(/^inc_/i, 'INC-').toUpperCase() : 'active operation';
          reason = `Already assigned to ${asg} (Transfer required)`;
        } else if (v.status === 'deployed') {
          const asg = v.currentAssignmentId ? v.currentAssignmentId.replace(/^inc_/i, 'INC-').toUpperCase() : 'active operation';
          reason = `Currently deployed to ${asg}`;
        }
        unavailable.push({
          ...v,
          ineligibleReason: reason
        });
        continue;
      }

      // Available personnel: calculate distance and skill match
      let distKm: number | undefined;
      let distStr = 'Palghar District (Location unindexed)';
      const hasVolCoord = Boolean(
        v.location &&
        typeof v.location.lat === 'number' &&
        typeof v.location.lng === 'number' &&
        !isNaN(v.location.lat) &&
        !isNaN(v.location.lng)
      );

      if (hasIncCoord && hasVolCoord) {
        distKm = calculateDistanceKm(
          incident!.location.lat,
          incident!.location.lng,
          v.location!.lat,
          v.location!.lng
        );
        const locLabel = v.location?.address ? v.location.address.split(',')[0].trim() : 'Base';
        distStr = `${distKm} km (${locLabel})`;
      } else if (v.location?.address) {
        distStr = `${v.location.address} (Coordinates unindexed)`;
      }

      const matchedSkills = (v.skills || []).filter(skill => {
        const sLower = skill.toLowerCase();
        return relevantKeywords.some(kw => sLower.includes(kw) || kw.includes(sLower));
      });

      let distanceScore = 0;
      if (distKm !== undefined) {
        if (distKm <= 2) distanceScore = 50;
        else if (distKm <= 10) distanceScore = 40;
        else if (distKm <= 20) distanceScore = 30;
        else if (distKm <= 35) distanceScore = 20;
        else if (distKm <= 55) distanceScore = 10;
        else distanceScore = 5;
      }

      const skillScore = matchedSkills.length * 25;
      const matchScore = distanceScore + skillScore;

      const matchReasons: string[] = [];
      if (matchedSkills.length > 0) {
        matchReasons.push(`Certified in ${matchedSkills.join(', ')}`);
      }
      if (distKm !== undefined) {
        if (distKm <= 5) {
          matchReasons.push(`Immediate tactical proximity (${distKm} km)`);
        } else if (distKm <= 25) {
          matchReasons.push(`Sector proximity (${distKm} km)`);
        }
      }

      // Meaningful recommendation threshold:
      // Recommended if responder is in close tactical proximity (<= 25 km) or has certified skills within sector range (<= 45 km)
      const isRecommended = Boolean(
        (matchedSkills.length > 0 && (distKm === undefined || distKm <= 45)) ||
        (distKm !== undefined && distKm <= 25)
      );

      if (!isRecommended && matchReasons.length === 0) {
        const addr = v.location?.address ? v.location.address.split(',')[0].trim() : 'Outer sector';
        matchReasons.push(`Available in ${addr}${distKm ? ` (${distKm} km)` : ''} - outside primary tactical zone`);
      }

      allAvailable.push({
        ...v,
        distance: distStr,
        distanceKm: distKm,
        matchScore,
        isRecommended,
        matchReasons
      });
    }

    // Sort allAvailable: recommended first (by matchScore desc), then other available (by distance asc)
    allAvailable.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      if ((b.matchScore || 0) !== (a.matchScore || 0)) {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      return (a.distanceKm || 999) - (b.distanceKm || 999);
    });

    const recommended = allAvailable.filter(v => v.isRecommended);
    const otherAvailable = allAvailable.filter(v => !v.isRecommended);

    return {
      recommended,
      otherAvailable,
      allAvailable,
      unavailable,
      totalPersonnel: volunteers.length,
      incident: incident || null
    };
  },

  getRecommendedVolunteers: async (incidentId: string) => {
    const roster = await MockAPI.getResponderCandidateRoster(incidentId);
    return roster.allAvailable;
  },

  assignVolunteerToIncident: async (volunteerId: string, incidentId: string, allowTransfer: boolean = false) => {
    await delay(300);
    volunteers = getPersistedVolunteers();
    const volunteerIndex = volunteers.findIndex(v => v.id === volunteerId);
    if (volunteerIndex === -1) {
      throw new Error(`Responder with ID "${volunteerId}" was not found.`);
    }

    const volunteer = volunteers[volunteerIndex];
    if (volunteer.status === 'offline') {
      throw new Error(`Responder "${volunteer.name}" is currently offline and unavailable for assignment.`);
    }

    incidents = getPersistedIncidents();
    const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();
    const targetNorm = normalizeId(incidentId);

    const targetIncident = incidents.find(i => i.id === incidentId || normalizeId(i.id) === targetNorm);
    if (!targetIncident) {
      throw new Error(`Target incident "${incidentId}" was not found.`);
    }
    if (targetIncident.status === 'resolved' || targetIncident.status === 'dismissed') {
      throw new Error(`Incident "${targetIncident.id.replace(/^inc_/i, 'INC-').toUpperCase()}" is ${targetIncident.status} and cannot receive responder assignments.`);
    }

    // Check if responder is already assigned or deployed to another active incident
    const activeIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'dismissed');
    const existingInc = activeIncidents.find(i => 
      normalizeId(i.id) !== targetNorm && 
      (i.assignedVolunteerId === volunteerId || 
       (volunteer.currentAssignmentId && normalizeId(i.id) === normalizeId(volunteer.currentAssignmentId)) ||
       (i.assignedTeam && (i.assignedTeam.toLowerCase().trim() === volunteer.name.toLowerCase().trim() || i.assignedTeam.toLowerCase().includes(volunteer.name.toLowerCase()))))
    );

    if (existingInc) {
      const existingDisplay = existingInc.id.replace(/^inc_/i, 'INC-').toUpperCase();
      if (!allowTransfer) {
        throw new Error(
          `Responder "${volunteer.name}" is already assigned to active incident ${existingDisplay}. Transfer confirmation is required to reassign.`
        );
      }

      // Perform atomic transfer: release from existing incident
      const oldStatus = existingInc.status === 'assigned' ? 'verified' : existingInc.status;
      const targetDisplay = targetIncident.id.replace(/^inc_/i, 'INC-').toUpperCase();
      const transferTimelineEvent: IncidentTimelineEvent = {
        id: `tl_${Date.now()}_trf_rel_${volunteerId}`,
        timestamp: new Date().toISOString(),
        status: oldStatus,
        actor: 'Palghar Command EOC',
        note: `Field responder "${volunteer.name}" (ID: ${volunteerId}) reassigned to incident ${targetDisplay}. Released from current assignment.`
      };

      incidents = incidents.map(inc => {
        if (inc.id === existingInc.id || normalizeId(inc.id) === normalizeId(existingInc.id)) {
          const existingTimeline = inc.timeline && inc.timeline.length > 0 ? inc.timeline : [];
          return {
            ...inc,
            assignedTeam: 'Unassigned',
            assignedVolunteerId: undefined,
            status: oldStatus,
            timeline: [...existingTimeline, transferTimelineEvent]
          };
        }
        return inc;
      });
    }

    // Release any other active incident claiming this volunteer (by ID or team name)
    const vNameLower = volunteer.name.toLowerCase().trim();
    incidents = incidents.map(inc => {
      if (normalizeId(inc.id) !== targetNorm) {
        const matchesId = inc.assignedVolunteerId === volunteerId;
        const matchesTeam = inc.assignedTeam && inc.assignedTeam !== 'Unassigned' && (
          inc.assignedTeam.toLowerCase().trim() === vNameLower ||
          inc.assignedTeam.toLowerCase().includes(vNameLower)
        );
        if (matchesId || matchesTeam) {
          return {
            ...inc,
            assignedTeam: 'Unassigned',
            assignedVolunteerId: undefined,
            status: inc.status === 'assigned' ? 'verified' : inc.status
          };
        }
      }
      return inc;
    });

    // If target incident was previously assigned to a different volunteer, release that volunteer
    if (targetIncident.assignedVolunteerId && targetIncident.assignedVolunteerId !== volunteerId) {
      const prevVolId = targetIncident.assignedVolunteerId;
      volunteers = volunteers.map(v => v.id === prevVolId ? {
        ...v,
        status: 'available' as const,
        currentAssignmentId: undefined
      } : v);
    }

    // Update volunteer record to 'assigned' (not deployed!)
    volunteers = volunteers.map(v => v.id === volunteerId ? {
      ...v,
      status: 'assigned' as const,
      currentAssignmentId: targetIncident.id
    } : v);
    saveVolunteers(volunteers);
    
    const volunteerName = volunteer.name || 'Assigned Tactical Unit';
    const incidentPrefix = targetIncident.id.replace(/^inc_/i, 'INC-').toUpperCase();

    const timelineEvent: IncidentTimelineEvent = {
      id: `tl_${Date.now()}_asg_${volunteerId}`,
      timestamp: new Date().toISOString(),
      status: 'assigned',
      actor: 'Palghar Command EOC',
      note: `Field responder "${volunteerName}" (ID: ${volunteerId}) assigned to incident.`
    };

    incidents = incidents.map(inc => {
      if (inc.id === targetIncident.id || normalizeId(inc.id) === targetNorm) {
        const existingTimeline = inc.timeline && inc.timeline.length > 0 ? inc.timeline : [
          {
            id: `tl_init_${inc.id}`,
            timestamp: inc.timestamp,
            status: 'pending' as const,
            actor: inc.reporterRole === 'citizen' ? 'Citizen Reporter' : 'Palghar EOC Dispatch',
            note: 'Initial incident report logged.'
          }
        ];

        return {
          ...inc,
          assignedTeam: volunteerName,
          assignedVolunteerId: volunteerId,
          status: inc.status === 'pending' || inc.status === 'verified' ? 'assigned' : inc.status,
          timeline: [...existingTimeline, timelineEvent]
        };
      }
      return inc;
    });

    saveIncidents(incidents);
    
    MockAPI.addNotification('volunteer', 'medium', `${volunteer.name} assigned to incident ${incidentPrefix}.`);

    return { success: true, volunteer: volunteers.find(v => v.id === volunteerId) };
  },

  mobilizeVolunteerToIncident: async (volunteerId: string, incidentId: string, allowTransfer: boolean = false) => {
    await delay(300);
    volunteers = getPersistedVolunteers();
    const volunteerIndex = volunteers.findIndex(v => v.id === volunteerId);
    if (volunteerIndex === -1) {
      throw new Error(`Responder with ID "${volunteerId}" was not found.`);
    }

    const volunteer = volunteers[volunteerIndex];
    if (volunteer.status === 'offline') {
      throw new Error(`Responder "${volunteer.name}" is currently offline and unavailable for mobilization.`);
    }

    incidents = getPersistedIncidents();
    const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();
    const targetNorm = normalizeId(incidentId);

    // Validate target incident
    const targetIncident = incidents.find(i => i.id === incidentId || normalizeId(i.id) === targetNorm);
    if (!targetIncident) {
      throw new Error(`Target incident "${incidentId}" was not found.`);
    }
    if (targetIncident.status === 'resolved' || targetIncident.status === 'dismissed') {
      throw new Error(`Incident "${targetIncident.id.replace(/^inc_/i, 'INC-').toUpperCase()}" is ${targetIncident.status} and cannot receive responder mobilization.`);
    }

    // Check if responder is already committed to another active incident
    const activeIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'dismissed');
    const existingInc = activeIncidents.find(i => 
      normalizeId(i.id) !== targetNorm && 
      (i.assignedVolunteerId === volunteerId || 
       (volunteer.currentAssignmentId && normalizeId(i.id) === normalizeId(volunteer.currentAssignmentId)) ||
       (i.assignedTeam && (i.assignedTeam.toLowerCase().trim() === volunteer.name.toLowerCase().trim() || i.assignedTeam.toLowerCase().includes(volunteer.name.toLowerCase()))))
    );

    if (existingInc) {
      const existingDisplay = existingInc.id.replace(/^inc_/i, 'INC-').toUpperCase();
      if (!allowTransfer) {
        throw new Error(
          `Responder "${volunteer.name}" is currently assigned to incident ${existingDisplay} (${existingInc.title}). Transfer confirmation is required to mobilize to a different incident.`
        );
      }
      
      // Perform explicit atomic transfer: release from existing incident
      const oldStatus = existingInc.status === 'assigned' ? 'verified' : existingInc.status;
      const targetDisplay = targetIncident.id.replace(/^inc_/i, 'INC-').toUpperCase();
      const transferTimelineEvent: IncidentTimelineEvent = {
        id: `tl_${Date.now()}_trf_rel_${volunteerId}`,
        timestamp: new Date().toISOString(),
        status: oldStatus,
        actor: 'Palghar Command EOC',
        note: `Field responder "${volunteer.name}" (ID: ${volunteerId}) transferred to incident ${targetDisplay}. Released from current assignment.`
      };

      incidents = incidents.map(inc => {
        if (inc.id === existingInc.id || normalizeId(inc.id) === normalizeId(existingInc.id)) {
          const existingTimeline = inc.timeline && inc.timeline.length > 0 ? inc.timeline : [];
          return {
            ...inc,
            assignedTeam: 'Unassigned',
            assignedVolunteerId: undefined,
            status: oldStatus,
            timeline: [...existingTimeline, transferTimelineEvent]
          };
        }
        return inc;
      });
    }

    // Also check if any other active incident previously claimed this volunteer (by ID or team name)
    const vNameLowerMob = volunteer.name.toLowerCase().trim();
    incidents = incidents.map(inc => {
      if (normalizeId(inc.id) !== targetNorm) {
        const matchesId = inc.assignedVolunteerId === volunteerId;
        const matchesTeam = inc.assignedTeam && inc.assignedTeam !== 'Unassigned' && (
          inc.assignedTeam.toLowerCase().trim() === vNameLowerMob ||
          inc.assignedTeam.toLowerCase().includes(vNameLowerMob)
        );
        if (matchesId || matchesTeam) {
          return {
            ...inc,
            assignedTeam: 'Unassigned',
            assignedVolunteerId: undefined,
            status: inc.status === 'assigned' ? 'verified' : inc.status
          };
        }
      }
      return inc;
    });

    // If target incident was previously assigned to a different volunteer, release that volunteer to available
    if (targetIncident.assignedVolunteerId && targetIncident.assignedVolunteerId !== volunteerId) {
      const prevVolId = targetIncident.assignedVolunteerId;
      volunteers = volunteers.map(v => v.id === prevVolId ? {
        ...v,
        status: 'available' as const,
        currentAssignmentId: undefined
      } : v);
    }

    // Update volunteer record to 'deployed'
    volunteers = volunteers.map(v => v.id === volunteerId ? {
      ...v,
      status: 'deployed' as const,
      currentAssignmentId: targetIncident.id
    } : v);
    saveVolunteers(volunteers);
    
    const volunteerName = volunteer.name || 'Assigned Tactical Unit';
    const incidentPrefix = targetIncident.id.replace(/^inc_/i, 'INC-').toUpperCase();

    const timelineEvent: IncidentTimelineEvent = {
      id: `tl_${Date.now()}_mob_${volunteerId}`,
      timestamp: new Date().toISOString(),
      status: 'assigned',
      actor: 'Palghar Command EOC',
      note: `Field responder "${volunteerName}" (ID: ${volunteerId}) mobilized and dispatched to scene.`
    };

    incidents = incidents.map(inc => {
      if (inc.id === targetIncident.id || normalizeId(inc.id) === targetNorm) {
        const existingTimeline = inc.timeline && inc.timeline.length > 0 ? inc.timeline : [
          {
            id: `tl_init_${inc.id}`,
            timestamp: inc.timestamp,
            status: 'pending' as const,
            actor: inc.reporterRole === 'citizen' ? 'Citizen Reporter' : 'Palghar EOC Dispatch',
            note: 'Initial incident report logged.'
          }
        ];

        return {
          ...inc,
          assignedTeam: volunteerName,
          assignedVolunteerId: volunteerId,
          status: inc.status === 'pending' || inc.status === 'verified' ? 'assigned' : inc.status,
          timeline: [...existingTimeline, timelineEvent]
        };
      }
      return inc;
    });

    saveIncidents(incidents);
    
    MockAPI.addNotification('volunteer', 'medium', `${volunteer.name} mobilized to incident ${incidentPrefix}.`);

    return { success: true, volunteer: volunteers.find(v => v.id === volunteerId) };
  },

  unassignVolunteerFromIncident: async (incidentId: string, volunteerId?: string) => {
    await delay(200);
    volunteers = getPersistedVolunteers();
    incidents = getPersistedIncidents();
    const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();
    const targetNorm = normalizeId(incidentId);

    const inc = incidents.find(i => i.id === incidentId || normalizeId(i.id) === targetNorm);
    const targetVolId = volunteerId || inc?.assignedVolunteerId;

    volunteers = volunteers.map(v => {
      const match = targetVolId 
        ? v.id === targetVolId 
        : (v.currentAssignmentId === incidentId || (v.currentAssignmentId && normalizeId(v.currentAssignmentId) === targetNorm));
      if (match) {
        return {
          ...v,
          status: 'available' as const,
          currentAssignmentId: undefined
        };
      }
      return v;
    });
    saveVolunteers(volunteers);

    incidents = incidents.map(i => {
      if (i.id === incidentId || normalizeId(i.id) === targetNorm) {
        const newStatus = i.status === 'assigned' ? 'verified' : i.status;
        const timelineEvent: IncidentTimelineEvent = {
          id: `tl_${Date.now()}_unassign`,
          timestamp: new Date().toISOString(),
          status: newStatus,
          actor: 'Palghar Command EOC',
          note: `Assigned responder unit released from incident back to available pool.`
        };
        const existingTimeline = i.timeline && i.timeline.length > 0 ? i.timeline : [];
        return {
          ...i,
          assignedTeam: 'Unassigned',
          assignedVolunteerId: undefined,
          status: newStatus,
          timeline: [...existingTimeline, timelineEvent]
        };
      }
      return i;
    });
    saveIncidents(incidents);

    return { success: true };
  },

  getVolunteerAssignment: async (volunteerId: string) => {
    await delay(200);
    volunteers = getPersistedVolunteers();
    incidents = getPersistedIncidents();
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (!volunteer) return null;

    const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();

    // 1. Primary: Match by volunteer.currentAssignmentId if present and incident is active
    if (volunteer.currentAssignmentId) {
      const targetNorm = normalizeId(volunteer.currentAssignmentId);
      const found = incidents.find(i => 
        (i.id === volunteer.currentAssignmentId || normalizeId(i.id) === targetNorm) &&
        i.status !== 'resolved' && 
        i.status !== 'dismissed' &&
        (i.assignedVolunteerId === volunteerId || (i.assignedTeam && i.assignedTeam.toLowerCase().includes(volunteer.name.toLowerCase())))
      );
      if (found) {
        return found;
      }
    }

    // 2. Direct match by assignedVolunteerId on active incident
    const matchById = incidents.find(i => 
      i.assignedVolunteerId === volunteerId && 
      i.status !== 'resolved' && 
      i.status !== 'dismissed'
    );
    if (matchById) return matchById;

    // 3. Match by assignedTeam mentioning this specific volunteer
    if (volunteer.name) {
      const match = incidents.find(i => 
        i.assignedTeam && 
        i.assignedTeam.toLowerCase().includes(volunteer.name.toLowerCase()) &&
        i.status !== 'resolved' && 
        i.status !== 'dismissed'
      );
      if (match) return match;
    }

    return null;
  },

  getAnalytics: async () => {
    await delay(200);
    return [...analytics];
  },

  // --- External Real Data Feeds (USGS Earthquakes) ---
  getEarthquakes: async () => {
    return usgsService.getEarthquakes();
  },

  getEarthquakeIncidents: async () => {
    return usgsService.getEarthquakeIncidents();
  },

  refreshEarthquakes: async () => {
    return usgsService.fetchEarthquakes();
  },

  // --- External Real Data Feeds (NASA FIRMS Fire Detections) ---
  getFires: async () => {
    return firmsService.getHotspots();
  },

  getFireIncidents: async () => {
    return firmsService.getHotspotIncidents();
  },

  refreshFires: async () => {
    return firmsService.fetchHotspots();
  },

  // --- External Real Data Feeds (GDACS Multi-Hazard Alerts) ---
  getGDACEvents: async () => {
    return gdacsService.getEvents();
  },

  getGDACIncidents: async () => {
    return gdacsService.getIncidentProjections();
  },

  refreshGDACSEvents: async () => {
    return gdacsService.fetchEvents();
  },

  getCombinedIncidents: async (options?: {
    includeExternal?: boolean;
    includeUSGS?: boolean;
    includeFIRMS?: boolean;
    includeGDACS?: boolean;
  }) => {
    await delay(200);
    const local = getPersistedIncidents();
    if (options?.includeExternal !== false) {
      const usgs = options?.includeUSGS !== false ? usgsService.getEarthquakeIncidents() : [];
      const firms = options?.includeFIRMS !== false ? firmsService.getHotspotIncidents() : [];
      const gdacs = options?.includeGDACS !== false ? gdacsService.getIncidentProjections() : [];
      return [...local, ...usgs, ...firms, ...gdacs];
    }
    return [...local];
  }
};
