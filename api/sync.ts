/**
 * Cloud Sync API Route (Node.js Runtime)
 * Handles bidirectional sync between IndexedDB and Vercel Postgres
 *
 * POST /api/sync - Push local data to cloud (sync up)
 * GET /api/sync - Pull cloud data to local (sync down)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_lib/auth.js';
import {
  syncChildren,
  syncDailyEntries,
  syncGoals,
  getChildren,
  getDailyEntries,
  getGoals,
  updateLastSync,
  type SyncData,
} from './_lib/db.js';

interface SyncUpRequest {
  children?: SyncData['children'];
  dailyEntries?: SyncData['dailyEntries'];
  goals?: SyncData['goals'];
}

interface SyncResponse {
  success: boolean;
  data?: SyncData;
  message?: string;
  error?: string;
  lastSyncAt?: string;
}

/**
 * Set CORS headers
 */
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.pcal.online');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

/**
 * Main handler - routes based on HTTP method
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    console.warn('[Sync] Unauthorized request');
    return res.status(401).json({
      error: 'Unauthorized - Valid authentication required'
    });
  }

  const { userId } = auth;

  // Route based on method
  if (req.method === 'POST') {
    return handleSyncUp(req, res, userId);
  } else if (req.method === 'GET') {
    return handleSyncDown(req, res, userId);
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET or POST.',
    });
  }
}

/**
 * POST /api/sync - Sync up (push local data to cloud)
 */
async function handleSyncUp(req: VercelRequest, res: VercelResponse, userId: string) {
  try {
    const body = req.body as SyncUpRequest;

    // Sync each data type if provided
    if (body.children && body.children.length > 0) {
      console.log(`[Sync Up] Syncing ${body.children.length} children for user ${userId}`);
      await syncChildren(userId, body.children);
    }

    if (body.dailyEntries && body.dailyEntries.length > 0) {
      console.log(`[Sync Up] Syncing ${body.dailyEntries.length} daily entries for user ${userId}`);
      await syncDailyEntries(userId, body.dailyEntries);
    }

    if (body.goals && body.goals.length > 0) {
      console.log(`[Sync Up] Syncing ${body.goals.length} goals for user ${userId}`);
      await syncGoals(userId, body.goals);
    }

    // Update last sync timestamp
    await updateLastSync(userId);

    const response: SyncResponse = {
      success: true,
      message: 'Data synced to cloud successfully',
      lastSyncAt: new Date().toISOString(),
    };

    console.log(`[Sync Up] Success for user ${userId}`);
    return res.status(200).json(response);
  } catch (error) {
    console.error('[Sync Up] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during sync up',
    });
  }
}

/**
 * GET /api/sync - Sync down (pull cloud data to local)
 */
async function handleSyncDown(req: VercelRequest, res: VercelResponse, userId: string) {
  try {
    // Fetch all data from cloud
    const [children, dailyEntries, goals] = await Promise.all([
      getChildren(userId),
      getDailyEntries(userId),
      getGoals(userId),
    ]);

    const response: SyncResponse = {
      success: true,
      data: {
        children,
        dailyEntries,
        goals,
      },
      lastSyncAt: new Date().toISOString(),
    };

    console.log(`[Sync Down] Success for user ${userId}: ${children.length} children, ${dailyEntries.length} entries, ${goals.length} goals`);
    return res.status(200).json(response);
  } catch (error) {
    console.error('[Sync Down] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during sync down',
    });
  }
}

// Export config for Vercel Node.js Runtime
export const config = {
  runtime: 'nodejs',
};
