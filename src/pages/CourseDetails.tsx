import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Upload, FileText, BrainCircuit, Wand2, ChevronRight, CheckCircle2, FileUp, ListTodo, FileType, Trash2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Course, CourseMaterial } from '../types';
import { useAppStore } from '../store/AppProvider';
import ReactMarkdown from 'react-markdown';

export function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addTask, courses } = useAppStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialFile, setMaterialFile] = useState<File | null>(null);

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
      const enrichedMats = mats.map((mat: CourseMaterial) => {
        const cachedNotes = localStorage.getItem(`material_notes_${mat.id}`);
        const cachedPlan = localStorage.getItem(`material_plan_${mat.id}`);
        return {
          ...mat,
          generated_notes: cachedNotes || mat.generated_notes,
          study_plan: cachedPlan ? JSON.parse(cachedPlan) : mat.study_plan,
        };
      });
      setMaterials(enrichedMats);
    } catch (error) {
      console.error("Failed to load materials", error);
    }
  };

  const handleDeleteMaterial = async (matId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this material?")) return;
    try {
      await api.deleteCourseMaterial(matId);
      setMaterials(materials.filter(m => m.id !== matId));
      localStorage.removeItem(`material_notes_${matId}`);
      localStorage.removeItem(`material_plan_${matId}`);
      toast.success('Material deleted');
    } catch (error: any) {
      toast.error('Failed to delete material');
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
      toast.success('Material uploaded and text extracted!');
      
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to upload material: ' + e.message);
    } finally {
      setUploadingMaterial(false);
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
      toast.success('Syllabus analyzed! AI will incorporate this into your schedule.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to parse syllabus. Check your file and try again.');
    } finally {
       setParsing(false);
    }
  };

  const handleGenerateStudyPath = async () => {
    if (!id || !course) return;
    setGeneratingPath(true);
    try {
      // Pass course context so the AI generates a relevant, personalized path
      const materialsSummary = materials.length > 0
        ? materials.map(m => m.title).join(', ')
        : undefined;
      const syllabusText = parsedData?.course_title
        ? `${parsedData.course_title} — Topics: ${(parsedData.topics || []).slice(0, 5).join(', ')}`
        : undefined;

      const res = await api.generateStudyPath(id, {
        course_name: course.name,
        course_code: course.code,
        syllabus_summary: syllabusText,
        materials_summary: materialsSummary,
      });
      // request() already unwraps .data, so res IS { generated_path, model_used }
      setStudyPath(res?.generated_path || res);
      toast.success('Study path generated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate study path.');
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

        {materials.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 bg-slate-50/80 border border-slate-100 rounded-2xl text-center">
            <FolderOpen className="w-12 h-12 text-indigo-200 mb-4" />
            <h4 className="text-slate-800 font-bold text-lg">No materials yet</h4>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">
              Upload your first PDF lecture slide or reading above to generate smart notes and study plans.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 border border-slate-100 rounded-xl bg-slate-50 overflow-hidden divide-y divide-slate-100">
                {materials.map((mat) => (
                  <div key={mat.id} className="flex items-center w-full text-left transition-colors hover:bg-slate-50 border border-slate-100 rounded-xl group bg-white p-2">
                    <button 
                      onClick={() => navigate(`/courses/${id}/materials/${mat.id}`)}
                      className="flex-grow flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-left truncate">{mat.title}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteMaterial(mat.id, e)}
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Study Path Section */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-900">AI Study Path</h3>
          </div>
          <button
            onClick={handleGenerateStudyPath}
            disabled={generatingPath}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {generatingPath ? <div className="w-3 h-3 animate-spin border-2 border-indigo-600 border-t-transparent rounded-full" /> : <Wand2 className="w-3 h-3" />}
            {generatingPath ? 'Generating...' : studyPath ? 'Regenerate' : 'Generate Path'}
          </button>
        </div>
        {!studyPath ? (
          <p className="text-xs text-slate-500 italic">
            Click "Generate Path" to get a personalized week-by-week study plan for {course.code}.
          </p>
        ) : (
          <div className="space-y-3">
            {(studyPath.weeks || []).map((week: any, idx: number) => (
              <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-indigo-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {week.week || idx + 1}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{week.focus}</h4>
                </div>
                {week.activities && (
                  <ul className="space-y-1 ml-8 mb-2">
                    {week.activities.map((act: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <ChevronRight className="w-3 h-3 shrink-0 text-indigo-400 mt-0.5" />{act}
                      </li>
                    ))}
                  </ul>
                )}
                {week.goal && (
                  <p className="ml-8 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg font-medium">🎯 {week.goal}</p>
                )}
              </div>
            ))}
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
