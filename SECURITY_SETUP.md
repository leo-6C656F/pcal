# Security Setup Guide - Clerk Authentication

This guide walks you through securing your PCAL application with Clerk authentication.

## Overview

Your Vercel API functions are now protected with:
- ✅ **Clerk Authentication** - User authentication with social login
- ✅ **JWT Token Verification** - Secure session validation
- ✅ **CORS Protection** - Restricted to your domain only
- ✅ **Security Headers** - XSS, clickjacking, and MIME-type protection
- ✅ **Rate Limiting** - Built into Clerk (automatic)

---

## Step 1: Create Clerk Account

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application
4. Choose your authentication methods:
   - **Recommended**: Email + Google + GitHub
   - **Optional**: Add more social providers

---

## Step 2: Get Your API Keys

1. In Clerk Dashboard, go to **API Keys**: [https://dashboard.clerk.com/last-active?path=api-keys](https://dashboard.clerk.com/last-active?path=api-keys)
2. Select **"React"** as your framework
3. Copy your keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

---

## Step 3: Configure Environment Variables

### Local Development (.env.local)

Create a `.env.local` file in your project root:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE

# OpenAI API
OPENAI_API_KEY=sk-your-openai-key-here
```

### Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_YOUR_KEY` | Production |
| `CLERK_SECRET_KEY` | `sk_live_YOUR_KEY` | Production |
| `OPENAI_API_KEY` | `sk-your-openai-key` | Production |

⚠️ **Important**: Use `pk_live_` and `sk_live_` keys for production!

---

## Step 4: Update CORS Configuration

In [vercel.json](vercel.json:18:7-18:48), replace `https://yourdomain.com` with your actual domain:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://your-actual-domain.vercel.app"
        }
      ]
    }
  ]
}
```

**For multiple domains** (staging + production):
```json
"value": "https://your-app.vercel.app, https://your-custom-domain.com"
```

---

## Step 5: Test Authentication

### Test Locally

1. Start your dev server:
```bash
npm run dev
```

2. Open [http://localhost:5173](http://localhost:5173)
3. Click **"Sign In"** button in the top right
4. Complete sign-in flow
5. Try using AI summary or export features

### Test Production

1. Deploy to Vercel:
```bash
vercel --prod
```

2. Visit your production URL
3. Sign in and test all API endpoints

---

## How It Works

### Client-Side (React App)

1. User clicks "Sign In" → Clerk modal appears
2. User authenticates (Google, GitHub, Email, etc.)
3. Clerk issues a **session token** (JWT)
4. Token is automatically sent with all API requests

### Server-Side (API Routes)

1. API receives request with `Authorization: Bearer <token>` header
2. Token is verified with Clerk's API
3. If valid → Process request
4. If invalid → Return `401 Unauthorized`

### Code Flow

```
User → Sign In → Clerk → JWT Token
                          ↓
Client → API Request + Token → Vercel Function
                                ↓
                          Verify Token → Clerk API
                                ↓
                          Valid? → Process Request
                                ↓
                          Invalid? → 401 Error
```

---

## Security Features Implemented

### 1. Authentication ([api/_lib/auth.ts](api/_lib/auth.ts:0:0-0:0), [api/_lib/auth.js](api/_lib/auth.js:0:0-0:0))
- JWT token verification via Clerk API
- Per-user session tracking
- Automatic token refresh

### 2. Protected Endpoints
- [api/ai-summary.ts](api/ai-summary.ts:44:0-50:0) - Requires authentication
- [api/generate-pdf.js](api/generate-pdf.js:24:0-31:0) - Requires authentication
- [api/html-to-docx.js](api/html-to-docx.js:22:0-29:0) - Requires authentication

### 3. CORS Protection ([vercel.json](vercel.json:17:0-18:0))
- Restricted to your domain only (no more `Access-Control-Allow-Origin: *`)
- Credentials required for requests
- Authorization header required

### 4. Security Headers ([vercel.json](vercel.json:32:0-47:0))
```
X-Content-Type-Options: nosniff       → Prevent MIME-type sniffing
X-Frame-Options: DENY                  → Prevent clickjacking
X-XSS-Protection: 1; mode=block       → XSS protection
Referrer-Policy: strict-origin        → Privacy protection
```

### 5. Rate Limiting
- **Built into Clerk** - Automatic rate limiting per user
- **Vercel Functions** - Limits based on plan (10K requests/day free tier)

---

## Monitoring & Analytics

### Clerk Dashboard
View authentication metrics:
- **Users**: [https://dashboard.clerk.com/last-active?path=users](https://dashboard.clerk.com/last-active?path=users)
- **Sessions**: [https://dashboard.clerk.com/last-active?path=sessions](https://dashboard.clerk.com/last-active?path=sessions)

### Vercel Logs
Monitor API usage:
```bash
vercel logs
```

Look for:
- `[AI Summary] Authorized request from user: user_xxx` ✅
- `[PDF] Unauthorized request blocked` ⚠️ (potential attack)

---

## Troubleshooting

### "Missing Clerk Publishable Key" Error

**Cause**: `.env.local` not configured or missing `VITE_` prefix

**Fix**:
```bash
# Ensure your .env.local has VITE_ prefix
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

Restart dev server after creating `.env.local`

---

### API Returns 401 Unauthorized

**Cause**: Missing or invalid authentication token

**Fix**:
1. Ensure user is signed in (check `<SignedIn>` component works)
2. Check browser console for auth errors
3. Verify `CLERK_SECRET_KEY` is set in Vercel environment variables

---

### CORS Errors in Production

**Cause**: `Access-Control-Allow-Origin` doesn't match your domain

**Fix**:
1. Update [vercel.json](vercel.json:17:0-18:0) with your actual domain
2. Redeploy: `vercel --prod`

---

### "Clerk API verification failed" in Logs

**Cause**: Invalid or expired `CLERK_SECRET_KEY`

**Fix**:
1. Get fresh keys from [Clerk Dashboard](https://dashboard.clerk.com/last-active?path=api-keys)
2. Update Vercel environment variables
3. Redeploy

---

## Cost Breakdown

### Clerk Free Tier
- ✅ **10,000** monthly active users
- ✅ Unlimited authentication requests
- ✅ Social login (Google, GitHub, etc.)
- ✅ Email/password authentication
- ✅ Session management
- ✅ User management dashboard

### Vercel Free Tier
- ✅ **100GB** bandwidth/month
- ✅ **10,000** serverless function invocations/day
- ✅ Automatic HTTPS

**Estimated Cost for Personal Use**: $0/month 🎉

---

## Next Steps

### Optional Enhancements

1. **Add More Social Providers**
   - Twitter, Discord, Microsoft, etc.
   - Configure in Clerk Dashboard

2. **Enable Multi-Factor Authentication (MFA)**
   - Go to Clerk Dashboard → Settings → Multi-factor
   - Enable SMS or Authenticator app

3. **Set Up Webhooks**
   - Get notified when users sign up
   - Track usage patterns

4. **Add Rate Limiting Per User**
   - Implement custom rate limits beyond Clerk's defaults
   - Use Vercel KV or Upstash Redis

---

## Support

- **Clerk Documentation**: [https://clerk.com/docs](https://clerk.com/docs)
- **Clerk Support**: [https://clerk.com/support](https://clerk.com/support)
- **Vercel Documentation**: [https://vercel.com/docs](https://vercel.com/docs)

---

## Security Checklist

Before deploying to production:

- [ ] Created Clerk account and application
- [ ] Configured environment variables (production keys)
- [ ] Updated CORS in [vercel.json](vercel.json:0:0-0:0) with actual domain
- [ ] Tested sign-in flow locally
- [ ] Tested all 3 API endpoints with authentication
- [ ] Verified 401 errors for unauthenticated requests
- [ ] Deployed to Vercel production
- [ ] Tested in production environment
- [ ] Verified security headers in browser DevTools
- [ ] Set up monitoring/logging

---

**🎉 Your API is now secure!**

All requests to your Vercel functions now require valid Clerk authentication. Bad actors will receive `401 Unauthorized` responses.
