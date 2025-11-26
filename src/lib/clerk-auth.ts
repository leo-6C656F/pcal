/**
 * Clerk Authentication Helper for API Requests
 * Automatically adds authentication token to fetch requests
 */

/**
 * Get Clerk session token for API authentication
 * Must be called within a component wrapped by ClerkProvider
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Access Clerk's session token from window.__clerk
    const clerk = (window as any).__clerk;

    if (!clerk || !clerk.session) {
      console.warn('[Auth] No active Clerk session');
      return null;
    }

    // Get the session token
    const token = await clerk.session.getToken();
    return token;
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
  }

  headers.set('Content-Type', 'application/json');

  return fetch(url, {
    ...options,
    headers,
  });
}
