import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { VajraGridLogo } from '../brand/VajraGridLogo';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#090909] text-[#F4F0EB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative selection:bg-[#4F8DFF]/30 selection:text-white">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Link to="/" className="flex items-center text-xs font-semibold text-[#AAA29A] hover:text-[#F4F0EB] px-3.5 py-1.5 rounded-lg border border-[#38302A] bg-[#12110F] hover:bg-[#191715] transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-6" aria-label="VajraGrid Home">
          <VajraGridLogo variant="full" height={44} />
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-[#191715] py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-[#38302A]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
