import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/AppProvider';
import { Calendar, User, Mail, Lock, BookOpen, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { isSupabaseConfigured } from '../lib/supabase';

export function Login() {
  const { login, signup } = useAppStore();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [major, setMajor] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [configMissing, setConfigMissing] = useState(false);

  useEffect(() => {
    setConfigMissing(!isSupabaseConfigured());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (configMissing) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Secrets.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        await signup(name, email, password, major);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-white py-12 px-8 shadow-sm border border-slate-100 sm:rounded-3xl text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-emerald-100 text-emerald-600 rounded-full p-4">
                <Mail className="w-12 h-12" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Check your email!</h2>
            <p className="text-slate-500 mb-8 font-medium">
              We've sent a verification link to <span className="font-bold text-slate-900">{email}</span>. 
              Please click the link to confirm your account.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setSuccess(false);
                  setIsLogin(true);
                }}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors"
              >
                Return to Sign In
              </button>
              <p className="text-xs text-slate-400">
                Didn't receive the email? Check your spam folder or wait a few minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-center">
          <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-lg shadow-indigo-200">
            <Calendar className="w-12 h-12" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          Welcome to AcademiAI
        </h2>
        <p className="mt-2 text-center text-sm font-bold text-slate-500 uppercase tracking-widest">
          Your Intelligent Academic Assistant
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {configMissing && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Supabase Connection Required</h4>
              <p className="text-xs text-amber-700 mt-1">
                Please set your Supabase URL and Anon Key in the <b>Secrets</b> panel (under Settings) to enable login and database features.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white py-8 px-4 shadow-sm border border-slate-100 sm:rounded-3xl sm:px-10">
          
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
            <button 
              type="button"
              disabled={configMissing}
              className={cn("flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors", isLogin ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700", configMissing && "opacity-50 cursor-not-allowed")}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button 
              type="button"
              disabled={configMissing}
              className={cn("flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors", !isLogin ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700", configMissing && "opacity-50 cursor-not-allowed")}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3 rounded-xl mb-4 text-center">
                {error}
              </div>
            )}
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium transition-colors"
                  placeholder="student@university.edu"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Course of Study / Major
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium transition-colors"
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In to Start' : 'Create Account')}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}
