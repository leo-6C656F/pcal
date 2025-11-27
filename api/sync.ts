/**
 * Cloud Sync API Route
 * Handles bidirectional sync between IndexedDB and Vercel Postgres
 *
 * POST /api/sync - Push local data to cloud (sync up)
 * GET /api/sync - Pull cloud data to local (sync down)
 */

import { verifyAuth, unauthorizedResponse } from './_lib/auth';
import {
  syncChildren,
  syncDailyEntries,
  syncGoals,
  getChildren,
  getDailyEntries,
  getGoals,
  updateLastSync,
  type SyncData,
} from './_lib/db';

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
 * Handle OPTIONS request for CORS
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://www.pcal.online',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

/**
 * Create response with CORS headers
 */
function createResponse(body: any, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://www.pcal.online',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

/**
 * POST /api/sync - Sync up (push local data to cloud)
 */
async function handleSyncUp(request: Request, userId: string): Promise<Response> {
  try {
    const body = await request.json() as SyncUpRequest;

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
    return createResponse(response);
  } catch (error) {
    console.error('[Sync Up] Error:', error);
    return createResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during sync up',
    }, 500);
  }
}

/**
 * GET /api/sync - Sync down (pull cloud data to local)
 */
async function handleSyncDown(userId: string): Promise<Response> {
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
    return createResponse(response);
  } catch (error) {
    console.error('[Sync Down] Error:', error);
    return createResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during sync down',
    }, 500);
  }
}

/**
 * Main handler - routes based on HTTP method
 */
export default async function handler(request: Request): Promise<Response> {
  // Handle OPTIONS for CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  // Verify authentication
  const auth = await verifyAuth(request);
  if (!auth) {
    console.warn('[Sync] Unauthorized request');
    return unauthorizedResponse();
  }

  const { userId } = auth;

  // Route based on method
  if (request.method === 'POST') {
    return handleSyncUp(request, userId);
  } else if (request.method === 'GET') {
    return handleSyncDown(userId);
  } else {
    return createResponse({
      success: false,
      error: 'Method not allowed. Use GET or POST.',
    }, 405);
  }
}

// Export config for Vercel Edge Runtime
export const config = {
  runtime: 'edge',
};
