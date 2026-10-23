export type IncidentStatus = 'pending' | 'verified' | 'assigned' | 'accepted' | 'on_the_way' | 'reached' | 'rescue_in_progress' | 'completed' | 'relief' | 'dismissed' | 'in_progress' | 'resolved';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type UserRole = 'citizen' | 'authority' | 'volunteer';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  country?: string;
  state?: string;
  district?: string;
  verificationStatus?: 'verified' | 'unverified' | 'boundary_unverified';
}

export interface ReliefDetails {
  peopleAssisted: number;
  resourcesUsed: number;
  reliefDistributed: string;
  shelterStatus: string;
  responseDuration: string;
  resolutionNotes?: string;
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  status: IncidentStatus;
  actor: string;
  note: string;
}

export interface AIAnalysis {
  severity: Severity;
  confidenceScore: number;
  tags: string[];
  isDuplicate: boolean;
  duplicateOfId?: string;
  recommendedAction: string;
}

export interface AITriageAssessment {
  incidentSummary: string;
  hazardCategory: string;
  recommendedPriority: 'Low' | 'Medium' | 'High' | 'Critical';
  reasoning: string;
  evidenceUsed: string[];
  missingInformation: string[];
  recommendedActions: string[];
  uncertainties: string[];
  requiresHumanReview: boolean;
  analyzedAt: string;
  modelUsed: string;
}

export interface ExternalEventMeta {
  source: 'USGS' | 'NASA FIRMS' | 'GDACS';
  sourceId: string;
  // USGS Specific
  magnitude?: number | null;
  magnitudeType?: string;
  depthKm?: number;
  place?: string;
  url: string;
  detailUrl?: string;
  eventStatus?: string;
  retrievedAt: string;
  tsunami?: number;
  significance?: number;
  derivedSeverityExplanation?: string;
  // NASA FIRMS Specific
  satellite?: string;
  sensor?: string;
  instrument?: string;
  brightnessTempI4?: number;
  brightnessTempI5?: number;
  fireRadiativePower?: number; // MW
  confidence?: string;
  confidenceLabel?: string;
  dayNight?: 'D' | 'N';
  acqDate?: string;
  acqTime?: string;
  // GDACS Specific
  eventId?: number;
  episodeId?: number;
  eventType?: string;
  eventName?: string;
  alertLevel?: string;
  alertScore?: number;
  country?: string;
  fromDate?: string;
  toDate?: string;
  severityText?: string;
  isRealData: true;
}

export type FIRMSSensorType =
  | 'VIIRS_NOAA20_NRT'
  | 'VIIRS_NOAA21_NRT'
  | 'VIIRS_SNPP_NRT'
  | 'MODIS_NRT';

export interface FIRMSHotspotEvent {
  sourceId: string;
  type: 'Fire Hotspot';
  latitude: number;
  longitude: number;
  brightnessTempI4?: number; // Kelvin (channel I-4, 375m)
  brightnessTempI5?: number; // Kelvin (channel I-5, 375m)
  fireRadiativePower?: number; // MW
  acqDate: string; // YYYY-MM-DD
  acqTime: string; // HHMM
  timestamp: string; // ISO 8601
  satellite: string; // 'N20' | 'N21' | 'N' | 'A' | 'T'
  sensor: string; // 'VIIRS' | 'MODIS'
  instrument: string; // e.g. 'VIIRS (NOAA-20)'
  confidence: string; // 'h' | 'n' | 'l' or numeric
  confidenceLabel: 'High' | 'Nominal' | 'Low' | string;
  dayNight?: 'D' | 'N';
  scan?: number;
  track?: number;
  version?: string;
  source: 'NASA FIRMS';
  sourceUrl: string;
  retrievedAt: string;
  isRealData: true;
  rawProperties?: Record<string, any>;
}

export interface FIRMSFeedStatusInfo {
  status: 'idle' | 'loading' | 'live' | 'stale' | 'offline' | 'unconfigured';
  lastSuccessfulUpdate: string | null;
  error: string | null;
  totalCount: number;
  sensor: FIRMSSensorType;
  sensorName: string;
  extent: string;
  isConfigured: boolean;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  location: Location;
  timestamp: string;
  reporterId: string;
  reporterRole: UserRole;
  source?: 'Citizen Report' | 'Authority Created' | 'External Alert' | 'USGS Live Feed' | string;
  type?: string;
  urgency?: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTeam?: string;
  assignedVolunteerId?: string;
  status: IncidentStatus;
  mediaUrls: string[];
  aiAnalysis?: AIAnalysis;
  reliefDetails?: ReliefDetails;
  isRealData?: boolean;
  externalMeta?: ExternalEventMeta;
  timeline?: IncidentTimelineEvent[];
  aiTriageAssessment?: AITriageAssessment;
}

export interface USGSEarthquakeEvent {
  sourceId: string;
  type: 'Earthquake';
  title: string;
  magnitude: number | null;
  magnitudeType?: string;
  latitude: number;
  longitude: number;
  depthKm?: number;
  eventTime: string;
  updatedTime?: string;
  retrievedAt: string;
  source: 'USGS';
  sourceUrl: string;
  detailUrl?: string;
  place: string;
  status?: string;
  significance?: number;
  tsunami?: number;
  derivedSeverity: Severity;
  severityExplanation: string;
  isRealData: true;
}

export type USGSFeedFrequency = 'past_hour' | 'past_day_all' | 'past_day_m25' | 'past_day_m45' | 'past_month_sig';

export interface USGSFeedStatusInfo {
  status: 'idle' | 'loading' | 'live' | 'stale' | 'error';
  lastSuccessfulUpdate: string | null;
  error: string | null;
  totalCount: number;
  feedUrl: string;
  feedName: string;
}

export type GDACSEventType = 'FL' | 'TC' | 'DR' | 'EQ' | 'VO';
export type GDACSAlertLevel = 'Red' | 'Orange' | 'Green' | string;

export interface GDACSEvent {
  sourceId: string; // e.g. "gdacs_FL_1104167_6"
  eventId: number;
  episodeId: number;
  eventType: 'FL' | 'TC' | string;
  eventTypeLabel: string; // e.g. "Flood" or "Tropical Cyclone"
  eventName: string;
  name: string;
  description: string;
  htmlDescription?: string;
  alertLevel: GDACSAlertLevel; // Official: 'Red' | 'Orange' | 'Green'
  alertScore?: number;
  episodeAlertLevel?: string;
  episodeAlertScore?: number;
  country?: string;
  iso3?: string;
  latitude: number;
  longitude: number;
  bbox?: [number, number, number, number];
  fromDate?: string;
  toDate?: string;
  dateModified?: string;
  source: string; // e.g. "GLOFAS" or "JTWC"
  sourceUrl: string; // Official Report URL
  geometryUrl?: string;
  detailsUrl?: string;
  severityText?: string;
  derivedSeverity: Severity; // Application severity classification: 'critical' | 'high' | 'medium' | 'low'
  derivedSeverityExplanation: string;
  retrievedAt: string;
  isRealData: true;
  rawProperties?: Record<string, any>;
}

export interface GDACSFeedStatusInfo {
  status: 'idle' | 'loading' | 'live' | 'stale' | 'offline' | 'error';
  lastSuccessfulUpdate: string | null;
  error: string | null;
  totalCount: number;
  activeEventType: 'all' | 'FL' | 'TC';
}

export interface Alert {
  id: string;
  type: 'weather' | 'infrastructure' | 'evacuation';
  title: string;
  description: string;
  severity: Severity;
  affectedArea: {
    name: string;
    radiusKm: number;
    lat?: number;
    lng?: number;
  };
  issuedAt: string;
  active: boolean;
}

export interface AnalyticsData {
  date: string;
  incidents: number;
  resolved: number;
}

export type NotificationType = 'warning' | 'incident' | 'verification' | 'volunteer' | 'resource' | 'system';
export type NotificationPriority = 'high' | 'medium' | 'low';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  message: string;
  timestamp: string;
  read: boolean;
}

export type ResourceCategory = 'Ambulance' | 'Rescue Boat' | 'Medical Kit' | 'Food' | 'Water' | 'Rescue Equipment' | 'Vehicle';
export type ResourceStatus = 'Available' | 'Allocated' | 'In Use';

export interface Resource {
  id: string;
  name: string;
  type: ResourceCategory;
  quantity?: number;
  location: Location;
  status: ResourceStatus;
  currentIncidentId?: string;
}

export interface Volunteer {
  id: string;
  name: string;
  skills: string[];
  status: 'available' | 'assigned' | 'deployed' | 'offline';
  currentAssignmentId?: string;
  location?: Location;
  distance?: string; // e.g. '2.4 km'
  distanceKm?: number;
  matchScore?: number;
  isRecommended?: boolean;
  matchReasons?: string[];
  ineligibleReason?: string;
}

export interface CandidateRoster {
  recommended: Volunteer[];
  otherAvailable: Volunteer[];
  allAvailable: Volunteer[];
  unavailable: (Volunteer & { ineligibleReason: string })[];
  totalPersonnel: number;
  incident: Incident | null;
}

export interface ReliefPoint {
  id: string;
  name: string;
  type: 'Shelter' | 'Medical Camp' | 'Food & Water Point' | 'Evacuation Center' | string;
  location: Location;
  capacity?: number;
  currentOccupancy?: number;
  contact?: string;
  status: 'Open' | 'Full' | 'Standby';
  description?: string;
}

