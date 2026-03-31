import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Activity, CompletionRecord } from '../types';
import * as Storage from '../storage/storage';

interface AppContextType {
  activities: Activity[];
  completions: CompletionRecord[];
  loading: boolean;
  addActivity: (activity: Activity) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  toggleCompletion: (activityId: string, date: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const [acts, comps] = await Promise.all([
      Storage.getActivities(),
      Storage.getCompletions(),
    ]);
    setActivities(acts);
    setCompletions(comps);
  }, []);

  useEffect(() => {
    refreshData().finally(() => setLoading(false));
  }, [refreshData]);

  const addActivity = useCallback(async (activity: Activity) => {
    const updated = await Storage.addActivity(activity);
    setActivities(updated);
  }, []);

  const updateActivity = useCallback(async (activity: Activity) => {
    const updated = await Storage.updateActivity(activity);
    setActivities(updated);
  }, []);

  const deleteActivity = useCallback(async (id: string) => {
    const updated = await Storage.deleteActivity(id);
    setActivities(updated);
    const comps = await Storage.getCompletions();
    setCompletions(comps);
  }, []);

  const toggleCompletion = useCallback(async (activityId: string, date: string) => {
    const updated = await Storage.toggleCompletion(activityId, date);
    setCompletions(updated);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activities,
        completions,
        loading,
        addActivity,
        updateActivity,
        deleteActivity,
        toggleCompletion,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
