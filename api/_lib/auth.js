/**
 * Authentication utility for Vercel API routes (ES Module version for Node.js runtime)
 * Validates Clerk session tokens using official Clerk backend SDK
 */

import { verifyToken } from '@clerk/backend';

/**
 * Verify Clerk session token from Authorization header
 * @param {Request} req - The incoming request with Authorization header
 * @returns {Promise<{userId: string, sessionId: string} | null>} Auth result or null if invalid
 */
export async function verifyAuth(req) {
  try {
    // Handle both Web API Request and Node.js IncomingMessage
    const authHeader = req.headers.get
      ? req.headers.get('authorization')  // Web API Request (Edge/standard)
      : req.headers['authorization'];     // Node.js IncomingMessage

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
      sessionId: payload.sid,
    };
  } catch (error) {
    console.error('[Auth] Verification error:', error);
    return null;
  }
}

/**
 * Create unauthorized response
 * @returns {Response} Unauthorized response
 */
export function unauthorizedResponse() {
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
