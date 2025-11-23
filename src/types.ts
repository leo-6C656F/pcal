// --- 1. The Atomic Journal (Source of Truth) ---
export interface JournalEvent {
  id: string;          // UUID
  timestamp: number;   // Date.now()
  type: 'ENTRY_CREATED' | 'LINE_ADDED' | 'LINE_UPDATED' | 'LINE_DELETED' | 'SIGNATURE_SAVED' | 'PDF_EXPORTED';
  payload: any;        // The data for the event
  checksum: string;    // SHA-256 of the payload (integrity)
}

// --- 2. The Application State (Derived) ---
export interface ChildContext {
  id: string;
  name: string;
  center: string;
  teacher: string;
}

export interface DailyEntry {
  id: string;          // UUID
  date: string;        // "YYYY-MM-DD"
  childId: string;
  lines: ActivityLine[];
  signatureBase64?: string; // PNG Data URL
  aiSummary?: string;       // Generated narrative
  isLocked: boolean;
}

export interface ActivityLine {
  id: string;
  goalCode: 1 | 2 | 3 | 4 | 5 | 6;
  selectedActivities: string[]; // From the hardcoded list
  customNarrative: string;      // User input
  startTime: string;            // "09:00"
  endTime: string;              // "09:30"
  durationMinutes: number;      // 30
}

// --- 3. Goal Structure ---
export interface Goal {
  code: 1 | 2 | 3 | 4 | 5 | 6;
  description: string;
  activities: string[];
}

// --- 4. Time Input Modes ---
export type TimeInputMode = 'start-duration' | 'start-end';

// --- 5. AI Service Types ---
export interface AIServiceConfig {
  openAIKey?: string;
}

export type AIProvider = 'browser-native' | 'openai-api' | 'fallback';
