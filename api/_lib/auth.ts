/**
 * Authentication utility for Vercel API routes
 * Validates Clerk session tokens using official Clerk backend SDK
 */

import { verifyToken } from '@clerk/backend';

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
      console.warn('[Auth] Missing or invalid Authorization header');
      return null;
    }

    const token = authHeader.substring(7);

    if (!token) {
      console.warn('[Auth] Empty token');
      return null;
    }

    // Get Clerk secret key
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!clerkSecretKey) {
      console.error('[Auth] CLERK_SECRET_KEY not configured');
      return null;
    }

    // Verify token using Clerk's official backend SDK
    const payload = await verifyToken(token, {
      secretKey: clerkSecretKey,
    });

    if (!payload || !payload.sub) {
      console.error('[Auth] Invalid token payload');
      return null;
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid as string,
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
