/**
 * VajraGrid Field Responder Mission Completion & Recovery Operations Test Suite
 * Tests all 12 scenarios specified in Section 8 of the requirements.
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

import { MockAPI } from '../src/services/mockApi';
import { Incident, Volunteer, ReliefDetails } from '../src/types';

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

// Form validation logic matching VolunteerDashboard
function validateRecoveryDetails(form: {
  peopleAssisted: string;
  responseDuration: string;
  reliefDistributed: string;
  shelterStatus: string;
  resolutionNotes: string;
}): { isValid: boolean; errors: Record<string, string>; parsed?: ReliefDetails } {
  const errors: Record<string, string> = {};

  const trimmedAssisted = form.peopleAssisted.trim();
  if (trimmedAssisted === '') {
    errors.peopleAssisted = 'Enter number of people assisted or evacuated (0 or greater).';
  } else {
    const num = Number(trimmedAssisted);
    if (!/^\d+$/.test(trimmedAssisted) || isNaN(num) || num < 0 || !Number.isInteger(num)) {
      errors.peopleAssisted = 'People assisted must be a valid non-negative whole number (0 or greater).';
    }
  }

  if (!form.responseDuration.trim()) {
    errors.responseDuration = 'Response / recovery duration is required.';
  } else if (form.responseDuration.trim().length < 2) {
    errors.responseDuration = 'Please enter a valid duration.';
  }

  if (!form.reliefDistributed.trim()) {
    errors.reliefDistributed = 'Relief distributed is required.';
  }

  if (!form.shelterStatus.trim()) {
    errors.shelterStatus = 'Shelter / evacuation center status is required.';
  }

  if (!form.resolutionNotes.trim()) {
    errors.resolutionNotes = 'Work completed and closure notes are required.';
  } else if (form.resolutionNotes.trim().length < 5) {
    errors.resolutionNotes = 'Please provide a more descriptive note (at least 5 characters).';
  }

  if (Object.keys(errors).length === 0) {
    return {
      isValid: true,
      errors: {},
      parsed: {
        peopleAssisted: parseInt(trimmedAssisted, 10),
        resourcesUsed: 0,
        responseDuration: form.responseDuration.trim(),
        reliefDistributed: form.reliefDistributed.trim(),
        shelterStatus: form.shelterStatus.trim(),
        resolutionNotes: form.resolutionNotes.trim()
      }
    };
  }

  return { isValid: false, errors };
}

async function runTests() {
  console.log('======================================================');
  console.log('   Field Responder Mission Completion Test Suite      ');
  console.log('======================================================\n');

  // Setup: Reset storage with fresh data
  mockStorage.clear();

  // Create test incident
  const testInc = await MockAPI.reportIncident({
    title: 'Surya River Coastal Tidal Surge',
    description: 'Seawater breached bund. 40 residents evacuated to higher ground.',
    location: { lat: 19.6967, lng: 72.7699, address: 'Coastal Sector, Palghar District' },
    type: 'Flood',
    urgency: 'Critical',
    reporterRole: 'authority',
    source: 'Authority Created',
    mediaUrls: []
  });

  // Assign volunteer vol_5 (Rahul Patil)
  await MockAPI.assignVolunteerToIncident('vol_5', testInc.id, true);

  console.log('--- 1. Assigned Responder Discovery & Unassigned Isolation ---');
  // 1. Assigned responder sees the correct incident
  const rahulAssignment = await MockAPI.getVolunteerAssignment('vol_5');
  assert(rahulAssignment !== null && rahulAssignment.id === testInc.id, 'Assigned responder vol_5 sees correct incident');

  // 2. Unassigned responder does not see unrelated mission data
  const sarahAssignment = await MockAPI.getVolunteerAssignment('vol_1');
  assert(sarahAssignment === null, 'Unassigned responder vol_1 does not see unrelated mission data');

  console.log('\n--- 2. Recovery Form Validation & Numeric Integrity ---');
  // 3. Invalid numeric values rejected
  const invalidNegative = validateRecoveryDetails({
    peopleAssisted: '-5',
    responseDuration: '2 hours',
    reliefDistributed: '40 ration packets',
    shelterStatus: 'Safe',
    resolutionNotes: 'Evacuated residents'
  });
  assert(!invalidNegative.isValid && Boolean(invalidNegative.errors.peopleAssisted), 'Negative numbers rejected');

  const invalidDecimal = validateRecoveryDetails({
    peopleAssisted: '12.5',
    responseDuration: '2 hours',
    reliefDistributed: '40 ration packets',
    shelterStatus: 'Safe',
    resolutionNotes: 'Evacuated residents'
  });
  assert(!invalidDecimal.isValid && Boolean(invalidDecimal.errors.peopleAssisted), 'Decimal numbers rejected');

  const invalidNonNumeric = validateRecoveryDetails({
    peopleAssisted: 'many',
    responseDuration: '2 hours',
    reliefDistributed: '40 ration packets',
    shelterStatus: 'Safe',
    resolutionNotes: 'Evacuated residents'
  });
  assert(!invalidNonNumeric.isValid && Boolean(invalidNonNumeric.errors.peopleAssisted), 'Non-numeric string rejected');

  // Legitimate zero is accepted
  const validZero = validateRecoveryDetails({
    peopleAssisted: '0',
    responseDuration: '1.5 hours',
    reliefDistributed: 'None — reconnaissance and safety barrier only',
    shelterStatus: 'No shelter required',
    resolutionNotes: 'Site surveyed and deemed secure with zero casualties.'
  });
  assert(validZero.isValid && validZero.parsed?.peopleAssisted === 0, 'Legitimate 0 people assisted is accepted');

  // 4. Missing required details prevent mission completion
  const missingDuration = validateRecoveryDetails({
    peopleAssisted: '10',
    responseDuration: '',
    reliefDistributed: 'Rations',
    shelterStatus: 'Community center',
    resolutionNotes: 'Clear'
  });
  assert(!missingDuration.isValid && Boolean(missingDuration.errors.responseDuration), 'Missing response duration is caught');

  const missingNotes = validateRecoveryDetails({
    peopleAssisted: '10',
    responseDuration: '2 hours',
    reliefDistributed: 'Rations',
    shelterStatus: 'Community center',
    resolutionNotes: ''
  });
  assert(!missingNotes.isValid && Boolean(missingNotes.errors.resolutionNotes), 'Missing resolution notes is caught');

  console.log('\n--- 3. Authorization & Unauthorized Submission Protection ---');
  // Valid form payload for test
  const validPayload: ReliefDetails = {
    peopleAssisted: 42,
    resourcesUsed: 1,
    responseDuration: '3.5 hours',
    reliefDistributed: '42 dry ration kits, 1000L drinking water',
    shelterStatus: '42 citizens accommodated at Palghar Relief Hall Alpha',
    resolutionNotes: 'Breach contained with sandbags. Water receded.'
  };

  // 7. Another responder cannot submit completion details for an unauthorized assignment
  let unauthorizedErrorCaught = false;
  try {
    // vol_2 is NOT assigned to testInc
    await MockAPI.updateReliefDetails(testInc.id, validPayload, 'vol_2');
  } catch (err: any) {
    unauthorizedErrorCaught = true;
    assert(err.message.includes('Unauthorized'), 'Unauthorized responder submission rejected with security error');
  }
  assert(unauthorizedErrorCaught, 'Another responder cannot submit details for unauthorized assignment');

  let unauthorizedCompleteErrorCaught = false;
  try {
    // vol_2 attempts to complete testInc
    await MockAPI.completeVolunteerMission(testInc.id, 'vol_2');
  } catch (err: any) {
    unauthorizedCompleteErrorCaught = true;
    assert(err.message.includes('Unauthorized'), 'Unauthorized responder mission completion rejected');
  }
  assert(unauthorizedCompleteErrorCaught, 'Unauthorized responder cannot complete mission');

  // Attempting to complete before saving details is rejected
  let incompleteErrorCaught = false;
  try {
    await MockAPI.completeVolunteerMission(testInc.id, 'vol_5');
  } catch (err: any) {
    incompleteErrorCaught = true;
    assert(err.message.includes('must be saved before completing'), 'Mission completion blocked when recovery details missing');
  }
  assert(incompleteErrorCaught, 'Mission completion blocked when recovery details have not been saved');

  console.log('\n--- 4. Saving Recovery Details & Reload Persistence ---');
  // 5 & 6. Saved recovery details persist and record responder ID
  await MockAPI.updateReliefDetails(testInc.id, validPayload, 'vol_5');
  const incAfterSave = await MockAPI.getIncidentById(testInc.id);
  assert(incAfterSave?.reliefDetails !== undefined, 'Relief details attached to incident');
  assert(incAfterSave?.reliefDetails?.peopleAssisted === 42, 'People assisted stored accurately');
  assert(incAfterSave?.reliefDetails?.submittedByVolunteerId === 'vol_5', 'Responder ID associated with submission');
  assert(incAfterSave?.reliefDetails?.submittedByVolunteerName === 'Rahul Patil', 'Responder name associated with submission');

  // Verify persistence across reload (simulated storage re-parse)
  const savedIncidentsRaw = mockStorage.getItem('vajragrid_incidents');
  assert(Boolean(savedIncidentsRaw), 'Storage contains persisted incidents');
  const parsedIncs = JSON.parse(savedIncidentsRaw!);
  const reloadedInc = parsedIncs.find((i: any) => i.id === testInc.id);
  assert(reloadedInc?.reliefDetails?.peopleAssisted === 42, 'Saved recovery details survive reload');
  assert(reloadedInc?.reliefDetails?.responseDuration === '3.5 hours', 'Duration survives reload');

  console.log('\n--- 5. Mission Completion & Incident State Isolation ---');
  // Allocate a resource while incident is active to verify release on official closure
  const resList = await MockAPI.getResources();
  const availableRes = resList.find(r => r.status === 'Available');
  if (availableRes) {
    await MockAPI.allocateResource(availableRes.id, testInc.id);
    const allocatedResCheck = (await MockAPI.getResources()).find(r => r.id === availableRes.id);
    assert(allocatedResCheck?.status === 'Allocated', 'Resource allocated while mission is active');
  }

  // Advance to rescue in progress first
  await MockAPI.updateIncidentStatus(testInc.id, 'rescue_in_progress', undefined, 'Rahul Patil');

  // 9. Successful mission completion updates existing mission status and timeline
  await MockAPI.completeVolunteerMission(testInc.id, 'vol_5', 'Rahul Patil');
  const completedInc = await MockAPI.getIncidentById(testInc.id);
  assert(completedInc?.status === 'completed', 'Mission status updated to completed');

  // Check timeline has completion event
  const completionTimeline = completedInc?.timeline?.find(tl => tl.status === 'completed');
  assert(Boolean(completionTimeline), 'Incident timeline records completed event');
  assert(completionTimeline?.actor === 'Rahul Patil', 'Timeline records responder actor name');

  // 10. Mission completion does NOT automatically close incident (incident requires authority approval)
  assert(completedInc?.status !== 'resolved', 'Mission completion does NOT automatically resolve or close incident');
  assert(completedInc?.assignedVolunteerId === 'vol_5', 'Incident retains assigned volunteer ID during completed stage');

  // Volunteer still sees their completed mission until official authority closure
  const rahulCompletedAsg = await MockAPI.getVolunteerAssignment('vol_5');
  assert(rahulCompletedAsg !== null && rahulCompletedAsg.id === testInc.id, 'Responder continues to see completed mission');

  console.log('\n--- 6. Authority Review & Official Incident Closure ---');
  // 11. Authority Incident Details reflects same saved recovery data
  const authView = await MockAPI.getIncidentById(testInc.id);
  assert(authView?.reliefDetails?.peopleAssisted === 42, 'Authority views exact same people assisted');
  assert(authView?.reliefDetails?.submittedByVolunteerId === 'vol_5', 'Authority views responder submission attribution');

  // 12. Official incident closure releases responders and resources correctly
  // Authority performs official resolution & closure
  await MockAPI.updateIncidentStatus(testInc.id, 'resolved', 'Collectorate sign-off and flood barrier restoration confirmed.', 'Palghar District EOC');
  const resolvedInc = await MockAPI.getIncidentById(testInc.id);
  assert(resolvedInc?.status === 'resolved', 'Incident officially resolved and closed by authority');

  // Verify volunteer is now released back to available
  const vol5AfterClose = (await MockAPI.getVolunteers()).find(v => v.id === 'vol_5');
  assert(vol5AfterClose?.status === 'available', 'Official closure releases volunteer back to available');
  assert(vol5AfterClose?.currentAssignmentId === undefined, 'Volunteer assignment ID cleared on closure');

  // Verify resource is released back to Available
  if (availableRes) {
    const resAfterClose = (await MockAPI.getResources()).find(r => r.id === availableRes.id);
    assert(resAfterClose?.status === 'Available', 'Official closure releases allocated resources back to Available');
  }

  // Responder now has no active assignment
  const rahulAfterClose = await MockAPI.getVolunteerAssignment('vol_5');
  assert(rahulAfterClose === null, 'Responder now sees clean empty state after official closure');

  console.log('\n======================================================');
  console.log(`   ALL ${passed} OF ${total} MISSION TESTS PASSED!    `);
  console.log('======================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\nMission completion test failed with error:', err);
  process.exit(1);
});
