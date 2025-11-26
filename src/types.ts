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
  aiSummaryProvider?: AIProvider; // Which AI provider generated the summary
  isLocked: boolean;
  emailedAt?: number;       // Timestamp when PDF was emailed
}

export interface ActivityLine {
  id: string;
  goalCode: number;
  selectedActivities: string[]; // From the custom goal's activities
  customNarrative: string;      // User input
  startTime: string;            // "09:00"
  endTime: string;              // "09:30"
  durationMinutes: number;      // 30
}

// --- 3. Goal Structure ---
export interface Goal {
  code: number;
  description: string;
  activities: string[];
}

// --- 4. Time Input Modes ---
export type TimeInputMode = 'start-duration' | 'start-end';

// --- 5. AI Service Types ---

// Predefined model options
export interface PredefinedModel {
  id: string;
  name: string;
  description: string;
  size: string;
}

export const PREDEFINED_MODELS: PredefinedModel[] = [
  {
    id: 'Xenova/flan-t5-small',
    name: 'FLAN-T5 Small',
    description: 'Lightweight and fast (default)',
    size: '~80 MB'
  },
  {
    id: 'Xenova/LaMini-Flan-T5-248M',
    name: 'LaMini FLAN-T5',
    description: 'Balanced performance',
    size: '~21 MB'
  },
  {
    id: 'Xenova/flan-t5-base',
    name: 'FLAN-T5 Base',
    description: 'Better quality, larger size',
    size: '~250 MB'
  },
  {
    id: 'Xenova/distilbart-cnn-6-6',
    name: 'DistilBART CNN',
    description: 'Optimized for summarization',
    size: '~300 MB'
  }
];

export interface AIServiceConfig {
  openAIKey?: string;
  selectedModel?: string; // Model ID (can be from predefined list or custom)
}

// --- 5.1 AI Generation Settings ---
export interface AIGenerationSettings {
  maxNewTokens: number;      // Max tokens to generate (default: 100)
  minLength: number;         // Minimum output length (default: 10)
  doSample: boolean;         // Use sampling vs greedy (default: false)
  temperature: number;       // Sampling temperature 0.1-2.0 (default: 0.7, only used if doSample is true)
  topP: number;              // Nucleus sampling 0.1-1.0 (default: 0.9, only used if doSample is true)
}

export const DEFAULT_AI_SETTINGS: AIGenerationSettings = {
  maxNewTokens: 100,
  minLength: 10,
  doSample: false,
  temperature: 0.7,
  topP: 0.9,
};

export type AIProvider = 'transformers-local' | 'openai-api' | 'fallback';

// --- 6. Model Loading State ---
export interface ModelLoadingState {
  isLoading: boolean;
  progress: number; // 0-100
  status: string;
  error?: string;
}
