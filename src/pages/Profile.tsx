import React, { useState } from 'react';
import { useAppStore } from '../store/AppProvider';
import { LogOut, Trophy, Target, Flame, Star, Shield, Award, Hexagon, Settings, X, Save, Bell } from 'lucide-react';
import { Rank } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const RANKS = [
  { name: 'Bronze', threshold: 0, icon: Star, color: 'text-orange-700 font-bold', bg: 'bg-orange-100', border: 'border-orange-200', textAccent: 'text-orange-900', ring: 'ring-orange-500/20' },
  { name: 'Silver', threshold: 100, icon: Shield, color: 'text-slate-500 font-bold', bg: 'bg-slate-100', border: 'border-slate-200', textAccent: 'text-slate-700', ring: 'ring-slate-500/20' },
  { name: 'Gold', threshold: 300, icon: Award, color: 'text-yellow-600 font-bold', bg: 'bg-yellow-100', border: 'border-yellow-200', textAccent: 'text-yellow-900', ring: 'ring-yellow-500/20' },
  { name: 'Platinum', threshold: 600, icon: Target, color: 'text-cyan-600 font-bold', bg: 'bg-cyan-100', border: 'border-cyan-200', textAccent: 'text-cyan-900', ring: 'ring-cyan-500/20' },
  { name: 'Diamond', threshold: 1000, icon: Hexagon, color: 'text-indigo-600 font-bold', bg: 'bg-indigo-100', border: 'border-indigo-200', textAccent: 'text-indigo-900', ring: 'ring-indigo-500/20' },
  { name: 'Master', threshold: 1500, icon: Trophy, color: 'text-purple-600 font-bold', bg: 'bg-purple-100', border: 'border-purple-200', textAccent: 'text-purple-900', ring: 'ring-purple-500/20' },
  { name: 'Grandmaster', threshold: 2000, icon: Flame, color: 'text-rose-600 font-bold', bg: 'bg-rose-100', border: 'border-rose-200', textAccent: 'text-rose-900', ring: 'ring-rose-500/20' },
] as const;

export function Profile() {
  const { user, logout, updateProfile } = useAppStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editMajor, setEditMajor] = useState('');

  if (!user) return null;

  const currentRankIndex = RANKS.findIndex(r => r.name === (user.rank || user.level_name || 'Bronze'));
  const currentRankInfo = RANKS[Math.max(0, currentRankIndex)];
  const nextRankInfo = RANKS[currentRankIndex + 1];
  
  const RankIcon = currentRankInfo.icon;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditOpen = () => {
    setEditName(user.name);
    setEditUsername(user.username || '');
    setEditMajor(user.major || '');
    setIsEditing(true);
  };

  const handleRequestNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
         alert("Notifications enabled successfully!");
      } else {
         alert("Notifications permission denied or ignored.");
      }
    } else {
      alert("This browser does not support desktop notifications.");
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName,
      username: editUsername,
      major: editMajor,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
            <p className="text-slate-500 mt-1">Update your personal details.</p>
          </div>
          <button onClick={() => setIsEditing(false)} className="bg-slate-100 text-slate-500 p-2 rounded-full hover:bg-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="bg-white border text-left border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-semibold text-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Username</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-100 bg-slate-50 text-slate-400 font-bold text-sm">
                @
              </span>
              <input 
                type="text" 
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="flex-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-r-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-semibold text-slate-900"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Major / Course of Study</label>
            <input 
              type="text" 
              value={editMajor}
              onChange={(e) => setEditMajor(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-semibold text-slate-900"
              required
            />
          </div>

          <div className="pt-4">
            <button 
              type="button"
              onClick={handleRequestNotifications}
              className="w-full flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 mb-2 py-3 rounded-xl font-bold uppercase text-[11px] tracking-wider transition-all"
            >
              <Bell className="w-4 h-4" />
              Enable Push Notifications
            </button>
            <button 
              type="submit"
              className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-sm active:scale-[0.98] transition-all"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Profile</h2>
        <button 
          onClick={handleEditOpen}
          className="bg-white text-slate-500 border border-slate-200 p-2 sm:px-4 sm:py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2"
        >
          <Settings className="w-5 h-5" />
          <span className="hidden sm:inline font-bold uppercase text-[10px] tracking-widest">Settings</span>
        </button>
      </div>

       {/* Main Player Card */}
      <div className={cn("rounded-3xl p-6 border shadow-sm flex flex-col items-center text-center relative overflow-hidden", currentRankInfo.bg, currentRankInfo.border)}>
        {/* Subtle background flair */}
        <div className={cn("absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full opacity-20", currentRankInfo.color.replace('text-', 'bg-').split(' ')[0])}></div>
        <div className={cn("absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full opacity-20", currentRankInfo.color.replace('text-', 'bg-').split(' ')[0])}></div>
        
        <div className="relative border-4 border-white shadow-sm w-20 h-20 bg-white rounded-2xl flex items-center justify-center transform rotate-3 mb-4">
          <RankIcon className={cn("w-10 h-10", currentRankInfo.color)} />
        </div>
        
        <h3 className={cn("text-2xl font-black mb-0", currentRankInfo.textAccent)}>{user.name || 'User'}</h3>
        <p className={cn("text-xs font-bold uppercase tracking-widest mb-3 opacity-60", currentRankInfo.textAccent)}>@{user.username || 'user'} {user.major ? `• ${user.major}` : ''}</p>

        <span className={cn("uppercase tracking-widest text-[10px] font-bold px-3 py-1 rounded-full bg-white/80 mb-5 shadow-sm", currentRankInfo.color)}>
          {user.rank || user.level_name || 'Bronze'}
        </span>

        {nextRankInfo ? (
          <div className="w-full max-w-xs mt-2 relative z-10">
            <div className={cn("flex justify-between text-[10px] font-bold uppercase mb-2", currentRankInfo.textAccent)}>
              <span>{user?.points || 0} XP</span>
              <span className="opacity-60">{nextRankInfo.threshold} XP</span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-2 shadow-inner overflow-hidden border border-white/40">
               <div 
                  className={cn("h-2 rounded-full transition-all duration-1000", currentRankInfo.border.replace('border-', 'bg-'))} 
                  style={{ width: `${Math.min(100, Math.max(0, (((user?.points || 0) - currentRankInfo.threshold) / (nextRankInfo.threshold - currentRankInfo.threshold)) * 100))}%` }}
                ></div>
            </div>
            <p className={cn("text-[10px] mt-2 font-bold uppercase", currentRankInfo.textAccent)}>
              <span className="opacity-70">{nextRankInfo.threshold - (user?.points || 0)} points to {nextRankInfo.name}</span>
            </p>
          </div>
        ) : (
          <div className={cn("w-full max-w-xs mt-2 text-sm font-bold uppercase tracking-wider", currentRankInfo.textAccent)}>
             Maximum Rank Achieved!
          </div>
        )}
      </div>

       {/* All Ranks Path */}
      <div className="mt-8">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Progression Path</h3>
        <div className="space-y-3">
          {RANKS.map((rank, idx) => {
            const isUnlocked = (user?.points || 0) >= rank.threshold;
            const currentRankStr = user.rank || user.level_name || 'Bronze';
            const isCurrent = currentRankStr === rank.name;
            const Icon = rank.icon;
            
            return (
              <div 
                key={rank.name} 
                className={cn(
                  "flex items-center gap-4 p-3 rounded-2xl border transition-all shadow-sm",
                  isCurrent ? cn("bg-white border-2 ring-4", rank.border, rank.ring) : 
                  isUnlocked ? cn("bg-slate-50", rank.border) : "bg-slate-50/50 border-slate-100 opacity-50 grayscale"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-white shadow-sm", isUnlocked ? rank.border : "border-slate-200")}>
                  <Icon className={cn("w-5 h-5", isUnlocked ? rank.color : "text-slate-400")} />
                </div>
                <div className="flex-1">
                  <h4 className={cn("font-bold text-sm", isCurrent ? rank.textAccent : "text-slate-700")}>
                    {rank.name}
                    {isCurrent && <span className={cn("ml-2 text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider font-bold", rank.bg, rank.textAccent)}>Current</span>}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{rank.threshold} XP</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100">
         <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-rose-100 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors font-bold text-xs uppercase tracking-wider"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>

    </div>
  );
}
