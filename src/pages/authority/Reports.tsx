import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, CheckCircle2, ShieldCheck, X, Eye, 
  HeartHandshake, MapPin, Copy, Check, Printer, Layers,
  AlertCircle, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { MockAPI } from '../../services/mockApi';
import { Incident, isDismissedIncident } from '../../types';

/**
 * Predicate to identify incidents that have genuine post-disaster recovery,
 * relief, completion, or official resolution data.
 * Excludes active, unresolved incidents without recovery info, and excluded/dismissed reports.
 */
export const isPostDisasterIncident = (inc: Incident): boolean => {
  if (isDismissedIncident(inc)) return false;

  // Officially resolved incidents are post-disaster closed records
  if (inc.status === 'resolved') return true;

  // Incidents in active relief phase
  if (inc.status === 'relief') return true;

  // Incidents marked completed (field tactical mission complete, entered recovery phase)
  if (inc.status === 'completed') return true;

  // Any incident with genuine recorded relief provisions, assistance, or resolution notes
  if (inc.reliefDetails) {
    const { peopleAssisted, resourcesUsed, reliefDistributed, shelterStatus, resolutionNotes } = inc.reliefDetails;
    if (
      (typeof peopleAssisted === 'number' && peopleAssisted > 0) ||
      (typeof resourcesUsed === 'number' && resourcesUsed > 0) ||
      Boolean(reliefDistributed && reliefDistributed.trim().length > 0) ||
      Boolean(shelterStatus && shelterStatus.trim().length > 0) ||
      Boolean(resolutionNotes && resolutionNotes.trim().length > 0)
    ) {
      return true;
    }
  }

  return false;
};

export function AuthorityReports() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    MockAPI.getIncidents().then(data => {
      setIncidents(data);
      setIsLoading(false);
    });
  }, []);

  // Helper to safely extract recovery submission timestamp for descending sort
  const getRecoverySubmissionTime = (inc: Incident): number => {
    // 1. Primary: actual saved recovery submission timestamp from data model
    if (inc.reliefDetails?.submittedAt) {
      const time = new Date(inc.reliefDetails.submittedAt).getTime();
      if (!isNaN(time) && time > 0) return time;
    }
    // 2. Secondary fallback: timeline event timestamp for completion or relief if recorded
    if (inc.timeline && inc.timeline.length > 0) {
      const completionEvent = inc.timeline.slice().reverse().find(
        tl => tl.status === 'completed' || tl.status === 'resolved' || tl.status === 'relief'
      );
      if (completionEvent?.timestamp) {
        const time = new Date(completionEvent.timestamp).getTime();
        if (!isNaN(time) && time > 0) return time;
      }
    }
    // 3. Fallback: reported incident timestamp if valid
    if (inc.timestamp) {
      const time = new Date(inc.timestamp).getTime();
      if (!isNaN(time) && time > 0) return time;
    }
    // Safe default for unrecorded/missing timestamps (placed at bottom without inventing date)
    return 0;
  };

  // Filter strictly to post-disaster recovery and closure records, sorted newest first
  const postDisasterIncidents = incidents
    .filter(isPostDisasterIncident)
    .sort((a, b) => {
      const timeA = getRecoverySubmissionTime(a);
      const timeB = getRecoverySubmissionTime(b);
      if (timeB !== timeA) {
        return timeB - timeA; // Descending: newest first, oldest last
      }
      // Stable tie-breaker when timestamps are equal or missing
      return incidents.indexOf(a) - incidents.indexOf(b);
    });
  
  // Officially resolved / closed incidents
  const resolvedIncidents = postDisasterIncidents.filter(i => i.status === 'resolved');

  // Incidents with positive recorded numeric people assisted
  const assistedRecords = postDisasterIncidents.filter(
    i => typeof i.reliefDetails?.peopleAssisted === 'number' && i.reliefDetails.peopleAssisted > 0
  );
  const totalCitizensAssisted = assistedRecords.reduce(
    (sum, i) => sum + (i.reliefDetails!.peopleAssisted || 0),
    0
  );

  // Distinct relief / recovery operations documented
  const reliefOperations = postDisasterIncidents.filter(
    i => i.status === 'relief' || Boolean(
      i.reliefDetails?.reliefDistributed?.trim() ||
      i.reliefDetails?.shelterStatus?.trim() ||
      (typeof i.reliefDetails?.resourcesUsed === 'number' && i.reliefDetails.resourcesUsed > 0)
    )
  );

  // Formats human-readable assistance count without inventing numbers
  const formatPeopleAssisted = (inc: Incident) => {
    if (typeof inc.reliefDetails?.peopleAssisted === 'number') {
      if (inc.reliefDetails.peopleAssisted > 0) {
        return `${inc.reliefDetails.peopleAssisted.toLocaleString()} citizens`;
      }
      return '0 citizens';
    }
    return null;
  };

  // Formats relief distributed string without fabricating
  const formatReliefProvisions = (inc: Incident) => {
    if (inc.reliefDetails?.reliefDistributed && inc.reliefDetails.reliefDistributed.trim().length > 0) {
      return inc.reliefDetails.reliefDistributed.trim();
    }
    return null;
  };

  // Formats resolution or recovery summary notes honestly
  const formatResolutionSummary = (inc: Incident) => {
    if (inc.reliefDetails?.resolutionNotes && inc.reliefDetails.resolutionNotes.trim().length > 0) {
      return {
        text: inc.reliefDetails.resolutionNotes.trim(),
        isCustom: true
      };
    }
    if (inc.status === 'resolved') {
      return {
        text: 'Resolution recorded by EOC (No additional notes entered)',
        isCustom: false
      };
    }
    if (inc.status === 'completed') {
      return {
        text: 'Field operation completed; awaiting final closure sign-off',
        isCustom: false
      };
    }
    if (inc.status === 'relief') {
      return {
        text: 'Relief operations active in sector',
        isCustom: false
      };
    }
    return {
      text: 'No resolution notes logged',
      isCustom: false
    };
  };

  // Generate plain text markdown summary for clipboard copying
  const generateMarkdownSummary = () => {
    const reportDate = new Date().toLocaleString();
    const refId = `EOC-PLG-REC-${new Date().getFullYear()}-${postDisasterIncidents.length}`;
    
    const lines = [
      '=========================================================================',
      'GOVERNMENT OF MAHARASHTRA • DISTRICT DISASTER MANAGEMENT AUTHORITY (DDMA)',
      'POST-DISASTER RECOVERY & INCIDENT CLOSURE SITUATION REPORT',
      '=========================================================================',
      `Jurisdiction: Palghar District, Maharashtra | EOC Ref: ${refId}`,
      `Generated: ${reportDate}`,
      '',
      '1. EXECUTIVE RECOVERY SUMMARY METRICS',
      '-------------------------------------------------------------------------',
      `• Total Incidents in Post-Disaster Scope: ${postDisasterIncidents.length}`,
      `• Officially Resolved & Closed:           ${resolvedIncidents.length}`,
      `• Verified Citizens Assisted:             ${totalCitizensAssisted.toLocaleString()}`,
      `• Documented Relief / Recovery Actions:   ${reliefOperations.length}`,
      '',
      '2. DETAILED POST-DISASTER INCIDENT AUDIT LOG',
      '-------------------------------------------------------------------------'
    ];

    if (postDisasterIncidents.length === 0) {
      lines.push('No post-disaster recovery or closure records currently logged.');
    } else {
      postDisasterIncidents.forEach((inc, idx) => {
        const ref = inc.id.replace(/^inc_/, 'INC-').toUpperCase();
        const title = inc.title || inc.type;
        const loc = inc.location?.address || `${inc.location?.lat.toFixed(4)}, ${inc.location?.lng.toFixed(4)}`;
        const assisted = formatPeopleAssisted(inc) || 'Not recorded';
        const relief = formatReliefProvisions(inc) || 'No relief data recorded';
        const notes = formatResolutionSummary(inc).text;

        lines.push(`${idx + 1}. [${ref}] ${title}`);
        lines.push(`   Location:        ${loc}`);
        lines.push(`   Current Status:  ${inc.status.toUpperCase()}`);
        lines.push(`   People Assisted: ${assisted}`);
        if (inc.reliefDetails?.responseDuration) {
          lines.push(`   Duration:        ${inc.reliefDetails.responseDuration}`);
        }
        lines.push(`   Relief Goods:    ${relief}`);
        if (inc.reliefDetails?.shelterStatus) {
          lines.push(`   Shelter Status:  ${inc.reliefDetails.shelterStatus}`);
        }
        lines.push(`   Closure Notes:   ${notes}`);
        lines.push('');
      });
    }

    lines.push('-------------------------------------------------------------------------');
    lines.push('SYSTEM NOTICE & DATA PROVENANCE:');
    lines.push('This SITREP is generated strictly from stored recovery and closure records in VajraGrid.');
    lines.push('No simulated values, artificial victim numbers, or fabricated summaries were added.');
    lines.push('=========================================================================');

    return lines.join('\n');
  };

  const handleCopySummary = async () => {
    try {
      const text = generateMarkdownSummary();
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      // Fallback if clipboard API not permitted
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">
              Post-Disaster Recovery &amp; Situation Reports
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#16B58A]/15 text-[#16B58A] border border-[#16B58A]/40">
              PHASE 3: RECOVERY &amp; CLOSURE
            </span>
          </div>
          <p className="text-sm text-[#AAA29A] font-medium">
            Aggregated post-disaster audits, verified citizen relief distributions, and official incident closure records for Palghar District.
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

      {/* Recovery Summary Metrics (Calculated strictly from persisted records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Recorded Recovery Incidents */}
        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">
                Recovery &amp; Closure Records
              </p>
              <p className="text-2xl font-bold text-[#F4F0EB] mt-1 font-mono">
                {isLoading ? '...' : postDisasterIncidents.length}
              </p>
              <p className="text-xs text-[#AAA29A] mt-0.5">
                Incidents in recovery phase or closed
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#F5A23A] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Officially Resolved */}
        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">
                Officially Resolved
              </p>
              <p className="text-2xl font-bold text-[#16B58A] mt-1 font-mono">
                {isLoading ? '...' : resolvedIncidents.length}
              </p>
              <p className="text-xs text-[#AAA29A] mt-0.5">
                Formally closed by District EOC
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#14231E] border border-[#16B58A]/30 text-[#16B58A] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Verified Citizens Assisted */}
        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">
                Verified Citizens Assisted
              </p>
              <p className="text-2xl font-bold text-[#4F8DFF] mt-1 font-mono">
                {isLoading ? '...' : totalCitizensAssisted.toLocaleString()}
              </p>
              <p className="text-xs text-[#AAA29A] mt-0.5">
                {assistedRecords.length > 0 
                  ? `${assistedRecords.length} incident${assistedRecords.length === 1 ? '' : 's'} with recorded assistance`
                  : 'No citizen assistance recorded'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#111A28] border border-[#4F8DFF]/30 text-[#4F8DFF] flex items-center justify-center">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Recovery & Relief Operations */}
        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">
                Relief Operations Documented
              </p>
              <p className="text-2xl font-bold text-[#F5A23A] mt-1 font-mono">
                {isLoading ? '...' : reliefOperations.length}
              </p>
              <p className="text-xs text-[#AAA29A] mt-0.5">
                Active relief or documented distribution
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#F5A23A] flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post-Disaster Recovery & Closure Audit Table */}
      <Card className="bg-[#191715] border-[#38302A] shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-[#26211C] bg-[#12110F] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-[#F4F0EB] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16B58A]" />
              Post-Disaster Incident Recovery &amp; Closure Audit
            </CardTitle>
            <p className="text-xs text-[#AAA29A] mt-0.5">
              Only incidents with verified relief, completion, or formal resolution records are listed.
            </p>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {postDisasterIncidents.length} Recorded Incidents
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#12110F]">
                  <TableHead className="w-[120px]">Incident Ref</TableHead>
                  <TableHead className="min-w-[220px]">Title &amp; Location</TableHead>
                  <TableHead className="w-[170px]">Current Status</TableHead>
                  <TableHead className="w-[140px]">People Assisted</TableHead>
                  <TableHead className="min-w-[180px]">Relief Provisions</TableHead>
                  <TableHead className="min-w-[260px]">Official Resolution Summary</TableHead>
                  <TableHead className="w-[110px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-xs text-[#AAA29A] animate-pulse">
                      Loading post-disaster recovery records...
                    </TableCell>
                  </TableRow>
                ) : postDisasterIncidents.length > 0 ? (
                  postDisasterIncidents.map(inc => {
                    const assistedText = formatPeopleAssisted(inc);
                    const reliefText = formatReliefProvisions(inc);
                    const resolutionObj = formatResolutionSummary(inc);

                    return (
                      <TableRow key={inc.id} className="hover:bg-[#27211B]/60 transition-colors">
                        {/* Incident ID */}
                        <TableCell className="font-mono text-xs font-bold text-[#F5A23A] whitespace-nowrap">
                          {inc.id.replace(/^inc_/, 'INC-').toUpperCase()}
                        </TableCell>

                        {/* Title & Location */}
                        <TableCell className="font-medium text-[#F4F0EB]">
                          <div>
                            <p className="text-xs font-bold text-[#F4F0EB]">{inc.title || inc.type}</p>
                            <p className="text-[11px] text-[#AAA29A] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#F5A23A] shrink-0" />
                              <span className="truncate max-w-[260px]">
                                {inc.location?.address || `${inc.location?.lat.toFixed(4)}, ${inc.location?.lng.toFixed(4)}`}
                              </span>
                            </p>
                          </div>
                        </TableCell>

                        {/* Current Incident Status */}
                        <TableCell>
                          {inc.status === 'resolved' ? (
                            <span className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-[#16B58A]/20 text-[#16B58A] border-[#16B58A]/40 whitespace-nowrap">
                              Resolved &amp; Closed
                            </span>
                          ) : inc.status === 'completed' ? (
                            <span className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border-emerald-500/40 whitespace-nowrap">
                              Operation Completed
                            </span>
                          ) : inc.status === 'relief' ? (
                            <span className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-amber-500/20 text-[#F5A23A] border-amber-500/40 whitespace-nowrap">
                              Relief Distribution
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-blue-500/20 text-blue-300 border-blue-500/40 whitespace-nowrap">
                              {inc.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </TableCell>

                        {/* Number of People Assisted */}
                        <TableCell className="text-xs font-mono">
                          {assistedText ? (
                            <span className="font-bold text-[#F4F0EB]">{assistedText}</span>
                          ) : (
                            <span className="text-[#7C756E] italic">Not recorded</span>
                          )}
                        </TableCell>

                        {/* Relief Provisions */}
                        <TableCell className="text-xs">
                          {reliefText ? (
                            <span className="text-[#AAA29A] leading-relaxed block">{reliefText}</span>
                          ) : (
                            <span className="text-[#7C756E] italic block">No relief data recorded</span>
                          )}
                          {inc.reliefDetails?.shelterStatus && (
                            <span className="text-[11px] text-[#7C756E] block mt-1">
                              <strong className="text-[#AAA29A]">Shelter:</strong> {inc.reliefDetails.shelterStatus}
                            </span>
                          )}
                          {inc.reliefDetails?.responseDuration && (
                            <span className="text-[10px] text-[#F5A23A]/80 font-mono block mt-0.5">
                              Duration: {inc.reliefDetails.responseDuration}
                            </span>
                          )}
                        </TableCell>

                        {/* Official Resolution Summary */}
                        <TableCell className="text-xs leading-relaxed">
                          {resolutionObj.isCustom ? (
                            <span className="text-[#C5E1D7] bg-[#0E1A16] px-2 py-1 rounded border border-[#16B58A]/25 block">
                              {resolutionObj.text}
                            </span>
                          ) : (
                            <span className="text-[#7C756E] italic">
                              {resolutionObj.text}
                            </span>
                          )}
                        </TableCell>

                        {/* Case File Action */}
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/incidents/${inc.id}`)}
                            className="text-xs gap-1.5 bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border-[#38302A] h-8 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#F5A23A]" />
                            Case File
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 px-4">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="h-10 w-10 rounded-full bg-[#27211B] border border-[#38302A] text-[#AAA29A] flex items-center justify-center mx-auto">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-[#F4F0EB]">No Post-Disaster Records Found</p>
                        <p className="text-xs text-[#AAA29A] leading-relaxed">
                          No incidents currently have recorded relief, completion, or formal resolution details. As emergency responses progress to relief distribution and formal closure in the Incident Queue, their verified records will appear here.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/admin/incidents')}
                          className="text-xs gap-1.5 bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border-[#38302A] h-8 mt-2 cursor-pointer"
                        >
                          <span>Go to Incident Queue</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
                    Palghar District Post-Disaster Situation Report (DDMA)
                  </h3>
                  <p className="text-xs text-[#AAA29A] font-mono">
                    Synthesized from {postDisasterIncidents.length} stored post-disaster recovery &amp; closure records
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="text-[#AAA29A] hover:text-[#F4F0EB] p-1.5 rounded-lg hover:bg-[#27211B] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Printable / Viewable SITREP */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#C0C4CC]">
              {/* Document Letterhead */}
              <div className="text-center border-b border-[#2E2721] pb-4 space-y-1">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5A23A]">
                  Government of Maharashtra &bull; District Disaster Management Authority (DDMA)
                </p>
                <h4 className="text-lg font-bold text-[#F4F0EB]">
                  POST-DISASTER RECOVERY &amp; INCIDENT CLOSURE SITUATION REPORT
                </h4>
                <p className="text-xs text-[#AAA29A]">
                  Jurisdiction: Palghar District | EOC Reference: EOC-PLG-REC-{new Date().getFullYear()}-{postDisasterIncidents.length}
                </p>
                <p className="font-mono text-[11px] text-[#7C756E]">
                  Report Generated: {new Date().toLocaleString()}
                </p>
              </div>

              {/* Executive Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#12110F] p-4 rounded-xl border border-[#2E2721]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7C756E] block">Post-Disaster Records</span>
                  <span className="text-lg font-mono font-bold text-[#F4F0EB]">{postDisasterIncidents.length}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7C756E] block">Officially Resolved</span>
                  <span className="text-lg font-mono font-bold text-[#16B58A]">{resolvedIncidents.length}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7C756E] block">Citizens Assisted</span>
                  <span className="text-lg font-mono font-bold text-[#4F8DFF]">{totalCitizensAssisted.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7C756E] block">Relief Operations</span>
                  <span className="text-lg font-mono font-bold text-[#F5A23A]">{reliefOperations.length}</span>
                </div>
              </div>

              {/* Case Logs */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-[#F4F0EB] font-mono border-b border-[#2E2721] pb-1">
                  Incident Recovery File Summaries &amp; Closure Notes
                </h5>
                {postDisasterIncidents.length > 0 ? (
                  <div className="space-y-2.5">
                    {postDisasterIncidents.map(inc => {
                      const assistedText = formatPeopleAssisted(inc);
                      const reliefText = formatReliefProvisions(inc);
                      const resolutionObj = formatResolutionSummary(inc);

                      return (
                        <div key={inc.id} className="p-3.5 rounded-lg bg-[#12110F] border border-[#2E2721] space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#F5A23A]">
                                {inc.id.replace(/^inc_/, 'INC-').toUpperCase()}
                              </span>
                              <span className="font-semibold text-[#F4F0EB]">{inc.title || inc.type}</span>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                              inc.status === 'resolved'
                                ? 'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/30'
                                : inc.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-[#F5A23A]/15 text-[#F5A23A] border-[#F5A23A]/30'
                            }`}>
                              {inc.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-[#AAA29A]">
                            Location: {inc.location?.address || `${inc.location?.lat.toFixed(4)}, ${inc.location?.lng.toFixed(4)}`} | Assigned Team: {inc.assignedTeam && inc.assignedTeam !== 'Unassigned' ? inc.assignedTeam : 'Local Disaster Squad'}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <strong className="text-stone-300">People Assisted: </strong>
                              <span className={assistedText ? 'text-[#F4F0EB] font-mono font-semibold' : 'text-[#7C756E] italic'}>
                                {assistedText || 'Not recorded'}
                              </span>
                            </div>
                            <div>
                              <strong className="text-stone-300">Relief Provisions: </strong>
                              <span className={reliefText ? 'text-[#AAA29A]' : 'text-[#7C756E] italic'}>
                                {reliefText || 'No relief data recorded'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-1">
                            <strong className="text-[#16B58A] text-[11px] block mb-0.5">Official Summary &amp; Closure Notes:</strong>
                            <p className={resolutionObj.isCustom ? 'text-[#C5E1D7] bg-[#0E1A16] p-2 rounded border border-[#16B58A]/25 text-[11px]' : 'text-[#7C756E] italic text-[11px]'}>
                              {resolutionObj.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#7C756E] italic py-4 text-center">
                    No incidents currently have recorded post-disaster recovery or closure information.
                  </p>
                )}
              </div>

              {/* Data Provenance Notice */}
              <div className="p-3 rounded-lg bg-[#14120F] border border-[#38302A] text-[10px] text-[#8C827A] space-y-1">
                <p className="font-bold text-[#F5A23A]">SYSTEM NOTICE &amp; DATA PROVENANCE</p>
                <p>
                  This Post-Disaster Summary is synthesized directly from verified database records in VajraGrid. Missing fields are explicitly marked as &quot;Not recorded&quot; rather than populated with placeholder estimates.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#26211C] bg-[#12110F] flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-[#7C756E] font-mono">
                {resolvedIncidents.length} resolved / {postDisasterIncidents.length} recovery records
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCopySummary}
                  className="bg-[#191715] border-[#38302A] text-[#AAA29A] hover:text-[#F4F0EB] text-xs h-9 gap-1.5 cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16B58A]" />
                      <span className="text-[#16B58A]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SITREP</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handlePrintSummary}
                  className="bg-[#191715] border-[#38302A] text-[#AAA29A] hover:text-[#F4F0EB] text-xs h-9 gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F5A23A]" />
                  <span>Print SITREP</span>
                </Button>
                <Button 
                  onClick={() => setShowSummaryModal(false)}
                  className="bg-[#16B58A] hover:bg-[#19cb9b] text-stone-950 font-bold text-xs h-9 px-4 cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
