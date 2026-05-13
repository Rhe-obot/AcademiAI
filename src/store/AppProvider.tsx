import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task, AppNotification, Rank, Course } from '../types';
import { addDays, subDays, isBefore, isAfter, format, parseISO } from 'date-fns';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'sonner';

interface AppState {
  user: User | null;
  tasks: Task[];
  notifications: AppNotification[];
  courses: Course[];
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password: string, major: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'status'>) => Promise<void>;
  updateTask: (id: number, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  completeTask: (id: number) => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getRankFromPoints: (points: number) => Rank;
  addCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  removeCourse: (id: number) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInitialData = async () => {
    // Don't try to fetch if config is missing placeholders
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setIsLoading(false);
        setUser(null);
        return;
      }

      setIsLoading(true);
      const [u, tObj, nObj, c] = await Promise.all([
        api.getMe(),
        api.getTasks(),
        api.getNotifications(),
        api.getCourses()
      ]);
      setUser({ ...u, rank: (u as any).level || 'Bronze' });
      setTasks(Array.isArray(tObj) ? tObj : (tObj as any)?.data || []);
      setNotifications(Array.isArray(nObj) ? nObj : (nObj as any)?.data || []);
      setCourses(c || []);
    } catch (e: any) {
      const errMsg = e?.message || (typeof e === 'string' ? e : '');
      const isAuthError = errMsg.includes('Auth session missing') || 
                         errMsg.includes('JWT') || 
                         errMsg.includes('Not found') ||
                         errMsg.includes('invalid') ||
                         errMsg.includes('401');

      if (isAuthError) {
        console.log('User not authenticated or session invalid');
      } else if (errMsg.includes('Failed to fetch') || errMsg.includes('Network Error')) {
        console.warn('Supabase network error - check your keys and connection');
      } else {
        console.error('Failed fetching data:', e);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If not configured, we don't start the auth listener yet to avoid errors
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchInitialData();

    // Listen for auth changes
    if (!supabase.auth || typeof (supabase.auth as any).onAuthStateChange !== 'function') {
      console.error('Supabase auth is not properly initialized');
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((event: any, session: any) => {
      console.log('Auth event:', event);
      if (session) {
        fetchInitialData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setTasks([]);
        setNotifications([]);
        setCourses([]);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Realtime Notifications
  useEffect(() => {
    if (user?.id) {
       const sub = supabase.channel('notifications')
         .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
           const newNotif = payload.new as AppNotification;
           toast(newNotif.title || 'New Notification', { description: newNotif.message });
           
           if ("Notification" in window && Notification.permission === "granted") {
             new Notification(newNotif.title || 'AcademiAI Notification', { 
               body: newNotif.message 
             });
           }
           
           setNotifications(prev => [newNotif, ...prev]);
         })
         .subscribe();
       return () => { supabase.removeChannel(sub); }
    }
  }, [user?.id]);

  // Task Reminders
  useEffect(() => {
    if (!user || tasks.length === 0) return;
    
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
         if (task.status === 'completed' || !task.deadline) return;
         const dl = new Date(task.deadline);
         const diffHrs = (dl.getTime() - now.getTime()) / (1000 * 3600);
         
         const reminded24 = localStorage.getItem(`reminded_24_${task.id}`);
         const reminded2 = localStorage.getItem(`reminded_2_${task.id}`);
         
         const sendPush = async (msg: string, titleStr: string, type: string) => {
             try {
                await api.createNotification({
                   title: titleStr,
                   message: msg,
                   type: type
                });
             } catch(e) {}
         };

         if (diffHrs > 0 && diffHrs <= 24 && !reminded24) {
            localStorage.setItem(`reminded_24_${task.id}`, 'true');
            sendPush(`Hey ${user.name || 'there'}, just reminding you that "${task.title}" is due in less than 24 hours!`, 'Task Reminder', 'deadline_warning');
         } else if (diffHrs > 0 && diffHrs <= 2 && !reminded2) {
            localStorage.setItem(`reminded_2_${task.id}`, 'true');
            sendPush(`Urgent! "${task.title}" is due in less than 2 hours! Time to focus, ${user.name || 'boss'}.`, 'Urgent Reminder', 'deadline_warning');
         }
      });
    };
    
    checkReminders();
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, tasks]);

  // Calculate Rank based on Points
  const getRankFromPoints = (points: number): Rank => {
    if (points >= 2000) return 'Grandmaster';
    if (points >= 1500) return 'Master';
    if (points >= 1000) return 'Diamond';
    if (points >= 600) return 'Platinum';
    if (points >= 300) return 'Gold';
    if (points >= 100) return 'Silver';
    return 'Bronze';
  };

  const login = async (email: string, password?: string) => {
    try {
      await api.login({ email, password: password || 'password' });
      // onAuthStateChange handles data fetching
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const signup = async (name: string, email: string, password: string, major: string) => {
    try {
      await api.register({ name, email, password, major });
      // onAuthStateChange handles data fetching
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setTasks([]);
    setNotifications([]);
    setCourses([]);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (user) {
      try {
        await api.updatePreferences({
          name: data.name,
          username: data.username,
          major: data.major
        });
        setUser({ ...user, ...data }); 
      } catch (e) {
        console.error("Failed to update profile", e);
        toast.error("Failed to update profile.");
      }
    }
  };

  const addCourse = async (courseInput: Omit<Course, 'id'>) => {
    try {
      const newCourse = await api.createCourse(courseInput);
      setCourses(prev => [...prev, newCourse]);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const removeCourse = async (id: number) => {
    try {
      await api.deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addTask = async (taskInput: Omit<Task, 'id' | 'status'>) => {
    try {
      const res = await api.createTask({
        title: taskInput.title,
        course_id: taskInput.course_id,
        deadline: taskInput.deadline,
        scheduled_start: taskInput.scheduled_start,
        scheduled_end: taskInput.scheduled_end,
        estimated_duration_mins: taskInput.estimated_duration_mins,
        type: taskInput.type || 'assignment',
      });
      // Refresh tasks
      const newTasks = await api.getTasks();
      setTasks(Array.isArray(newTasks) ? newTasks : (newTasks as any)?.data || []);
      
      const scheduledDateStr = res?.scheduled_start;
      if (scheduledDateStr) {
         addNotification({
          message: `I scheduled "${taskInput.title}" for ${format(parseISO(scheduledDateStr), 'EEEE, MMM do')}.`,
          type: 'achievement' as any,
        });
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const completeTask = async (id: number) => {
    try {
       await api.completeTask(id);
       
       const [tObj, gamification] = await Promise.all([
          api.getTasks(),
          api.getGamificationProfile()
       ]);
       
       setTasks(Array.isArray(tObj) ? tObj : (tObj as any)?.data || []);
       
       if (user && gamification) {
         setUser({
           ...user,
           points: gamification.points,
           rank: gamification.level,
           streak: gamification.streak
         });
       }
    } catch (e) {
      console.error(e);
    }
  };

  const updateTask = async (id: number, data: Partial<Task>) => {
    try {
       await api.updateTask(id, data);
       const newTasks = await api.getTasks();
       setTasks(Array.isArray(newTasks) ? newTasks : (newTasks as any)?.data || []);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteTask = async (id: number) => {
    try {
       await api.deleteTask(id);
       setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addNotification = async (n: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) => {
    try {
       await api.createNotification({
          title: n.title,
          message: n.message,
          type: n.type
       });
       // Realtime listener catches it and adds to state
    } catch(e) {}
  };

  const markNotificationRead = async (id: number) => {
    try {
       await api.readNotification(id);
       setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
       console.error(e);
    }
  };
  
  const markAllNotificationsRead = async () => {
    try {
      await api.readAllNotifications();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };
  
  const deleteNotification = async (id: number) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };
  
  const clearAllNotifications = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, tasks, notifications, courses, isLoading,
      login, signup, logout, updateProfile,
      addTask, updateTask, deleteTask, completeTask, 
      markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications,
      getRankFromPoints,
      addCourse, removeCourse
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};

