import React from 'react';
import { Link } from 'react-router-dom';
import { VajraGridLogo } from '../../components/brand/VajraGridLogo';

export function CitizenHome() {
  return (
    <div className="bg-[#090909] text-[#F5F1EC] font-sans antialiased min-h-screen flex flex-col w-full selection:bg-[#4F8DFF]/30 selection:text-white">
      {/* Top Navigation Bar with WCAG AA High-Contrast Branding & Links */}
      <nav className="bg-[#0B0B0A] border-b border-[#38302A] h-16 w-full sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 flex-shrink-0">
        {/* Brand: Official VajraGrid Logo with Wordmark */}
        <div className="flex items-center gap-3">
          <Link className="flex items-center group py-1" to="/" aria-label="VajraGrid Home">
            <VajraGridLogo variant="full" height={36} className="group-hover:opacity-95 transition-opacity" />
          </Link>
        </div>

        {/* Center Navigation Links - Clear Contrast */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            aria-current="page"
            className="text-white font-bold border-b-2 border-[#4F8DFF] pb-1 text-sm tracking-wide transition-colors"
          >
            Home
          </Link>
          <Link
            to="/live-map"
            className="text-[#D0D4DC] hover:text-white font-medium text-sm transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#16B58A]"></span>
            <span>Live Map</span>
          </Link>
          <Link
            to="/live-map"
            className="text-[#D0D4DC] hover:text-white font-medium text-sm transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF525A]"></span>
            <span>Alerts</span>
          </Link>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/auth/select"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#27211B] hover:bg-[#342c24] text-[#F5F1EC] hover:text-white border border-[#38302A] hover:border-[#4F8DFF]/40 text-sm font-semibold transition-all shadow-sm"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Main Hero Container */}
      <main className="flex-1 flex items-center justify-center px-6 lg:px-12 py-8 lg:py-12 relative overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center relative z-10">
          {/* Left Column: Hero Content */}
          <div className="flex flex-col justify-center">
            {/* Eyebrow Label with High Contrast Blue Accent */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#4F8DFF]/10 border border-[#4F8DFF]/30 text-[#4F8DFF] text-xs font-mono font-bold tracking-wider uppercase mb-5 w-fit">
              <span className="w-2 h-2 rounded-full bg-[#4F8DFF] animate-pulse"></span>
              <span>AI-POWERED DISASTER RESPONSE</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] lg:leading-[1.12] font-black text-[#F5F1EC] mb-5 tracking-tight">
              Prepare Early.<br />
              Respond Faster.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F1EC] via-[#E5E9F0] to-[#A0A6B2]">
                Save Lives.
              </span>
            </h1>

            {/* Clear, High-Contrast Description */}
            <p className="text-base sm:text-lg text-[#C0C4CC] mb-8 max-w-xl leading-relaxed font-normal">
              VajraGrid helps authorities detect emerging risks, coordinate emergency response, and manage relief operations in real time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/report"
                className="bg-[#E53946] hover:bg-[#f04856] text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-red-950/50 flex items-center gap-2.5 group hover:scale-[1.02]"
              >
                <span>Report Emergency</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
              <Link
                to="/live-map"
                className="bg-[#191715] hover:bg-[#27211B] text-[#F5F1EC] hover:text-white border border-[#38302A] hover:border-[#4F8DFF]/60 px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-2.5 shadow-md group hover:scale-[1.02]"
              >
                <span className="material-symbols-outlined text-[#75A9FF] text-[20px] group-hover:scale-110 transition-transform">
                  map
                </span>
                <span>Explore Live Map</span>
              </Link>
            </div>

            {/* Quick Emergency Helplines Bar & Citizen Portal Link */}
            <div className="mt-8 pt-6 border-t border-[#38302A]/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 text-[#AAA29A]">
                <span className="font-mono font-bold text-white text-[11px] uppercase tracking-wider bg-[#27211B] px-2 py-0.5 rounded border border-[#38302A]">
                  PALGHAR HELPLINES:
                </span>
                <span className="text-white font-mono font-bold hover:text-[#4F8DFF] transition-colors">112 (Police/Fire)</span>
                <span>&bull;</span>
                <span className="text-white font-mono font-bold hover:text-[#4F8DFF] transition-colors">02525-252020 (District EOC)</span>
                <span>&bull;</span>
                <span className="text-white font-mono font-bold hover:text-[#4F8DFF] transition-colors">108 (Ambulance)</span>
              </div>
              <Link 
                to="/citizen/dashboard" 
                className="text-xs font-semibold text-[#4F8DFF] hover:underline flex items-center gap-1"
              >
                <span>Readiness Checklists &rarr;</span>
              </Link>
            </div>

          </div>

          {/* Right Column: High-Fidelity Satellite GIS Map Preview & Telemetry Overlay */}
          <div className="relative h-[480px] lg:h-[540px] w-full rounded-2xl border border-[#38302A] bg-[#090909] shadow-2xl overflow-hidden hidden lg:block group">
            {/* Satellite Terrain Backdrop */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage: "url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/11/900/1441')",
                backgroundPosition: 'center 40%',
              }}
            ></div>

            {/* Tactical Grid & Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090909]/95 via-transparent to-[#090909]/75 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#4F8DFF_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

            {/* Satellite HUD Header Bar */}
            <div className="absolute top-0 inset-x-0 bg-[#0B0B0A]/85 backdrop-blur-md border-b border-[#38302A] px-4 py-2.5 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16B58A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16B58A]"></span>
                </span>
                <span className="text-[11px] font-mono font-bold tracking-wider text-[#F5F1EC] uppercase">
                  SATELLITE SURVEILLANCE &bull; PALGHAR SECTOR
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#A0A6B2]">
                <span>19.6967° N, 72.7699° E</span>
                <span className="text-[#4F8DFF] font-bold">LIVE</span>
              </div>
            </div>

            {/* Tactical Target Pings on the Map */}
            <div className="absolute top-[42%] left-[48%] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute w-16 h-16 rounded-full bg-[#E53946]/40"></span>
                <span className="w-8 h-8 rounded-full bg-[#E53946]/25 border border-[#E53946]/60 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E53946]"></span>
                </span>
                <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#090909]/90 border border-[#E53946]/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-[#FF525A]">
                  SURYA RIVER BASIN
                </div>
              </div>
            </div>

            {/* Floating Card 1: Weather Alert (Top-Right) */}
            <div className="absolute top-14 right-6 bg-[#12110F]/95 border border-[#FF525A]/40 rounded-xl shadow-2xl p-4 w-72 backdrop-blur-md z-20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF525A] text-[18px]">warning</span>
                  <span className="text-[11px] font-mono font-bold tracking-wider text-[#FF525A] uppercase">
                    WEATHER ALERT
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#851D2A]/80 text-[#FF525A] border border-[#FF525A]/50">
                  HIGH RISK
                </span>
              </div>
              <div className="text-sm font-bold text-[#F5F1EC] mb-1">Heavy Flash Flood Warning</div>
              <div className="text-[11px] text-[#C0C4CC] leading-tight">
                Surya River basin &bull; Manor Taluka EOC Alert
              </div>
            </div>

            {/* Floating Card: Live Incidents (Compact HUD badge) */}
            <div className="absolute bottom-6 right-6 bg-[#12110F]/95 border border-[#38302A] rounded-xl shadow-xl px-3.5 py-2.5 w-56 backdrop-blur-md z-20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F8DFF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4F8DFF]"></span>
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#75A9FF] uppercase">
                  LIVE INCIDENTS
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs font-medium text-[#C0C4CC]">
                  <span className="font-mono font-extrabold text-lg text-[#F5F1EC] mr-1">12</span> Active
                </div>
                <div className="text-[10px] font-mono font-bold text-[#FF525A] bg-[#851D2A]/60 px-2 py-0.5 rounded border border-[#FF525A]/40">
                  3 Critical
                </div>
              </div>
            </div>

            {/* Quick Interactive Map Launcher Overlay */}
            <Link
              to="/live-map"
              className="absolute bottom-6 left-6 z-20 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#27211B]/90 hover:bg-[#342c24] border border-[#38302A] text-xs font-semibold text-[#F4F0EB] backdrop-blur-md transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-[#4F8DFF]">open_in_full</span>
              <span>Launch Full Tactical Map</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
