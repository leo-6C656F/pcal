/**
 * Transformers.js Service
 * Local AI inference using Hugging Face Transformers in the browser
 *
 * Uses text2text-generation models for summarization tasks.
 * Models are cached in IndexedDB after first download.
 */

import { pipeline } from '@huggingface/transformers';
import type { ModelLoadingState, AIGenerationSettings } from '../types';
import { DEFAULT_AI_SETTINGS } from '../types';

// Default model configuration
const DEFAULT_MODEL_ID = 'Xenova/flan-t5-small';
const MODEL_STORAGE_KEY = 'selectedModelId';

// Singleton pipeline instance (using any to avoid complex union types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generatorPipeline: any = null;
let isLoading = false;
let loadError: string | null = null;
let currentModelId: string | null = null; // Track which model is currently loaded

// Progress callback type
type ProgressCallback = (state: ModelLoadingState) => void;

// Progress info from Transformers.js
interface ProgressInfo {
  status: string;
  progress?: number;
  file?: string;
}

/**
 * Initialize the Transformers.js pipeline
 * Downloads and caches the model on first use
 */
export async function initializeModel(
  onProgress?: ProgressCallback
): Promise<boolean> {
  const selectedModelId = getSelectedModelId();

  // Check if a different model is loaded, unload it
  if (generatorPipeline && currentModelId !== selectedModelId) {
    console.log(`[Transformers.js] Switching from ${currentModelId} to ${selectedModelId}`);
    unloadModel();
  }

  // Already loaded with correct model
  if (generatorPipeline && currentModelId === selectedModelId) {
    onProgress?.({
      isLoading: false,
      progress: 100,
      status: 'Model ready'
    });
    return true;
  }

  // Currently loading
  if (isLoading) {
    return false;
  }

  isLoading = true;
  loadError = null;

  try {
    onProgress?.({
      isLoading: true,
      progress: 0,
      status: 'Loading AI model...'
    });

    generatorPipeline = await pipeline('text2text-generation', selectedModelId, {
      progress_callback: (progress: ProgressInfo) => {
        if (progress.status === 'progress' && progress.progress !== undefined) {
          onProgress?.({
            isLoading: true,
            progress: Math.round(progress.progress),
            status: `Downloading ${progress.file || 'model'}...`
          });
        } else if (progress.status === 'ready') {
          onProgress?.({
            isLoading: false,
            progress: 100,
            status: 'Model ready'
          });
        } else if (progress.status === 'initiate') {
          onProgress?.({
            isLoading: true,
            progress: 0,
            status: `Initializing ${progress.file || 'model'}...`
          });
        }
      }
    });

    currentModelId = selectedModelId;
    isLoading = false;
    console.log('[Transformers.js] Model loaded successfully:', selectedModelId);
    return true;
  } catch (error) {
    isLoading = false;
    currentModelId = null;
    loadError = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Transformers.js] Failed to load model:', error);

    onProgress?.({
      isLoading: false,
      progress: 0,
      status: 'Failed to load model',
      error: loadError
    });

    return false;
  }
}

/**
 * Check if the model is ready for inference
 */
export function isModelReady(): boolean {
  return generatorPipeline !== null;
}

/**
 * Get the last load error if any
 */
export function getLoadError(): string | null {
  return loadError;
}

/**
 * Get AI generation settings from localStorage
 */
export function getAISettings(): AIGenerationSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_AI_SETTINGS;
  }

  const saved = localStorage.getItem('aiGenerationSettings');
  if (saved) {
    try {
      return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_AI_SETTINGS;
    }
  }
  return DEFAULT_AI_SETTINGS;
}

/**
 * Save AI generation settings to localStorage
 */
export function saveAISettings(settings: AIGenerationSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('aiGenerationSettings', JSON.stringify(settings));
  }
}

/**
 * Get the currently selected model ID from localStorage
 */
export function getSelectedModelId(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_MODEL_ID;
  }

  const saved = localStorage.getItem(MODEL_STORAGE_KEY);
  return saved || DEFAULT_MODEL_ID;
}

/**
 * Save the selected model ID to localStorage
 * Note: Changing the model will require reloading the pipeline
 */
export function setSelectedModelId(modelId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  }
}

/**
 * Generate a summary using the local Transformers.js model
 */
export async function generateLocalSummary(prompt: string, settings?: AIGenerationSettings): Promise<string | null> {
  if (!generatorPipeline) {
    // Try to initialize if not ready
    const initialized = await initializeModel();
    if (!initialized || !generatorPipeline) {
      return null;
    }
  }

  // Use provided settings or get from localStorage
  const genSettings = settings || getAISettings();

  try {
    // Build generation options
    const generationOptions: Record<string, unknown> = {
      max_new_tokens: genSettings.maxNewTokens,
      min_length: genSettings.minLength,
      do_sample: genSettings.doSample,
    };

    // Add sampling parameters only if sampling is enabled
    if (genSettings.doSample) {
      generationOptions.temperature = genSettings.temperature;
      generationOptions.top_p = genSettings.topP;
    }

    const result = await generatorPipeline(prompt, generationOptions);

    // Result is an array with generated_text
    if (Array.isArray(result) && result.length > 0) {
      const output = result[0];
      if (typeof output === 'object' && 'generated_text' in output) {
        return (output.generated_text as string).trim();
      }
    }

    return null;
  } catch (error) {
    console.error('[Transformers.js] Generation failed:', error);
    return null;
  }
}

/**
 * Pre-warm the model (call on app load for better UX)
 */
export async function preWarmModel(onProgress?: ProgressCallback): Promise<void> {
  if (generatorPipeline || isLoading) {
    return;
  }

  console.log('[Transformers.js] Pre-warming model...');
  await initializeModel(onProgress);
}

/**
 * Clear the cached model from IndexedDB
 * This will force a fresh download on next initialization
 */
export async function clearModelCache(): Promise<void> {
  try {
    // Reset in-memory pipeline
    generatorPipeline = null;
    currentModelId = null;
    loadError = null;
    isLoading = false;

    // Clear IndexedDB cache (Transformers.js uses 'transformers-cache' database)
    const databases = await indexedDB.databases();
    const transformersDBs = databases.filter(db =>
      db.name?.includes('transformers') || db.name?.includes('huggingface')
    );

    for (const db of transformersDBs) {
      if (db.name) {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db.name!);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        console.log(`[Transformers.js] Cleared cache: ${db.name}`);
      }
    }

    console.log('[Transformers.js] Model cache cleared successfully');
  } catch (error) {
    console.error('[Transformers.js] Failed to clear cache:', error);
    throw error;
  }
}

/**
 * Get estimated cache size (approximation based on model size)
 */
export async function getModelCacheSize(): Promise<number> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      // Model is approximately 21MB (based on build output)
      return estimate.usage || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Unload the model from memory (doesn't clear cache)
 */
export function unloadModel(): void {
  generatorPipeline = null;
  currentModelId = null;
  loadError = null;
  console.log('[Transformers.js] Model unloaded from memory');
}
