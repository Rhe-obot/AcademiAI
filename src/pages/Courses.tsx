import React, { useState } from 'react';
import { useAppStore } from '../store/AppProvider';
import { BookOpen, Plus, Book, Trash2, ChevronRight, Wand2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from 'sonner';

export function Courses() {
  const { courses, addCourse, removeCourse, user } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    
    addCourse({ code, name });
    setCode('');
    setName('');
    setShowAddForm(false);
  };

  const handleAutoFill = async () => {
    if (!user?.major) {
       toast.error("Please set your Major in your Profile first.");
       return;
    }
    setIsGenerating(true);
    try {
      const res = await api.suggestCourses({ major: user.major });
      if (res?.courses && res.courses.length > 0) {
         for (const c of res.courses) {
           // check if already added
           if (!courses.find(existing => existing.code === c.code)) {
             await addCourse({ code: c.code, name: c.name });
           }
         }
         toast.success("Courses successfully auto-populated!");
      } else {
         toast.error("Failed to generate courses. Please add manually.");
      }
    } catch (e) {
      console.error(e);
      toast.error("AI Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Courses</h2>
          <p className="text-slate-500 mt-1">Manage your academic load.</p>
        </div>
        {!showAddForm && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handleAutoFill}
              disabled={isGenerating}
              className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 p-2 sm:px-4 sm:py-2.5 rounded-xl shadow-sm transition flex-1 sm:flex-none items-center justify-center gap-2 font-bold uppercase text-[11px] tracking-wider border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              <span className="inline lg:inline">Auto-fill AI</span>
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white p-2 sm:px-4 sm:py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition flex-1 sm:flex-none flex items-center justify-center gap-2 font-bold uppercase text-[11px] tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span className="inline lg:inline">Add Course</span>
            </button>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white border text-left border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6 mb-8 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">New Course</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
          <form onSubmit={handleAddCourse} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Code</label>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CSC 101"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-bold uppercase"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Course Name</label>
                <div className="relative">
                  <Book className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Intro to Programming"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-sm active:scale-[0.98] transition-all"
              >
                Save Course
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Your Enrolled Courses</h3>
        {courses.length === 0 ? (
          <p className="text-slate-500 text-[10px] text-center p-4 bg-slate-50 font-bold uppercase rounded-2xl border border-slate-100">No courses listed yet. Add one above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.map((course) => (
              <div key={course.id} className="bg-white border border-slate-100 shadow-sm rounded-xl flex items-stretch transition-all hover:shadow-md relative overflow-hidden group">
                <Link to={`/courses/${course.id}`} className="flex-1 p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 group-hover:scale-105 transition-transform duration-300">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-black text-slate-900 truncate tracking-tight">{course.code}</h4>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{course.name}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 -ml-2 group-hover:text-indigo-500 transition-colors" />
                </Link>
                <div className="border-l border-slate-100 flex items-center justify-center bg-slate-50 group-hover:bg-rose-50 transition-colors w-12 shrink-0 z-10">
                   <button 
                     onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       removeCourse(course.id);
                     }}
                     className="w-full h-full flex items-center justify-center text-slate-300 group-hover:text-rose-500 transition-colors"
                     title="Remove Course"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
