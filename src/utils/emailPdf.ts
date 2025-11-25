import type { DailyEntry, ChildContext, Goal } from '../types';
import { generatePDF } from '../services/pdfGenerator';

/**
 * Generate PDF and share via Web Share API (mobile-friendly) or download as fallback
 * Uses native share dialog on mobile devices which properly handles file attachments
 */
export async function emailPDF(options: {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
  recipientEmail?: string;
}): Promise<void> {
  const { entries, child, centerName, teacherName, goals } = options;

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

  // Create File object for Web Share API
  const file = new File([blob], filename, { type: 'application/pdf' });

  // Prepare share text
  const shareText =
    `PCAL Report for ${child.name}\n\n` +
    `Date Range: ${startDate}${startDate !== endDate ? ` to ${endDate}` : ''}\n` +
    `Center: ${centerName}\n` +
    `Teacher: ${teacherName}\n` +
    `Total Entries: ${entries.length}`;

  // Try Web Share API first (works great on mobile with actual file attachment)
  if (navigator.share && navigator.canShare) {
    try {
      const shareData = {
        files: [file],
        title: `PCAL Report - ${child.name}`,
        text: shareText
      };

      // Check if sharing files is supported
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return; // Success! Exit early
      }
    } catch (err) {
      // User cancelled the share or share failed
      // Only throw if it's not a user cancellation (AbortError)
      if (err instanceof Error && err.name !== 'AbortError') {
        console.warn('Web Share API failed:', err);
        // Fall through to download fallback
      } else {
        // User cancelled - don't fall through to download
        return;
      }
    }
  }

  // Fallback: Download the PDF
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Show helpful message for fallback
  alert(
    `The PDF "${filename}" has been downloaded.\n\n` +
    `To email it:\n` +
    `1. Open your email app\n` +
    `2. Create a new message\n` +
    `3. Attach the downloaded PDF file\n` +
    `4. Send to the recipient`
  );
}
