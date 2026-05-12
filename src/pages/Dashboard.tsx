import React, { useState } from 'react';
import { useAppStore } from '../store/AppProvider';
import { Trophy, Flame, Target, CheckCircle2, Circle, AlertCircle, Wand2, Frown, Meh, Smile, SmilePlus, Battery, BatteryFull, BatteryMedium, BatteryLow, Clock } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { Star, Shield, Award, Hexagon, Flame as FlameIcon } from 'lucide-react';
import { api } from '../lib/api';

const RANKS = [
  { name: 'Bronze', threshold: 0, icon: Star, color: 'text-orange-700 font-bold', bg: 'bg-orange-100', border: 'border-orange-200', textAccent: 'text-orange-900', ring: 'ring-orange-500/20' },
  { name: 'Silver', threshold: 100, icon: Shield, color: 'text-slate-500 font-bold', bg: 'bg-slate-100', border: 'border-slate-200', textAccent: 'text-slate-700', ring: 'ring-slate-500/20' },
  { name: 'Gold', threshold: 300, icon: Award, color: 'text-yellow-600 font-bold', bg: 'bg-yellow-100', border: 'border-yellow-200', textAccent: 'text-yellow-900', ring: 'ring-yellow-500/20' },
  { name: 'Platinum', threshold: 600, icon: Target, color: 'text-cyan-600 font-bold', bg: 'bg-cyan-100', border: 'border-cyan-200', textAccent: 'text-cyan-900', ring: 'ring-cyan-500/20' },
  { name: 'Diamond', threshold: 1000, icon: Hexagon, color: 'text-indigo-600 font-bold', bg: 'bg-indigo-100', border: 'border-indigo-200', textAccent: 'text-indigo-900', ring: 'ring-indigo-500/20' },
  { name: 'Master', threshold: 1500, icon: Trophy, color: 'text-purple-600 font-bold', bg: 'bg-purple-100', border: 'border-purple-200', textAccent: 'text-purple-900', ring: 'ring-purple-500/20' },
  { name: 'Grandmaster', threshold: 2000, icon: FlameIcon, color: 'text-rose-600 font-bold', bg: 'bg-rose-100', border: 'border-rose-200', textAccent: 'text-rose-900', ring: 'ring-rose-500/20' },
] as const;

export function Dashboard() {
  const { user, tasks, completeTask } = useAppStore();
  const [moodSaved, setMoodSaved] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  if (!user) return null;

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  
  // Tasks to do today based on 'scheduled_start'
  const todayTasks = pendingTasks.filter(t => t.scheduled_start && isToday(parseISO(t.scheduled_start)));
  
  // Next upcoming tasks that aren't today
  const upcomingTasks = pendingTasks.filter(t => t.scheduled_start && !isToday(parseISO(t.scheduled_start))).slice(0, 3);
  
  const featuredTask = todayTasks[0];

  const currentRankInfo = RANKS.find(r => r.name === user.rank) || RANKS[0];

  const handleRecordMood = async (mood_level: number, energy_level: number) => {
    try {
      await api.recordMood({ mood_level, energy_level, notes: 'Quick check-in via dashboard' });
      setMoodSaved(true);
      setTimeout(() => setMoodSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSuggestSchedule = async () => {
    setSuggesting(true);
    try {
      const res = await api.suggestSchedule();
      alert(`AI Suggestion: \n\n${res.data}`);
    } catch (e) {
      alert("Failed to get suggestion.");
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-300">
      {/* Header / Profile Section */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center space-x-3">
          <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold uppercase shrink-0", currentRankInfo.bg, currentRankInfo.color.split(' ')[0], currentRankInfo.border)}>
             {(user?.name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">{user.name}</h2>
            <p className={cn("text-[9px] uppercase tracking-widest font-black", currentRankInfo.color.split(' ')[0])}>{user.rank} {user.major ? `• ${user.major}` : ''}</p>
          </div>
        </div>
        <div className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
          {user.streak} Day Streak <Flame className="w-3 h-3" />
        </div>
      </div>

      {/* Mood Tracker */}
      <div className="bg-white border text-center border-slate-100 p-4 rounded-2xl shadow-sm">
        {moodSaved ? (
          <div className="flex flex-col items-center justify-center py-2 text-emerald-600">
            <CheckCircle2 className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Mood Registered</span>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Quick Check-in</p>
            <div className="flex justify-center gap-2 sm:gap-4">
              <button onClick={() => handleRecordMood(1, 1)} className="p-2 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:scale-105 transition-all text-slate-400 hover:text-rose-500 group flex flex-col items-center">
                 <Frown className="w-5 h-5 mb-1" />
                 <span className="text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Low</span>
              </button>
              <button onClick={() => handleRecordMood(3, 3)} className="p-2 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:scale-105 transition-all text-slate-400 hover:text-amber-500 group flex flex-col items-center">
                 <Meh className="w-5 h-5 mb-1" />
                 <span className="text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Okay</span>
              </button>
              <button onClick={() => handleRecordMood(4, 4)} className="p-2 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:scale-105 transition-all text-slate-400 hover:text-emerald-500 group flex flex-col items-center">
                 <Smile className="w-5 h-5 mb-1" />
                 <span className="text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Good</span>
              </button>
              <button onClick={() => handleRecordMood(5, 5)} className="p-2 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:scale-105 transition-all text-slate-400 hover:text-indigo-500 group flex flex-col items-center">
                 <SmilePlus className="w-5 h-5 mb-1" />
                 <span className="text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Great</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between items-center px-1">
         <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Your Dashboard</h4>
         <button 
           onClick={handleSuggestSchedule}
           disabled={suggesting}
           className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
           {suggesting ? <div className="w-3 h-3 animate-spin border-2 border-indigo-600 border-t-transparent rounded-full" /> : <Wand2 className="w-3 h-3" />}
           Suggest Schedule
         </button>
      </div>

      {/* Main Smart Action Bento Section */}
      {featuredTask ? (
        <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] bg-indigo-500/50 px-2 py-1 rounded-md font-bold shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" /> SMART SCHEDULER
            </span>
            <span className="text-[10px] opacity-80 shrink-0">Active Now</span>
          </div>
          <h3 className="text-lg font-bold leading-tight">{featuredTask.title}</h3>
          <p className="text-xs text-indigo-100 mt-1 opacity-90">AI recommends finishing your {featuredTask.course?.code || 'task'} work today to maintain your evening free-time.</p>
          <button 
            onClick={() => completeTask(featuredTask.id)}
            className="mt-4 w-full bg-white text-indigo-600 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50 transition-colors shadow-sm"
          >
            Mark as Completed
          </button>
        </div>
      ) : (
        <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 flex flex-col items-center text-center">
           <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
             <CheckCircle2 className="w-6 h-6 text-white" />
           </div>
           <h3 className="text-lg font-bold leading-tight">All Caught Up!</h3>
           <p className="text-xs text-indigo-100 mt-1 opacity-90">Enjoy your free time or get ahead on upcoming tasks.</p>
        </div>
      )}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl relative overflow-hidden">
          <Trophy className="absolute -right-3 -bottom-3 w-16 h-16 text-slate-100 opacity-60 rotate-12" />
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 relative z-10">Points</p>
          <p className="text-xl font-black text-indigo-600 relative z-10">{user?.points || 0}</p>
          <p className="text-[9px] text-emerald-600 font-medium mt-1 relative z-10">Keep it up!</p>
        </div>
        <div className={cn("border p-4 rounded-2xl relative overflow-hidden", currentRankInfo.bg, currentRankInfo.border)}>
          <div className={cn("absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 rounded-full opacity-20", currentRankInfo.color.replace('text-', 'bg-').split(' ')[0])}></div>

          <p className={cn("text-[10px] font-bold uppercase mb-1 opacity-70", currentRankInfo.textAccent)}>Rank</p>
          <p className={cn("text-xl font-black", currentRankInfo.textAccent)}>{user.rank}</p>
          <div className={cn("w-full h-1 rounded-full mt-2 overflow-hidden border border-white/40", currentRankInfo.border.replace('border-', 'bg-').replace('200', '300'))}>
            <div className={cn("h-1 rounded-full transition-all duration-1000", currentRankInfo.color.replace('text-', 'bg-').split(' ')[0])} style={{ width: `${Math.min(100, ((user?.points || 0) % 100))}%` }}></div>
          </div>
        </div>
      </div>

      {/* Upcoming Tasks Layout Match */}
      {upcomingTasks.length > 0 && (
        <div className="mt-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Upcoming Schedule</h4>
          <div className="space-y-3">
            {upcomingTasks.map((task, i) => (
              <div key={task.id} className="flex items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                 <div className={`w-2 h-8 rounded-full mr-3 shrink-0 ${i === 0 ? 'bg-amber-400' : 'bg-slate-200'}`}></div>
                 <div className="flex-1 min-w-0">
                   <p className="text-xs font-bold text-slate-900 truncate">{task.title}</p>
                   <p className="text-[10px] text-slate-400 truncate">Scheduled: {task.scheduled_start ? format(parseISO(task.scheduled_start), 'EE, MMM do') : 'Not scheduled'}</p>
                 </div>
                 <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-slate-800">+20 XP</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rank Progress Overlay style Match */}
      <div className={cn("mt-4 p-4 rounded-2xl text-white flex items-center justify-between", currentRankInfo.border.replace('border-', 'bg-').replace('200', '900'))}>
        <div>
          <p className="text-[9px] font-bold uppercase opacity-60">Next Target</p>
          <p className="text-xs font-bold text-white">Maintain Streak</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold italic opacity-80">Consistency is key</p>
        </div>
      </div>
    </div>
  );
}

