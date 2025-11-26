import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { verifyAuth, sendUnauthorized } from './_lib/auth.js';

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

    // Set viewport with large height to prevent content overflow during rendering
    // This ensures each page-container renders fully before PDF pagination
    await page.setViewport({
      width: 1227, // Matches our HTML container width
      height: 1600, // Tall enough to fit full page content
      deviceScaleFactor: 2 // High DPI
    });

    // Set the HTML content
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'load']
    });

    // Wait for fonts and images to fully load
    await page.evaluateHandle('document.fonts.ready');

    // Wait for all images to be fully loaded (including base64 data URLs)
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete && img.naturalHeight > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          // Timeout after 5 seconds
          setTimeout(resolve, 5000);
        });
      }));
    });

    // Debug: Check page containers and their dimensions
    const pageInfo = await page.evaluate(() => {
      const containers = document.querySelectorAll('.page-container');
      return {
        containerCount: containers.length,
        containers: Array.from(containers).map((c, idx) => ({
          index: idx,
          width: c.offsetWidth,
          height: c.offsetHeight,
          hasLogo: c.querySelector('img.logo-image') !== null,
          logoSrc: c.querySelector('img.logo-image')?.src?.substring(0, 50) + '...'
        }))
      };
    });
    console.log('Page containers found:', pageInfo.containerCount);
    console.log('Page container details:', JSON.stringify(pageInfo.containers, null, 2));

    // Debug: Check if logo images are present and loaded
    const imageInfo = await page.evaluate(() => {
      const logoImages = document.querySelectorAll('img.logo-image');
      return {
        count: logoImages.length,
        images: Array.from(logoImages).map((img, idx) => ({
          index: idx,
          src: img.src.substring(0, 50) + '...',
          srcLength: img.src.length,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        }))
      };
    });
    console.log('Logo images found:', imageInfo.count);
    console.log('Logo image details:', JSON.stringify(imageInfo.images, null, 2));

    // Generate PDF with landscape orientation
    // Use preferCSSPageSize: true to respect CSS @page rules for proper page breaks
    // Scale down slightly to ensure content fits within page boundaries
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0.25in',
        right: '0.25in',
        bottom: '0.25in',
        left: '0.25in'
      },
      preferCSSPageSize: true,
      scale: 0.75 // Scale content to fit page (1050px / ~1400px available at 96dpi)
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
