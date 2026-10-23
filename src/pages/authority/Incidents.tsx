import React, { useEffect, useState } from 'react';
import { Filter, Search, Plus, MoreHorizontal, Activity, Flame, Droplets, Wind, Sparkles } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MockAPI } from '../../services/mockApi';
import { Incident } from '../../types';
import { useNavigate } from 'react-router-dom';

export function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const navigate = useNavigate();

  const fetchIncidents = () => {
    MockAPI.getCombinedIncidents({ includeExternal: true }).then(data => {
      setIncidents(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyIncident = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await MockAPI.updateIncidentStatus(id, 'verified');
    fetchIncidents();
  };

  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = 
      i.title.toLowerCase().includes(filter.toLowerCase()) || 
      i.location.address?.toLowerCase().includes(filter.toLowerCase()) ||
      i.type?.toLowerCase().includes(filter.toLowerCase()) ||
      i.source?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesType = !typeFilter || i.type?.toLowerCase() === typeFilter.toLowerCase();
    const matchesSeverity = !severityFilter || i.aiAnalysis?.severity?.toLowerCase() === severityFilter.toLowerCase();
    const matchesStatus = !statusFilter || (
      statusFilter === 'in_progress'
        ? ['in_progress', 'on_the_way', 'reached', 'rescue_in_progress'].includes(i.status?.toLowerCase() || '')
        : i.status?.toLowerCase() === statusFilter.toLowerCase()
    );
    const matchesSource = 
      !sourceFilter || 
      (sourceFilter === 'usgs' 
        ? i.source === 'USGS' || i.source === 'USGS Live Feed' || (i.isRealData && i.type === 'Earthquake')
        : sourceFilter === 'firms'
        ? i.source === 'NASA FIRMS' || (i.isRealData && i.type === 'Fire')
        : sourceFilter === 'gdacs'
        ? i.source === 'GDACS' || (i.isRealData && (i.type === 'Flood' || i.type === 'Tropical Cyclone'))
        : sourceFilter === 'local'
        ? !i.isRealData && i.source !== 'USGS' && i.source !== 'NASA FIRMS' && i.source !== 'GDACS'
        : true);

    return matchesSearch && matchesType && matchesSeverity && matchesStatus && matchesSource;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">Incident Management</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#E53946]/20 text-[#ff727f] border border-[#E53946]/40">
              DISPATCH QUEUE
            </span>
          </div>
          <p className="text-sm font-medium text-[#AAA29A]">Monitor, verify, assign responders, and triage verified crisis incidents in Palghar District.</p>
        </div>
        <Button 
          onClick={() => navigate('/admin/incidents/new')} 
          className="gap-2 bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-semibold shadow-xs h-10 px-4"
        >
          <Plus className="h-4 w-4" />
          Create Incident
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C756E]" />
          <Input 
            placeholder="Search ID, Location, Type..." 
            className="pl-9 h-10 bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-lg border border-[#38302A] bg-[#12110F] px-3 text-xs font-semibold text-[#F4F0EB] outline-none focus:border-[#F5A23A] transition-colors cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="flood">Flood</option>
          <option value="fire">Fire / Hotspot</option>
          <option value="cyclone">Cyclone</option>
          <option value="landslide">Landslide</option>
          <option value="earthquake">Earthquake (USGS)</option>
        </select>

        <select 
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="h-10 rounded-lg border border-[#38302A] bg-[#12110F] px-3 text-xs font-semibold text-[#F4F0EB] outline-none focus:border-[#F5A23A] transition-colors cursor-pointer"
        >
          <option value="">All Feeds & Sources</option>
          <option value="local">Palghar Operations (Local)</option>
          <option value="usgs">USGS Earthquakes (Real Data)</option>
          <option value="firms">NASA FIRMS Fires (Real Data)</option>
          <option value="gdacs">GDACS Multi-Hazard (Real Data)</option>
        </select>

        <select 
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="h-10 rounded-lg border border-[#38302A] bg-[#12110F] px-3 text-xs font-semibold text-[#F4F0EB] outline-none focus:border-[#F5A23A] transition-colors cursor-pointer"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-[#38302A] bg-[#12110F] px-3 text-xs font-semibold text-[#F4F0EB] outline-none focus:border-[#F5A23A] transition-colors cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress (Active Ops)</option>
          <option value="relief">Relief Phase</option>
          <option value="completed">Completed</option>
          <option value="resolved">Resolved & Closed</option>
          <option value="dismissed">Dismissed / Rejected</option>
        </select>

        <Button 
          variant="outline" 
          onClick={() => { setFilter(''); setTypeFilter(''); setSeverityFilter(''); setStatusFilter(''); setSourceFilter(''); }}
          className="gap-2 h-10 bg-[#191715] text-[#AAA29A] hover:text-[#F4F0EB] border-[#38302A] font-semibold hover:bg-[#27211B]"
        >
          <Filter className="h-4 w-4" />
          Reset Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[#38302A] bg-[#191715]">
          <p className="text-sm font-medium text-[#AAA29A] animate-pulse">Loading incidents queue...</p>
        </div>
      ) : (
        <Card className="border border-[#38302A] rounded-xl bg-[#191715] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#12110F] border-b border-[#38302A] text-xs font-semibold text-[#AAA29A] uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Source</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">Urgency</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Team</th>
                  <th className="px-5 py-3.5">Time</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26211C]">
                {filteredIncidents.map(incident => {
                  const severity = incident.aiAnalysis?.severity || 'low';
                  const urgency = incident.urgency || (severity === 'critical' || severity === 'high' ? 'High' : 'Medium');
                  
                  return (
                    <tr key={incident.id} className="hover:bg-[#27211B]/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#F5A23A] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{incident.id.replace('inc_', 'INC-').toUpperCase()}</span>
                          {incident.aiTriageAssessment && (
                            <span 
                              className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-[#F5A23A] bg-[#27211B] px-1 py-0.5 rounded border border-[#F5A23A]/40" 
                              title={`Gemini AI Triage: ${incident.aiTriageAssessment.recommendedPriority}`}
                            >
                              <Sparkles className="h-2.5 w-2.5 text-[#F5A23A]" />
                              AI
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#F4F0EB] whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5">
                          {incident.source === 'NASA FIRMS' || (incident.isRealData && incident.type === 'Fire') ? (
                            <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                          ) : incident.source === 'GDACS' || (incident.isRealData && (incident.type === 'Flood' || incident.type === 'Tropical Cyclone')) ? (
                            incident.type === 'Tropical Cyclone' ? (
                              <Wind className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            ) : (
                              <Droplets className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            )
                          ) : incident.isRealData ? (
                            <Activity className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          ) : null}
                          <span>{incident.type || incident.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#AAA29A] whitespace-nowrap text-xs">
                        {incident.location.address || 'Unknown'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px]">
                        {incident.source === 'NASA FIRMS' || (incident.isRealData && incident.type === 'Fire') ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-950/50 text-orange-400 border border-orange-500/40">
                            <span className="h-1 w-1 rounded-full bg-orange-400 animate-pulse" />
                            NASA FIRMS (Satellite)
                          </span>
                        ) : incident.source === 'GDACS' || (incident.isRealData && (incident.type === 'Flood' || incident.type === 'Tropical Cyclone')) ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/50 text-cyan-400 border border-cyan-500/40">
                            <span className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
                            GDACS Multi-Hazard
                          </span>
                        ) : incident.isRealData ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-500/40">
                            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                            USGS Live Feed
                          </span>
                        ) : (
                          <span className="text-[#7C756E]">{incident.source || (incident.reporterRole === 'citizen' ? 'Citizen Report' : 'Authority Created')}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold capitalize ${
                          severity === 'critical' ? 'bg-[#E53946]/20 text-[#ff727f] border border-[#E53946]/40' : 
                          severity === 'high' ? 'bg-[#F46B27]/20 text-[#F46B27] border border-[#F46B27]/40' :
                          severity === 'medium' ? 'bg-[#F5A23A]/20 text-[#F5A23A] border border-[#F5A23A]/40' :
                          'bg-[#27211B] text-[#AAA29A] border border-[#38302A]'
                        }`}>
                          {severity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-[#F4F0EB] font-semibold text-xs">
                        {urgency}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
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
                      </td>
                      <td className="px-5 py-3.5 text-[#AAA29A] whitespace-nowrap font-medium text-xs">
                        {incident.assignedTeam || 'Unassigned'}
                      </td>
                      <td className="px-5 py-3.5 text-[#7C756E] whitespace-nowrap font-mono text-[11px]">
                        {new Date(incident.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs font-semibold px-2.5 bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border-[#38302A]" 
                            onClick={() => navigate(`/admin/incidents/${incident.id}`)}
                          >
                            View
                          </Button>
                          {incident.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={(e) => handleVerifyIncident(incident.id, e)}
                              className="h-7 text-xs font-semibold px-2.5 bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 font-bold cursor-pointer"
                            >
                              Verify
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#7C756E] hover:text-[#F4F0EB]">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredIncidents.length === 0 && (
              <div className="flex h-32 items-center justify-center border-t border-[#26211C]">
                <p className="text-sm font-medium text-[#7C756E]">No incidents found matching criteria.</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
