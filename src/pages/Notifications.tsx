import React from 'react';
import { useAppStore } from '../store/AppProvider';
import { Bell, Trophy, AlertTriangle, Info, Clock, CheckCircle2, Trash2 } from 'lucide-react';
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
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useAppStore();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Updates</h2>
          <p className="text-slate-500 mt-1">Insights from your academic assistant.</p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllNotificationsRead}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <button 
              onClick={() => confirm('Clear all notifications?') && clearAllNotifications()}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-20 bg-white border border-slate-100 rounded-3xl text-center flex flex-col items-center shadow-sm">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
             <Bell className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-slate-900 font-bold text-lg">All caught up!</h3>
          <p className="text-slate-500 text-sm mt-1">No new notifications to show right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
             <div 
              key={notif.id} 
              className={cn(
                "p-5 flex gap-4 transition-all relative group rounded-2xl border border-slate-100 shadow-sm",
                !notif.is_read ? "bg-indigo-50/30" : "bg-white"
              )}
            >
              {!notif.is_read && (
                <div className="absolute top-4 left-0 bottom-4 w-1 bg-indigo-500 rounded-r-full" />
              )}
              
              <div className="shrink-0">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border", getBgForType(notif.type as NotificationType))}>
                  {getIconForType(notif.type as NotificationType)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 pr-8">
                <p className={cn("text-sm text-slate-800 leading-relaxed", !notif.is_read ? "font-bold text-slate-900" : "text-slate-600")}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold uppercase text-[9px] text-slate-400 tracking-wider">
                    {formatDistanceToNow(parseISO(notif.created_at), { addSuffix: true })}
                  </span>
                  {!notif.is_read && (
                    <button 
                      onClick={() => markNotificationRead(notif.id)}
                      className="text-[9px] font-black uppercase text-indigo-600 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>

              <button 
                onClick={() => deleteNotification(notif.id)}
                className="absolute right-4 top-5 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
