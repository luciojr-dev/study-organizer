import type { Subject, Task, Routine, StudySession } from '../types';

const KEYS = {
  subjects: 'studyflow_subjects',
  tasks: 'studyflow_tasks',
  routines: 'studyflow_routines',
  sessions: 'studyflow_sessions',
  darkMode: 'studyflow_dark',
};

export function loadSubjects(): Subject[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.subjects) || '[]');
  } catch {
    return [];
  }
}

export function saveSubjects(data: Subject[]) {
  localStorage.setItem(KEYS.subjects, JSON.stringify(data));
}

export function loadTasks(): Task[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.tasks) || '[]');
  } catch {
    return [];
  }
}

export function saveTasks(data: Task[]) {
  localStorage.setItem(KEYS.tasks, JSON.stringify(data));
}

export function loadRoutines(): Routine[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.routines) || '[]');
  } catch {
    return [];
  }
}

export function saveRoutines(data: Routine[]) {
  localStorage.setItem(KEYS.routines, JSON.stringify(data));
}

export function loadSessions(): StudySession[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.sessions) || '[]');
  } catch {
    return [];
  }
}

export function saveSessions(data: StudySession[]) {
  localStorage.setItem(KEYS.sessions, JSON.stringify(data));
}

export function loadDarkMode(): boolean {
  return localStorage.getItem(KEYS.darkMode) === 'true';
}

export function saveDarkMode(value: boolean) {
  localStorage.setItem(KEYS.darkMode, String(value));
}
