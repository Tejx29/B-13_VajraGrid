/**
 * VajraGrid Post-Disaster Recovery & Situation Reports Verification Test Suite
 * Tests data integrity, accurate metrics calculation, filtering, and missing field handling.
 */

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

import { Incident, isDismissedIncident } from '../src/types';

// Extraction of pure logic used in AuthorityReports
export const isPostDisasterIncident = (inc: Incident): boolean => {
  if (isDismissedIncident(inc)) return false;
  if (inc.status === 'resolved' || inc.status === 'relief' || inc.status === 'completed') return true;
  if (inc.reliefDetails) {
    const { peopleAssisted, resourcesUsed, reliefDistributed, shelterStatus, resolutionNotes } = inc.reliefDetails;
    if (
      (typeof peopleAssisted === 'number' && peopleAssisted > 0) ||
      (typeof resourcesUsed === 'number' && resourcesUsed > 0) ||
      Boolean(reliefDistributed && reliefDistributed.trim().length > 0) ||
      Boolean(shelterStatus && shelterStatus.trim().length > 0) ||
      Boolean(resolutionNotes && resolutionNotes.trim().length > 0)
    ) {
      return true;
    }
  }
  return false;
};

export const calculateRecoveryMetrics = (incidents: Incident[]) => {
  const postDisaster = incidents.filter(isPostDisasterIncident);
  const resolved = postDisaster.filter(i => i.status === 'resolved');
  
  const assistedIncidents = postDisaster.filter(
    i => typeof i.reliefDetails?.peopleAssisted === 'number' && i.reliefDetails.peopleAssisted > 0
  );
  const totalAssisted = assistedIncidents.reduce(
    (sum, i) => sum + (i.reliefDetails!.peopleAssisted || 0),
    0
  );

  const reliefOperations = postDisaster.filter(
    i => i.status === 'relief' || Boolean(
      i.reliefDetails?.reliefDistributed?.trim() ||
      i.reliefDetails?.shelterStatus?.trim() ||
      (typeof i.reliefDetails?.resourcesUsed === 'number' && i.reliefDetails.resourcesUsed > 0)
    )
  );

  return {
    totalRecords: postDisaster.length,
    totalResolved: resolved.length,
    totalAssisted,
    totalReliefOperations: reliefOperations.length,
    postDisasterIncidents: postDisaster
  };
};

export const formatPeopleAssisted = (inc: Incident): string => {
  if (typeof inc.reliefDetails?.peopleAssisted === 'number' && inc.reliefDetails.peopleAssisted > 0) {
    return `${inc.reliefDetails.peopleAssisted} citizens`;
  }
  return 'Not recorded';
};

export const formatReliefProvisions = (inc: Incident): string => {
  if (inc.reliefDetails?.reliefDistributed && inc.reliefDetails.reliefDistributed.trim().length > 0) {
    return inc.reliefDetails.reliefDistributed.trim();
  }
  return 'No relief data recorded';
};

export const formatResolutionSummary = (inc: Incident): string => {
  if (inc.reliefDetails?.resolutionNotes && inc.reliefDetails.resolutionNotes.trim().length > 0) {
    return inc.reliefDetails.resolutionNotes.trim();
  }
  if (inc.status === 'resolved') {
    return 'Resolution recorded by EOC (No notes entered)';
  }
  if (inc.status === 'completed') {
    return 'Field operation completed; awaiting final closure sign-off';
  }
  if (inc.status === 'relief') {
    return 'Relief operations active in sector';
  }
  return 'No resolution notes logged';
};

export const generateSITREPText = (incidents: Incident[]): string => {
  const { totalRecords, totalResolved, totalAssisted, totalReliefOperations, postDisasterIncidents } = calculateRecoveryMetrics(incidents);
  
  if (totalRecords === 0) {
    return 'No post-disaster recovery or closure records currently documented in VajraGrid.';
  }

  const lines = [
    'PALGHAR DISTRICT DISASTER MANAGEMENT AUTHORITY (DDMA)',
    'POST-DISASTER RECOVERY & INCIDENT CLOSURE SITUATION REPORT',
    `Date Generated: ${new Date().toISOString()}`,
    '------------------------------------------------------------',
    `Total Post-Disaster Records: ${totalRecords}`,
    `Officially Resolved / Closed: ${totalResolved}`,
    `Verified Citizens Assisted: ${totalAssisted}`,
    `Relief / Recovery Operations: ${totalReliefOperations}`,
    '------------------------------------------------------------',
    'INCIDENT AUDIT LOG:'
  ];

  for (const inc of postDisasterIncidents) {
    lines.push(
      `• [${inc.id.replace(/^inc_/, 'INC-').toUpperCase()}] ${inc.title || inc.type} (${inc.location.address || 'Palghar'})`
    );
    lines.push(`  Status: ${inc.status}`);
    lines.push(`  People Assisted: ${formatPeopleAssisted(inc)}`);
    lines.push(`  Relief Provisions: ${formatReliefProvisions(inc)}`);
    lines.push(`  Resolution: ${formatResolutionSummary(inc)}`);
  }

  return lines.join('\n');
};

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] Test ${total}: ${msg}`);
  } else {
    console.error(`  [FAIL] Test ${total}: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTests() {
  console.log('======================================================');
  console.log('   Post-Disaster Recovery & Situation Reports Audit   ');
  console.log('======================================================\n');

  const sampleIncidents: Incident[] = [
    // 1. Resolved with full relief details
    {
      id: 'inc_104',
      title: 'Drinking Water Shortage',
      description: 'Local supply contaminated.',
      location: { lat: 19.655, lng: 73.137, address: 'Wada Community Center' },
      timestamp: new Date().toISOString(),
      type: 'Supplies',
      urgency: 'Medium',
      status: 'resolved',
      reporterId: 'cit_1',
      reporterRole: 'citizen',
      source: 'Citizen Report',
      mediaUrls: [],
      reliefDetails: {
        peopleAssisted: 80,
        resourcesUsed: 2,
        reliefDistributed: '80 food packets, 5000L water',
        shelterStatus: '80 sheltered',
        responseDuration: '2.5 hours',
        resolutionNotes: 'Water pipeline repaired by Municipal Council.'
      }
    },
    // 2. Resolved WITHOUT notes or relief data
    {
      id: 'inc_105',
      title: 'Minor Road Clearing',
      description: 'Small branch on roadside.',
      location: { lat: 19.69, lng: 72.77, address: 'Boisar Road' },
      timestamp: new Date().toISOString(),
      type: 'Tree Fall',
      urgency: 'Low',
      status: 'resolved',
      reporterId: 'auth_1',
      reporterRole: 'authority',
      source: 'Authority Created',
      mediaUrls: []
    },
    // 3. Completed incident (in recovery phase) with partial relief data
    {
      id: 'inc_106',
      title: 'Evacuation from Low-Lying Sector',
      description: 'Residents moved to higher ground.',
      location: { lat: 19.70, lng: 72.80, address: 'Kelwa Sector' },
      timestamp: new Date().toISOString(),
      type: 'Flood',
      urgency: 'High',
      status: 'completed',
      reporterId: 'auth_1',
      reporterRole: 'authority',
      source: 'Authority Created',
      mediaUrls: [],
      reliefDetails: {
        peopleAssisted: 35,
        resourcesUsed: 1,
        reliefDistributed: '35 emergency dry food rations',
        shelterStatus: 'Temporary community hall',
        responseDuration: '4 hours'
      }
    },
    // 4. Incident in active relief stage
    {
      id: 'inc_107',
      title: 'Relief Camp Distribution',
      description: 'Distribution underway.',
      location: { lat: 19.80, lng: 72.75, address: 'Dahanu Camp' },
      timestamp: new Date().toISOString(),
      type: 'Supplies',
      urgency: 'Medium',
      status: 'relief',
      reporterId: 'vol_1',
      reporterRole: 'volunteer',
      source: 'Volunteer Report',
      mediaUrls: [],
      reliefDetails: {
        peopleAssisted: 50,
        resourcesUsed: 2,
        reliefDistributed: 'Blankets and dry rations',
        shelterStatus: 'Camp Alpha',
        responseDuration: 'Active'
      }
    },
    // 5. Active pending incident (MUST BE EXCLUDED)
    {
      id: 'inc_active_1',
      title: 'Active Flooding Report',
      description: 'Water rising.',
      location: { lat: 19.46, lng: 72.80, address: 'Virar Approach' },
      timestamp: new Date().toISOString(),
      type: 'Flood',
      urgency: 'Critical',
      status: 'pending',
      reporterId: 'cit_2',
      reporterRole: 'citizen',
      source: 'Citizen Report',
      mediaUrls: []
    },
    // 6. Active verified incident (MUST BE EXCLUDED)
    {
      id: 'inc_active_2',
      title: 'Fallen Tree on Road',
      description: 'Blocking lane.',
      location: { lat: 19.92, lng: 73.23, address: 'Jawhar Bypass' },
      timestamp: new Date().toISOString(),
      type: 'Tree Fall',
      urgency: 'Medium',
      status: 'verified',
      reporterId: 'auth_2',
      reporterRole: 'authority',
      source: 'Authority Created',
      mediaUrls: []
    },
    // 7. Dismissed / rejected incident (MUST BE EXCLUDED)
    {
      id: 'inc_dismissed_1',
      title: 'Spam Incident',
      description: 'False report.',
      location: { lat: 19.60, lng: 72.70, address: 'Unknown' },
      timestamp: new Date().toISOString(),
      type: 'Flood',
      urgency: 'Low',
      status: 'dismissed',
      reporterId: 'cit_3',
      reporterRole: 'citizen',
      source: 'Citizen Report',
      mediaUrls: []
    }
  ];

  console.log('--- 1. Filtering Logic & Post-Disaster Scope ---');
  const metrics = calculateRecoveryMetrics(sampleIncidents);
  assert(metrics.totalRecords === 4, 'Includes exactly 4 recovery/closure records and excludes active/dismissed');
  assert(metrics.postDisasterIncidents.some(i => i.id === 'inc_104'), 'Includes resolved inc_104');
  assert(metrics.postDisasterIncidents.some(i => i.id === 'inc_105'), 'Includes resolved inc_105 without notes');
  assert(metrics.postDisasterIncidents.some(i => i.id === 'inc_106'), 'Includes completed inc_106');
  assert(metrics.postDisasterIncidents.some(i => i.id === 'inc_107'), 'Includes relief inc_107');
  assert(!metrics.postDisasterIncidents.some(i => i.id === 'inc_active_1'), 'Excludes pending incident');
  assert(!metrics.postDisasterIncidents.some(i => i.id === 'inc_active_2'), 'Excludes verified incident');
  assert(!metrics.postDisasterIncidents.some(i => i.id === 'inc_dismissed_1'), 'Excludes dismissed incident');

  console.log('\n--- 2. Recovery Summary Metrics Calculation ---');
  assert(metrics.totalResolved === 2, 'Counts exactly 2 officially resolved incidents (inc_104 and inc_105)');
  assert(metrics.totalAssisted === 165, 'Sums citizens assisted correctly (80 + 35 + 50 = 165)');
  assert(metrics.totalReliefOperations === 3, 'Counts relief operations correctly (inc_104, inc_106, inc_107)');

  console.log('\n--- 3. Accurate Formatting & Honest Missing Field Handling ---');
  assert(formatPeopleAssisted(sampleIncidents[0]) === '80 citizens', 'Formats recorded people assisted');
  assert(formatPeopleAssisted(sampleIncidents[1]) === 'Not recorded', 'Handles missing people assisted honestly without fabricating');

  assert(formatReliefProvisions(sampleIncidents[0]) === '80 food packets, 5000L water', 'Formats recorded relief distributed');
  assert(formatReliefProvisions(sampleIncidents[1]) === 'No relief data recorded', 'Handles missing relief provisions honestly');

  assert(
    formatResolutionSummary(sampleIncidents[0]) === 'Water pipeline repaired by Municipal Council.',
    'Displays actual resolution note when available'
  );
  assert(
    formatResolutionSummary(sampleIncidents[1]) === 'Resolution recorded by EOC (No notes entered)',
    'Displays honest EOC resolution fallback when no custom note entered'
  );
  assert(
    formatResolutionSummary(sampleIncidents[2]) === 'Field operation completed; awaiting final closure sign-off',
    'Accurately conveys that completed incident has recovery ongoing'
  );
  assert(
    formatResolutionSummary(sampleIncidents[3]) === 'Relief operations active in sector',
    'Conveys active relief stage accurately'
  );

  console.log('\n--- 4. Data-Driven Post-Disaster Summary Generation ---');
  const sitrep = generateSITREPText(sampleIncidents);
  assert(sitrep.includes('Total Post-Disaster Records: 4'), 'SITREP contains accurate record count');
  assert(sitrep.includes('Verified Citizens Assisted: 165'), 'SITREP contains accurate assisted count');
  assert(sitrep.includes('INC-104'), 'SITREP includes stable INC-104 reference');
  assert(sitrep.includes('Water pipeline repaired by Municipal Council.'), 'SITREP preserves actual notes');
  assert(!sitrep.includes('INC-ACTIVE-1'), 'SITREP does not hallucinate active pending incidents');

  console.log('\n--- 5. Empty State Handling ---');
  const emptyMetrics = calculateRecoveryMetrics([]);
  assert(emptyMetrics.totalRecords === 0, 'Empty records handled cleanly');
  assert(emptyMetrics.totalAssisted === 0, 'Zero assistance handled cleanly');
  const emptySitrep = generateSITREPText([]);
  assert(emptySitrep.includes('No post-disaster recovery or closure records'), 'Empty SITREP provides honest state');

  console.log('\n======================================================');
  console.log(`   ALL ${passed} OF ${total} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
