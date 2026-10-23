import React, { useEffect, useState } from 'react';
import { X, MapPin, CheckCircle2, User, Loader2, Star, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { MockAPI } from '../../services/mockApi';
import { Volunteer, CandidateRoster } from '../../types';

interface AssignVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  onAssignSuccess: () => void;
}

export function AssignVolunteerModal({ isOpen, onClose, incidentId, onAssignSuccess }: AssignVolunteerModalProps) {
  const [roster, setRoster] = useState<CandidateRoster | null>(null);
  const [activeTab, setActiveTab] = useState<'recommended' | 'all' | 'unavailable'>('recommended');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targetIncidentStatus, setTargetIncidentStatus] = useState<string>('pending');
  const [incidentTitle, setIncidentTitle] = useState<string>('');

  useEffect(() => {
    if (isOpen && incidentId) {
      setIsLoading(true);
      setErrorMessage(null);
      setActiveTab('recommended');

      Promise.all([
        MockAPI.getResponderCandidateRoster(incidentId),
        MockAPI.getIncidentById(incidentId)
      ]).then(([candidateRoster, inc]) => {
        setRoster(candidateRoster);
        if (inc) {
          setTargetIncidentStatus(inc.status);
          setIncidentTitle(inc.type || inc.title);
          if (inc.status === 'resolved' || inc.status === 'dismissed') {
            setErrorMessage(`Incident ${inc.id.replace(/^inc_/i, 'INC-').toUpperCase()} is ${inc.status} and cannot receive new assignments.`);
          }
        }
        setIsLoading(false);
      }).catch(err => {
        setErrorMessage(err?.message || 'Failed to load responder candidates.');
        setIsLoading(false);
      });
    }
  }, [isOpen, incidentId]);

  if (!isOpen) return null;

  const handleAssign = async (volunteerId: string) => {
    setIsAssigning(volunteerId);
    setErrorMessage(null);
    try {
      await MockAPI.assignVolunteerToIncident(volunteerId, incidentId, true);
      onAssignSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to assign unit. Please try again.');
    } finally {
      setIsAssigning(null);
    }
  };

  const isClosed = targetIncidentStatus === 'resolved' || targetIncidentStatus === 'dismissed';
  const displayIncidentId = incidentId.replace(/^inc_/i, 'INC-').toUpperCase();

  const recommendedCount = roster?.recommended.length || 0;
  const allAvailableCount = roster?.allAvailable.length || 0;
  const unavailableCount = roster?.unavailable.length || 0;
  const otherCount = roster?.otherAvailable.length || 0;

  // Select which candidates to display based on active tab
  let displayCandidates: Volunteer[] = [];
  if (roster) {
    if (activeTab === 'recommended') {
      displayCandidates = roster.recommended;
    } else if (activeTab === 'all') {
      displayCandidates = roster.allAvailable;
    } else {
      displayCandidates = roster.unavailable;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#12110F] border border-[#38302A] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] text-[#F4F0EB] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#26211C] bg-[#12110F]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F4F0EB]">Assign Responder Unit</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#27211B] text-[#F5A23A] border border-[#38302A]">
                  {displayIncidentId}
                </span>
              </div>
              <p className="text-xs text-[#AAA29A] mt-0.5">
                Tactical responder suitability based on location proximity & certified disaster skills
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#27211B] rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metrics summary bar */}
          {!isLoading && roster && (
            <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-[#26211C]/80 font-mono">
              <div className="flex items-center gap-3">
                <span className="text-[#F5A23A] font-semibold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#F5A23A]" />
                  Recommended: <strong className="text-white ml-0.5">{recommendedCount}</strong>
                </span>
                <span className="text-[#AAA29A]">&bull;</span>
                <span className="text-[#16B58A] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Available: <strong className="text-white ml-0.5">{allAvailableCount}</strong>
                </span>
                <span className="text-[#AAA29A]">&bull;</span>
                <span className="text-[#7C756E]">
                  Roster: {roster.totalPersonnel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* View Selection Tabs */}
        {!isLoading && roster && (
          <div className="flex border-b border-[#26211C] bg-[#0E0D0C] px-6 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('recommended')}
              className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'recommended'
                  ? 'border-[#F5A23A] text-[#F5A23A]'
                  : 'border-transparent text-[#AAA29A] hover:text-[#F4F0EB]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeTab === 'recommended' ? 'fill-[#F5A23A]' : ''}`} />
              Recommended ({recommendedCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'all'
                  ? 'border-[#16B58A] text-[#16B58A]'
                  : 'border-transparent text-[#AAA29A] hover:text-[#F4F0EB]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Available ({allAvailableCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unavailable')}
              className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'unavailable'
                  ? 'border-[#7C756E] text-[#F4F0EB]'
                  : 'border-transparent text-[#7C756E] hover:text-[#AAA29A]'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Unavailable ({unavailableCount})
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-3.5 max-h-[60vh]">
          {errorMessage && (
            <div className="p-3 bg-[#E53935]/10 border border-[#E53935]/40 rounded-xl text-xs text-[#FF8A80] leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF8A80]" />
              <div>
                <span className="font-bold font-mono uppercase mr-1">Notice:</span>
                {errorMessage}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#F5A23A] animate-spin mb-4" />
              <p className="text-xs font-medium text-[#AAA29A]">Analyzing responder proximity and certified skills...</p>
            </div>
          ) : displayCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="w-10 h-10 text-[#7C756E] mb-3" />
              <p className="font-bold text-[#F4F0EB] text-sm">
                {activeTab === 'recommended'
                  ? 'No high-match recommendations found'
                  : activeTab === 'all'
                  ? 'No available responders'
                  : 'No personnel in this status'}
              </p>
              <p className="text-xs text-[#AAA29A] mt-1 max-w-sm">
                {activeTab === 'recommended' && allAvailableCount > 0
                  ? `There are ${allAvailableCount} available responders on duty. You can view and assign them via the "All Available" tab.`
                  : 'All certified personnel are currently assigned, deployed, or offline.'}
              </p>
              {activeTab === 'recommended' && allAvailableCount > 0 && (
                <Button
                  onClick={() => setActiveTab('all')}
                  className="mt-4 bg-[#27211B] border border-[#38302A] text-[#F4F0EB] hover:bg-[#342c24] text-xs"
                >
                  View All Available Responders ({allAvailableCount})
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayCandidates.map((volunteer) => {
                const isVolRecommended = volunteer.isRecommended ?? false;
                const isUnavailable = volunteer.status !== 'available';

                return (
                  <Card 
                    key={volunteer.id} 
                    className={`border transition-all shadow-xs overflow-hidden ${
                      isUnavailable
                        ? 'border-[#26211C] bg-[#141311] opacity-75'
                        : isVolRecommended
                        ? 'border-[#F5A23A]/40 bg-[#191715] hover:border-[#F5A23A]/70'
                        : 'border-[#38302A] bg-[#191715] hover:border-[#16B58A]/50'
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left info column */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs border ${
                          isUnavailable
                            ? 'bg-[#1C1A18] border-[#2E2924] text-[#7C756E]'
                            : isVolRecommended
                            ? 'bg-[#27211B] border-[#F5A23A]/40 text-[#F5A23A]'
                            : 'bg-[#27211B] border-[#38302A] text-[#16B58A]'
                        }`}>
                          {volunteer.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-bold text-[#F4F0EB]">{volunteer.name}</h3>
                            <span className="text-[10px] font-mono text-[#7C756E]">({volunteer.id})</span>
                            
                            {/* Match/Status Badge */}
                            {isUnavailable ? (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                                {volunteer.status}
                              </span>
                            ) : isVolRecommended ? (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40 flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-[#F5A23A]" />
                                Recommended Match
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#16B58A]/15 text-[#16B58A] border border-[#16B58A]/30">
                                Available for Dispatch
                              </span>
                            )}
                          </div>

                          {/* Location & Status Line */}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center text-[11px] font-mono text-[#AAA29A]">
                              <MapPin className="w-3 h-3 mr-1 text-[#F5A23A]" />
                              {volunteer.distance || volunteer.location?.address || 'Palghar District'}
                            </span>
                            <span className={`flex items-center text-[11px] font-mono font-bold ${
                              isUnavailable ? 'text-[#AAA29A]' : 'text-[#16B58A]'
                            }`}>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                            </span>
                          </div>

                          {/* Recommendation explanation reasons */}
                          {volunteer.matchReasons && volunteer.matchReasons.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {volunteer.matchReasons.map((reason, idx) => (
                                <span 
                                  key={idx} 
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    isVolRecommended
                                      ? 'bg-[#27211B] text-[#F5A23A] border border-[#F5A23A]/30'
                                      : 'bg-[#1C1A18] text-[#AAA29A] border border-[#2E2924]'
                                  }`}
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Ineligible explanation for unavailable responders */}
                          {isUnavailable && volunteer.ineligibleReason && (
                            <div className="mt-1 text-[11px] text-[#FF8A80] font-mono flex items-center gap-1">
                              <Info className="w-3 h-3 shrink-0" />
                              <span>{volunteer.ineligibleReason}</span>
                            </div>
                          )}

                          {/* Skills badges */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {volunteer.skills.map(skill => (
                              <span 
                                key={skill} 
                                className="px-1.5 py-0.5 bg-[#27211B] text-[#AAA29A] border border-[#38302A] rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right action button */}
                      <Button 
                        onClick={() => handleAssign(volunteer.id)}
                        disabled={
                          isAssigning === volunteer.id || 
                          isUnavailable || 
                          isClosed
                        }
                        className={`shrink-0 font-bold text-xs h-8 px-3.5 shadow-xs transition-all ${
                          isUnavailable
                            ? 'bg-[#27211B] text-[#7C756E] border border-[#38302A] cursor-not-allowed'
                            : isVolRecommended
                            ? 'bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 cursor-pointer'
                            : 'bg-[#191715] hover:bg-[#27211B] text-[#F4F0EB] border border-[#16B58A]/50 hover:border-[#16B58A] cursor-pointer'
                        }`}
                      >
                        {isAssigning === volunteer.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : null}
                        {isClosed
                          ? 'Incident Closed'
                          : volunteer.status === 'offline'
                          ? 'Offline / Off Duty'
                          : volunteer.status === 'assigned'
                          ? 'Already Assigned'
                          : volunteer.status === 'deployed'
                          ? 'Already Deployed'
                          : 'Assign Unit'}
                      </Button>

                    </CardContent>
                  </Card>
                );
              })}

              {/* Discovery prompt in recommended tab when lower-match candidates exist */}
              {activeTab === 'recommended' && otherCount > 0 && (
                <div className="mt-4 p-3 bg-[#191715] border border-[#38302A] rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#AAA29A]">
                    <Info className="w-4 h-4 text-[#F5A23A] shrink-0" />
                    <span>
                      Looking for more units? <strong className="text-[#F4F0EB]">{otherCount}</strong> other available responder is on duty across Palghar sectors.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="text-[#F5A23A] hover:underline font-semibold font-mono text-[11px] shrink-0 cursor-pointer"
                  >
                    View All ({allAvailableCount}) &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#26211C] bg-[#0E0D0C] flex items-center justify-between text-xs text-[#AAA29A]">
          <span className="font-mono text-[11px]">
            Palghar District Emergency Operations &bull; Single-incident assignment enforcement active
          </span>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-[#191715] border-[#38302A] text-[#AAA29A] hover:text-[#F4F0EB] text-xs h-7 px-3"
          >
            Cancel
          </Button>
        </div>

      </div>
    </div>
  );
}
