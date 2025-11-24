import type { DailyEntry, ChildContext, Goal } from '../types';
import { generateHTML, htmlToPDF } from '../utils/htmlPdfGenerator';
import logoImage from '../assets/logo.png';

/**
 * PDF Generator Service
 * Generates exact replica of Orange County Head Start PCAL In-Kind Form
 * Uses HTML template and html2canvas for rendering
 */

interface PDFGenerationOptions {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
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
 * Uses HTML template approach with html2canvas
 */
export async function generatePDF(options: PDFGenerationOptions): Promise<Uint8Array> {
  const { entries, child, centerName, teacherName, goals } = options;

  if (entries.length === 0) {
    throw new Error('No entries to generate PDF');
  }

  // Convert logo to base64
  const logoBase64 = await imageToBase64(logoImage);

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

/**
 * Extract metadata from a PDF file (legacy function for backwards compatibility)
 */
export async function extractPDFMetadata(_pdfBytes: Uint8Array): Promise<any> {
  // This function is no longer needed with the new HTML approach
  // but kept for backwards compatibility
  throw new Error('PDF metadata extraction not supported with HTML-based PDFs');
}
