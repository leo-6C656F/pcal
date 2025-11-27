/**
 * Database Initialization Endpoint (Node.js Runtime)
 * Run this once after deployment to set up Vercel Postgres tables
 *
 * GET /api/db-init - Initialize database schema
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeDatabase } from './_lib/db.js';

/**
 * Set CORS headers
 */
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.pcal.online');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Main handler - Initialize database
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET.',
    });
  }

  try {
    console.log('[DB Init] Starting database initialization...');
    await initializeDatabase();

    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully. Tables and indexes created.',
    });
  } catch (error) {
    console.error('[DB Init] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Export config for Vercel Node.js Runtime
export const config = {
  runtime: 'nodejs',
};
