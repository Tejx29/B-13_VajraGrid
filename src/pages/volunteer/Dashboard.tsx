import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { 
  ShieldAlert, MapPin, Clock, CheckCircle, Navigation, 
  PlayCircle, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, 
  Save, AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { MockAPI } from '../../services/mockApi';
import { Incident, Volunteer, ReliefDetails } from '../../types';

export function VolunteerDashboard() {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  
  // Determine initial volunteer ID from logged-in user or persisted selection
  const defaultVolunteerId = (user?.id && user.id.startsWith('vol_')) 
    ? user.id 
    : (user?.email?.toLowerCase().includes('sarah') ? 'vol_1' 
      : user?.email?.toLowerCase().includes('marcus') ? 'vol_2' 
      : user?.email?.toLowerCase().includes('anita') ? 'vol_3'
      : user?.email?.toLowerCase().includes('james') ? 'vol_4'
      : user?.email?.toLowerCase().includes('rahul') ? 'vol_5'
      : user?.email?.toLowerCase().includes('amit') ? 'vol_6'
      : user?.email?.toLowerCase().includes('neha') ? 'vol_7'
      : 'vol_5');

  const [activeVolunteerId, setActiveVolunteerId] = useState<string>(() => {
    return localStorage.getItem('vajragrid_active_volunteer_id') || defaultVolunteerId;
  });

  const [responderProfile, setResponderProfile] = useState<Volunteer | null>(null);
  const [assignment, setAssignment] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Recovery Form State (revealed only at final mission step)
  const [isRecoveryFormRevealed, setIsRecoveryFormRevealed] = useState(false);
  const [isSavingRelief, setIsSavingRelief] = useState(false);
  const [isCompletingMission, setIsCompletingMission] = useState(false);
  const [recoveryDetailsSaved, setRecoveryDetailsSaved] = useState(false);
  const [formValidationErrors, setFormValidationErrors] = useState<string[]>([]);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const [reliefForm, setReliefForm] = useState<{
    peopleAssisted: string;
    responseDuration: string;
    reliefDistributed: string;
    shelterStatus: string;
    resolutionNotes: string;
  }>({
    peopleAssisted: '0',
    responseDuration: '',
    reliefDistributed: '',
    shelterStatus: '',
    resolutionNotes: ''
  });

  const recoveryFormRef = useRef<HTMLDivElement | null>(null);

  const fetchAssignment = async (volId: string = activeVolunteerId) => {
    try {
      const [asg, vList] = await Promise.all([
        MockAPI.getVolunteerAssignment(volId),
        MockAPI.getVolunteers()
      ]);
      setVolunteers(vList);
      setAssignment(asg || null);
      
      const profile = vList.find(v => v.id === volId);
      if (profile) setResponderProfile(profile);

      // If assignment has already saved relief details, initialize form from them
      if (asg?.reliefDetails) {
        setReliefForm({
          peopleAssisted: typeof asg.reliefDetails.peopleAssisted === 'number' 
            ? String(asg.reliefDetails.peopleAssisted) 
            : '0',
          responseDuration: asg.reliefDetails.responseDuration || '',
          reliefDistributed: asg.reliefDetails.reliefDistributed || '',
          shelterStatus: asg.reliefDetails.shelterStatus || '',
          resolutionNotes: asg.reliefDetails.resolutionNotes || ''
        });

        // If valid recovery details were previously saved, maintain the saved state
        if (asg.reliefDetails.resolutionNotes && asg.reliefDetails.responseDuration) {
          setRecoveryDetailsSaved(true);
          setIsRecoveryFormRevealed(true);
        }
      } else {
        // Reset recovery form states for new active assignment without previous recovery data
        setRecoveryDetailsSaved(false);
        if (asg?.status !== 'rescue_in_progress') {
          setIsRecoveryFormRevealed(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch volunteer assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAssignment(activeVolunteerId);
    
    // Polling for updates from authority dispatch
    const interval = setInterval(() => {
      fetchAssignment(activeVolunteerId);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeVolunteerId]);

  const handleSwitchResponder = (newVolId: string) => {
    setActiveVolunteerId(newVolId);
    localStorage.setItem('vajragrid_active_volunteer_id', newVolId);
    setSaveErrorMessage(null);
    setFormValidationErrors([]);
    setIsRecoveryFormRevealed(false);
    setRecoveryDetailsSaved(false);
  };

  const getActorName = () => {
    return responderProfile?.name || user?.name || `Field Responder (${activeVolunteerId})`;
  };

  // --------------------------------------------------------------------------
  // Sequential Mission Steps Actions
  // --------------------------------------------------------------------------

  // Step 1: Accept Assignment
  const handleAcceptAssignment = async () => {
    if (!assignment || actionLoading) return;
    if (assignment.status !== 'assigned') return;
    setActionLoading(true);
    try {
      await MockAPI.updateIncidentStatus(assignment.id, 'accepted', undefined, getActorName());
      await fetchAssignment();
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Mark En Route (On the Way)
  const handleMarkEnRoute = async () => {
    if (!assignment || actionLoading) return;
    if (assignment.status !== 'accepted') return;
    setActionLoading(true);
    try {
      await MockAPI.updateIncidentStatus(assignment.id, 'on_the_way', undefined, getActorName());
      await fetchAssignment();
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Confirm Arrival at Scene
  const handleConfirmArrival = async () => {
    if (!assignment || actionLoading) return;
    if (assignment.status !== 'on_the_way') return;
    setActionLoading(true);
    try {
      await MockAPI.updateIncidentStatus(assignment.id, 'reached', undefined, getActorName());
      await fetchAssignment();
    } finally {
      setActionLoading(false);
    }
  };

  // Step 4: Commence Rescue Operation
  const handleCommenceRescue = async () => {
    if (!assignment || actionLoading) return;
    if (assignment.status !== 'reached') return;
    setActionLoading(true);
    try {
      await MockAPI.updateIncidentStatus(assignment.id, 'rescue_in_progress', undefined, getActorName());
      await fetchAssignment();
    } finally {
      setActionLoading(false);
    }
  };

  // Step 5: Mark Mission Complete (Reveals Recovery Form)
  const handleRevealRecoveryForm = () => {
    setIsRecoveryFormRevealed(true);
    setFormValidationErrors([]);
    setSaveErrorMessage(null);
    setTimeout(() => {
      recoveryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  // Save Recovery Details (Only step that unlocks Confirm Mission Complete)
  const handleSaveRecoveryDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!assignment || isSavingRelief) return;

    // Authorization safeguard: ensure this responder is legitimately assigned
    if (assignment.assignedVolunteerId && assignment.assignedVolunteerId !== activeVolunteerId) {
      setSaveErrorMessage(`Authorization Error: You (${activeVolunteerId}) are not assigned to this incident (${assignment.assignedVolunteerId}).`);
      return;
    }

    setSaveErrorMessage(null);
    const errors: string[] = [];

    // Validate People Assisted: must be a legitimate number >= 0 (allows 0 legitimately)
    const rawPeople = reliefForm.peopleAssisted?.trim();
    if (rawPeople === '' || isNaN(Number(rawPeople)) || Number(rawPeople) < 0) {
      errors.push('People Assisted / Evacuated must be a valid number (0 or greater).');
    }

    // Validate Response Duration: required
    if (!reliefForm.responseDuration || reliefForm.responseDuration.trim().length === 0) {
      errors.push('Response / Recovery Duration is required (e.g., "3.5 hours" or "45 minutes").');
    }

    // Validate Resolution Notes: required
    if (!reliefForm.resolutionNotes || reliefForm.resolutionNotes.trim().length === 0) {
      errors.push('Resolution Notes & Closure Comments are required.');
    }

    if (errors.length > 0) {
      setFormValidationErrors(errors);
      setRecoveryDetailsSaved(false);
      return;
    }

    setFormValidationErrors([]);
    setIsSavingRelief(true);

    try {
      const parsedAssisted = parseInt(reliefForm.peopleAssisted, 10);
      const reliefPayload: ReliefDetails = {
        peopleAssisted: isNaN(parsedAssisted) ? 0 : parsedAssisted,
        resourcesUsed: assignment.reliefDetails?.resourcesUsed || 0,
        reliefDistributed: reliefForm.reliefDistributed.trim(),
        shelterStatus: reliefForm.shelterStatus.trim(),
        responseDuration: reliefForm.responseDuration.trim(),
        resolutionNotes: reliefForm.resolutionNotes.trim(),
        submittedBy: activeVolunteerId,
        submittedByName: responderProfile?.name || getActorName(),
        submittedAt: new Date().toISOString()
      };

      const updated = await MockAPI.updateReliefDetails(assignment.id, reliefPayload, activeVolunteerId);
      if (updated) {
        setAssignment(updated);
        setRecoveryDetailsSaved(true);
      } else {
        throw new Error('Failed to persist recovery record.');
      }
    } catch (err: any) {
      setSaveErrorMessage(err?.message || 'Failed to save recovery details. Please verify inputs and retry.');
      setRecoveryDetailsSaved(false);
    } finally {
      setIsSavingRelief(false);
    }
  };

  // Final Action: Confirm Mission Complete
  const handleConfirmMissionComplete = async () => {
    if (!assignment || isCompletingMission) return;
    if (!recoveryDetailsSaved) {
      setSaveErrorMessage('You must save the Post-Disaster Recovery & Relief details before completing the mission.');
      return;
    }

    setIsCompletingMission(true);
    setSaveErrorMessage(null);
    try {
      const completionNote = reliefForm.resolutionNotes?.trim() 
        || 'Field rescue and recovery operations marked complete by assigned responder unit.';
      
      const updated = await MockAPI.updateIncidentStatus(
        assignment.id, 
        'completed', 
        completionNote, 
        getActorName()
      );

      if (updated) {
        setAssignment(updated);
      }
      await fetchAssignment();
    } catch (err: any) {
      setSaveErrorMessage(err?.message || 'Failed to mark mission complete.');
    } finally {
      setIsCompletingMission(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Header & Responder Identity Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">Field Responder Portal</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40">
              DISPATCH RELAY
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#AAA29A]">
            Tactical mission progression, telemetry relay, and post-disaster recovery documentation for Palghar District.
          </p>
        </div>

        {/* Demo/Testing Responder Switcher */}
        <div className="flex items-center gap-3 bg-[#191715] p-2 rounded-xl border border-[#38302A]">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C756E]">Active Unit</span>
            <span className="text-xs font-semibold text-[#F4F0EB] truncate max-w-[150px]">
              {responderProfile?.name || 'Rahul Patil'}
            </span>
          </div>
          <select
            value={activeVolunteerId}
            onChange={(e) => handleSwitchResponder(e.target.value)}
            className="text-xs bg-[#12110F] text-[#F4F0EB] border border-[#38302A] rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-[#F5A23A] cursor-pointer"
            title="Switch demo field responder unit"
          >
            {volunteers.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.id}) — {v.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Responder Verification / Callout Notice */}
      <div className="bg-[#1F1912] border border-[#F5A23A]/30 rounded-xl p-3.5 flex items-start gap-3">
        <div className="p-1 rounded bg-[#F5A23A]/20 text-[#F5A23A] shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-[#F5A23A]">SIMULATED RESPONDER DISPATCH &amp; RELAY (PROTOTYPE DEMONSTRATION)</p>
          <p className="text-[#AAA29A] mt-0.5 leading-relaxed">
            This module executes the sequential operational workflow: <em>Accept Assignment &rarr; Mark En Route &rarr; Confirm Arrival &rarr; Commence Rescue &rarr; Recovery &amp; Relief Operations Form &rarr; Mission Completion</em>. Incident closure remains the authority of Palghar District EOC. Real emergency dispatch requires contacting official helplines (112 / 02525-252020).
          </p>
        </div>
      </div>
      
      {loading && !assignment ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A23A]"></div>
          <p className="text-xs font-mono text-[#AAA29A]">Syncing dispatch orders with Palghar Command Center...</p>
        </div>
      ) : assignment ? (
        <div className="space-y-6">
          {/* Main Mission Card */}
          <Card className="border border-[#38302A] bg-[#191715] shadow-lg overflow-hidden rounded-xl">
            {/* Header with tactical status */}
            <div className="bg-[#12110F] border-b border-[#26211C] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-[#F4F0EB]">
                <ShieldAlert className="w-5 h-5 text-[#E53946]" />
                <div>
                  <h2 className="text-base font-bold">Active Tactical Mission</h2>
                  <p className="text-[11px] text-[#7C756E] font-mono">ORDER ID: {assignment.id.replace('inc_', 'INC-').toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                  assignment.status === 'assigned' ? 'bg-[#F5A23A]/15 text-[#F5A23A] border-[#F5A23A]/40' :
                  assignment.status === 'accepted' ? 'bg-blue-500/15 text-blue-300 border-blue-500/40' :
                  assignment.status === 'on_the_way' || assignment.status === 'reached' ? 'bg-purple-500/15 text-purple-300 border-purple-500/40' :
                  assignment.status === 'rescue_in_progress' ? 'bg-[#851D2A]/60 text-[#FF525A] border-[#E53946]/40' :
                  'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/40'
                }`}>
                  {assignment.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Side: Mission Intelligence & Telemetry */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#F4F0EB]">{assignment.title || assignment.type || 'Emergency Dispatch'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono font-bold text-[#F5A23A] bg-[#27211B] px-2 py-0.5 rounded border border-[#38302A]">
                        {assignment.type || 'Field Incident'}
                      </span>
                      <span className="text-[11px] font-mono text-[#AAA29A]">
                        Severity: {assignment.aiAnalysis?.severity?.toUpperCase() || assignment.urgency?.toUpperCase() || 'HIGH'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-[#12110F] p-3.5 rounded-lg border border-[#38302A]">
                    <MapPin className="w-5 h-5 text-[#F5A23A] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs text-[#F4F0EB]">{assignment.location?.address || 'Palghar District, Maharashtra'}</p>
                      <p className="text-xs font-mono text-[#7C756E] mt-0.5">
                        {assignment.location?.lat.toFixed(4)}° N, {assignment.location?.lng.toFixed(4)}° E
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-[#12110F] p-3.5 rounded-lg border border-[#38302A]">
                    <Clock className="w-5 h-5 text-[#AAA29A] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs text-[#F4F0EB]">Reported Incident Timestamp</p>
                      <p className="text-xs font-mono text-[#AAA29A] mt-0.5">
                        {new Date(assignment.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {assignment.description && (
                    <div className="p-3.5 bg-[#12110F] rounded-lg border border-[#38302A] text-xs text-[#AAA29A] leading-relaxed">
                      <strong className="text-[#F4F0EB] block mb-1 uppercase font-mono text-[10px] tracking-wider">
                        Operational Briefing:
                      </strong>
                      {assignment.description}
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-[#12110F] rounded-lg border border-[#38302A] text-xs">
                    <span className="text-[#7C756E] font-mono text-[11px]">Assigned Unit:</span>
                    <span className="text-[#F4F0EB] font-bold font-mono">
                      {assignment.assignedTeam || responderProfile?.name || 'Rahul Patil'}
                    </span>
                  </div>
                </div>
                
                {/* Right Side: Sequential Mission Action Controls */}
                <div className="flex flex-col justify-between space-y-4 bg-[#12110F] p-6 rounded-xl border border-[#38302A]">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#26211C]">
                      <h4 className="text-xs font-mono font-bold text-[#F4F0EB] uppercase tracking-wider">
                        Mission Status Progression
                      </h4>
                      <span className="text-[10px] font-mono text-[#7C756E]">Sequential Protocol</span>
                    </div>

                    {/* Step Visualizer */}
                    <div className="grid grid-cols-5 gap-1 mb-6 text-center text-[9px] font-mono">
                      <div className={`p-1.5 rounded ${['assigned', 'accepted', 'on_the_way', 'reached', 'rescue_in_progress', 'completed'].includes(assignment.status) ? 'bg-[#F5A23A]/20 text-[#F5A23A] border border-[#F5A23A]/40' : 'bg-[#191715] text-[#7C756E]'}`}>
                        1. Accept
                      </div>
                      <div className={`p-1.5 rounded ${['accepted', 'on_the_way', 'reached', 'rescue_in_progress', 'completed'].includes(assignment.status) && assignment.status !== 'assigned' ? 'bg-[#F5A23A]/20 text-[#F5A23A] border border-[#F5A23A]/40' : 'bg-[#191715] text-[#7C756E]'}`}>
                        2. En Route
                      </div>
                      <div className={`p-1.5 rounded ${['on_the_way', 'reached', 'rescue_in_progress', 'completed'].includes(assignment.status) && !['assigned', 'accepted'].includes(assignment.status) ? 'bg-[#F5A23A]/20 text-[#F5A23A] border border-[#F5A23A]/40' : 'bg-[#191715] text-[#7C756E]'}`}>
                        3. Arrived
                      </div>
                      <div className={`p-1.5 rounded ${['reached', 'rescue_in_progress', 'completed'].includes(assignment.status) && !['assigned', 'accepted', 'on_the_way'].includes(assignment.status) ? 'bg-[#F5A23A]/20 text-[#F5A23A] border border-[#F5A23A]/40' : 'bg-[#191715] text-[#7C756E]'}`}>
                        4. Rescue
                      </div>
                      <div className={`p-1.5 rounded ${assignment.status === 'completed' ? 'bg-[#16B58A]/20 text-[#16B58A] border border-[#16B58A]/40' : 'bg-[#191715] text-[#7C756E]'}`}>
                        5. Complete
                      </div>
                    </div>

                    {/* Step Actions */}
                    <div className="space-y-3">
                      
                      {/* Step 1: Accept Assignment */}
                      {assignment.status === 'assigned' && (
                        <div className="space-y-2">
                          <p className="text-xs text-[#AAA29A]">
                            Acknowledge the tactical assignment and notify Palghar Command Center of readiness.
                          </p>
                          <Button 
                            size="lg" 
                            disabled={actionLoading}
                            className="w-full bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 font-bold h-11 cursor-pointer" 
                            onClick={handleAcceptAssignment}
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {actionLoading ? 'Accepting...' : 'Accept Assignment'}
                          </Button>
                        </div>
                      )}
                      
                      {/* Step 2: Mark En Route */}
                      {assignment.status === 'accepted' && (
                        <div className="space-y-2">
                          <p className="text-xs text-[#AAA29A]">
                            Mobilize equipment and broadcast real-time en route status to command.
                          </p>
                          <Button 
                            size="lg" 
                            disabled={actionLoading}
                            className="w-full bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold h-11 cursor-pointer" 
                            onClick={handleMarkEnRoute}
                          >
                            <Navigation className="w-5 h-5 mr-2" />
                            {actionLoading ? 'Updating Status...' : 'Mark En Route (On the Way)'}
                          </Button>
                        </div>
                      )}
                      
                      {/* Step 3: Confirm Arrival */}
                      {assignment.status === 'on_the_way' && (
                        <div className="space-y-2">
                          <p className="text-xs text-[#AAA29A]">
                            Confirm unit arrival at scene coordinates and commence perimeter assessment.
                          </p>
                          <Button 
                            size="lg" 
                            disabled={actionLoading}
                            className="w-full bg-[#F46B27] hover:bg-[#f57b3d] text-white font-bold h-11 cursor-pointer" 
                            onClick={handleConfirmArrival}
                          >
                            <MapPin className="w-5 h-5 mr-2" />
                            {actionLoading ? 'Confirming Arrival...' : 'Confirm Arrival at Scene'}
                          </Button>
                        </div>
                      )}
                      
                      {/* Step 4: Commence Rescue */}
                      {assignment.status === 'reached' && (
                        <div className="space-y-2">
                          <p className="text-xs text-[#AAA29A]">
                            Initiate tactical rescue operations, evacuation corridors, or hazard containment.
                          </p>
                          <Button 
                            size="lg" 
                            disabled={actionLoading}
                            className="w-full bg-[#E53946] hover:bg-[#f04856] text-white font-bold h-11 cursor-pointer" 
                            onClick={handleCommenceRescue}
                          >
                            <PlayCircle className="w-5 h-5 mr-2" />
                            {actionLoading ? 'Commencing Operations...' : 'Commence Rescue Operation'}
                          </Button>
                        </div>
                      )}
                      
                      {/* Step 5: Mark Mission Complete (Opens/Reveals Form) */}
                      {assignment.status === 'rescue_in_progress' && (
                        <div className="space-y-3">
                          <div className="p-3 bg-[#191715] rounded-lg border border-[#E53946]/30 text-xs text-[#AAA29A]">
                            <p className="font-bold text-[#FF525A] flex items-center gap-1.5 mb-1">
                              <PlayCircle className="w-4 h-4 text-[#E53946]" />
                              Tactical Rescue in Progress
                            </p>
                            To complete this mission, you must document and save the post-disaster recovery information.
                          </div>

                          {!isRecoveryFormRevealed ? (
                            <Button 
                              size="lg" 
                              className="w-full bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 font-bold h-11 cursor-pointer" 
                              onClick={handleRevealRecoveryForm}
                            >
                              <FileText className="w-5 h-5 mr-2" />
                              Mark Mission Complete
                            </Button>
                          ) : (
                            <div className="p-3 bg-[#14231E] rounded-lg border border-[#16B58A]/40 text-xs text-[#C5E1D7] flex items-center justify-between">
                              <span>Recovery form opened below. Complete &amp; save required details.</span>
                              {recoveryDetailsSaved && (
                                <span className="font-mono text-[10px] font-bold text-[#16B58A] bg-[#0E1A16] px-2 py-0.5 rounded border border-[#16B58A]/30">
                                  DETAILS SAVED
                                </span>
                              )}
                            </div>
                          )}

                          {/* Final confirmation button: enabled ONLY after recovery details are saved */}
                          {isRecoveryFormRevealed && (
                            <div className="pt-2">
                              <Button
                                size="lg"
                                disabled={!recoveryDetailsSaved || isCompletingMission}
                                onClick={handleConfirmMissionComplete}
                                className={`w-full font-bold h-11 transition-all ${
                                  recoveryDetailsSaved 
                                    ? 'bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 shadow-md shadow-[#16B58A]/20 cursor-pointer'
                                    : 'bg-[#27211B] text-[#7C756E] border border-[#38302A] cursor-not-allowed opacity-60'
                                }`}
                              >
                                {isCompletingMission ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Finalizing Mission...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Confirm Mission Complete
                                  </>
                                )}
                              </Button>
                              {!recoveryDetailsSaved && (
                                <p className="text-[10px] text-[#7C756E] font-mono text-center mt-1.5">
                                  * Disabled until recovery &amp; relief details are successfully saved below.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Mission Completed State */}
                      {assignment.status === 'completed' && (
                        <div className="text-center p-4 bg-[#14231E] rounded-xl border border-[#16B58A]/40">
                          <CheckCircle2 className="w-10 h-10 text-[#16B58A] mx-auto mb-2" />
                          <p className="font-bold text-[#16B58A] text-sm">Tactical Mission Completed</p>
                          <p className="text-xs text-[#AAA29A] mt-1 leading-relaxed">
                            Field rescue operations marked complete. Recovery details have been registered into the Palghar Disaster Repository.
                          </p>
                          <div className="mt-3 pt-3 border-t border-[#16B58A]/20 text-[11px] text-[#7C756E]">
                            Official incident closure and resource release remains under District EOC Authority.
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Relay Disclaimer */}
                  <div className="pt-3 border-t border-[#26211C] text-[10px] font-mono text-[#7C756E] flex items-center justify-between">
                    <span>Incident Ref: {assignment.id}</span>
                    <span>Role: Field Responder</span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* =========================================================================
              Post-Disaster Recovery & Relief Operations Form (Exact 5 Fields)
              Displayed ONLY when responder reaches Mark Mission Complete stage
          ========================================================================= */}
          {assignment.status === 'rescue_in_progress' && isRecoveryFormRevealed && (
            <div ref={recoveryFormRef} className="animate-in fade-in slide-in-from-bottom-6 duration-300">
              <Card className="border border-[#16B58A]/50 rounded-xl bg-[#191715] overflow-hidden shadow-lg">
                <div className="bg-[#12110F] border-b border-[#26211C] p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-[#16B58A]" />
                    <div>
                      <h2 className="text-sm font-bold text-[#F4F0EB] uppercase tracking-wider font-mono">
                        Post-Disaster Recovery &amp; Relief Operations
                      </h2>
                      <p className="text-[11px] text-[#7C756E] font-medium">
                        Phase 3: Impact assessment, resource reconciliation, and incident resolution
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#14231E] text-[#16B58A] border border-[#16B58A]/40">
                    Mission Debrief
                  </span>
                </div>

                <CardContent className="p-6 space-y-5">
                  {/* Validation Errors Notice */}
                  {formValidationErrors.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-[#851D2A]/20 border border-[#E53946]/50 text-xs text-[#FF525A] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Please correct the following fields before saving:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {formValidationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Backend / Save Error Message */}
                  {saveErrorMessage && (
                    <div className="p-3.5 rounded-lg bg-[#851D2A]/20 border border-[#E53946]/50 text-xs text-[#FF525A] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Save Failed:</strong>
                        <span>{saveErrorMessage}</span>
                      </div>
                    </div>
                  )}

                  {/* Save Success Banner */}
                  {recoveryDetailsSaved && (
                    <div className="p-3.5 rounded-lg bg-[#14231E] border border-[#16B58A]/50 text-xs text-[#C5E1D7] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#16B58A] shrink-0" />
                        <span>
                          <strong>Recovery details saved successfully.</strong> You may now confirm mission completion above or update information below.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#16B58A] bg-[#0E1A16] px-2 py-0.5 rounded border border-[#16B58A]/30 shrink-0">
                        VERIFIED
                      </span>
                    </div>
                  )}

                  {/* The 5 Required Form Fields */}
                  <form onSubmit={handleSaveRecoveryDetails} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Field 1: People Assisted / Evacuated (allows legitimate 0) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-[#7C756E] uppercase flex items-center justify-between">
                          <span>People Assisted / Evacuated *</span>
                          <span className="text-[9px] text-[#AAA29A] font-normal">(0 is permitted if none rescued)</span>
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          step="1"
                          required
                          value={reliefForm.peopleAssisted}
                          onChange={(e) => {
                            setReliefForm({ ...reliefForm, peopleAssisted: e.target.value });
                            setRecoveryDetailsSaved(false);
                          }}
                          className="w-full text-xs bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 font-medium text-[#F4F0EB] focus:outline-none focus:border-[#16B58A]" 
                        />
                      </div>

                      {/* Field 2: Response / Recovery Duration */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-[#7C756E] uppercase">
                          Response / Recovery Duration *
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. 3.5 hours"
                          value={reliefForm.responseDuration}
                          onChange={(e) => {
                            setReliefForm({ ...reliefForm, responseDuration: e.target.value });
                            setRecoveryDetailsSaved(false);
                          }}
                          className="w-full text-xs bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 font-medium text-[#F4F0EB] focus:outline-none focus:border-[#16B58A]" 
                        />
                      </div>

                      {/* Field 3: Relief Distributed */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-mono font-bold text-[#7C756E] uppercase">
                          Relief Distributed
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. 80 ration packets, 5000L drinking water, medical kits"
                          value={reliefForm.reliefDistributed}
                          onChange={(e) => {
                            setReliefForm({ ...reliefForm, reliefDistributed: e.target.value });
                            setRecoveryDetailsSaved(false);
                          }}
                          className="w-full text-xs bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 font-medium text-[#F4F0EB] focus:outline-none focus:border-[#16B58A]" 
                        />
                      </div>

                      {/* Field 4: Shelter / Evacuation Center Status */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-mono font-bold text-[#7C756E] uppercase">
                          Shelter / Evacuation Center Status
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. 45 residents sheltered at Palghar Municipal Relief Camp; safe and supplied"
                          value={reliefForm.shelterStatus}
                          onChange={(e) => {
                            setReliefForm({ ...reliefForm, shelterStatus: e.target.value });
                            setRecoveryDetailsSaved(false);
                          }}
                          className="w-full text-xs bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 font-medium text-[#F4F0EB] focus:outline-none focus:border-[#16B58A]" 
                        />
                      </div>

                      {/* Field 5: Resolution Notes & Closure Comments */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-mono font-bold text-[#7C756E] uppercase">
                          Resolution Notes &amp; Closure Comments *
                        </label>
                        <textarea 
                          rows={3}
                          required
                          placeholder="Enter formal incident resolution notes, engineering repair status, or relief sign-off..."
                          value={reliefForm.resolutionNotes}
                          onChange={(e) => {
                            setReliefForm({ ...reliefForm, resolutionNotes: e.target.value });
                            setRecoveryDetailsSaved(false);
                          }}
                          className="w-full text-xs bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 font-medium text-[#F4F0EB] focus:outline-none focus:border-[#16B58A] resize-none" 
                        />
                      </div>
                    </div>

                    {/* Operational Safety Notice */}
                    <div className="p-3 rounded-lg bg-[#12110F] border border-[#26211C] text-[11px] text-[#7C756E] flex items-center justify-between">
                      <span>* Submitted records are stored directly into the Palghar Disaster Management repository and reflected on the Reports dashboard.</span>
                      <span className="font-mono text-[#F5A23A] shrink-0 ml-2">ID: {assignment.id}</span>
                    </div>

                    {/* Form Action Controls */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                      <Button
                        type="submit"
                        disabled={isSavingRelief}
                        className="bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold text-xs h-9 px-4 cursor-pointer"
                      >
                        {isSavingRelief ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Saving Recovery Details...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            Save Recovery Details
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* =========================================================================
              Read-Only Recovery Summary Card (When Mission Completed)
          ========================================================================= */}
          {assignment.status === 'completed' && assignment.reliefDetails && (
            <Card className="border border-[#16B58A]/40 rounded-xl bg-[#191715] overflow-hidden shadow-sm">
              <div className="bg-[#12110F] border-b border-[#26211C] p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#16B58A]" />
                  <h3 className="text-sm font-bold text-[#F4F0EB] uppercase tracking-wider font-mono">
                    Recorded Post-Disaster Recovery &amp; Relief Summary
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#16B58A] bg-[#14231E] px-2.5 py-0.5 rounded border border-[#16B58A]/30 font-bold uppercase">
                  Logged by Responder
                </span>
              </div>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#12110F] p-3 rounded-lg border border-[#38302A]">
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase block mb-1">
                      People Assisted / Evacuated
                    </span>
                    <span className="text-sm font-bold text-[#F4F0EB] font-mono">
                      {assignment.reliefDetails.peopleAssisted !== undefined 
                        ? `${assignment.reliefDetails.peopleAssisted} citizens`
                        : '0 citizens'}
                    </span>
                  </div>
                  
                  <div className="bg-[#12110F] p-3 rounded-lg border border-[#38302A]">
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase block mb-1">
                      Response / Recovery Duration
                    </span>
                    <span className="text-sm font-semibold text-[#F4F0EB]">
                      {assignment.reliefDetails.responseDuration || 'Not recorded'}
                    </span>
                  </div>

                  <div className="bg-[#12110F] p-3 rounded-lg border border-[#38302A] sm:col-span-2">
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase block mb-1">
                      Relief Distributed
                    </span>
                    <span className="text-xs text-[#AAA29A] leading-relaxed">
                      {assignment.reliefDetails.reliefDistributed || 'No relief data recorded'}
                    </span>
                  </div>

                  <div className="bg-[#12110F] p-3 rounded-lg border border-[#38302A] sm:col-span-2">
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase block mb-1">
                      Shelter / Evacuation Center Status
                    </span>
                    <span className="text-xs text-[#AAA29A] leading-relaxed">
                      {assignment.reliefDetails.shelterStatus || 'No shelter status recorded'}
                    </span>
                  </div>

                  <div className="bg-[#12110F] p-3 rounded-lg border border-[#38302A] sm:col-span-2">
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase block mb-1">
                      Resolution Notes &amp; Closure Comments
                    </span>
                    <p className="text-xs text-[#C5E1D7] bg-[#0E1A16] p-3 rounded-lg border border-[#16B58A]/30 leading-relaxed">
                      {assignment.reliefDetails.resolutionNotes || 'Operation completed; ready for recovery review.'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#12110F] rounded-lg border border-[#26211C] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#7C756E]">
                  <span>Submitted by: <strong className="text-[#AAA29A]">{assignment.reliefDetails.submittedByName || responderProfile?.name || 'Rahul Patil'}</strong></span>
                  {assignment.reliefDetails.submittedAt && (
                    <span className="font-mono">Timestamp: {new Date(assignment.reliefDetails.submittedAt).toLocaleString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      ) : (
        <Card className="border border-[#38302A] bg-[#191715]">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-[#27211B] border border-[#38302A] p-4 mb-4">
              <ShieldAlert className="h-8 w-8 text-[#7C756E]" />
            </div>
            <h2 className="text-lg font-bold text-[#F4F0EB] mb-2">No Active Dispatch Orders</h2>
            <p className="text-xs text-[#AAA29A] max-w-md leading-relaxed">
              Responder unit <strong>{responderProfile?.name || activeVolunteerId}</strong> currently has no active emergency dispatches. You will be alerted when a priority incident is matched to your skills in Palghar District.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
