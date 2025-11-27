// --- 1. The Atomic Journal (Source of Truth) ---
export interface JournalEvent {
  id: string;          // UUID
  timestamp: number;   // Date.now()
  type: 'ENTRY_CREATED' | 'LINE_ADDED' | 'LINE_UPDATED' | 'LINE_DELETED' | 'SIGNATURE_SAVED' | 'AI_SUMMARY_GENERATED' | 'AI_SUMMARY_UPDATED' | 'PDF_EXPORTED';
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

// --- 5.0 AI Provider Mode ---
export type AIProviderMode = 'off' | 'local' | 'openai';

// OpenAI source: 'proxy' uses the secure server-side proxy, 'direct' uses user's API key
export type OpenAISource = 'proxy' | 'direct';

export interface AIServiceConfig {
  // Master toggle and provider selection
  aiEnabled?: boolean;              // Master toggle for AI features (default: true)
  providerMode?: AIProviderMode;    // Which provider to use: 'off', 'local', or 'openai'

  // OpenAI settings
  openAISource?: OpenAISource;      // 'proxy' (default) or 'direct' (user's API key)
  openAIKey?: string;               // User's API key (only used when openAISource is 'direct')
  selectedModel?: string;           // Model ID (can be from predefined list or custom)
  openAIModel?: string;             // OpenAI model to use (default: gpt-4o-mini)
  openAIBaseURL?: string;           // Custom OpenAI API base URL (only for direct mode)

  // Legacy field for backward compatibility
  providerPriority?: 'local-first' | 'openai-first';
}

// --- 5.1 AI Generation Settings ---
export interface AIGenerationSettings {
  // Basic settings
  maxNewTokens: number;      // Max tokens to generate (default: 100)
  minLength: number;         // Minimum output length (default: 10)

  // Sampling settings
  doSample: boolean;         // Use sampling vs greedy (default: false)
  temperature: number;       // Sampling temperature 0.1-2.0 (default: 0.7, only used if doSample is true)
  topP: number;              // Nucleus sampling 0.1-1.0 (default: 0.9, only used if doSample is true)
  topK: number;              // Top-K sampling (default: 50, only used if doSample is true)

  // Repetition control
  repetitionPenalty: number; // Penalize repetition 1.0-2.0 (default: 1.0, 1.0 = no penalty)
  noRepeatNgramSize: number; // Prevent repeating n-grams (default: 0, 0 = disabled)

  // Beam search settings
  numBeams: number;          // Number of beams for beam search (default: 1, 1 = no beam search)
  lengthPenalty: number;     // Length penalty for beam search (default: 1.0)
  earlyStopping: boolean;    // Stop when numBeams sentences are done (default: false)

  // OpenAI-specific settings
  frequencyPenalty: number;  // Penalize frequent tokens -2.0-2.0 (default: 0)
  presencePenalty: number;   // Penalize new topics -2.0-2.0 (default: 0)
  systemMessage: string;     // Custom system message for OpenAI (optional)
}

export const DEFAULT_AI_SETTINGS: AIGenerationSettings = {
  maxNewTokens: 100,
  minLength: 10,
  doSample: false,
  temperature: 0.7,
  topP: 0.9,
  topK: 50,
  repetitionPenalty: 1.0,
  noRepeatNgramSize: 0,
  numBeams: 1,
  lengthPenalty: 1.0,
  earlyStopping: false,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemMessage: '',
};

export type AIProvider = 'transformers-local' | 'openai-api' | 'openai-api-proxy' | 'fallback';

// --- 6. Model Loading State ---
export interface ModelLoadingState {
  isLoading: boolean;
  progress: number; // 0-100
  status: string;
  error?: string;
}
