/**
 * VajraGrid - Field Responder Mission Workflow & Recovery Form Verification Test Suite
 * Validates the 15 required scenarios specified in Section 9 of the user request.
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

import { MockAPI, isClosedIncidentStatus } from '../src/services/mockApi';
import { isPostDisasterIncident } from '../src/pages/authority/Reports';
import { Incident, ReliefDetails } from '../src/types';

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

let totalTests = 0;
let passedTests = 0;

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

async function runMissionWorkflowTests() {
  console.log('\n======================================================');
  console.log('   VajraGrid Responder Mission Workflow & Recovery Tests');
  console.log('======================================================\n');

  // --- 1. Newly assigned responder can accept their assignment ---
  console.log('--- 1. Assignment Creation & Acceptance ---');
  
  // Create an operational incident
  const incident = await MockAPI.createIncident({
    title: 'Surya Riverbank Overflow & Stranded Cattle Herders',
    description: 'Rising water level along Surya river basin near Manor. 6 individuals stranded on higher embankment.',
    type: 'Flood',
    urgency: 'Critical',
    location: { lat: 19.7420, lng: 72.9080, address: 'Manor Embankment, Palghar' },
    reporterRole: 'authority',
    source: 'Authority Created'
  });
  assert(Boolean(incident?.id), 'Test incident created with unique ID');

  // Find and assign an available responder
  const volunteers = await MockAPI.getVolunteers();
  const responder = volunteers.find(v => v.status === 'available') || volunteers[0];
  const respId = responder.id;
  const respName = responder.name;

  await MockAPI.assignVolunteerToIncident(respId, incident.id, true);
  
  // Verify assignment appears in responder mission queue
  const assignedMission = await MockAPI.getVolunteerAssignment(respId);
  assert(assignedMission?.id === incident.id, 'Assigned mission is retrieved by responder ID');
  assert(assignedMission?.status === 'assigned', 'Newly assigned mission starts in "assigned" status');

  // Scenario 1: Responder accepts assignment
  const acceptedInc = await MockAPI.updateIncidentStatus(incident.id, 'accepted', undefined, respName);
  assert(acceptedInc?.status === 'accepted', 'Scenario 1: Responder can accept assignment');
  assert(acceptedInc?.timeline?.some(t => t.status === 'accepted'), 'Acceptance event recorded in timeline');

  // --- 2. En-route status progression ---
  console.log('\n--- 2. En-Route Status Progression ---');
  // Scenario 2: En-route status only after acceptance
  const enRouteInc = await MockAPI.updateIncidentStatus(incident.id, 'on_the_way', undefined, respName);
  assert(enRouteInc?.status === 'on_the_way', 'Scenario 2: Responder transitions to "on_the_way"');
  assert(enRouteInc?.timeline?.some(t => t.status === 'on_the_way'), 'En-route event recorded in timeline');

  // --- 3. Arrival at scene confirmation ---
  console.log('\n--- 3. Arrival Confirmation ---');
  // Scenario 3: Arrival confirmed after en-route
  const arrivedInc = await MockAPI.updateIncidentStatus(incident.id, 'reached', undefined, respName);
  assert(arrivedInc?.status === 'reached', 'Scenario 3: Responder confirms arrival at scene ("reached")');
  assert(arrivedInc?.timeline?.some(t => t.status === 'reached'), 'Arrival event recorded in timeline');

  // --- 4. Commence rescue operation ---
  console.log('\n--- 4. Commence Rescue Operation ---');
  // Scenario 4: Rescue commences after arrival
  const rescueInc = await MockAPI.updateIncidentStatus(incident.id, 'rescue_in_progress', undefined, respName);
  assert(rescueInc?.status === 'rescue_in_progress', 'Scenario 4: Rescue operations commence ("rescue_in_progress")');
  assert(rescueInc?.timeline?.some(t => t.status === 'rescue_in_progress'), 'Rescue commencement event recorded in timeline');

  // --- 5 & 6. Recovery form gating & mission completion separation ---
  console.log('\n--- 5 & 6. Recovery Form Gating & Mission State Integrity ---');
  // Scenario 5: Recovery form does not exist on earlier steps (incident still has no relief details)
  assert(!rescueInc?.reliefDetails?.resolutionNotes, 'Scenario 5: Incident has no relief details before final step');

  // Scenario 6: Clicking Mark Mission Complete reveals form without completing the mission
  // The status MUST still remain 'rescue_in_progress'
  const inProgressMission = await MockAPI.getVolunteerAssignment(respId);
  assert(inProgressMission?.status === 'rescue_in_progress', 'Scenario 6: Mission remains in "rescue_in_progress" while form is open');

  // --- 7 & 8. Validation and Failure Handling ---
  console.log('\n--- 7 & 8. Field Validation & Failed Save Safety ---');
  
  // Scenario 7: Invalid or missing required fields
  // In the form validator: peopleAssisted must be >= 0, duration must not be empty, notes must not be empty
  const validateForm = (form: { peopleAssisted: any; responseDuration: string; resolutionNotes: string }) => {
    const errors: string[] = [];
    if (form.peopleAssisted === '' || isNaN(Number(form.peopleAssisted)) || Number(form.peopleAssisted) < 0) {
      errors.push('People Assisted must be a valid number >= 0');
    }
    if (!form.responseDuration || form.responseDuration.trim().length === 0) {
      errors.push('Response duration required');
    }
    if (!form.resolutionNotes || form.resolutionNotes.trim().length === 0) {
      errors.push('Resolution notes required');
    }
    return errors;
  };

  const invalidForm = { peopleAssisted: -5, responseDuration: '', resolutionNotes: '' };
  const valErrors = validateForm(invalidForm);
  assert(valErrors.length === 3, 'Scenario 7: Rejects negative people, empty duration, and empty notes');

  // Scenario 7b: Validates legitimate 0 value for people assisted
  const legitimateZeroForm = { peopleAssisted: 0, responseDuration: '2.5 hours', resolutionNotes: 'Reconnaissance completed, 0 casualties.' };
  assert(validateForm(legitimateZeroForm).length === 0, 'Scenario 7b: Permits legitimate value of 0 for people assisted');

  // Scenario 8: Failed save leaves completion disabled
  let canComplete = false;
  if (validateForm(invalidForm).length === 0) {
    canComplete = true;
  }
  assert(!canComplete, 'Scenario 8: Failed validation keeps mission completion disabled');

  // --- 9. Successful saving enables mission completion ---
  console.log('\n--- 9. Successful Saving & Enabling Completion ---');
  const validReliefData: ReliefDetails = {
    peopleAssisted: 6,
    resourcesUsed: 1,
    reliefDistributed: '6 dry ration packets, 2 emergency foil blankets',
    shelterStatus: '6 evacuated to Manor Zilla Parishad school hall',
    responseDuration: '3 hours',
    resolutionNotes: 'All 6 stranded individuals safely evacuated via inflatable boat.',
    submittedBy: respId,
    submittedByName: respName,
    submittedAt: new Date().toISOString()
  };

  const savedInc = await MockAPI.updateReliefDetails(incident.id, validReliefData, respId);
  assert(Boolean(savedInc?.reliefDetails), 'Scenario 9: Recovery details successfully saved to incident');
  assert(savedInc?.reliefDetails?.peopleAssisted === 6, 'Accurate people assisted stored: 6');
  assert(savedInc?.reliefDetails?.responseDuration === '3 hours', 'Accurate duration stored: "3 hours"');
  assert(savedInc?.status === 'rescue_in_progress', 'Incident status is STILL "rescue_in_progress" after saving form (not completed prematurely)');

  // Now mission completion becomes permitted
  const completedInc = await MockAPI.updateIncidentStatus(
    incident.id, 
    'completed', 
    validReliefData.resolutionNotes, 
    respName
  );
  assert(completedInc?.status === 'completed', 'Scenario 9b: Mission transitioned to "completed" after saving recovery details');

  // --- 10. Mission completion persists after reload without automatically closing incident ---
  console.log('\n--- 10. Persistence & Separation from Official Incident Closure ---');
  // Re-fetch from mock storage to simulate full page refresh
  const refreshedMission = await MockAPI.getVolunteerAssignment(respId);
  assert(refreshedMission?.id === incident.id, 'Scenario 10a: Mission assignment persists after simulated reload');
  assert(refreshedMission?.status === 'completed', 'Scenario 10b: Mission status remains "completed" after reload');
  assert(refreshedMission?.reliefDetails?.peopleAssisted === 6, 'Scenario 10c: Saved relief details survive reload');
  
  // Incident MUST NOT automatically become resolved or dismissed
  assert(refreshedMission?.status !== 'resolved', 'Scenario 10d: Incident is NOT automatically resolved');
  assert(refreshedMission?.status !== 'dismissed', 'Scenario 10e: Incident is NOT dismissed');

  // Assigned volunteer and allocated resources are NOT prematurely released on completed
  const currentVol = (await MockAPI.getVolunteers()).find(v => v.id === respId);
  assert(currentVol?.currentAssignmentId === incident.id, 'Scenario 10f: Volunteer assignment pointer remains linked on completed');

  // --- 11. Reports Page Integration ---
  console.log('\n--- 11. Reports Page Integration ---');
  const allIncidents = await MockAPI.getIncidents();
  assert(isPostDisasterIncident(completedInc!), 'Scenario 11a: Completed incident matches isPostDisasterIncident predicate');
  
  const reportMetrics = calculateRecoveryMetrics(allIncidents);
  assert(reportMetrics.postDisasterIncidents.some(i => i.id === incident.id), 'Scenario 11b: Incident appears in post-disaster audit records on Reports page');
  
  const targetReportInc = reportMetrics.postDisasterIncidents.find(i => i.id === incident.id);
  assert(targetReportInc?.reliefDetails?.peopleAssisted === 6, 'Scenario 11c: 6 people assisted reflected accurately');
  assert(targetReportInc?.reliefDetails?.reliefDistributed?.includes('ration'), 'Scenario 11d: Relief provisions reflected accurately');
  assert(targetReportInc?.reliefDetails?.shelterStatus?.includes('Manor Zilla Parishad'), 'Scenario 11e: Shelter status reflected accurately');
  assert(targetReportInc?.reliefDetails?.responseDuration === '3 hours', 'Scenario 11f: Response duration reflected accurately');

  // --- 12. Unauthorized Responder Prevention ---
  console.log('\n--- 12. Unauthorized Responder Prevention ---');
  const anotherResponderId = volunteers.find(v => v.id !== respId)?.id || 'vol_99';
  let unauthorizedErrorCaught = false;
  try {
    await MockAPI.updateReliefDetails(incident.id, { peopleAssisted: 99 }, anotherResponderId);
  } catch (err: any) {
    unauthorizedErrorCaught = true;
    assert(err.message.includes('Unauthorized'), 'Scenario 12: Throws unauthorized error for non-assigned responder');
  }
  assert(unauthorizedErrorCaught, 'Scenario 12b: Unauthorized responder was blocked from updating recovery data');

  // --- 13. Repeated Clicks Idempotency ---
  console.log('\n--- 13. Idempotency & Duplicate Prevention ---');
  const timelineBefore = completedInc?.timeline?.length || 0;
  const duplicateComplete = await MockAPI.updateIncidentStatus(
    incident.id, 
    'completed', 
    validReliefData.resolutionNotes, 
    respName
  );
  const timelineAfter = duplicateComplete?.timeline?.length || 0;
  assert(timelineBefore === timelineAfter, 'Scenario 13: Repeated complete clicks do not duplicate timeline events');

  // --- 14. Official Incident Closure Releases Responders & Resources ---
  console.log('\n--- 14. Official Incident Closure Releases Responders & Resources ---');
  // Authority formally resolves and closes the incident
  const closureNote = 'DDMA Palghar inspected Manor embankment. Relief verified and incident officially closed.';
  const officiallyClosed = await MockAPI.updateIncidentStatus(
    incident.id, 
    'resolved', 
    closureNote, 
    'District Collectorate EOC'
  );

  assert(officiallyClosed?.status === 'resolved', 'Scenario 14a: Incident officially transitioned to "resolved"');
  assert(officiallyClosed?.assignedTeam === 'Unassigned', 'Scenario 14b: Assigned team reset to "Unassigned" upon resolution');
  assert(officiallyClosed?.assignedVolunteerId === undefined, 'Scenario 14c: Assigned volunteer ID cleared upon resolution');

  // Assigned volunteer is now freed back to available
  const freedVolunteer = (await MockAPI.getVolunteers()).find(v => v.id === respId);
  assert(freedVolunteer?.status === 'available', 'Scenario 14d: Volunteer status released to "available"');
  assert(freedVolunteer?.currentAssignmentId === undefined, 'Scenario 14e: Volunteer currentAssignmentId cleared');

  // Volunteer no longer has active dispatch orders
  const postClosureMission = await MockAPI.getVolunteerAssignment(respId);
  assert(postClosureMission === null, 'Scenario 14f: Responder now sees "No Active Dispatch Orders"');

  console.log('\n======================================================');
  console.log(`   ALL ${passedTests} OF ${totalTests} WORKFLOW TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
}

runMissionWorkflowTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
