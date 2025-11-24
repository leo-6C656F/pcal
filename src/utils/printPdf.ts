import type { DailyEntry, ChildContext, Goal } from '../types';
import { generateHTML } from './htmlPdfGenerator';
import logoImage from '../assets/logo.png';

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
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Open print dialog with the PDF content
 * This uses the browser's native print-to-PDF functionality for pixel-perfect results
 */
export async function printPDF(options: {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
}): Promise<void> {
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

  // Replace logo placeholder
  const htmlWithLogo = html.replace('LOGO_BASE64_PLACEHOLDER', logoBase64);

  // Add print-specific styles
  const printStyles = `
    <style>
      @page {
        size: landscape;
        margin: 0.4in;
      }

      @media print {
        body {
          background-color: white !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .page-container {
          box-shadow: none !important;
          padding: 20px !important;
          width: 100% !important;
          max-width: 100% !important;
        }
      }
    </style>
  `;

  // Create a complete HTML document
  const completeHTML = htmlWithLogo.replace('</head>', `${printStyles}</head>`);

  // Open in new window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups for this site.');
  }

  // Write the HTML content
  printWindow.document.write(completeHTML);
  printWindow.document.close();

  // Wait for images and fonts to load
  await new Promise(resolve => {
    printWindow.addEventListener('load', () => {
      setTimeout(resolve, 500);
    });
  });

  // Trigger print dialog
  printWindow.print();

  // Note: We don't close the window automatically so the user can review before printing
  // The window will close when they finish printing or cancel
}
