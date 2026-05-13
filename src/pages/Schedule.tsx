import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Calendar, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export function Schedule() {
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSchedule = async () => {
    try {
      const res = await api.getWeekSchedule();
      setScheduleItems(res || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.deleteSchedule(id);
      setScheduleItems(prev => prev.filter(item => item.id !== id));
      toast.success('Schedule entry removed.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete schedule entry.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Schedule</h2>
          <p className="text-slate-500 mt-1">Smart study slots planned for you.</p>
        </div>
        {scheduleItems.length > 0 && (
          <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">
            {scheduleItems.length} {scheduleItems.length === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      {scheduleItems.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-slate-900 font-bold mb-1">No Schedule Generated</h3>
          <p className="text-xs text-slate-500">
            Your AI schedule is empty. Try adding tasks or requesting a suggested schedule from the Dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduleItems.map((item, index) => (
            <div
              key={item.id || index}
              className={cn(
                "bg-white border text-left border-slate-100 shadow-sm rounded-xl p-4 flex gap-4 transition-all hover:shadow-md items-center relative overflow-hidden",
                deletingId === item.id && "opacity-50 pointer-events-none"
              )}
            >
              {item.status === 'missed'    && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />}
              {item.status === 'completed' && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}
              {item.status === 'scheduled' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />}

              <div className="flex flex-col items-center justify-center text-center shrink-0 w-16 px-2 border-r border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {item.start_time ? format(parseISO(item.start_time), 'EEE') : 'TBD'}
                </span>
                <span className="text-lg font-black text-slate-900 -mt-1">
                  {item.start_time ? format(parseISO(item.start_time), 'dd') : '—'}
                </span>
              </div>

              <div className="flex-1 min-w-0 py-1">
                <h4 className="font-black text-slate-900 truncate tracking-tight">
                  {item.task?.title || 'Study Block'}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <p className="text-xs text-slate-500 font-medium">
                    {item.start_time ? format(parseISO(item.start_time), 'h:mm a') : 'TBD'}
                    {item.end_time ? ` – ${format(parseISO(item.end_time), 'h:mm a')}` : ''}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 pr-1">
                {item.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {item.status === 'missed'    && <XCircle className="w-5 h-5 text-rose-500" />}
                {item.status === 'scheduled' && (
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase font-bold tracking-widest">
                    Scheduled
                  </span>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove from schedule"
                >
                  {deletingId === item.id
                    ? <div className="w-4 h-4 animate-spin border-2 border-rose-400 border-t-transparent rounded-full" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



