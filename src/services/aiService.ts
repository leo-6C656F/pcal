import type { ActivityLine, AIServiceConfig, AIProvider, ModelLoadingState } from '../types';
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
 * AI Service - Waterfall Logic
 * Tier 1: Transformers.js (local, works offline)
 * Tier 2: User's OpenAI API Key
 * Tier 3: Deterministic Fallback
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
 * Load OpenAI config from localStorage
 */
function getOpenAIConfig(): AIServiceConfig {
  if (typeof window === 'undefined') {
    return {};
  }

  const saved = localStorage.getItem('openAIConfig');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  }
  return {};
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
  // Merge config with saved OpenAI config
  const openAIConfig = getOpenAIConfig();
  const mergedConfig = { ...openAIConfig, ...config };
  const providerPriority = mergedConfig.providerPriority || 'local-first';

  // Try providers based on priority
  if (providerPriority === 'openai-first') {
    // Try OpenAI first, then local, then fallback
    if (mergedConfig.openAIKey) {
      try {
        const summary = await tryOpenAI(childName, lines, mergedConfig);
        console.log('[AI] Used OpenAI API');
        return { summary, provider: 'openai-api' };
      } catch (error) {
        console.error('[AI] OpenAI API failed:', error);
      }
    }

    // Try local as fallback
    try {
      const summary = await tryTransformersLocal(childName, lines, onModelProgress);
      if (summary) {
        console.log('[AI] Used Transformers.js (local)');
        return { summary, provider: 'transformers-local' };
      }
    } catch (error) {
      console.log('[AI] Transformers.js not available:', error);
    }
  } else {
    // Default: local-first
    // Tier 1: Transformers.js (Local)
    try {
      const summary = await tryTransformersLocal(childName, lines, onModelProgress);
      if (summary) {
        console.log('[AI] Used Transformers.js (local)');
        return { summary, provider: 'transformers-local' };
      }
    } catch (error) {
      console.log('[AI] Transformers.js not available:', error);
    }

    // Tier 2: OpenAI API
    if (mergedConfig.openAIKey) {
      try {
        const summary = await tryOpenAI(childName, lines, mergedConfig);
        console.log('[AI] Used OpenAI API');
        return { summary, provider: 'openai-api' };
      } catch (error) {
        console.error('[AI] OpenAI API failed:', error);
      }
    }
  }

  // Tier 3: Deterministic Fallback (ALWAYS WORKS)
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
    return customPrompt.replace('{activities}', activitiesText);
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
 * Tier 1: Try Transformers.js (Local Model)
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
 * Tier 2: Try OpenAI API
 */
async function tryOpenAI(
  _childName: string,
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

  const activitiesJson = JSON.stringify(
    lines.map(line => ({
      goal: GOALS.find(g => g.code === line.goalCode)?.description,
      activities: line.selectedActivities,
      narrative: line.customNarrative
    })),
    null,
    2
  );

  // Build request body with settings
  const requestBody: Record<string, unknown> = {
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are a professional early childhood education specialist. Write concise summaries in past tense using ONLY the information provided. Do not make up or infer activities. Do not include child names or time spent. If custom notes are provided, integrate them naturally.'
      },
      {
        role: 'user',
        content: `Write one brief paragraph summarizing what was actually done. Use only the provided information:\n\n${activitiesJson}`
      }
    ],
    max_tokens: settings.maxNewTokens
  };

  // Add temperature if sampling is enabled
  if (settings.doSample) {
    requestBody.temperature = settings.temperature;
    requestBody.top_p = settings.topP;
  } else {
    requestBody.temperature = 0; // Greedy decoding
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
 * Tier 3: Deterministic Fallback (REQUIRED - Always works offline)
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
