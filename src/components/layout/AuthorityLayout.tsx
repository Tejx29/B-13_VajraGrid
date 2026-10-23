import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  LayoutGrid,
  Users,
  HeartHandshake,
  Navigation,
  Bell,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
  Moon,
  ChevronDown
} from 'lucide-react';
import { MockAPI } from '../../services/mockApi';
import { VajraGridLogo } from '../brand/VajraGridLogo';

export function AuthorityLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = await MockAPI.getNotifications();
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch {
        // ignore
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/map?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isCommandActive = path === '/admin/map' || path === '/admin' || path === '/admin/dashboard';

  return (
    <div className="bg-[#090909] text-[#F4F0EB] h-screen w-screen overflow-hidden flex font-sans antialiased selection:bg-[#F46B27] selection:text-white">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* =========================================================================
          A. LEFT NAVIGATION SIDEBAR (~15% width, #0B0B0A)
      ========================================================================= */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 lg:w-[15%] min-w-[210px] max-w-[250px] bg-[#0B0B0A] border-r border-[#26211C] z-50 flex flex-col transform transition-transform duration-200 ease-in-out shrink-0 select-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#26211C] shrink-0">
          <Link
            to="/admin/map"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            {/* Official VajraGrid Icon in compact sidebar */}
            <VajraGridLogo variant="icon" height={32} className="shrink-0 group-hover:scale-105 transition-transform" />

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold tracking-tight text-[#F4F0EB] text-sm">VajraGrid</span>
                <span className="text-[9px] font-mono font-extrabold uppercase px-1 py-0.2 rounded bg-[#851D2A] text-white">
                  OPS
                </span>
              </div>
              <span className="text-[8.5px] font-semibold uppercase tracking-wider text-[#7C756E] font-mono mt-0.5">
                PALGHAR DISTRICT EOC
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-[#AAA29A] hover:text-white rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grouped Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 text-xs font-medium">
          {/* Section 1: PRE-DISASTER */}
          <div className="space-y-1">
            <span className="px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#7C756E]">
              PRE-DISASTER
            </span>
            <Link
              to="/admin/monitoring"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                path.startsWith('/admin/monitoring')
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-[#F5A23A] shrink-0" />
              <span>Early Warning</span>
            </Link>
            <Link
              to="/admin/reports"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                path.startsWith('/admin/reports')
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-[#16B58A] shrink-0" />
              <span>Readiness Index</span>
            </Link>
          </div>

          {/* Section 2: DURING CRISIS */}
          <div className="space-y-1">
            <span className="px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#7C756E]">
              DURING CRISIS
            </span>
            <Link
              to="/admin/map"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                isCommandActive
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold shadow-xs'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <LayoutGrid className="h-3.5 w-3.5 text-[#F5A23A] shrink-0" />
                <span className="truncate">Unified Command</span>
              </div>
              {/* Active amber dot as shown in Stitch reference */}
              {isCommandActive && (
                <span className="w-2 h-2 rounded-full bg-[#F5A23A] shadow-[0_0_8px_#F5A23A] shrink-0"></span>
              )}
            </Link>

            <Link
              to="/admin/incidents"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                path.startsWith('/admin/incidents')
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <ShieldAlert className="h-3.5 w-3.5 text-[#E53946] shrink-0" />
                <span>Incidents</span>
              </div>
              <span className="bg-[#E53946] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full tracking-wider font-mono">
                LIVE
              </span>
            </Link>

            <Link
              to="/admin/volunteers"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                path.startsWith('/admin/volunteers')
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-[#AAA29A] shrink-0" />
              <span>Responders</span>
            </Link>
          </div>

          {/* Section 3: POST-DISASTER */}
          <div className="space-y-1">
            <span className="px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#7C756E]">
              POST-DISASTER
            </span>
            <Link
              to="/admin/resources"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                path.startsWith('/admin/resources')
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <HeartHandshake className="h-3.5 w-3.5 text-[#AAA29A] shrink-0" />
              <span>Humanitarian Aid</span>
            </Link>
          </div>

          {/* Section 4: COMMUNICATIONS */}
          <div className="space-y-1">
            <span className="px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#7C756E]">
              COMMUNICATIONS
            </span>
            <Link
              to="/admin/coordination"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                path.startsWith('/admin/coordination')
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <Navigation className="h-3.5 w-3.5 text-[#AAA29A] shrink-0" />
              <span>Dispatch & Comms</span>
            </Link>

            <Link
              to="/admin/notifications"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                path.startsWith('/admin/notifications')
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Bell className="h-3.5 w-3.5 text-[#F5A23A] shrink-0" />
                <span>Broadcast Alerts</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-[#E53946] text-white text-[9.5px] font-bold flex items-center justify-center font-mono">
                {unreadCount > 0 ? unreadCount : 3}
              </span>
            </Link>
          </div>
        </nav>

        {/* Sidebar Bottom: Operational Status & Settings/Logout */}
        <div className="p-3 border-t border-[#26211C] bg-[#0B0B0A] space-y-2.5 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-[#AAA29A] px-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#16B58A] shadow-[0_0_6px_#16B58A]"></span>
            <span>System Operational</span>
          </div>

          <div className="h-px bg-[#26211C] w-full" />

          <div className="flex items-center justify-between px-1 text-[#AAA29A]">
            <Link
              to="/admin/settings"
              className="flex items-center gap-1.5 hover:text-[#F4F0EB] transition-colors"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </Link>

            <Link
              to="/auth/select"
              className="p-1 hover:text-[#F4F0EB] transition-colors"
              title="Exit / Switch Role"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN WORKSPACE WRAPPER (Top Header + Content)
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-[#090909]">
        {/* Top Application Header */}
        <header className="h-12 bg-[#090909] border-b border-[#26211C] px-4 flex items-center justify-between gap-4 shrink-0 z-20">
          {/* Left: Mobile hamburger & Global Search input */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-[#AAA29A] hover:text-[#F4F0EB] rounded-lg hover:bg-[#191715] transition-colors"
              title="Open Navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C756E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts, locations, responders..."
                className="w-full bg-[#12110F] border border-[#2E2721] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#F4F0EB] placeholder-[#7C756E] focus:outline-none focus:border-[#F5A23A]/70 transition-colors"
              />
            </form>
          </div>

          {/* Right: Notifications, Dark mode, User Avatar */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin/notifications"
              className="relative p-1.5 text-[#AAA29A] hover:text-[#F4F0EB] rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>

            <button
              type="button"
              className="p-1.5 text-[#AAA29A] hover:text-[#F4F0EB] rounded-lg transition-colors cursor-pointer"
              title="Toggle theme"
            >
              <Moon className="h-4 w-4" />
            </button>

            {/* Command HQ User Profile Badge */}
            <div className="flex items-center gap-2 pl-1 cursor-pointer group">
              <div className="w-6 h-6 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-[11px] font-bold">
                C
              </div>
              <span className="text-xs font-semibold text-[#F4F0EB]">Command HQ</span>
              <ChevronDown className="h-3 w-3 text-[#AAA29A] group-hover:text-[#F4F0EB]" />
            </div>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-y-auto relative bg-[#090909]">
          <Outlet context={{ globalSearchQuery: searchQuery }} />
        </div>
      </div>
    </div>
  );
}
