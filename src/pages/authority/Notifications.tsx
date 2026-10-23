import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle, Users, Package, Settings, Check } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MockAPI } from '../../services/mockApi';
import { Notification } from '../../types';

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const data = await MockAPI.getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    await MockAPI.markNotificationRead(id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await MockAPI.markAllNotificationsRead();
    fetchNotifications();
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-[#F5A23A]" />;
      case 'incident': return <ShieldAlert className="h-4 w-4 text-[#E53946]" />;
      case 'verification': return <CheckCircle className="h-4 w-4 text-[#16B58A]" />;
      case 'volunteer': return <Users className="h-4 w-4 text-purple-400" />;
      case 'resource': return <Package className="h-4 w-4 text-[#F46B27]" />;
      default: return <Bell className="h-4 w-4 text-[#AAA29A]" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'bg-[#E53946]/20 text-[#ff727f] border-[#E53946]/40';
      case 'medium': return 'bg-[#F5A23A]/20 text-[#F5A23A] border-[#F5A23A]/40';
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default: return 'bg-[#27211B] text-[#AAA29A] border-[#38302A]';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">Broadcast Alerts & Notifications</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40">
              DISTRICT ADVISORY
            </span>
          </div>
          <p className="text-sm font-medium text-[#AAA29A]">Operational alerts, citizen warnings dispatch logs, and priority intelligence updates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleMarkAllRead} 
            className="h-9 font-semibold bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border-[#38302A] text-xs"
          >
            <Check className="h-4 w-4 mr-1.5 text-[#16B58A]" />
            Mark All as Read
          </Button>
          <Button 
            variant="outline" 
            className="h-9 font-semibold bg-[#27211B] hover:bg-[#342c24] text-[#AAA29A] hover:text-[#F4F0EB] border-[#38302A] px-3"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A23A]"></div>
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border border-[#38302A] bg-[#191715]">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-[#27211B] border border-[#38302A] p-4 mb-4">
              <Bell className="h-8 w-8 text-[#7C756E]" />
            </div>
            <h3 className="text-lg font-bold text-[#F4F0EB]">No Unread Broadcast Alerts</h3>
            <p className="text-xs text-[#AAA29A] max-w-sm mt-1">
              All advisory dispatches have been acknowledged. Live notifications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`overflow-hidden transition-all rounded-xl border ${
                !notif.read 
                  ? 'border-[#F5A23A]/50 bg-[#191715] shadow-sm' 
                  : 'border-[#26211C] bg-[#12110F] opacity-75'
              }`}
            >
              <div className="flex items-start gap-4 p-4">
                <div className="mt-0.5 shrink-0 bg-[#27211B] p-2 rounded-lg border border-[#38302A] shadow-xs">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(notif.priority)}`}>
                      {notif.priority} Priority
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#AAA29A] capitalize">{notif.type}</span>
                    <span className="text-[11px] font-mono text-[#7C756E] ml-auto whitespace-nowrap">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${!notif.read ? 'font-semibold text-[#F4F0EB]' : 'font-medium text-[#AAA29A]'}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleMarkRead(notif.id)}
                    className="shrink-0 h-8 text-xs font-semibold bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border-[#38302A]"
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
