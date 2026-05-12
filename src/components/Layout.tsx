import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Calendar, LayoutList, User, Bell, BookOpen, Clock, Trophy } from 'lucide-react';
import { useAppStore } from '../store/AppProvider';

export function Layout() {
  const { notifications } = useAppStore();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 pb-16 lg:pb-0 lg:pl-64 text-slate-900">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white fixed inset-y-0 left-0 z-50">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <span className="bg-indigo-600 text-white rounded-lg p-1.5 shrink-0">
              <Calendar className="w-5 h-5" />
            </span>
            AcademiAI
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem to="/" icon={<Home className="w-5 h-5" />} label="Dashboard" />
          <NavItem to="/schedule" icon={<Clock className="w-5 h-5" />} label="Schedule" />
          <NavItem to="/courses" icon={<BookOpen className="w-5 h-5" />} label="Courses" />
          <NavItem to="/tasks" icon={<LayoutList className="w-5 h-5" />} label="Tasks" />
          <NavItem to="/leaderboard" icon={<Trophy className="w-5 h-5" />} label="Leaderboard" />
          <NavItem to="/notifications" icon={<Bell className="w-5 h-5" />} label="Notifications" badge={unreadCount} />
          <NavItem to="/profile" icon={<User className="w-5 h-5" />} label="Profile" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-lg mx-auto lg:max-w-4xl p-4 sm:p-6 lg:p-8">
        <header className="flex lg:hidden items-center justify-between mb-6 pt-2">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
             <span className="bg-indigo-600 text-white rounded-md p-1 shrink-0">
              <Calendar className="w-4 h-4" />
            </span>
            AcademiAI
          </h1>
          {/* Top right mobile actions could go here */}
        </header>

        <Outlet />
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-16 flex justify-around items-center px-2 z-50 pb-safe overflow-x-auto">
        <MobileNavItem to="/" icon={<Home className="w-5 h-5 rounded-md" />} label="Home" />
        <MobileNavItem to="/schedule" icon={<Clock className="w-5 h-5 rounded-md" />} label="Schedule" />
        <MobileNavItem to="/courses" icon={<BookOpen className="w-5 h-5 rounded-md" />} label="Courses" />
        <MobileNavItem to="/tasks" icon={<LayoutList className="w-5 h-5 rounded-md" />} label="Tasks" />
        <MobileNavItem to="/leaderboard" icon={<Trophy className="w-5 h-5 rounded-md" />} label="Rank" />
        <MobileNavItem to="/profile" icon={<User className="w-5 h-5 rounded-md" />} label="Me" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, badge }: { to: string, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <NavLink 
      to={to} 
      className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors relative ${isActive ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      {icon}
      {label}
      {badge ? (
        <span className="absolute right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

function MobileNavItem({ to, icon, label, badge }: { to: string, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <NavLink 
      to={to} 
      className={({isActive}) => `flex flex-col items-center space-y-1 w-full h-full justify-center transition-opacity ${isActive ? 'text-indigo-600' : 'opacity-30 text-slate-600'}`}
    >
      <div className="relative">
        {icon}
        {badge ? (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
            {badge}
          </span>
        ) : null}
      </div>
      <span className="text-[9px] font-bold uppercase">{label}</span>
    </NavLink>
  );
}
