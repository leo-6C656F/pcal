import type { DailyEntry, ChildContext, Goal } from '../types';
import { generateHTML } from '../utils/htmlPdfGenerator';
import logoImage from '../assets/logo.png';

/**
 * PDF Generator Service
 * Generates exact replica of Orange County Head Start PCAL In-Kind Form
 * Uses Server-Side PDF (Puppeteer) for perfect styling preservation
 */

interface PDFGenerationOptions {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
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
 * Uses Server-Side PDF (Puppeteer) for perfect styling preservation
 */
export async function generatePDF(options: PDFGenerationOptions): Promise<Uint8Array> {
  const { entries, child, centerName, teacherName, goals } = options;

  if (entries.length === 0) {
    throw new Error('No entries to generate PDF');
  }

  // Convert logo to base64
  const logoBase64 = await imageToBase64(logoImage);

  // Use server-side Puppeteer for perfect HTML/CSS preservation
  console.log('Using Puppeteer server-side PDF generation');

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

  // Import Clerk auth helper dynamically
  const { authenticatedFetch } = await import('../lib/clerk-auth');

  const response = await authenticatedFetch(`${serverUrl}/api/generate-pdf`, {
    method: 'POST',
    body: JSON.stringify({ html: htmlWithLogo })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    const errorMessage = error.details
      ? `${error.error}: ${error.details}`
      : (error.error || response.statusText);
    console.error('Server-side PDF generation failed:', errorMessage);
    throw new Error(`Server error: ${errorMessage}`);
  }

  // Convert response to Uint8Array
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Extract metadata from a PDF file (legacy function for backwards compatibility)
 */
export async function extractPDFMetadata(_pdfBytes: Uint8Array): Promise<any> {
  // This function is no longer needed with the new HTML approach
  // but kept for backwards compatibility
  throw new Error('PDF metadata extraction not supported with HTML-based PDFs');
}
