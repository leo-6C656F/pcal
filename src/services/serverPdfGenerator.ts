import type { DailyEntry, ChildContext, Goal } from '../types';
import { generateHTML } from '../utils/htmlPdfGenerator';
import logoImage from '../assets/logo.png';

const PDF_API_URL = 'http://localhost:3001/api/generate-pdf';

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
 * Generate PDF using server-side Puppeteer (pixel-perfect rendering)
 * Falls back to client-side generation if server is unavailable
 */
export async function generateServerPDF(options: {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
}): Promise<Uint8Array> {
  const { entries, child, centerName, teacherName, goals } = options;

  if (entries.length === 0) {
    throw new Error('No entries to generate PDF');
  }

  try {
    // Convert logo to base64
    const logoBase64 = await imageToBase64(logoImage);
    console.log('[serverPdfGenerator] Logo base64 length:', logoBase64.length);
    console.log('[serverPdfGenerator] Logo base64 preview:', logoBase64.substring(0, 50) + '...');

    // Generate HTML from template
    const html = await generateHTML({
      entries,
      child,
      centerName,
      teacherName,
      goals
    });

    // Count placeholders before replacement
    const placeholderCount = (html.match(/LOGO_BASE64_PLACEHOLDER/g) || []).length;
    console.log('[serverPdfGenerator] Found', placeholderCount, 'logo placeholders in HTML');

    // Replace logo placeholder (global replace for all pages)
    const htmlWithLogo = html.replace(/LOGO_BASE64_PLACEHOLDER/g, logoBase64);

    // Verify replacement worked
    const remainingPlaceholders = (htmlWithLogo.match(/LOGO_BASE64_PLACEHOLDER/g) || []).length;
    console.log('[serverPdfGenerator] Remaining placeholders after replacement:', remainingPlaceholders);
    console.log('[serverPdfGenerator] HTML length:', htmlWithLogo.length);

    console.log('Sending HTML to server for PDF generation...');

    // Send to server for PDF generation
    const response = await fetch(PDF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html: htmlWithLogo })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    // Get PDF bytes from response
    const pdfBlob = await response.blob();
    const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());

    console.log('PDF generated successfully by server, size:', pdfBytes.length);

    return pdfBytes;

  } catch (error) {
    console.error('Server PDF generation failed:', error);

    // Fall back to client-side generation
    console.log('Falling back to client-side PDF generation...');
    const { generatePDF } = await import('./pdfGenerator');
    return await generatePDF(options);
  }
}
