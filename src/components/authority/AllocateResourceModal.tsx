import React, { useEffect, useState } from 'react';
import { X, Package, Truck, AlertCircle, Loader2, CheckCircle2, RotateCcw, Activity } from 'lucide-react';
import { Button } from '../ui/Button';
import { MockAPI, isClosedIncidentStatus } from '../../services/mockApi';
import { Resource, Incident } from '../../types';

interface AllocateResourceModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AllocateResourceModal({ resource, isOpen, onClose, onSuccess }: AllocateResourceModalProps) {
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && resource) {
      setIsLoading(true);
      setErrorMessage(null);
      setSelectedIncidentId('');
      setCurrentIncident(null);

      Promise.all([
        MockAPI.getIncidents(),
        resource.currentIncidentId ? MockAPI.getIncidentById(resource.currentIncidentId) : Promise.resolve(null)
      ]).then(([allIncidents, attachedInc]) => {
        // Filter out closed, completed, and dismissed incidents
        const eligible = allIncidents.filter(inc => !isClosedIncidentStatus(inc.status));
        setActiveIncidents(eligible);
        if (eligible.length > 0) {
          setSelectedIncidentId(eligible[0].id);
        }
        if (attachedInc) {
          setCurrentIncident(attachedInc);
        }
        setIsLoading(false);
      }).catch(err => {
        setErrorMessage(err?.message || 'Failed to load operational incidents.');
        setIsLoading(false);
      });
    }
  }, [isOpen, resource]);

  if (!isOpen || !resource) return null;

  const isAlreadyAllocated = resource.status === 'Allocated' || resource.status === 'In Use';

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId) {
      setErrorMessage('Please select an active incident to allocate this resource to.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await MockAPI.allocateResource(resource.id, selectedIncidentId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to allocate resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Resource['status']) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await MockAPI.updateResourceStatus(resource.id, newStatus);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to update status to ${newStatus}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelease = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await MockAPI.releaseResource(resource.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to release resource back to depot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#12110F] border border-[#38302A] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] text-[#F4F0EB] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26211C] bg-[#12110F]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#27211B] border border-[#38302A] text-[#F5A23A]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F4F0EB]">
                {isAlreadyAllocated ? 'Manage Resource Allocation' : 'Allocate Resource to Incident'}
              </h2>
              <p className="text-xs text-[#AAA29A]">Palghar Emergency Logistics &amp; Stockpile Dispatch</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#27211B] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 bg-[#E53935]/10 border border-[#E53935]/40 rounded-xl text-xs text-[#FF8A80] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#FF8A80] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Selected Asset Information Card */}
          <div className="p-4 rounded-xl bg-[#191715] border border-[#38302A] space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Asset Details</span>
                <h3 className="text-sm font-bold text-[#F4F0EB] mt-0.5">{resource.name}</h3>
                <p className="text-[11px] font-mono text-[#AAA29A] mt-0.5">ID: {resource.id}</p>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border capitalize ${
                  resource.status === 'Available'
                    ? 'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/40'
                    : 'bg-[#F46B27]/15 text-[#F46B27] border-[#F46B27]/40'
                }`}
              >
                {resource.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#26211C] text-xs">
              <div>
                <span className="text-[#7C756E] text-[10px] block">Category</span>
                <span className="font-semibold text-[#F4F0EB]">{resource.type}</span>
              </div>
              <div>
                <span className="text-[#7C756E] text-[10px] block">Stock Quantity</span>
                <span className="font-mono font-bold text-[#F5A23A]">{resource.quantity || 1} Units</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[#7C756E] text-[10px] block">Depot Location</span>
                <span className="text-[#AAA29A] truncate block">{resource.location?.address || 'Palghar Depot'}</span>
              </div>
            </div>
          </div>

          {/* Scenario A: Asset is Already Allocated or In Use */}
          {isAlreadyAllocated ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#27211B]/60 border border-[#38302A] space-y-2">
                <span className="text-[10px] font-mono font-bold text-[#F5A23A] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#F5A23A]" />
                  Active Operational Deployment
                </span>
                {currentIncident ? (
                  <div>
                    <p className="text-xs font-bold text-[#F4F0EB]">
                      {currentIncident.id.replace(/^inc_/i, 'INC-').toUpperCase()}: {currentIncident.title}
                    </p>
                    <p className="text-xs text-[#AAA29A] mt-0.5">
                      Sector: {currentIncident.location?.address || 'Palghar District'} &bull; Status: {currentIncident.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#AAA29A]">
                    Assigned Incident ID: {resource.currentIncidentId?.replace(/^inc_/i, 'INC-').toUpperCase() || 'Assigned'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#AAA29A]">Deployment Lifecycle Control:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {resource.status === 'Allocated' ? (
                    <Button
                      type="button"
                      onClick={() => handleUpdateStatus('In Use')}
                      disabled={isSubmitting}
                      className="bg-[#F46B27] hover:bg-[#f57b3d] text-white font-bold text-xs h-9 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                      <span>Mark as "In Use" (On-Scene)</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleUpdateStatus('Allocated')}
                      disabled={isSubmitting}
                      className="bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border border-[#38302A] font-bold text-xs h-9 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                      <span>Mark as "Allocated" (Staged)</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRelease}
                    disabled={isSubmitting}
                    className="bg-[#191715] hover:bg-[#27211B] border-[#16B58A]/50 text-[#16B58A] font-bold text-xs h-9 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Release Back to Depot</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Scenario B: Asset is Available -> Select Active Incident to Allocate */
            <form onSubmit={handleAllocate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#AAA29A] block">
                  Select Target Active Incident <span className="text-[#F5A23A]">*</span>
                </label>

                {isLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center text-[#AAA29A] gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#F5A23A]" />
                    <span className="text-xs">Loading active operational incidents...</span>
                  </div>
                ) : activeIncidents.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#191715] border border-[#38302A] text-center space-y-1">
                    <p className="text-xs font-bold text-[#F4F0EB]">No Eligible Active Incidents</p>
                    <p className="text-[11px] text-[#AAA29A]">
                      All current incidents in the system are either resolved, completed, or dismissed. New resources cannot be dispatched without an active operational incident.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeIncidents.map(inc => {
                      const isSelected = selectedIncidentId === inc.id;
                      const displayId = inc.id.replace(/^inc_/i, 'INC-').toUpperCase();
                      const severity = inc.aiAnalysis?.severity || 'medium';

                      return (
                        <div
                          key={inc.id}
                          onClick={() => setSelectedIncidentId(inc.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#27211B] border-[#F5A23A] shadow-xs'
                              : 'bg-[#191715] border-[#38302A] hover:border-[#F5A23A]/50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#F5A23A]">{displayId}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                                severity === 'critical' ? 'bg-[#E53946]/20 text-[#ff727f]' :
                                severity === 'high' ? 'bg-[#F46B27]/20 text-[#F46B27]' :
                                'bg-[#F5A23A]/20 text-[#F5A23A]'
                              }`}>
                                {severity}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-[#F4F0EB] truncate mt-0.5">{inc.title}</p>
                            <p className="text-[11px] text-[#AAA29A] truncate">{inc.location?.address || 'Palghar District'}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#F5A23A] bg-[#F5A23A]' : 'border-[#38302A]'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Allocation Semantics Note */}
              <div className="p-3 rounded-xl bg-[#27211B]/60 border border-[#38302A] text-xs text-[#AAA29A] space-y-1">
                <span className="font-mono font-bold text-[#F4F0EB] text-[11px] block">
                  Whole-Asset Allocation Semantics:
                </span>
                <p className="text-[11px] leading-relaxed">
                  In accordance with district operational protocol, this entire asset cache ({resource.quantity || 1} {resource.type} units) will be committed to the selected emergency operation and tracked on the incident logistics manifest until formally released or resolved.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#26211C]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="bg-[#191715] hover:bg-[#27211B] text-[#AAA29A] hover:text-[#F4F0EB] border-[#38302A] text-xs h-9 px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || activeIncidents.length === 0}
                  className="bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold text-xs h-9 px-4 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Allocating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Allocation</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
