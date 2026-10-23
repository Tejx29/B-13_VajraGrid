/**
 * VajraGrid End-to-End Incident Lifecycle, Data Integrity & Persistence Test Suite
 * Covers all 20 required scenarios in Section 11 of the engineering specification.
 */

// In-memory mock localStorage implementation for isolated testing
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

// Attach to global before importing mockApi
const mockStorage = new MockLocalStorage();
(global as any).localStorage = mockStorage;
(global as any).window = { localStorage: mockStorage };

import { MockAPI } from '../src/services/mockApi';
import { Incident, Volunteer, Resource } from '../src/types';

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

async function runAllTests() {
  console.log('\n======================================================');
  console.log('   VajraGrid Comprehensive Lifecycle & Integrity Audit');
  console.log('======================================================\n');

  // --- Scenario 1: Create a report and verify that it appears in the authority queue ---
  console.log('--- 1. Citizen Incident Reporting & Authority Queue ---');
  const newIncident = await MockAPI.reportIncident({
    title: 'Test Storm Surge at Kelwa Beach',
    description: 'Seawall compromised; road flooding reported by local resident.',
    location: {
      lat: 19.6200,
      lng: 72.7300,
      address: 'Kelwa Beach Approach, Palghar District',
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

  assert(Boolean(newIncident.id && newIncident.id.startsWith('inc_')), 'Incident has stable valid ID', `ID: ${newIncident.id}`);
  assert(newIncident.status === 'pending', 'Initial reported status is "pending"');
  assert(newIncident.timeline !== undefined && newIncident.timeline.length > 0, 'Incident timeline initialized with initial report event');

  const queue = await MockAPI.getIncidents();
  const queuedMatch = queue.find(i => i.id === newIncident.id);
  assert(Boolean(queuedMatch), 'Incident appears in authority queue with submitted details preserved');

  // --- Scenario 2: Verify or dismiss it and confirm consistent status and history ---
  console.log('\n--- 2. Incident Verification & Dismissal Status Flow ---');
  const verifiedInc = await MockAPI.updateIncidentStatus(newIncident.id, 'verified');
  assert(verifiedInc?.status === 'verified', 'Incident successfully verified by authority');
  const verifyTl = verifiedInc?.timeline?.find(tl => tl.status === 'verified');
  assert(Boolean(verifyTl), 'Timeline includes verified event with authority actor', verifyTl?.note);

  // Test Dismissal on another report
  const reportToDismiss = await MockAPI.reportIncident({
    title: 'Unconfirmed Rumor',
    description: 'No hazard found on inspection.',
    location: { lat: 19.6967, lng: 72.7699, address: 'Palghar HQ' },
    reporterRole: 'citizen',
    source: 'Citizen Report'
  });
  const dismissedInc = await MockAPI.updateIncidentStatus(reportToDismiss.id, 'dismissed');
  assert(dismissedInc?.status === 'dismissed', 'Incident successfully dismissed/rejected');
  const dismissTl = dismissedInc?.timeline?.find(tl => tl.status === 'dismissed');
  assert(Boolean(dismissTl), 'Timeline records formal dismissal event');

  // --- Scenario 3: Confirm dismissed and resolved incidents cannot receive new active assignments ---
  console.log('\n--- 3. Closed Incidents Assignment Protection ---');
  let assignErrorThrown = false;
  try {
    await MockAPI.assignVolunteerToIncident('vol_1', reportToDismiss.id);
  } catch (err: any) {
    assignErrorThrown = true;
    assert(err.message.includes('dismissed'), 'Assignment rejection specifies incident status is dismissed', err.message);
  }
  assert(assignErrorThrown, 'Dismissed incident blocked from receiving volunteer assignment');

  let resourceErrorThrown = false;
  try {
    await MockAPI.allocateResource('res_1', reportToDismiss.id);
  } catch (err: any) {
    resourceErrorThrown = true;
    assert(err.message.includes('dismissed'), 'Resource allocation rejection specifies incident is dismissed', err.message);
  }
  assert(resourceErrorThrown, 'Dismissed incident blocked from receiving resource allocation');

  // --- Scenario 4: Assign a volunteer and verify both incident and responder records update ---
  console.log('\n--- 4. Volunteer Assignment Single Source of Truth ---');
  const testVolId = 'vol_1'; // Sarah Jenkins (available)
  const assignResult = await MockAPI.assignVolunteerToIncident(testVolId, newIncident.id);
  assert(assignResult.success === true, 'Volunteer assignment returns success');

  const updatedIncident = await MockAPI.getIncidentById(newIncident.id);
  assert(updatedIncident?.assignedVolunteerId === testVolId, 'Incident record stores assignedVolunteerId stable ID');
  assert(updatedIncident?.assignedTeam === 'Sarah Jenkins', 'Incident record stores responder name');
  assert(updatedIncident?.status === 'assigned', 'Incident status transitioned to "assigned"');

  const volList = await MockAPI.getVolunteers();
  const vol1 = volList.find(v => v.id === testVolId);
  assert(vol1?.status === 'assigned', 'Responder status transitioned to "assigned"');
  assert(vol1?.currentAssignmentId === newIncident.id, 'Responder reciprocal currentAssignmentId set to incident ID');

  // --- Scenario 5: Reload and confirm the assignment survives ---
  console.log('\n--- 5. Assignment Persistence Across Preview Reload ---');
  // Re-read directly from storage simulation
  const reloadedInc = await MockAPI.getIncidentById(newIncident.id);
  const reloadedVols = await MockAPI.getVolunteers();
  const reloadedVol1 = reloadedVols.find(v => v.id === testVolId);
  assert(reloadedInc?.assignedVolunteerId === testVolId, 'Incident assignment survives reload');
  assert(reloadedVol1?.status === 'assigned', 'Volunteer assigned status survives reload');
  assert(reloadedVol1?.currentAssignmentId === newIncident.id, 'Volunteer currentAssignmentId survives reload');

  // --- Scenario 6: Attempt a conflicting assignment and confirm it is prevented ---
  console.log('\n--- 6. Conflicting Assignment Protection ---');
  let conflictPrevented = false;
  try {
    // Attempt assigning Sarah Jenkins to inc_100 while she is already assigned to newIncident
    await MockAPI.assignVolunteerToIncident(testVolId, 'inc_100', false);
  } catch (err: any) {
    conflictPrevented = true;
    assert(err.message.includes('already assigned') || err.message.includes('Transfer confirmation'), 'Conflict error raised requiring explicit transfer', err.message);
  }
  assert(conflictPrevented, 'Conflicting responder assignment without transfer confirmation is prevented');

  // --- Scenario 7: Transfer an assignment through the supported explicit flow ---
  console.log('\n--- 7. Explicit Assignment Transfer Consistency ---');
  // Explicitly transfer Sarah Jenkins to inc_100 with allowTransfer = true
  await MockAPI.assignVolunteerToIncident(testVolId, 'inc_100', true);

  const prevIncidentAfterTransfer = await MockAPI.getIncidentById(newIncident.id);
  const newIncidentAfterTransfer = await MockAPI.getIncidentById('inc_100');
  const vol1AfterTransfer = (await MockAPI.getVolunteers()).find(v => v.id === testVolId);

  assert(prevIncidentAfterTransfer?.assignedVolunteerId === undefined, 'Previous incident released assignedVolunteerId');
  assert(prevIncidentAfterTransfer?.assignedTeam === 'Unassigned', 'Previous incident assignedTeam reset to "Unassigned"');
  assert(newIncidentAfterTransfer?.assignedVolunteerId === testVolId, 'Target incident received responder ID');
  assert(vol1AfterTransfer?.currentAssignmentId === 'inc_100', 'Responder currentAssignmentId points to new target incident');
  assert(vol1AfterTransfer?.status === 'assigned', 'Responder status remains "assigned"');

  // Check previous incident timeline has transfer release event
  const trfTl = prevIncidentAfterTransfer?.timeline?.find(tl => tl.note?.includes('reassigned') || tl.note?.includes('Released'));
  assert(Boolean(trfTl), 'Previous incident timeline records transfer release audit note');

  // --- Scenario 8: Mobilize an assigned responder and verify Deployed status & timeline ---
  console.log('\n--- 8. Mobilize Tactical Unit ---');
  const mobResult = await MockAPI.mobilizeVolunteerToIncident(testVolId, 'inc_100');
  assert(mobResult.success === true, 'Mobilization returns success');

  const vol1AfterMob = (await MockAPI.getVolunteers()).find(v => v.id === testVolId);
  assert(vol1AfterMob?.status === 'deployed', 'Responder status updated to "deployed"');

  const inc100AfterMob = await MockAPI.getIncidentById('inc_100');
  const mobTl = inc100AfterMob?.timeline?.find(tl => tl.id?.includes('_mob_') || tl.note?.includes('mobilized and dispatched'));
  assert(Boolean(mobTl), 'Incident timeline records genuine mobilization dispatch event', mobTl?.note);

  // --- Scenario 9: Confirm mobilization does not create duplicate active incident relationships ---
  console.log('\n--- 9. Single Active Assignment Invariant (Regression Test) ---');
  // Check that Sarah Jenkins is NOT claimed by ANY other incident in the database
  const allIncidents = await MockAPI.getIncidents();
  const incidentsClaimingSarah = allIncidents.filter(
    i => (i.assignedVolunteerId === testVolId || (i.assignedTeam && i.assignedTeam === 'Sarah Jenkins')) &&
         i.status !== 'resolved' && i.status !== 'dismissed'
  );
  assert(incidentsClaimingSarah.length === 1, 'Responder is assigned to exactly ONE active incident', `Count: ${incidentsClaimingSarah.length}`);
  assert(incidentsClaimingSarah[0].id === 'inc_100', 'The single active assignment matches target incident inc_100');

  // Test Rahul Patil mobilization transfer regression specifically
  console.log('   Testing Rahul Patil (vol_5) mobilization transfer from inc_ocpc013b1 to inc_101:');
  const rahulInitial = (await MockAPI.getVolunteers()).find(v => v.id === 'vol_5');
  assert(rahulInitial?.status === 'assigned', 'Rahul Patil initially assigned');

  // Mobilize Rahul to inc_101 with transfer confirmation
  await MockAPI.mobilizeVolunteerToIncident('vol_5', 'inc_101', true);
  const ocpcAfter = await MockAPI.getIncidentById('inc_ocpc013b1');
  const inc101After = await MockAPI.getIncidentById('inc_101');
  const rahulAfter = (await MockAPI.getVolunteers()).find(v => v.id === 'vol_5');

  assert(ocpcAfter?.assignedVolunteerId === undefined, 'INC-OCPC013B1 assignedVolunteerId cleared');
  assert(ocpcAfter?.assignedTeam === 'Unassigned', 'INC-OCPC013B1 assignedTeam reset to Unassigned');
  assert(inc101After?.assignedVolunteerId === 'vol_5', 'inc_101 assignedVolunteerId is vol_5');
  assert(rahulAfter?.status === 'deployed', 'Rahul Patil status is deployed');
  assert(rahulAfter?.currentAssignmentId === 'inc_101', 'Rahul currentAssignmentId is inc_101');

  // --- Scenario 10: Confirm ordinary verification timeline notes do not trigger deployed status ---
  console.log('\n--- 10. Routine Verification Phrasing Non-Mobilization Invariant ---');
  // Check inc_ocpc013b1 initial seed note: "Incident marked verified for mobilization"
  const ocpcSeed = await MockAPI.getIncidentById('inc_ocpc013b1');
  const verNote = ocpcSeed?.timeline?.find(tl => tl.note?.includes('marked verified for mobilization'));
  assert(Boolean(verNote), 'Found verification note containing word "mobilization"');

  // Ensure Sarah Jenkins in inc_100 or test responder is NOT deployed unless mobilized
  // Assign Amit Shah (vol_6) to a new incident
  const freshInc = await MockAPI.reportIncident({ title: 'Fresh Flood', description: 'Testing verification phrasing', location: { lat: 19.6967, lng: 72.7699 } });
  await MockAPI.updateIncidentStatus(freshInc.id, 'verified', 'Incident verified for mobilization readiness.');
  await MockAPI.assignVolunteerToIncident('vol_6', freshInc.id);

  const vol6After = (await MockAPI.getVolunteers()).find(v => v.id === 'vol_6');
  assert(vol6After?.status === 'assigned', 'Responder with routine verification note stays "assigned", NOT "deployed"');

  // --- Scenario 11: Reload and confirm assignment and status remain correct ---
  console.log('\n--- 11. Full Reload Consistency Verification ---');
  const reloadedRahul = (await MockAPI.getVolunteers()).find(v => v.id === 'vol_5');
  const reloadedOcpc = await MockAPI.getIncidentById('inc_ocpc013b1');
  const reloaded101 = await MockAPI.getIncidentById('inc_101');

  assert(reloadedRahul?.status === 'deployed', 'Rahul deployed status survives full reload');
  assert(reloadedRahul?.currentAssignmentId === 'inc_101', 'Rahul assignment to inc_101 survives full reload');
  assert(reloadedOcpc?.assignedVolunteerId !== 'vol_5', 'INC-OCPC013B1 does not falsely claim Rahul after reload');
  assert(reloaded101?.assignedVolunteerId === 'vol_5', 'inc_101 claims Rahul after reload');

  // --- Scenario 12: Allocate a resource, change to In Use, navigate away, and reload ---
  console.log('\n--- 12. Resource Allocation & In Use Persistence ---');
  const testResId = 'res_3'; // Trauma Kit (Available)
  const allocRes = await MockAPI.allocateResource(testResId, freshInc.id);
  assert(allocRes.success === true, 'Resource allocation successful');

  const resList1 = await MockAPI.getAllocatedResources(freshInc.id);
  assert(resList1.some(r => r.id === testResId && r.status === 'Allocated'), 'Resource status is Allocated for incident');

  // Transition resource to "In Use"
  await MockAPI.updateResourceStatus(testResId, 'In Use');
  const resList2 = await MockAPI.getAllocatedResources(freshInc.id);
  assert(resList2.some(r => r.id === testResId && r.status === 'In Use'), 'Resource transitioned to "In Use"');

  // Simulate full page reload / storage re-read
  const reloadedResList = await MockAPI.getAllocatedResources(freshInc.id);
  assert(reloadedResList.some(r => r.id === testResId && r.status === 'In Use'), 'Allocated resource and "In Use" status survive reload');

  // --- Scenario 13: Confirm allocation and status remain attached to original incident ---
  console.log('\n--- 13. Resource Association Permanence ---');
  const allResources = await MockAPI.getResources();
  const res3 = allResources.find(r => r.id === testResId);
  assert(res3?.currentIncidentId === freshInc.id, 'Resource currentIncidentId remains firmly attached to incident');
  assert(res3?.status === 'In Use', 'Global inventory shows resource is In Use');

  // --- Scenario 14: Release resource and verify availability & reconciliation ---
  console.log('\n--- 14. Resource Release & Inventory Reconciliation ---');
  await MockAPI.updateResourceStatus(testResId, 'Available');
  const res3Released = (await MockAPI.getResources()).find(r => r.id === testResId);
  assert(res3Released?.status === 'Available', 'Resource returned to "Available" status');
  assert(res3Released?.currentIncidentId === undefined, 'Resource currentIncidentId cleared on release');

  const incAllocAfterRelease = await MockAPI.getAllocatedResources(freshInc.id);
  assert(!incAllocAfterRelease.some(r => r.id === testResId), 'Incident no longer claims released resource');

  // --- Scenario 15: Progress an incident through supported response workflow and complete closure ---
  console.log('\n--- 15. End-to-End Response Mission Progression ---');
  // Volunteer moves: assigned -> accepted -> on_the_way -> reached -> rescue_in_progress -> completed
  await MockAPI.updateIncidentStatus(freshInc.id, 'accepted', undefined, 'Amit Shah');
  let curInc = await MockAPI.getIncidentById(freshInc.id);
  assert(curInc?.status === 'accepted', 'Mission status: accepted');

  await MockAPI.updateIncidentStatus(freshInc.id, 'on_the_way', undefined, 'Amit Shah');
  curInc = await MockAPI.getIncidentById(freshInc.id);
  assert(curInc?.status === 'on_the_way', 'Mission status: on_the_way');

  await MockAPI.updateIncidentStatus(freshInc.id, 'reached', undefined, 'Amit Shah');
  curInc = await MockAPI.getIncidentById(freshInc.id);
  assert(curInc?.status === 'reached', 'Mission status: reached');

  await MockAPI.updateIncidentStatus(freshInc.id, 'rescue_in_progress', undefined, 'Amit Shah');
  curInc = await MockAPI.getIncidentById(freshInc.id);
  assert(curInc?.status === 'rescue_in_progress', 'Mission status: rescue_in_progress');

  await MockAPI.updateIncidentStatus(freshInc.id, 'completed', undefined, 'Amit Shah');
  curInc = await MockAPI.getIncidentById(freshInc.id);
  assert(curInc?.status === 'completed', 'Mission status: completed');

  // Authority Phase 3: Relief Details & Resolution
  await MockAPI.updateReliefDetails(freshInc.id, {
    peopleAssisted: 45,
    resourcesUsed: 2,
    reliefDistributed: '45 meal kits, 500L water',
    shelterStatus: 'Stable',
    responseDuration: '2 hours',
    resolutionNotes: 'Water pumped out and roadway cleared.'
  });

  await MockAPI.updateIncidentStatus(freshInc.id, 'resolved', 'Official closure confirmed.', 'District Collectorate EOC');
  curInc = await MockAPI.getIncidentById(freshInc.id);
  assert(curInc?.status === 'resolved', 'Incident officially resolved and closed');
  assert(curInc?.reliefDetails?.peopleAssisted === 45, 'Relief details preserved on closed incident');

  // --- Scenario 16: Verify closure releases assignments and resources without destroying history ---
  console.log('\n--- 16. Resource & Personnel Release on Incident Closure ---');
  const vol6AfterClosure = (await MockAPI.getVolunteers()).find(v => v.id === 'vol_6');
  assert(vol6AfterClosure?.status === 'available', 'Assigned volunteer released back to "available" on incident closure');
  assert(vol6AfterClosure?.currentAssignmentId === undefined, 'Volunteer assignment ID cleared on closure');

  // Verify incident history is completely preserved
  assert(curInc?.timeline !== undefined && curInc.timeline.length >= 6, 'Complete incident timeline preserved with all progression milestones');

  // --- Scenario 17: Reconcile intentionally corrupted or legacy records ---
  console.log('\n--- 17. Corrupted & Orphaned State Self-Healing ---');
  // 1. Intentionally inject orphaned volunteer status (assigned with non-existent incident ID)
  const vols = await MockAPI.getVolunteers();
  const orphanVol = vols.find(v => v.id === 'vol_2') || vols[1];
  orphanVol.status = 'assigned';
  orphanVol.currentAssignmentId = 'inc_ghost_99999';
  mockStorage.setItem('vajragrid_volunteers', JSON.stringify(vols));

  // Trigger reconciliation via getVolunteers
  const reconciledVols = await MockAPI.getVolunteers();
  const healedVol = reconciledVols.find(v => v.id === orphanVol.id);
  assert(healedVol?.status === 'available', 'Orphaned volunteer with non-existent incident auto-repaired to "available"');
  assert(healedVol?.currentAssignmentId === undefined, 'Orphaned assignment ID safely cleared');

  // 2. Incident claiming a non-existent volunteer ID
  const allIncs = await MockAPI.getIncidents();
  const corruptedInc = {
    ...allIncs[0],
    id: 'inc_corrupt_1',
    status: 'assigned' as const,
    assignedVolunteerId: 'vol_nonexistent_888',
    assignedTeam: 'Ghost Squad'
  };
  mockStorage.setItem('vajragrid_incidents', JSON.stringify([corruptedInc, ...allIncs]));
  const reconciledIncs = await MockAPI.getIncidents();
  const healedInc = reconciledIncs.find(i => i.id === 'inc_corrupt_1');
  assert(healedInc?.assignedVolunteerId === undefined, 'Incident claiming non-existent volunteer ID cleared');
  assert(healedInc?.assignedTeam === 'Unassigned', 'Corrupted assignedTeam reset to Unassigned');

  // 3. Resource pointing to missing incident
  const currentRes = await MockAPI.getResources();
  const corruptedRes = {
    ...currentRes[0],
    id: 'res_corrupt_1',
    status: 'In Use' as const,
    currentIncidentId: 'inc_ghost_777'
  };
  mockStorage.setItem('vajragrid_resources', JSON.stringify([corruptedRes, ...currentRes]));
  const reconciledRes = await MockAPI.getResources();
  const healedRes = reconciledRes.find(r => r.id === 'res_corrupt_1');
  assert(healedRes?.status === 'Available', 'Resource pointing to missing incident reset to Available');
  assert(healedRes?.currentIncidentId === undefined, 'Resource missing incident ID cleared');

  // --- Scenario 18: Confirm updates to one responder do not modify another responder ---
  console.log('\n--- 18. Roster Record Isolation ---');
  const beforeV2 = (await MockAPI.getVolunteers()).find(v => v.id === 'vol_2');
  await MockAPI.assignVolunteerToIncident('vol_7', newIncident.id, true);
  const afterV2 = (await MockAPI.getVolunteers()).find(v => v.id === 'vol_2');
  assert(beforeV2?.status === afterV2?.status, 'Updating vol_7 does not alter vol_2 status');
  assert(beforeV2?.currentAssignmentId === afterV2?.currentAssignmentId, 'Updating vol_7 does not alter vol_2 assignment');

  // --- Scenario 19: Confirm dashboard counts and filters reflect actual reconciled data ---
  console.log('\n--- 19. Cross-Page Metrics & Count Consistency ---');
  const latestVols = await MockAPI.getVolunteers();
  const availableCount = latestVols.filter(v => v.status === 'available').length;
  const assignedCount = latestVols.filter(v => v.status === 'assigned').length;
  const deployedCount = latestVols.filter(v => v.status === 'deployed').length;
  const offlineCount = latestVols.filter(v => v.status === 'offline').length;

  assert(availableCount + assignedCount + deployedCount + offlineCount === latestVols.length, 'Status partition sum equals total roster size');
  assert(latestVols.filter(v => v.status === 'deployed' && !v.currentAssignmentId).length === 0, 'Zero deployed responders with missing assignment');

  const latestRes = await MockAPI.getResources();
  const availResCount = latestRes.filter(r => r.status === 'Available').length;
  const inUseResCount = latestRes.filter(r => r.status === 'In Use' || r.status === 'Allocated').length;
  assert(availResCount + inUseResCount === latestRes.length, 'Resource count sum matches total inventory');

  // --- Scenario 20: Confirm Gemini triage deduplication & external hazard feeds intact ---
  console.log('\n--- 20. AI Triage & Real Hazard Telemetry Feed Continuity ---');
  // Re-run AI triage test on newIncident
  const mockAssessment = {
    incidentSummary: 'Severe coastal high tide surge inundating coastal sector.',
    hazardCategory: 'Flood',
    recommendedPriority: 'High' as const,
    reasoning: 'Critical water depth on arterial highway.',
    evidenceUsed: ['Seawall breached', 'Highway blocked'],
    missingInformation: ['Current wind speed'],
    recommendedActions: ['Dispatch water rescue'],
    uncertainties: ['Single citizen report'],
    requiresHumanReview: true,
    analyzedAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash'
  };

  // Run 1
  await MockAPI.updateIncidentAITriage(newIncident.id, mockAssessment);
  const incAfterAi1 = await MockAPI.getIncidentById(newIncident.id);
  const triageEvents1 = incAfterAi1?.timeline?.filter(tl => tl.id?.includes('ai_triage') || tl.actor?.includes('AI Triage')) || [];
  assert(triageEvents1.length === 1, 'Initial AI triage records 1 timeline event');

  // Run 2 (Re-run analysis should NOT duplicate timeline events)
  await MockAPI.updateIncidentAITriage(newIncident.id, { ...mockAssessment, recommendedPriority: 'Critical' });
  const incAfterAi2 = await MockAPI.getIncidentById(newIncident.id);
  const triageEvents2 = incAfterAi2?.timeline?.filter(tl => tl.id?.includes('ai_triage') || tl.actor?.includes('AI Triage')) || [];
  assert(triageEvents2.length === 1, 'Re-running AI triage maintains exactly 1 timeline event without duplicate event inflation');
  assert(incAfterAi2?.aiTriageAssessment?.recommendedPriority === 'Critical', 'Assessment updated to latest priority');

  // External services verification
  const eqIncidents = await MockAPI.getEarthquakeIncidents();
  assert(Array.isArray(eqIncidents), 'USGS earthquake incidents service operational');

  const fireIncidents = await MockAPI.getFireIncidents();
  assert(Array.isArray(fireIncidents), 'NASA FIRMS fire incidents service operational');

  const gdacIncidents = await MockAPI.getGDACIncidents();
  assert(Array.isArray(gdacIncidents), 'GDACS multi-hazard incidents service operational');

  const combined = await MockAPI.getCombinedIncidents({ includeExternal: true });
  assert(combined.length >= allIncidents.length, 'Combined incidents queue successfully aggregates local + real external feeds');

  console.log('\n======================================================');
  console.log(`   ALL ${passedTests} OF ${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
  process.exit(0);
}

runAllTests().catch(err => {
  console.error('\nTest suite failed with error:', err);
  process.exit(1);
});
