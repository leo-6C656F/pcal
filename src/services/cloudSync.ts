/**
 * Cloud Sync Service
 * Handles bidirectional sync between IndexedDB and Vercel Postgres
 */

import type { ChildContext, DailyEntry, Goal } from '../types';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  syncEnabled: boolean;
}

export interface SyncData {
  children: ChildContext[];
  dailyEntries: DailyEntry[];
  goals: Goal[];
}

interface SyncResponse {
  success: boolean;
  data?: SyncData;
  message?: string;
  error?: string;
  lastSyncAt?: string;
}

const API_BASE_URL = import.meta.env.PROD
  ? 'https://www.pcal.online'
  : 'http://localhost:5173';

/**
 * Get auth token from Clerk
 */
async function getAuthToken(): Promise<string | null> {
  // Try to get token from Clerk
  try {
    // @ts-ignore - Clerk is loaded globally
    if (window.Clerk && window.Clerk.session) {
      // @ts-ignore
      const token = await window.Clerk.session.getToken();
      return token;
    }
  } catch (error) {
    console.warn('[CloudSync] Failed to get Clerk token:', error);
  }
  return null;
}

/**
 * Check if cloud sync is available (user is authenticated)
 */
export async function isCloudSyncAvailable(): Promise<boolean> {
  const token = await getAuthToken();
  return token !== null;
}

/**
 * Sync up - Push local data to cloud
 */
export async function syncUp(data: Partial<SyncData>): Promise<SyncResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Not authenticated. Please sign in to sync to cloud.',
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result: SyncResponse = await response.json();

    if (!response.ok) {
      console.error('[CloudSync] Sync up failed:', result.error);
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    console.log('[CloudSync] Sync up successful');
    return result;
  } catch (error) {
    console.error('[CloudSync] Sync up error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown sync error',
    };
  }
}

/**
 * Sync down - Pull cloud data to local
 */
export async function syncDown(): Promise<SyncResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Not authenticated. Please sign in to sync from cloud.',
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/sync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    const result: SyncResponse = await response.json();

    if (!response.ok) {
      console.error('[CloudSync] Sync down failed:', result.error);
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    console.log('[CloudSync] Sync down successful');
    return result;
  } catch (error) {
    console.error('[CloudSync] Sync down error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown sync error',
    };
  }
}

/**
 * Initialize database on cloud (one-time setup)
 */
export async function initializeCloudDatabase(): Promise<SyncResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/db-init`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[CloudSync] Database initialization failed:', result.error);
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    console.log('[CloudSync] Database initialized successfully');
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error('[CloudSync] Database initialization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown initialization error',
    };
  }
}
