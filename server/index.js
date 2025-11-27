import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

/**
 * PDF Generation Endpoint
 * Receives HTML and returns a pixel-perfect PDF using Puppeteer
 */
app.post('/api/generate-pdf', async (req, res) => {
  let browser;

  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Generating PDF with Puppeteer...');

    // Launch headless browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': 'attachment; filename="pcal-report.pdf"'
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      details: error.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PCAL PDF Generator' });
});

app.listen(PORT, () => {
  console.log(`\n✅ PDF Generation Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   PDF endpoint: http://localhost:${PORT}/api/generate-pdf\n`);
});
