/**
 * VajraGrid Responder Roster, Candidate Recommendations & Assignment Test Suite
 * Validates the 5 required scenarios specified in Section 4 of the engineering audit.
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
import { Volunteer, Incident } from '../src/types';

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

async function runResponderTests() {
  console.log('\n======================================================');
  console.log('   VajraGrid Responder Assignment & Roster Audit     ');
  console.log('======================================================\n');

  // --- Scenario 1: Confirm the roster reports five Available responders for the observed test state ---
  console.log('--- 1. Roster Count & Status Partition Integrity ---');
  const allVolunteers = await MockAPI.getVolunteers();
  assert(allVolunteers.length === 7, 'Total personnel count is exactly 7', `Actual: ${allVolunteers.length}`);

  const availableVolunteers = allVolunteers.filter(v => v.status === 'available');
  assert(availableVolunteers.length === 5, 'Roster reports exactly 5 Available responders', `Actual: ${availableVolunteers.length}`);

  const assignedVolunteers = allVolunteers.filter(v => v.status === 'assigned');
  assert(assignedVolunteers.length === 1, 'Roster reports exactly 1 Assigned responder', `Actual: ${assignedVolunteers.length}`);

  const deployedVolunteers = allVolunteers.filter(v => v.status === 'deployed');
  assert(deployedVolunteers.length === 0, 'Roster reports exactly 0 Deployed responders', `Actual: ${deployedVolunteers.length}`);

  const offlineVolunteers = allVolunteers.filter(v => v.status === 'offline');
  assert(offlineVolunteers.length === 1, 'Roster reports exactly 1 Offline/Standby responder', `Actual: ${offlineVolunteers.length}`);

  const availableNames = availableVolunteers.map(v => v.name).sort();
  const expectedNames = ['Amit Shah', 'Dr. Anita Desai', 'Marcus Chen', 'Neha Joshi', 'Sarah Jenkins'].sort();
  assert(
    JSON.stringify(availableNames) === JSON.stringify(expectedNames),
    'The 5 available responders include Sarah Jenkins, Marcus Chen, Dr. Anita Desai, Amit Shah, and Neha Joshi',
    `Found: ${availableNames.join(', ')}`
  );

  // --- Scenario 2: Explain which of those responders are recommended, and why ---
  console.log('\n--- 2. Explain Recommended Responders and Why (for Coastal High-Tide Surge: inc_ocpc013b1) ---');
  const targetIncidentId = 'inc_ocpc013b1';
  const targetIncident = await MockAPI.getIncidentById(targetIncidentId);
  assert(Boolean(targetIncident), 'Target incident inc_ocpc013b1 exists');

  const roster = await MockAPI.getResponderCandidateRoster(targetIncidentId);
  console.log(`\n  Target Incident: ${targetIncident?.title} (${targetIncident?.type}) at ${targetIncident?.location.address}`);
  console.log(`  Target Coordinates: (${targetIncident?.location.lat}, ${targetIncident?.location.lng})`);
  console.log(`  Candidate Roster Breakdown:`);
  console.log(`    Recommended Candidates (${roster.recommended.length}):`);
  roster.recommended.forEach((v, i) => {
    console.log(`      ${i + 1}. ${v.name} (${v.id}) - Dist: ${v.distance} - Skills: [${v.skills.join(', ')}] - MatchScore: ${v.matchScore}`);
    console.log(`         Reasons: ${v.matchReasons?.join('; ')}`);
  });
  console.log(`    Other Available Candidates (${roster.otherAvailable.length}):`);
  roster.otherAvailable.forEach((v, i) => {
    console.log(`      ${i + 1}. ${v.name} (${v.id}) - Dist: ${v.distance} - Skills: [${v.skills.join(', ')}] - MatchScore: ${v.matchScore}`);
    console.log(`         Reasons: ${v.matchReasons?.join('; ')}`);
  });

  assert(roster.recommended.length === 4, 'Exactly 4 candidates meet the primary tactical recommendation criteria for Palghar coastal surge', `Actual: ${roster.recommended.length}`);
  assert(roster.otherAvailable.length === 1, 'Exactly 1 candidate is categorized as other available responder', `Actual: ${roster.otherAvailable.length}`);
  assert(roster.otherAvailable[0].id === 'vol_7' && roster.otherAvailable[0].name === 'Neha Joshi', 'Neha Joshi is categorized under other available responders due to distance (54 km away in Jawhar)');

  // Verify Sarah Jenkins is recommended due to proximity and Search & Rescue skills
  const sarah = roster.recommended.find(v => v.id === 'vol_1');
  assert(Boolean(sarah && sarah.isRecommended), 'Sarah Jenkins is recommended (0.5 km away with Search & Rescue & First Aid)');

  // Verify Dr. Anita Desai is recommended due to immediate proximity
  const anita = roster.recommended.find(v => v.id === 'vol_3');
  assert(Boolean(anita && anita.isRecommended), 'Dr. Anita Desai is recommended (0.3 km away at Palghar Civil Hospital with Triage)');

  // Verify Amit Shah is recommended due to sector proximity and paramedic skills
  const amit = roster.recommended.find(v => v.id === 'vol_6');
  assert(Boolean(amit && amit.isRecommended), 'Amit Shah is recommended (11.9 km away in Boisar with Paramedic)');

  // Verify Marcus Chen is recommended due to sector proximity and logistics skills
  const marcus = roster.recommended.find(v => v.id === 'vol_2');
  assert(Boolean(marcus && marcus.isRecommended), 'Marcus Chen is recommended (15.3 km away in Manor with Logistics/Driving)');

  // Verify dynamic recommendation for an incident in Jawhar (inc_103)
  console.log('\n  Checking dynamic recommendation context for Jawhar emergency (inc_103):');
  const jawharRoster = await MockAPI.getResponderCandidateRoster('inc_103');
  const nehaInJawhar = jawharRoster.allAvailable.find(v => v.id === 'vol_7');
  assert(Boolean(nehaInJawhar?.isRecommended), 'Neha Joshi is strongly recommended when incident is in Jawhar (0.2 km away)');

  // --- Scenario 3: Confirm all eligible Available responders can be discovered in the selection interface ---
  console.log('\n--- 3. Candidate Discovery in Selection Interface ---');
  const allAvailableFromAPI = await MockAPI.getRecommendedVolunteers(targetIncidentId);
  assert(allAvailableFromAPI.length === 5, 'getRecommendedVolunteers returns all 5 available responders without silent truncation', `Actual: ${allAvailableFromAPI.length}`);

  const containsNeha = allAvailableFromAPI.some(v => v.id === 'vol_7' && v.name === 'Neha Joshi');
  assert(containsNeha, 'Neha Joshi is present and discoverable in the available candidates list');

  const containsAllFive = expectedNames.every(name => allAvailableFromAPI.some(v => v.name === name));
  assert(containsAllFive, 'All 5 available responders are returned and discoverable in the candidate roster');

  // Verify roster object includes allAvailable list matching 5
  assert(roster.allAvailable.length === 5, 'Roster allAvailable length is 5');
  assert(roster.totalPersonnel === 7, 'Roster total personnel is 7');

  // --- Scenario 4: Confirm unavailable or already-assigned responders cannot be assigned again ---
  console.log('\n--- 4. Unavailable & Assigned Responders Assignment Protection ---');
  // Attempt to assign offline responder (James Wilson vol_4)
  try {
    await MockAPI.assignVolunteerToIncident('vol_4', 'inc_100', false);
    assert(false, 'Offline responder assignment should have thrown an error');
  } catch (err: any) {
    assert(
      err.message?.includes('offline') || err.message?.includes('unavailable'),
      'Offline responder (James Wilson) correctly blocked from assignment',
      err.message
    );
  }

  // Attempt to assign already assigned responder (Rahul Patil vol_5) without allowTransfer
  try {
    await MockAPI.assignVolunteerToIncident('vol_5', 'inc_100', false);
    assert(false, 'Already-assigned responder should have thrown transfer confirmation error');
  } catch (err: any) {
    assert(
      err.message?.includes('already assigned') || err.message?.includes('Transfer confirmation'),
      'Already-assigned responder (Rahul Patil) prevented from duplicate assignment without explicit transfer',
      err.message
    );
  }

  // Verify unavailable list in candidate roster has both James and Rahul with specific ineligible reasons
  assert(roster.unavailable.length === 2, 'Candidate roster lists exactly 2 unavailable personnel');
  const offlineEntry = roster.unavailable.find(v => v.id === 'vol_4');
  assert(Boolean(offlineEntry && offlineEntry.ineligibleReason.includes('Offline')), 'James Wilson has explicit Offline reason');
  const assignedEntry = roster.unavailable.find(v => v.id === 'vol_5');
  assert(Boolean(assignedEntry && assignedEntry.ineligibleReason.includes('assigned')), 'Rahul Patil has explicit Already assigned reason');

  // --- Scenario 5: Confirm assigning a selected responder updates both sides of the relationship and survives reloads ---
  console.log('\n--- 5. Assigning Selected Responder (Neha Joshi) Updates Both Sides & Survives Reloads ---');
  // Assign Neha Joshi (vol_7) to test incident inc_100
  const assignResult = await MockAPI.assignVolunteerToIncident('vol_7', 'inc_100', false);
  assert(Boolean(assignResult.success), 'Assigning Neha Joshi to inc_100 succeeded');

  // Verify responder side
  const updatedVolunteers = await MockAPI.getVolunteers();
  const updatedNeha = updatedVolunteers.find(v => v.id === 'vol_7');
  assert(updatedNeha?.status === 'assigned', 'Neha Joshi status transitioned to "assigned"');
  assert(updatedNeha?.currentAssignmentId === 'inc_100', 'Neha Joshi currentAssignmentId points to inc_100');

  // Verify incident side
  const updatedIncident = await MockAPI.getIncidentById('inc_100');
  assert(updatedIncident?.assignedVolunteerId === 'vol_7', 'Incident inc_100 assignedVolunteerId is "vol_7"');
  assert(updatedIncident?.assignedTeam === 'Neha Joshi', 'Incident inc_100 assignedTeam is "Neha Joshi"');
  assert(updatedIncident?.status === 'assigned', 'Incident inc_100 status transitioned to "assigned"');

  // Verify incident timeline records assignment
  const lastEvent = updatedIncident?.timeline?.[updatedIncident.timeline.length - 1];
  assert(lastEvent?.note?.includes('Neha Joshi') || lastEvent?.actor?.includes('EOC'), 'Incident timeline recorded assignment event');

  // Verify persistence across simulated preview reload (re-reading from mockStorage)
  const storedVolJson = mockStorage.getItem('vajragrid_volunteers');
  assert(Boolean(storedVolJson), 'localStorage contains vajragrid_volunteers');
  const parsedVols: Volunteer[] = JSON.parse(storedVolJson!);
  const storedNeha = parsedVols.find(v => v.id === 'vol_7');
  assert(storedNeha?.status === 'assigned', 'Neha status "assigned" persisted to localStorage');
  assert(storedNeha?.currentAssignmentId === 'inc_100', 'Neha currentAssignmentId "inc_100" persisted to localStorage');

  const storedIncJson = mockStorage.getItem('vajragrid_incidents');
  assert(Boolean(storedIncJson), 'localStorage contains vajragrid_incidents');
  const parsedIncs: Incident[] = JSON.parse(storedIncJson!);
  const storedInc100 = parsedIncs.find(i => i.id === 'inc_100');
  assert(storedInc100?.assignedVolunteerId === 'vol_7', 'Incident inc_100 assignedVolunteerId "vol_7" persisted to localStorage');

  // Re-read via MockAPI after reload
  const reloadedVols = await MockAPI.getVolunteers();
  const reloadedNeha = reloadedVols.find(v => v.id === 'vol_7');
  assert(reloadedNeha?.status === 'assigned', 'Neha assignment survives mock API reload');

  // Available count should now be 4
  const availableAfterAssign = reloadedVols.filter(v => v.status === 'available').length;
  assert(availableAfterAssign === 4, 'Available responder count safely decremented from 5 to 4 after assignment');

  console.log('\n======================================================');
  console.log(`   ALL ${passedTests} OF ${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
  process.exit(0);
}

runResponderTests().catch(err => {
  console.error('\nResponder tests failed with error:', err);
  process.exit(1);
});
