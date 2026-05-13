import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/AppProvider';
import { api } from '../lib/api';
import { 
  ArrowLeft, 
  BrainCircuit, 
  ListTodo, 
  FileText, 
  Wand2, 
  CheckCircle2, 
  Clock,
  Calendar as CalendarIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { CourseMaterial } from '../types';

export function MaterialDetails() {
  const { course_id, material_id } = useParams();
  const navigate = useNavigate();
  const { courses, tasks, addTask } = useAppStore();
  
  const [material, setMaterial] = useState<CourseMaterial | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'plan'>('notes');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const courseObj = courses.find(c => String(c.id) === course_id);
      if (!courseObj) {
        toast.error('Course not found');
        navigate('/courses');
        return;
      }
      setCourse(courseObj);

      // Fetch materials for this course
      try {
        const materials = await api.getCourseMaterials(Number(course_id));
        const mat = materials.find(m => String(m.id) === material_id);
        if (!mat) {
          toast.error('Material not found');
          navigate(`/courses/${course_id}`);
          return;
        }

        // Load cached notes/plan if available
        const cachedNotes = localStorage.getItem(`material_notes_${mat.id}`);
        const cachedPlan = localStorage.getItem(`material_plan_${mat.id}`);
        
        setMaterial({
          ...mat,
          generated_notes: mat.generated_notes || cachedNotes || undefined,
          study_plan: mat.study_plan || (cachedPlan ? JSON.parse(cachedPlan) : undefined)
        });
      } catch (e) {
        toast.error('Failed to load material');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [course_id, material_id, courses, navigate]);

  const handleGenerateNotes = async () => {
    if (!material?.extracted_text) return;
    setGeneratingNotes(true);
    try {
      const res = await api.generateCourseNotes({ 
        text: material.extracted_text, 
        major: localStorage.getItem('user_major') || undefined 
      });
      const notes = res?.notes || res;
      
      setMaterial(prev => prev ? { ...prev, generated_notes: notes } : null);
      localStorage.setItem(`material_notes_${material.id}`, notes);
      toast.success('Notes generated!');
    } catch (e: any) {
      toast.error('Failed to generate notes: ' + e.message);
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!material?.extracted_text) return;
    setGeneratingPlan(true);
    try {
      const res = await api.generateCourseStudyPlan({ text: material.extracted_text });
      const plan = res?.plan || res;
      
      setMaterial(prev => prev ? { ...prev, study_plan: plan } : null);
      localStorage.setItem(`material_plan_${material.id}`, JSON.stringify(plan));
      toast.success('Study plan generated!');
    } catch (e: any) {
      toast.error('Failed to generate plan: ' + e.message);
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!material || !course) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(`/courses/${course_id}`)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{material.title}</h2>
          <p className="text-slate-500 text-sm">{course.code} • {course.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            <button 
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'notes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <BrainCircuit className="w-4 h-4" />
              Notes
            </button>
            <button 
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'plan' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ListTodo className="w-4 h-4" />
              Study Plan
            </button>
          </div>

          {activeTab === 'notes' ? (
            /* Notes Section */
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-500" />
                  Study Notes
                </h3>
                {!material.generated_notes && (
                  <button 
                    onClick={handleGenerateNotes}
                    disabled={generatingNotes}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {generatingNotes ? <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" /> : <Wand2 className="w-4 h-4" />}
                    {generatingNotes ? 'Thinking...' : 'Generate with AI'}
                  </button>
                )}
              </div>

              {material.generated_notes ? (
                <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-900">
                  <ReactMarkdown>{material.generated_notes}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No notes generated yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Use the AI button above to create personalized study notes.</p>
                </div>
              )}
            </div>
          ) : (
            /* Study Plan Section */
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-emerald-500" />
                  Step-by-Step Plan
                </h3>
                {!material.study_plan && (
                  <button 
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {generatingPlan ? <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" /> : <Wand2 className="w-4 h-4" />}
                    {generatingPlan ? 'Planning...' : 'Create Study Plan'}
                  </button>
                )}
              </div>

              {material.study_plan ? (
                <div className="space-y-4">
                  {(material.study_plan as any[]).map((step, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {step.step || idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-1">{step.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                        <button 
                          onClick={async () => {
                            try {
                              const today = new Date().toISOString().split('T')[0];
                              await addTask({
                                title: `Study: ${step.title}`,
                                course_id: Number(course_id),
                                course: course,
                                deadline: today,
                                scheduled_start: new Date(`${today}T09:00:00`).toISOString(),
                                scheduled_end: new Date(`${today}T10:00:00`).toISOString(),
                                type: 'study',
                                status: 'pending'
                              });
                              toast.success('Task added to agenda!');
                            } catch (e) {
                              toast.error('Failed to add task');
                            }
                          }}
                          className="mt-3 text-xs font-bold text-emerald-600 bg-white border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          + Add to Tasks
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No study plan generated yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-xl shadow-indigo-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl"></div>
            <h4 className="text-lg font-bold mb-4 relative z-10">Material Stats</h4>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center text-indigo-100 text-sm">
                <span>Notes Status</span>
                {material.generated_notes ? (
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Ready</span>
                ) : (
                  <span className="bg-white/10 text-white/60 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Pending</span>
                )}
              </div>
              <div className="flex justify-between items-center text-indigo-100 text-sm">
                <span>Plan Status</span>
                {material.study_plan ? (
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Ready</span>
                ) : (
                  <span className="bg-white/10 text-white/60 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Pending</span>
                )}
              </div>
              <div className="pt-4 border-t border-indigo-800">
                <p className="text-indigo-200 text-xs italic">
                  Tip: Use AI generated plans to fill your daily schedule and earn more points!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
