import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import HTMLtoDOCX from '@turbodocx/html-to-docx';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb', type: 'text/html' }));

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

/**
 * Word Document Generation Endpoint
 * Receives HTML and returns a Word document (.docx) using @turbodocx/html-to-docx
 */
app.post('/api/html-to-docx', async (req, res) => {
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Generating Word document from HTML...');

    // Convert HTML to Word document with enhanced styling options
    const docxBuffer = await HTMLtoDOCX(html, null, {
      orientation: 'landscape',
      margins: {
        top: 720, // 0.5 inch in twips (1 inch = 1440 twips)
        right: 720,
        bottom: 720,
        left: 720
      },
      font: 'Times New Roman',
      fontSize: 22, // 11pt in half-points
      table: {
        row: {
          cantSplit: true // Prevent table rows from splitting across pages
        }
      },
      pageSize: {
        orientation: 'landscape',
        width: 15840, // 11 inches in twips (11 * 1440)
        height: 12240  // 8.5 inches in twips (8.5 * 1440)
      }
    });

    console.log('Word document generated successfully, size:', docxBuffer.length);

    // Send Word document as response
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Length': docxBuffer.length,
      'Content-Disposition': 'attachment; filename="pcal-report.docx"'
    });

    res.send(docxBuffer);

  } catch (error) {
    console.error('Word document generation error:', error);
    res.status(500).json({
      error: 'Failed to generate Word document',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PCAL PDF Generator' });
});

app.listen(PORT, () => {
  console.log(`\n✅ PDF Generation Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   PDF endpoint: http://localhost:${PORT}/api/generate-pdf`);
  console.log(`   Word endpoint: http://localhost:${PORT}/api/html-to-docx\n`);
});
