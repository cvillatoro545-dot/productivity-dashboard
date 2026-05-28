export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
  streak?: number;
  completedToday?: boolean;
  completionRate?: number;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  completed_date: string;
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content?: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  tasksTotal: number;
  tasksDone: number;
  tasksInProgress: number;
  tasksTodo: number;
  habitsTotal: number;
  habitsCompletedToday: number;
  notesTotal: number;
  taskCompletionRate: number;
}
