# Clerk Authentication - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Create Clerk Account (2 min)

1. Visit [https://clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Select authentication methods (Google, GitHub, Email recommended)

### Step 2: Get API Keys (1 min)

From [Clerk Dashboard → API Keys](https://dashboard.clerk.com/last-active?path=api-keys):

Copy these two keys:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Step 3: Configure Local Environment (1 min)

Create `.env.local` file in project root:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE

# OpenAI API (existing)
OPENAI_API_KEY=sk-your-openai-key-here
```

### Step 4: Update CORS (1 min)

Edit [vercel.json](vercel.json:18:7-18:48) line 18:

```json
"value": "https://your-actual-domain.vercel.app"
```

Replace with your Vercel deployment URL.

### Step 5: Test Locally

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) and click "Sign In"!

---

## Deployment to Vercel

### Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_YOUR_KEY` | Production |
| `CLERK_SECRET_KEY` | `sk_live_YOUR_KEY` | Production |
| `OPENAI_API_KEY` | `sk-your-key` | Production |

⚠️ **Use `pk_live_` and `sk_live_` keys for production!**

### Deploy

```bash
vercel --prod
```

---

## What's Protected

✅ All 3 API endpoints now require authentication:
- `/api/ai-summary` - OpenAI proxy
- `/api/generate-pdf` - PDF generation
- `/api/html-to-docx` - Word document generation

✅ Unauthorized requests receive `401 Unauthorized`

✅ CORS restricted to your domain only

✅ Security headers enabled (XSS, clickjacking protection)

---

## How It Works

```
User → Sign In Button → Clerk Modal
                          ↓
                    Authenticated Session
                          ↓
API Request + Token → Vercel Function → Verify Token → Process Request
```

---

## Need Help?

See [SECURITY_SETUP.md](SECURITY_SETUP.md:0:0-0:0) for detailed documentation.

**Troubleshooting**: Check Vercel logs with `vercel logs`
