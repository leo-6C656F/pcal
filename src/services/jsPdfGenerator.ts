import { jsPDF } from 'jspdf';
import type { DailyEntry, ChildContext, Goal } from '../types';

/**
 * Generate PDF using jsPDF - programmatic approach with precise control
 * This should eliminate text bleeding issues by positioning everything explicitly
 */
export async function generateJsPDF(options: {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
  logoBase64: string;
}): Promise<Uint8Array> {
  const { entries, child, centerName, teacherName, goals, logoBase64 } = options;

  // Create landscape PDF (11" x 8.5")
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: 'letter'
  });

  // Page dimensions
  const pageWidth = 11;
  const pageHeight = 8.5;
  const margin = 0.4;
  const contentWidth = pageWidth - (2 * margin);
  const contentStart = margin;

  let yPos = margin;

  // Add logo (centered, 150px = ~2.08 inches at 72 DPI)
  const logoWidth = 1.5;
  const logoHeight = 1.5;
  doc.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, yPos, logoWidth, logoHeight);
  yPos += logoHeight + 0.1;

  // Title
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.text('PARENT-CHILD ACTIVITY LOG (PCAL) IN-KIND FORM', pageWidth / 2, yPos, { align: 'center' });
  yPos += 0.15;
  doc.text('ORANGE COUNTY HEAD START', pageWidth / 2, yPos, { align: 'center' });
  yPos += 0.25;

  // Student info section
  doc.setFontSize(13);
  doc.setFont('times', 'bold');

  // First row: Student Name, Center, Teacher
  const col1Width = contentWidth * 0.33;
  const col2Width = contentWidth * 0.35;

  doc.text('Student Name:', contentStart, yPos);
  doc.line(contentStart + 1.2, yPos, contentStart + col1Width - 0.1, yPos);
  doc.text(child.name, contentStart + 1.3, yPos - 0.05);

  doc.text('Center:', contentStart + col1Width, yPos);
  doc.line(contentStart + col1Width + 0.6, yPos, contentStart + col1Width + col2Width - 0.1, yPos);
  doc.text(centerName, contentStart + col1Width + 0.7, yPos - 0.05);

  doc.text('Teacher:', contentStart + col1Width + col2Width, yPos);
  doc.line(contentStart + col1Width + col2Width + 0.7, yPos, contentStart + contentWidth, yPos);
  doc.text(teacherName, contentStart + col1Width + col2Width + 0.8, yPos - 0.05);
  yPos += 0.2;

  // Second row: Child's Name, Date of Birth, Date
  doc.text("Child's Name:", contentStart, yPos);
  doc.line(contentStart + 1.2, yPos, contentStart + col1Width - 0.1, yPos);
  doc.text(child.name, contentStart + 1.3, yPos - 0.05);

  doc.text('Date of Birth:', contentStart + col1Width, yPos);
  doc.line(contentStart + col1Width + 1.0, yPos, contentStart + col1Width + col2Width - 0.1, yPos);

  doc.text('Date:', contentStart + col1Width + col2Width, yPos);
  doc.line(contentStart + col1Width + col2Width + 0.5, yPos, contentStart + contentWidth, yPos);
  const startDate = entries[0]?.date || '';
  doc.text(startDate, contentStart + col1Width + col2Width + 0.6, yPos - 0.05);
  yPos += 0.25;

  // Goals table
  doc.setFontSize(10.5);
  const colWidths = [0.5, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7];
  const rowHeight = 0.18;

  // Ensure we have exactly 6 goals
  const sixGoals = [...goals];
  while (sixGoals.length < 6) {
    sixGoals.push({ code: sixGoals.length + 1, description: '', activities: [] });
  }

  // Draw table headers
  doc.setFont('times', 'bold');
  doc.rect(contentStart, yPos, colWidths[0], rowHeight);
  doc.text('DATE', contentStart + colWidths[0] / 2, yPos + 0.12, { align: 'center' });

  let xPos = contentStart + colWidths[0];
  for (let i = 0; i < 6; i++) {
    doc.rect(xPos, yPos, colWidths[i + 1], rowHeight);
    doc.text(`GOAL ${i + 1}`, xPos + colWidths[i + 1] / 2, yPos + 0.12, { align: 'center' });
    xPos += colWidths[i + 1];
  }
  yPos += rowHeight;

  // Activities headers
  doc.setFont('times', 'bolditalic');
  xPos = contentStart + colWidths[0];
  for (let i = 0; i < 6; i++) {
    doc.rect(xPos, yPos, colWidths[i + 1], rowHeight * 0.8);
    doc.text(`Goal ${i + 1} Activities`, xPos + 0.05, yPos + 0.1, { align: 'left' });
    xPos += colWidths[i + 1];
  }
  yPos += rowHeight * 0.8;

  // Calculate total hours
  let totalMinutes = 0;
  entries.forEach(entry => {
    totalMinutes += entry.lines.reduce((sum, line) => sum + line.durationMinutes, 0);
  });
  const totalHours = (totalMinutes / 60).toFixed(2);

  // Draw biographical section (daily entries)
  doc.setFont('times', 'normal');
  const maxBioRows = 20; // Adjust based on space

  for (const entry of entries) {
    for (const line of entry.lines) {
      if (yPos > pageHeight - 1.5) break; // Stop if we're running out of space

      // Date column
      doc.rect(contentStart, yPos, colWidths[0], rowHeight);
      doc.text(entry.date, contentStart + 0.05, yPos + 0.13);

      // Goal columns
      xPos = contentStart + colWidths[0];
      for (let goalIdx = 0; goalIdx < 6; goalIdx++) {
        doc.rect(xPos, yPos, colWidths[goalIdx + 1], rowHeight);

        if (goalIdx < goals.length && line.goalCode === goals[goalIdx].code) {
          // Add activity description with proper wrapping
          const activityText = `${line.selectedActivities.join(', ')}: ${line.customNarrative} (${line.durationMinutes} min)`;
          const wrappedText = doc.splitTextToSize(activityText, colWidths[goalIdx + 1] - 0.1);
          doc.text(wrappedText, xPos + 0.05, yPos + 0.13);
        }

        xPos += colWidths[goalIdx + 1];
      }

      yPos += rowHeight;
    }
  }

  // Fill remaining rows to maintain table structure
  const remainingRows = Math.max(0, maxBioRows - entries.reduce((sum, e) => sum + e.lines.length, 0));
  for (let i = 0; i < Math.min(remainingRows, (pageHeight - 1.5 - yPos) / rowHeight); i++) {
    doc.rect(contentStart, yPos, colWidths[0], rowHeight);
    xPos = contentStart + colWidths[0];
    for (let j = 0; j < 6; j++) {
      doc.rect(xPos, yPos, colWidths[j + 1], rowHeight);
      xPos += colWidths[j + 1];
    }
    yPos += rowHeight;
  }

  // Signature section (bottom left)
  yPos = pageHeight - 0.8;
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text('Parent/Volunteer Signature:', contentStart, yPos);
  doc.line(contentStart + 2, yPos, contentStart + 4, yPos);
  doc.text('Date:', contentStart + 4.2, yPos);
  doc.line(contentStart + 4.5, yPos, contentStart + 5.5, yPos);

  yPos += 0.2;
  doc.text('SS/CD/Home Base Supervisor Signature:', contentStart, yPos);
  doc.line(contentStart + 2.8, yPos, contentStart + 4.8, yPos);
  doc.text('Date:', contentStart + 5, yPos);
  doc.line(contentStart + 5.3, yPos, contentStart + 6.3, yPos);

  // Rev date
  yPos += 0.2;
  doc.setFontSize(8);
  doc.text('Rev. 01.2020', contentStart, yPos);

  // Totals box (bottom right)
  const totalsX = pageWidth - margin - 2;
  const totalsY = pageHeight - 0.9;
  const totalsWidth = 2;
  const totalsRowHeight = 0.2;

  doc.setFontSize(10);
  doc.setFont('times', 'bold');

  // TOTAL HRS row (shaded)
  doc.setFillColor(211, 211, 211);
  doc.rect(totalsX, totalsY, totalsWidth * 0.6, totalsRowHeight, 'FD');
  doc.rect(totalsX + totalsWidth * 0.6, totalsY, totalsWidth * 0.4, totalsRowHeight, 'FD');
  doc.text('TOTAL HRS', totalsX + 0.05, totalsY + 0.14);
  doc.text(totalHours, totalsX + totalsWidth * 0.6 + 0.05, totalsY + 0.14);

  // HRLY RATE row (shaded)
  doc.rect(totalsX, totalsY + totalsRowHeight, totalsWidth * 0.6, totalsRowHeight, 'FD');
  doc.rect(totalsX + totalsWidth * 0.6, totalsY + totalsRowHeight, totalsWidth * 0.4, totalsRowHeight, 'FD');
  doc.text('HRLY RATE', totalsX + 0.05, totalsY + totalsRowHeight + 0.14);

  // TOTAL $ row (shaded)
  doc.rect(totalsX, totalsY + totalsRowHeight * 2, totalsWidth * 0.6, totalsRowHeight, 'FD');
  doc.rect(totalsX + totalsWidth * 0.6, totalsY + totalsRowHeight * 2, totalsWidth * 0.4, totalsRowHeight, 'FD');
  doc.text('TOTAL $', totalsX + 0.05, totalsY + totalsRowHeight * 2 + 0.14);

  // "Original copy to Accounting" text (red, below table)
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 0, 0);
  doc.text('Original copy to Accounting', totalsX + totalsWidth, totalsY + totalsRowHeight * 3 + 0.05, { align: 'right' });

  // Return PDF as Uint8Array
  const pdfBytes = doc.output('arraybuffer');
  return new Uint8Array(pdfBytes);
}
