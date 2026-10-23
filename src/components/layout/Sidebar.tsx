import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ShieldCheck, 
  Map as MapIcon, 
  Users, 
  Package, 
  Bell, 
  BarChart2, 
  Settings,
  Clock,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { MockAPI } from '../../services/mockApi';
import { VajraGridLogo } from '../brand/VajraGridLogo';

const navItems = [
  { name: 'Live Map', path: '/admin/map', icon: MapIcon },
  { name: 'Incidents', path: '/admin/incidents', icon: FileText },
  { name: 'Proactive Monitoring', path: '/admin/monitoring', icon: ShieldCheck },
  { name: 'Volunteers', path: '/admin/volunteers', icon: Users },
  { name: 'Resources', path: '/admin/resources', icon: Package },
  { name: 'Coordination', path: '/admin/coordination', icon: ShieldAlert },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell, hasBadge: true },
  { name: 'Reports', path: '/admin/reports', icon: BarChart2 },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      const notifs = await MockAPI.getNotifications();
      setUnreadCount(notifs.filter(n => !n.read).length);
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen w-72 flex-col border-r border-slate-200 bg-slate-50 font-sans">
      {/* Logo Area */}
      <div className="flex h-20 items-center justify-between px-6 pt-2">
        <div className="flex items-center gap-3">
          <VajraGridLogo variant="icon" height={36} className="shrink-0" />
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-[#00327d] leading-tight">Vajra<span className="text-[#0047ab]">Grid</span></span>
            <span className="text-sm font-medium text-slate-500 mt-0.5">Authority Portal</span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1.5 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex w-full items-center justify-between" onClick={onClose}>
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 1.5} />
                    {item.name}
                  </div>
                  {item.hasBadge && unreadCount > 0 && (
                    <span className={cn(
                      "flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full text-[10px] font-bold",
                      "bg-red-500 text-white shadow-sm"
                    )}>
                      {unreadCount}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Status & Bottom Actions */}
      <div className="border-t border-slate-200 p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm border border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-bold text-slate-900">System Status</span>
            </div>
            <p className="text-xs font-medium text-emerald-600 pl-4">All Systems Operational</p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Last Updated</span>
            </div>
            <p className="text-xs font-medium text-slate-900 pl-5">Just now</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );
}
