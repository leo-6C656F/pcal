import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { DailyEntry, ChildContext } from '../types';
import { PDF_COORDINATES, GOALS } from '../constants';
import { format } from 'date-fns';

/**
 * PDF Generator Service
 * Generates exact replica of Orange County Head Start PCAL In-Kind Form
 */

interface PDFGenerationOptions {
  entry: DailyEntry;
  child: ChildContext;
  centerName: string;
  teacherName: string;
}

/**
 * Generate a PDF matching the exact Orange County Head Start PCAL form
 * Embeds full JSON state in metadata for "Smart PDF" backup
 */
export async function generatePDF(options: PDFGenerationOptions): Promise<Uint8Array> {
  const { entry, child, centerName, teacherName } = options;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PDF_COORDINATES.PAGE_WIDTH, PDF_COORDINATES.PAGE_HEIGHT]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Draw all sections
  drawTitle(page, fontBold);
  drawHeaderFields(page, font, fontBold, centerName, teacherName, child.name, entry.date);
  drawGoalsReferenceTable(page, font, fontBold);
  drawActivitiesSection(page, font, fontBold);
  drawDataTableHeader(page, font, fontBold);
  drawDataTableRows(page, font, entry);
  drawDataTableBorders(page);
  drawFooter(page, font, fontBold, entry);

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
  pdfDoc.setAuthor('PCAL App - Orange County Head Start');
  pdfDoc.setCreationDate(new Date());

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Draw title
 */
function drawTitle(page: any, fontBold: any): void {
  const title = 'Parent-Child Activity Log (PCAL) In-Kind Form';
  const titleWidth = fontBold.widthOfTextAtSize(title, PDF_COORDINATES.TITLE.SIZE);
  const centerX = (PDF_COORDINATES.PAGE_WIDTH - titleWidth) / 2;

  page.drawText(title, {
    x: centerX,
    y: PDF_COORDINATES.TITLE.Y,
    size: PDF_COORDINATES.TITLE.SIZE,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  // Note: Logo would go above title, user needs to provide image
  const logoNote = '(Orange County Head Start Logo Here)';
  const noteWidth = fontBold.widthOfTextAtSize(logoNote, 8);
  page.drawText(logoNote, {
    x: (PDF_COORDINATES.PAGE_WIDTH - noteWidth) / 2,
    y: PDF_COORDINATES.TITLE.Y + 20,
    size: 8,
    font: fontBold,
    color: rgb(0.5, 0.5, 0.5)
  });
}

/**
 * Draw header fields section
 */
function drawHeaderFields(
  page: any,
  font: any,
  fontBold: any,
  centerName: string,
  teacherName: string,
  childName: string,
  date: string
): void {
  const { HEADER_FIELDS: HF } = PDF_COORDINATES;
  const y1 = HF.Y_START;
  const y2 = y1 - HF.LINE_HEIGHT;

  // First row: CENTER, TEACHER/HOME VISITOR, MONTH/YEAR
  page.drawText('CENTER:', {
    x: HF.CENTER_LABEL_X,
    y: y1,
    size: HF.LABEL_SIZE,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(centerName, {
    x: HF.CENTER_VALUE_X,
    y: y1,
    size: HF.VALUE_SIZE,
    font: font,
    color: rgb(0, 0, 0)
  });

  // Underline
  page.drawLine({
    start: { x: HF.CENTER_VALUE_X, y: y1 - 2 },
    end: { x: HF.TEACHER_LABEL_X - 5, y: y1 - 2 },
    thickness: 0.5,
    color: rgb(0, 0, 0)
  });

  page.drawText('TEACHER/HOME VISITOR:', {
    x: HF.TEACHER_LABEL_X,
    y: y1,
    size: HF.LABEL_SIZE,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(teacherName, {
    x: HF.TEACHER_VALUE_X,
    y: y1,
    size: HF.VALUE_SIZE,
    font: font,
    color: rgb(0, 0, 0)
  });

  page.drawLine({
    start: { x: HF.TEACHER_VALUE_X, y: y1 - 2 },
    end: { x: HF.MONTH_LABEL_X - 5, y: y1 - 2 },
    thickness: 0.5,
    color: rgb(0, 0, 0)
  });

  page.drawText('MONTH/YEAR', {
    x: HF.MONTH_LABEL_X,
    y: y1,
    size: HF.LABEL_SIZE,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  const monthYear = format(new Date(date), 'MM/yyyy');
  page.drawText(monthYear, {
    x: HF.MONTH_VALUE_X,
    y: y1,
    size: HF.VALUE_SIZE,
    font: font,
    color: rgb(0, 0, 0)
  });

  page.drawLine({
    start: { x: HF.MONTH_VALUE_X, y: y1 - 2 },
    end: { x: 582, y: y1 - 2 },
    thickness: 0.5,
    color: rgb(0, 0, 0)
  });

  // Second row: CHILD'S NAME, PARENT NAME
  page.drawText("CHILD'S NAME:", {
    x: HF.CHILD_LABEL_X,
    y: y2,
    size: HF.LABEL_SIZE,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(childName, {
    x: HF.CHILD_VALUE_X,
    y: y2,
    size: HF.VALUE_SIZE,
    font: font,
    color: rgb(0, 0, 0)
  });

  page.drawLine({
    start: { x: HF.CHILD_VALUE_X, y: y2 - 2 },
    end: { x: HF.PARENT_LABEL_X - 5, y: y2 - 2 },
    thickness: 0.5,
    color: rgb(0, 0, 0)
  });

  page.drawText('PARENT NAME (Print):', {
    x: HF.PARENT_LABEL_X,
    y: y2,
    size: HF.LABEL_SIZE,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawLine({
    start: { x: HF.PARENT_VALUE_X, y: y2 - 2 },
    end: { x: 582, y: y2 - 2 },
    thickness: 0.5,
    color: rgb(0, 0, 0)
  });
}

/**
 * Draw goals reference table (GOAL 1 through GOAL 6)
 */
function drawGoalsReferenceTable(page: any, font: any, fontBold: any): void {
  const { GOALS_TABLE: GT } = PDF_COORDINATES;
  const y = GT.Y_START;

  // Draw 6 columns for 6 goals
  for (let i = 0; i < 6; i++) {
    const goal = GOALS[i];
    const x = GT.START_X + (i * GT.GOAL_WIDTH);

    // Header: "GOAL 1", "GOAL 2", etc.
    const headerText = `GOAL ${goal.code}`;
    const headerWidth = fontBold.widthOfTextAtSize(headerText, GT.FONT_SIZE);
    const headerX = x + (GT.GOAL_WIDTH - headerWidth) / 2;

    page.drawRectangle({
      x: x,
      y: y,
      width: GT.GOAL_WIDTH,
      height: GT.HEADER_HEIGHT,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    page.drawText(headerText, {
      x: headerX,
      y: y + 4,
      size: GT.FONT_SIZE,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    // Description cell
    page.drawRectangle({
      x: x,
      y: y - GT.CELL_HEIGHT,
      width: GT.GOAL_WIDTH,
      height: GT.CELL_HEIGHT,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    // Wrap and draw description
    const wrapped = wrapText(goal.description, GT.GOAL_WIDTH - 4, GT.FONT_SIZE, 5);
    drawMultilineText(page, wrapped, x + 2, y - 8, GT.FONT_SIZE, font, 9);
  }
}

/**
 * Draw activities section header
 */
function drawActivitiesSection(page: any, font: any, fontBold: any): void {
  const { ACTIVITIES_SECTION: AS } = PDF_COORDINATES;

  page.drawRectangle({
    x: PDF_COORDINATES.MARGIN,
    y: AS.Y,
    width: 552,
    height: AS.HEIGHT,
    color: rgb(0.9, 0.9, 0.9),
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  page.drawText('ACTIVITIES TO SUPPORT HS/EHS Classroom experience and Child\'s Individual Goals', {
    x: 140,
    y: AS.Y + 3,
    size: AS.FONT_SIZE,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  // Draw activities for each goal
  drawGoalActivities(page, font, fontBold);
}

/**
 * Draw activities for each goal
 */
function drawGoalActivities(page: any, font: any, fontBold: any): void {
  const { GOAL_ACTIVITIES: GA } = PDF_COORDINATES;
  const y = GA.Y_START;

  for (let i = 0; i < 6; i++) {
    const goal = GOALS[i];
    const x = GA.START_X + (i * GA.GOAL_WIDTH);

    // Draw cell border
    page.drawRectangle({
      x: x,
      y: y - GA.ROW_HEIGHT,
      width: GA.GOAL_WIDTH,
      height: GA.ROW_HEIGHT,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    // Draw "Goal X Activities" title
    page.drawText(`Goal ${goal.code} Activities`, {
      x: x + 2,
      y: y - 7,
      size: GA.TITLE_SIZE,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    // Draw activities
    const activitiesText = goal.activities.map(a => `-${a}`).join('\n');
    drawMultilineText(page, activitiesText, x + 2, y - 14, GA.FONT_SIZE, font, 6);
  }
}

/**
 * Draw data table header
 */
function drawDataTableHeader(page: any, font: any, fontBold: any): void {
  const { DATA_TABLE: DT } = PDF_COORDINATES;
  const y = DT.HEADER_Y;

  const headers = [
    { text: 'DATE', x: DT.DATE_X, width: DT.DATE_WIDTH },
    { text: 'Activity Descriptions', x: DT.ACTIVITY_DESC_X, width: DT.ACTIVITY_DESC_WIDTH },
    { text: 'MEETS\nGOAL\n#', x: DT.GOAL_NUM_X, width: DT.GOAL_NUM_WIDTH },
    { text: 'START\nTIME', x: DT.START_TIME_X, width: DT.START_TIME_WIDTH },
    { text: 'END\nTIME', x: DT.END_TIME_X, width: DT.END_TIME_WIDTH },
    { text: 'PARENT\nSIGNATURE', x: DT.SIGNATURE_X, width: DT.SIGNATURE_WIDTH },
    { text: 'ELAPSED\nTIME', x: DT.ELAPSED_X, width: DT.ELAPSED_WIDTH }
  ];

  headers.forEach(header => {
    page.drawRectangle({
      x: header.x,
      y: y - 20,
      width: header.width,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    const lines = header.text.split('\n');
    const startY = y - 6 - ((lines.length - 1) * 5);
    lines.forEach((line, idx) => {
      const textWidth = fontBold.widthOfTextAtSize(line, DT.HEADER_FONT_SIZE);
      const textX = header.x + (header.width - textWidth) / 2;
      page.drawText(line, {
        x: textX,
        y: startY + (idx * 5),
        size: DT.HEADER_FONT_SIZE,
        font: fontBold,
        color: rgb(0, 0, 0)
      });
    });
  });

  // Note under DATE column
  page.drawText('For example: Parent read "Polar Bear, Polar Bear" and discussed', {
    x: DT.ACTIVITY_DESC_X,
    y: y - 28,
    size: 5,
    font: font,
    color: rgb(0, 0, 0)
  });
  page.drawText('animals and animal sounds with the child.', {
    x: DT.ACTIVITY_DESC_X,
    y: y - 33,
    size: 5,
    font: font,
    color: rgb(0, 0, 0)
  });
}

/**
 * Draw data table rows with activity entries
 */
function drawDataTableRows(page: any, font: any, entry: DailyEntry): void {
  const { DATA_TABLE: DT } = PDF_COORDINATES;
  const startY = DT.Y_START;

  const maxRows = Math.min(entry.lines.length, DT.MAX_ROWS);

  for (let i = 0; i < maxRows; i++) {
    const line = entry.lines[i];
    const y = startY - (i * DT.ROW_HEIGHT);

    // Date (only on first row)
    if (i === 0) {
      const dateText = format(new Date(entry.date), 'MM/dd/yy');
      page.drawText(dateText, {
        x: DT.DATE_X + 5,
        y: y - 15,
        size: DT.FONT_SIZE,
        font: font,
        color: rgb(0, 0, 0)
      });
    }

    // Activity description
    const activities = line.customNarrative || line.selectedActivities.join(', ');
    const wrapped = wrapText(activities, DT.ACTIVITY_DESC_WIDTH - 6, DT.FONT_SIZE, 2);
    page.drawText(wrapped, {
      x: DT.ACTIVITY_DESC_X + 3,
      y: y - 15,
      size: DT.FONT_SIZE,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: DT.ACTIVITY_DESC_WIDTH - 6
    });

    // Goal number
    page.drawText(String(line.goalCode), {
      x: DT.GOAL_NUM_X + 17,
      y: y - 15,
      size: DT.FONT_SIZE,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Start time
    page.drawText(line.startTime, {
      x: DT.START_TIME_X + 10,
      y: y - 15,
      size: DT.FONT_SIZE,
      font: font,
      color: rgb(0, 0, 0)
    });

    // End time
    page.drawText(line.endTime, {
      x: DT.END_TIME_X + 10,
      y: y - 15,
      size: DT.FONT_SIZE,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Signature (if available)
    if (entry.signatureBase64) {
      page.drawText('Signed', {
        x: DT.SIGNATURE_X + 25,
        y: y - 15,
        size: 7,
        font: font,
        color: rgb(0, 0, 0)
      });
    }

    // Elapsed time (in hours)
    const hours = (line.durationMinutes / 60).toFixed(2);
    page.drawText(hours, {
      x: DT.ELAPSED_X + 8,
      y: y - 15,
      size: DT.FONT_SIZE,
      font: font,
      color: rgb(0, 0, 0)
    });
  }

  // Empty rows are handled in drawDataTableBorders
}

/**
 * Draw borders for data table
 */
function drawDataTableBorders(page: any): void {
  const { DATA_TABLE: DT } = PDF_COORDINATES;
  const startY = DT.Y_START;

  for (let i = 0; i < DT.MAX_ROWS; i++) {
    const y = startY - (i * DT.ROW_HEIGHT);

    // Draw cells
    const cells = [
      { x: DT.DATE_X, width: DT.DATE_WIDTH, shade: false },
      { x: DT.ACTIVITY_DESC_X, width: DT.ACTIVITY_DESC_WIDTH, shade: false },
      { x: DT.GOAL_NUM_X, width: DT.GOAL_NUM_WIDTH, shade: false },
      { x: DT.START_TIME_X, width: DT.START_TIME_WIDTH, shade: false },
      { x: DT.END_TIME_X, width: DT.END_TIME_WIDTH, shade: false },
      { x: DT.SIGNATURE_X, width: DT.SIGNATURE_WIDTH, shade: false },
      { x: DT.ELAPSED_X, width: DT.ELAPSED_WIDTH, shade: true }
    ];

    cells.forEach(cell => {
      page.drawRectangle({
        x: cell.x,
        y: y - DT.ROW_HEIGHT,
        width: cell.width,
        height: DT.ROW_HEIGHT,
        color: cell.shade ? rgb(0.85, 0.9, 0.95) : undefined,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5
      });
    });
  }
}

/**
 * Draw footer with signature lines and totals
 */
function drawFooter(page: any, font: any, fontBold: any, entry: DailyEntry): void {
  const { FOOTER: F } = PDF_COORDINATES;

  // Teacher signature line
  page.drawLine({
    start: { x: F.SIG_LINE_X, y: F.TEACHER_SIG_Y },
    end: { x: F.SIG_LINE_X + F.SIG_LINE_WIDTH, y: F.TEACHER_SIG_Y },
    thickness: 0.5,
    color: rgb(0, 0, 0)
  });

  page.drawText('Teacher/Home Education Signature:', {
    x: F.SIG_LINE_X,
    y: F.TEACHER_SIG_Y + F.OFFSET_Y,
    size: F.LABEL_SIZE,
    font: font,
    color: rgb(0, 0, 0)
  });

  // Date line
  page.drawLine({
    start: { x: F.DATE_X, y: F.TEACHER_SIG_Y },
    end: { x: F.DATE_X + F.DATE_WIDTH, y: F.TEACHER_SIG_Y },
    thickness: 0.5,
    color: rgb(0, 0, 0)
  });

  page.drawText('Date:', {
    x: F.DATE_X,
    y: F.TEACHER_SIG_Y + F.OFFSET_Y,
    size: F.LABEL_SIZE,
    font: font,
    color: rgb(0, 0, 0)
  });

  // Supervisor signature line
  page.drawLine({
    start: { x: F.SIG_LINE_X, y: F.SUPERVISOR_SIG_Y },
    end: { x: F.SIG_LINE_X + F.SIG_LINE_WIDTH, y: F.SUPERVISOR_SIG_Y },
    thickness: 0.5,
    color: rgb(0, 0, 0)
  });

  page.drawText('SS/CD/Home Base Supervisor Signature:', {
    x: F.SIG_LINE_X,
    y: F.SUPERVISOR_SIG_Y + F.OFFSET_Y,
    size: F.LABEL_SIZE,
    font: font,
    color: rgb(0, 0, 0)
  });

  page.drawLine({
    start: { x: F.DATE_X, y: F.SUPERVISOR_SIG_Y },
    end: { x: F.DATE_X + F.DATE_WIDTH, y: F.SUPERVISOR_SIG_Y },
    thickness: 0.5,
    color: rgb(0, 0, 0)
  });

  page.drawText('Date:', {
    x: F.DATE_X,
    y: F.SUPERVISOR_SIG_Y + F.OFFSET_Y,
    size: F.LABEL_SIZE,
    font: font,
    color: rgb(0, 0, 0)
  });

  // Totals box on right
  const totalMinutes = entry.lines.reduce((sum, line) => sum + line.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const totalsLabels = ['TOTAL HRS', 'HRLY RATE', 'TOTAL $'];
  totalsLabels.forEach((label, idx) => {
    const y = F.TOTALS_START_Y - (idx * F.TOTALS_ROW_HEIGHT);

    page.drawRectangle({
      x: F.TOTALS_X,
      y: y - F.TOTALS_ROW_HEIGHT,
      width: F.TOTALS_WIDTH,
      height: F.TOTALS_ROW_HEIGHT,
      color: rgb(0.85, 0.9, 0.95),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    page.drawText(label, {
      x: F.TOTALS_X + 2,
      y: y - 12,
      size: F.TOTALS_FONT_SIZE,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    // Show total hours in first box
    if (idx === 0) {
      page.drawText(totalHours, {
        x: F.TOTALS_X + 8,
        y: y - 22,
        size: 8,
        font: font,
        color: rgb(0, 0, 0)
      });
    }
  });

  // Accounting note
  page.drawText('Original copy to Accounting', {
    x: F.TOTALS_X - 65,
    y: F.ACCOUNTING_NOTE_Y,
    size: F.ACCOUNTING_NOTE_SIZE,
    font: font,
    color: rgb(0, 0, 0)
  });

  // Revision date
  page.drawText('Rev. 01.2020', {
    x: F.SIG_LINE_X,
    y: F.ACCOUNTING_NOTE_Y,
    size: F.ACCOUNTING_NOTE_SIZE,
    font: font,
    color: rgb(0, 0, 0)
  });
}

/**
 * Wrap text to fit within width
 */
function wrapText(text: string, maxWidth: number, fontSize: number, maxLines: number = 3): string {
  const charWidth = fontSize * 0.55;
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  let result = lines.join(' ');
  if (result.length > maxCharsPerLine * maxLines) {
    result = result.substring(0, maxCharsPerLine * maxLines - 3) + '...';
  }

  return result;
}

/**
 * Draw multiline text
 */
function drawMultilineText(
  page: any,
  text: string,
  x: number,
  y: number,
  size: number,
  font: any,
  lineHeight: number
): void {
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    page.drawText(line, {
      x,
      y: y - (idx * lineHeight),
      size,
      font,
      color: rgb(0, 0, 0)
    });
  });
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
