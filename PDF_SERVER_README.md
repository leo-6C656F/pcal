# PDF Generation Server

This project now includes a **server-side PDF generation service** using Puppeteer for **pixel-perfect** PDF rendering that exactly matches the HTML preview.

## What's New

### 1. Server-Side PDF Generation (Option 2)
- **Backend Server**: Node.js + Express + Puppeteer
- **Perfect Rendering**: Puppeteer renders HTML exactly as browsers do
- **Automatic Fallback**: Falls back to client-side generation if server is unavailable

### 2. Email Integration (Option 1)
- **One-Click Email**: "Email PDF" button that:
  1. Generates pixel-perfect PDF
  2. Downloads it automatically
  3. Opens your email client with pre-filled content
  4. You just attach the PDF and send!

## How to Use

### Development Mode

You have two options:

#### Option A: Run Both Servers Together (Recommended)
```bash
npm run dev:all
```
This starts both the frontend (Vite) and the PDF server concurrently.

#### Option B: Run Separately
Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - PDF Server:
```bash
npm run server
```

### Production Mode

Build the frontend:
```bash
npm run build
npm run preview
```

Start the PDF server:
```bash
npm run server
```

## Features

### Three Export Options

1. **Email PDF** (Primary Button)
   - Generates PDF using server (pixel-perfect)
   - Downloads PDF automatically
   - Opens email client with pre-filled message
   - User attaches PDF and sends

2. **Print to PDF** (Secondary)
   - Opens print dialog
   - Uses browser's native print-to-PDF
   - Good alternative if server is down

3. **Download PDF** (Secondary)
   - Generates PDF using server
   - Falls back to client-side if needed
   - Direct download to your computer

## Architecture

### Server (Port 3001)
```
/Users/lxs4609/Downloads/pcal/server/index.js
```
- **POST /api/generate-pdf**: Receives HTML, returns PDF
- **GET /api/health**: Health check endpoint

### Client Integration
```
/Users/lxs4609/Downloads/pcal/src/services/serverPdfGenerator.ts
```
- Sends HTML to server
- Receives perfect PDF
- Automatic fallback to client-side generation

### Email Integration
```
/Users/lxs4609/Downloads/pcal/src/utils/emailPdf.ts
```
- Generates PDF
- Downloads file
- Opens mailto: link with pre-filled content

## Why This Approach?

### Puppeteer Advantages
- ✅ **Pixel-Perfect**: Renders HTML/CSS exactly like Chrome
- ✅ **Real Browser**: Uses actual Chromium engine
- ✅ **No Quirks**: No canvas conversion artifacts
- ✅ **Text is Selectable**: Real text in PDF, not images
- ✅ **Smaller File Size**: Optimized PDF output

### Email Workflow Benefits
- ✅ **One Click**: Simple user experience
- ✅ **Native Client**: Uses user's default email app
- ✅ **Pre-filled**: Subject and body ready to go
- ✅ **Flexible**: Works with Gmail, Outlook, Apple Mail, etc.

## Troubleshooting

### Server Not Starting
If you see connection errors, the PDF server might not be running:
```bash
npm run server
```

### Port Already in Use
If port 3001 is busy, edit `server/index.js` and change:
```javascript
const PORT = 3001; // Change to another port like 3002
```

Also update the frontend URL in `src/services/serverPdfGenerator.ts`:
```typescript
const PDF_API_URL = 'http://localhost:3001/api/generate-pdf';
```

### Puppeteer Installation Issues
Puppeteer downloads Chromium. If it fails:
```bash
npm install puppeteer --no-save
npm install puppeteer
```

## Next Steps

### Optional: Deploy the Backend
For production, you can deploy the PDF server to:
- **Vercel** (serverless function)
- **Heroku** (simple deployment)
- **AWS Lambda** (scalable)
- **Digital Ocean** (VPS)

Update `PDF_API_URL` in `serverPdfGenerator.ts` to your deployed URL.

### Optional: Add Email Recipients
Edit `emailPdf.ts` to pre-fill recipient emails:
```typescript
const recipientEmail = 'supervisor@headstart.org';
```

## Files Modified/Created

### New Files
- `server/index.js` - PDF generation server
- `src/services/serverPdfGenerator.ts` - Server PDF client
- `src/utils/emailPdf.ts` - Email integration
- `src/utils/printPdf.ts` - Print to PDF utility

### Modified Files
- `package.json` - Added server scripts and dependencies
- `src/components/PDFPreview.tsx` - Added Email/Print buttons
- All PDF generation now uses server by default

## Need Help?

The system has automatic fallbacks:
1. **Server unavailable?** Falls back to client-side generation
2. **Email client issues?** Use Download PDF instead
3. **Print issues?** Use Download PDF instead
