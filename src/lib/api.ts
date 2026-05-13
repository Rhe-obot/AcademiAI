import { supabase } from './supabase';

const API_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `Error ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  const text = await response.text();
  if (!text) return {} as T;
  const json = JSON.parse(text);
  if (json && 'success' in json && 'data' in json) return json.data as T;
  return json as T;
}

export const setAuthToken = (token: string) => {};
export const clearAuthToken = async () => { await supabase.auth.signOut(); };
export const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
};

export const api = {
  // Auth
  login: async (data: any) => {
    const { data: res, error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) throw error;
    return { access_token: res.session?.access_token, user: res.user };
  },
  register: async (data: any) => {
    const { data: res, error } = await supabase.auth.signUp({ 
      email: data.email, 
      password: data.password, 
      options: { 
        data: { name: data.name, major: data.major },
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      } 
    });
    if (error) throw error;
    return { access_token: res.session?.access_token, user: res.user };
  },
  getMe: async () => {
    const { data: res, error } = await supabase.auth.getUser();
    if (error || !res.user) throw error || new Error('Not found');
    const { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', res.user.id).maybeSingle();
    if (profileError) {
      console.warn("Profile error:", profileError);
    }
    return { ...res.user, ...(profile || {}) };
  },
  updatePreferences: async (data: any) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not auth');
    const { data: profile, error } = await supabase.from('users').update(data).eq('id', user.user.id).select().single();
    if (error) throw error;
    return profile;
  },
  
  // Courses
  getCourses: async () => {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) throw error;
    return data || [];
  },
  getCourse: async (id: number | string) => {
    const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  createCourse: async (data: any) => {
    const user = await supabase.auth.getUser();
    const { data: res, error } = await supabase.from('courses').insert({ ...data, user_id: user.data.user?.id }).select().single();
    if (error) throw error;
    return res;
  },
  updateCourse: async (id: number | string, data: any) => {
    const { data: res, error } = await supabase.from('courses').update(data).eq('id', id).select().single();
    if (error) throw error;
    return res;
  },
  deleteCourse: async (id: number | string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
  },

  // Course Materials
  getCourseMaterials: async (course_id: number | string) => {
    const { data, error } = await supabase.from('course_materials').select('*').eq('course_id', course_id).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  createCourseMaterial: async (data: any) => {
    const user = await supabase.auth.getUser();
    const { data: res, error } = await supabase.from('course_materials').insert({ ...data, user_id: user.data.user?.id }).select().single();
    if (error) throw error;
    return res;
  },
  deleteCourseMaterial: async (id: number | string) => {
    const { error } = await supabase.from('course_materials').delete().eq('id', id);
    if (error) throw error;
  },

  // Tasks
  getTasks: async (queries?: any) => {
    let query = supabase.from('tasks').select('*, course:courses(*)');
    if (queries?.status) query = query.eq('status', queries.status);
    if (queries?.course_id) query = query.eq('course_id', queries.course_id);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  getTask: async (id: number | string) => {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  createTask: async (data: any) => {
    const user = await supabase.auth.getUser();
    const { data: res, error } = await supabase.from('tasks').insert({ ...data, user_id: user.data.user?.id }).select().single();
    if (error) throw error;
    return res;
  },
  updateTask: async (id: number | string, data: any) => {
    const { data: res, error } = await supabase.from('tasks').update(data).eq('id', id).select().single();
    if (error) throw error;
    return res;
  },
  completeTask: async (id: number | string) => {
    const { data: res, error } = await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    // Hack: grant some points visually
    const user = await supabase.auth.getUser();
    if (user.data.user) {
       try { await supabase.rpc('increment_points', { user_id: user.data.user.id, amount: 10 }); } catch (e) {}
    }
    return res;
  },
  rescheduleTask: async (id: number | string) => {
    const { data: res, error } = await supabase.from('tasks').update({ status: 'rescheduled' }).eq('id', id).select().single();
    if (error) throw error;
    return res;
  },
  deleteTask: async (id: number | string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },

  // Notifications
  getNotifications: async (queries?: any) => {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (queries?.unread_only) query = query.eq('is_read', false);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  createNotification: async (data: any) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return null;
    const { data: res, error } = await supabase.from('notifications').insert({ ...data, user_id: user.data.user.id }).select().single();
    if (error) throw error;
    return res;
  },
  readNotification: async (id: number | string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },
  readAllNotifications: async () => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.data.user.id).eq('is_read', false);
  },
  getUnreadNotificationCount: async () => {
    const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false);
    if (error) throw error;
    return count || 0;
  },
  
  // Gamification (Simplified logic - relies on backend for actual tracking, or just simple selects)
  getGamificationProfile: async () => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not auth');
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.data.user.id).single();
    const points = profile?.points || 0;

    const RANK_THRESHOLDS = [
      { name: 'Bronze',      min: 0,    next: 'Silver',      nextMin: 100  },
      { name: 'Silver',      min: 100,  next: 'Gold',        nextMin: 300  },
      { name: 'Gold',        min: 300,  next: 'Platinum',    nextMin: 600  },
      { name: 'Platinum',    min: 600,  next: 'Diamond',     nextMin: 1000 },
      { name: 'Diamond',     min: 1000, next: 'Master',      nextMin: 1500 },
      { name: 'Master',      min: 1500, next: 'Grandmaster', nextMin: 2000 },
      { name: 'Grandmaster', min: 2000, next: null,          nextMin: null },
    ];

    const currentRank = [...RANK_THRESHOLDS].reverse().find(r => points >= r.min) || RANK_THRESHOLDS[0];
    const pointsToNext = currentRank.nextMin !== null ? currentRank.nextMin - points : 0;

    return {
      points,
      level: profile?.level_name || currentRank.name,
      streak: profile?.streak || 0,
      next_level: currentRank.next || 'Grandmaster',
      points_to_next_level: pointsToNext,
      badges: [],
      recent_badges: [],
      total_tasks_completed: 0
    };
  },
  getBadges: async () => [],
  getLeaderboard: async () => {
    const { data, error } = await supabase.from('users').select('*').order('points', { ascending: false }).limit(20);
    if (error) throw error;
    return data;
  },

  // AI - Proxy to our express server
  parsePdf: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/ai/parse-pdf`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to parse PDF');
    const resValue = await response.json();
    return resValue.data.text;
  },
  generateCourseNotes: (data: { text: string; major?: string }) => request<any>('/ai/generate-course-notes', { method: 'POST', body: JSON.stringify(data) }),
  generateCourseStudyPlan: (data: { text: string }) => request<any>('/ai/generate-course-study-plan', { method: 'POST', body: JSON.stringify(data) }),
  
  parseSyllabus: async (data: { course_id: number | string; syllabus_text?: string; file?: File }) => {

    const formData = new FormData();
    formData.append('course_id', String(data.course_id));
    if (data.syllabus_text) {
      formData.append('syllabus_text', data.syllabus_text);
    }
    if (data.file) {
      formData.append('syllabus_file', data.file);
    }
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/ai/parse-syllabus`, {
      method: 'POST',
      body: formData,
      // Do not set Content-Type, let browser set it with boundary
    });
    if (!response.ok) throw new Error('Failed to parse syllabus');
    const resValue = await response.json();
    return resValue.data;
  },
  getStudyPath: async (course_id: number | string) => {
    const { data } = await supabase.from('study_paths').select('*').eq('course_id', course_id).single();
    return data;
  },
  generateStudyPath: (course_id: number | string, courseData?: { course_name?: string; course_code?: string; syllabus_summary?: string; materials_summary?: string }) =>
    request<any>(`/ai/study-path/${course_id}`, { method: 'POST', body: JSON.stringify(courseData || {}) }),
  suggestSchedule: (tasks?: any[], userName?: string) => request<any>('/ai/suggest-schedule', { method: 'POST', body: JSON.stringify({ tasks: tasks || [], user_name: userName || 'student' }) }),
  suggestCourses: (data: any) => request<any>('/ai/suggest-courses', { method: 'POST', body: JSON.stringify(data) }),

  // Mood
  recordMood: async (data: any) => {
    const user = await supabase.auth.getUser();
    const { data: res, error } = await supabase.from('mood_entries').insert({ ...data, user_id: user.data.user?.id }).select().single();
    if (error) throw error;
    
    // Adaptive Heuristic Algorithm for Priority
    // Fetch all pending tasks for the user
    if (user.data.user?.id) {
       const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', user.data.user.id).eq('status', 'pending');
       if (tasks && tasks.length > 0) {
          const updates = tasks.map(t => {
             let p = 0.5; // base priority (0.0 to 1.0)
             // 1. Deadline Factor
             if (t.deadline) {
                const daysToDeadline = (new Date(t.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                if (daysToDeadline <= 1) p += 0.4;
                else if (daysToDeadline <= 3) p += 0.2;
                else if (daysToDeadline <= 7) p += 0.1;
             }
             // 2. Energy/Mood Factor
             if (data.energy_level <= 4) {
                 // low energy: prioritize low estimate duration tasks
                 if (t.estimated_duration_mins <= 30) p += 0.2;
                 else p -= 0.15;
             } else if (data.energy_level >= 8) {
                 // high energy: good time for hard tasks
                 if (t.estimated_duration_mins >= 60) p += 0.2;
             }
             p = Math.min(Math.max(p, 0.1), 0.999);
             return { id: t.id, priority_score: p };
          });
          
          for (const up of updates) {
             await supabase.from('tasks').update({ priority_score: up.priority_score }).eq('id', up.id);
          }
       }
    }
    return res;
  },
  getMoodHistory: async (limit?: number) => {
    const { data, error } = await supabase.from('mood_entries').select('*').order('recorded_at', { ascending: false }).limit(limit || 30);
    if (error) throw error;
    return data;
  },
  getLatestMood: async () => {
    const { data, error } = await supabase.from('mood_entries').select('*').order('recorded_at', { ascending: false }).limit(1).single();
    if (error) throw error;
    return data;
  },

  // Schedule
  getSchedule: async (queries?: any) => {
    const { data, error } = await supabase.from('schedules').select('*, task:tasks(*)');
    if (error) throw error;
    return data;
  },
  createSchedule: async (data: any) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return null;
    const { data: res, error } = await supabase.from('schedules').insert({ ...data, user_id: user.data.user.id }).select().single();
    if (error) {
       console.error("Supabase Schedule Insert Error:", error);
       throw error;
    }
    return res;
  },
  getTodaySchedule: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('schedules').select('*, task:tasks(*)').gte('date', today).lt('date', today + ' 23:59:59');
    if (error) throw error;
    return data || [];
  },
  getWeekSchedule: async () => {
    const { data, error } = await supabase.from('schedules').select('*, task:tasks(*)');
    if (error) throw error;
    return data || [];
  },
};

