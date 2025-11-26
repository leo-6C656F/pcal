/**
 * Clerk Authentication Helper for API Requests
 * Automatically adds authentication token to fetch requests
 */

import { useAuth } from '@clerk/clerk-react';

/**
 * Get Clerk session token for API authentication
 * Uses Clerk's official API via window.Clerk
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Use Clerk's official window.Clerk object
    const clerk = (window as any).Clerk;

    if (!clerk) {
      console.warn('[Auth] Clerk not initialized');
      return null;
    }

    // Get the session token
    const token = await clerk.session?.getToken();

    if (!token) {
      console.warn('[Auth] No active session token');
    }

    return token || null;
  } catch (error) {
    console.error('[Auth] Failed to get session token:', error);
    return null;
  }
}

/**
 * Make an authenticated fetch request
 * Automatically includes Clerk session token in Authorization header
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  const headers = new Headers(options.headers);

  // Add authentication token if available
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    console.log('[Auth] Token added to request');
  } else {
    console.warn('[Auth] No token available for request');
  }

  headers.set('Content-Type', 'application/json');

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Hook to get authenticated fetch function
 * Use this in React components for proper token access
 */
export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getToken();

    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log('[Auth] Token added to request via hook');
    } else {
      console.warn('[Auth] No token available via hook');
    }

    headers.set('Content-Type', 'application/json');

    return fetch(url, {
      ...options,
      headers,
    });
  };
}
