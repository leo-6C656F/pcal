import type { ActivityLine, AIServiceConfig, AIProvider, ModelLoadingState, AIProviderMode } from '../types';
import { GOALS } from '../constants';
import {
  generateLocalSummary,
  initializeModel,
  isModelReady,
  preWarmModel,
  clearModelCache,
  getModelCacheSize,
  unloadModel,
  getLoadError,
  getAISettings,
  saveAISettings
} from './transformersService';

/**
 * AI Service - Provider-based Logic
 * User explicitly selects provider mode:
 * - 'off': AI disabled
 * - 'local': Transformers.js (local, works offline)
 * - 'openai': OpenAI API (via proxy or direct based on openAISource) - DEFAULT
 *
 * Defaults to OpenAI proxy. Local model only downloads when user explicitly selects it.
 * Falls back to deterministic summary if selected provider fails.
 */

// Re-export for convenience
export {
  preWarmModel,
  isModelReady,
  initializeModel,
  clearModelCache,
  getModelCacheSize,
  unloadModel,
  getLoadError,
  getAISettings,
  saveAISettings
};

/**
 * Load AI config from localStorage
 */
function getAIConfig(): AIServiceConfig {
  if (typeof window === 'undefined') {
    return { aiEnabled: true, providerMode: 'openai', openAISource: 'proxy' };
  }

  const saved = localStorage.getItem('openAIConfig');
  if (saved) {
    try {
      const config = JSON.parse(saved);
      return {
        aiEnabled: config.aiEnabled !== false,
        providerMode: config.providerMode || 'openai',
        openAISource: config.openAISource || 'proxy',
        openAIKey: config.openAIKey,
        openAIModel: config.openAIModel,
        openAIBaseURL: config.openAIBaseURL,
        // Legacy support
        providerPriority: config.providerPriority
      };
    } catch {
      return { aiEnabled: true, providerMode: 'openai', openAISource: 'proxy' };
    }
  }
  return { aiEnabled: true, providerMode: 'openai', openAISource: 'proxy' };
}

/**
 * Check if AI is enabled
 */
export function isAIEnabled(): boolean {
  const config = getAIConfig();
  return config.aiEnabled !== false;
}

/**
 * Get current provider mode
 */
export function getProviderMode(): AIProviderMode {
  const config = getAIConfig();
  return config.providerMode || 'openai';
}

/**
 * Get the API URL for AI summary proxy
 * In production (Vercel): uses Edge Function /api/ai-summary
 * In development: can use proxy or direct OpenAI (based on config)
 */
function getAIProxyUrl(): string {
  // If custom server URL is set, use it
  if (import.meta.env.VITE_SERVER_URL) {
    return `${import.meta.env.VITE_SERVER_URL}/api/ai-summary`;
  }

  // In production, use same domain (Vercel Edge Function)
  if (import.meta.env.PROD) {
    return '/api/ai-summary';
  }

  // In development, use localhost (if Vercel dev is running)
  // Otherwise falls back to direct OpenAI API
  return 'http://localhost:3000/api/ai-summary';
}

/**
 * Generate a summary paragraph from activity lines
 */
export async function generateSummary(
  childName: string,
  lines: ActivityLine[],
  config: AIServiceConfig = {},
  onModelProgress?: (state: ModelLoadingState) => void
): Promise<{ summary: string; provider: AIProvider }> {
  // Load config from localStorage and merge with passed config
  const storedConfig = getAIConfig();
  const mergedConfig = { ...storedConfig, ...config };

  // Check if AI is disabled
  if (mergedConfig.aiEnabled === false) {
    const summary = generateDeterministicSummary(childName, lines);
    console.log('[AI] AI is disabled, using Deterministic Fallback');
    return { summary, provider: 'fallback' };
  }

  const providerMode = mergedConfig.providerMode || 'openai';
  const openAISource = mergedConfig.openAISource || 'proxy';

  // Handle based on provider mode
  if (providerMode === 'local') {
    // Try local model
    try {
      const summary = await tryTransformersLocal(childName, lines, onModelProgress);
      if (summary) {
        console.log('[AI] Used Transformers.js (local)');
        return { summary, provider: 'transformers-local' };
      }
    } catch (error) {
      console.log('[AI] Transformers.js failed:', error);
    }
  } else if (providerMode === 'openai') {
    // Try OpenAI based on source preference
    if (openAISource === 'proxy') {
      // Try proxy first
      try {
        const summary = await tryOpenAIProxy(childName, lines, mergedConfig);
        console.log('[AI] Used OpenAI API (via Edge proxy)');
        return { summary, provider: 'openai-api-proxy' };
      } catch (error) {
        console.log('[AI] OpenAI proxy failed:', error);

        // Fall back to direct if user has API key
        if (mergedConfig.openAIKey) {
          try {
            const summary = await tryOpenAI(childName, lines, mergedConfig);
            console.log('[AI] Used OpenAI API (direct) as fallback');
            return { summary, provider: 'openai-api' };
          } catch (directError) {
            console.error('[AI] OpenAI direct also failed:', directError);
          }
        }
      }
    } else {
      // Direct mode - use user's API key
      if (mergedConfig.openAIKey) {
        try {
          const summary = await tryOpenAI(childName, lines, mergedConfig);
          console.log('[AI] Used OpenAI API (direct)');
          return { summary, provider: 'openai-api' };
        } catch (error) {
          console.error('[AI] OpenAI API failed:', error);
        }
      } else {
        console.log('[AI] No API key provided for direct mode');
      }
    }
  }

  // Legacy support: handle old providerPriority setting
  if (mergedConfig.providerPriority && !mergedConfig.providerMode) {
    if (mergedConfig.providerPriority === 'openai-first') {
      // Try OpenAI first
      try {
        const summary = await tryOpenAIProxy(childName, lines, mergedConfig);
        console.log('[AI] Used OpenAI API (via Edge proxy) - legacy mode');
        return { summary, provider: 'openai-api-proxy' };
      } catch {
        // Fall through to local
      }

      if (mergedConfig.openAIKey) {
        try {
          const summary = await tryOpenAI(childName, lines, mergedConfig);
          console.log('[AI] Used OpenAI API (direct) - legacy mode');
          return { summary, provider: 'openai-api' };
        } catch {
          // Fall through to local
        }
      }

      try {
        const summary = await tryTransformersLocal(childName, lines, onModelProgress);
        if (summary) {
          console.log('[AI] Used Transformers.js (local) - legacy mode');
          return { summary, provider: 'transformers-local' };
        }
      } catch {
        // Fall through to deterministic
      }
    } else {
      // local-first (default legacy behavior)
      try {
        const summary = await tryTransformersLocal(childName, lines, onModelProgress);
        if (summary) {
          console.log('[AI] Used Transformers.js (local) - legacy mode');
          return { summary, provider: 'transformers-local' };
        }
      } catch {
        // Fall through
      }

      try {
        const summary = await tryOpenAIProxy(childName, lines, mergedConfig);
        console.log('[AI] Used OpenAI API (via Edge proxy) - legacy mode');
        return { summary, provider: 'openai-api-proxy' };
      } catch {
        // Fall through
      }

      if (mergedConfig.openAIKey) {
        try {
          const summary = await tryOpenAI(childName, lines, mergedConfig);
          console.log('[AI] Used OpenAI API (direct) - legacy mode');
          return { summary, provider: 'openai-api' };
        } catch {
          // Fall through
        }
      }
    }
  }

  // Final fallback: Deterministic (ALWAYS WORKS)
  const summary = generateDeterministicSummary(childName, lines);
  console.log('[AI] Used Deterministic Fallback');
  return { summary, provider: 'fallback' };
}

/**
 * Build the prompt for summarization
 */
function buildPrompt(_childName: string, lines: ActivityLine[]): string {
  const activitiesText = lines.map(line => {
    const goal = GOALS.find(g => g.code === line.goalCode);
    const activities = line.selectedActivities.join(', ') || 'activities';
    // Include custom narrative if provided for context
    const narrative = line.customNarrative ? ` - ${line.customNarrative}` : '';
    return `- ${goal?.description || 'Development'}: ${activities}${narrative}`;
  }).join('\n');

  // Get custom prompt from localStorage or use default
  const customPrompt = typeof window !== 'undefined'
    ? localStorage.getItem('aiPromptTemplate')
    : null;

  if (customPrompt) {
    return customPrompt.replaceAll('{activities}', activitiesText);
  }

  // Default prompt
  return `Rewrite the activities below into one concise sentence in past tense describing only what the parent did.
Follow these strict rules:
- Use ONLY the actions written.
- Do NOT mention the child.
- Do NOT talk about goals, communication, development, or purpose.
- Do NOT add, infer, or interpret anything not written.
- Do NOT mention time or duration.
- Generalize parentheses details (e.g., "Mirror play (eyes, nose, mouth)" → "Parent did mirror play." or "Using sign language (more, all done)" → "Parent practiced sign language.").

Example input: Repetition with songs (Brown Bear)
Example output: Parent practiced repetition with songs.

Activities to rewrite:
${activitiesText}

Final sentence:`;
}

/**
 * Try Transformers.js (Local Model)
 */
async function tryTransformersLocal(
  childName: string,
  lines: ActivityLine[],
  onProgress?: (state: ModelLoadingState) => void
): Promise<string | null> {
  // Initialize model if needed (will use cached model if available)
  if (!isModelReady()) {
    const initialized = await initializeModel(onProgress);
    if (!initialized) {
      return null;
    }
  }

  const prompt = buildPrompt(childName, lines);
  return await generateLocalSummary(prompt);
}

/**
 * Try OpenAI API via Edge Function Proxy (Secure)
 * This keeps the API key on the server and uses Edge runtime for speed
 */
async function tryOpenAIProxy(
  childName: string,
  lines: ActivityLine[],
  config: AIServiceConfig
): Promise<string> {
  const settings = getAISettings();
  const prompt = buildPrompt(childName, lines);

  const proxyUrl = getAIProxyUrl();
  console.log('[AI] Attempting OpenAI proxy at:', proxyUrl);

  // Import Clerk auth helper dynamically
  const { authenticatedFetch } = await import('../lib/clerk-auth');

  const response = await authenticatedFetch(proxyUrl, {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      settings: {
        model: config.openAIModel || 'gpt-4o-mini',
        maxNewTokens: settings.maxNewTokens,
        temperature: settings.temperature,
        topP: settings.topP,
        doSample: settings.doSample,
        frequencyPenalty: settings.frequencyPenalty,
        presencePenalty: settings.presencePenalty,
        systemMessage: settings.systemMessage
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Proxy error: ${response.status}`);
  }

  const data = await response.json();
  return data.summary;
}

/**
 * Try OpenAI API directly (uses user-provided API key)
 */
async function tryOpenAI(
  childName: string,
  lines: ActivityLine[],
  config: AIServiceConfig
): Promise<string> {
  const settings = getAISettings();
  const apiKey = config.openAIKey;
  const model = config.openAIModel || 'gpt-4o-mini';
  const baseURL = config.openAIBaseURL || 'https://api.openai.com/v1';

  if (!apiKey) {
    throw new Error('OpenAI API key not provided');
  }

  // Use the same prompt builder as local model to respect custom prompts
  const prompt = buildPrompt(childName, lines);

  // Build messages array
  const messages: Array<{ role: string; content: string }> = [];

  // Add system message if provided
  if (settings.systemMessage && settings.systemMessage.trim()) {
    messages.push({
      role: 'system',
      content: settings.systemMessage.trim()
    });
  }

  messages.push({
    role: 'user',
    content: prompt
  });

  // Build request body with settings
  const requestBody: Record<string, unknown> = {
    model: model,
    messages: messages,
    max_tokens: settings.maxNewTokens
  };

  // Add temperature if sampling is enabled
  if (settings.doSample) {
    requestBody.temperature = settings.temperature;
    requestBody.top_p = settings.topP;
  } else {
    requestBody.temperature = 0; // Greedy decoding
  }

  // Add OpenAI-specific settings
  if (settings.frequencyPenalty !== 0) {
    requestBody.frequency_penalty = settings.frequencyPenalty;
  }
  if (settings.presencePenalty !== 0) {
    requestBody.presence_penalty = settings.presencePenalty;
  }

  const endpoint = `${baseURL}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Deterministic Fallback (REQUIRED - Always works offline)
 */
function generateDeterministicSummary(_childName: string, lines: ActivityLine[]): string {
  if (lines.length === 0) {
    return 'Engaged in developmental activities.';
  }

  const parts: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const goal = GOALS.find(g => g.code === line.goalCode);

    if (!goal) continue;

    // Use actual activities selected
    const activities = line.selectedActivities.length > 0
      ? line.selectedActivities.join(' and ')
      : 'activities';

    // Include custom narrative if provided
    const narrative = line.customNarrative
      ? ` (${line.customNarrative})`
      : '';

    if (i === 0) {
      parts.push(`Worked on ${activities}${narrative}`);
    } else {
      parts.push(`${activities}${narrative}`);
    }
  }

  return parts.join(', ') + '.';
}
