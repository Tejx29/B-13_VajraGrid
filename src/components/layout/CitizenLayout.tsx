import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { VajraGridLogo } from '../brand/VajraGridLogo';

export function CitizenLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090909] text-[#F4F0EB] flex flex-col font-sans selection:bg-[#4F8DFF]/30 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-[#38302A] bg-[#0B0B0A] shadow-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 relative">
          {/* Left: Logo & Branding */}
          <Link to="/" className="flex items-center gap-3">
            <VajraGridLogo variant="full" height={36} />
            <span className="hidden sm:inline-block border-l border-[#38302A] pl-3 text-[10px] font-mono font-bold text-[#F5A23A] uppercase tracking-wider">
              FIELD RESPONDER ACCESS
            </span>
          </Link>

          {/* Center: Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#AAA29A] md:absolute md:left-1/2 md:-translate-x-1/2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/live-map" className="hover:text-white transition-colors">Live Map</Link>
            <Link to="/report" className="hover:text-white transition-colors">Report Emergency</Link>
            <Link to="/volunteer/dashboard" className={`pb-1 ${location.pathname.startsWith('/volunteer') ? 'text-white border-b-2 border-[#F5A23A] font-bold' : 'hover:text-white transition-colors'}`}>
              Responder Portal
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link to="/admin/map">
              <Button variant="outline" className="bg-[#191715] text-[#AAA29A] hover:text-[#F4F0EB] border-[#38302A] text-xs font-semibold gap-1.5 h-8">
                <Shield className="h-3.5 w-3.5 text-[#F5A23A]" /> Authority EOC
              </Button>
            </Link>
            <Link to="/auth/select">
              <Button variant="outline" className="bg-[#27211B] text-[#F4F0EB] hover:bg-[#342c24] border-[#38302A] text-xs font-semibold h-8">
                Switch Role
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-[#AAA29A] hover:text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#26211C] bg-[#0B0B0A] px-4 py-3">
            <nav className="flex flex-col space-y-2 text-xs font-semibold text-[#AAA29A]">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="py-1.5 hover:text-white">Home</Link>
              <Link to="/live-map" onClick={() => setIsMobileMenuOpen(false)} className="py-1.5 hover:text-white">Live Map</Link>
              <Link to="/report" onClick={() => setIsMobileMenuOpen(false)} className="py-1.5 hover:text-white">Report Emergency</Link>
              <Link to="/volunteer/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="py-1.5 text-white">Responder Portal</Link>
              <div className="pt-2 border-t border-[#26211C] flex flex-col gap-2">
                <Link to="/admin/map" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center bg-[#191715] text-[#F4F0EB] border-[#38302A] text-xs">
                    Authority EOC
                  </Button>
                </Link>
                <Link to="/auth/select" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-center bg-[#F5A23A] text-stone-950 font-bold text-xs">
                    Switch Role
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
      
      <main className="flex-1 w-full flex flex-col bg-[#090909] text-[#F4F0EB] p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
