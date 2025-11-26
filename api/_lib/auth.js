/**
 * Authentication utility for Vercel API routes
 * Validates Clerk session tokens
 */

/**
 * Verify Clerk session token from Authorization header
 * @param {Request} req - The incoming request with Authorization header
 * @returns {Promise<{userId: string, sessionId: string} | null>} Auth result or null if invalid
 */
async function verifyAuth(req) {
  try {
    const authHeader = req.headers.authorization;

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
 * @param {Response} res - Express response object
 */
function sendUnauthorized(res) {
  return res.status(401).json({
    error: 'Unauthorized - Valid authentication required'
  });
}

export {
  verifyAuth,
  sendUnauthorized
};
