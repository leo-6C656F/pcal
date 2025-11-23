import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { DailyEntry, ChildContext } from '../types';
import { PDF_COORDINATES } from '../constants';
import { format } from 'date-fns';

/**
 * PDF Generator Service
 * STRICTLY coordinate-based using pdf-lib (NO html2canvas or jspdf HTML rendering)
 */

interface PDFGenerationOptions {
  entry: DailyEntry;
  child: ChildContext;
  centerName: string;
  teacherName: string;
}

/**
 * Generate a PDF for a daily entry
 * Embeds full JSON state in metadata for "Smart PDF" backup
 */
export async function generatePDF(options: PDFGenerationOptions): Promise<Uint8Array> {
  const { entry, child, centerName, teacherName } = options;

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Calculate how many pages we need (max 15 lines per page)
  const totalLines = entry.lines.length;
  const pagesNeeded = Math.ceil(totalLines / PDF_COORDINATES.MAX_LINES_PER_PAGE);

  for (let pageIndex = 0; pageIndex < pagesNeeded; pageIndex++) {
    const page = pdfDoc.addPage([PDF_COORDINATES.PAGE_WIDTH, PDF_COORDINATES.PAGE_HEIGHT]);

    // Draw header (only on first page)
    if (pageIndex === 0) {
      drawHeader(page, font, fontBold, centerName, teacherName, child.name);
    }

    // Draw grid and content
    const startLineIndex = pageIndex * PDF_COORDINATES.MAX_LINES_PER_PAGE;
    const endLineIndex = Math.min(startLineIndex + PDF_COORDINATES.MAX_LINES_PER_PAGE, totalLines);
    const linesForThisPage = entry.lines.slice(startLineIndex, endLineIndex);

    drawGrid(page, font, entry, linesForThisPage, startLineIndex);

    // Draw footer on last page
    if (pageIndex === pagesNeeded - 1) {
      drawFooter(page, font, entry);
    }
  }

  // Embed JSON metadata (The "Smart PDF" feature)
  const metadata = {
    version: '1.0',
    entry: entry,
    child: child,
    centerName,
    teacherName,
    exportedAt: new Date().toISOString()
  };

  pdfDoc.setSubject(JSON.stringify(metadata));
  pdfDoc.setTitle(`PCAL - ${child.name} - ${entry.date}`);
  pdfDoc.setAuthor('PCAL App');
  pdfDoc.setCreationDate(new Date());

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Draw the header section
 */
function drawHeader(
  page: any,
  font: any,
  fontBold: any,
  centerName: string,
  teacherName: string,
  childName: string
): void {
  const fontSize = 10;

  // Center Name
  page.drawText(`Center: ${centerName}`, {
    x: PDF_COORDINATES.HEADER.CENTER_NAME.x,
    y: PDF_COORDINATES.HEADER.CENTER_NAME.y,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0)
  });

  // Teacher
  page.drawText(`Teacher: ${teacherName}`, {
    x: PDF_COORDINATES.HEADER.TEACHER.x,
    y: PDF_COORDINATES.HEADER.TEACHER.y,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0)
  });

  // Child Name
  page.drawText(`Child: ${childName}`, {
    x: PDF_COORDINATES.HEADER.CHILD_NAME.x,
    y: PDF_COORDINATES.HEADER.CHILD_NAME.y,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0)
  });
}

/**
 * Draw the grid with activity lines
 */
function drawGrid(
  page: any,
  font: any,
  entry: DailyEntry,
  lines: any[],
  startLineIndex: number
): void {
  const fontSize = 8;
  const lineHeight = PDF_COORDINATES.GRID.ROW_HEIGHT;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = PDF_COORDINATES.GRID.Y_START - (i * lineHeight);

    // Date column (only show on first line)
    if (startLineIndex + i === 0) {
      const formattedDate = format(new Date(entry.date), 'MM/dd/yyyy');
      page.drawText(formattedDate, {
        x: PDF_COORDINATES.GRID.DATE_COLUMN,
        y: y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    }

    // Narrative/Goals column (with text wrapping)
    const activities = line.selectedActivities.join(', ');
    const narrative = line.customNarrative || activities;

    // Simple text wrapping
    const wrappedText = wrapText(narrative, PDF_COORDINATES.GRID.NARRATIVE_WIDTH, fontSize);
    page.drawText(wrappedText, {
      x: PDF_COORDINATES.GRID.NARRATIVE_COLUMN,
      y: y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: PDF_COORDINATES.GRID.NARRATIVE_WIDTH
    });

    // Goal Code
    page.drawText(String(line.goalCode), {
      x: PDF_COORDINATES.GRID.GOAL_CODE_COLUMN,
      y: y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Start Time
    page.drawText(line.startTime, {
      x: PDF_COORDINATES.GRID.START_TIME_COLUMN,
      y: y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0)
    });

    // End Time
    page.drawText(line.endTime, {
      x: PDF_COORDINATES.GRID.END_TIME_COLUMN,
      y: y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Elapsed Time (convert minutes to hours)
    const hours = (line.durationMinutes / 60).toFixed(2);
    page.drawText(hours, {
      x: PDF_COORDINATES.GRID.ELAPSED_TIME_COLUMN,
      y: y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0)
    });
  }
}

/**
 * Draw the footer with total hours
 */
function drawFooter(page: any, font: any, entry: DailyEntry): void {
  const totalMinutes = entry.lines.reduce((sum, line) => sum + line.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  page.drawText(`Total Hours: ${totalHours}`, {
    x: PDF_COORDINATES.FOOTER.TOTAL_HOURS.x,
    y: PDF_COORDINATES.FOOTER.TOTAL_HOURS.y,
    size: 10,
    font: font,
    color: rgb(0, 0, 0)
  });
}

/**
 * Simple text wrapping helper
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string {
  // For simplicity, truncate if too long
  // In production, you'd implement proper word wrapping
  const charWidth = fontSize * 0.5; // Approximate
  const maxChars = Math.floor(maxWidth / charWidth);

  if (text.length > maxChars) {
    return text.substring(0, maxChars - 3) + '...';
  }

  return text;
}

/**
 * Extract metadata from a PDF file
 */
export async function extractPDFMetadata(pdfBytes: Uint8Array): Promise<any> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const subject = pdfDoc.getSubject();

  if (!subject) {
    throw new Error('No metadata found in PDF');
  }

  try {
    return JSON.parse(subject);
  } catch (error) {
    throw new Error('Invalid metadata format in PDF');
  }
}
