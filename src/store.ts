import { create } from 'zustand';
import type { DailyEntry, ChildContext, ActivityLine, AIServiceConfig, Goal, ModelLoadingState } from './types';
import { db, generateId, addJournalEvent } from './db';
import { generateSummary } from './services/aiService';
import { add, parse, differenceInMinutes } from 'date-fns';
import { syncUp, syncDown, isCloudSyncAvailable, type SyncStatus } from './services/cloudSync';

/**
 * Zustand Store - UI State Management
 */

interface AppState {
  // Current state
  currentChild: ChildContext | null;
  currentEntry: DailyEntry | null;
  children: ChildContext[];
  entries: DailyEntry[];
  goals: Goal[];
  aiConfig: AIServiceConfig;
  isGeneratingPDF: boolean;
  syncStatus: SyncStatus;

  // Actions
  setCurrentChild: (child: ChildContext | null) => void;
  setCurrentEntry: (entry: DailyEntry | null) => void;
  loadChildren: () => Promise<void>;
  loadEntries: () => Promise<void>;
  loadGoals: () => Promise<void>;
  createChild: (child: Omit<ChildContext, 'id'>) => Promise<ChildContext>;
  updateChild: (id: string, updates: Partial<ChildContext>) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
  createEntry: (date: string, childId: string) => Promise<DailyEntry>;
  addActivityLine: (entryId: string, line: Omit<ActivityLine, 'id'>) => Promise<void>;
  updateActivityLine: (entryId: string, lineId: string, updates: Partial<ActivityLine>) => Promise<void>;
  deleteActivityLine: (entryId: string, lineId: string) => Promise<void>;
  saveSignature: (entryId: string, signatureBase64: string) => Promise<void>;
  generateAISummary: (entryId: string, onModelProgress?: (state: ModelLoadingState) => void) => Promise<void>;
  updateAISummary: (entryId: string, summary: string) => Promise<void>;
  setAIConfig: (config: AIServiceConfig) => void;
  saveGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (code: number) => Promise<void>;
  clearAllGoals: () => Promise<void>;
  markEntriesAsSent: (entryIds: string[]) => Promise<void>;

  // Cloud sync actions
  toggleCloudSync: (enabled: boolean) => void;
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  checkCloudSyncAvailability: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  currentChild: null,
  currentEntry: null,
  children: [],
  entries: [],
  goals: [],
  aiConfig: {},
  isGeneratingPDF: false,
  syncStatus: {
    isSyncing: false,
    lastSyncAt: localStorage.getItem('pcal_last_sync_at'),
    lastSyncError: null,
    syncEnabled: localStorage.getItem('pcal_sync_enabled') === 'true',
  },

  // Actions
  setCurrentChild: (child) => set({ currentChild: child }),

  setCurrentEntry: (entry) => set({ currentEntry: entry }),

  loadChildren: async () => {
    const children = await db.children.toArray();
    set({ children });
  },

  loadEntries: async () => {
    const entries = await db.dailyEntries.toArray();
    set({ entries });
  },

  loadGoals: async () => {
    const goals = await db.goals.toArray();
    set({ goals });
  },

  createChild: async (childData) => {
    const child: ChildContext = {
      id: generateId(),
      ...childData
    };

    await db.children.add(child);
    // Update state directly instead of reloading all children
    set({ children: [...get().children, child] });

    return child;
  },

  updateChild: async (id, updates) => {
    const child = await db.children.get(id);
    if (child) {
      const updatedChild = { ...child, ...updates };
      await db.children.put(updatedChild);
      // Update state directly instead of reloading all children
      set({
        children: get().children.map(c => c.id === id ? updatedChild : c),
        // Update current child if it's the one being edited
        currentChild: get().currentChild?.id === id ? updatedChild : get().currentChild
      });
    }
  },

  deleteChild: async (id) => {
    // Delete all entries for this child
    await db.dailyEntries.where('childId').equals(id).delete();

    // Delete the child
    await db.children.delete(id);

    // Update state directly instead of reloading
    const isCurrentChild = get().currentChild?.id === id;
    set({
      children: get().children.filter(c => c.id !== id),
      entries: get().entries.filter(e => e.childId !== id),
      // Clear current child if it's the one being deleted
      currentChild: isCurrentChild ? null : get().currentChild,
      currentEntry: isCurrentChild ? null : get().currentEntry
    });
  },

  createEntry: async (date, childId) => {
    const entry: DailyEntry = {
      id: generateId(),
      date,
      childId,
      lines: [],
      isLocked: false
    };

    // Add to journal
    await addJournalEvent('ENTRY_CREATED', entry);

    // Add to database
    await db.dailyEntries.add(entry);
    // Update state directly instead of reloading all entries
    set({ entries: [...get().entries, entry] });

    return entry;
  },

  addActivityLine: async (entryId, lineData) => {
    const line: ActivityLine = {
      id: generateId(),
      ...lineData
    };

    // Add to journal
    await addJournalEvent('LINE_ADDED', { entryId, line });

    // Update database
    const entry = await db.dailyEntries.get(entryId);
    if (entry) {
      entry.lines.push(line);
      await db.dailyEntries.put(entry);
      // Update state directly instead of reloading all entries
      const updatedEntries = get().entries.map(e => e.id === entryId ? entry : e);
      set({
        entries: updatedEntries,
        // Update current entry if it's the one being edited
        currentEntry: get().currentEntry?.id === entryId ? entry : get().currentEntry
      });
    }
  },

  updateActivityLine: async (entryId, lineId, updates) => {
    // Add to journal
    await addJournalEvent('LINE_UPDATED', { entryId, lineId, updates });

    // Update database
    const entry = await db.dailyEntries.get(entryId);
    if (entry) {
      const lineIndex = entry.lines.findIndex(l => l.id === lineId);
      if (lineIndex !== -1) {
        entry.lines[lineIndex] = { ...entry.lines[lineIndex], ...updates };
        await db.dailyEntries.put(entry);
        // Update state directly instead of reloading all entries
        const updatedEntries = get().entries.map(e => e.id === entryId ? entry : e);
        set({
          entries: updatedEntries,
          // Update current entry if it's the one being edited
          currentEntry: get().currentEntry?.id === entryId ? entry : get().currentEntry
        });
      }
    }
  },

  deleteActivityLine: async (entryId, lineId) => {
    // Add to journal
    await addJournalEvent('LINE_DELETED', { entryId, lineId });

    // Update database
    const entry = await db.dailyEntries.get(entryId);
    if (entry) {
      entry.lines = entry.lines.filter(l => l.id !== lineId);
      await db.dailyEntries.put(entry);
      // Update state directly instead of reloading all entries
      const updatedEntries = get().entries.map(e => e.id === entryId ? entry : e);
      set({
        entries: updatedEntries,
        // Update current entry if it's the one being edited
        currentEntry: get().currentEntry?.id === entryId ? entry : get().currentEntry
      });
    }
  },

  saveSignature: async (entryId, signatureBase64) => {
    // Add to journal
    await addJournalEvent('SIGNATURE_SAVED', { entryId, signatureBase64 });

    // Update database
    const entry = await db.dailyEntries.get(entryId);
    if (entry) {
      entry.signatureBase64 = signatureBase64;
      await db.dailyEntries.put(entry);
      // Update state directly instead of reloading all entries
      const updatedEntries = get().entries.map(e => e.id === entryId ? entry : e);
      set({
        entries: updatedEntries,
        // Update current entry if it's the one being edited
        currentEntry: get().currentEntry?.id === entryId ? entry : get().currentEntry
      });
    }
  },

  generateAISummary: async (entryId, onModelProgress) => {
    const entry = await db.dailyEntries.get(entryId);
    const child = get().currentChild;

    if (!entry || !child) return;

    const { summary, provider } = await generateSummary(child.name, entry.lines, get().aiConfig, onModelProgress);

    entry.aiSummary = summary;
    entry.aiSummaryProvider = provider;
    await db.dailyEntries.put(entry);
    // Update state directly instead of reloading all entries
    const updatedEntries = get().entries.map(e => e.id === entryId ? entry : e);
    set({
      entries: updatedEntries,
      // Update current entry if it's the one being edited
      currentEntry: get().currentEntry?.id === entryId ? entry : get().currentEntry
    });
  },

  updateAISummary: async (entryId, summary) => {
    const entry = await db.dailyEntries.get(entryId);
    if (!entry) return;

    entry.aiSummary = summary;
    await db.dailyEntries.put(entry);
    // Update state directly instead of reloading all entries
    const updatedEntries = get().entries.map(e => e.id === entryId ? entry : e);
    set({
      entries: updatedEntries,
      // Update current entry if it's the one being edited
      currentEntry: get().currentEntry?.id === entryId ? entry : get().currentEntry
    });
  },

  setAIConfig: (config) => set({ aiConfig: config }),

  saveGoal: async (goal) => {
    await db.goals.put(goal);
    // Update state directly instead of reloading all goals
    const existingIndex = get().goals.findIndex(g => g.code === goal.code);
    if (existingIndex >= 0) {
      set({ goals: get().goals.map(g => g.code === goal.code ? goal : g) });
    } else {
      set({ goals: [...get().goals, goal] });
    }
  },

  deleteGoal: async (code) => {
    await db.goals.delete(code);
    // Update state directly instead of reloading all goals
    set({ goals: get().goals.filter(g => g.code !== code) });
  },

  clearAllGoals: async () => {
    await db.goals.clear();
    // Update state directly instead of reloading
    set({ goals: [] });
  },

  markEntriesAsSent: async (entryIds) => {
    const timestamp = Date.now();
    const updatedEntriesMap = new Map<string, DailyEntry>();

    for (const entryId of entryIds) {
      const entry = await db.dailyEntries.get(entryId);
      if (entry) {
        entry.emailedAt = timestamp;
        await db.dailyEntries.put(entry);
        updatedEntriesMap.set(entryId, entry);
      }
    }

    // Update state directly instead of reloading all entries
    const currentEntryId = get().currentEntry?.id;
    set({
      entries: get().entries.map(e => updatedEntriesMap.get(e.id) || e),
      // Update current entry if it's one of the marked entries
      currentEntry: currentEntryId && updatedEntriesMap.has(currentEntryId)
        ? updatedEntriesMap.get(currentEntryId)!
        : get().currentEntry
    });
  },

  // Cloud sync actions

  toggleCloudSync: (enabled) => {
    localStorage.setItem('pcal_sync_enabled', String(enabled));
    set({
      syncStatus: {
        ...get().syncStatus,
        syncEnabled: enabled,
      },
    });
  },

  checkCloudSyncAvailability: async () => {
    const available = await isCloudSyncAvailable();
    if (!available && get().syncStatus.syncEnabled) {
      // If sync was enabled but auth is no longer available, disable it
      set({
        syncStatus: {
          ...get().syncStatus,
          syncEnabled: false,
        },
      });
    }
  },

  syncToCloud: async () => {
    const { syncStatus } = get();

    if (!syncStatus.syncEnabled) {
      console.log('[Store] Cloud sync is disabled');
      return false;
    }

    if (syncStatus.isSyncing) {
      console.log('[Store] Sync already in progress');
      return false;
    }

    try {
      // Set syncing state
      set({
        syncStatus: {
          ...syncStatus,
          isSyncing: true,
          lastSyncError: null,
        },
      });

      // Get all local data
      const children = await db.children.toArray();
      const dailyEntries = await db.dailyEntries.toArray();
      const goals = await db.goals.toArray();

      // Sync to cloud
      const result = await syncUp({ children, dailyEntries, goals });

      if (result.success) {
        const lastSyncAt = result.lastSyncAt || new Date().toISOString();
        localStorage.setItem('pcal_last_sync_at', lastSyncAt);

        set({
          syncStatus: {
            ...get().syncStatus,
            isSyncing: false,
            lastSyncAt,
            lastSyncError: null,
          },
        });

        console.log('[Store] Sync to cloud successful');
        return true;
      } else {
        set({
          syncStatus: {
            ...get().syncStatus,
            isSyncing: false,
            lastSyncError: result.error || 'Unknown sync error',
          },
        });

        console.error('[Store] Sync to cloud failed:', result.error);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        syncStatus: {
          ...get().syncStatus,
          isSyncing: false,
          lastSyncError: errorMessage,
        },
      });

      console.error('[Store] Sync to cloud error:', error);
      return false;
    }
  },

  syncFromCloud: async () => {
    const { syncStatus } = get();

    if (!syncStatus.syncEnabled) {
      console.log('[Store] Cloud sync is disabled');
      return false;
    }

    if (syncStatus.isSyncing) {
      console.log('[Store] Sync already in progress');
      return false;
    }

    try {
      // Set syncing state
      set({
        syncStatus: {
          ...syncStatus,
          isSyncing: true,
          lastSyncError: null,
        },
      });

      // Fetch from cloud
      const result = await syncDown();

      if (result.success && result.data) {
        const { children, dailyEntries, goals } = result.data;

        // Merge cloud data into local IndexedDB
        // For children
        for (const child of children) {
          await db.children.put(child);
        }

        // For daily entries
        for (const entry of dailyEntries) {
          await db.dailyEntries.put(entry);
        }

        // For goals
        for (const goal of goals) {
          await db.goals.put(goal);
        }

        // Reload state from database
        await get().loadChildren();
        await get().loadEntries();
        await get().loadGoals();

        const lastSyncAt = result.lastSyncAt || new Date().toISOString();
        localStorage.setItem('pcal_last_sync_at', lastSyncAt);

        set({
          syncStatus: {
            ...get().syncStatus,
            isSyncing: false,
            lastSyncAt,
            lastSyncError: null,
          },
        });

        console.log('[Store] Sync from cloud successful');
        return true;
      } else {
        set({
          syncStatus: {
            ...get().syncStatus,
            isSyncing: false,
            lastSyncError: result.error || 'Unknown sync error',
          },
        });

        console.error('[Store] Sync from cloud failed:', result.error);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        syncStatus: {
          ...get().syncStatus,
          isSyncing: false,
          lastSyncError: errorMessage,
        },
      });

      console.error('[Store] Sync from cloud error:', error);
      return false;
    }
  },
}));

/**
 * Helper: Calculate time fields
 */
export function calculateTimeFields(
  startTime: string,
  endTime?: string,
  durationMinutes?: number
): { startTime: string; endTime: string; durationMinutes: number } {
  const baseDate = new Date(2000, 0, 1); // Arbitrary date for time calculation

  if (endTime) {
    // Mode 1: Start + End -> Duration
    const start = parse(startTime, 'HH:mm', baseDate);
    const end = parse(endTime, 'HH:mm', baseDate);
    const duration = differenceInMinutes(end, start);

    return {
      startTime,
      endTime,
      durationMinutes: duration
    };
  } else if (durationMinutes !== undefined) {
    // Mode 2: Start + Duration -> End
    const start = parse(startTime, 'HH:mm', baseDate);
    const end = add(start, { minutes: durationMinutes });
    const endTimeStr = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

    return {
      startTime,
      endTime: endTimeStr,
      durationMinutes
    };
  }

  // Default case
  return {
    startTime,
    endTime: startTime,
    durationMinutes: 0
  };
}
