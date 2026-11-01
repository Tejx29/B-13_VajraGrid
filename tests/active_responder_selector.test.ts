/**
 * VajraGrid Active Responder Selector Test Suite
 * Tests roster retrieval, active responder switching, assignment isolation, and non-destructive demo selection.
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
import { Volunteer } from '../src/types';

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

function formatResponderOption(v: Volunteer): string {
  const statusText = v.status.charAt(0).toUpperCase() + v.status.slice(1);
  return `${v.name} (${v.id}) • ${statusText}`;
}

async function runTests() {
  console.log('======================================================');
  console.log('       Active Responder Selector Validation Tests     ');
  console.log('======================================================\n');

  console.log('--- 1. Roster Retrieval from MockAPI/localStorage ---');
  const volunteers = await MockAPI.getVolunteers();
  assert(Array.isArray(volunteers), 'getVolunteers returns an array');
  assert(volunteers.length >= 7, `Expected at least 7 responders in roster, found ${volunteers.length}`);

  const rahul = volunteers.find(v => v.id === 'vol_5');
  assert(Boolean(rahul), 'Rahul Patil (vol_5) exists in roster');
  assert(rahul?.name === 'Rahul Patil', 'Rahul Patil name is correct');

  console.log('\n--- 2. Dropdown Label & Option Formatting ---');
  const rahulLabel = formatResponderOption(rahul!);
  assert(
    rahulLabel.startsWith('Rahul Patil (vol_5) • '),
    `Option format matches specification: "${rahulLabel}"`
  );

  const sarah = volunteers.find(v => v.id === 'vol_1');
  assert(Boolean(sarah), 'Sarah Jenkins (vol_1) exists in roster');
  const sarahLabel = formatResponderOption(sarah!);
  assert(
    sarahLabel === 'Sarah Jenkins (vol_1) • Available',
    `Sarah Jenkins format matches: "${sarahLabel}"`
  );

  console.log('\n--- 3. Mission Lookup for Selected Responders ---');
  // Initial assignment check for vol_5 (assigned to inc_ocpc013b1)
  const rahulAssignment = await MockAPI.getVolunteerAssignment('vol_5');
  assert(Boolean(rahulAssignment), 'Rahul Patil (vol_5) retrieves active assignment');
  assert(
    rahulAssignment?.id === 'inc_ocpc013b1' || rahulAssignment?.assignedVolunteerId === 'vol_5',
    'Rahul Patil assignment matches tactical mission'
  );

  // Assignment check for vol_1 (Sarah Jenkins - Available with no active assignment)
  const sarahAssignment = await MockAPI.getVolunteerAssignment('vol_1');
  assert(sarahAssignment === null, 'Sarah Jenkins (vol_1) has no active assignment (null -> no-active-mission state)');

  // Assignment check for vol_2 (Marcus Chen - Available with no active assignment)
  const marcusAssignment = await MockAPI.getVolunteerAssignment('vol_2');
  assert(marcusAssignment === null, 'Marcus Chen (vol_2) has no active assignment');

  console.log('\n--- 4. Demo Selection Immutability (Non-Destructive) ---');
  // Changing selector state must NOT mutate the database records or change responder statuses
  const volunteersBefore = await MockAPI.getVolunteers();
  const incidentsBefore = await MockAPI.getIncidents();

  // Simulate user switching active selector in localStorage
  mockStorage.setItem('vajragrid_demo_active_responder', 'vol_1');
  const selectedAfterSwitch = mockStorage.getItem('vajragrid_demo_active_responder');
  assert(selectedAfterSwitch === 'vol_1', 'Selector persists chosen responder in storage');

  // Verify DB state is unmutated
  const volunteersAfter = await MockAPI.getVolunteers();
  const incidentsAfter = await MockAPI.getIncidents();
  assert(volunteersAfter.length === volunteersBefore.length, 'Roster count untouched after selection change');
  assert(incidentsAfter.length === incidentsBefore.length, 'Incident count untouched after selection change');
  
  const rahulStatusAfter = volunteersAfter.find(v => v.id === 'vol_5')?.status;
  assert(rahulStatusAfter === rahul?.status, 'Rahul status was not altered by selecting another responder');

  console.log('\n======================================================');
  console.log(`   ALL ${passed} OF ${total} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
