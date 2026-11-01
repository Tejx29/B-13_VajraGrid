import React, { useState } from 'react';
import { X, UserPlus, Loader2, MapPin, AlertCircle, Shield, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MockAPI } from '../../services/mockApi';
import { Volunteer, Location } from '../../types';

interface OnboardResponderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (volunteer: Volunteer) => void;
}

const AVAILABLE_SKILLS = [
  'First Aid',
  'Search & Rescue',
  'Medical / Triage',
  'Flood Evacuation',
  'Firefighting / HAZMAT',
  'Logistics & Transport',
  'Drone Recon',
  'Marine Rescue'
];

const PRESET_LOCATIONS: { name: string; address: string; lat: number; lng: number }[] = [
  { name: 'Palghar Central Sector', address: 'Palghar Central Depot, Palghar', lat: 19.6967, lng: 72.7699 },
  { name: 'Civil Hospital Unit', address: 'Civil Hospital Depot, Palghar', lat: 19.6970, lng: 72.7680 },
  { name: 'Dahanu Coastal Unit', address: 'Dahanu Coastal Jetty Base, Dahanu', lat: 19.9750, lng: 72.7290 },
  { name: 'Manor Logistics Base', address: 'PWD Logistics Depot, Manor', lat: 19.7400, lng: 72.9050 },
  { name: 'Boisar Industrial Fire Unit', address: 'Boisar MIDC Fire Depot, Boisar', lat: 19.8030, lng: 72.7560 },
  { name: 'Jawhar Tribal Division', address: 'Jawhar Tribal Sub-Division Depot, Jawhar', lat: 19.9050, lng: 73.2320 },
  { name: 'Wada Emergency Relay', address: 'Wada Block Headquarters, Wada', lat: 19.6540, lng: 73.1380 }
];

export function OnboardResponderModal({ isOpen, onClose, onSuccess }: OnboardResponderModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(PRESET_LOCATIONS[0].address);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['First Aid', 'Search & Rescue']);
  const [status, setStatus] = useState<'available' | 'offline'>('available');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill)
        ? (prev.length > 1 ? prev.filter(s => s !== skill) : prev) // keep at least 1 skill
        : [...prev, skill]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Responder full name is required.');
      return;
    }

    if (selectedSkills.length === 0) {
      setErrorMessage('Please select at least one core skill.');
      return;
    }

    const locPreset = PRESET_LOCATIONS.find(l => l.address === selectedLocation) || PRESET_LOCATIONS[0];
    const loc: Location = {
      lat: locPreset.lat,
      lng: locPreset.lng,
      address: locPreset.address,
      state: 'Maharashtra',
      district: 'Palghar',
      country: 'India',
      verificationStatus: 'verified'
    };

    setIsSubmitting(true);
    try {
      const created = await MockAPI.addVolunteer({
        name: trimmedName,
        skills: selectedSkills,
        phone: phone.trim() || undefined,
        status,
        location: loc
      });

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to onboard responder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={isSubmitting ? undefined : onClose} 
      />
      
      <div className="relative w-full max-w-lg rounded-2xl bg-[#12110F] border border-[#38302A] shadow-2xl p-6 sm:p-7 z-10 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#26211C] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#241C14] text-[#F5A23A] border border-[#F5A23A]/40 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F4F0EB] tracking-tight">Onboard Field Responder</h2>
              <p className="text-xs text-[#AAA29A] mt-0.5">Register a certified responder into Palghar District EOC roster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#27211B] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#E53935]/15 border border-[#E53935]/40 text-[#FF8A80] text-xs flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Responder Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#F4F0EB] block">
              Full Name <span className="text-[#F5A23A]">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Captain Rajesh Deshmukh"
              required
              className="h-10 bg-[#191715] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E] focus:border-[#F5A23A]"
            />
          </div>

          {/* Contact Phone & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#F4F0EB] block">
                Contact Phone
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 XXXXX"
                className="h-10 bg-[#191715] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E] focus:border-[#F5A23A]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#F4F0EB] block">
                Initial Readiness
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'available' | 'offline')}
                className="w-full h-10 rounded-lg border border-[#38302A] bg-[#191715] px-3 text-xs font-medium text-[#F4F0EB] focus:outline-none focus:border-[#F5A23A] transition-colors cursor-pointer"
              >
                <option value="available">Available (Immediate Dispatch)</option>
                <option value="offline">Offline / Standby (Off Duty)</option>
              </select>
            </div>
          </div>

          {/* Operating Base Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#F4F0EB] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#F5A23A]" />
              <span>Assigned District Base / Sector</span>
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full h-10 rounded-lg border border-[#38302A] bg-[#191715] px-3 text-xs font-medium text-[#F4F0EB] focus:outline-none focus:border-[#F5A23A] transition-colors cursor-pointer"
            >
              {PRESET_LOCATIONS.map((loc) => (
                <option key={loc.address} value={loc.address}>
                  {loc.name} — {loc.address}
                </option>
              ))}
            </select>
          </div>

          {/* Core Skills & Capabilities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#F4F0EB] flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#F5A23A]" />
                <span>Specializations & Capabilities</span>
              </label>
              <span className="text-[10px] font-mono text-[#AAA29A]">Select all that apply</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F5A23A]/15 border-[#F5A23A]/60 text-[#F5A23A] shadow-xs'
                        : 'bg-[#191715] border-[#38302A] text-[#AAA29A] hover:border-[#4d4239] hover:text-[#F4F0EB]'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-[#F5A23A]" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#26211C] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-[#27211B] border-[#38302A] text-[#AAA29A] hover:text-[#F4F0EB] text-xs h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold text-xs h-10 px-5 gap-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Onboarding...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Onboard Responder</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
