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

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

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

  // Send HTML to server for conversion to Word
  const response = await fetch(`${SERVER_URL}/api/html-to-docx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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
