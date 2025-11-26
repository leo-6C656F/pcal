import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);
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
 * Word to PDF Conversion Endpoint
 * Receives DOCX file as base64 and converts it to PDF using LibreOffice
 */
app.post('/api/word-to-pdf', async (req, res) => {
  let tempDir;

  try {
    const { docxBase64, filename = 'document.docx' } = req.body;

    if (!docxBase64) {
      return res.status(400).json({ error: 'DOCX base64 content is required' });
    }

    console.log('Converting DOCX to PDF with LibreOffice...');

    // Create temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pcal-word-'));

    // Save DOCX file
    const docxPath = path.join(tempDir, filename);
    const docxBuffer = Buffer.from(docxBase64, 'base64');
    await fs.writeFile(docxPath, docxBuffer);

    // Check if LibreOffice is available
    try {
      await execPromise('which libreoffice || which soffice');
    } catch (e) {
      return res.status(500).json({
        error: 'LibreOffice not installed',
        details: 'LibreOffice/OpenOffice is required for Word to PDF conversion. Please install it or use the default PDF generation method.'
      });
    }

    // Convert to PDF using LibreOffice
    const { stdout, stderr } = await execPromise(
      `libreoffice --headless --convert-to pdf --outdir "${tempDir}" "${docxPath}" || soffice --headless --convert-to pdf --outdir "${tempDir}" "${docxPath}"`,
      { timeout: 30000 }
    );

    if (stderr && !stderr.includes('using')) {
      console.warn('LibreOffice stderr:', stderr);
    }

    // Read the generated PDF
    const pdfFilename = filename.replace(/\.docx$/i, '.pdf');
    const pdfPath = path.join(tempDir, pdfFilename);

    // Wait a bit for the file to be written
    await new Promise(resolve => setTimeout(resolve, 500));

    const pdfBuffer = await fs.readFile(pdfPath);

    console.log('PDF converted successfully, size:', pdfBuffer.length);

    // Send PDF as response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="${pdfFilename}"`
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Word to PDF conversion error:', error);
    res.status(500).json({
      error: 'Failed to convert Word to PDF',
      details: error.message
    });
  } finally {
    // Cleanup temporary files
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to cleanup temp dir:', e);
      }
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
