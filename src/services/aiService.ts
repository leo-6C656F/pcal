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
  getLoadError
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
  getLoadError
};

/**
 * Generate a summary paragraph from activity lines
 */
export async function generateSummary(
  childName: string,
  lines: ActivityLine[],
  config: AIServiceConfig = {},
  onModelProgress?: (state: ModelLoadingState) => void
): Promise<{ summary: string; provider: AIProvider }> {
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
  if (config.openAIKey) {
    try {
      const summary = await tryOpenAI(childName, lines, config.openAIKey);
      console.log('[AI] Used OpenAI API');
      return { summary, provider: 'openai-api' };
    } catch (error) {
      console.error('[AI] OpenAI API failed:', error);
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
    const narrative = line.customNarrative ? ` (${line.customNarrative})` : '';
    return `- ${goal?.description || 'Development'}: ${activities}${narrative}`;
  }).join('\n');

  return `Write a concise, high-level summary in past tense describing developmental progress. Focus on what skills were developed, not specific activities or durations. Activities listed are examples of what the child did:\n${activitiesText}\n\nDo not include the child's name or time spent. Keep it professional and focused on developmental outcomes.`;
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
  apiKey: string
): Promise<string> {
  const activitiesJson = JSON.stringify(
    lines.map(line => ({
      goal: GOALS.find(g => g.code === line.goalCode)?.description,
      activities: line.selectedActivities,
      narrative: line.customNarrative
    })),
    null,
    2
  );

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional early childhood education specialist who writes concise developmental summaries. Write in past tense, focus on developmental outcomes rather than specific activities or durations. Do not include child names or time spent.'
        },
        {
          role: 'user',
          content: `Write a concise, high-level summary describing developmental progress. The activities listed are examples of what the child did. Focus on what skills were developed:\n\n${activitiesJson}`
        }
      ],
      max_tokens: 150
    })
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
    return 'Engaged in developmental activities today.';
  }

  const parts: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const goal = GOALS.find(g => g.code === line.goalCode);

    if (!goal) continue;

    const goalDesc = goal.description.toLowerCase();

    if (i === 0) {
      parts.push(`Focused on ${goalDesc}`);
    } else if (i === lines.length - 1) {
      parts.push(`also worked on ${goalDesc}`);
    } else {
      parts.push(`developed skills in ${goalDesc}`);
    }
  }

  const narrative = parts.join(', ') + '.';
  return `${narrative} Made progress across multiple developmental areas.`;
}
