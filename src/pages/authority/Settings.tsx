import React, { useState } from 'react';
import { MapPin, Sliders, Bell, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function AuthoritySettings() {
  const [district] = useState('Palghar District, Maharashtra');
  const [coordinates] = useState('19.6967° N, 72.7699° E');
  const [rainThreshold, setRainThreshold] = useState('50');
  const [autoTriageConfidence, setAutoTriageConfidence] = useState('85');
  const [smsBroadcastEnabled, setSmsBroadcastEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">
              System Configuration & Parameters
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40">
              PALGHAR DISTRICT OPERATIONS
            </span>
          </div>
          <p className="text-sm text-[#AAA29A] font-medium">
            Configure jurisdiction coordinates, AI triage confidence cutoffs, and warning thresholds.
          </p>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl border border-[#16B58A]/50 bg-[#16B58A]/15 p-4 text-[#16B58A] text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[#16B58A] shrink-0" />
          <span className="font-medium">System configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* District Jurisdiction */}
        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardHeader className="border-b border-[#26211C] bg-[#12110F] p-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-[#F5A23A]" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-[#AAA29A]">Geographic Jurisdiction</CardTitle>
            </div>
            <CardDescription className="text-xs text-[#7C756E]">
              Defines the official boundaries and center datum for operations in Palghar, Maharashtra.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-[#7C756E]">District Name</label>
                <Input value={district} disabled className="mt-1 bg-[#12110F] font-semibold text-[#AAA29A] border-[#38302A]" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-[#7C756E]">Command Coordinates</label>
                <Input value={coordinates} disabled className="mt-1 bg-[#12110F] font-mono text-[#AAA29A] border-[#38302A]" />
              </div>
            </div>
            <div>
              <p className="text-xs text-[#7C756E]">
                Included Talukas: Palghar, Vasai, Dahanu, Talasari, Jawhar, Mokhada, Vada, Vikramgad.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Triage & Alerting Thresholds */}
        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardHeader className="border-b border-[#26211C] bg-[#12110F] p-5">
            <div className="flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-[#F5A23A]" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-[#AAA29A]">Alerting & Triage Parameters</CardTitle>
            </div>
            <CardDescription className="text-xs text-[#7C756E]">
              Sensitivities for automated risk flags and verification triage.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-[#7C756E]">
                  Severe Rainfall Warning Cutoff (mm / hr)
                </label>
                <Input
                  type="number"
                  value={rainThreshold}
                  onChange={e => setRainThreshold(e.target.value)}
                  className="mt-1 bg-[#12110F] border-[#38302A] text-[#F4F0EB] font-mono text-xs"
                />
                <p className="text-[11px] text-[#7C756E] mt-1">Precipitation level that triggers authority flood warnings.</p>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-[#7C756E]">
                  AI Triage Confidence Threshold (%)
                </label>
                <Input
                  type="number"
                  value={autoTriageConfidence}
                  onChange={e => setAutoTriageConfidence(e.target.value)}
                  className="mt-1 bg-[#12110F] border-[#38302A] text-[#F4F0EB] font-mono text-xs"
                />
                <p className="text-[11px] text-[#7C756E] mt-1">Minimum score for automatic severity rating classification.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Channels */}
        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardHeader className="border-b border-[#26211C] bg-[#12110F] p-5">
            <div className="flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-[#F5A23A]" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-[#AAA29A]">Notification Preferences</CardTitle>
            </div>
            <CardDescription className="text-xs text-[#7C756E]">
              Emergency broadcast mechanisms for authority personnel and citizens.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsBroadcastEnabled}
                onChange={e => setSmsBroadcastEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-[#F5A23A] focus:ring-[#F5A23A] border-[#38302A] bg-[#12110F] accent-[#F5A23A]"
              />
              <div>
                <p className="text-xs font-semibold text-[#F4F0EB]">Direct Citizen Evacuation Broadcast</p>
                <p className="text-[11px] text-[#AAA29A]">Broadcast high-severity coastal surge warnings to active citizen app users.</p>
              </div>
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" className="gap-2 bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold shadow-xs">
            <Save className="h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
