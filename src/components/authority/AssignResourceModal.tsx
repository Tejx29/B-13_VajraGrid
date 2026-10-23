import React, { useEffect, useState } from 'react';
import { X, Package, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { MockAPI } from '../../services/mockApi';
import { Resource } from '../../types';

interface AssignResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  onAssignSuccess: () => void;
}

export function AssignResourceModal({ isOpen, onClose, incidentId, onAssignSuccess }: AssignResourceModalProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targetIncidentStatus, setTargetIncidentStatus] = useState<string>('pending');

  useEffect(() => {
    if (isOpen && incidentId) {
      setIsLoading(true);
      setErrorMessage(null);
      Promise.all([
        MockAPI.getResources(),
        MockAPI.getIncidentById(incidentId)
      ]).then(([data, inc]) => {
        const available = data.filter(r => r.status === 'Available');
        setResources(available);
        if (inc) {
          setTargetIncidentStatus(inc.status);
          if (inc.status === 'resolved' || inc.status === 'dismissed') {
            setErrorMessage(`Incident ${inc.id.replace(/^inc_/i, 'INC-').toUpperCase()} is ${inc.status} and cannot receive new resource allocations.`);
          }
        }
        setIsLoading(false);
      }).catch(err => {
        setErrorMessage(err?.message || 'Failed to load resources.');
        setIsLoading(false);
      });
    }
  }, [isOpen, incidentId]);

  if (!isOpen) return null;

  const handleAllocate = async (resourceId: string) => {
    setIsAssigning(resourceId);
    setErrorMessage(null);
    try {
      await MockAPI.allocateResource(resourceId, incidentId);
      onAssignSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to allocate resource. Please try again.');
    } finally {
      setIsAssigning(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#12110F] border border-[#38302A] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] text-[#F4F0EB] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26211C] bg-[#12110F]">
          <div>
            <h2 className="text-base font-bold text-[#F4F0EB]">Allocate Emergency Resource</h2>
            <p className="text-xs text-[#AAA29A]">Select available depot stock or vehicles to deploy</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#27211B] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-[#E53935]/10 border border-[#E53935]/40 rounded-xl text-xs text-[#FF8A80] leading-relaxed">
              <span className="font-bold font-mono uppercase mr-1">Notice:</span>
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#F5A23A] animate-spin mb-4" />
              <p className="text-xs font-medium text-[#AAA29A]">Loading resource depots...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <Package className="w-12 h-12 text-[#7C756E] mb-3" />
               <p className="font-bold text-[#F4F0EB] text-sm">No resources available</p>
               <p className="text-xs text-[#AAA29A]">All depot equipment is currently allocated or in field use.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((resource) => (
                <Card key={resource.id} className="border border-[#38302A] bg-[#191715] shadow-xs overflow-hidden hover:border-[#F5A23A]/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#27211B] flex items-center justify-center border border-[#38302A] text-[#F5A23A] shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-[#F4F0EB] truncate">{resource.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center text-[11px] font-mono font-medium text-[#AAA29A]">
                            <MapPin className="w-3 h-3 mr-1 text-[#F5A23A]" />
                            {resource.location?.lat ? `${resource.location.lat.toFixed(2)}, ${resource.location.lng.toFixed(2)}` : 'Palghar Depot'}
                          </span>
                          <span className="flex items-center text-[11px] font-mono font-bold text-[#16B58A]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {resource.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            <span className="px-1.5 py-0.5 bg-[#27211B] text-[#AAA29A] border border-[#38302A] rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                              {resource.type}
                            </span>
                            {resource.quantity && resource.quantity > 1 && (
                               <span className="px-1.5 py-0.5 bg-[#27211B] text-[#F5A23A] border border-[#38302A] rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                                 Qty: {resource.quantity}
                               </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleAllocate(resource.id)}
                      disabled={isAssigning === resource.id || targetIncidentStatus === 'resolved' || targetIncidentStatus === 'dismissed'}
                      className="shrink-0 font-bold text-xs bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 shadow-xs h-8 cursor-pointer disabled:opacity-50"
                    >
                      {isAssigning === resource.id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : null}
                      {targetIncidentStatus === 'resolved' || targetIncidentStatus === 'dismissed'
                        ? 'Incident Closed'
                        : isAssigning === resource.id
                        ? 'Allocating...'
                        : 'Allocate'}
                    </Button>

                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
