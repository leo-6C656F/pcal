import type { DailyEntry, ChildContext, Goal } from '../types';
import { generateHTML, htmlToPDF } from '../utils/htmlPdfGenerator';
import { generateWordPDF } from './wordPdfGenerator';
import { getPDFGenerationMethod } from '../components/PDFSettings';
import logoImage from '../assets/logo.png';

/**
 * PDF Generator Service
 * Generates exact replica of Orange County Head Start PCAL In-Kind Form
 * Supports multiple generation methods:
 * - HTML canvas → PDF (default, client-side, image-based)
 * - Puppeteer → PDF (server-side, perfect styling preservation)
 * - Word document (server-side, generates .docx file for download)
 */

interface PDFGenerationOptions {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
  forceMethod?: 'html-canvas' | 'word-docx' | 'puppeteer-pdf'; // Optional: override user preference
}

/**
 * Get the API URL for server-side PDF generation
 * In production (Vercel): uses relative URL
 * In development: uses localhost:3001 or VITE_SERVER_URL env variable
 */
function getServerUrl(): string {
  // If custom server URL is set, use it
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  // In production, use relative URLs
  if (import.meta.env.PROD) {
    return '';
  }

  // In development, default to localhost server
  return 'http://localhost:3001';
}

/**
 * Convert image to base64 data URL
 */
async function imageToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract just the base64 data (remove data URL prefix)
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate PDF matching the exact Orange County Head Start PCAL form
 * Supports multiple generation methods based on user preference
 *
 * Note: When 'word-docx' method is selected, this returns a .docx file (not PDF)
 */
export async function generatePDF(options: PDFGenerationOptions): Promise<Uint8Array> {
  const { entries, child, centerName, teacherName, goals, forceMethod } = options;

  if (entries.length === 0) {
    throw new Error('No entries to generate PDF');
  }

  // Determine which method to use
  const method = forceMethod || getPDFGenerationMethod();

  // Convert logo to base64
  const logoBase64 = await imageToBase64(logoImage);

  if (method === 'puppeteer-pdf') {
    // Use server-side Puppeteer for perfect HTML/CSS preservation
    console.log('Using Puppeteer server-side PDF generation method');

    // Generate HTML from template
    const html = await generateHTML({
      entries,
      child,
      centerName,
      teacherName,
      goals
    });

    // Replace logo placeholder with actual base64
    const htmlWithLogo = html.replace('LOGO_BASE64_PLACEHOLDER', logoBase64);

    // Send HTML to server for conversion to PDF
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ html: htmlWithLogo })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Server error: ${error.error || response.statusText}`);
    }

    // Convert response to Uint8Array
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);

  } else if (method === 'word-docx') {
    // Use Word document generation (server-side)
    console.log('Using Word document generation method (server-side)');
    const blob = await generateWordPDF({
      entries,
      child,
      centerName,
      teacherName,
      goals,
      logoBase64
    });

    // Convert blob to Uint8Array
    // Note: This is a .docx file, not a PDF
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } else {
    // Use HTML canvas method (default)
    console.log('Using HTML Canvas generation method');

    // Generate HTML from template
    const html = await generateHTML({
      entries,
      child,
      centerName,
      teacherName,
      goals
    });

    // Convert HTML to PDF
    const pdfBytes = await htmlToPDF(html, logoBase64);

    return pdfBytes;
  }
}

/**
 * Extract metadata from a PDF file (legacy function for backwards compatibility)
 */
export async function extractPDFMetadata(_pdfBytes: Uint8Array): Promise<any> {
  // This function is no longer needed with the new HTML approach
  // but kept for backwards compatibility
  throw new Error('PDF metadata extraction not supported with HTML-based PDFs');
}
