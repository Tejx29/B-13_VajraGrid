import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, MapPin, Briefcase } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';

export function VolunteerRegister() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    skills: '',
    availability: 'full-time',
    organization: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register('volunteer', formData);
      navigate('/volunteer/dashboard');
    } catch (err: any) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-[#F4F0EB]">Apply as Volunteer</h2>
        <p className="text-xs text-[#AAA29A] mt-2">Join our disaster relief network in Palghar District.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-[#ff727f] bg-[#851D2A]/20 border border-[#E53946]/40 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#AAA29A]">Full Name</label>
            <Input 
              type="text" 
              required 
              placeholder="Aarav Patil"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#AAA29A]">Email</label>
            <Input 
              type="email" 
              required 
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#AAA29A]">Phone</label>
            <Input 
              type="tel" 
              required 
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#AAA29A]">Primary Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C756E]" />
              <Input 
                type="text" 
                required 
                className="pl-9 bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E]"
                placeholder="Palghar / Manor / Dahanu"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#AAA29A]">Skills (Comma separated)</label>
          <Input 
            type="text" 
            required 
            placeholder="First Aid, Water Rescue, Driving"
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
            className="bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#AAA29A]">NGO / Org (Optional)</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C756E]" />
              <Input 
                type="text" 
                className="pl-9 bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E]"
                placeholder="Organization Name"
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#AAA29A]">Availability</label>
            <select 
              className="flex h-10 w-full rounded-lg border border-[#38302A] bg-[#12110F] px-3 py-2 text-xs font-medium text-[#F4F0EB] focus:outline-none focus:border-[#F5A23A]"
              value={formData.availability}
              onChange={(e) => setFormData({...formData, availability: e.target.value})}
            >
              <option value="full-time">Full-time (Emergency)</option>
              <option value="part-time">Part-time / Weekends</option>
              <option value="on-call">On-Call Only</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#AAA29A]">Password</label>
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"} 
              required 
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E] pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C756E] hover:text-[#F4F0EB]"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold mt-2" isLoading={isLoading}>
          Submit Application
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-[#AAA29A]">
          Already a volunteer?{' '}
          <Link to="/auth/volunteer/login" className="font-semibold text-[#F5A23A] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
