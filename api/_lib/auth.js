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
    const authHeader = req.headers.authorization;

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
 * @param {Response} res - Express response object
 */
export function sendUnauthorized(res) {
  return res.status(401).json({
    error: 'Unauthorized - Valid authentication required'
  });
}
