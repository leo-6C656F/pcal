import type { ActivityLine, AIServiceConfig, AIProvider, ModelLoadingState } from '../types';
import { GOALS } from '../constants';
import {
  generateLocalSummary,
  initializeModel,
  isModelReady,
  preWarmModel
} from './transformersService';

/**
 * AI Service - Waterfall Logic
 * Tier 1: Transformers.js (local, works offline)
 * Tier 2: User's OpenAI API Key
 * Tier 3: Deterministic Fallback
 */

// Re-export for convenience
export { preWarmModel, isModelReady, initializeModel };

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
function buildPrompt(childName: string, lines: ActivityLine[]): string {
  const activitiesText = lines.map(line => {
    const goal = GOALS.find(g => g.code === line.goalCode);
    const activities = line.selectedActivities.join(', ') || 'activities';
    return `- ${goal?.description || 'Development'}: ${activities} (${line.durationMinutes} min)${line.customNarrative ? ` - ${line.customNarrative}` : ''}`;
  }).join('\n');

  return `Summarize these child development activities into one short paragraph in past tense for ${childName}:\n${activitiesText}`;
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
  childName: string,
  lines: ActivityLine[],
  apiKey: string
): Promise<string> {
  const activitiesJson = JSON.stringify(
    lines.map(line => ({
      goal: GOALS.find(g => g.code === line.goalCode)?.description,
      activities: line.selectedActivities,
      narrative: line.customNarrative,
      duration: line.durationMinutes
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
          content: 'You are a helpful assistant that writes concise child development summaries in past tense.'
        },
        {
          role: 'user',
          content: `Summarize these activities into one past-tense paragraph for a child development report. Child's name: ${childName}.\n\nActivities:\n${activitiesJson}`
        }
      ],
      max_tokens: 200
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
function generateDeterministicSummary(childName: string, lines: ActivityLine[]): string {
  if (lines.length === 0) {
    return `Parent worked with ${childName} today.`;
  }

  const totalMinutes = lines.reduce((sum, line) => sum + line.durationMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const timeString = totalHours > 0
    ? `${totalHours} hour${totalHours > 1 ? 's' : ''} and ${remainingMinutes} minutes`
    : `${remainingMinutes} minutes`;

  const parts: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const goal = GOALS.find(g => g.code === line.goalCode);

    if (!goal) continue;

    const activities = line.selectedActivities.length > 0
      ? line.selectedActivities.join(', ')
      : 'developmental activities';

    if (i === 0) {
      parts.push(
        `Parent worked with ${childName} on ${activities} to help ${goal.description.toLowerCase()}`
      );
    } else if (i === lines.length - 1) {
      parts.push(`They also did ${activities}`);
    } else {
      parts.push(`worked on ${activities}`);
    }
  }

  const narrative = parts.join('. ') + `.`;
  return `${narrative} Total time was ${timeString}.`;
}
