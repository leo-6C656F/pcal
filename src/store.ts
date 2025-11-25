import { create } from 'zustand';
import type { DailyEntry, ChildContext, ActivityLine, AIServiceConfig, Goal } from './types';
import { db, generateId, addJournalEvent } from './db';
import { generateSummary } from './services/aiService';
import { add, parse, differenceInMinutes } from 'date-fns';

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

  // Actions
  setCurrentChild: (child: ChildContext | null) => void;
  setCurrentEntry: (entry: DailyEntry | null) => void;
  loadChildren: () => Promise<void>;
  loadEntries: () => Promise<void>;
  loadGoals: () => Promise<void>;
  createChild: (child: Omit<ChildContext, 'id'>) => Promise<ChildContext>;
  updateChild: (id: string, updates: Partial<ChildContext>) => Promise<void>;
  createEntry: (date: string, childId: string) => Promise<DailyEntry>;
  addActivityLine: (entryId: string, line: Omit<ActivityLine, 'id'>) => Promise<void>;
  updateActivityLine: (entryId: string, lineId: string, updates: Partial<ActivityLine>) => Promise<void>;
  deleteActivityLine: (entryId: string, lineId: string) => Promise<void>;
  saveSignature: (entryId: string, signatureBase64: string) => Promise<void>;
  generateAISummary: (entryId: string) => Promise<void>;
  setAIConfig: (config: AIServiceConfig) => void;
  saveGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (code: number) => Promise<void>;
  clearAllGoals: () => Promise<void>;
  markEntriesAsSent: (entryIds: string[]) => Promise<void>;
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
    await get().loadChildren();

    return child;
  },

  updateChild: async (id, updates) => {
    const child = await db.children.get(id);
    if (child) {
      const updatedChild = { ...child, ...updates };
      await db.children.put(updatedChild);
      await get().loadChildren();

      // Update current child if it's the one being edited
      if (get().currentChild?.id === id) {
        get().setCurrentChild(updatedChild);
      }
    }
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
    await get().loadEntries();

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
      await get().loadEntries();

      // Update current entry if it's the one being edited
      if (get().currentEntry?.id === entryId) {
        set({ currentEntry: entry });
      }
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
        await get().loadEntries();

        // Update current entry if it's the one being edited
        if (get().currentEntry?.id === entryId) {
          set({ currentEntry: entry });
        }
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
      await get().loadEntries();

      // Update current entry if it's the one being edited
      if (get().currentEntry?.id === entryId) {
        set({ currentEntry: entry });
      }
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
      await get().loadEntries();

      // Update current entry if it's the one being edited
      if (get().currentEntry?.id === entryId) {
        set({ currentEntry: entry });
      }
    }
  },

  generateAISummary: async (entryId) => {
    const entry = await db.dailyEntries.get(entryId);
    const child = get().currentChild;

    if (!entry || !child) return;

    const { summary } = await generateSummary(child.name, entry.lines, get().aiConfig);

    entry.aiSummary = summary;
    await db.dailyEntries.put(entry);
    await get().loadEntries();

    // Update current entry if it's the one being edited
    if (get().currentEntry?.id === entryId) {
      set({ currentEntry: entry });
    }
  },

  setAIConfig: (config) => set({ aiConfig: config }),

  saveGoal: async (goal) => {
    await db.goals.put(goal);
    await get().loadGoals();
  },

  deleteGoal: async (code) => {
    await db.goals.delete(code);
    await get().loadGoals();
  },

  clearAllGoals: async () => {
    await db.goals.clear();
    await get().loadGoals();
  },

  markEntriesAsSent: async (entryIds) => {
    const timestamp = Date.now();

    for (const entryId of entryIds) {
      const entry = await db.dailyEntries.get(entryId);
      if (entry) {
        entry.emailedAt = timestamp;
        await db.dailyEntries.put(entry);
      }
    }

    await get().loadEntries();

    // Update current entry if it's one of the marked entries
    const currentEntry = get().currentEntry;
    if (currentEntry && entryIds.includes(currentEntry.id)) {
      const updatedEntry = await db.dailyEntries.get(currentEntry.id);
      if (updatedEntry) {
        set({ currentEntry: updatedEntry });
      }
    }
  }
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
