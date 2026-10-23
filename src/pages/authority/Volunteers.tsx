import React, { useEffect, useState } from 'react';
import { Users, Search, Clock, UserPlus, CheckCircle, AlertCircle, MapPin, Radio as RadioIcon, X, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { MockAPI } from '../../services/mockApi';
import { Volunteer } from '../../types';
import { MobilizeVolunteerModal } from '../../components/authority/MobilizeVolunteerModal';

export function AuthorityVolunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned' | 'deployed' | 'offline'>('all');
  
  // Mobilization Modal State
  const [selectedVolunteerForMobilize, setSelectedVolunteerForMobilize] = useState<Volunteer | null>(null);
  const [isMobilizeModalOpen, setIsMobilizeModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadVolunteers = async () => {
    try {
      const data = await MockAPI.getVolunteers();
      setVolunteers(data);
    } catch (err) {
      console.error('Failed to load volunteers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, []);

  const handleOpenMobilize = (volunteer: Volunteer) => {
    setFeedback(null);
    if (volunteer.status === 'deployed') {
      const asgId = volunteer.currentAssignmentId 
        ? volunteer.currentAssignmentId.replace(/^inc_/i, 'INC-').toUpperCase() 
        : 'an active mission';
      setFeedback({
        type: 'error',
        message: `Responder "${volunteer.name}" (${volunteer.id}) is already deployed to ${asgId}. To reassign, update or close their existing assignment.`
      });
      return;
    }
    if (volunteer.status === 'offline') {
      setFeedback({
        type: 'error',
        message: `Responder "${volunteer.name}" (${volunteer.id}) is currently offline and unavailable for tactical mobilization.`
      });
      return;
    }

    setSelectedVolunteerForMobilize(volunteer);
    setIsMobilizeModalOpen(true);
  };

  const handleMobilizeSuccess = (volunteerName: string, incidentTitle: string, incidentId: string) => {
    const displayId = incidentId.replace(/^inc_/i, 'INC-').toUpperCase();
    setFeedback({
      type: 'success',
      message: `Unit "${volunteerName}" successfully mobilized to incident ${displayId} (${incidentTitle}). Status updated to Deployed and recorded in incident timeline.`
    });
    // Immediately refresh roster
    loadVolunteers();
  };

  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableCount = volunteers.filter(v => v.status === 'available').length;
  const assignedCount = volunteers.filter(v => v.status === 'assigned').length;
  const deployedCount = volunteers.filter(v => v.status === 'deployed').length;
  const offlineCount = volunteers.filter(v => v.status === 'offline').length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">
              Responders & Volunteer Management
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40">
              PALGHAR DISTRICT
            </span>
          </div>
          <p className="text-sm text-[#AAA29A] font-medium">
            Roster and mobilization oversight for certified citizen responders, rescue teams, and logistics squads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2 bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 shadow-xs font-semibold cursor-pointer">
            <UserPlus className="h-4 w-4" />
            Onboard Responder
          </Button>
        </div>
      </div>

      {/* Operational Feedback Toast / Banner */}
      {feedback && (
        <div 
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-[#16B58A]/10 border-[#16B58A]/40 text-[#16B58A]'
              : 'bg-[#E53935]/10 border-[#E53935]/40 text-[#FF8A80]'
          }`}
          role="alert"
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-medium leading-relaxed">
              <span className="font-bold uppercase tracking-wider text-[11px] mr-1.5 font-mono">
                {feedback.type === 'success' ? 'DISPATCH CONFIRMED:' : 'MOBILIZATION RESTRICTED:'}
              </span>
              {feedback.message}
            </div>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded hover:bg-black/20 text-current cursor-pointer transition-colors"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Total Personnel</p>
              <p className="text-2xl font-bold text-[#F4F0EB] mt-1">{volunteers.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#F5A23A] flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Available</p>
              <p className="text-2xl font-bold text-[#16B58A] mt-1">{availableCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#16B58A] flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Assigned</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{assignedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-blue-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Deployed in Field</p>
              <p className="text-2xl font-bold text-[#F46B27] mt-1">{deployedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#F46B27] flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191715] border-[#38302A] shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Standby / Offline</p>
              <p className="text-2xl font-bold text-[#AAA29A] mt-1">{offlineCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#7C756E] flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volunteer List & Filters */}
      <Card className="bg-[#191715] border-[#38302A] shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-[#26211C] bg-[#12110F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-[#AAA29A]">Responder Roster & Certifications</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C756E]" />
              <Input
                placeholder="Search name or skill..."
                className="pl-9 h-9 text-xs bg-[#12110F] border-[#38302A] text-[#F4F0EB]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="h-9 rounded-lg border border-[#38302A] bg-[#12110F] px-3 text-xs font-semibold text-[#F4F0EB] outline-none focus:border-[#F5A23A] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="deployed">Deployed</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-[#AAA29A] text-sm animate-pulse">Loading responder roster...</div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="py-16 text-center text-[#7C756E] text-sm">No responders found matching your query.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#12110F]">
                    <TableHead>Responder</TableHead>
                    <TableHead>Skills & Certifications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sector / Proximity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVolunteers.map(v => (
                    <TableRow key={v.id} className="hover:bg-[#27211B]/60 transition-colors">
                      <TableCell className="font-medium text-[#F4F0EB]">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#27211B] border border-[#38302A] text-[#F5A23A] font-bold text-xs flex items-center justify-center font-mono">
                            {v.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#F4F0EB] text-xs leading-snug">{v.name}</p>
                            <p className="text-[10px] text-[#7C756E] font-mono">ID: {v.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {v.skills.map((skill, i) => (
                            <span 
                              key={i} 
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#27211B] text-[#AAA29A] border border-[#38302A]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border capitalize ${
                            v.status === 'available'
                              ? 'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/40'
                              : v.status === 'assigned'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                              : v.status === 'deployed'
                              ? 'bg-[#F46B27]/15 text-[#F46B27] border-[#F46B27]/40'
                              : 'bg-[#27211B] text-[#AAA29A] border-[#38302A]'
                          }`}
                        >
                          {v.status === 'available' ? 'Available' : v.status === 'assigned' ? 'Assigned' : v.status === 'deployed' ? 'Deployed' : 'Offline'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-[#AAA29A]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#F5A23A]" />
                          <span>{v.distance || v.location?.address || 'Palghar Center (3.5 km)'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {v.status === 'available' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenMobilize(v)}
                            className="text-xs bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold border-none h-8 shadow-xs cursor-pointer flex items-center gap-1.5 ml-auto"
                          >
                            <RadioIcon className="h-3.5 w-3.5" />
                            Mobilize Unit
                          </Button>
                        ) : v.status === 'assigned' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenMobilize(v)}
                            className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold border-none h-8 shadow-xs cursor-pointer flex items-center gap-1.5 ml-auto"
                            title={v.currentAssignmentId ? `Assigned to ${v.currentAssignmentId.replace(/^inc_/i, 'INC-').toUpperCase()} - click to confirm field deployment` : 'Assigned to incident - click to mobilize'}
                          >
                            <RadioIcon className="h-3.5 w-3.5" />
                            Mobilize Unit
                          </Button>
                        ) : v.status === 'deployed' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenMobilize(v)}
                            className="text-xs bg-[#27211B] hover:bg-[#342c24] text-[#F46B27] border-[#F46B27]/40 h-8 font-medium cursor-pointer flex items-center gap-1.5 ml-auto"
                            title={`Currently deployed to ${v.currentAssignmentId ? v.currentAssignmentId.replace(/^inc_/i, 'INC-').toUpperCase() : 'incident'}`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Deployed
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenMobilize(v)}
                            className="text-xs bg-[#191715] hover:bg-[#27211B] text-[#7C756E] border-[#38302A] h-8 font-medium cursor-not-allowed flex items-center gap-1.5 ml-auto"
                            title="Responder is offline and cannot be mobilized"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            Offline
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobilize Tactical Unit Modal */}
      <MobilizeVolunteerModal
        isOpen={isMobilizeModalOpen}
        onClose={() => setIsMobilizeModalOpen(false)}
        volunteer={selectedVolunteerForMobilize}
        onMobilizeSuccess={handleMobilizeSuccess}
      />
    </div>
  );
}
