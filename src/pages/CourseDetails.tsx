import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Upload, FileText, BrainCircuit, Wand2, ChevronRight, CheckCircle2, FileUp, ListTodo, FileType } from 'lucide-react';
import { cn } from '../lib/utils';
import { Course, CourseMaterial } from '../types';
import { useAppStore } from '../store/AppProvider';
import ReactMarkdown from 'react-markdown';

export function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialFile, setMaterialFile] = useState<File | null>(null);

  const [activeMaterial, setActiveMaterial] = useState<CourseMaterial | null>(null);

  const [syllabusText, setSyllabusText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const [studyPath, setStudyPath] = useState<any>(null);
  const [generatingPath, setGeneratingPath] = useState(false);

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCourseDetails();
    fetchMaterials();
  }, [id]);

  const fetchCourseDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getCourse(id);
      setCourse(res.data || res); // Depend on api structure
      
      // Auto fetch study path
      const pathRes = await api.getStudyPath(id).catch(() => null);
      if (pathRes && pathRes.data) {
        setStudyPath(pathRes.data);
      } else if (pathRes) {
        setStudyPath(pathRes);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    if (!id) return;
    try {
      const mats = await api.getCourseMaterials(id);
      setMaterials(mats);
    } catch (error) {
      console.error("Failed to load materials", error);
    }
  };

  const handleUploadMaterial = async () => {
    if (!materialFile || !id) return;
    setUploadingMaterial(true);
    try {
      // 1. Extract text
      const extractedText = await api.parsePdf(materialFile);
      
      // 2. Save material with extracted text
      const newMaterialRaw = await api.createCourseMaterial({
        course_id: Number(id),
        title: materialFile.name,
        extracted_text: extractedText
      });
      
      // Sometimes supabase returns `{ data: {...} }` or just `{...}` depending on how we structured the API
      const newMaterial = newMaterialRaw?.data || newMaterialRaw;
      
      setMaterials([newMaterial, ...materials]);
      setMaterialFile(null);
      
      alert("Material uploaded and parsed successfully!");
      
      // Optional: Generate notes and study plan asynchronously in background or user clicks
      
    } catch (e: any) {
      console.error(e);
      alert("Failed to upload material: " + e.message);
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleGenerateNotes = async (mat: CourseMaterial) => {
    if (!mat.extracted_text) return;
    if (!confirm("Generate personalized notes from this material?")) return;
    
    try {
      const res = await api.generateCourseNotes({ text: mat.extracted_text, major: user?.major || undefined });
      const notes = res.data?.notes || res?.notes;
      
      // We don't have an update endpoint for materials yet, let's create a hack or just don't save to db, 
      // wait, we can just save it into DB via supabase directly, or add an update api.
      // But let's assume we want to update the local state for now and perhaps add an API for it later.
      const updatedMaterials = materials.map(m => m.id === mat.id ? { ...m, generated_notes: notes } : m);
      setMaterials(updatedMaterials);
      if(activeMaterial?.id === mat.id) {
         setActiveMaterial({ ...mat, generated_notes: notes });
      }
      
    } catch (e: any) {
      console.error("Failed to generate notes", e);
    }
  };

  const handleGeneratePlan = async (mat: CourseMaterial) => {
    if (!mat.extracted_text) return;
    if (!confirm("Generate a step-by-step study plan?")) return;
    
    try {
      const res = await api.generateCourseStudyPlan({ text: mat.extracted_text });
      const plan = res.data?.plan || res?.plan;
      
      const updatedMaterials = materials.map(m => m.id === mat.id ? { ...m, study_plan: plan } : m);
      setMaterials(updatedMaterials);
      if(activeMaterial?.id === mat.id) {
         setActiveMaterial({ ...mat, study_plan: plan });
      }
    } catch (e: any) {
      console.error("Failed to generate plan", e);
    }
  };

  const handleParseSyllabus = async () => {
    if (!syllabusText.trim() && !file) return;
    setParsing(true);
    try {
      const parsedData = await api.parseSyllabus({ 
         course_id: Number(id), 
         syllabus_text: syllabusText,
         file: file || undefined
      });
      setParsedData(parsedData);
      setSyllabusText(''); 
      setFile(null);
      alert("Syllabus parsed! AI will incorporate this into your schedule.");
    } catch (error) {
      console.error(error);
      alert("Failed to parse syllabus");
    } finally {
       setParsing(false);
    }
  };

  const handleGenerateStudyPath = async () => {
    if (!id) return;
    setGeneratingPath(true);
    try {
      const res = await api.generateStudyPath(id);
      setStudyPath(res.data);
    } catch (error) {
      console.error(error);
      alert("Failed to generate study path.");
    } finally {
      setGeneratingPath(false);
    }
  };

  if (loading) {
     return (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      );
  }

  if (!course) {
     return (
       <div className="text-center py-20">
         <h2 className="text-xl font-bold text-slate-800">Course not found</h2>
         <button onClick={() => navigate('/courses')} className="mt-4 text-indigo-600 font-medium hover:underline">Return to Courses</button>
       </div>
     );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/courses')} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{course.code}</h2>
          <p className="text-slate-500 font-medium text-sm">{course.name}</p>
        </div>
      </div>

      {/* Course Materials / Workspace */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileType className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-900">Course Materials</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Upload PDF readings or lecture slides. The AI will extract the text and can generate personalized study notes or turn the material into an actionable study plan tailored to your profile.
        </p>
        
        <div className="flex items-center gap-3 mb-6">
          <input 
             type="file" 
             accept=".pdf" 
             id="material-upload"
             className="hidden" 
             onChange={(e) => setMaterialFile(e.target.files?.[0] || null)} 
          />
          <label htmlFor="material-upload" className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
             <FileUp className="w-4 h-4" />
             {materialFile ? materialFile.name : "Select PDF Material"}
          </label>
          <button 
             onClick={handleUploadMaterial}
             disabled={!materialFile || uploadingMaterial}
             className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl font-medium text-xs tracking-wide uppercase disabled:cursor-not-allowed transition-colors"
          >
             {uploadingMaterial ? "Extracting Text..." : "Upload & Parse"}
          </button>
        </div>

        {materials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sidebar list */}
            <div className="col-span-1 border border-slate-100 rounded-xl bg-slate-50 overflow-hidden divide-y divide-slate-100">
               {materials.map(mat => (
                  <button 
                    key={mat.id}
                    onClick={() => setActiveMaterial(mat)}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-100",
                      activeMaterial?.id === mat.id ? "bg-white border-l-4 border-indigo-500 font-bold" : "text-slate-600"
                    )}
                  >
                    {mat.title}
                  </button>
               ))}
            </div>
            {/* Main content view */}
            <div className="col-span-1 md:col-span-2 border border-slate-100 rounded-xl bg-white p-4 min-h-[300px]">
               {activeMaterial ? (
                 <div className="space-y-6">
                    <h4 className="font-bold text-lg text-slate-900 border-b pb-2">{activeMaterial.title}</h4>
                    
                    <div className="flex gap-2">
                       <button onClick={() => handleGenerateNotes(activeMaterial)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3" /> Generate Notes
                       </button>
                       <button onClick={() => handleGeneratePlan(activeMaterial)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <ListTodo className="w-3 h-3" /> Generate Plan
                       </button>
                    </div>

                    {activeMaterial.generated_notes && (
                      <div className="bg-indigo-50/50 rounded-xl p-4">
                        <h5 className="text-xs font-bold uppercase text-indigo-800 tracking-wider mb-2">Personalized AI Notes</h5>
                        <div className="prose prose-sm prose-p:leading-relaxed max-w-none text-slate-700">
                           <ReactMarkdown>{activeMaterial.generated_notes}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {activeMaterial.study_plan && activeMaterial.study_plan.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold uppercase text-indigo-800 tracking-wider mb-3">Suggested Study Plan</h5>
                        <div className="space-y-3">
                           {activeMaterial.study_plan.map((step: any, idx: number) => (
                             <div key={idx} className="flex gap-3 bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                                <div className="bg-indigo-100 text-indigo-700 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs text-center mt-0.5">
                                  {step.step || (idx + 1)}
                                </div>
                                <div>
                                   <div className="text-sm font-bold text-slate-800">{step.title}</div>
                                   <div className="text-xs text-slate-500 mt-1">{step.description}</div>
                                </div>
                                <button 
                                  onClick={async () => {
                                    try {
                                      await api.createTask({
                                        title: step.title,
                                        description: step.description,
                                        course_id: Number(id),
                                        estimated_duration_mins: 60,
                                        type: 'study'
                                      });
                                      alert("Task added to your pending tasks!");
                                    } catch (e: any) {
                                      alert("Failed to add task");
                                    }
                                  }}
                                  className="ml-auto flex-shrink-0 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-2 py-1 rounded transition-colors"
                                >
                                   + Task
                                </button>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}

                    {!activeMaterial.generated_notes && !activeMaterial.study_plan && (
                      <div className="text-slate-400 text-sm italic">
                         Select an action above to process this material with AI.
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                    <FileText className="w-10 h-10 mb-2 opacity-50" />
                    Select a material to view
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Syllabus Section */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6 opacity-70 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-2 mb-4">
           <FileText className="w-5 h-5 text-indigo-500" />
           <h3 className="text-lg font-bold text-slate-900">AI Syllabus Analyzer</h3>
         </div>
         
         {!parsedData ? (
           <div className="space-y-4">
             <p className="text-xs text-slate-500 leading-relaxed">
               Upload your course syllabus as PDF or text, or paste the content below. Our AI will automatically extract assessments, deadlines, and weekly topics and schedule them for you.
             </p>
             <div className="flex flex-col gap-2">
                 <label className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                       type="file" 
                       accept=".pdf,.txt" 
                       className="hidden" 
                       onChange={(e) => setFile(e.target.files?.[0] || null)} 
                    />
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-600 font-medium">
                       {file ? file.name : 'Click to upload PDF/Text syllabus'}
                    </span>
                 </label>
                 <div className="text-center text-xs text-slate-400 font-medium">OR</div>
                 <textarea 
                   rows={5}
                   value={syllabusText}
                   onChange={(e) => setSyllabusText(e.target.value)}
                   placeholder="Paste syllabus content here..."
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                 />
             </div>
             <button 
               onClick={handleParseSyllabus}
               disabled={parsing || (!syllabusText.trim() && !file)}
               className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
             >
               {parsing ? <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" /> : <BrainCircuit className="w-4 h-4" />}
               Parse & Integrate
             </button>
           </div>
         ) : (
           <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <h4 className="font-bold text-emerald-900">Syllabus Analyzed!</h4>
              <p className="text-xs text-emerald-700 mt-1">Assessments and topics have been processed and integrated.</p>
              {parsedData.assessments && (
                 <p className="text-[10px] uppercase font-bold text-emerald-600 mt-4 tracking-wider">
                   {parsedData.assessments.length} Assessments Found
                 </p>
              )}
           </div>
         )}
      </div>

    </div>
  );
}
