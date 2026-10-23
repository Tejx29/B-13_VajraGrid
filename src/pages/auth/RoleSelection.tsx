import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  ShieldAlert, 
  Users, 
  HeartHandshake,
  Compass,
  Radio
} from 'lucide-react';
import { VajraGridLogo } from '../../components/brand/VajraGridLogo';

export function RoleSelection() {
  return (
    <div className="relative min-h-screen w-full bg-[#07080B] text-[#F4F0EB] antialiased overflow-x-hidden font-sans selection:bg-[#F5A23A]/30 selection:text-white flex flex-col justify-between">
      {/* =========================================================================
          1. GEOSPATIAL BACKGROUND LAYER: SATELLITE EDGES, VIGNETTE & CONTOURS
      ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
        {/* A. Darkened Satellite Imagery (Flanked on Left & Right) */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity filter brightness-75 contrast-125 scale-105"
          style={{ 
            backgroundImage: `url('https://lh3.googleusercontent.com/aida/AEtjO1XeIYencJA5nWg2K_9tVWd6jGaIOFgpjT-Ie7is5OMeXFcFDoHb9Q0i9ZinykxcmdgVtozYQyvYxTwxnn-0DvgNACpOzzLki1efEWKj08ni_n1YcD-He6pPE16dmMrLF4CgyZ1Di1tymsLFOhrxcjyODfI15ecsEBe5VbGiWZmARA1uiI0qX0TecpsG0YWLZ6KTwmza5_tQcUle2TKXoA4hyQFDey3AtBD_6PiB73ZXxYPakGFtZbG55Q4')` 
          }}
        />

        {/* B. Deep Multi-Stop Vignette: Darkens center for 100% card legibility while preserving satellite edges */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080B]/60 via-[#07080B]/95 to-[#07080B]/60" />
        <div className="absolute inset-0 bg-radial-[circle_at_center] from-[#07080B]/70 via-[#07080B]/92 to-[#07080B]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07080B]/90 via-transparent to-[#07080B]/95" />

        {/* C. Ambient Color Blooms (Amber, Navy, and Emerald underglow) */}
        <div className="absolute top-[22%] left-[28%] w-[420px] h-[340px] bg-amber-600/8 rounded-full blur-[140px]" />
        <div className="absolute top-[26%] right-[28%] w-[460px] h-[360px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 w-[620px] h-[220px] bg-teal-600/8 rounded-full blur-[120px]" />

        {/* D. Fine Topographic Contour Lines & Technical Coordinate Marks (SVG) */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-35" 
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1600 1000"
        >
          <defs>
            <linearGradient id="topo-fade-left" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F8DFF" stopOpacity="0.22" />
              <stop offset="40%" stopColor="#4F8DFF" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#4F8DFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="topo-fade-right" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#F5A23A" stopOpacity="0.22" />
              <stop offset="40%" stopColor="#F5A23A" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#F5A23A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Left Flank Topographic Isobars */}
          <path d="M-80 180 Q 140 220 260 380 T 120 720 T -50 880" fill="none" stroke="url(#topo-fade-left)" strokeWidth="1.2" />
          <path d="M-60 120 Q 190 180 320 340 T 170 680 T -30 820" fill="none" stroke="url(#topo-fade-left)" strokeWidth="1" strokeDasharray="6 4" />
          <path d="M-40 260 Q 240 310 380 490 T 220 790 T 10 940" fill="none" stroke="url(#topo-fade-left)" strokeWidth="1.2" />
          <path d="M-20 340 Q 290 410 440 580 T 290 860" fill="none" stroke="url(#topo-fade-left)" strokeWidth="0.8" />

          {/* Right Flank Topographic Isobars */}
          <path d="M1680 160 Q 1440 240 1310 410 T 1450 760 T 1640 890" fill="none" stroke="url(#topo-fade-right)" strokeWidth="1.2" />
          <path d="M1660 100 Q 1390 190 1250 360 T 1390 710 T 1620 830" fill="none" stroke="url(#topo-fade-right)" strokeWidth="1" strokeDasharray="6 4" />
          <path d="M1640 240 Q 1340 330 1190 510 T 1330 810 T 1580 950" fill="none" stroke="url(#topo-fade-right)" strokeWidth="1.2" />
          <path d="M1620 320 Q 1280 430 1130 600 T 1270 880" fill="none" stroke="url(#topo-fade-right)" strokeWidth="0.8" />

          {/* Subtle Coordinate Grid Crosshairs */}
          <g stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1">
            <path d="M 120 240 L 132 240 M 126 234 L 126 246" />
            <path d="M 280 620 L 292 620 M 286 614 L 286 626" />
            <path d="M 1340 260 L 1352 260 M 1346 254 L 1346 266" />
            <path d="M 1480 680 L 1492 680 M 1486 674 L 1486 686" />
          </g>

          {/* Left Flank Map Elevation Notation */}
          <text x="140" y="244" fill="#6B7280" fontSize="9" fontFamily="monospace" letterSpacing="1">+120m</text>
          <text x="300" y="624" fill="#6B7280" fontSize="9" fontFamily="monospace" letterSpacing="1">+340m</text>
          <text x="1270" y="264" fill="#6B7280" fontSize="9" fontFamily="monospace" letterSpacing="1">+210m</text>
        </svg>

        {/* E. Restrained Geographic Map Markers */}
        {/* Left Coastal Marker (Red) */}
        <div className="hidden lg:block absolute left-[8%] top-[42%] pointer-events-none">
          <div className="relative flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E53946] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E53946] shadow-[0_0_8px_#E53946]" />
            </span>
            <span className="text-[9.5px] font-mono tracking-wider text-[#E53946]/80 uppercase bg-[#0B0D12]/80 px-2 py-0.5 rounded border border-[#E53946]/30 backdrop-blur-xs">
              COASTAL RADAR • 19.82°N
            </span>
          </div>
        </div>

        {/* Right Inundation Sensor Marker (Amber) */}
        <div className="hidden lg:block absolute right-[8%] top-[34%] pointer-events-none">
          <div className="relative flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5A23A] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F5A23A] shadow-[0_0_8px_#F5A23A]" />
            </span>
            <span className="text-[9.5px] font-mono tracking-wider text-[#F5A23A]/80 uppercase bg-[#0B0D12]/80 px-2 py-0.5 rounded border border-[#F5A23A]/30 backdrop-blur-xs">
              SURYA BASIN • RELAY
            </span>
          </div>
        </div>

        {/* F. Left Decorative Stage Pillar */}
        <div className="hidden 2xl:flex flex-col items-center gap-3 absolute left-7 top-1/2 -translate-y-1/2 pointer-events-none opacity-45">
          <div className="w-[1px] h-20 bg-gradient-to-b from-transparent to-[#38302A]" />
          <span className="text-[8.5px] font-mono tracking-[0.25em] text-[#AAA29A] uppercase [writing-mode:vertical-lr] rotate-180">
            MONITOR &nbsp;•&nbsp; PREPARE &nbsp;•&nbsp; RESPOND &nbsp;•&nbsp; RECOVER
          </span>
          <div className="w-[1px] h-20 bg-gradient-to-b from-[#38302A] to-transparent" />
        </div>

        {/* G. Upper-Right Information Panel */}
        <div className="hidden xl:flex flex-col gap-1 absolute right-8 top-24 pointer-events-none text-right">
          <div className="px-3.5 py-2 rounded-lg bg-[#0C1017]/80 border border-[#2E3748]/50 backdrop-blur-sm shadow-lg space-y-1">
            <div className="text-[9.5px] font-mono font-bold tracking-widest text-[#F5A23A] uppercase">
              REAL-TIME INSIGHTS
            </div>
            <div className="text-[9.5px] font-mono tracking-wider text-[#F4F0EB]/90 uppercase">
              SAFER COMMUNITIES
            </div>
            <div className="text-[9.5px] font-mono tracking-wider text-[#16B58A] uppercase">
              STRONGER RESPONSE
            </div>
          </div>
        </div>

        {/* H. Lower-Right Compass & Map-Scale Telemetry */}
        <div className="hidden lg:flex items-center gap-3 absolute right-8 bottom-6 pointer-events-none text-[10px] font-mono text-[#7C756E] select-none">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#AAA29A]" />
            <span className="text-[#AAA29A]">PALGHAR SECTOR</span>
          </div>
          <span>•</span>
          <span>19.6967° N, 72.7699° E</span>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-[2px] bg-[#38302A] relative">
              <div className="w-4 h-[2px] bg-[#F5A23A]" />
            </div>
            <span>5 KM</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. MINIMAL FULL-WIDTH HEADER
      ========================================================================= */}
      <header className="relative z-20 w-full border-b border-[#26211C]/80 bg-[#07080B]/85 backdrop-blur-md">
        <div className="w-full px-6 sm:px-10 lg:px-16 h-16 flex items-center justify-between">
          {/* Upper-Left Brand Logo (~5% margin) */}
          <Link to="/" className="flex items-center group py-1" aria-label="VajraGrid Home">
            <VajraGridLogo variant="full" height={36} className="group-hover:opacity-95 transition-opacity" />
          </Link>

          {/* Upper-Right Outlined "Back to Home" Button (~4-5% margin) */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#AAA29A] hover:text-[#F4F0EB] px-3.5 py-1.5 rounded-lg border border-[#38302A] bg-[#12110F]/80 hover:bg-[#191715] hover:border-[#4d4239] transition-all shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#AAA29A]" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* =========================================================================
          3. MAIN HERO & CENTERED ROLE SELECTION CONTENT (~1040px Container)
      ========================================================================= */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-8 md:py-12 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          {/* Eyebrow */}
          <div className="text-[10.5px] sm:text-[11px] font-mono font-bold tracking-[0.22em] text-[#AAA29A] uppercase text-center mb-3">
            DISASTER MONITORING &nbsp;•&nbsp; RESPONSE COORDINATION &nbsp;•&nbsp; SAFER COMMUNITIES
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-center tracking-tight leading-tight mb-3.5">
            <span className="text-[#F4F0EB]">Welcome to </span>
            <span className="text-[#F5A23A]">VajraGrid</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-xs sm:text-sm md:text-[15px] text-[#A1A1AA] text-center max-w-xl mx-auto leading-relaxed">
            Select your operational role to access mission-critical incident command tools or report emergencies and view public advisories.
          </p>
        </div>

        {/* Content Container (~1040px Width) */}
        <div className="w-full max-w-[1040px] mx-auto space-y-[26px]">
          {/* =====================================================================
              4. TWO MAIN ROLE CARDS: DISTRICT AUTHORITY & RESIDENT/CITIZEN
          ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[26px]">
            {/* ---------------- CARD A: DISTRICT AUTHORITY ---------------- */}
            <div className="group relative flex flex-col justify-between rounded-2xl p-7 sm:p-8 bg-[#11100E]/95 border border-[#F5A23A]/35 hover:border-[#F5A23A]/70 shadow-2xl transition-all duration-300 overflow-hidden">
              {/* Warm Amber Radial Lighting */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                {/* Top Row: Icon Container Left, Role Badge Right */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="w-13 h-13 rounded-xl bg-[#241C14] text-[#F5A23A] border border-[#F5A23A]/40 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-200">
                    <ShieldAlert className="w-6 h-6 text-[#F5A23A]" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider px-3 py-1 rounded-full bg-[#F5A23A]/10 text-[#F5A23A] border border-[#F5A23A]/45 uppercase">
                    OFFICIAL / EOC
                  </span>
                </div>

                {/* Title & Description */}
                <div className="mb-8 relative z-10">
                  <h2 className="text-2xl font-bold text-[#F4F0EB] group-hover:text-[#F5A23A] transition-colors tracking-tight">
                    District Authority
                  </h2>
                  <p className="text-sm text-[#9CA3AF] mt-2.5 leading-relaxed font-normal">
                    Unified Command Center, satellite GIS monitoring, resource dispatch, early warnings, and broadcast alerts.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-auto pt-2 relative z-10">
                <Link 
                  to="/admin/map" 
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold text-sm shadow-md shadow-amber-950/40 transition-all duration-200 group-hover:shadow-amber-500/20"
                >
                  <span>Access Command Portal</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* ---------------- CARD B: RESIDENT & CITIZEN ---------------- */}
            <div className="group relative flex flex-col justify-between rounded-2xl p-7 sm:p-8 bg-[#0B0F19]/95 border border-blue-500/35 hover:border-blue-500/65 shadow-2xl transition-all duration-300 overflow-hidden">
              {/* Cool Blue Radial Lighting */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                {/* Top Row: Icon Container Left, Role Badge Right */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="w-13 h-13 rounded-xl bg-[#0F1B33] text-[#60A5FA] border border-blue-500/40 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-200">
                    <Users className="w-6 h-6 text-[#60A5FA]" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/40 uppercase">
                    PUBLIC &amp; COMMUNITY
                  </span>
                </div>

                {/* Title & Description */}
                <div className="mb-8 relative z-10">
                  <h2 className="text-2xl font-bold text-[#F4F0EB] group-hover:text-[#75A9FF] transition-colors tracking-tight">
                    Resident &amp; Citizen
                  </h2>
                  <p className="text-sm text-[#9CA3AF] mt-2.5 leading-relaxed font-normal">
                    Report local emergencies with satellite pinpointing, view real-time hazard map, and check public relief shelters.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Side by Side */}
              <div className="mt-auto pt-2 flex gap-3 relative z-10">
                <Link 
                  to="/report" 
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl bg-[#E53946] hover:bg-[#eb4e5a] text-white font-bold text-xs sm:text-sm shadow-md shadow-red-950/40 transition-all duration-200"
                >
                  <span>Report Incident</span>
                </Link>
                <Link 
                  to="/live-map" 
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl bg-[#131A2B] hover:bg-[#1C263D] text-[#F4F0EB] border border-blue-500/30 font-semibold text-xs sm:text-sm transition-all duration-200"
                >
                  <span>Live Map</span>
                </Link>
              </div>
            </div>
          </div>

          {/* =====================================================================
              5. RESPONDER STRIP: CERTIFIED RESPONDERS & VOLUNTEERS
          ===================================================================== */}
          <div className="relative rounded-2xl p-4 sm:p-5 bg-[#0A1615]/90 border border-[#16B58A]/35 hover:border-[#16B58A]/60 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200 overflow-hidden">
            {/* Subtle Teal Atmospheric Glow */}
            <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 blur-2xl pointer-events-none" />

            {/* Left: Outlined Teal Icon & Description */}
            <div className="flex items-center gap-3.5 relative z-10 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-[#0E2824] text-[#16B58A] border border-[#16B58A]/40 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5 text-[#16B58A]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4F0EB]">
                  Certified Responders &amp; Volunteers
                </h3>
                <p className="text-[11px] sm:text-xs text-[#9CA3AF] mt-0.5">
                  Access assigned field missions, confirm scene arrival, and relay operation progress.
                </p>
              </div>
            </div>

            {/* Right: Apply & Responder Portal Actions */}
            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end relative z-10">
              <Link 
                to="/auth/volunteer/register" 
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#E2E8F0] bg-[#122320] hover:bg-[#1A332E] border border-[#16B58A]/30 transition-colors shadow-2xs"
              >
                Apply
              </Link>
              <Link 
                to="/volunteer/dashboard" 
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-950 bg-[#16B58A] hover:bg-[#19cb9b] shadow-sm shadow-emerald-950/40 transition-colors flex items-center gap-1.5"
              >
                <span>Responder Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Subdued Footer Spacer */}
      <footer className="relative z-20 py-3" />
    </div>
  );
}
