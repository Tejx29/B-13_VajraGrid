import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, Download, BarChart2, Calendar, CheckCircle2, 
  ShieldCheck, Printer, X, Eye, HeartHandshake, AlertCircle, 
  Building2, Sparkles, MapPin, Check 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { MockAPI } from '../../services/mockApi';
import { Incident } from '../../types';

interface SituationReport {
  id: string;
  title: string;
  taluka: string;
  type: string;
  date: string;
  status: 'Published' | 'Draft' | 'Archived';
  fileSize: string;
}

const mockReports: SituationReport[] = [
  {
    id: 'SITREP-2026-08',
    title: 'Monsoon Flood Inundation & Rescue Summary',
    taluka: 'Palghar & Vasai',
    type: 'Emergency SITREP',
    date: '2026-10-15',
    status: 'Published',
    fileSize: '2.4 MB'
  },
  {
    id: 'SITREP-2026-07',
    title: 'Coastal High-Tide & Cyclone Preparedness Brief',
    taluka: 'Dahanu & Kelva',
    type: 'Preparedness Audit',
    date: '2026-10-12',
    status: 'Published',
    fileSize: '1.8 MB'
  },
  {
    id: 'SITREP-2026-06',
    title: 'Relief Camp Ration Distribution & Medical Triage Audit',
    taluka: 'Palghar HQ Camp Alpha',
    type: 'Relief Logistics',
    date: '2026-10-09',
    status: 'Published',
    fileSize: '3.1 MB'
  },
  {
    id: 'SITREP-2026-05',
    title: 'Infrastructure Hazard Assessment (Downed Powerlines)',
    taluka: 'Manor & Wada',
    type: 'Infrastructure',
    date: '2026-10-05',
    status: 'Archived',
    fileSize: '1.2 MB'
  }
];

export function AuthorityReports() {
  const navigate = useNavigate();
  const [reports] = useState<SituationReport[]>(mockReports);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  useEffect(() => {
    MockAPI.getIncidents().then(data => {
      setIncidents(data);
      setIsLoading(false);
    });
  }, []);

  const handleDownload = (id: string) => {
    setDownloadMsg(`Generating verified PDF export for ${id}...`);
    setTimeout(() => {
      setDownloadMsg(null);
    }, 2500);
  };

  const resolvedIncidents = incidents.filter(i => i.status === 'resolved');
  const recoveryPhaseIncidents = incidents.filter(i => ['completed', 'relief', 'resolved'].includes(i.status));
  const activeIncidents = incidents.filter(i => !['resolved', 'dismissed'].includes(i.status));
  
  const totalAssisted = incidents.reduce((sum, inc) => {
    return sum + (inc.reliefDetails?.peopleAssisted || 0);
  }, 0);

  const resolvedWithNotes = resolvedIncidents.filter(i => i.reliefDetails?.resolutionNotes);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">
              Post-Disaster Recovery &amp; Situation Reports
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#16B58A]/15 text-[#16B58A] border border-[#16B58A]/40">
              PHASE 3: RECOVERY &amp; CLOSURE
            </span>
          </div>
          <p className="text-sm text-[#AAA29A] font-medium">
            Aggregated operational audits, incident closure summaries, relief reconciliations, and official SITREPs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowSummaryModal(true)}
            className="gap-2 bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 shadow-xs font-bold text-xs h-9 px-4 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            Generate Post-Disaster Summary
          </Button>
        </div>
      </div>

      {downloadMsg && (
        <div className="rounded-xl border border-[#F5A23A]/40 bg-[#221B14] p-4 text-[#F5A23A] text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#F5A23A] shrink-0" />
          <span>{downloadMsg}</span>
        </div>
      )}

      {/* Dynamic Analytics KPI Overview from Stored Operational Records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Operational Incidents</p>
              <p className="text-2xl font-bold text-[#F4F0EB] mt-1">{incidents.length}</p>
              <p className="text-xs text-[#AAA29A] mt-0.5">{activeIncidents.length} active in field</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#F5A23A] flex items-center justify-center">
              <BarChart2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Officially Resolved</p>
              <p className="text-2xl font-bold text-[#16B58A] mt-1">{resolvedIncidents.length}</p>
              <p className="text-xs text-[#AAA29A] mt-0.5">Closed with resolution notes</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#14231E] border border-[#16B58A]/30 text-[#16B58A] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Citizens Assisted</p>
              <p className="text-2xl font-bold text-[#4F8DFF] mt-1">{totalAssisted}</p>
              <p className="text-xs text-[#AAA29A] mt-0.5">Rations &amp; shelter provided</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#111A28] border border-[#4F8DFF]/30 text-[#4F8DFF] flex items-center justify-center">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Recovery Operations</p>
              <p className="text-2xl font-bold text-[#F5A23A] mt-1">{recoveryPhaseIncidents.length}</p>
              <p className="text-xs text-[#AAA29A] mt-0.5">Completed, relief &amp; resolved</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#F5A23A] flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post-Disaster Recovery & Resolution Table (Stored Operational Records) */}
      <Card className="bg-[#191715] border-[#38302A] shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-[#26211C] bg-[#12110F] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-[#F4F0EB] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16B58A]" />
              Post-Disaster Incident Recovery &amp; Closure Audit
            </CardTitle>
            <p className="text-xs text-[#AAA29A] mt-0.5">
              Live database records showing impact, relief assistance, and resolution notes from Palghar District EOC.
            </p>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {recoveryPhaseIncidents.length} Recovered Records
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#12110F]">
                  <TableHead>Incident Ref</TableHead>
                  <TableHead>Title &amp; Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>People Assisted</TableHead>
                  <TableHead>Relief Provisions</TableHead>
                  <TableHead className="min-w-[280px]">Official Resolution Summary</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recoveryPhaseIncidents.length > 0 ? (
                  recoveryPhaseIncidents.map(inc => (
                    <TableRow key={inc.id} className="hover:bg-[#27211B]/60 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-[#F5A23A]">
                        {inc.id.replace('inc_', 'INC-').toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium text-[#F4F0EB]">
                        <div>
                          <p className="text-xs font-bold text-[#F4F0EB]">{inc.title || inc.type}</p>
                          <p className="text-[11px] text-[#AAA29A] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#F5A23A] shrink-0" />
                            <span>{inc.location.address || 'Palghar'}</span>
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          inc.status === 'resolved' 
                            ? 'bg-[#16B58A]/20 text-[#16B58A] border-[#16B58A]/40' 
                            : inc.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-500/20 text-[#F5A23A] border-amber-500/40'
                        }`}>
                          {inc.status.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-[#F4F0EB]">
                        {inc.reliefDetails?.peopleAssisted ? `${inc.reliefDetails.peopleAssisted} citizens` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-[#AAA29A] max-w-[200px] truncate">
                        {inc.reliefDetails?.reliefDistributed || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-[#C0C4CC] leading-relaxed">
                        {inc.reliefDetails?.resolutionNotes || (
                          <span className="text-[#7C756E] italic">
                            {inc.status === 'resolved' ? 'Resolution recorded by EOC.' : 'Relief & recovery assessment active.'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/incidents/${inc.id}`)}
                          className="text-xs gap-1.5 bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border-[#38302A] h-8"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#F5A23A]" />
                          Case File
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs text-[#AAA29A]">
                      No incidents have reached the recovery or resolved phase yet. Resolve an incident from the Incident Details view to record post-disaster recovery data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Historical Situation Reports Archive */}
      <Card className="bg-[#191715] border-[#38302A] shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-[#26211C] bg-[#12110F] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-[#AAA29A]">
              Historical Disaster SITREPs &amp; Collectorate Audits
            </CardTitle>
            <p className="text-xs text-[#7C756E] mt-0.5">
              Simulated government disaster management authority (DDMA) document archive.
            </p>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">{reports.length} Documents</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#12110F]">
                  <TableHead>Document ID</TableHead>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Jurisdiction / Taluka</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(report => (
                  <TableRow key={report.id} className="hover:bg-[#27211B]/60 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-[#F5A23A]">
                      {report.id}
                    </TableCell>
                    <TableCell className="font-medium text-[#F4F0EB]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#AAA29A] shrink-0" />
                        <span>{report.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[#AAA29A]">{report.taluka}</TableCell>
                    <TableCell>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#27211B] text-[#AAA29A] border border-[#38302A]">
                        {report.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-[#7C756E] font-mono">{report.date}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          report.status === 'Published'
                            ? 'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/40'
                            : 'bg-[#27211B] text-[#AAA29A] border-[#38302A]'
                        }`}
                      >
                        {report.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(report.id)}
                        className="text-xs gap-1.5 bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border-[#38302A] h-8"
                      >
                        <Download className="h-3.5 w-3.5 text-[#F5A23A]" />
                        PDF ({report.fileSize})
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Post-Disaster Summary Generator Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#191715] border border-[#38302A] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#26211C] bg-[#12110F] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#16B58A]/20 text-[#16B58A] border border-[#16B58A]/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F4F0EB]">
                    Palghar District Post-Disaster Incident Summary (DDMA)
                  </h3>
                  <p className="text-xs text-[#AAA29A] font-mono">
                    Official Recovery Summary generated from {incidents.length} stored operational records
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="text-[#AAA29A] hover:text-[#F4F0EB] p-1.5 rounded-lg hover:bg-[#27211B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: The Printable / Viewable SITREP */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#C0C4CC]">
              {/* Document Letterhead */}
              <div className="text-center border-b border-[#2E2721] pb-4 space-y-1">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5A23A]">
                  Government of Maharashtra &bull; District Disaster Management Authority (DDMA)
                </p>
                <h4 className="text-lg font-bold text-[#F4F0EB]">
                  EMERGENCY INCIDENT RECOVERY &amp; CLOSURE REPORT
                </h4>
                <p className="text-xs text-[#AAA29A]">
                  Jurisdiction: Palghar District | EOC Reference: EOC-PLG-{new Date().getFullYear()}-{incidents.length}
                </p>
                <p className="font-mono text-[11px] text-[#7C756E]">
                  Report Generated: {new Date().toLocaleString()}
                </p>
              </div>

              {/* Executive Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#12110F] p-4 rounded-xl border border-[#2E2721]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7C756E] block">Total Incidents</span>
                  <span className="text-lg font-mono font-bold text-[#F4F0EB]">{incidents.length}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7C756E] block">Closed / Resolved</span>
                  <span className="text-lg font-mono font-bold text-[#16B58A]">{resolvedIncidents.length}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7C756E] block">Citizens Assisted</span>
                  <span className="text-lg font-mono font-bold text-[#4F8DFF]">{totalAssisted}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7C756E] block">Active Dispatches</span>
                  <span className="text-lg font-mono font-bold text-[#F5A23A]">{activeIncidents.length}</span>
                </div>
              </div>

              {/* Resolved Case Logs */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-[#F4F0EB] font-mono border-b border-[#2E2721] pb-1">
                  Resolved Incident File Summaries &amp; Closure Notes
                </h5>
                {resolvedIncidents.length > 0 ? (
                  <div className="space-y-2.5">
                    {resolvedIncidents.map(inc => (
                      <div key={inc.id} className="p-3.5 rounded-lg bg-[#12110F] border border-[#2E2721] space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#F5A23A]">{inc.id.replace('inc_', 'INC-').toUpperCase()}</span>
                            <span className="font-semibold text-[#F4F0EB]">{inc.title || inc.type}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16B58A]/15 text-[#16B58A] border border-[#16B58A]/30">
                            RESOLVED &bull; {inc.reliefDetails?.responseDuration || 'Completed'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#AAA29A]">
                          Location: {inc.location.address || `${inc.location.lat.toFixed(4)}, ${inc.location.lng.toFixed(4)}`} | Assigned: {inc.assignedTeam || 'District Relief Squad'}
                        </p>
                        {inc.reliefDetails?.reliefDistributed && (
                          <p className="text-[11px] text-[#C0C4CC]">
                            <strong className="text-white">Relief Provided:</strong> {inc.reliefDetails.reliefDistributed} ({inc.reliefDetails.peopleAssisted || 0} residents assisted)
                          </p>
                        )}
                        {inc.reliefDetails?.resolutionNotes && (
                          <p className="text-[11px] text-[#C5E1D7] bg-[#0E1A16] p-2 rounded border border-[#16B58A]/25">
                            <strong className="text-[#16B58A] block mb-0.5">Closure Note:</strong>
                            {inc.reliefDetails.resolutionNotes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#7C756E] italic">
                    No incidents currently resolved. Open an incident from the Incident Queue to record relief and resolution.
                  </p>
                )}
              </div>

              {/* Prototype Transparency Notice */}
              <div className="p-3 rounded-lg bg-[#14120F] border border-[#38302A] text-[10px] text-[#8C827A] space-y-1">
                <p className="font-bold text-[#F5A23A]">SYSTEM NOTICE &amp; DATA PROVENANCE</p>
                <p>
                  This Post-Disaster Summary is synthesized directly from verified database records in VajraGrid. In this academic/prototype deployment for Palghar District, operational actions represent simulated response flows. External feeds (USGS, NASA FIRMS, GDACS) provide genuine satellite hazard observations.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#26211C] bg-[#12110F] flex items-center justify-between">
              <span className="text-[11px] text-[#7C756E] font-mono">
                {resolvedIncidents.length} resolved / {incidents.length} total
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSummaryModal(false)}
                  className="bg-[#191715] border-[#38302A] text-[#AAA29A] hover:text-[#F4F0EB] text-xs h-9"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    handleDownload(`SITREP-POST-DISASTER-${new Date().toISOString().slice(0, 10)}`);
                    setShowSummaryModal(false);
                  }}
                  className="bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 font-bold text-xs h-9 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Verified SITREP
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

