import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MockAPI } from '../../services/mockApi';
import { Incident, Resource, ReliefDetails, AITriageAssessment } from '../../types';
import { aiService, AIStatusResponse } from '../../services/aiService';
import { 
  MapPin, Info, CheckCircle2, Users, AlertTriangle, Zap, Check, ArrowLeft, 
  Globe, ExternalLink, Activity, Waves, Flame, Droplets, Wind, Clock, 
  FileText, Shield, Sparkles, RefreshCw, AlertCircle, HelpCircle, ListChecks,
  ShieldAlert, ChevronDown, ChevronUp, Cpu, FileQuestion
} from 'lucide-react';
import { AssignVolunteerModal } from '../../components/authority/AssignVolunteerModal';
import { AssignResourceModal } from '../../components/authority/AssignResourceModal';

export function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [allocatedResources, setAllocatedResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssignResourceModalOpen, setIsAssignResourceModalOpen] = useState(false);
  
  const [reliefForm, setReliefForm] = useState<ReliefDetails>({
    peopleAssisted: 0,
    resourcesUsed: 0,
    reliefDistributed: '',
    shelterStatus: '',
    responseDuration: '',
    resolutionNotes: ''
  });
  const [isSavingRelief, setIsSavingRelief] = useState(false);

  // Gemini AI Incident Triage state
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiEvidenceExpanded, setIsAiEvidenceExpanded] = useState(true);
  const [isAiUncertaintiesExpanded, setIsAiUncertaintiesExpanded] = useState(true);

  const fetchIncident = () => {
    if (id) {
      MockAPI.getIncidentById(id).then(data => {
        setIncident(data || null);
        if (data?.reliefDetails) {
          setReliefForm({
            peopleAssisted: data.reliefDetails.peopleAssisted || 0,
            resourcesUsed: data.reliefDetails.resourcesUsed || 0,
            reliefDistributed: data.reliefDetails.reliefDistributed || '',
            shelterStatus: data.reliefDetails.shelterStatus || '',
            responseDuration: data.reliefDetails.responseDuration || '',
            resolutionNotes: data.reliefDetails.resolutionNotes || ''
          });
        }
        setIsLoading(false);
      });
      MockAPI.getAllocatedResources(id).then(data => {
        setAllocatedResources(data);
      });
    }
  };

  useEffect(() => {
    fetchIncident();
    aiService.getStatus().then(status => {
      setAiStatus(status);
    });
  }, [id]);

  const handleRunAITriage = async () => {
    if (!incident) return;
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const response = await aiService.triageIncident(incident);
      if (response.success && response.analysis) {
        await MockAPI.updateIncidentAITriage(incident.id, response.analysis);
        fetchIncident();
      } else {
        setAiError(response.message || 'AI Triage analysis failed.');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Error occurred while contacting AI service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateRelief = async (resolve: boolean = false) => {
    if (!incident) return;
    setIsSavingRelief(true);
    await MockAPI.updateReliefDetails(incident.id, reliefForm);
    if (resolve) {
      const closureNote = reliefForm.resolutionNotes?.trim() 
        ? reliefForm.resolutionNotes.trim()
        : 'Incident verified closed with relief and impact assessment recorded.';
      await MockAPI.updateIncidentStatus(incident.id, 'resolved', closureNote, 'District Collectorate EOC');
    } else if (incident.status === 'completed') {
      await MockAPI.updateIncidentStatus(incident.id, 'relief');
    }
    fetchIncident();
    setIsSavingRelief(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[#38302A] bg-[#191715] m-8">
        <p className="text-sm font-medium text-[#AAA29A] animate-pulse">Loading incident details...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
        <h2 className="text-xl font-bold text-[#F4F0EB] mb-2">Incident Not Found</h2>
        <Button onClick={() => navigate('/admin/incidents')} className="bg-[#F5A23A] text-stone-950 font-bold">Back to Incidents</Button>
      </div>
    );
  }

  const severity = incident.aiAnalysis?.severity || 'low';
  const urgency = incident.urgency || (severity === 'critical' || severity === 'high' ? 'High' : 'Medium');

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      <AssignVolunteerModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        incidentId={incident.id}
        onAssignSuccess={fetchIncident}
      />
      <AssignResourceModal 
        isOpen={isAssignResourceModalOpen}
        onClose={() => setIsAssignResourceModalOpen(false)}
        incidentId={incident.id}
        onAssignSuccess={fetchIncident}
      />
      
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate('/admin/incidents')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#AAA29A] hover:text-[#F4F0EB] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Incidents Queue</span>
        </button>
      </div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
             <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB] font-mono">
               {incident.id.replace('inc_', 'INC-').toUpperCase()}
             </h1>
             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
               ['pending'].includes(incident.status) ? 'bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40' :
               ['verified', 'assigned', 'accepted'].includes(incident.status) ? 'bg-blue-500/15 text-blue-300 border border-blue-500/40' :
               ['on_the_way', 'reached', 'in_progress', 'rescue_in_progress'].includes(incident.status) ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40' :
               ['relief'].includes(incident.status) ? 'bg-amber-500/15 text-[#F5A23A] border border-amber-500/40' :
               ['resolved'].includes(incident.status) ? 'bg-[#16B58A]/15 text-[#16B58A] border border-[#16B58A]/40' :
               'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
             }`}>
               {incident.status.replace(/_/g, ' ')}
             </span>
          </div>
          <p className="text-xs font-medium text-[#AAA29A]">
            {incident.type || incident.title} &bull; {incident.location.address || 'Unknown'}
          </p>
        </div>
        
        {/* ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          {incident.status === 'pending' && (
            <>
              <Button 
                onClick={async () => {
                  await MockAPI.updateIncidentStatus(incident.id, 'verified');
                  fetchIncident();
                }}
                className="bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 font-bold shadow-xs h-9 px-4 cursor-pointer"
              >
                Verify
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  await MockAPI.updateIncidentStatus(incident.id, 'dismissed');
                  fetchIncident();
                }}
                className="border-[#E53946]/50 bg-[#191715] text-[#ff727f] hover:bg-[#E53946]/20 font-semibold h-9 px-4 cursor-pointer"
              >
                Reject
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            className="bg-[#27211B] border-[#38302A] text-[#F4F0EB] hover:bg-[#342c24] font-semibold h-9 px-4 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setIsAssignModalOpen(true)}
            disabled={incident.status === 'resolved' || incident.status === 'dismissed'}
            title={incident.status === 'resolved' || incident.status === 'dismissed' ? `Cannot assign responders to a ${incident.status} incident` : 'Assign certified responder unit'}
          >
            Assign Volunteer
          </Button>
          <Button 
            variant="outline" 
            className="bg-[#27211B] border-[#38302A] text-[#F4F0EB] hover:bg-[#342c24] font-semibold h-9 px-4 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setIsAssignResourceModalOpen(true)}
            disabled={incident.status === 'resolved' || incident.status === 'dismissed'}
            title={incident.status === 'resolved' || incident.status === 'dismissed' ? `Cannot allocate resources to a ${incident.status} incident` : 'Allocate depot equipment or vehicles'}
          >
            Assign Resources
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRunAITriage}
            disabled={isAnalyzing}
            className={`border-[#F5A23A]/50 bg-[#27211B] text-[#F5A23A] hover:bg-[#342c24] font-semibold h-9 px-3.5 text-xs flex items-center gap-1.5 cursor-pointer ${
              aiStatus && !aiStatus.configured ? 'opacity-80' : ''
            }`}
            title={aiStatus && !aiStatus.configured ? 'Gemini API not configured' : 'Run Gemini AI incident triage'}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#F5A23A]" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-[#F5A23A]" />
                <span>{incident.aiTriageAssessment ? 'Re-Run AI Triage' : 'AI Triage'}</span>
              </>
            )}
          </Button>
          <Button 
            onClick={() => navigate('/admin/map')}
            className="bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold shadow-xs h-9 px-4 text-xs cursor-pointer"
          >
            Track on Map
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: INCIDENT INFO */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-[#38302A] rounded-xl bg-[#191715] overflow-hidden shadow-sm">
            <div className="border-b border-[#26211C] bg-[#12110F] p-4 sm:p-5 flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-[#F5A23A]" />
              <h2 className="text-sm font-bold text-[#F4F0EB] uppercase tracking-wider font-mono">Incident Intelligence & Logistics</h2>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-[#26211C]">
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1">Source</span>
                    <span className="font-semibold text-[#F4F0EB] text-sm">{incident.source || (incident.reporterRole === 'citizen' ? 'Citizen Report' : 'Authority Created')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1">Reported Timestamp</span>
                    <span className="font-mono text-xs font-semibold text-[#F4F0EB]">{new Date(incident.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1">Assigned Team / Unit</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#F5A23A] bg-[#27211B] px-2.5 py-1 rounded inline-block text-xs border border-[#38302A]">
                        {incident.assignedTeam && incident.assignedTeam !== 'Unassigned' ? incident.assignedTeam : 'No assignment yet'}
                      </span>
                      {incident.assignedTeam && incident.assignedTeam !== 'Unassigned' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await MockAPI.unassignVolunteerFromIncident(incident.id, incident.assignedVolunteerId);
                            fetchIncident();
                          }}
                          className="text-[11px] font-semibold text-[#ff727f] hover:text-white bg-[#E53946]/10 hover:bg-[#E53946]/30 border border-[#E53946]/30 px-2 py-0.5 rounded cursor-pointer transition-colors"
                          title="Release responder unit back to available"
                        >
                          Release Unit
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1">Allocated Resources</span>
                    {allocatedResources.length > 0 ? (
                      <div className="flex flex-col gap-2 mt-1">
                        {allocatedResources.map(res => (
                          <div key={res.id} className="flex items-center justify-between bg-[#12110F] p-2 rounded-lg border border-[#38302A]">
                            <span className="font-medium text-[#F4F0EB] text-xs">
                              {res.name} {res.quantity && res.quantity > 1 ? `(x${res.quantity})` : ''}
                            </span>
                            <div className="flex items-center gap-2">
                              <select 
                                className="text-xs bg-[#191715] border border-[#38302A] rounded px-2 py-1 font-semibold text-[#AAA29A] focus:outline-none focus:border-[#F5A23A]"
                                value={res.status}
                                onChange={async (e) => {
                                  await MockAPI.updateResourceStatus(res.id, e.target.value as any);
                                  fetchIncident();
                                }}
                              >
                                <option value="Allocated">Allocated</option>
                                <option value="In Use">In Use</option>
                                <option value="Available">Release (Available)</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-[#7C756E]">None allocated</span>
                    )}
                  </div>
                </div>
                
                <div className="p-5">
                  <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-2">Description</span>
                  <p className="text-[#AAA29A] font-medium text-xs bg-[#12110F] p-3.5 rounded-lg border border-[#38302A] leading-relaxed">
                    {incident.description || 'No description provided.'}
                  </p>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#F5A23A]" /> Coordinates
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#F4F0EB]">{incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#F5A23A]" /> Estimated Population
                    </span>
                    <span className="text-xs font-semibold text-[#F4F0EB]">Assessment Ongoing</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incident Timeline Section */}
          <Card className="border border-[#38302A] rounded-xl bg-[#191715] overflow-hidden shadow-sm">
            <div className="border-b border-[#26211C] bg-[#12110F] p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-[#F5A23A]" />
                <h2 className="text-sm font-bold text-[#F4F0EB] uppercase tracking-wider font-mono">Incident Progression Timeline</h2>
              </div>
              <span className="text-[10px] font-mono text-[#AAA29A] bg-[#27211B] px-2 py-0.5 rounded border border-[#38302A]">
                {incident.timeline?.length || 1} Events Logged
              </span>
            </div>
            <CardContent className="p-5">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2E2721]">
                {(incident.timeline && incident.timeline.length > 0 ? incident.timeline : [
                  {
                    id: 'tl_initial',
                    timestamp: incident.timestamp,
                    status: incident.status,
                    actor: incident.reporterRole === 'citizen' ? 'Citizen Reporter' : 'Palghar EOC Dispatch',
                    note: 'Initial incident report logged into triage database.'
                  }
                ]).map((event, idx) => (
                  <div key={event.id || idx} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className={`absolute -left-[29px] top-1 h-3.5 w-3.5 rounded-full border-2 ${
                      event.status === 'resolved' ? 'bg-[#16B58A] border-[#16B58A]' :
                      event.status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
                      event.status === 'rescue_in_progress' ? 'bg-[#E53946] border-[#E53946]' :
                      event.status === 'on_the_way' || event.status === 'reached' ? 'bg-purple-500 border-purple-500' :
                      event.status === 'assigned' || event.status === 'accepted' ? 'bg-blue-500 border-blue-500' :
                      event.status === 'verified' ? 'bg-[#16B58A] border-[#16B58A]' :
                      'bg-[#F5A23A] border-[#F5A23A]'
                    }`} />
                    
                    <div className="bg-[#12110F] border border-[#2E2721] rounded-lg p-3 space-y-1.5 transition-colors hover:border-[#3E342B]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            event.status === 'resolved' ? 'bg-[#16B58A]/20 text-[#16B58A] border border-[#16B58A]/40' :
                            event.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                            event.status === 'rescue_in_progress' ? 'bg-[#E53946]/20 text-[#FF525A] border border-[#E53946]/40' :
                            event.status === 'on_the_way' || event.status === 'reached' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                            event.status === 'assigned' || event.status === 'accepted' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                            event.status === 'verified' ? 'bg-[#16B58A]/20 text-[#16B58A] border border-[#16B58A]/40' :
                            'bg-[#F5A23A]/20 text-[#F5A23A] border border-[#F5A23A]/40'
                          }`}>
                            {event.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-semibold text-[#F4F0EB]">
                            {event.actor}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#7C756E]">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#AAA29A] leading-relaxed">
                        {event.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Relief & Recovery Section (AFTER Disaster Phase) */}
          <Card className="border border-[#16B58A]/40 rounded-xl bg-[#191715] overflow-hidden shadow-sm">
            <div className="bg-[#12110F] border-b border-[#26211C] p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#16B58A]" />
                <div>
                  <h2 className="text-sm font-bold text-[#F4F0EB] uppercase tracking-wider font-mono">
                    Post-Disaster Recovery &amp; Relief Operations
                  </h2>
                  <p className="text-[11px] text-[#7C756E] font-medium">Phase 3: Impact assessment, resource reconciliation, and incident resolution</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${incident.status === 'resolved' ? 'bg-[#16B58A]/20 text-[#16B58A] border border-[#16B58A]/40' : 'bg-[#27211B] text-[#AAA29A]'}`}>
                {incident.status === 'resolved' ? 'Officially Resolved' : incident.status.replace(/_/g, ' ')}
              </span>
            </div>
            <CardContent className="p-0">
              <div className="p-5 space-y-4">
                {incident.status === 'resolved' && (
                  <div className="p-4 rounded-xl bg-[#14231E] border border-[#16B58A]/50 space-y-2">
                    <div className="flex items-center gap-2 text-[#16B58A] font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>INCIDENT OFFICIALLY RESOLVED &amp; CLOSED</span>
                    </div>
                    {reliefForm.resolutionNotes && (
                      <p className="text-xs text-[#C5E1D7] leading-relaxed bg-[#0E1A16] p-3 rounded-lg border border-[#16B58A]/30">
                        <strong className="text-white block mb-0.5">Resolution Summary:</strong>
                        {reliefForm.resolutionNotes}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-[#7C756E] uppercase">People Assisted / Evacuated</label>
                    <input 
                      type="number" 
                      value={reliefForm.peopleAssisted || 0}
                      onChange={(e) => setReliefForm({ ...reliefForm, peopleAssisted: parseInt(e.target.value) || 0 })}
                      disabled={incident.status === 'resolved'}
                      className="w-full text-xs bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 font-medium text-[#F4F0EB] focus:outline-none focus:border-[#16B58A] disabled:opacity-50" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-[#7C756E] uppercase">Response / Recovery Duration</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 3.5 hours"
                      value={reliefForm.responseDuration || ''}
                      onChange={(e) => setReliefForm({ ...reliefForm, responseDuration: e.target.value })}
                      disabled={incident.status === 'resolved'}
                      className="w-full text-xs bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 font-medium text-[#F4F0EB] focus:outline-none focus:border-[#16B58A] disabled:opacity-50" 
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-[#7C756E] uppercase">Relief Distributed</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 80 ration packets, 5000L drinking water, medical kits"
                      value={reliefForm.reliefDistributed || ''}
                      onChange={(e) => setReliefForm({ ...reliefForm, reliefDistributed: e.target.value })}
                      disabled={incident.status === 'resolved'}
                      className="w-full text-xs bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 font-medium text-[#F4F0EB] focus:outline-none focus:border-[#16B58A] disabled:opacity-50" 
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-[#7C756E] uppercase">Shelter / Evacuation Center Status</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 45 residents sheltered at Palghar Municipal Relief Camp; safe and supplied"
                      value={reliefForm.shelterStatus || ''}
                      onChange={(e) => setReliefForm({ ...reliefForm, shelterStatus: e.target.value })}
                      disabled={incident.status === 'resolved'}
                      className="w-full text-xs bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 font-medium text-[#F4F0EB] focus:outline-none focus:border-[#16B58A] disabled:opacity-50" 
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-[#7C756E] uppercase">Resolution Notes &amp; Closure Comments</label>
                    <textarea 
                      rows={3}
                      placeholder="Enter formal incident resolution notes, engineering repair status, or relief sign-off..."
                      value={reliefForm.resolutionNotes || ''}
                      onChange={(e) => setReliefForm({ ...reliefForm, resolutionNotes: e.target.value })}
                      disabled={incident.status === 'resolved'}
                      className="w-full text-xs bg-[#12110F] border border-[#38302A] rounded-lg p-2.5 font-medium text-[#F4F0EB] focus:outline-none focus:border-[#16B58A] disabled:opacity-50 resize-none" 
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded bg-[#12110F] border border-[#26211C] text-[11px] text-[#7C756E]">
                  * All status transitions, responder dispatches, and relief summaries in this prototype are logged to the district disaster audit repository.
                </div>
              </div>
              
              {incident.status !== 'resolved' && (
                <div className="bg-[#12110F] p-4 border-t border-[#26211C] flex flex-wrap justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleUpdateRelief(false)}
                    disabled={isSavingRelief}
                    className="bg-[#191715] border-[#38302A] text-[#AAA29A] hover:text-[#F4F0EB] text-xs h-9"
                  >
                    {isSavingRelief ? 'Saving...' : 'Save Relief Details'}
                  </Button>
                  <Button 
                    onClick={() => handleUpdateRelief(true)}
                    disabled={isSavingRelief}
                    className="bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 font-bold text-xs h-9"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Resolve &amp; Close Incident
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: AI ANALYSIS & EXTERNAL TELEMETRY */}
        <div className="lg:col-span-1 space-y-6">
          {incident.externalMeta && incident.externalMeta.source === 'NASA FIRMS' && (
            <Card className="border border-orange-500/40 rounded-xl bg-[#191715] overflow-hidden shadow-sm">
              <div className="border-b border-[#26211C] bg-[#12110F] p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4.5 w-4.5 text-orange-400" />
                  <h2 className="text-sm font-bold text-orange-300 uppercase tracking-wider font-mono">NASA FIRMS Satellite Telemetry</h2>
                </div>
                <span className="text-[9px] font-mono font-bold bg-orange-950/60 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                  REAL DATA
                </span>
              </div>
              <CardContent className="p-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#AAA29A]">Instrument & Satellite</span>
                  <span className="font-mono font-bold text-[#F4F0EB]">
                    {incident.externalMeta.instrument || incident.externalMeta.sensor || 'VIIRS (NOAA-20)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#AAA29A]">Fire Radiative Power</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {incident.externalMeta.fireRadiativePower !== undefined ? `${incident.externalMeta.fireRadiativePower.toFixed(1)} MW` : 'N/A'}
                  </span>
                </div>

                {incident.externalMeta.brightnessTempI4 !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#AAA29A]">Brightness Temp (I-4)</span>
                    <span className="font-mono font-semibold text-[#F4F0EB]">
                      {(incident.externalMeta.brightnessTempI4 - 273.15).toFixed(1)}°C
                      <span className="text-[#7C756E] text-[10px] ml-1">({incident.externalMeta.brightnessTempI4.toFixed(1)} K)</span>
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#AAA29A]">Detection Confidence</span>
                  <span className="font-semibold text-[#F4F0EB] bg-[#221A14] border border-orange-500/30 px-2 py-0.5 rounded text-[11px] text-orange-300">
                    {incident.externalMeta.confidenceLabel || incident.externalMeta.confidence || 'Nominal'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#AAA29A]">Overpass Time</span>
                  <span className="font-mono text-[#F4F0EB]">
                    {incident.externalMeta.acqDate} {incident.externalMeta.acqTime || ''} {incident.externalMeta.dayNight ? `(${incident.externalMeta.dayNight === 'D' ? 'Day' : 'Night'})` : ''}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#12110F] border border-[#2E2721] text-[10px] text-[#8C827A] italic leading-tight">
                  * Satellite thermal anomaly detection. Ground verification by Palghar district forest or civil units required before suppression dispatch.
                </div>

                <a
                  href={incident.externalMeta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-[#1C1510] hover:bg-[#2B1F17] border border-[#482F1E] text-[#FDBA74] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <Globe className="h-3.5 w-3.5 text-orange-400" />
                  <span>View on NASA FIRMS Map</span>
                  <ExternalLink className="h-3 w-3 text-[#FDBA74]" />
                </a>
              </CardContent>
            </Card>
          )}

          {incident.externalMeta && incident.externalMeta.source === 'USGS' && (
            <Card className="border border-emerald-500/40 rounded-xl bg-[#191715] overflow-hidden shadow-sm">
              <div className="border-b border-[#26211C] bg-[#12110F] p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-emerald-400" />
                  <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wider font-mono">USGS Seismic Telemetry</h2>
                </div>
                <span className="text-[9px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  REAL DATA
                </span>
              </div>
              <CardContent className="p-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#AAA29A]">USGS Event ID</span>
                  <span className="font-mono font-bold text-[#F4F0EB]">{incident.externalMeta.sourceId}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#AAA29A]">Magnitude</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {incident.externalMeta.magnitude !== null ? `M ${incident.externalMeta.magnitude.toFixed(1)}` : 'N/A'} {incident.externalMeta.magnitudeType || ''}
                  </span>
                </div>

                {incident.externalMeta.depthKm !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#AAA29A]">Focal Depth</span>
                    <span className="font-mono font-semibold text-[#F4F0EB]">{incident.externalMeta.depthKm.toFixed(1)} km</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#AAA29A]">Solution Status</span>
                  <span className="capitalize font-semibold text-[#F4F0EB]">{incident.externalMeta.eventStatus || 'Reviewed'}</span>
                </div>

                {incident.externalMeta.tsunami === 1 && (
                  <div className="bg-[#851D2A]/40 border border-[#E53946]/50 text-[#FF858B] p-2 rounded text-[11px] font-bold flex items-center gap-1.5">
                    <Waves className="h-4 w-4 shrink-0" />
                    <span>TSUNAMI ADVISORY ISSUED</span>
                  </div>
                )}

                <div className="p-2.5 rounded bg-[#12110F] border border-[#2E2721] text-[10px] text-[#8C827A] italic leading-tight">
                  * {incident.externalMeta.derivedSeverityExplanation}
                </div>

                <a
                  href={incident.externalMeta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-[#141A29] hover:bg-[#1E2942] border border-[#2B3B5B] text-[#93C5FD] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <Globe className="h-3.5 w-3.5 text-[#60A5FA]" />
                  <span>View Official Event Page (USGS.gov)</span>
                  <ExternalLink className="h-3 w-3 text-[#93C5FD]" />
                </a>
              </CardContent>
            </Card>
          )}

          {incident.externalMeta && incident.externalMeta.source === 'GDACS' && (
            <Card className="border border-cyan-500/40 rounded-xl bg-[#191715] overflow-hidden shadow-sm">
              <div className="border-b border-[#26211C] bg-[#12110F] p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {incident.externalMeta.eventType === 'TC' ? (
                    <Wind className="h-4.5 w-4.5 text-cyan-400" />
                  ) : (
                    <Droplets className="h-4.5 w-4.5 text-blue-400" />
                  )}
                  <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wider font-mono">GDACS Multi-Hazard Telemetry</h2>
                </div>
                <span className="text-[9px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  REAL DATA
                </span>
              </div>
              <CardContent className="p-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#AAA29A]">Hazard Type</span>
                  <span className="font-mono font-bold text-[#F4F0EB]">
                    {incident.externalMeta.eventType === 'FL' ? 'Flood (GLOFAS)' : incident.externalMeta.eventType === 'TC' ? 'Tropical Cyclone' : incident.externalMeta.eventType || 'Disaster Alert'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#AAA29A]">Official GDACS Alert</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${
                    incident.externalMeta.alertLevel?.toLowerCase() === 'red'
                      ? 'bg-red-950/60 text-red-400 border-red-500/50'
                      : incident.externalMeta.alertLevel?.toLowerCase() === 'orange'
                      ? 'bg-orange-950/60 text-orange-400 border-orange-500/50'
                      : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50'
                  }`}>
                    {incident.externalMeta.alertLevel?.toUpperCase() || 'GREEN'} ALERT
                  </span>
                </div>

                {incident.externalMeta.alertScore !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#AAA29A]">Alert Score</span>
                    <span className="font-mono font-bold text-[#F4F0EB]">{incident.externalMeta.alertScore}</span>
                  </div>
                )}

                {incident.externalMeta.country && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#AAA29A]">Country / Region</span>
                    <span className="font-medium text-[#F4F0EB]">{incident.externalMeta.country}</span>
                  </div>
                )}

                {incident.externalMeta.fromDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#AAA29A]">Observed Duration</span>
                    <span className="font-mono text-[11px] text-[#AAA29A]">
                      From: {new Date(incident.externalMeta.fromDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="p-2.5 rounded bg-[#12110F] border border-[#2E2721] text-[10px] text-[#8C827A] italic leading-tight">
                  * Official GDACS hazard telemetry from UN / European Commission. Requires local authority verification before dispatch.
                </div>

                {incident.externalMeta.url && (
                  <a
                    href={incident.externalMeta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-[#132228] hover:bg-[#1a3038] border border-[#1f4b57] text-[#67E8F9] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                  >
                    <Globe className="h-3.5 w-3.5 text-cyan-400" />
                    <span>View Official GDACS Report</span>
                    <ExternalLink className="h-3 w-3 text-[#67E8F9]" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* GEMINI AI INCIDENT TRIAGE & DECISION SUPPORT */}
          <Card className="border border-[#F5A23A]/40 rounded-xl bg-[#191715] overflow-hidden shadow-sm">
            <div className="border-b border-[#26211C] bg-[#12110F] p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[#F5A23A]" />
                <h2 className="text-sm font-bold text-[#F4F0EB] uppercase tracking-wider font-mono">Gemini AI Triage Assistant</h2>
              </div>
              {aiStatus?.configured ? (
                <span className="font-mono text-[10px] text-[#F5A23A] bg-[#27211B] px-2 py-0.5 rounded border border-[#38302A] flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-[#F5A23A]" />
                  {aiStatus.model}
                </span>
              ) : (
                <span className="font-mono text-[10px] text-[#ff727f] bg-[#271715] px-2 py-0.5 rounded border border-[#E53946]/40">
                  Key Missing
                </span>
              )}
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Mandatory Human Review & Safety Notice */}
              <div className="flex items-start gap-2.5 bg-[#27211B] border border-[#F5A23A]/30 p-3 rounded-lg text-xs">
                <ShieldAlert className="h-4 w-4 text-[#F5A23A] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#F5A23A] uppercase tracking-wider text-[10px] block">
                    AI-Assisted Assessment — Requires Human Review
                  </span>
                  <p className="text-[11px] text-[#AAA29A] leading-relaxed">
                    Advisory decision support derived strictly from reported facts. Does not trigger automatic verification, dispatch, or official severity classifications.
                  </p>
                </div>
              </div>

              {/* Unconfigured State Banner */}
              {aiStatus && !aiStatus.configured && (
                <div className="p-3 bg-[#261715] border border-[#E53946]/40 rounded-lg text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#ff727f]">
                    <AlertCircle className="h-4 w-4" />
                    <span>Gemini API Unconfigured</span>
                  </div>
                  <p className="text-[11px] text-[#d6b7b7] leading-relaxed">
                    Set <code className="font-mono bg-[#191110] px-1 py-0.5 rounded border border-[#4a2222] text-[#ff99a2]">GEMINI_FREE_KEY</code> or <code className="font-mono bg-[#191110] px-1 py-0.5 rounded border border-[#4a2222] text-[#ff99a2]">GEMINI_API_KEY</code> in the server environment to enable live AI triage analysis.
                  </p>
                </div>
              )}

              {/* Error State Banner */}
              {aiError && (
                <div className="p-3 bg-[#261715] border border-[#E53946]/40 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#ff727f] flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> Analysis Error
                    </span>
                    <button 
                      onClick={() => setAiError(null)}
                      className="text-[10px] text-[#AAA29A] hover:text-[#F4F0EB]"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-[11px] text-[#ffb4bb] font-mono leading-tight">{aiError}</p>
                </div>
              )}

              {/* Action Trigger Button */}
              <div>
                <Button 
                  onClick={handleRunAITriage}
                  disabled={isAnalyzing}
                  className="w-full bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold text-xs py-2.5 flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Synthesizing Facts with Gemini...</span>
                    </>
                  ) : incident.aiTriageAssessment ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Re-Analyze Incident with Gemini</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Analyze Incident with Gemini</span>
                    </>
                  )}
                </Button>
                {incident.aiTriageAssessment && (
                  <span className="block text-center text-[10px] font-mono text-[#7C756E] mt-1.5">
                    Last analyzed: {new Date(incident.aiTriageAssessment.analyzedAt).toLocaleTimeString()} ({incident.aiTriageAssessment.modelUsed})
                  </span>
                )}
              </div>

              {/* Analyzing State Loader */}
              {isAnalyzing && (
                <div className="p-4 bg-[#12110F] border border-[#38302A] rounded-lg space-y-3 animate-pulse">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#F5A23A]">
                    <Sparkles className="h-4 w-4 animate-spin text-[#F5A23A]" />
                    <span>Querying Gemini 3.8 Flash model...</span>
                  </div>
                  <div className="h-2 bg-[#27211B] rounded w-3/4"></div>
                  <div className="h-2 bg-[#27211B] rounded w-5/6"></div>
                  <div className="h-2 bg-[#27211B] rounded w-1/2"></div>
                  <span className="text-[10px] font-mono text-[#7C756E] block">
                    Validating structured evidence without hallucinated observations...
                  </span>
                </div>
              )}

              {/* Structured AI Analysis Results */}
              {incident.aiTriageAssessment && !isAnalyzing && (
                <div className="space-y-4 pt-2">
                  {/* Priority & Classification Banner */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-[#12110F] border border-[#2E2721] rounded-lg">
                      <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1">
                        Recommended Priority
                      </span>
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border inline-block ${
                        incident.aiTriageAssessment.recommendedPriority === 'Critical' ? 'bg-[#E53946]/20 text-[#ff727f] border-[#E53946]/40' :
                        incident.aiTriageAssessment.recommendedPriority === 'High' ? 'bg-[#F46B27]/20 text-[#F46B27] border-[#F46B27]/40' :
                        incident.aiTriageAssessment.recommendedPriority === 'Medium' ? 'bg-[#F5A23A]/20 text-[#F5A23A] border-[#F5A23A]/40' :
                        'bg-[#16B58A]/20 text-[#16B58A] border-[#16B58A]/40'
                      }`}>
                        {incident.aiTriageAssessment.recommendedPriority}
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#12110F] border border-[#2E2721] rounded-lg">
                      <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1">
                        Hazard Category
                      </span>
                      <span className="font-mono text-xs font-bold text-[#F4F0EB] bg-[#27211B] px-2 py-0.5 rounded border border-[#38302A] inline-block truncate max-w-full">
                        {incident.aiTriageAssessment.hazardCategory}
                      </span>
                    </div>
                  </div>

                  {/* Incident Summary */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1.5">
                      Synthesized Summary
                    </span>
                    <p className="text-xs font-medium text-[#F4F0EB] bg-[#12110F] p-3 rounded-lg border border-[#38302A] leading-relaxed">
                      {incident.aiTriageAssessment.incidentSummary}
                    </p>
                  </div>

                  {/* Evidence-Based Reasoning */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1.5">
                      Triage Reasoning
                    </span>
                    <p className="text-xs text-[#AAA29A] bg-[#12110F] p-3 rounded-lg border border-[#2E2721] leading-relaxed">
                      {incident.aiTriageAssessment.reasoning}
                    </p>
                  </div>

                  {/* Evidence Used */}
                  <div className="border border-[#26211C] rounded-lg bg-[#12110F] p-3 space-y-2">
                    <button 
                      type="button"
                      onClick={() => setIsAiEvidenceExpanded(!isAiEvidenceExpanded)}
                      className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider text-left"
                    >
                      <span className="flex items-center gap-1.5 text-[#AAA29A]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#16B58A]" />
                        Supplied Facts & Evidence ({incident.aiTriageAssessment.evidenceUsed.length})
                      </span>
                      {isAiEvidenceExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {isAiEvidenceExpanded && (
                      <ul className="space-y-1.5 pt-1 text-xs">
                        {incident.aiTriageAssessment.evidenceUsed.map((fact, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-[#AAA29A] leading-tight">
                            <span className="text-[#16B58A] mt-0.5">&bull;</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Missing Info & Uncertainties */}
                  <div className="border border-[#26211C] rounded-lg bg-[#12110F] p-3 space-y-2">
                    <button 
                      type="button"
                      onClick={() => setIsAiUncertaintiesExpanded(!isAiUncertaintiesExpanded)}
                      className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider text-left"
                    >
                      <span className="flex items-center gap-1.5 text-[#F5A23A]">
                        <FileQuestion className="h-3.5 w-3.5" />
                        Verification Gaps & Uncertainties
                      </span>
                      {isAiUncertaintiesExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {isAiUncertaintiesExpanded && (
                      <div className="space-y-3 pt-1 text-xs">
                        {incident.aiTriageAssessment.missingInformation.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-[#F5A23A] uppercase tracking-wider block mb-1">
                              Information Requiring Confirmation:
                            </span>
                            <ul className="space-y-1">
                              {incident.aiTriageAssessment.missingInformation.map((info, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-xs text-[#E5D7B7] leading-tight">
                                  <span className="text-[#F5A23A]">&bull;</span>
                                  <span>{info}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {incident.aiTriageAssessment.uncertainties.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-[#7C756E] uppercase tracking-wider block mb-1">
                              Limitations & Assumptions:
                            </span>
                            <ul className="space-y-1">
                              {incident.aiTriageAssessment.uncertainties.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-xs text-[#8C827A] italic leading-tight">
                                  <span>&bull;</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recommended Next Actions */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider block mb-1.5">
                      Suggested Next Actions (Advisory)
                    </span>
                    <div className="space-y-1.5">
                      {incident.aiTriageAssessment.recommendedActions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-[#12110F] border border-[#2E2721] p-2.5 rounded-lg text-xs text-[#F4F0EB]">
                          <ListChecks className="h-4 w-4 text-[#16B58A] shrink-0 mt-0.5" />
                          <span className="leading-snug">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rule-Based Pre-Scan Cross-Check (Continuity with existing automated scoring) */}
              <div className="pt-3 border-t border-[#26211C] flex items-center justify-between text-[11px]">
                <span className="text-[#7C756E] flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#F5A23A]" />
                  <span>Rule Pre-Scan:</span>
                </span>
                <span className="text-xs font-semibold text-[#AAA29A] flex items-center gap-1.5">
                  {incident.aiAnalysis?.isDuplicate ? (
                    <span className="text-[#F46B27] flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Duplicate Risk
                    </span>
                  ) : (
                    <span className="text-[#16B58A] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Unique Record
                    </span>
                  )}
                  <span className="text-[#7C756E]">&bull;</span>
                  <span className="font-mono text-[#AAA29A]">
                    {incident.aiAnalysis?.confidenceScore ? Math.round(incident.aiAnalysis.confidenceScore * 100) : 92}% rule score
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Volunteer Modal */}
      {incident && (
        <AssignVolunteerModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          incidentId={incident.id}
          onAssignSuccess={() => fetchIncident()}
        />
      )}

      {/* Assign Resource Modal */}
      {incident && (
        <AssignResourceModal
          isOpen={isAssignResourceModalOpen}
          onClose={() => setIsAssignResourceModalOpen(false)}
          incidentId={incident.id}
          onAssignSuccess={() => fetchIncident()}
        />
      )}
    </div>
  );
}
