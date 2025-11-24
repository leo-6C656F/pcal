import type { DailyEntry, ChildContext, Goal } from '../types';
import { generatePDF } from '../services/pdfGenerator';

/**
 * Generate PDF and open email client with attachment
 * Note: Some email clients don't support attachments via mailto:
 * In those cases, we'll download the PDF and provide instructions
 */
export async function emailPDF(options: {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
  recipientEmail?: string;
}): Promise<void> {
  const { entries, child, centerName, teacherName, goals, recipientEmail = '' } = options;

  if (entries.length === 0) {
    throw new Error('No entries to generate PDF');
  }

  // Generate PDF
  const pdfBytes = await generatePDF({ entries, child, centerName, teacherName, goals });
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

  // Create filename
  const startDate = entries[0]?.date || 'unknown';
  const endDate = entries[entries.length - 1]?.date || startDate;
  const dateStr = startDate === endDate ? startDate : `${startDate}_to_${endDate}`;
  const filename = `PCAL-${child.name}-${dateStr}.pdf`;

  // Download the PDF first (since mailto: can't attach files reliably)
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Prepare email content
  const subject = encodeURIComponent(`PCAL Report - ${child.name} - ${dateStr}`);
  const body = encodeURIComponent(
    `Hello,\n\n` +
    `Please find attached the PCAL (Parent-Child Activity Log) report for ${child.name}.\n\n` +
    `Report Details:\n` +
    `- Child: ${child.name}\n` +
    `- Date Range: ${startDate}${startDate !== endDate ? ` to ${endDate}` : ''}\n` +
    `- Center: ${centerName}\n` +
    `- Teacher: ${teacherName}\n` +
    `- Total Entries: ${entries.length}\n\n` +
    `The PDF file "${filename}" has been downloaded to your computer.\n` +
    `Please attach it to this email before sending.\n\n` +
    `Best regards`
  );

  // Open email client
  const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  window.location.href = mailtoLink;

  // Show instruction to user
  setTimeout(() => {
    alert(
      `The PDF "${filename}" has been downloaded.\n\n` +
      `Your email client should open. Please attach the downloaded PDF before sending.`
    );
  }, 500);
}
