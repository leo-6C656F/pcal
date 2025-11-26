import type { DailyEntry, ChildContext, Goal } from '../types';
import { generateHTML } from '../utils/htmlPdfGenerator';
import { downloadWordDocument } from './wordDocGenerator';

/**
 * Server-Side Word Document Generator Service
 * Generates Word documents from HTML using @turbodocx/html-to-docx on the server
 * Requires server to be running on localhost:3001
 */

interface WordPDFOptions {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
  logoBase64?: string;
}

/**
 * Get the API URL for Word document generation
 * In production (Vercel): uses relative URL /api/html-to-docx
 * In development: uses localhost:3001 or VITE_SERVER_URL env variable
 */
function getApiUrl(): string {
  // If custom server URL is set, use it
  if (import.meta.env.VITE_SERVER_URL) {
    return `${import.meta.env.VITE_SERVER_URL}/api/html-to-docx`;
  }

  // In production (or when using relative URLs), use same domain
  if (import.meta.env.PROD) {
    return '/api/html-to-docx';
  }

  // In development, default to localhost server
  return 'http://localhost:3001/api/html-to-docx';
}

/**
 * Generate Word document for download
 * Returns a Blob containing the .docx file
 */
export async function generateWordPDF(options: WordPDFOptions): Promise<Blob> {
  const { entries, child, centerName, teacherName, goals } = options;

  console.log('Generating Word document from HTML via server...');

  // Generate HTML from template
  const html = await generateHTML({
    entries,
    child,
    centerName,
    teacherName,
    goals
  });

  const apiUrl = getApiUrl();
  console.log('Using API endpoint:', apiUrl);

  // Import Clerk auth helper dynamically
  const { authenticatedFetch } = await import('../lib/clerk-auth');

  // Send HTML to server for conversion to Word
  const response = await authenticatedFetch(apiUrl, {
    method: 'POST',
    body: JSON.stringify({ html })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Server error: ${error.error || response.statusText}`);
  }

  // Convert response to Blob
  const blob = await response.blob();

  console.log('Word document generated successfully');

  return blob;
}

/**
 * Generate and download Word document
 */
export async function generateAndDownloadWord(
  options: WordPDFOptions,
  filename?: string
): Promise<void> {
  const blob = await generateWordPDF(options);

  const defaultFilename = `pcal-${options.child.name}-${options.entries[0]?.date || 'report'}.docx`;
  downloadWordDocument(blob, filename || defaultFilename);
}
