import React, { useEffect, useState } from 'react';
import { X, Search, ShieldAlert, CheckCircle2, AlertTriangle, Loader2, MapPin, Radio as RadioIcon, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { MockAPI } from '../../services/mockApi';
import { Incident, Volunteer } from '../../types';

interface MobilizeVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteer: Volunteer | null;
  onMobilizeSuccess: (volunteerName: string, incidentTitle: string, incidentId: string) => void;
}

export function MobilizeVolunteerModal({
  isOpen,
  onClose,
  volunteer,
  onMobilizeSuccess
}: MobilizeVolunteerModalProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isTransferConfirmed, setIsTransferConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsTransferConfirmed(false);
  }, [selectedIncidentId]);

  useEffect(() => {
    if (isOpen && volunteer) {
      setIsLoading(true);
      setSelectedIncidentId('');
      setIsConfirmed(false);
      setIsTransferConfirmed(false);
      setErrorMessage(null);
      setSearchQuery('');

      MockAPI.getIncidents()
        .then(data => {
          // Filter for active incidents (verified, in_progress, assigned, pending - not resolved or dismissed)
          const active = data.filter(inc => inc.status !== 'resolved' && inc.status !== 'dismissed');
          
          // Sort to prioritize verified and high/critical incidents, with INC-OCPC013B1 prominently selectable
          active.sort((a, b) => {
            const isAOcpc = a.id.toLowerCase().includes('ocpc013b1');
            const isBOcpc = b.id.toLowerCase().includes('ocpc013b1');
            if (isAOcpc && !isBOcpc) return -1;
            if (!isAOcpc && isBOcpc) return 1;

            if (a.status === 'verified' && b.status !== 'verified') return -1;
            if (a.status !== 'verified' && b.status === 'verified') return 1;
            return 0;
          });

          setIncidents(active);
          
          // Pre-select assigned incident if responder is already assigned, otherwise OCPC013B1 or first
          const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();
          if (volunteer.currentAssignmentId) {
            const assignedMatch = active.find(
              i => i.id === volunteer.currentAssignmentId || normalizeId(i.id) === normalizeId(volunteer.currentAssignmentId!)
            );
            if (assignedMatch) {
              setSelectedIncidentId(assignedMatch.id);
            } else if (active.length > 0) {
              setSelectedIncidentId(active[0].id);
            }
          } else {
            const ocpcMatch = active.find(i => i.id.toLowerCase().includes('ocpc013b1'));
            if (ocpcMatch) {
              setSelectedIncidentId(ocpcMatch.id);
            } else if (active.length > 0) {
              setSelectedIncidentId(active[0].id);
            }
          }
        })
        .catch(err => {
          console.error('Failed to load incidents for mobilization', err);
          setErrorMessage('Unable to load active incidents. Please check connection and try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, volunteer]);

  if (!isOpen || !volunteer) return null;

  const normalizeId = (s: string) => (s || '').replace(/^inc_/i, '').replace(/^inc-/i, '').toLowerCase().trim();
  const currentAssignedInc = incidents.find(i => {
    if (!volunteer.currentAssignmentId) return false;
    return i.id === volunteer.currentAssignmentId || normalizeId(i.id) === normalizeId(volunteer.currentAssignmentId);
  });
  const isTransfer = Boolean(
    currentAssignedInc && 
    selectedIncidentId && 
    normalizeId(currentAssignedInc.id) !== normalizeId(selectedIncidentId)
  );

  const filteredIncidents = incidents.filter(inc => {
    const q = searchQuery.toLowerCase();
    const displayId = inc.id.replace(/^inc_/i, 'INC-').toUpperCase();
    return (
      displayId.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q) ||
      (inc.location?.address || '').toLowerCase().includes(q) ||
      (inc.type || '').toLowerCase().includes(q) ||
      (inc.urgency || '').toLowerCase().includes(q)
    );
  });

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);

  const handleConfirmMobilize = async () => {
    if (!selectedIncidentId) {
      setErrorMessage('Please select an active incident before mobilizing.');
      return;
    }
    if (isTransfer && !isTransferConfirmed) {
      setErrorMessage('Please confirm the responder transfer acknowledgment before mobilizing.');
      return;
    }
    if (!isConfirmed) {
      setErrorMessage('Please acknowledge and check the operational confirmation box.');
      return;
    }
    if (volunteer.status === 'deployed') {
      setErrorMessage(`Responder "${volunteer.name}" is already deployed in the field.`);
      return;
    }
    if (volunteer.status === 'offline') {
      setErrorMessage(`Responder "${volunteer.name}" is offline and cannot be mobilized.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await MockAPI.mobilizeVolunteerToIncident(volunteer.id, selectedIncidentId, isTransfer);
      const incTitle = selectedIncident ? selectedIncident.title : selectedIncidentId;
      onMobilizeSuccess(volunteer.name, incTitle, selectedIncidentId);
      onClose();
    } catch (err: any) {
      console.error('Mobilization error:', err);
      setErrorMessage(err?.message || 'Failed to mobilize unit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    const u = (urgency || 'medium').toLowerCase();
    if (u === 'critical') return 'bg-[#E53935]/15 text-[#E53935] border-[#E53935]/40';
    if (u === 'high') return 'bg-[#F46B27]/15 text-[#F46B27] border-[#F46B27]/40';
    if (u === 'medium') return 'bg-[#F5A23A]/15 text-[#F5A23A] border-[#F5A23A]/40';
    return 'bg-[#27211B] text-[#AAA29A] border-[#38302A]';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'verified') return 'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/40';
    if (status === 'in_progress') return 'bg-[#2E54E8]/15 text-[#5880FB] border-[#2E54E8]/40';
    if (status === 'assigned') return 'bg-[#A855F7]/15 text-[#C084FC] border-[#A855F7]/40';
    return 'bg-[#F5A23A]/15 text-[#F5A23A] border-[#F5A23A]/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#12110F] border border-[#38302A] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#F4F0EB] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobilize-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26211C] bg-[#161412]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#27211B] border border-[#38302A] text-[#F5A23A] flex items-center justify-center font-mono font-bold text-xs">
              <RadioIcon className="h-5 w-5 text-[#F5A23A]" />
            </div>
            <div>
              <h2 id="mobilize-dialog-title" className="text-base font-bold text-[#F4F0EB]">
                Mobilize Tactical Unit
              </h2>
              <p className="text-xs text-[#AAA29A]">
                Dispatch operational responder to an active verified incident
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#27211B] rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Simulation Disclaimer Banner */}
          <div className="p-3 rounded-xl bg-[#F5A23A]/10 border border-[#F5A23A]/30 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-[#F5A23A] shrink-0 mt-0.5" />
            <div className="text-xs text-[#E5D7CA] leading-relaxed">
              <span className="font-bold text-[#F5A23A] uppercase tracking-wider text-[10px] mr-1.5">
                Simulated Operational Dispatch:
              </span>
              This prototype action coordinates test readiness and records mobilization into the verified incident timeline. It does not contact real emergency services or trigger real SMS.
            </div>
          </div>

          {/* Responder Profile Summary Card */}
          <Card className="bg-[#191715] border-[#38302A] shadow-xs">
            <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-[#27211B] border border-[#38302A] text-[#F5A23A] font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  {volunteer.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#F4F0EB] truncate">{volunteer.name}</h3>
                    <span className="text-[10px] font-mono font-bold text-[#7C756E] px-1.5 py-0.5 rounded bg-[#12110F] border border-[#38302A]">
                      ID: {volunteer.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#AAA29A]">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <MapPin className="h-3 w-3 text-[#F5A23A]" />
                      {volunteer.distance || volunteer.location?.address || 'Palghar District'}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${
                      volunteer.status === 'available'
                        ? 'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/40'
                        : volunteer.status === 'assigned'
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                        : volunteer.status === 'deployed'
                        ? 'bg-[#F46B27]/15 text-[#F46B27] border-[#F46B27]/40'
                        : 'bg-[#27211B] text-[#AAA29A] border-[#38302A]'
                    }`}>
                      {volunteer.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {volunteer.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#27211B] text-[#AAA29A] border border-[#38302A]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Incident Selection Header & Search */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-[#AAA29A] flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-[#F5A23A]" />
                Select Target Active Incident:
              </label>
              <span className="text-[11px] font-mono text-[#7C756E]">
                {filteredIncidents.length} active incidents available
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C756E]" />
              <Input
                placeholder="Search incident by ID (e.g. INC-OCPC013B1), title, or location..."
                className="pl-8.5 h-8.5 text-xs bg-[#161412] border-[#38302A] text-[#F4F0EB]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Incidents List */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#AAA29A]">
              <Loader2 className="h-6 w-6 text-[#F5A23A] animate-spin mb-2" />
              <p className="text-xs font-mono">Loading active verified incidents...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="py-8 text-center bg-[#191715] rounded-xl border border-[#38302A] text-xs text-[#7C756E]">
              No active incidents match your filter.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filteredIncidents.map(inc => {
                const isSelected = selectedIncidentId === inc.id;
                const displayId = inc.id.replace(/^inc_/i, 'INC-').toUpperCase();
                const isOcpcTarget = displayId.includes('OCPC013B1');

                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#27211B] border-[#F5A23A] shadow-xs'
                        : 'bg-[#191715] border-[#38302A] hover:border-[#F5A23A]/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          isOcpcTarget 
                            ? 'bg-[#F5A23A]/20 text-[#F5A23A] border-[#F5A23A]' 
                            : 'bg-[#12110F] text-[#F5A23A] border-[#38302A]'
                        }`}>
                          {displayId}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getStatusBadge(inc.status)}`}>
                          {inc.status}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getUrgencyBadge(inc.urgency)}`}>
                          {inc.urgency || 'Medium'} Urgency
                        </span>
                        {isOcpcTarget && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#16B58A]/15 text-[#16B58A] border border-[#16B58A]/40">
                            TEST TARGET
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-[#F4F0EB] truncate mb-0.5">{inc.title}</h4>
                      <p className="text-[11px] text-[#AAA29A] flex items-center gap-1 font-mono truncate">
                        <MapPin className="h-3 w-3 text-[#F5A23A] shrink-0" />
                        {inc.location?.address || 'Palghar District, Maharashtra'}
                      </p>

                      {inc.assignedTeam && inc.assignedTeam !== 'Unassigned' && (
                        <p className="text-[10px] text-[#7C756E] mt-1 font-mono">
                          Assigned: <span className="text-[#AAA29A]">{inc.assignedTeam}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-0.5 shrink-0">
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected 
                          ? 'border-[#F5A23A] bg-[#F5A23A] text-stone-950' 
                          : 'border-[#38302A] bg-transparent'
                      }`}>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-stone-950" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#E53935]/10 border border-[#E53935]/40 flex items-center gap-2 text-xs text-[#FF8A80]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Transfer Warning Banner & Confirmation (Single Active Incident Invariant) */}
          {isTransfer && currentAssignedInc && (
            <div className="p-3.5 rounded-xl bg-[#E53935]/10 border border-[#E53935]/40 space-y-2.5 text-xs animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5 text-[#FF8A80]">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-[#E53935]" />
                <div className="leading-relaxed">
                  <span className="font-bold uppercase tracking-wider text-[11px] font-mono mr-1.5 text-[#FF8A80]">
                    Reassignment Transfer Alert:
                  </span>
                  Responder <strong className="text-[#F4F0EB]">{volunteer.name} ({volunteer.id})</strong> is currently assigned to active incident{' '}
                  <strong className="text-[#F5A23A]">
                    {currentAssignedInc.id.replace(/^inc_/i, 'INC-').toUpperCase()} ({currentAssignedInc.title})
                  </strong>.
                  <span className="block mt-1 text-[#AAA29A]">
                    Mobilizing to this target incident will <strong className="text-[#F4F0EB]">atomically release</strong> them from {currentAssignedInc.id.replace(/^inc_/i, 'INC-').toUpperCase()} to maintain the single-active-assignment rule.
                  </span>
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-2 border-t border-[#E53935]/30 cursor-pointer text-[#F4F0EB]">
                <input
                  type="checkbox"
                  checked={isTransferConfirmed}
                  onChange={e => setIsTransferConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#E53935]/60 bg-[#12110F] text-[#F5A23A] focus:ring-[#F5A23A] cursor-pointer"
                />
                <span className="text-[11px] leading-snug text-[#E5D7CA]">
                  <strong className="text-[#F4F0EB]">Authorize Transfer:</strong> I acknowledge and confirm transferring responder {volunteer.name} away from{' '}
                  <span className="text-[#F5A23A] font-mono font-semibold">{currentAssignedInc.id.replace(/^inc_/i, 'INC-').toUpperCase()}</span> to{' '}
                  <span className="text-[#16B58A] font-mono font-semibold">{selectedIncident ? selectedIncident.id.replace(/^inc_/i, 'INC-').toUpperCase() : 'target incident'}</span>.
                </span>
              </label>
            </div>
          )}

          {/* Explicit Confirmation Checkbox (Requirement 3) */}
          <div className="p-3 rounded-xl bg-[#161412] border border-[#38302A] space-y-1.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={e => setIsConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#38302A] bg-[#12110F] text-[#F5A23A] focus:ring-[#F5A23A] cursor-pointer"
              />
              <div className="text-xs text-[#F4F0EB]">
                <span className="font-semibold">Confirm Operational Mobilization:</span>
                <span className="text-[#AAA29A] block text-[11px] mt-0.5">
                  I authorize the deployment of responder <strong className="text-[#F4F0EB]">{volunteer.name} ({volunteer.id})</strong> to active incident <strong className="text-[#F5A23A]">{selectedIncident ? selectedIncident.id.replace(/^inc_/i, 'INC-').toUpperCase() : 'selected incident'}</strong>. This updates their status to Deployed and records the dispatch in the incident timeline.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#26211C] bg-[#161412] flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-[#38302A] bg-[#191715] hover:bg-[#27211B] text-[#AAA29A] text-xs h-9 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleConfirmMobilize}
            disabled={
              !selectedIncidentId || 
              !isConfirmed || 
              (isTransfer && !isTransferConfirmed) || 
              isSubmitting || 
              (volunteer.status !== 'available' && volunteer.status !== 'assigned')
            }
            className="bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold text-xs h-9 px-4 shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Mobilizing Unit...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirm & Mobilize Unit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
