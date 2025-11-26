import type { DailyEntry, ChildContext, Goal } from '../types';
import { generateHTML, htmlToPDF } from '../utils/htmlPdfGenerator';
import { generateWordPDF } from './wordPdfGenerator';
import { getPDFGenerationMethod } from '../components/PDFSettings';
import logoImage from '../assets/logo.png';

/**
 * PDF Generator Service
 * Generates exact replica of Orange County Head Start PCAL In-Kind Form
 * Supports multiple generation methods: HTML canvas and Word → PDF
 */

interface PDFGenerationOptions {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
  forceMethod?: 'html-canvas' | 'word-pdf'; // Optional: override user preference
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

  if (method === 'word-pdf') {
    // Use Word document → PDF method
    console.log('Using Word → PDF generation method');
    const blob = await generateWordPDF({
      entries,
      child,
      centerName,
      teacherName,
      goals,
      logoBase64,
      convertToPDF: true
    });

    // Convert blob to Uint8Array
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
