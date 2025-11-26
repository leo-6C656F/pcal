import { Packer } from 'docx';
import type { DailyEntry, ChildContext, Goal } from '../types';
import { generateWordDocument, downloadWordDocument } from './wordDocGenerator';

/**
 * Client-Side Word Document Generator Service
 * Generates Word documents that users can download
 * Fully client-side, no server required
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
 * Generate Word document for download
 * Returns a Blob containing the .docx file
 */
export async function generateWordPDF(options: WordPDFOptions): Promise<Blob> {
  const { entries, child, centerName, teacherName, goals, logoBase64 } = options;

  console.log('Generating Word document for download...');

  // Generate Word document
  const doc = await generateWordDocument({
    entries,
    child,
    centerName,
    teacherName,
    goals,
    logoBase64
  });

  // Convert Document to Blob
  const blob = await Packer.toBlob(doc);

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
