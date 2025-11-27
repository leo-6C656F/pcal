/**
 * Database Initialization Endpoint
 * Run this once after deployment to set up Vercel Postgres tables
 *
 * GET /api/db-init - Initialize database schema
 */

import { initializeDatabase } from './_lib/db.js';

interface InitResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Handle OPTIONS request for CORS
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://www.pcal.online',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Create response with CORS headers
 */
function createResponse(body: InitResponse, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://www.pcal.online',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Main handler - Initialize database
 */
export default async function handler(request: Request): Promise<Response> {
  // Handle OPTIONS for CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return createResponse({
      success: false,
      message: 'Method not allowed. Use GET.',
    }, 405);
  }

  try {
    console.log('[DB Init] Starting database initialization...');
    await initializeDatabase();

    return createResponse({
      success: true,
      message: 'Database initialized successfully. Tables and indexes created.',
    });
  } catch (error) {
    console.error('[DB Init] Error:', error);
    return createResponse({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

// Export config for Vercel Runtime
export const config = {
  runtime: 'nodejs',
};
