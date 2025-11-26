/**
 * Authentication utility for Vercel API routes
 * Validates Clerk session tokens
 */

interface AuthResult {
  userId: string;
  sessionId: string;
}

/**
 * Verify Clerk session token from Authorization header
 * @param request - The incoming request with Authorization header
 * @returns Auth result with userId and sessionId, or null if invalid
 */
export async function verifyAuth(request: Request): Promise<AuthResult | null> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    if (!token) {
      return null;
    }

    // Verify token with Clerk's API
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!clerkSecretKey) {
      console.error('[Auth] CLERK_SECRET_KEY not configured');
      return null;
    }

    // Call Clerk's session verification endpoint
    const response = await fetch('https://api.clerk.com/v1/sessions/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      console.error('[Auth] Token verification failed:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      userId: data.user_id,
      sessionId: data.id,
    };
  } catch (error) {
    console.error('[Auth] Verification error:', error);
    return null;
  }
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized - Valid authentication required' }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="api"'
      }
    }
  );
}
