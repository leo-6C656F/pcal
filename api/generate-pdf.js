import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const { verifyAuth, sendUnauthorized } = require('./_lib/auth.js');

/**
 * Vercel Serverless Function
 * Converts HTML to PDF using Puppeteer (headless Chrome)
 * Preserves ALL HTML/CSS styling perfectly
 *
 * SECURITY: Requires Clerk authentication
 *
 * Endpoint: /api/generate-pdf
 * Method: POST
 * Headers: Authorization: Bearer <clerk-session-token>
 * Body: { html: string }
 * Returns: PDF file as Buffer
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    console.log('[PDF] Unauthorized request blocked');
    return sendUnauthorized(res);
  }

  console.log(`[PDF] Authorized request from user: ${auth.userId}`);

  let browser = null;

  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Generating PDF with Puppeteer...');
    console.log('Environment:', process.env.VERCEL ? 'Vercel' : 'Local');

    // Get Chromium executable path
    const executablePath = await chromium.executablePath();
    console.log('Chromium executable path:', executablePath);

    // Launch headless browser with Vercel-compatible Chromium
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--no-sandbox',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: true,
    });

    console.log('Browser launched successfully');

    const page = await browser.newPage();

    // Set viewport to match letter size landscape
    await page.setViewport({
      width: 1227, // Matches our HTML container width
      height: 800,
      deviceScaleFactor: 2 // High DPI
    });

    // Set the HTML content
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'load']
    });

    // Wait for fonts and images to fully load
    await page.evaluateHandle('document.fonts.ready');

    // Generate PDF with landscape orientation
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0in',
        right: '0in',
        bottom: '0in',
        left: '0in'
      },
      preferCSSPageSize: false
    });

    console.log('PDF generated successfully, size:', pdfBuffer.length);

    // Send PDF as response (use end() for binary data in Vercel)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    // Use inline disposition to allow iframe preview
    res.setHeader('Content-Disposition', 'inline; filename="pcal-report.pdf"');

    return res.end(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to generate PDF',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
