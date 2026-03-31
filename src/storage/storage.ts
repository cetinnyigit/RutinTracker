import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, CompletionRecord } from '../types';

const ACTIVITIES_KEY = 'daytrack_activities';
const COMPLETIONS_KEY = 'daytrack_completions';

// Activities
export async function getActivities(): Promise<Activity[]> {
  const data = await AsyncStorage.getItem(ACTIVITIES_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveActivities(activities: Activity[]): Promise<void> {
  await AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

export async function addActivity(activity: Activity): Promise<Activity[]> {
  const activities = await getActivities();
  activities.push(activity);
  await saveActivities(activities);
  return activities;
}

export async function updateActivity(updated: Activity): Promise<Activity[]> {
  const activities = await getActivities();
  const index = activities.findIndex(a => a.id === updated.id);
  if (index !== -1) {
    activities[index] = updated;
    await saveActivities(activities);
  }
  return activities;
}

export async function deleteActivity(id: string): Promise<Activity[]> {
  let activities = await getActivities();
  activities = activities.filter(a => a.id !== id);
  await saveActivities(activities);
  // Also remove completions for this activity
  let completions = await getCompletions();
  completions = completions.filter(c => c.activityId !== id);
  await saveCompletions(completions);
  return activities;
}

// Completions
export async function getCompletions(): Promise<CompletionRecord[]> {
  const data = await AsyncStorage.getItem(COMPLETIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveCompletions(completions: CompletionRecord[]): Promise<void> {
  await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
}

export async function toggleCompletion(activityId: string, date: string): Promise<CompletionRecord[]> {
  const completions = await getCompletions();
  const existingIndex = completions.findIndex(
    c => c.activityId === activityId && c.date === date
  );

  if (existingIndex !== -1) {
    completions[existingIndex].completed = !completions[existingIndex].completed;
  } else {
    completions.push({ activityId, date, completed: true });
  }

  await saveCompletions(completions);
  return completions;
}

export function isActivityScheduledForDate(activity: Activity, date: string): boolean {
  if (activity.archived) return false;
  if (activity.frequency === 'daily') return true;

  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  return activity.weekDays?.includes(dayOfWeek) ?? false;
}

export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStreakCount(
  activityId: string,
  completions: CompletionRecord[],
  activity: Activity
): number {
  const activityCompletions = completions
    .filter(c => c.activityId === activityId && c.completed)
    .map(c => c.date)
    .sort()
    .reverse();

  if (activityCompletions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = getDateString(checkDate);
    const isScheduled = isActivityScheduledForDate(activity, dateStr);

    if (isScheduled) {
      if (activityCompletions.includes(dateStr)) {
        streak++;
      } else {
        // Allow today to be incomplete without breaking streak
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
