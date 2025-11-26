import { db } from '../db';
import type { ChildContext, DailyEntry, Goal, JournalEvent } from '../types';

/**
 * Data Export/Import Service
 * Handles full backup and restore of PCAL data
 */

// Export format version for future compatibility
const EXPORT_VERSION = 1;

export interface ExportData {
  version: number;
  exportedAt: number;
  appName: string;
  data: {
    children: ChildContext[];
    dailyEntries: DailyEntry[];
    goals: Goal[];
    journal: JournalEvent[];
  };
  openAIConfig?: {
    openAIKey: string;
    openAIModel: string;
    openAIBaseURL: string;
    providerPriority: string;
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    children: number;
    entries: number;
    goals: number;
    journalEvents: number;
  };
}

/**
 * Export all application data to a JSON object
 */
export async function exportAllData(includeOpenAI: boolean = false): Promise<ExportData> {
  const [children, dailyEntries, goals, journal] = await Promise.all([
    db.children.toArray(),
    db.dailyEntries.toArray(),
    db.goals.toArray(),
    db.journal.toArray(),
  ]);

  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    appName: 'PCAL',
    data: {
      children,
      dailyEntries,
      goals,
      journal,
    },
  };

  // Optionally include OpenAI configuration
  if (includeOpenAI) {
    const savedOpenAIConfig = localStorage.getItem('openAIConfig');
    if (savedOpenAIConfig) {
      try {
        exportData.openAIConfig = JSON.parse(savedOpenAIConfig);
      } catch (e) {
        console.error('Failed to parse OpenAI config during export:', e);
      }
    }
  }

  return exportData;
}

/**
 * Download export data as a JSON file
 */
export async function downloadExport(includeOpenAI: boolean = false): Promise<void> {
  const exportData = await exportAllData(includeOpenAI);
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const filename = `pcal-backup-${date}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate import data structure
 */
function validateImportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== 'number') return false;
  if (obj.appName !== 'PCAL') return false;
  if (!obj.data || typeof obj.data !== 'object') return false;

  const dataObj = obj.data as Record<string, unknown>;

  if (!Array.isArray(dataObj.children)) return false;
  if (!Array.isArray(dataObj.dailyEntries)) return false;
  if (!Array.isArray(dataObj.goals)) return false;
  if (!Array.isArray(dataObj.journal)) return false;

  return true;
}

/**
 * Validate individual child record
 */
function isValidChild(child: unknown): child is ChildContext {
  if (!child || typeof child !== 'object') return false;
  const c = child as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.center === 'string' &&
    typeof c.teacher === 'string'
  );
}

/**
 * Validate individual daily entry record
 */
function isValidDailyEntry(entry: unknown): entry is DailyEntry {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.date === 'string' &&
    typeof e.childId === 'string' &&
    Array.isArray(e.lines) &&
    typeof e.isLocked === 'boolean'
  );
}

/**
 * Validate individual goal record
 */
function isValidGoal(goal: unknown): goal is Goal {
  if (!goal || typeof goal !== 'object') return false;
  const g = goal as Record<string, unknown>;
  return (
    typeof g.code === 'number' &&
    typeof g.description === 'string' &&
    Array.isArray(g.activities)
  );
}

/**
 * Validate individual journal event record
 */
function isValidJournalEvent(event: unknown): event is JournalEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.timestamp === 'number' &&
    typeof e.type === 'string' &&
    typeof e.checksum === 'string'
  );
}

export type ImportMode = 'replace' | 'merge';

/**
 * Import data from a JSON file
 * @param file - The file to import
 * @param mode - 'replace' clears all existing data, 'merge' adds new data
 */
export async function importData(file: File, mode: ImportMode): Promise<ImportResult> {
  try {
    const text = await file.text();
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Invalid JSON file. Please select a valid PCAL backup file.',
      };
    }

    if (!validateImportData(parsed)) {
      return {
        success: false,
        message: 'Invalid backup file format. Please select a valid PCAL backup file.',
      };
    }

    // Validate individual records
    const validChildren = parsed.data.children.filter(isValidChild);
    const validEntries = parsed.data.dailyEntries.filter(isValidDailyEntry);
    const validGoals = parsed.data.goals.filter(isValidGoal);
    const validJournal = parsed.data.journal.filter(isValidJournalEvent);

    // Check if any records were invalid
    const invalidCount =
      (parsed.data.children.length - validChildren.length) +
      (parsed.data.dailyEntries.length - validEntries.length) +
      (parsed.data.goals.length - validGoals.length) +
      (parsed.data.journal.length - validJournal.length);

    if (invalidCount > 0) {
      console.warn(`Skipped ${invalidCount} invalid records during import`);
    }

    // Perform the import
    if (mode === 'replace') {
      // Clear all existing data
      await Promise.all([
        db.children.clear(),
        db.dailyEntries.clear(),
        db.goals.clear(),
        db.journal.clear(),
      ]);

      // Add all imported data
      await Promise.all([
        validChildren.length > 0 ? db.children.bulkAdd(validChildren) : Promise.resolve(),
        validEntries.length > 0 ? db.dailyEntries.bulkAdd(validEntries) : Promise.resolve(),
        validGoals.length > 0 ? db.goals.bulkAdd(validGoals) : Promise.resolve(),
        validJournal.length > 0 ? db.journal.bulkAdd(validJournal) : Promise.resolve(),
      ]);
    } else {
      // Merge mode: only add records that don't exist
      const existingChildIds = new Set((await db.children.toArray()).map(c => c.id));
      const existingEntryIds = new Set((await db.dailyEntries.toArray()).map(e => e.id));
      const existingGoalCodes = new Set((await db.goals.toArray()).map(g => g.code));
      const existingJournalIds = new Set((await db.journal.toArray()).map(j => j.id));

      const newChildren = validChildren.filter(c => !existingChildIds.has(c.id));
      const newEntries = validEntries.filter(e => !existingEntryIds.has(e.id));
      const newGoals = validGoals.filter(g => !existingGoalCodes.has(g.code));
      const newJournal = validJournal.filter(j => !existingJournalIds.has(j.id));

      await Promise.all([
        newChildren.length > 0 ? db.children.bulkAdd(newChildren) : Promise.resolve(),
        newEntries.length > 0 ? db.dailyEntries.bulkAdd(newEntries) : Promise.resolve(),
        newGoals.length > 0 ? db.goals.bulkAdd(newGoals) : Promise.resolve(),
        newJournal.length > 0 ? db.journal.bulkAdd(newJournal) : Promise.resolve(),
      ]);
    }

    // Import OpenAI configuration if present
    if (parsed.openAIConfig) {
      localStorage.setItem('openAIConfig', JSON.stringify(parsed.openAIConfig));
    }

    return {
      success: true,
      message: mode === 'replace' ? 'Data restored successfully!' : 'Data merged successfully!',
      stats: {
        children: validChildren.length,
        entries: validEntries.length,
        goals: validGoals.length,
        journalEvents: validJournal.length,
      },
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      message: 'An error occurred during import. Please try again.',
    };
  }
}

/**
 * Read a file and parse as import data (for preview)
 */
export async function parseImportFile(file: File): Promise<{
  valid: boolean;
  data?: ExportData;
  error?: string;
}> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!validateImportData(parsed)) {
      return {
        valid: false,
        error: 'Invalid backup file format',
      };
    }

    return {
      valid: true,
      data: parsed,
    };
  } catch {
    return {
      valid: false,
      error: 'Invalid JSON file',
    };
  }
}

/**
 * Get statistics about current data
 */
export async function getDataStats(): Promise<{
  children: number;
  entries: number;
  goals: number;
  journalEvents: number;
}> {
  const [children, entries, goals, journal] = await Promise.all([
    db.children.count(),
    db.dailyEntries.count(),
    db.goals.count(),
    db.journal.count(),
  ]);

  return {
    children,
    entries,
    goals,
    journalEvents: journal,
  };
}
