# PCAL API Integration Guide

This document explains the Vercel serverless functions and Edge functions used in PCAL.

## Overview

PCAL uses Vercel Functions to handle server-side operations that can't be done in the browser:

1. **PDF Generation** - Server-side rendering with Puppeteer for pixel-perfect PDFs
2. **Word Document Generation** - HTML to DOCX conversion
3. **AI Summary Proxy** - Secure OpenAI API proxy (Edge Function)

## API Endpoints

### 1. PDF Generation
**Endpoint:** `/api/generate-pdf`
**Method:** `POST`
**Runtime:** Node.js (serverless function)
**Memory:** 3008 MB
**Timeout:** 60 seconds

**Request Body:**
```json
{
  "html": "<html>...</html>"
}
```

**Response:** PDF file (binary)

**Usage in Code:**
```typescript
import { generateServerPDF } from './services/serverPdfGenerator';

const pdfBytes = await generateServerPDF({
  entries,
  child,
  centerName,
  teacherName,
  goals
});
```

---

### 2. Word Document Generation
**Endpoint:** `/api/html-to-docx`
**Method:** `POST`
**Runtime:** Node.js (serverless function)
**Memory:** 1024 MB
**Timeout:** 30 seconds

**Request Body:**
```json
{
  "html": "<html>...</html>"
}
```

**Response:** DOCX file (binary)

**Usage in Code:**
```typescript
import { generateWordPDF } from './services/wordPdfGenerator';

const blob = await generateWordPDF({
  entries,
  child,
  centerName,
  teacherName,
  goals
});
```

---

### 3. AI Summary Proxy (NEW)
**Endpoint:** `/api/ai-summary`
**Method:** `POST`
**Runtime:** Edge (ultra-fast, global)
**Memory:** 128 MB (Edge runtime)
**Timeout:** 30 seconds

**Request Body:**
```json
{
  "prompt": "Rewrite the activities...",
  "settings": {
    "model": "gpt-4o-mini",
    "maxNewTokens": 150,
    "temperature": 0.7,
    "topP": 0.9,
    "doSample": true
  }
}
```

**Response:**
```json
{
  "summary": "Parent practiced mirror play and repetition with songs.",
  "provider": "openai-api-proxy"
}
```

**Usage in Code:**
```typescript
import { generateSummary } from './services/aiService';

const { summary, provider } = await generateSummary(childName, lines);
// Automatically uses proxy if available, falls back to other methods
```

---

## Environment Variables

### Required for Production

Add these to your Vercel project settings (Settings → Environment Variables):

```bash
# OpenAI API Key (for AI Summary Proxy)
OPENAI_API_KEY=sk-your-key-here
```

### Optional for Development

Create a `.env.local` file:

```bash
# Custom server URL (if running local API server)
VITE_SERVER_URL=http://localhost:3000
```

---

## AI Provider Waterfall Logic

The app tries AI providers in this order based on settings:

### Local-First (Default)
1. **Transformers.js** (local, offline) - Best for privacy
2. **OpenAI Proxy** (Edge Function) - Secure, server-side API key
3. **OpenAI Direct** (user's API key) - Fallback if proxy unavailable
4. **Deterministic Fallback** - Always works offline

### OpenAI-First (Optional)
1. **OpenAI Proxy** (Edge Function) - Secure, server-side API key
2. **OpenAI Direct** (user's API key) - Fallback if proxy unavailable
3. **Transformers.js** (local, offline) - Fallback if OpenAI fails
4. **Deterministic Fallback** - Always works offline

---

## Benefits of Edge Function Proxy

### 🔒 Security
- API key stays on server (never exposed to browser)
- No risk of key theft from client-side code
- Centralized access control

### ⚡ Performance
- Edge runtime deploys globally (low latency worldwide)
- Faster cold starts than Node.js functions
- Automatic geographic routing

### 💰 Cost Control
- Single API key for all users
- Can implement rate limiting
- Usage monitoring and analytics
- Prevent API key abuse

### 🎯 Reliability
- Automatic failover to direct API if proxy unavailable
- Multi-tier fallback system
- Always-working offline mode

---

## Development Workflow

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run Vercel dev server** (includes API functions):
   ```bash
   vercel dev
   ```
   This starts:
   - Vite dev server at `http://localhost:3000`
   - API functions at `http://localhost:3000/api/*`

3. **Run Vite only** (no API functions):
   ```bash
   npm run dev
   ```
   API calls will fail unless you set `VITE_SERVER_URL` to a running API server.

### Testing API Endpoints

```bash
# Test AI Summary Proxy
curl -X POST http://localhost:3000/api/ai-summary \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Summarize: Parent did mirror play",
    "settings": { "model": "gpt-4o-mini", "maxNewTokens": 50 }
  }'

# Test PDF Generation
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body>Test</body></html>"}' \
  --output test.pdf

# Test Word Generation
curl -X POST http://localhost:3000/api/html-to-docx \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body>Test</body></html>"}' \
  --output test.docx
```

---

## Deployment

### Deploy to Vercel

1. **Connect repository to Vercel:**
   ```bash
   vercel
   ```

2. **Set environment variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add `OPENAI_API_KEY`

3. **Deploy:**
   ```bash
   git push origin main
   ```
   Vercel automatically deploys on push.

### Verify Deployment

After deployment, test the endpoints:

```bash
# Replace YOUR_DOMAIN with your Vercel domain
curl https://YOUR_DOMAIN.vercel.app/api/ai-summary \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test", "settings": {}}'
```

---

## Monitoring & Debugging

### Vercel Dashboard

- **Functions Logs:** View real-time logs for each API call
- **Analytics:** Monitor function execution time and errors
- **Usage:** Track API call volume and costs

### Browser Console

The app logs which AI provider was used:
```
[AI] Used OpenAI API (via Edge proxy)
[AI] Used Transformers.js (local)
[AI] Used Deterministic Fallback
```

### Error Handling

All API functions return proper error responses:

```json
{
  "error": "Failed to generate summary",
  "details": "OpenAI API error: 429"
}
```

---

## Troubleshooting

### "OpenAI API key not configured on server"
- Add `OPENAI_API_KEY` to Vercel environment variables
- Redeploy after adding the variable

### "Proxy error: 404"
- Make sure Edge function file exists at `/api/ai-summary.ts`
- Check that TypeScript files are being compiled

### "Method not allowed"
- Ensure you're using POST method for all API endpoints
- Check CORS headers in `vercel.json`

### PDF Generation Fails
- Increase memory allocation in `vercel.json`
- Check function timeout (60s max for Hobby plan)
- Review Puppeteer logs in Vercel dashboard

---

## Cost Optimization

### OpenAI API Costs
- gpt-4o-mini: ~$0.15 per 1M tokens (input) / $0.60 per 1M tokens (output)
- Average summary: ~200 input + 50 output tokens = $0.00006 per summary
- 1000 summaries/month ≈ $0.06

### Vercel Function Costs
- **Hobby Plan:** 100 GB-hours/month free
- **Pro Plan:** $20/month includes 1000 GB-hours
- Edge Functions: Fast, low cost per execution

### Recommendations
1. Use Transformers.js (local) as default - it's free and offline
2. Enable OpenAI proxy for users who want better quality
3. Monitor usage in Vercel dashboard
4. Implement rate limiting if needed

---

## Security Best Practices

1. **Never commit API keys** to git
2. **Use environment variables** for all secrets
3. **Validate input** in API functions
4. **Implement rate limiting** for production
5. **Monitor usage** for unusual activity
6. **Use HTTPS** for all API calls (automatic with Vercel)

---

## Future Improvements

Potential enhancements for the API:

- [ ] Add rate limiting per user
- [ ] Implement API key rotation
- [ ] Add usage analytics and reporting
- [ ] Support multiple AI providers (Claude, Gemini)
- [ ] Add caching for common summaries
- [ ] Implement streaming responses for real-time feedback
- [ ] Add webhook support for async processing
