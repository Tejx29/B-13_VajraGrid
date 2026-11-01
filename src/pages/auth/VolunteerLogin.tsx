import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';

export function VolunteerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login('volunteer', formData.email);
      navigate('/volunteer/dashboard');
    } catch (err: any) {
      setError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-[#F4F0EB]">Volunteer Login</h2>
        <p className="text-xs text-[#AAA29A] mt-2">Access your assignments and coordinate field relief.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-xs text-[#ff727f] bg-[#851D2A]/20 border border-[#E53946]/40 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#AAA29A]">Email Address</label>
          <Input 
            type="email" 
            required 
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="bg-[#12110F] border-[#38302A] text-[#F4F0EB] placeholder:text-[#7C756E]"
          />
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

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <input id="remember" type="checkbox" className="h-3.5 w-3.5 rounded border-[#38302A] bg-[#12110F] text-[#F5A23A] accent-[#F5A23A]" />
            <label htmlFor="remember" className="ml-2 block text-[#AAA29A]">Remember me</label>
          </div>
          <a href="#" className="font-medium text-[#F5A23A] hover:underline">Forgot password?</a>
        </div>

        <Button type="submit" className="w-full bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold" isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-[#AAA29A]">
          Want to help?{' '}
          <Link to="/auth/volunteer/register" className="font-semibold text-[#F5A23A] hover:underline">
            Apply to be a Volunteer
          </Link>
        </p>
      </div>
    </>
  );
}
