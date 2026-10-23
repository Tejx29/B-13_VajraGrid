import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Send, ShieldCheck, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { MockAPI, resolvePalgharLocation } from '../../services/mockApi';
import { LocationPicker } from '../../components/map/LocationPicker';
import { VajraGridLogo } from '../../components/brand/VajraGridLogo';

export function ReportIncident() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  const [locationValue, setLocationValue] = useState<{
    lat: number | null;
    lng: number | null;
    address: string;
    country?: string;
    state?: string;
    district?: string;
    verificationStatus?: 'verified' | 'unverified' | 'boundary_unverified';
  }>({
    lat: null,
    lng: null,
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocationError(null);

    let finalLoc = locationValue;
    const hasNumericCoords = 
      typeof finalLoc.lat === 'number' && 
      typeof finalLoc.lng === 'number' && 
      !isNaN(finalLoc.lat) && 
      !isNaN(finalLoc.lng);

    if (!hasNumericCoords) {
      if (finalLoc.address.trim()) {
        const resolved = resolvePalgharLocation(finalLoc.address);
        if (resolved) {
          finalLoc = {
            ...resolved,
            country: 'India',
            state: 'Maharashtra',
            district: 'Palghar',
            verificationStatus: 'verified'
          };
          setLocationValue(finalLoc);
        }
      }
    }

    if (finalLoc.lat === null || finalLoc.lng === null || isNaN(finalLoc.lat) || isNaN(finalLoc.lng)) {
      setLocationError('Please select a valid location from the search or click on the map to pinpoint exact coordinates.');
      return;
    }

    // If address is unresolved/empty, allow reporting with precise coordinates
    if (!finalLoc.address || !finalLoc.address.trim()) {
      finalLoc = {
        ...finalLoc,
        address: `[Approximate Coordinates] Point at ${finalLoc.lat.toFixed(4)}° N, ${finalLoc.lng.toFixed(4)}° E`
      };
    }

    setIsSubmitting(true);
    
    try {
      await MockAPI.reportIncident({
        title: formData.title,
        description: formData.description,
        location: {
          lat: Number(finalLoc.lat),
          lng: Number(finalLoc.lng),
          address: finalLoc.address,
          country: finalLoc.country || 'India',
          state: finalLoc.state || 'Maharashtra',
          district: finalLoc.district || 'Palghar',
          verificationStatus: finalLoc.verificationStatus || 'verified',
        },
        reporterRole: 'citizen',
        source: 'Citizen Report',
      });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setLocationError(err.message || 'Failed to submit report. Please verify location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#090909] text-[#F4F0EB] flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full bg-[#191715] border border-[#16B58A]/50 rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#16B58A]/20 border border-[#16B58A]/40 text-[#16B58A]">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#F4F0EB]">Emergency Report Submitted</h2>
          <p className="mb-6 text-sm text-[#AAA29A] leading-relaxed">
            Thank you. Your incident report and verified satellite coordinates have been committed to Palghar District Emergency Operations for immediate response.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/live-map')} className="flex-1 bg-[#191715] hover:bg-[#27211B] text-[#F4F0EB] border border-[#38302A]">
              View Live Map
            </Button>
            <Button onClick={() => navigate('/')} className="flex-1 bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold">
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090909] text-[#F4F0EB] font-sans">
      {/* Top Header */}
      <header className="h-16 bg-[#0B0B0A] border-b border-[#38302A] px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center group py-1" aria-label="VajraGrid Home">
          <VajraGridLogo variant="full" height={32} className="group-hover:opacity-95 transition-opacity" />
        </Link>
        <button
          onClick={() => navigate('/')}
          className="text-xs text-[#AAA29A] hover:text-[#F4F0EB] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#38302A] bg-[#12110F]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F0EB]">Report an Incident</h1>
          <p className="text-sm text-[#AAA29A] mt-1.5">
            Provide accurate details and pinpoint the hazard on the satellite map so emergency response teams in Palghar District can deploy promptly.
          </p>
        </div>

        <Card className="bg-[#191715] border-[#38302A] shadow-xl">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-xs font-bold text-[#AAA29A] uppercase tracking-wider">
                  Incident Type / Headline
                </label>
                <Input
                  id="title"
                  placeholder="e.g. Flash Flooding on Station Road, Snapped Live Wire, Landslide"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E]"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-xs font-bold text-[#AAA29A] uppercase tracking-wider">
                  Incident Description & Urgency
                </label>
                <Textarea
                  id="description"
                  placeholder="Describe current severity, trapped persons, water depth, blocked routes, or urgent assistance needed..."
                  required
                  className="min-h-[100px] bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E]"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#AAA29A] uppercase tracking-wider">
                    Satellite Pinpoint & Location
                  </label>
                  <span className="text-[11px] font-mono text-[#F5A23A]">
                    {locationValue.district ? `${locationValue.district} Sector` : 'Search landmark or click satellite map'}
                  </span>
                </div>
                <LocationPicker
                  value={locationValue}
                  mapHeight="h-[440px] sm:h-[480px]"
                  onChange={(loc) => {
                    setLocationValue(loc);
                    setLocationError(null);
                  }}
                />
                {locationError && (
                  <div className="p-3 bg-[#851D2A]/80 border border-[#E53946]/50 rounded-lg text-[#FF525A] text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#FF525A]" />
                    <span>{locationError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#AAA29A] uppercase tracking-wider">
                  Media Attachments (Optional)
                </label>
                <div className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#38302A] bg-[#12110F] transition-colors hover:border-[#F5A23A]/50 hover:bg-[#191715]">
                  <Camera className="mb-2 h-6 w-6 text-[#7C756E]" />
                  <span className="text-xs font-medium text-[#AAA29A]">Click to upload photos or field footage</span>
                  <span className="text-[10px] text-[#7C756E] font-mono mt-0.5">JPG, PNG, MP4 (Max 10MB)</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t border-[#26211C] p-6 bg-[#12110F]">
              <Button type="button" variant="outline" className="bg-[#191715] border-[#38302A] text-[#AAA29A] hover:bg-[#27211B] hover:text-[#F4F0EB]" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2 bg-[#E53946] hover:bg-[#f04856] text-white font-bold shadow-md shadow-red-950/40" isLoading={isSubmitting}>
                <Send className="h-4 w-4" />
                Submit Emergency Report
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
