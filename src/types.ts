export type Rank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';

export interface User {
  id: string;
  name: string;
  username?: string; // Keep for UI if needed
  email: string;
  major?: string; // Keep for UI if needed
  points: number;
  streak: number;
  rank?: Rank; // Handled as 'level' on backend
  level_name?: Rank; // Handled as 'level' on backend
}

export interface Course {
  id: number;
  code: string;
  name: string;
}

export interface CourseMaterial {
  id: number;
  course_id: number;
  title: string;
  extracted_text?: string;
  generated_notes?: string;
  study_plan?: any[];
  created_at?: string;
}

export type TaskStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'rescheduled';
export type TaskType = 'assignment' | 'exam' | 'quiz' | 'project' | 'study' | 'reading';

export interface Task {
  id: number;
  title: string;
  course_id: number;
  course?: Course | null;
  deadline?: string; // ISO string (Date)
  start_time?: string; // Time string like "14:00"
  end_time?: string; // Time string like "15:00"
  scheduled_start?: string; // ISO string
  scheduled_end?: string; // ISO string
  status: TaskStatus;
  type: TaskType;
  estimated_duration_mins?: number; // Kept for backwards compatibility if needed
}

export type NotificationType = 'reminder' | 'deadline_warning' | 'missed' | 'rescheduled' | 'achievement' | 'streak';

export interface AppNotification {
  id: number;
  message: string;
  title?: string;
  type: NotificationType;
  created_at: string; // ISO string
  is_read: boolean;
}


