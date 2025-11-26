import { Packer } from 'docx';
import type { DailyEntry, ChildContext, Goal } from '../types';
import { generateWordDocument } from './wordDocGenerator';

/**
 * Word-based PDF Generator
 * Generates Word documents and optionally converts to PDF via server
 */

const SERVER_URL = import.meta.env.VITE_PDF_SERVER_URL || 'http://localhost:3001';

interface WordPDFOptions {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
  logoBase64?: string;
  convertToPDF?: boolean;
}

/**
 * Generate Word document and optionally convert to PDF
 */
export async function generateWordPDF(options: WordPDFOptions): Promise<Blob> {
  const { entries, child, centerName, teacherName, goals, logoBase64, convertToPDF = false } = options;

  console.log('Generating Word document...');

  // Generate Word document
  const doc = await generateWordDocument({
    entries,
    child,
    centerName,
    teacherName,
    goals,
    logoBase64
  });

  // Convert to blob
  const docxBuffer = await Packer.toBlob(doc);

  // If not converting to PDF, return the Word document
  if (!convertToPDF) {
    return docxBuffer;
  }

  console.log('Converting Word document to PDF via server...');

  try {
    // Convert blob to base64
    const docxBase64 = await blobToBase64(docxBuffer);

    // Send to server for conversion
    const response = await fetch(`${SERVER_URL}/api/word-to-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        docxBase64: docxBase64.replace(/^data:application\/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,/, ''),
        filename: `pcal-${child.name}-${entries[0]?.date || 'report'}.docx`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to convert to PDF');
    }

    const pdfBlob = await response.blob();
    console.log('PDF conversion successful');
    return pdfBlob;

  } catch (error) {
    console.error('PDF conversion failed, returning Word document instead:', error);
    // If server conversion fails, return the Word document
    alert(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}. Downloading Word document instead.`);
    return docxBuffer;
  }
}

/**
 * Helper: Convert blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Download Word document as .docx file
 */
export function downloadWordDocument(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
