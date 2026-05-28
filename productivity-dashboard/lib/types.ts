export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  sort_order: number;
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
  category: "daily" | "devotional";
  weekly_goal: number;
  created_at: string;
  streak?: number;
  completedToday?: boolean;
  completionRate?: number;
  weekLogs?: string[];
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

export interface Goal {
  id: number;
  title: string;
  category: "financial" | "fitness" | "other";
  goal_type: "roth_ira" | "emergency_fund" | "gym" | "custom";
  target_amount?: number;
  current_amount: number;
  monthly_target?: number;
  target_date?: string;
  color: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  monthly_contributed?: number;
}

export interface GoalLog {
  id: number;
  goal_id: number;
  amount: number;
  log_date: string;
  note?: string;
  created_at: string;
}

export interface GymLog {
  id: number;
  workout_date: string;
  notes?: string;
  created_at: string;
}

export interface JournalEntry {
  id: number;
  entry_date: string;
  mood?: number;
  content?: string;
  gratitude?: string;
  intentions?: string;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: number;
  ol_key: string;
  title: string;
  author?: string;
  cover_url?: string;
  year?: number;
  status: "want_to_read" | "reading" | "read" | "dnf";
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: number;
  name: string;
  balance: number;
  original_balance: number;
  credit_limit: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface QuarterlyGoal {
  id: number;
  quarter_key: string;
  category: "Finance" | "Health" | "Business" | "Personal";
  text: string;
  completed: boolean;
  created_at: string;
}

export interface Achievement {
  id: number;
  quarter_key: string;
  text: string;
  created_at: string;
}

export interface ParkingLotItem {
  id: number;
  text: string;
  done: boolean;
  created_at: string;
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

export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  city: string;
  humidity: number;
  feelsLike: number;
}
