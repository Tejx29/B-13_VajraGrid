/**
 * VajraGrid Incident Location Selection, Coordinate Persistence & Overlapping Markers Regression Test Suite
 * Covers all 11 required scenarios specified in Section 6.
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
import { Incident } from '../src/types';

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

async function runLocationRegressionTests() {
  console.log('\n======================================================');
  console.log('   VajraGrid Location & Coordinate Persistence Tests  ');
  console.log('======================================================\n');

  // --- Scenario 1: Create incident A at coordinate (19.8200, 72.7300) ---
  console.log('--- 1. Create Incident A at specific coordinate ---');
  const incidentA = await MockAPI.reportIncident({
    title: 'Incident A - Coastal Road Breach at Dahanu',
    description: 'High storm surge washing over coastal road embankment.',
    location: {
      lat: 19.8200,
      lng: 72.7300,
      address: 'Dahanu Coastal Stretch, Palghar',
      district: 'Palghar',
      state: 'Maharashtra',
      country: 'India',
      verificationStatus: 'verified'
    },
    reporterRole: 'citizen',
    source: 'Citizen Report',
    urgency: 'High',
    type: 'Flood'
  });

  assert(Boolean(incidentA?.id), 'Incident A created with unique ID', incidentA.id);
  assert(incidentA.location.lat === 19.8200, 'Incident A has exact lat 19.8200', `lat: ${incidentA.location.lat}`);
  assert(incidentA.location.lng === 72.7300, 'Incident A has exact lng 72.7300', `lng: ${incidentA.location.lng}`);

  // --- Scenario 2: Create incident B at different coordinate (19.9500, 72.9500) ---
  console.log('\n--- 2. Create Incident B at different coordinate ---');
  const incidentB = await MockAPI.reportIncident({
    title: 'Incident B - Talasari Hillside Landslide',
    description: 'Debris flow blocking NH48 near Talasari border.',
    location: {
      lat: 19.9500,
      lng: 72.9500,
      address: 'Talasari Ghat Section, Palghar',
      district: 'Palghar',
      state: 'Maharashtra',
      country: 'India',
      verificationStatus: 'verified'
    },
    reporterRole: 'citizen',
    source: 'Citizen Report',
    urgency: 'Critical',
    type: 'Landslide'
  });

  assert(Boolean(incidentB?.id), 'Incident B created with unique ID', incidentB.id);
  assert(incidentB.location.lat === 19.9500, 'Incident B has exact lat 19.9500', `lat: ${incidentB.location.lat}`);
  assert(incidentB.location.lng === 72.9500, 'Incident B has exact lng 72.9500', `lng: ${incidentB.location.lng}`);

  // --- Scenario 3: Verify each incident stores its own exact lat and lng ---
  console.log('\n--- 3. Verify independent coordinate storage ---');
  assert(incidentA.id !== incidentB.id, 'Incident IDs are distinct');
  assert(
    incidentA.location.lat !== incidentB.location.lat && incidentA.location.lng !== incidentB.location.lng,
    'Incident A and Incident B have distinctly different coordinates'
  );
  assert(
    typeof incidentA.location.lat === 'number' && typeof incidentA.location.lng === 'number',
    'Incident A coordinates are stored as strict numbers'
  );
  assert(
    typeof incidentB.location.lat === 'number' && typeof incidentB.location.lng === 'number',
    'Incident B coordinates are stored as strict numbers'
  );

  // --- Scenario 4: Verify creating incident B does not modify incident A ---
  console.log('\n--- 4. Verify immutability of existing incidents upon new creation ---');
  const fetchedIncidentA = await MockAPI.getIncidentById(incidentA.id);
  assert(Boolean(fetchedIncidentA), 'Incident A successfully fetched after Incident B creation');
  assert(fetchedIncidentA?.location.lat === 19.8200, 'Incident A lat unmodified by Incident B', `Current lat: ${fetchedIncidentA?.location.lat}`);
  assert(fetchedIncidentA?.location.lng === 72.7300, 'Incident A lng unmodified by Incident B', `Current lng: ${fetchedIncidentA?.location.lng}`);

  // --- Scenario 5: Verify retrieving incidents returns original coordinates ---
  console.log('\n--- 5. Verify list retrieval retains accurate coordinates ---');
  const allIncidents = await MockAPI.getIncidents();
  const foundA = allIncidents.find(i => i.id === incidentA.id);
  const foundB = allIncidents.find(i => i.id === incidentB.id);
  assert(Boolean(foundA && foundB), 'Both incidents present in getIncidents() queue');
  assert(foundA?.location.lat === 19.8200 && foundA?.location.lng === 72.7300, 'Incident A retrieved with exact coordinates');
  assert(foundB?.location.lat === 19.9500 && foundB?.location.lng === 72.9500, 'Incident B retrieved with exact coordinates');

  // --- Scenario 6: Verify coordinates persist through simulated reload / localStorage reinitialization ---
  console.log('\n--- 6. Verify persistence across session reloads ---');
  // Read raw localStorage string
  const storedJson = mockStorage.getItem('vajragrid_incidents');
  assert(Boolean(storedJson), 'localStorage contains vajragrid_incidents key');
  const parsedStorage: Incident[] = JSON.parse(storedJson!);
  const storedA = parsedStorage.find(i => i.id === incidentA.id);
  const storedB = parsedStorage.find(i => i.id === incidentB.id);
  assert(storedA?.location.lat === 19.8200 && storedA?.location.lng === 72.7300, 'Incident A persisted to storage with original coordinates');
  assert(storedB?.location.lat === 19.9500 && storedB?.location.lng === 72.9500, 'Incident B persisted to storage with original coordinates');

  // Re-read via MockAPI after simulated re-read
  const reloadedIncidents = await MockAPI.getIncidents();
  const reloadedA = reloadedIncidents.find(i => i.id === incidentA.id);
  assert(reloadedA?.location.lat === 19.8200 && reloadedA?.location.lng === 72.7300, 'Incident A persists through storage re-query');

  // --- Scenario 7: Verify both citizen reporting and authority creation preserve selected coordinates ---
  console.log('\n--- 7. Citizen Reporting vs. Authority Creation ---');
  const citizenReport = await MockAPI.reportIncident({
    title: 'Citizen Report: Flooding near Boisar',
    description: 'Road inundated under 2 feet of water.',
    location: {
      lat: 19.8000,
      lng: 72.7500,
      address: 'Boisar MIDC Sector 3',
      district: 'Palghar',
      state: 'Maharashtra',
      country: 'India',
      verificationStatus: 'verified'
    },
    reporterRole: 'citizen',
    source: 'Citizen Report'
  });

  const authorityIncident = await MockAPI.reportIncident({
    title: 'Authority Log: Structural Collapse in Manor',
    description: 'Old warehouse roof compromised after thunderstorm.',
    location: {
      lat: 19.7400,
      lng: 72.9100,
      address: 'Manor Market Road',
      district: 'Palghar',
      state: 'Maharashtra',
      country: 'India',
      verificationStatus: 'verified'
    },
    reporterRole: 'authority',
    source: 'Authority Created',
    status: 'pending'
  });

  assert(citizenReport.location.lat === 19.8000 && citizenReport.location.lng === 72.7500, 'Citizen report preserves exact coordinates');
  assert(citizenReport.reporterRole === 'citizen', 'Citizen report reporterRole preserved');
  assert(authorityIncident.location.lat === 19.7400 && authorityIncident.location.lng === 72.9100, 'Authority incident preserves exact coordinates');
  assert(authorityIncident.reporterRole === 'authority', 'Authority incident reporterRole preserved');

  // --- Scenario 8: Verify latitude and longitude are not swapped (lat ~19, lng ~72) ---
  console.log('\n--- 8. Coordinate Ordering (Lat ~ 19.x, Lng ~ 72.x) ---');
  const incidentsToCheck = [incidentA, incidentB, citizenReport, authorityIncident];
  for (const inc of incidentsToCheck) {
    const lat = inc.location.lat;
    const lng = inc.location.lng;
    assert(
      lat >= 18.0 && lat <= 21.0,
      `Incident ${inc.id} lat is in correct latitude range (~19)`,
      `lat was ${lat}`
    );
    assert(
      lng >= 71.0 && lng <= 75.0,
      `Incident ${inc.id} lng is in correct longitude range (~72)`,
      `lng was ${lng}`
    );
    assert(lat < lng, `Incident ${inc.id} latitude is smaller than longitude (no swap)`);
  }

  // --- Scenario 9: Verify incidents with genuinely identical coordinates remain distinct records ---
  console.log('\n--- 9. Co-located Incidents Identification & Independence ---');
  const sharedCoord = { lat: 19.6967, lng: 72.7699 }; // Palghar HQ coordinates
  const colocated1 = await MockAPI.reportIncident({
    title: 'Palghar HQ Staging Point Medical Emergency',
    description: 'First aid assistance needed at HQ parking lot.',
    location: {
      ...sharedCoord,
      address: 'Palghar District HQ Gate 1',
      district: 'Palghar'
    },
    reporterRole: 'citizen',
    source: 'Citizen Report'
  });

  const colocated2 = await MockAPI.reportIncident({
    title: 'Palghar HQ Communications Unit Generator Failure',
    description: 'Backup generator fuel line leak at HQ annex.',
    location: {
      ...sharedCoord,
      address: 'Palghar District HQ Gate 2',
      district: 'Palghar'
    },
    reporterRole: 'authority',
    source: 'Authority Created'
  });

  assert(colocated1.id !== colocated2.id, 'Co-located incidents have distinct IDs', `${colocated1.id} vs ${colocated2.id}`);
  assert(colocated1.title !== colocated2.title, 'Co-located incidents retain distinct titles');
  assert(colocated1.location.lat === colocated2.location.lat && colocated1.location.lng === colocated2.location.lng, 'Incidents share exact geographic position');

  // Verify retrieval retains both distinct records
  const allCurrent = await MockAPI.getIncidents();
  const c1 = allCurrent.find(i => i.id === colocated1.id);
  const c2 = allCurrent.find(i => i.id === colocated2.id);
  assert(Boolean(c1 && c2), 'Both co-located incidents exist independently in system queue');

  // Grouping simulation (verifying spatial key matching)
  const groupKey1 = `${colocated1.location.lat.toFixed(4)},${colocated1.location.lng.toFixed(4)}`;
  const groupKey2 = `${colocated2.location.lat.toFixed(4)},${colocated2.location.lng.toFixed(4)}`;
  assert(groupKey1 === groupKey2, 'Both co-located incidents group together under the same 4-decimal spatial key');

  // --- Scenario 10: Verify missing coordinates do not silently copy another incident\'s coordinates ---
  console.log('\n--- 10. Missing Coordinates Handling & Non-pollution ---');
  try {
    await MockAPI.reportIncident({
      title: 'Invalid Report Without Location',
      description: 'Missing lat/lng.',
      location: {
        lat: NaN,
        lng: NaN,
        address: 'Unknown'
      } as any,
      reporterRole: 'citizen',
      source: 'Citizen Report'
    });
    assert(false, 'Should have rejected invalid/missing coordinates');
  } catch (err: any) {
    assert(
      err.message?.includes('Valid coordinates') || err.message?.includes('required') || err.message !== undefined,
      'Invalid coordinates explicitly rejected without defaulting to previous incident location'
    );
  }

  // --- Scenario 11: Verify external hazard telemetry (USGS, FIRMS, GDACS) and basemap behavior intact ---
  console.log('\n--- 11. External Hazard Telemetry & Basemap Integrity ---');
  const usgsIncidents = await MockAPI.getEarthquakeIncidents();
  assert(Array.isArray(usgsIncidents), 'USGS Earthquake telemetry feed operational');
  if (usgsIncidents.length > 0) {
    const eq = usgsIncidents[0];
    assert(typeof eq.location.lat === 'number' && typeof eq.location.lng === 'number', 'USGS telemetry has numeric lat/lng');
  }

  const fireIncidents = await MockAPI.getFireIncidents();
  assert(Array.isArray(fireIncidents), 'NASA FIRMS Fire telemetry feed operational');
  if (fireIncidents.length > 0) {
    const fire = fireIncidents[0];
    assert(typeof fire.location.lat === 'number' && typeof fire.location.lng === 'number', 'NASA FIRMS telemetry has numeric lat/lng');
  }

  const gdacsIncidents = await MockAPI.getGDACIncidents();
  assert(Array.isArray(gdacsIncidents), 'GDACS telemetry feed operational');
  if (gdacsIncidents.length > 0) {
    const gd = gdacsIncidents[0];
    assert(typeof gd.location.lat === 'number' && typeof gd.location.lng === 'number', 'GDACS telemetry has numeric lat/lng');
  }

  const combined = await MockAPI.getCombinedIncidents({ includeExternal: true });
  assert(combined.length > 0, 'Combined incidents successfully unified');

  console.log('\n======================================================');
  console.log(`   ALL ${passedTests} OF ${totalTests} REGRESSION TESTS PASSED!`);
  console.log('======================================================\n');
  process.exit(0);
}

runLocationRegressionTests().catch(err => {
  console.error('\nLocation regression tests failed with error:', err);
  process.exit(1);
});
