import { useState, useEffect, useCallback } from 'react';
import type { Subject, Task, Routine, StudySession, View } from './types';
import {
  loadSubjects, saveSubjects,
  loadTasks, saveTasks,
  loadRoutines, saveRoutines,
  loadSessions, saveSessions,
  loadDarkMode, saveDarkMode,
} from './utils/storage';
import {
  BookOpen, Calendar, CheckCircle, Clock, BarChart, Plus, Trash,
  Moon, Sun, Play, Pause, RotateCcw, X, Target, ListTodo, Menu
} from './components/Icons';

const COLORS = [
  '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}min`;
  return `${h}h ${min}min`;
}

export default function App() {
  const [view, setView] = useState<View>('today');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Forms
  const [newSubject, setNewSubject] = useState({ name: '', color: COLORS[0], goalHours: 20 });
  const [newTask, setNewTask] = useState({ title: '', subjectId: '', priority: 'medium' as const, dueDate: '', type: 'study' as const });
  const [newRoutine, setNewRoutine] = useState({ title: '', time: '08:00', days: [1, 2, 3, 4, 5] as number[], subjectId: '' });
  const [newSession, setNewSession] = useState({ subjectId: '', duration: 25, notes: '' });

  // Pomodoro
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [selectedSubjectForTimer, setSelectedSubjectForTimer] = useState('');

  // Load data
  useEffect(() => {
    setSubjects(loadSubjects());
    setTasks(loadTasks());
    setRoutines(loadRoutines());
    setSessions(loadSessions());
    const isDark = loadDarkMode();
    setDark(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  // Persist
  useEffect(() => { saveSubjects(subjects); }, [subjects]);
  useEffect(() => { saveTasks(tasks); }, [tasks]);
  useEffect(() => { saveRoutines(routines); }, [routines]);
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s > 0) return s - 1;
          setTimerMinutes(m => {
            if (m > 0) {
              setTimerSeconds(59);
              return m - 1;
            }
            // Timer finished
            setTimerRunning(false);
            if (timerMode === 'focus' && selectedSubjectForTimer) {
              // Auto log session
              const session: StudySession = {
                id: uid(),
                subjectId: selectedSubjectForTimer,
                duration: 25,
                date: todayStr(),
                notes: 'Sessão Pomodoro',
              };
              setSessions(prev => [...prev, session]);
              setSubjects(prev => prev.map(s =>
                s.id === selectedSubjectForTimer
                  ? { ...s, totalHours: +(s.totalHours + 25 / 60).toFixed(2) }
                  : s
              ));
            }
            // Switch mode
            if (timerMode === 'focus') {
              setTimerMode('break');
              setTimerMinutes(5);
              setTimerSeconds(0);
            } else {
              setTimerMode('focus');
              setTimerMinutes(25);
              setTimerSeconds(0);
            }
            return 0;
          });
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerMode, selectedSubjectForTimer]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    saveDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
  };

  // CRUD Subjects
  const addSubject = () => {
    if (!newSubject.name.trim()) return;
    const s: Subject = {
      id: uid(),
      name: newSubject.name.trim(),
      color: newSubject.color,
      totalHours: 0,
      goalHours: newSubject.goalHours,
      createdAt: new Date().toISOString(),
    };
    setSubjects(prev => [...prev, s]);
    setNewSubject({ name: '', color: COLORS[Math.floor(Math.random() * COLORS.length)], goalHours: 20 });
    setShowSubjectModal(false);
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setTasks(prev => prev.filter(t => t.subjectId !== id));
    setRoutines(prev => prev.filter(r => r.subjectId !== id));
  };

  // CRUD Tasks
  const addTask = () => {
    if (!newTask.title.trim()) return;
    const t: Task = {
      id: uid(),
      title: newTask.title.trim(),
      subjectId: newTask.subjectId || null,
      completed: false,
      priority: newTask.priority,
      dueDate: newTask.dueDate || null,
      createdAt: new Date().toISOString(),
      type: newTask.type,
    };
    setTasks(prev => [...prev, t]);
    setNewTask({ title: '', subjectId: '', priority: 'medium', dueDate: '', type: 'study' });
    setShowTaskModal(false);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // CRUD Routines
  const addRoutine = () => {
    if (!newRoutine.title.trim()) return;
    const r: Routine = {
      id: uid(),
      title: newRoutine.title.trim(),
      time: newRoutine.time,
      days: newRoutine.days,
      subjectId: newRoutine.subjectId || null,
      completedDates: [],
      active: true,
    };
    setRoutines(prev => [...prev, r]);
    setNewRoutine({ title: '', time: '08:00', days: [1, 2, 3, 4, 5], subjectId: '' });
    setShowRoutineModal(false);
  };

  const toggleRoutineDay = (id: string) => {
    const today = todayStr();
    setRoutines(prev => prev.map(r => {
      if (r.id !== id) return r;
      const has = r.completedDates.includes(today);
      return {
        ...r,
        completedDates: has
          ? r.completedDates.filter(d => d !== today)
          : [...r.completedDates, today],
      };
    }));
  };

  const deleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  // Sessions
  const addSession = () => {
    if (!newSession.subjectId || newSession.duration <= 0) return;
    const session: StudySession = {
      id: uid(),
      subjectId: newSession.subjectId,
      duration: newSession.duration,
      date: todayStr(),
      notes: newSession.notes,
    };
    setSessions(prev => [...prev, session]);
    setSubjects(prev => prev.map(s =>
      s.id === newSession.subjectId
        ? { ...s, totalHours: +(s.totalHours + newSession.duration / 60).toFixed(2) }
        : s
    ));
    setNewSession({ subjectId: '', duration: 25, notes: '' });
    setShowSessionModal(false);
  };

  // Computed
  const today = todayStr();
  const dayOfWeek = new Date().getDay();

  const todayRoutines = routines
    .filter(r => r.active && r.days.includes(dayOfWeek))
    .sort((a, b) => a.time.localeCompare(b.time));

  const todayTasks = tasks
    .filter(t => !t.completed || t.dueDate === today)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    });

  const todaySessions = sessions.filter(s => s.date === today);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);

  const completedRoutinesToday = todayRoutines.filter(r => r.completedDates.includes(today)).length;
  const completedTasksToday = tasks.filter(t => t.completed && t.createdAt.slice(0, 10) === today).length;

  const getSubject = (id: string | null) => subjects.find(s => s.id === id);

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Hoje', icon: <ListTodo size={20} /> },
    { id: 'subjects', label: 'Matérias', icon: <BookOpen size={20} /> },
    { id: 'routines', label: 'Rotinas', icon: <Calendar size={20} /> },
    { id: 'timer', label: 'Pomodoro', icon: <Clock size={20} /> },
    { id: 'stats', label: 'Progresso', icon: <BarChart size={20} /> },
  ];

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerMode('focus');
    setTimerMinutes(25);
    setTimerSeconds(0);
  };

  // Sidebar
  const Sidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">S</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">StudyFlow</h1>
              <p className="text-xs text-slate-500">Organizador de Estudos</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                view === item.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={toggleDark}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
            {dark ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
      </div>
    </aside>
  );

  // Modal component
  const Modal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 bg-white dark:bg-slate-900">
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h2 className="font-semibold text-lg capitalize">
            {navItems.find(n => n.id === view)?.label}
          </h2>
          <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
            <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          {/* ========== HOJE ========== */}
          {view === 'today' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <div className="text-2xl font-bold text-primary-600">{formatMinutes(todayMinutes)}</div>
                  <div className="text-xs text-slate-500 mt-1">Estudados hoje</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <div className="text-2xl font-bold text-emerald-600">{completedRoutinesToday}/{todayRoutines.length}</div>
                  <div className="text-xs text-slate-500 mt-1">Rotinas feitas</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <div className="text-2xl font-bold text-violet-600">{tasks.filter(t => !t.completed).length}</div>
                  <div className="text-xs text-slate-500 mt-1">Tarefas pendentes</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <div className="text-2xl font-bold text-amber-600">{subjects.length}</div>
                  <div className="text-xs text-slate-500 mt-1">Matérias</div>
                </div>
              </div>

              {/* Routines today */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2"><Calendar size={18} /> Rotinas de hoje</h3>
                  <button onClick={() => setShowRoutineModal(true)} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                    <Plus size={16} /> Nova
                  </button>
                </div>
                {todayRoutines.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 text-sm">
                    Nenhuma rotina para hoje. Crie uma!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayRoutines.map(r => {
                      const done = r.completedDates.includes(today);
                      const subj = getSubject(r.subjectId);
                      return (
                        <div key={r.id} className={`flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl p-3 border ${done ? 'border-emerald-200 dark:border-emerald-900 opacity-70' : 'border-slate-200 dark:border-slate-800'}`}>
                          <button
                            onClick={() => toggleRoutineDay(r.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-primary-500'}`}
                          >
                            {done && <CheckCircle size={14} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${done ? 'line-through text-slate-400' : ''}`}>{r.title}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{r.time}</span>
                              {subj && (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full" style={{ background: subj.color }} />
                                  {subj.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Tasks */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2"><ListTodo size={18} /> Tarefas</h3>
                  <button onClick={() => setShowTaskModal(true)} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                    <Plus size={16} /> Nova
                  </button>
                </div>
                {todayTasks.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 text-sm">
                    Nenhuma tarefa. Adicione uma!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.map(t => {
                      const subj = getSubject(t.subjectId);
                      const priorityColor = { high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
                      return (
                        <div key={t.id} className={`flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl p-3 border ${t.completed ? 'border-slate-200 dark:border-slate-800 opacity-60' : 'border-slate-200 dark:border-slate-800'}`}>
                          <button
                            onClick={() => toggleTask(t.id)}
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${t.completed ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-primary-500'}`}
                          >
                            {t.completed && <CheckCircle size={14} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${t.completed ? 'line-through text-slate-400' : ''}`}>{t.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColor[t.priority]}`}>
                                {t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Média' : 'Baixa'}
                              </span>
                              {subj && (
                                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full" style={{ background: subj.color }} />
                                  {subj.name}
                                </span>
                              )}
                              {t.dueDate && <span className="text-xs text-slate-500">📅 {t.dueDate}</span>}
                            </div>
                          </div>
                          <button onClick={() => deleteTask(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Quick add session */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-colors"
                >
                  <Plus size={18} /> Registrar sessão de estudo
                </button>
                <button
                  onClick={() => setView('timer')}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors"
                >
                  <Clock size={18} /> Pomodoro
                </button>
              </div>
            </div>
          )}

          {/* ========== MATÉRIAS ========== */}
          {view === 'subjects' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm">Gerencie suas matérias e acompanhe o progresso</p>
                <button
                  onClick={() => setShowSubjectModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
                >
                  <Plus size={18} /> Nova matéria
                </button>
              </div>

              {subjects.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-12 border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">Nenhuma matéria cadastrada ainda.</p>
                  <button onClick={() => setShowSubjectModal(true)} className="mt-3 text-primary-600 text-sm font-medium hover:underline">
                    Criar primeira matéria
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {subjects.map(s => {
                    const progress = Math.min(100, Math.round((s.totalHours / s.goalHours) * 100));
                    return (
                      <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: s.color }}>
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold">{s.name}</h3>
                              <p className="text-xs text-slate-500">{s.totalHours.toFixed(1)}h / {s.goalHours}h meta</p>
                            </div>
                          </div>
                          <button onClick={() => deleteSubject(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash size={16} />
                          </button>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">Progresso</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: s.color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========== ROTINAS ========== */}
          {view === 'routines' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm">Crie hábitos de estudo recorrentes</p>
                <button
                  onClick={() => setShowRoutineModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
                >
                  <Plus size={18} /> Nova rotina
                </button>
              </div>

              {routines.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-12 border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">Nenhuma rotina criada.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {routines.map(r => {
                    const subj = getSubject(r.subjectId);
                    const doneToday = r.completedDates.includes(today);
                    return (
                      <div key={r.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                        <div className="text-center shrink-0 w-14">
                          <div className="text-lg font-bold text-primary-600">{r.time}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{r.title}</div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {DAYS.map((d, i) => (
                              <span
                                key={i}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  r.days.includes(i)
                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                }`}
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                          {subj && (
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ background: subj.color }} />
                              {subj.name}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {doneToday && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">
                              Feito hoje
                            </span>
                          )}
                          <button onClick={() => deleteRoutine(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========== TIMER ========== */}
          {view === 'timer' && (
            <div className="max-w-md mx-auto space-y-8 py-8">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 ${
                  timerMode === 'focus'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}>
                  {timerMode === 'focus' ? <Target size={16} /> : <Clock size={16} />}
                  {timerMode === 'focus' ? 'Foco' : 'Pausa'}
                </div>

                <div className="text-7xl font-bold tracking-tight tabular-nums mb-2">
                  {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                </div>
                <p className="text-slate-500 text-sm">
                  {timerMode === 'focus' ? 'Concentre-se nos estudos' : 'Faça uma pausa e descanse'}
                </p>
              </div>

              {timerMode === 'focus' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-400">Matéria (opcional)</label>
                  <select
                    value={selectedSubjectForTimer}
                    onChange={e => setSelectedSubjectForTimer(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Sem matéria específica</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={resetTimer}
                  className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors ${
                    timerRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {timerRunning ? <Pause size={28} /> : <Play size={28} />}
                </button>
                <div className="w-12" /> {/* spacer */}
              </div>

              <div className="flex justify-center gap-2">
                {[15, 25, 45, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => { setTimerMinutes(m); setTimerSeconds(0); setTimerRunning(false); setTimerMode('focus'); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      timerMinutes === m && timerMode === 'focus' && !timerRunning
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {m}min
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========== STATS ========== */}
          {view === 'stats' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                  <div className="text-3xl font-bold text-primary-600">
                    {sessions.reduce((a, s) => a + s.duration, 0) > 0
                      ? formatMinutes(sessions.reduce((a, s) => a + s.duration, 0))
                      : '0min'}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Total estudado</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                  <div className="text-3xl font-bold text-emerald-600">{sessions.length}</div>
                  <div className="text-sm text-slate-500 mt-1">Sessões registradas</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                  <div className="text-3xl font-bold text-violet-600">
                    {tasks.filter(t => t.completed).length}/{tasks.length}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Tarefas concluídas</div>
                </div>
              </div>

              <section>
                <h3 className="font-semibold mb-3">Progresso por matéria</h3>
                {subjects.length === 0 ? (
                  <p className="text-slate-500 text-sm">Cadastre matérias para ver o progresso.</p>
                ) : (
                  <div className="space-y-3">
                    {subjects.map(s => {
                      const progress = Math.min(100, Math.round((s.totalHours / s.goalHours) * 100));
                      return (
                        <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                              <span className="font-medium text-sm">{s.name}</span>
                            </div>
                            <span className="text-sm text-slate-500">{s.totalHours.toFixed(1)}h / {s.goalHours}h</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: s.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <h3 className="font-semibold mb-3">Últimas sessões</h3>
                {sessions.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhuma sessão registrada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {[...sessions].reverse().slice(0, 10).map(s => {
                      const subj = getSubject(s.subjectId);
                      return (
                        <div key={s.id} className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: subj?.color || '#64748b' }}>
                            {subj?.name.charAt(0) || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{subj?.name || 'Sem matéria'}</div>
                            <div className="text-xs text-slate-500">{s.date} · {formatMinutes(s.duration)}</div>
                          </div>
                          {s.notes && <div className="text-xs text-slate-400 max-w-[120px] truncate">{s.notes}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      {/* ========== MODALS ========== */}
      <Modal open={showSubjectModal} onClose={() => setShowSubjectModal(false)} title="Nova Matéria">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              value={newSubject.name}
              onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Cálculo I"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta de horas</label>
            <input
              type="number"
              min={1}
              value={newSubject.goalHours}
              onChange={e => setNewSubject(p => ({ ...p, goalHours: +e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewSubject(p => ({ ...p, color: c }))}
                  className={`w-8 h-8 rounded-full transition-transform ${newSubject.color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <button onClick={addSubject} className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-colors">
            Criar matéria
          </button>
        </div>
      </Modal>

      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Nova Tarefa">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              value={newTask.title}
              onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Resolver lista de exercícios"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Matéria (opcional)</label>
            <select
              value={newTask.subjectId}
              onChange={e => setNewTask(p => ({ ...p, subjectId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Nenhuma</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Prioridade</label>
              <select
                value={newTask.priority}
                onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as any }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prazo</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <button onClick={addTask} className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-colors">
            Criar tarefa
          </button>
        </div>
      </Modal>

      <Modal open={showRoutineModal} onClose={() => setShowRoutineModal(false)} title="Nova Rotina">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              value={newRoutine.title}
              onChange={e => setNewRoutine(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Revisar anotações"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Horário</label>
              <input
                type="time"
                value={newRoutine.time}
                onChange={e => setNewRoutine(p => ({ ...p, time: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Matéria</label>
              <select
                value={newRoutine.subjectId}
                onChange={e => setNewRoutine(p => ({ ...p, subjectId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Nenhuma</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Dias da semana</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setNewRoutine(p => ({
                      ...p,
                      days: p.days.includes(i) ? p.days.filter(x => x !== i) : [...p.days, i].sort(),
                    }));
                  }}
                  className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                    newRoutine.days.includes(i)
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button onClick={addRoutine} className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-colors">
            Criar rotina
          </button>
        </div>
      </Modal>

      <Modal open={showSessionModal} onClose={() => setShowSessionModal(false)} title="Registrar Sessão">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Matéria</label>
            <select
              value={newSession.subjectId}
              onChange={e => setNewSession(p => ({ ...p, subjectId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecione...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duração (minutos)</label>
            <input
              type="number"
              min={1}
              value={newSession.duration}
              onChange={e => setNewSession(p => ({ ...p, duration: +e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Anotações (opcional)</label>
            <textarea
              value={newSession.notes}
              onChange={e => setNewSession(p => ({ ...p, notes: e.target.value }))}
              placeholder="O que você estudou?"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <button onClick={addSession} className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-colors">
            Registrar
          </button>
        </div>
      </Modal>
    </div>
  );
}
