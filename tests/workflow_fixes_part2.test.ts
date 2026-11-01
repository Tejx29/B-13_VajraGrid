/**
 * VajraGrid - Workflow Fixes and Integration Audit (Part 2 of 2)
 * Validates:
 * 1. Issue 4: Incident closure releases responders and resources idempotently
 * 2. Issue 5: Incident queue detail routing & ID resolution
 * 3. Issue 6: Resource inventory Add Resource Asset and Allocate actions
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

import { MockAPI, isClosedIncidentStatus } from '../src/services/mockApi';
import { Incident, Resource, Volunteer } from '../src/types';

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

async function runPart2Tests() {
  console.log('\n======================================================');
  console.log('   VajraGrid Workflow Fixes & Integration Audit (Part 2)');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // SECTION 1: ISSUE 4 - Closing an Incident Releases Responders & Resources
  // -------------------------------------------------------------------------
  console.log('--- Testing Issue 4: Incident Closure Reconciliation ---');

  // 1. Create a clean active operational incident
  const incidentA = await MockAPI.createIncident({
    title: 'Flash Flood Rescue at Manor Road',
    description: 'Rapidly rising water near Manor junction, vehicles stranded.',
    type: 'Flood',
    urgency: 'High',
    source: 'Authority Created',
    location: { lat: 19.7400, lng: 72.9050, address: 'Manor Highway Sector, Palghar' },
    reporterRole: 'authority'
  });
  assert(Boolean(incidentA?.id), 'Operational Incident A created successfully');
  assert(!isClosedIncidentStatus(incidentA.status), 'Incident A is initially active');

  // 2. Fetch volunteers and assign one to Incident A
  const volunteers = await MockAPI.getVolunteers();
  const availableVol = volunteers.find(v => v.status === 'available');
  assert(Boolean(availableVol), 'Found available responder in roster');
  const volId = availableVol!.id;

  const assignRes = await MockAPI.assignVolunteerToIncident(volId, incidentA.id, true);
  assert(assignRes.success, 'Responder assigned to Incident A');
  
  // Mobilize the responder to scene
  await MockAPI.mobilizeVolunteerToIncident(volId, incidentA.id, true);
  const deployedVol = (await MockAPI.getVolunteers()).find(v => v.id === volId);
  assert(deployedVol?.status === 'deployed', 'Responder is deployed to scene');
  assert(deployedVol?.currentAssignmentId === incidentA.id, 'Responder points to Incident A');

  // 3. Register and allocate a resource to Incident A
  const testPump = await MockAPI.addResource({
    name: 'Palghar Rapid Dewatering Pump Unit 9',
    type: 'Rescue Equipment',
    quantity: 1,
    location: { lat: 19.6967, lng: 72.7699, address: 'Central Fire Depot, Palghar' }
  });
  assert(Boolean(testPump?.id), 'Test resource pump registered in depot');
  assert(testPump.status === 'Available', 'New pump is initially Available');

  const allocRes = await MockAPI.allocateResource(testPump.id, incidentA.id);
  assert(allocRes.success, 'Pump allocated to Incident A');
  assert(allocRes.resource.status === 'Allocated', 'Pump status is Allocated');
  assert(allocRes.resource.currentIncidentId === incidentA.id, 'Pump points to Incident A');

  // Update pump to In Use
  await MockAPI.updateResourceStatus(testPump.id, 'In Use');
  const inUsePump = (await MockAPI.getResources()).find(r => r.id === testPump.id);
  assert(inUsePump?.status === 'In Use', 'Pump transitioned to In Use on scene');
  assert(inUsePump?.currentIncidentId === incidentA.id, 'Pump remains linked to Incident A while In Use');

  // 4. Resolve / Close Incident A
  const closureNote = 'Flood waters drained; stranded passengers safely evacuated.';
  const closedInc = await MockAPI.updateIncidentStatus(incidentA.id, 'resolved', closureNote, 'District Collectorate EOC');
  assert(closedInc?.status === 'resolved', 'Incident A status is resolved');
  assert(closedInc?.assignedVolunteerId === undefined, 'Incident A active responder pointer cleared');
  assert(closedInc?.assignedTeam === 'Unassigned', 'Incident A assigned team reset to Unassigned');

  // 5. Verify responder is released back to available
  const releasedVol = (await MockAPI.getVolunteers()).find(v => v.id === volId);
  assert(releasedVol?.status === 'available', 'Responder is released to available upon incident closure');
  assert(releasedVol?.currentAssignmentId === undefined, 'Responder assignment ID cleared');

  // 6. Verify resource is released back to Available in depot
  const releasedPump = (await MockAPI.getResources()).find(r => r.id === testPump.id);
  assert(releasedPump?.status === 'Available', 'Pump is released back to Available in depot');
  assert(releasedPump?.currentIncidentId === undefined, 'Pump currentIncidentId is cleared');

  // 7. Verify incident timeline history and recovery records are completely preserved
  assert(Boolean(closedInc?.timeline && closedInc.timeline.length >= 3), 'Incident timeline history preserved');
  const hasClosureEvent = closedInc?.timeline?.some(tl => tl.status === 'resolved' && tl.note?.includes('Flood waters drained'));
  assert(Boolean(hasClosureEvent), 'Closure event recorded in incident timeline');

  // 8. Test Idempotency: repeated closure does not duplicate release events or timeline entries
  const timelineLenBefore = closedInc?.timeline?.length || 0;
  const repeatClosed = await MockAPI.updateIncidentStatus(incidentA.id, 'resolved', closureNote, 'District Collectorate EOC');
  const timelineLenAfter = repeatClosed?.timeline?.length || 0;
  assert(timelineLenBefore === timelineLenAfter, 'Repeated closure attempt is idempotent (no duplicate timeline events)');

  // 9. Verify offline responders remain offline when incident is closed
  const offlineVol = volunteers.find(v => v.status === 'offline') || {
    id: 'vol_test_offline',
    name: 'Officer Deepak Shinde (Off-Duty)',
    skills: ['Command', 'Logistics'],
    status: 'offline' as const
  };

  const incidentB = await MockAPI.createIncident({
    title: 'Secondary Water Main Rupture',
    description: 'Minor rupture at Boisar Industrial Zone.',
    type: 'Infrastructure',
    urgency: 'Medium',
    location: { lat: 19.8030, lng: 72.7560, address: 'Boisar MIDC' },
    reporterRole: 'authority'
  });

  // Manually link an offline volunteer to test safety
  const currentIncidents = await MockAPI.getIncidents();
  const modifiedIncidents = currentIncidents.map(inc => inc.id === incidentB.id ? {
    ...inc,
    assignedVolunteerId: offlineVol.id,
    assignedTeam: offlineVol.name
  } : inc);
  const currentVols = await MockAPI.getVolunteers();
  const modifiedVols = currentVols.some(v => v.id === offlineVol.id)
    ? currentVols.map(v => v.id === offlineVol.id ? { ...v, status: 'offline' as const, currentAssignmentId: incidentB.id } : v)
    : [...currentVols, { ...offlineVol, status: 'offline' as const, currentAssignmentId: incidentB.id }];
  
  mockStorage.setItem('vajragrid_incidents', JSON.stringify(modifiedIncidents));
  mockStorage.setItem('vajragrid_volunteers', JSON.stringify(modifiedVols));

  // Now resolve Incident B
  await MockAPI.updateIncidentStatus(incidentB.id, 'resolved', 'Repairs completed');
  const volsAfterClosureB = await MockAPI.getVolunteers();
  const checkedOfflineVol = volsAfterClosureB.find(v => v.id === offlineVol.id);
  assert(checkedOfflineVol?.status === 'offline', 'Explicitly offline responder remains offline after incident closure');
  assert(checkedOfflineVol?.currentAssignmentId === undefined, 'Offline responder assignment pointer cleared');

  // 10. Verify closed incidents reject new assignments and allocations
  let assignRejected = false;
  try {
    await MockAPI.assignVolunteerToIncident(volId, incidentA.id);
  } catch (err: any) {
    assignRejected = true;
    assert(err.message.includes('cannot receive responder assignments'), 'Assignment to closed incident rejected with clear error');
  }
  assert(assignRejected, 'Service layer prevented assignment to closed incident');

  let allocRejected = false;
  try {
    await MockAPI.allocateResource(testPump.id, incidentA.id);
  } catch (err: any) {
    allocRejected = true;
    assert(err.message.includes('Cannot allocate resources'), 'Allocation to closed incident rejected with clear error');
  }
  assert(allocRejected, 'Service layer prevented resource allocation to closed incident');

  // 11. Test self-healing sync on hydration: stale relationships on closed incidents are repaired safely
  const stalePumpId = 'res_stale_test';
  const stalePump: Resource = {
    id: stalePumpId,
    name: 'Stale Generator Alpha',
    type: 'Rescue Equipment',
    quantity: 1,
    location: { lat: 19.6967, lng: 72.7699, address: 'Depot' },
    status: 'Allocated',
    currentIncidentId: incidentA.id // pointing to resolved incident!
  };
  const savedResources = await MockAPI.getResources();
  mockStorage.setItem('vajragrid_resources', JSON.stringify([...savedResources, stalePump]));

  // Re-fetch resources through getResources() which triggers syncResourcesWithIncidents
  const syncedResources = await MockAPI.getResources();
  const repairedPump = syncedResources.find(r => r.id === stalePumpId);
  assert(repairedPump?.status === 'Available', 'Hydration sync restored stale resource on closed incident to Available');
  assert(repairedPump?.currentIncidentId === undefined, 'Hydration sync cleared stale currentIncidentId');

  // -------------------------------------------------------------------------
  // SECTION 2: ISSUE 5 - Incident Queue Discovery & Details Navigation
  // -------------------------------------------------------------------------
  console.log('\n--- Testing Issue 5: Incident Queue Discovery & Details Navigation ---');

  // 1. Fetch incident by standard ID and normalized display ID
  const fetchedByCanonical = await MockAPI.getIncidentById(incidentA.id);
  assert(Boolean(fetchedByCanonical), 'Incident retrieved by canonical ID');
  assert(fetchedByCanonical?.id === incidentA.id, 'Retrieved incident matches canonical ID');

  const displayIdFormat = incidentA.id.replace(/^inc_/i, 'INC-').toUpperCase();
  const fetchedByDisplay = await MockAPI.getIncidentById(displayIdFormat);
  assert(Boolean(fetchedByDisplay), 'Incident retrieved by display ID format (INC-...)');
  assert(fetchedByDisplay?.id === incidentA.id, 'Normalized display ID resolves to correct stored record');

  // 2. Fetch with non-existent ID produces undefined (for not-found state handling)
  const nonExistent = await MockAPI.getIncidentById('inc_does_not_exist_99999');
  assert(nonExistent === undefined, 'Non-existent incident returns undefined instead of wrong incident');

  // 3. Test isClosedIncidentStatus helper
  assert(isClosedIncidentStatus('resolved'), 'isClosedIncidentStatus correctly identifies resolved');
  assert(isClosedIncidentStatus('completed'), 'isClosedIncidentStatus correctly identifies completed');
  assert(isClosedIncidentStatus('dismissed'), 'isClosedIncidentStatus correctly identifies dismissed');
  assert(!isClosedIncidentStatus('verified'), 'isClosedIncidentStatus returns false for verified');
  assert(!isClosedIncidentStatus('in_progress'), 'isClosedIncidentStatus returns false for in_progress');
  assert(!isClosedIncidentStatus('pending'), 'isClosedIncidentStatus returns false for pending');

  // -------------------------------------------------------------------------
  // SECTION 3: ISSUE 6 - Resource Stockpile Management (Add & Allocate)
  // -------------------------------------------------------------------------
  console.log('\n--- Testing Issue 6: Resource Stockpile Management ---');

  // 1. Add valid new resource asset
  const initialResourceCount = (await MockAPI.getResources()).length;
  const newAsset = await MockAPI.addResource({
    name: 'Talasari High-Capacity Potable Water Tanker 01',
    type: 'Water',
    quantity: 3,
    location: {
      lat: 20.1250,
      lng: 72.9150,
      address: 'Talasari Municipal Water Works, Palghar'
    }
  });

  assert(Boolean(newAsset?.id), 'New resource asset assigned stable unique ID');
  assert(newAsset.id.startsWith('res_'), 'Resource ID follows res_ prefix convention');
  assert(newAsset.name === 'Talasari High-Capacity Potable Water Tanker 01', 'Asset name recorded properly');
  assert(newAsset.type === 'Water', 'Asset category recorded properly');
  assert(newAsset.quantity === 3, 'Asset quantity recorded properly');
  assert(newAsset.status === 'Available', 'Asset initialized with Available status');

  const updatedResourceList = await MockAPI.getResources();
  assert(updatedResourceList.length === initialResourceCount + 1, 'Inventory total count incremented');
  const foundInInventory = updatedResourceList.find(r => r.id === newAsset.id);
  assert(Boolean(foundInInventory), 'New asset exists in persistent storage');

  // 2. Validation: Reject invalid resource asset submissions
  let emptyNameRejected = false;
  try {
    await MockAPI.addResource({
      name: '   ',
      type: 'Medical Kit',
      quantity: 1,
      location: { lat: 19.69, lng: 72.76, address: 'Depot' }
    });
  } catch (err: any) {
    emptyNameRejected = true;
    assert(err.message.includes('name is required'), 'Empty asset name rejected');
  }
  assert(emptyNameRejected, 'Service rejected resource with empty name');

  let invalidQtyRejected = false;
  try {
    await MockAPI.addResource({
      name: 'Invalid Qty Asset',
      type: 'Vehicle',
      quantity: 0,
      location: { lat: 19.69, lng: 72.76, address: 'Depot' }
    });
  } catch (err: any) {
    invalidQtyRejected = true;
    assert(err.message.includes('positive integer'), 'Zero or negative quantity rejected');
  }
  assert(invalidQtyRejected, 'Service rejected resource with invalid quantity');

  // 3. Allocate available asset to active incident
  const incidentC = await MockAPI.createIncident({
    title: 'Severe Water Shortage at Dahanu Camp',
    description: 'Relief camp housing 150 evacuees requires immediate potable water.',
    type: 'Flood',
    urgency: 'Critical',
    location: { lat: 19.9750, lng: 72.7290, address: 'Dahanu Coastal Sector, Palghar' },
    reporterRole: 'authority'
  });

  const allocWaterRes = await MockAPI.allocateResource(newAsset.id, incidentC.id);
  assert(allocWaterRes.success, 'Water tanker successfully allocated to Incident C');
  assert(allocWaterRes.resource.status === 'Allocated', 'Water tanker status changed to Allocated');
  assert(allocWaterRes.resource.currentIncidentId === incidentC.id, 'Water tanker points to Incident C');

  // 4. Confirm allocated resource appears in incident allocated resources list
  const incAllocated = await MockAPI.getAllocatedResources(incidentC.id);
  assert(incAllocated.some(r => r.id === newAsset.id), 'Allocated water tanker appears in Incident C allocated resources');

  // 5. Confirm timeline note logged on incident
  const incCAfterAlloc = await MockAPI.getIncidentById(incidentC.id);
  const allocTimeline = incCAfterAlloc?.timeline?.find(tl => tl.id?.includes(`res_${newAsset.id}`));
  assert(Boolean(allocTimeline), 'Incident timeline records resource allocation event');

  // 6. Prevent double-allocation of an already allocated asset
  const incidentD = await MockAPI.createIncident({
    title: 'Coastal Inundation at Kelva Beach',
    description: 'High tide surge threatening coastal fishermen huts.',
    type: 'Flood',
    urgency: 'High',
    location: { lat: 19.6150, lng: 72.7300, address: 'Kelva Beach, Palghar' },
    reporterRole: 'authority'
  });

  let doubleAllocRejected = false;
  try {
    await MockAPI.allocateResource(newAsset.id, incidentD.id);
  } catch (err: any) {
    doubleAllocRejected = true;
    assert(err.message.includes('already allocated'), 'Double allocation rejected with clear error');
  }
  assert(doubleAllocRejected, 'Service prevented double allocation of already allocated asset');

  // 7. Update status to In Use and verify single allocation record is preserved
  await MockAPI.updateResourceStatus(newAsset.id, 'In Use');
  const inUseWater = (await MockAPI.getResources()).find(r => r.id === newAsset.id);
  assert(inUseWater?.status === 'In Use', 'Water tanker updated to In Use');
  assert(inUseWater?.currentIncidentId === incidentC.id, 'Incident link preserved during In Use transition');

  // 8. Explicitly release resource back to depot
  const releaseRes = await MockAPI.releaseResource(newAsset.id);
  assert(releaseRes.success, 'Release resource call succeeded');
  assert(releaseRes.resource.status === 'Available', 'Resource returned to Available status');
  assert(releaseRes.resource.currentIncidentId === undefined, 'Resource currentIncidentId cleared');

  const incAllocatedAfterRelease = await MockAPI.getAllocatedResources(incidentC.id);
  assert(!incAllocatedAfterRelease.some(r => r.id === newAsset.id), 'Released resource no longer listed as allocated to Incident C');

  // 9. Re-allocate to Incident C, then close Incident C, and verify automatic release
  await MockAPI.allocateResource(newAsset.id, incidentC.id);
  const reAllocated = (await MockAPI.getResources()).find(r => r.id === newAsset.id);
  assert(reAllocated?.status === 'Allocated', 'Re-allocated resource to Incident C');

  await MockAPI.updateIncidentStatus(incidentC.id, 'resolved', 'Water supply restored via municipal tankers.');
  const postClosureResource = (await MockAPI.getResources()).find(r => r.id === newAsset.id);
  assert(postClosureResource?.status === 'Available', 'Resource automatically released back to Available upon incident resolution');
  assert(postClosureResource?.currentIncidentId === undefined, 'Resource assignment pointer cleared upon incident resolution');

  console.log('\n======================================================');
  console.log(`   ALL ${passedTests} OF ${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
  process.exit(0);
}

runPart2Tests().catch(err => {
  console.error('\nWorkflow Fixes Part 2 tests failed with error:', err);
  process.exit(1);
});
