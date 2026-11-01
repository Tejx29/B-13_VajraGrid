/**
 * VajraGrid - Workflow Fixes and Integration Audit (Part 1 of 2)
 * Validates:
 * 1. Issue 1: Dismissed incidents must not appear on map, but remain in queue & storage
 * 2. Issue 2: Gemini AI triage communicates elapsed-time thresholds (not fake percentages)
 * 3. Issue 3: Incident queue & detail page discovery (e.g. INC-C4L205JRX), ID normalization, search & filter resilience
 */

// In-memory mock localStorage implementation
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
(global as any).localStorage = mockStorage;
(global as any).window = { localStorage: mockStorage };

import { MockAPI } from '../src/services/mockApi';
import { Incident, isDismissedIncident } from '../src/types';
import { getTriageProgressMessage } from '../src/services/aiService';
import { usgsService } from '../src/services/usgsService';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${testName}`);
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
    if (details) console.error(`         Details: ${details}`);
    throw new Error(`Assertion failed in "${testName}": ${details || 'no details'}`);
  }
}

async function runPart1Tests() {
  console.log('\n======================================================');
  console.log('   VajraGrid Workflow Fixes & Integration Audit (Part 1)');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // SECTION 1: ISSUE 1 - Dismissed Incidents Must Not Appear on Map
  // -------------------------------------------------------------------------
  console.log('--- 1. Issue 1: Dismissed Incident Map Exclusion & Queue Retention ---');

  const activeInc: Incident = {
    id: 'inc_test_101',
    title: 'Active flood report',
    description: 'Water rising near Manor',
    location: { lat: 19.6967, lng: 72.7699, address: 'Palghar' },
    timestamp: new Date().toISOString(),
    reporterId: 'cit_1',
    reporterRole: 'citizen',
    source: 'Citizen Report',
    type: 'Flood',
    urgency: 'High',
    status: 'pending',
    assignedTeam: 'Unassigned',
    mediaUrls: [],
    timeline: []
  };

  assert(!isDismissedIncident(activeInc), 'Active pending incident is not dismissed');

  const dismissedInc: Incident = { ...activeInc, id: 'inc_test_102', status: 'dismissed' };
  assert(isDismissedIncident(dismissedInc), 'Dismissed incident status is recognized by predicate');

  const rejectedInc: Incident = { ...activeInc, id: 'inc_test_103', status: 'rejected' as any };
  assert(isDismissedIncident(rejectedInc), 'Rejected incident status is recognized by predicate');

  // Create a real incident through MockAPI
  const reported = await MockAPI.reportIncident({
    title: 'False alarm smoke report near Manor',
    description: 'Controlled agricultural burning, not forest fire.',
    location: { lat: 19.7212, lng: 72.9103, address: 'Manor Road' },
    type: 'Fire',
    urgency: 'Low',
    status: 'pending'
  });
  assert(reported && reported.id.length > 0, 'Incident reported successfully');

  // Dismiss it via authority status update
  await MockAPI.updateIncidentStatus(reported.id, 'dismissed', 'False alarm confirmed by local fire watch.');

  // Verify in persistent storage
  const persistedList = await MockAPI.getIncidents();
  const dismissedInStorage = persistedList.find(i => i.id === reported.id);
  assert(Boolean(dismissedInStorage), 'Dismissed incident remains in persistent storage');
  assert(dismissedInStorage?.status === 'dismissed', 'Incident status in storage is dismissed');

  // Verify map filtering logic excludes it
  const mapVisibleIncidents = persistedList.filter(
    i => i.location && typeof i.location.lat === 'number' && !isNaN(i.location.lat) && !isDismissedIncident(i)
  );
  assert(
    !mapVisibleIncidents.some(i => i.id === reported.id),
    'Dismissed incident is excluded from active map rendered markers'
  );

  // Verify other active incidents remain on map
  assert(mapVisibleIncidents.length > 0, 'Active non-dismissed incidents remain on the map');

  // Verify queue retention (Combined incidents includes dismissed record)
  const combined = await MockAPI.getCombinedIncidents({ includeExternal: true });
  const inQueue = combined.find(i => i.id === reported.id);
  assert(Boolean(inQueue), 'Dismissed incident remains discoverable in Authority Incident Queue');
  assert(inQueue?.status === 'dismissed', 'Queue displays correct dismissed status');

  // Seed USGS external earthquake event in cache to test external hazard retention
  mockStorage.setItem('vajragrid_usgs_earthquakes_cache', JSON.stringify([
    {
      id: 'us7000test',
      sourceId: 'us7000test',
      title: 'M 4.2 - Western Maharashtra Region',
      magnitude: 4.2,
      magnitudeType: 'mb',
      place: 'Near Dahanu, Palghar District',
      time: Date.now(),
      updated: Date.now(),
      latitude: 19.97,
      longitude: 72.73,
      depth: 10,
      url: 'https://earthquake.usgs.gov',
      derivedSeverity: 'medium',
      severityExplanation: 'M4.2 moderate event'
    }
  ]));
  usgsService.loadFromCache();

  // External hazard observations remain visible and untouched
  const combinedWithExternal = await MockAPI.getCombinedIncidents({ includeExternal: true });
  const externalIncidents = combinedWithExternal.filter(i => i.source === 'USGS' || (i.isRealData && i.type === 'Earthquake'));
  assert(externalIncidents.length > 0, 'External hazard observations remain visible and untouched when local incidents are dismissed');

  // -------------------------------------------------------------------------
  // SECTION 2: ISSUE 2 - Gemini AI Triage Elapsed-Time Stages & UX
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Issue 2: Gemini AI Triage Elapsed-Time Stages & Idempotency ---');

  // Threshold 1: 0s to <2s
  assert(getTriageProgressMessage(0) === 'Preparing incident evidence...', '0s: Preparing incident evidence...');
  assert(getTriageProgressMessage(1) === 'Preparing incident evidence...', '1s: Preparing incident evidence...');

  // Threshold 2: 2s to <4s
  assert(getTriageProgressMessage(2) === 'Contacting Gemini AI...', '2s: Contacting Gemini AI...');
  assert(getTriageProgressMessage(3) === 'Contacting Gemini AI...', '3s: Contacting Gemini AI...');

  // Threshold 3: 4s to <6s
  assert(getTriageProgressMessage(4) === 'Analyzing the reported facts...', '4s: Analyzing the reported facts...');
  assert(getTriageProgressMessage(5) === 'Analyzing the reported facts...', '5s: Analyzing the reported facts...');

  // Threshold 4: 6s to <8s
  assert(getTriageProgressMessage(6) === 'Validating the structured assessment...', '6s: Validating the structured assessment...');
  assert(getTriageProgressMessage(7) === 'Validating the structured assessment...', '7s: Validating the structured assessment...');

  // Threshold 5: >= 8s
  assert(
    getTriageProgressMessage(8) === 'This is taking longer than usual. The request is still processing...',
    '8s: This is taking longer than usual. The request is still processing...'
  );
  assert(
    getTriageProgressMessage(15) === 'This is taking longer than usual. The request is still processing...',
    '>8s: Progress message remains polite and continuous without fake percentages'
  );

  // -------------------------------------------------------------------------
  // SECTION 3: ISSUE 3 - Incident Queue Search & ID Normalization (INC-C4L205JRX)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Issue 3: Incident Queue Search & ID Normalization ---');

  const testIncidentId = 'inc_c4l205jrx';
  const displayId = 'INC-C4L205JRX';

  const seededIncident: Incident = {
    id: testIncidentId,
    title: 'Waterlogged Rail Underpass at Palghar Station',
    description: 'Road impassable due to 3 feet standing water under railway bridge.',
    location: {
      lat: 19.6967,
      lng: 72.7699,
      address: 'Station Road Underpass, Palghar West',
      district: 'Palghar',
      state: 'Maharashtra',
      country: 'India',
      verificationStatus: 'verified'
    },
    timestamp: new Date().toISOString(),
    reporterId: 'cit_test_c4l',
    reporterRole: 'citizen',
    source: 'Citizen Report',
    type: 'Flood',
    urgency: 'High',
    status: 'pending',
    assignedTeam: 'Unassigned',
    mediaUrls: [],
    timeline: []
  };

  // Seed into localStorage
  const currentSaved = await MockAPI.getIncidents();
  mockStorage.setItem('vajragrid_incidents', JSON.stringify([seededIncident, ...currentSaved.filter(i => i.id !== testIncidentId)]));

  // 1. Verify getPersistedIncidents preserves it
  const reloadedList = await MockAPI.getIncidents();
  const preserved = reloadedList.find(i => i.id === testIncidentId);
  assert(Boolean(preserved), 'Test incident INC-C4L205JRX is preserved in persistent storage');

  // 2. Verify getIncidentById works with uppercase display ID: INC-C4L205JRX
  const byDisplay = await MockAPI.getIncidentById(displayId);
  assert(Boolean(byDisplay), 'getIncidentById resolves display ID "INC-C4L205JRX"');
  assert(byDisplay?.id === testIncidentId, 'Resolved incident ID matches internal format');

  // 3. Verify getIncidentById works with raw ID: inc_c4l205jrx
  const byRaw = await MockAPI.getIncidentById(testIncidentId);
  assert(Boolean(byRaw), 'getIncidentById resolves internal ID "inc_c4l205jrx"');

  // 4. Verify getIncidentById works with partial alphanumeric ID: c4l205jrx
  const byPartial = await MockAPI.getIncidentById('c4l205jrx');
  assert(Boolean(byPartial), 'getIncidentById resolves alphanumeric token "c4l205jrx"');

  // 5. Test search filter simulation in Incident Queue
  const searchFilter = (term: string, incList: Incident[]) => {
    const q = term.trim().toLowerCase();
    const cleanTerm = q.replace(/^inc_/i, '').replace(/^inc-/i, '');
    return incList.filter(i => {
      const cleanId = (i.id || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase();
      const dispId = (i.id || '').replace(/^inc_/i, 'INC-').toUpperCase();
      return (
        !q ||
        i.id.toLowerCase().includes(q) ||
        dispId.toLowerCase().includes(q) ||
        cleanId.includes(cleanTerm) ||
        (i.title && i.title.toLowerCase().includes(q)) ||
        (i.location?.address && i.location.address.toLowerCase().includes(q)) ||
        (i.type && i.type.toLowerCase().includes(q))
      );
    });
  };

  const matchesByFullDisplay = searchFilter('INC-C4L205JRX', reloadedList);
  assert(
    matchesByFullDisplay.some(i => i.id === testIncidentId),
    'Queue search by full display ID "INC-C4L205JRX" finds the incident'
  );

  const matchesByShortToken = searchFilter('C4L205JRX', reloadedList);
  assert(
    matchesByShortToken.some(i => i.id === testIncidentId),
    'Queue search by short token "C4L205JRX" finds the incident'
  );

  const matchesByLowerToken = searchFilter('c4l205jrx', reloadedList);
  assert(
    matchesByLowerToken.some(i => i.id === testIncidentId),
    'Queue search by lowercase token "c4l205jrx" finds the incident'
  );

  const matchesEmptySearch = searchFilter('', reloadedList);
  assert(
    matchesEmptySearch.some(i => i.id === testIncidentId),
    'Clearing search filter retains test incident in the queue'
  );

  // 6. Test updateIncidentStatus with display ID format
  await MockAPI.updateIncidentStatus(displayId, 'verified', 'Verified on ground by Palghar EOC');
  const updatedByDisplay = await MockAPI.getIncidentById(displayId);
  assert(updatedByDisplay?.status === 'verified', 'updateIncidentStatus succeeds when passed display ID "INC-C4L205JRX"');

  // 7. Test updateIncidentAITriage with display ID format
  await MockAPI.updateIncidentAITriage(displayId, {
    incidentSummary: 'Flooded underpass at Palghar railway station.',
    hazardCategory: 'Flood',
    recommendedPriority: 'High',
    reasoning: 'Blocks access between East and West Palghar.',
    evidenceUsed: ['Station underpass', '3 feet water'],
    missingInformation: ['Pumping station operational status'],
    recommendedActions: ['Deploy high-capacity suction pump', 'Place police barricade'],
    uncertainties: ['Tide influence on drain'],
    requiresHumanReview: true,
    analyzedAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash'
  });
  const triaged = await MockAPI.getIncidentById(displayId);
  assert(Boolean(triaged?.aiTriageAssessment), 'AI Triage successfully recorded on incident via display ID');
  assert(triaged?.aiTriageAssessment?.recommendedPriority === 'High', 'AI triage priority matches assessment');

  // 8. Test updateReliefDetails with display ID format
  await MockAPI.updateReliefDetails(displayId, {
    peopleAssisted: 25,
    resourcesUsed: 2,
    reliefDistributed: 'Emergency diversions posted',
    shelterStatus: 'Not needed',
    responseDuration: '45 mins',
    resolutionNotes: 'Water pumped out and traffic resumed.'
  });
  const reliefUpdated = await MockAPI.getIncidentById(displayId);
  assert(reliefUpdated?.reliefDetails?.peopleAssisted === 25, 'Relief details updated via display ID');

  console.log('\n======================================================');
  console.log(`   ALL ${passedTests} OF ${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
  process.exit(0);
}

runPart1Tests().catch(err => {
  console.error('\nWorkflow Fixes Part 1 tests failed with error:', err);
  process.exit(1);
});
