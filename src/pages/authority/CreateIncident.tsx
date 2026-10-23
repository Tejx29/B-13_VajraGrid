import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Users, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { MockAPI, resolvePalgharLocation } from '../../services/mockApi';
import { LocationPicker } from '../../components/map/LocationPicker';

export function CreateIncident() {
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'Flood',
    description: '',
    severity: 'High',
    affectedPopulation: '',
    requiredResources: ''
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
      const cleanAddr = finalLoc.address.replace(/^\[.*?\]\s*/, '').trim();
      const locationLabel = cleanAddr.split(',')[0].trim() || finalLoc.district || 'Location';
      const incident = await MockAPI.reportIncident({
        title: `${formData.type} at ${locationLabel}`,
        description: formData.description,
        location: {
          lat: Number(finalLoc.lat),
          lng: Number(finalLoc.lng),
          address: finalLoc.address,
          country: finalLoc.country || 'India',
          state: finalLoc.state || 'Maharashtra',
          district: finalLoc.district || 'Palghar',
          verificationStatus: finalLoc.verificationStatus || 'verified'
        },
        reporterRole: 'authority',
        source: 'Authority Created',
        type: formData.type,
        urgency: formData.severity as any,
        status: 'pending'
      });
      
      setCreatedId(incident.id.replace('inc_', 'INC-').toUpperCase());
      setSuccess(true);
    } catch (error: any) {
      console.error(error);
      setLocationError(error.message || 'Failed to create incident with specified location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full shadow-2xl border-[#16B58A]/50 bg-[#191715]">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-[#16B58A]/20 border border-[#16B58A]/40 rounded-2xl flex items-center justify-center mb-6 text-[#16B58A]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-[#F4F0EB] mb-2">Incident Logged Successfully</h2>
            <p className="text-xs text-[#AAA29A] mb-6 leading-relaxed">
              Incident <span className="font-mono font-bold text-[#F5A23A]">{createdId}</span> has been committed to Palghar District EOC operations and is immediately active on the Unified Command map.
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 bg-[#27211B] border-[#38302A] text-[#F4F0EB] hover:bg-[#342c24]" onClick={() => navigate('/admin/map')}>
                Unified Command Map
              </Button>
              <Button className="flex-1 bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold" onClick={() => navigate('/admin/incidents')}>
                View Incidents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4 w-full animate-in fade-in duration-300">
      <div className="flex flex-col mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">Log Incident & Hazard</h1>
        <p className="text-sm font-medium text-[#AAA29A]">Proactively log an emergency incident, early warning, or verified citizen report.</p>
      </div>

      <Card className="shadow-sm border border-[#38302A] bg-[#191715] rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 sm:p-8 space-y-8">
            
            {/* Primary Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[#26211C] pb-2">
                <ShieldAlert className="h-5 w-5 text-[#F5A23A]" />
                <h3 className="font-bold text-[#F4F0EB] text-base font-mono uppercase tracking-wider">Primary Details</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase text-[#AAA29A]">Disaster Classification</label>
                  <select 
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full h-11 rounded-lg border border-[#38302A] bg-[#12110F] px-3 text-xs font-semibold text-[#F4F0EB] focus:border-[#F5A23A] outline-none transition-colors cursor-pointer"
                    required
                  >
                    <option value="Flood">Flood</option>
                    <option value="Fire">Fire</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Cyclone">Cyclone</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase text-[#AAA29A]">Severity Level</label>
                  <select 
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                    className="w-full h-11 rounded-lg border border-[#38302A] bg-[#12110F] px-3 text-xs font-semibold text-[#F4F0EB] focus:border-[#F5A23A] outline-none transition-colors cursor-pointer"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-[#AAA29A]">Incident Location & Coordinates</label>
                  <span className="text-[11px] text-[#7C756E] font-mono">
                    {locationValue.district ? `${locationValue.district} Sector` : 'District Geographic Sector'}
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
                  <div className="p-3 bg-[#E53946]/15 border border-[#E53946]/40 rounded-lg text-[#ff727f] text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#E53946]" />
                    <span>{locationError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assessment */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[#26211C] pb-2">
                <AlertTriangle className="h-5 w-5 text-[#F46B27]" />
                <h3 className="font-bold text-[#F4F0EB] text-base font-mono uppercase tracking-wider">Initial Assessment</h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase text-[#AAA29A]">Situation Description</label>
                <Textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide brief operational details, impacted infrastructure, access constraints..."
                  className="min-h-[100px] resize-none text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase text-[#AAA29A] flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-[#F5A23A]" /> Affected Population
                  </label>
                  <Input 
                    name="affectedPopulation"
                    value={formData.affectedPopulation}
                    onChange={handleChange}
                    placeholder="e.g. 150 households"
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase text-[#AAA29A] flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-[#F5A23A]" /> Required Resources
                  </label>
                  <Input 
                    name="requiredResources"
                    value={formData.requiredResources}
                    onChange={handleChange}
                    placeholder="e.g. Boats, Medical Kits, Food Rations"
                    className="h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-[#26211C]">
              <span className="text-xs font-mono text-[#AAA29A] bg-[#12110F] px-3 py-1.5 rounded-lg border border-[#38302A]">
                Source: <strong className="text-[#F4F0EB]">Authority Created</strong>
              </span>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => navigate(-1)} 
                  className="font-semibold text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#27211B]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold h-10 px-8 shadow-xs"
                >
                  {isSubmitting ? 'Submitting...' : 'Log Incident'}
                </Button>
              </div>
            </div>

          </CardContent>
        </form>
      </Card>
    </div>
  );
}
