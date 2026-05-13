import React, { useState } from 'react';
import { useAppStore } from '../store/AppProvider';
import { Plus, Notebook, Clock, Calendar as CalendarIcon, CheckCircle2, ChevronDown, Circle, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function Tasks() {
  const { tasks, courses, addTask, updateTask, deleteTask, completeTask } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [deadline, setDeadline] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const pendingTasks = tasks.filter(t => t.status === 'pending').sort((a, b) => {
    // Primary: priority_score descending (higher = more urgent)
    const aScore = (a as any).priority_score ?? 0.5;
    const bScore = (b as any).priority_score ?? 0.5;
    if (Math.abs(bScore - aScore) > 0.05) return bScore - aScore;
    // Secondary: deadline ascending
    if (!a.deadline || !b.deadline) return 0;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !course || !deadline) return;
    
    // Add time component to deadline if it's just a date
    const finalDeadline = deadline.includes('T') ? new Date(deadline).toISOString() : new Date(`${deadline}T23:59:59`).toISOString();
    
    // Calculate scheduled_start and scheduled_end based on deadline date and pickers
    const scheduledStart = new Date(`${deadline}T${startTime}:00`).toISOString();
    const scheduledEnd = new Date(`${deadline}T${endTime}:00`).toISOString();
    
    // Convert course ID back from select
    const courseObj = courses.find(c => c.code === course);
    
    if (editingTaskId) {
      updateTask(editingTaskId, {
        title,
        course_id: courseObj?.id || 0,
        deadline: finalDeadline,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
      });
      setEditingTaskId(null);
    } else {
      addTask({
        title,
        course_id: courseObj?.id || 0,
        course: courseObj || null,
        deadline: finalDeadline,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        type: 'assignment'
      });
    }
    
    setTitle('');
    setCourse('');
    setDeadline('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h2>
          <p className="text-slate-500 mt-1">Your academic agenda.</p>
        </div>
        {!showAddForm && (
          <button 
            onClick={() => {
               setEditingTaskId(null);
                setTitle('');
                setCourse('');
                setDeadline('');
                setStartTime('09:00');
                setEndTime('10:00');
                setShowAddForm(true);
            }}
            className="bg-indigo-600 text-white p-2 sm:px-4 sm:py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Add Task</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white border text-left border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6 mb-8 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">{editingTaskId ? 'Edit Task' : 'New Task'}</h3>
            <button onClick={() => {
              setShowAddForm(false);
              setEditingTaskId(null);
            }} className="text-slate-400 hover:text-slate-600 p-1">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
          <form onSubmit={handleSaveTask} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Task Title</label>
              <div className="relative">
                <Notebook className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read Chapter 4"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Course</label>
                {courses.length > 0 ? (
                  <select 
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm appearance-none font-medium"
                    required
                  >
                    <option value="" disabled>Select a Course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. CSC 452 (Add courses in Library)"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                    required
                  />
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">From Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-medium"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">To Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="time" 
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-medium"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Deadline</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="date" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium shadow-sm active:scale-[0.98] transition-all"
              >
                {editingTaskId ? 'Save Changes' : 'Let AI Schedule It'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Pending Tasks</h3>
        {pendingTasks.length === 0 ? (
          <p className="text-slate-500 text-[10px] text-center p-4 bg-slate-50 font-bold uppercase rounded-2xl border border-slate-100">No pending tasks. You're all caught up!</p>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="bg-white border border-slate-100 shadow-sm rounded-xl p-3 flex gap-4 transition-all hover:shadow-md group">
                  <button 
                  onClick={() => completeTask(task.id)}
                  title="Mark as Complete"
                  className="mt-1 shrink-0 text-slate-200 group-hover:text-emerald-500 hover:!text-emerald-600 hover:bg-emerald-50 p-0.5 rounded-full transition-colors focus:outline-none"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{task.title}</h4>
                   <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      {task.course?.code || 'General'}
                    </span>
                    {(() => {
                      const score = (task as any).priority_score ?? 0.5;
                      if (score >= 0.8) return <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-[4px] font-bold">🔥 HIGH</span>;
                      if (score >= 0.6) return <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-[4px] font-bold">⚡ MED</span>;
                      return null;
                    })()}
                    <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-[4px] font-bold inline-flex items-center gap-1">
                      TIME: {task.scheduled_start ? format(parseISO(task.scheduled_start), 'HH:mm') : '00:00'} - {task.scheduled_end ? format(parseISO(task.scheduled_end), 'HH:mm') : '00:00'}
                    </span>
                    <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-[4px] font-bold inline-flex items-center gap-1">
                      ON: {task.scheduled_start ? format(parseISO(task.scheduled_start), 'MMM d') : 'TBD'}
                    </span>
                    <span className="text-[9px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-[4px] font-bold inline-flex items-center gap-1">
                      DUE: {task.deadline ? format(parseISO(task.deadline), 'MMM d') : 'No deadline'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => {
                     setEditingTaskId(task.id);
                     setTitle(task.title);
                     setCourse(task.course?.code || '');
                     setDeadline(task.deadline ? task.deadline.split('T')[0] : '');
                     if (task.scheduled_start) setStartTime(format(parseISO(task.scheduled_start), 'HH:mm'));
                     if (task.scheduled_end) setEndTime(format(parseISO(task.scheduled_end), 'HH:mm'));
                     setShowAddForm(true);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit Task">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => {
                     if (confirm("Delete this task?")) deleteTask(task.id);
                  }} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete Task">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

       <div className="mt-8">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center justify-between">
          Completed
          <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-[9px]">{completedTasks.length}</span>
        </h3>
        {completedTasks.length > 0 && (
          <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
            {completedTasks.map((task) => (
              <div key={task.id} className="bg-white/50 border border-slate-100 rounded-xl p-3 flex gap-3 items-center">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-600 truncate text-xs line-through decoration-slate-300">{task.title}</h4>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400">{task.course?.code || 'General'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
