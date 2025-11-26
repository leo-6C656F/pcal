import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

/**
 * Vercel Serverless Function
 * Converts HTML to PDF using Puppeteer (headless Chrome)
 * Preserves ALL HTML/CSS styling perfectly
 *
 * Endpoint: /api/generate-pdf
 * Method: POST
 * Body: { html: string }
 * Returns: PDF file as Buffer
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;

  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Generating PDF with Puppeteer...');

    // Launch headless browser with Vercel-compatible Chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set viewport to match letter size landscape
    await page.setViewport({
      width: 1227, // Matches our HTML container width
      height: 800,
      deviceScaleFactor: 2 // High DPI
    });

    // Set the HTML content
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded']
    });

    // Wait a bit for any dynamic content or fonts to load
    await page.waitForTimeout(500);

    // Generate PDF with landscape orientation
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0.4in',
        right: '0.4in',
        bottom: '0.4in',
        left: '0.4in'
      },
      preferCSSPageSize: false
    });

    console.log('PDF generated successfully, size:', pdfBuffer.length);

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', 'attachment; filename="pcal-report.pdf"');

    return res.send(pdfBuffer);

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
