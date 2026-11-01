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
  Sun,
  ChevronDown,
  FileText
} from 'lucide-react';
import { MockAPI } from '../../services/mockApi';
import { VajraGridLogo } from '../brand/VajraGridLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export function AuthorityLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-[#F4F0EB] text-sm">VajraGrid</span>
              <span className="text-[9px] font-mono font-extrabold uppercase px-1 py-0.2 rounded bg-[#851D2A] text-white">
                OPS
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
        <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-6 text-xs font-medium">
          {/* Section 1: PRE-DISASTER */}
          <div className="space-y-2">
            <span className="px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#7C756E] block">
              PRE-DISASTER
            </span>
            <Link
              to="/admin/monitoring"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                path.startsWith('/admin/monitoring')
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-[#F5A23A] shrink-0" />
              <span>Early Warning</span>
            </Link>
          </div>

          {/* Section 2: DURING CRISIS */}
          <div className="space-y-2">
            <span className="px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#7C756E] block">
              DURING CRISIS
            </span>
            <Link
              to="/admin/map"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
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
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
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
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
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
          <div className="space-y-2">
            <span className="px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#7C756E] block">
              POST-DISASTER
            </span>
            <Link
              to="/admin/resources"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                path.startsWith('/admin/resources')
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <HeartHandshake className="h-3.5 w-3.5 text-[#AAA29A] shrink-0" />
              <span>Humanitarian Aid</span>
            </Link>
            <Link
              to="/admin/reports"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                path.startsWith('/admin/reports')
                  ? 'bg-[#191715] border border-[#38302A] text-[#F4F0EB] font-semibold'
                  : 'text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715]/60'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-[#16B58A] shrink-0" />
              <span>Reports</span>
            </Link>
          </div>

          {/* Section 4: COMMUNICATIONS */}
          <div className="space-y-2">
            <span className="px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#7C756E] block">
              COMMUNICATIONS
            </span>
            <Link
              to="/admin/coordination"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
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
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
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

        {/* Sidebar Bottom: Role Switch */}
        <div className="p-3 border-t border-[#26211C] bg-[#0B0B0A] shrink-0 text-xs">
          <div className="flex items-center justify-end px-1 text-[#AAA29A]">
            <Link
              to="/auth/select"
              className="flex items-center gap-1.5 p-1 hover:text-[#F4F0EB] transition-colors"
              title="Exit / Switch Role"
            >
              <span>Switch Role</span>
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
              onClick={toggleTheme}
              className="p-1.5 text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#191715] rounded-lg transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-[#F5A23A]" />}
            </button>

            {/* Command HQ User Profile with Sign Out Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 pl-1 py-1 pr-1.5 rounded-lg hover:bg-[#191715] transition-colors cursor-pointer group focus:outline-none"
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
              >
                <div className="w-6 h-6 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-[11px] font-bold">
                  C
                </div>
                <span className="text-xs font-semibold text-[#F4F0EB]">Command HQ</span>
                <ChevronDown className={`h-3 w-3 text-[#AAA29A] group-hover:text-[#F4F0EB] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-36 rounded-xl bg-[#12110F] border border-[#38302A] shadow-2xl p-1 z-40 animate-in fade-in duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        navigate('/auth/select');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#ff6363] hover:bg-[#27211B] rounded-lg flex items-center gap-2 transition-colors cursor-pointer font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
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
