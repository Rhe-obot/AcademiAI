import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Medal, Trophy, Code } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/AppProvider';

export function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppStore();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Rankings...</div>;
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Leaderboard</h2>
        <Trophy className="w-6 h-6 text-yellow-500" />
      </div>
      <p className="text-slate-500 text-sm">See how you rank among your peers in points & tasks completed.</p>

      <div className="space-y-3 mt-6">
        {leaders.map((leader, idx) => {
          const isCurrentUser = user?.id === leader.id;
          let RankIcon = null;
          let rankColor = "text-slate-400";
          if (idx === 0) {
            RankIcon = Medal;
            rankColor = "text-yellow-500";
          } else if (idx === 1) {
             RankIcon = Medal;
             rankColor = "text-slate-400";
          } else if (idx === 2) {
             RankIcon = Medal;
             rankColor = "text-amber-700";
          }
          return (
            <div 
              key={leader.id} 
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all shadow-sm",
                isCurrentUser ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20" : "bg-white border-slate-100"
              )}
            >
              <div className={cn("w-8 text-center font-black text-xl", rankColor)}>
                #{idx + 1}
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                {RankIcon ? <RankIcon className={cn("w-5 h-5", rankColor)} /> : <Code className="w-4 h-4 text-slate-300" />}
              </div>
              <div className="flex-1">
                <h4 className={cn("font-bold text-sm", isCurrentUser ? "text-indigo-900" : "text-slate-900")}>
                  {leader.name || 'Anonymous'}
                  {isCurrentUser && <span className="ml-2 text-[9px] px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded-md uppercase tracking-wider font-bold">You</span>}
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Rank: {leader.level_name || leader.rank || 'Bronze'}</p>
              </div>
              <div className="text-right">
                <div className="font-black text-indigo-600 text-lg">{leader.points || 0}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">XP</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
