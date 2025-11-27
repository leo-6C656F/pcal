/**
 * AI Summary API (Node.js Runtime)
 * Proxies OpenAI API requests to keep API keys secure on the server
 *
 * SECURITY: Requires Clerk authentication
 *
 * Endpoint: /api/ai-summary
 * Method: POST
 * Headers: Authorization: Bearer <clerk-session-token>
 * Body: { prompt: string, settings: AISettings }
 * Returns: OpenAI completion response
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_lib/auth.js';

export const config = {
  runtime: 'nodejs',
};

interface AISettings {
  model?: string;
  maxNewTokens?: number;
  temperature?: number;
  topP?: number;
  doSample?: boolean;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemMessage?: string;
}

interface RequestBody {
  prompt: string;
  settings?: AISettings;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    console.log('[AI Summary] Unauthorized request blocked');
    return res.status(401).json({
      error: 'Unauthorized - Valid authentication required'
    });
  }

  console.log(`[AI Summary] Authorized request from user: ${auth.userId}`);

  try {
    const body = req.body as RequestBody;
    const { prompt, settings = {} } = body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured on server'
      });
    }

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
    const model = settings.model || 'gpt-4o-mini';
    const requestBody: Record<string, unknown> = {
      model: model,
      messages: messages
    };

    // Use max_completion_tokens for newer models (GPT-5+, o1, o3)
    // Use max_tokens for older models (GPT-4, GPT-3.5)
    const isNewerModel = model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3');
    if (isNewerModel) {
      requestBody.max_completion_tokens = settings.maxNewTokens || 150;
    } else {
      requestBody.max_tokens = settings.maxNewTokens || 150;
    }

    // Add temperature if sampling is enabled
    if (settings.doSample !== false) {
      requestBody.temperature = settings.temperature || 0.7;
      requestBody.top_p = settings.topP || 0.9;
    } else {
      requestBody.temperature = 0; // Greedy decoding
    }

    // Add OpenAI-specific settings
    if (settings.frequencyPenalty && settings.frequencyPenalty !== 0) {
      requestBody.frequency_penalty = settings.frequencyPenalty;
    }
    if (settings.presencePenalty && settings.presencePenalty !== 0) {
      requestBody.presence_penalty = settings.presencePenalty;
    }

    console.log('[AI Summary] Calling OpenAI API with model:', requestBody.model);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AI Summary] OpenAI API error:', response.status, errorData);

      return res.status(response.status).json({
        error: 'OpenAI API error',
        status: response.status,
        details: errorData
      });
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }

    console.log('[AI Summary] Generated summary successfully');

    // Return the summary
    res.setHeader('Cache-Control', 'no-store'); // Don't cache AI responses
    return res.status(200).json({
      summary,
      provider: 'openai-api-proxy'
    });

  } catch (error) {
    console.error('[AI Summary] Error:', error);

    return res.status(500).json({
      error: 'Failed to generate summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
