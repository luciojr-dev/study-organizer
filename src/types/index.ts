export interface Subject {
  id: string;
  name: string;
  color: string;
  totalHours: number;
  goalHours: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  createdAt: string;
  type: 'study' | 'routine' | 'task';
}

export interface Routine {
  id: string;
  title: string;
  time: string; // HH:mm
  days: number[]; // 0-6 (Sun-Sat)
  subjectId: string | null;
  completedDates: string[]; // YYYY-MM-DD
  active: boolean;
}

export interface StudySession {
  id: string;
  subjectId: string;
  duration: number; // minutes
  date: string; // YYYY-MM-DD
  notes: string;
}

export type View = 'today' | 'subjects' | 'routines' | 'stats' | 'timer';
