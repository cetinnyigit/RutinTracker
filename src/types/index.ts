export interface Activity {
  id: string;
  name: string;
  emoji: string;
  color: string;
  frequency: 'daily' | 'weekly';
  weekDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  reminderTime?: string; // HH:mm format
  archived: boolean;
  createdAt: string; // ISO date string
}

export interface CompletionRecord {
  activityId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export type DateString = string; // YYYY-MM-DD format
