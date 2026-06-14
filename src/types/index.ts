export type Priority = 'high' | 'med' | 'low';
export type Tag = 'focus' | 'creative' | 'energy' | 'admin';
export type Page = 'today' | 'week' | 'projects' | 'focus' | 'settings';

export interface Subtask {
  id: string;
  name: string;
  dur: number;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  deadline: string | null;
  weekBudgetH: number;
  estimateMins: number;
  priority: Priority;
  tag: Tag;
  done: boolean;
  subtasks: Subtask[];
  createdAt: number;
}

export interface ScheduleSlot {
  id: string;
  type: 'task' | 'break';
  projectId?: string;
  subtaskId?: string | null;
  label: string;
  start: string;
  end: string;
  dur: number;
  done: boolean;
  missed: boolean;
  tag?: Tag;
}

export type Schedule = Record<string, ScheduleSlot[]>;

export interface Settings {
  start: string;
  end: string;
  maxBlocks: number;
  breakS: number;
  breakL: number;
  sound: boolean;
  confetti: boolean;
  autoReschedule: boolean;
}

export interface AppState {
  projects: Project[];
  schedule: Schedule;
  streak: number;
  settings: Settings;
  activePage: Page;
  darkMode: boolean;
}
