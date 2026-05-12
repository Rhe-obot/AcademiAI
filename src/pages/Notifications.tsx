import React from 'react';
import { useAppStore } from '../store/AppProvider';
import { Bell, Trophy, AlertTriangle, Info, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { NotificationType } from '../types';

function getIconForType(type: NotificationType) {
  switch (type) {
    case 'reminder': return <Clock className="w-5 h-5 text-blue-500" />;
    case 'deadline_warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    case 'missed': return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case 'rescheduled': return <Clock className="w-5 h-5 text-slate-500" />;
    case 'achievement': return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 'streak': return <Trophy className="w-5 h-5 text-indigo-500" />;
    default: return <Info className="w-5 h-5 text-slate-500" />;
  }
}

function getBgForType(type: NotificationType) {
  switch (type) {
    case 'reminder': return 'bg-blue-50 border-blue-100';
    case 'deadline_warning': return 'bg-orange-50 border-orange-100';
    case 'missed': return 'bg-red-50 border-red-100';
    case 'rescheduled': return 'bg-slate-50 border-slate-100';
    case 'achievement': return 'bg-yellow-50 border-yellow-100';
    case 'streak': return 'bg-indigo-50 border-indigo-100';
    default: return 'bg-slate-50 border-slate-100';
  }
}

export function Notifications() {
  const { notifications, markNotificationRead } = useAppStore();

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Updates</h2>
        <p className="text-slate-500 mt-1">Insights from your academic assistant.</p>
      </div>

      {notifications.length === 0 ? (
        <div className="py-12 border-b border-t border-slate-100 text-center flex flex-col items-center">
          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mb-3">
             <Bell className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No new notifications</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {notifications.map((notif) => (
             <div 
              key={notif.id} 
              onClick={() => !notif.is_read && markNotificationRead(notif.id)}
              className={cn(
                "py-4 flex gap-4 transition-all relative border-b border-slate-100",
                !notif.is_read && "cursor-pointer bg-slate-50/30",
                notif.is_read && "opacity-60"
              )}
            >
              {!notif.is_read && (
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-8 bg-indigo-500 rounded-r-md" />
              )}
              
              <div className="shrink-0 pt-0.5">
                {getIconForType(notif.type as NotificationType)}
              </div>
              
              <div className="flex-1 pr-2">
                <p className={cn("text-sm text-slate-800 leading-snug font-medium", !notif.is_read && "font-bold text-slate-900")}>
                  {notif.message}
                </p>
                <div className="mt-1.5 font-bold uppercase text-[9px] text-slate-400 tracking-wider">
                  {formatDistanceToNow(parseISO(notif.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
