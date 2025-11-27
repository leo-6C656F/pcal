/**
 * Vercel Edge Function
 * Proxies OpenAI API requests to keep API keys secure on the server
 * Uses Edge runtime for global low-latency responses
 *
 * SECURITY: Requires Clerk authentication
 *
 * Endpoint: /api/ai-summary
 * Method: POST
 * Headers: Authorization: Bearer <clerk-session-token>
 * Body: { prompt: string, settings: AISettings }
 * Returns: OpenAI completion response
 */

import { verifyAuth, unauthorizedResponse } from './_lib/auth-edge.js';

export const config = {
  runtime: 'edge',
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

export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    console.log('[AI Summary] Unauthorized request blocked');
    return unauthorizedResponse();
  }

  console.log(`[AI Summary] Authorized request from user: ${auth.userId}`);

  try {
    const body = await req.json() as RequestBody;
    const { prompt, settings = {} } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured on server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
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

    console.log('[Edge AI] Calling OpenAI API with model:', requestBody.model);

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
      console.error('[Edge AI] OpenAI API error:', response.status, errorData);

      return new Response(
        JSON.stringify({
          error: 'OpenAI API error',
          status: response.status,
          details: errorData
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim();

    if (!summary) {
      return new Response(
        JSON.stringify({ error: 'No response from OpenAI' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Edge AI] Generated summary successfully');

    // Return the summary
    return new Response(
      JSON.stringify({ summary, provider: 'openai-api-proxy' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' // Don't cache AI responses
        }
      }
    );

  } catch (error) {
    console.error('[Edge AI] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
