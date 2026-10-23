import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { ShieldAlert, MapPin, Clock, CheckCircle, Navigation, PlayCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MockAPI } from '../../services/mockApi';
import { Incident, Volunteer } from '../../types';

export function VolunteerDashboard() {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine volunteer ID from logged-in user or stored active responder profile
  const volunteerId = (user?.id && user.id.startsWith('vol_')) 
    ? user.id 
    : (user?.email?.toLowerCase().includes('sarah') ? 'vol_1' 
      : user?.email?.toLowerCase().includes('marcus') ? 'vol_2' 
      : user?.email?.toLowerCase().includes('anita') ? 'vol_3'
      : user?.email?.toLowerCase().includes('james') ? 'vol_4'
      : user?.email?.toLowerCase().includes('rahul') ? 'vol_5'
      : user?.email?.toLowerCase().includes('amit') ? 'vol_6'
      : user?.email?.toLowerCase().includes('neha') ? 'vol_7'
      : 'vol_5');

  const [responderProfile, setResponderProfile] = useState<Volunteer | null>(null);

  const fetchAssignment = async () => {
    setLoading(true);
    const [asg, vList] = await Promise.all([
      MockAPI.getVolunteerAssignment(volunteerId),
      MockAPI.getVolunteers()
    ]);
    setAssignment(asg || null);
    const profile = vList.find(v => v.id === volunteerId);
    if (profile) setResponderProfile(profile);
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignment();
    
    // Polling to simulate real-time updates from authority dispatch
    const interval = setInterval(() => {
      fetchAssignment();
    }, 5000);
    return () => clearInterval(interval);
  }, [volunteerId]);

  const handleUpdateStatus = async (newStatus: Incident['status']) => {
    if (!assignment) return;
    const actorName = responderProfile?.name || user?.name || `Field Responder (${volunteerId})`;
    await MockAPI.updateIncidentStatus(assignment.id, newStatus, undefined, actorName);
    fetchAssignment();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">Field Responder Portal</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40">
              DISPATCH RELAY
            </span>
          </div>
          <p className="text-sm font-medium text-[#AAA29A]">Welcome back, {responderProfile?.name || user?.name || 'Rahul Patil (Search & Rescue)'}.</p>
        </div>
        {user?.status === 'pending' ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#F5A23A]/20 text-[#F5A23A] border border-[#F5A23A]/40">
            Pending Verification
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#16B58A]/20 text-[#16B58A] border border-[#16B58A]/40">
            Active &amp; Ready
          </span>
        )}
      </div>

      {/* Simulated Dispatch Notice */}
      <div className="bg-[#1F1912] border border-[#F5A23A]/30 rounded-xl p-3.5 flex items-start gap-3">
        <div className="p-1 rounded bg-[#F5A23A]/20 text-[#F5A23A] shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-[#F5A23A]">SIMULATED RESPONDER DISPATCH &amp; RELAY (PROTOTYPE DEMONSTRATION)</p>
          <p className="text-[#AAA29A] mt-0.5 leading-relaxed">
            This module demonstrates the <em>During-Disaster</em> field responder workflow: mission acceptance, en-route telemetry relay, on-scene arrival, and completion. All actions are simulated within VajraGrid. Real emergency dispatch requires contacting official district helplines (112 / 02525-252020).
          </p>
        </div>
      </div>
      
      {user?.status === 'pending' ? (
        <Card className="border border-[#F5A23A]/40 shadow-sm bg-[#191715]">
          <CardContent className="p-6">
            <h2 className="text-base font-bold text-[#F5A23A] mb-2">Account Under Review</h2>
            <p className="text-xs text-[#AAA29A] leading-relaxed">
              Your responder profile is currently being verified by Palghar District EOC. 
              Once verified, immediate emergency assignments and mobilization coordinates will appear here.
            </p>
          </CardContent>
        </Card>
      ) : loading && !assignment ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A23A]"></div>
        </div>
      ) : assignment ? (
        <Card className="border border-[#38302A] bg-[#191715] shadow-lg overflow-hidden rounded-xl">
          <div className="bg-[#12110F] border-b border-[#26211C] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#F4F0EB]">
              <ShieldAlert className="w-5 h-5 text-[#E53946]" />
              <h2 className="text-base font-bold">Active Tactical Mission</h2>
            </div>
            <span className="px-3 py-1 bg-[#851D2A]/60 text-[#FF525A] border border-[#E53946]/40 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
              {assignment.status.replace(/_/g, ' ')}
            </span>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-[#F4F0EB]">{assignment.title || assignment.type || 'Emergency'}</h3>
                  <p className="text-[#F5A23A] font-mono text-xs font-bold mt-0.5">{assignment.id.replace('inc_', 'INC-').toUpperCase()}</p>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#F5A23A] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs text-[#F4F0EB]">{assignment.location.address || 'Unknown Location'}</p>
                    <p className="text-xs font-mono text-[#7C756E] mt-0.5">{assignment.location.lat.toFixed(4)}° N, {assignment.location.lng.toFixed(4)}° E</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#AAA29A] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs text-[#F4F0EB]">Reported Timestamp</p>
                    <p className="text-xs font-mono text-[#AAA29A] mt-0.5">{new Date(assignment.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                {assignment.description && (
                  <div className="p-3 bg-[#12110F] rounded-lg border border-[#38302A] text-xs text-[#AAA29A]">
                    <strong className="text-[#F4F0EB] block mb-1">Situation Brief:</strong>
                    {assignment.description}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col justify-center space-y-3 bg-[#12110F] p-6 rounded-xl border border-[#38302A]">
                <h4 className="text-xs font-mono font-bold text-[#7C756E] uppercase tracking-wider mb-2 text-center">
                  Mission Status Relay
                </h4>
                
                {assignment.status === 'assigned' && (
                  <Button size="lg" className="w-full bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 font-bold" onClick={() => handleUpdateStatus('accepted')}>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Accept Assignment
                  </Button>
                )}
                
                {assignment.status === 'accepted' && (
                  <Button size="lg" className="w-full bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold" onClick={() => handleUpdateStatus('on_the_way')}>
                    <Navigation className="w-5 h-5 mr-2" />
                    Mark En Route (On the Way)
                  </Button>
                )}
                
                {assignment.status === 'on_the_way' && (
                  <Button size="lg" className="w-full bg-[#F46B27] hover:bg-[#f57b3d] text-white font-bold" onClick={() => handleUpdateStatus('reached')}>
                    <MapPin className="w-5 h-5 mr-2" />
                    Confirm Arrival at Scene
                  </Button>
                )}
                
                {assignment.status === 'reached' && (
                  <Button size="lg" className="w-full bg-[#E53946] hover:bg-[#f04856] text-white font-bold" onClick={() => handleUpdateStatus('rescue_in_progress')}>
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Commence Rescue Operation
                  </Button>
                )}
                
                {assignment.status === 'rescue_in_progress' && (
                  <Button size="lg" className="w-full bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 font-bold" onClick={() => handleUpdateStatus('completed')}>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Mark Mission Completed
                  </Button>
                )}
                
                {assignment.status === 'completed' && (
                  <div className="text-center p-4">
                    <CheckCircle className="w-12 h-12 text-[#16B58A] mx-auto mb-2" />
                    <p className="font-bold text-[#16B58A] text-sm">Mission Completed</p>
                    <p className="text-xs text-[#AAA29A] mt-1">Status has been relayed to Palghar District Command EOC.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-[#38302A] bg-[#191715]">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-[#27211B] border border-[#38302A] p-4 mb-4">
              <ShieldAlert className="h-8 w-8 text-[#7C756E]" />
            </div>
            <h2 className="text-lg font-bold text-[#F4F0EB] mb-2">No Active Dispatch Orders</h2>
            <p className="text-xs text-[#AAA29A] max-w-md leading-relaxed">
              You currently have no active emergency dispatches. You will be alerted when a priority incident is matched to your skills in Palghar District.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
