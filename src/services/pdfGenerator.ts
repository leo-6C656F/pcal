import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { DailyEntry, ChildContext, Goal } from '../types';
import { PDF_COORDINATES } from '../constants';
import { format } from 'date-fns';

/**
 * PDF Generator Service
 * Generates exact replica of Orange County Head Start PCAL In-Kind Form
 */

interface PDFGenerationOptions {
  entries: DailyEntry[];  // Support multiple entries
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];  // Custom goals from database
}

/**
 * Generate a PDF matching the exact Orange County Head Start PCAL form
 * Supports multiple entries on one page
 * Embeds full JSON state in metadata for "Smart PDF" backup
 */
export async function generatePDF(options: PDFGenerationOptions): Promise<Uint8Array> {
  const { entries, child, centerName, teacherName, goals } = options;

  if (entries.length === 0) {
    throw new Error('No entries to generate PDF');
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PDF_COORDINATES.PAGE_WIDTH, PDF_COORDINATES.PAGE_HEIGHT]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Get date range
  const startDate = entries[0].date;
  const endDate = entries[entries.length - 1].date;
  const dateRange = startDate === endDate ? startDate : `${startDate} to ${endDate}`;

  // Draw all sections
  drawTitle(page, font, fontBold);
  drawHeaderFields(page, font, fontBold, centerName, teacherName, child.name, dateRange);
  drawInstructionText(page, fontItalic);
  drawGoalsReferenceTable(page, font, fontBold, goals);
  drawActivitiesSection(page, font, fontBold, goals);
  drawGuidanceNote(page, fontItalic);
  drawDataTableHeader(page, font, fontBold);
  drawDataTableRows(page, font, entries);
  drawDataTableBorders(page);
  drawFooter(page, font, fontBold, entries);

  // Embed JSON metadata (The "Smart PDF" feature)
  const metadata = {
    version: '1.0',
    entries: entries,
    child: child,
    centerName,
    teacherName,
    goals,
    exportedAt: new Date().toISOString()
  };

  pdfDoc.setSubject(JSON.stringify(metadata));
  pdfDoc.setTitle(`PCAL - ${child.name} - ${dateRange}`);
  pdfDoc.setAuthor('PCAL App - Orange County Head Start');
  pdfDoc.setCreationDate(new Date());

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Draw title and logo note
 */
function drawTitle(page: any, font: any, fontBold: any): void {
  const { TITLE, COLORS } = PDF_COORDINATES;

  // Logo note above title
  const logoNote = '(Orange County Head Start, Inc. logo here)';
  const noteWidth = font.widthOfTextAtSize(logoNote, TITLE.LOGO_NOTE_SIZE);
  page.drawText(logoNote, {
    x: (PDF_COORDINATES.PAGE_WIDTH - noteWidth) / 2,
    y: TITLE.LOGO_NOTE_Y,
    size: TITLE.LOGO_NOTE_SIZE,
    font: font,
    color: rgb(COLORS.TEXT_GRAY.r, COLORS.TEXT_GRAY.g, COLORS.TEXT_GRAY.b)
  });

  // Main title
  const title = 'Parent-Child Activity Log (PCAL) In-Kind Form';
  const titleWidth = fontBold.widthOfTextAtSize(title, TITLE.SIZE);
  const centerX = (PDF_COORDINATES.PAGE_WIDTH - titleWidth) / 2;

  page.drawText(title, {
    x: centerX,
    y: TITLE.Y,
    size: TITLE.SIZE,
    font: fontBold,
    color: rgb(COLORS.TEXT_DARK.r, COLORS.TEXT_DARK.g, COLORS.TEXT_DARK.b)
  });
}

/**
 * Draw header fields section with grid layout
 */
function drawHeaderFields(
  page: any,
  font: any,
  _fontBold: any,
  centerName: string,
  teacherName: string,
  childName: string,
  date: string
): void {
  const { HEADER_FIELDS: HF, COLORS, BORDER_WIDTH } = PDF_COORDINATES;
  const y1 = HF.Y_START;
  const y2 = y1 - HF.LINE_HEIGHT;
  const textColor = rgb(COLORS.TEXT_DARK.r, COLORS.TEXT_DARK.g, COLORS.TEXT_DARK.b);

  // First row: CENTER, TEACHER/HOME VISITOR, MONTH/YEAR
  // CENTER column
  page.drawText('CENTER:', {
    x: HF.CENTER_LABEL_X,
    y: y1 + 4,
    size: HF.LABEL_SIZE,
    font: font,
    color: textColor
  });

  page.drawText(centerName, {
    x: HF.CENTER_VALUE_X,
    y: y1,
    size: HF.VALUE_SIZE,
    font: font,
    color: textColor
  });

  page.drawLine({
    start: { x: HF.CENTER_VALUE_X, y: y1 - 2 },
    end: { x: HF.TEACHER_LABEL_X - HF.GAP, y: y1 - 2 },
    thickness: BORDER_WIDTH,
    color: textColor
  });

  // TEACHER column
  page.drawText('TEACHER/HOME VISITOR:', {
    x: HF.TEACHER_LABEL_X,
    y: y1 + 4,
    size: HF.LABEL_SIZE,
    font: font,
    color: textColor
  });

  page.drawText(teacherName, {
    x: HF.TEACHER_VALUE_X,
    y: y1,
    size: HF.VALUE_SIZE,
    font: font,
    color: textColor
  });

  page.drawLine({
    start: { x: HF.TEACHER_VALUE_X, y: y1 - 2 },
    end: { x: HF.MONTH_LABEL_X - HF.GAP, y: y1 - 2 },
    thickness: BORDER_WIDTH,
    color: textColor
  });

  // MONTH/YEAR column
  page.drawText('MONTH/YEAR', {
    x: HF.MONTH_LABEL_X,
    y: y1 + 4,
    size: HF.LABEL_SIZE,
    font: font,
    color: textColor
  });

  const monthYear = format(new Date(date), 'yyyy');
  page.drawText(monthYear, {
    x: HF.MONTH_VALUE_X,
    y: y1,
    size: HF.VALUE_SIZE,
    font: font,
    color: textColor
  });

  page.drawLine({
    start: { x: HF.MONTH_VALUE_X, y: y1 - 2 },
    end: { x: PDF_COORDINATES.PAGE_WIDTH - PDF_COORDINATES.MARGIN, y: y1 - 2 },
    thickness: BORDER_WIDTH,
    color: textColor
  });

  // Second row: CHILD'S NAME, PARENT NAME
  // CHILD'S NAME column
  page.drawText("CHILD'S NAME:", {
    x: HF.CHILD_LABEL_X,
    y: y2 + 4,
    size: HF.LABEL_SIZE,
    font: font,
    color: textColor
  });

  page.drawText(childName, {
    x: HF.CHILD_VALUE_X,
    y: y2,
    size: HF.VALUE_SIZE,
    font: font,
    color: textColor
  });

  page.drawLine({
    start: { x: HF.CHILD_VALUE_X, y: y2 - 2 },
    end: { x: HF.PARENT_LABEL_X - HF.GAP, y: y2 - 2 },
    thickness: BORDER_WIDTH,
    color: textColor
  });

  // PARENT NAME column
  page.drawText('PARENT NAME (Print):', {
    x: HF.PARENT_LABEL_X,
    y: y2 + 4,
    size: HF.LABEL_SIZE,
    font: font,
    color: textColor
  });

  page.drawLine({
    start: { x: HF.PARENT_VALUE_X, y: y2 - 2 },
    end: { x: HF.MONTH_LABEL_X - HF.GAP, y: y2 - 2 },
    thickness: BORDER_WIDTH,
    color: textColor
  });
}

/**
 * Draw instruction text below header fields
 */
function drawInstructionText(page: any, fontItalic: any): void {
  const { INSTRUCTION_TEXT: IT, COLORS } = PDF_COORDINATES;

  page.drawText(IT.TEXT, {
    x: PDF_COORDINATES.MARGIN,
    y: IT.Y,
    size: IT.SIZE,
    font: fontItalic,
    color: rgb(COLORS.TEXT_DARK.r, COLORS.TEXT_DARK.g, COLORS.TEXT_DARK.b),
    maxWidth: PDF_COORDINATES.PAGE_WIDTH - (PDF_COORDINATES.MARGIN * 2)
  });
}

/**
 * Draw goals reference table (custom goals)
 */
function drawGoalsReferenceTable(page: any, font: any, fontBold: any, goals: Goal[]): void {
  const { GOALS_TABLE: GT, COLORS, BORDER_WIDTH } = PDF_COORDINATES;
  const y = GT.Y_START;
  const borderColor = rgb(COLORS.BORDER_COLOR.r, COLORS.BORDER_COLOR.g, COLORS.BORDER_COLOR.b);
  const headerBgColor = rgb(COLORS.TABLE_HEADER_BG.r, COLORS.TABLE_HEADER_BG.g, COLORS.TABLE_HEADER_BG.b);
  const textColor = rgb(COLORS.TEXT_DARK.r, COLORS.TEXT_DARK.g, COLORS.TEXT_DARK.b);

  // Draw columns for custom goals (up to 6)
  const maxGoals = Math.min(goals.length, 6);
  for (let i = 0; i < maxGoals; i++) {
    const goal = goals[i];
    const x = GT.START_X + (i * GT.GOAL_WIDTH);

    // Header: "GOAL 1", "GOAL 2", etc.
    const headerText = `GOAL ${goal.code}`;
    const headerWidth = fontBold.widthOfTextAtSize(headerText, GT.FONT_SIZE);
    const headerX = x + (GT.GOAL_WIDTH - headerWidth) / 2;

    // Header cell with background color
    page.drawRectangle({
      x: x,
      y: y,
      width: GT.GOAL_WIDTH,
      height: GT.HEADER_HEIGHT,
      color: headerBgColor,
      borderColor: borderColor,
      borderWidth: BORDER_WIDTH
    });

    page.drawText(headerText, {
      x: headerX,
      y: y + 5,
      size: GT.FONT_SIZE,
      font: fontBold,
      color: textColor
    });

    // Description cell
    page.drawRectangle({
      x: x,
      y: y - GT.CELL_HEIGHT,
      width: GT.GOAL_WIDTH,
      height: GT.CELL_HEIGHT,
      borderColor: borderColor,
      borderWidth: BORDER_WIDTH
    });

    // Wrap and draw description
    const wrapped = wrapText(goal.description, GT.GOAL_WIDTH - (GT.PADDING * 2), GT.FONT_SIZE, 5);
    drawMultilineText(page, wrapped, x + GT.PADDING, y - 8, GT.FONT_SIZE, font, 9);
  }
}

/**
 * Draw activities section header
 */
function drawActivitiesSection(page: any, font: any, fontBold: any, goals: Goal[]): void {
  const { ACTIVITIES_SECTION: AS, COLORS, BORDER_WIDTH } = PDF_COORDINATES;
  const headerBgColor = rgb(COLORS.TABLE_HEADER_BG.r, COLORS.TABLE_HEADER_BG.g, COLORS.TABLE_HEADER_BG.b);
  const borderColor = rgb(COLORS.BORDER_COLOR.r, COLORS.BORDER_COLOR.g, COLORS.BORDER_COLOR.b);
  const textColor = rgb(COLORS.TEXT_DARK.r, COLORS.TEXT_DARK.g, COLORS.TEXT_DARK.b);

  // Header row with background
  page.drawRectangle({
    x: PDF_COORDINATES.MARGIN,
    y: AS.Y,
    width: PDF_COORDINATES.PAGE_WIDTH - (PDF_COORDINATES.MARGIN * 2),
    height: AS.HEIGHT,
    color: headerBgColor,
    borderColor: borderColor,
    borderWidth: BORDER_WIDTH
  });

  const headerText = 'Activities to Support HS/EHS Classroom experience and Child\'s Individual Goals';
  const textWidth = font.widthOfTextAtSize(headerText, AS.FONT_SIZE);
  const centerX = (PDF_COORDINATES.PAGE_WIDTH - textWidth) / 2;

  page.drawText(headerText, {
    x: centerX,
    y: AS.Y + 3,
    size: AS.FONT_SIZE,
    font: font,
    color: textColor
  });

  // Draw activities for each goal
  drawGoalActivities(page, font, fontBold, goals);
}

/**
 * Draw activities for each goal
 */
function drawGoalActivities(page: any, font: any, fontBold: any, goals: Goal[]): void {
  const { GOAL_ACTIVITIES: GA, COLORS, BORDER_WIDTH } = PDF_COORDINATES;
  const y = GA.Y_START;
  const borderColor = rgb(COLORS.BORDER_COLOR.r, COLORS.BORDER_COLOR.g, COLORS.BORDER_COLOR.b);
  const textColor = rgb(COLORS.TEXT_DARK.r, COLORS.TEXT_DARK.g, COLORS.TEXT_DARK.b);

  const maxGoals = Math.min(goals.length, 6);
  for (let i = 0; i < maxGoals; i++) {
    const goal = goals[i];
    const x = GA.START_X + (i * GA.GOAL_WIDTH);

    // Draw cell border
    page.drawRectangle({
      x: x,
      y: y - GA.ROW_HEIGHT,
      width: GA.GOAL_WIDTH,
      height: GA.ROW_HEIGHT,
      borderColor: borderColor,
      borderWidth: BORDER_WIDTH
    });

    // Draw "Goal X Activities" title
    page.drawText(`Goal ${goal.code} Activities`, {
      x: x + GA.PADDING,
      y: y - 7,
      size: GA.TITLE_SIZE,
      font: fontBold,
      color: textColor
    });

    // Draw activities
    const activitiesText = goal.activities.map(a => `- ${a}`).join('\n');
    drawMultilineText(page, activitiesText, x + GA.PADDING, y - 16, GA.FONT_SIZE, font, 8);
  }
}

/**
 * Draw guidance note above the log table
 */
function drawGuidanceNote(page: any, fontItalic: any): void {
  const { GUIDANCE_NOTE: GN, COLORS } = PDF_COORDINATES;
  const textColor = rgb(COLORS.TEXT_DARK.r, COLORS.TEXT_DARK.g, COLORS.TEXT_DARK.b);

  page.drawText(GN.TEXT, {
    x: PDF_COORDINATES.MARGIN,
    y: GN.Y,
    size: GN.SIZE,
    font: fontItalic,
    color: textColor,
    maxWidth: PDF_COORDINATES.PAGE_WIDTH - (PDF_COORDINATES.MARGIN * 2),
    lineHeight: 11
  });
}

/**
 * Draw data table header
 */
function drawDataTableHeader(page: any, _font: any, fontBold: any): void {
  const { DATA_TABLE: DT, COLORS, BORDER_WIDTH } = PDF_COORDINATES;
  const y = DT.HEADER_Y;
  const headerBgColor = rgb(COLORS.TABLE_HEADER_BG.r, COLORS.TABLE_HEADER_BG.g, COLORS.TABLE_HEADER_BG.b);
  const borderColor = rgb(COLORS.BORDER_COLOR.r, COLORS.BORDER_COLOR.g, COLORS.BORDER_COLOR.b);
  const textColor = rgb(COLORS.TEXT_DARK.r, COLORS.TEXT_DARK.g, COLORS.TEXT_DARK.b);

  const headers = [
    { text: 'DATE\nmm/dd/yy', x: DT.DATE_X, width: DT.DATE_WIDTH },
    { text: 'Activity Descriptions', x: DT.ACTIVITY_DESC_X, width: DT.ACTIVITY_DESC_WIDTH },
    { text: 'MEETS\nGOAL #', x: DT.GOAL_NUM_X, width: DT.GOAL_NUM_WIDTH },
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
      color: headerBgColor,
      borderColor: borderColor,
      borderWidth: BORDER_WIDTH
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
        color: textColor
      });
    });
  });
}

/**
 * Draw data table rows with activity entries from multiple daily entries
 */
function drawDataTableRows(page: any, font: any, entries: DailyEntry[]): void {
  const { DATA_TABLE: DT, COLORS } = PDF_COORDINATES;
  const startY = DT.Y_START;
  const textColor = rgb(COLORS.TEXT_DARK.r, COLORS.TEXT_DARK.g, COLORS.TEXT_DARK.b);

  // Flatten all lines from all entries
  const allLines: Array<{ date: string; line: any; signatureBase64?: string }> = [];
  entries.forEach(entry => {
    entry.lines.forEach(line => {
      allLines.push({ date: entry.date, line, signatureBase64: entry.signatureBase64 });
    });
  });

  const maxRows = Math.min(allLines.length, DT.MAX_ROWS);
  let currentDate = '';

  for (let i = 0; i < maxRows; i++) {
    const { date, line, signatureBase64 } = allLines[i];
    const y = startY - (i * DT.ROW_HEIGHT);

    // Date (only when it changes)
    if (date !== currentDate) {
      currentDate = date;
      const dateText = format(new Date(date), 'MM/dd/yy');
      page.drawText(dateText, {
        x: DT.DATE_X + DT.PADDING,
        y: y - 13,
        size: DT.FONT_SIZE,
        font: font,
        color: textColor
      });
    }

    // Activity description
    const activities = line.customNarrative || line.selectedActivities.join(', ');
    const wrapped = wrapText(activities, DT.ACTIVITY_DESC_WIDTH - (DT.PADDING * 2), DT.FONT_SIZE, 2);
    page.drawText(wrapped, {
      x: DT.ACTIVITY_DESC_X + DT.PADDING,
      y: y - 13,
      size: DT.FONT_SIZE,
      font: font,
      color: textColor,
      maxWidth: DT.ACTIVITY_DESC_WIDTH - (DT.PADDING * 2)
    });

    // Goal number (centered)
    const goalText = String(line.goalCode);
    const goalWidth = font.widthOfTextAtSize(goalText, DT.FONT_SIZE);
    page.drawText(goalText, {
      x: DT.GOAL_NUM_X + (DT.GOAL_NUM_WIDTH - goalWidth) / 2,
      y: y - 13,
      size: DT.FONT_SIZE,
      font: font,
      color: textColor
    });

    // Start time
    page.drawText(line.startTime, {
      x: DT.START_TIME_X + DT.PADDING,
      y: y - 13,
      size: DT.FONT_SIZE,
      font: font,
      color: textColor
    });

    // End time
    page.drawText(line.endTime, {
      x: DT.END_TIME_X + DT.PADDING,
      y: y - 13,
      size: DT.FONT_SIZE,
      font: font,
      color: textColor
    });

    // Signature (if available)
    if (signatureBase64) {
      page.drawText('Signed', {
        x: DT.SIGNATURE_X + DT.PADDING,
        y: y - 13,
        size: 8,
        font: font,
        color: textColor
      });
    }

    // Elapsed time (in hours)
    const hours = (line.durationMinutes / 60).toFixed(2);
    page.drawText(hours, {
      x: DT.ELAPSED_X + DT.PADDING,
      y: y - 13,
      size: DT.FONT_SIZE,
      font: font,
      color: textColor
    });
  }

  // Empty rows are handled in drawDataTableBorders
}

/**
 * Draw borders for data table
 */
function drawDataTableBorders(page: any): void {
  const { DATA_TABLE: DT, COLORS, BORDER_WIDTH } = PDF_COORDINATES;
  const startY = DT.Y_START;
  const borderColor = rgb(COLORS.BORDER_COLOR.r, COLORS.BORDER_COLOR.g, COLORS.BORDER_COLOR.b);

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
      { x: DT.ELAPSED_X, width: DT.ELAPSED_WIDTH, shade: false }
    ];

    cells.forEach(cell => {
      page.drawRectangle({
        x: cell.x,
        y: y - DT.ROW_HEIGHT,
        width: cell.width,
        height: DT.ROW_HEIGHT,
        color: cell.shade ? rgb(COLORS.TABLE_CELL_SHADE.r, COLORS.TABLE_CELL_SHADE.g, COLORS.TABLE_CELL_SHADE.b) : undefined,
        borderColor: borderColor,
        borderWidth: BORDER_WIDTH
      });
    });
  }
}

/**
 * Draw footer with signature lines and totals from multiple entries
 */
function drawFooter(page: any, font: any, fontBold: any, entries: DailyEntry[]): void {
  const { FOOTER: F, COLORS, BORDER_WIDTH } = PDF_COORDINATES;
  const borderColor = rgb(COLORS.BORDER_COLOR.r, COLORS.BORDER_COLOR.g, COLORS.BORDER_COLOR.b);
  const headerBgColor = rgb(COLORS.TABLE_HEADER_BG.r, COLORS.TABLE_HEADER_BG.g, COLORS.TABLE_HEADER_BG.b);
  const textColor = rgb(COLORS.TEXT_DARK.r, COLORS.TEXT_DARK.g, COLORS.TEXT_DARK.b);

  // Teacher signature line
  page.drawLine({
    start: { x: F.SIG_LINE_X, y: F.TEACHER_SIG_Y },
    end: { x: F.SIG_LINE_X + F.SIG_LINE_WIDTH, y: F.TEACHER_SIG_Y },
    thickness: BORDER_WIDTH,
    color: borderColor
  });

  page.drawText('Teacher/Home Education Signature:', {
    x: F.SIG_LINE_X,
    y: F.TEACHER_SIG_Y + F.OFFSET_Y,
    size: F.LABEL_SIZE,
    font: font,
    color: textColor
  });

  // Date line
  page.drawLine({
    start: { x: F.DATE_X, y: F.TEACHER_SIG_Y },
    end: { x: F.DATE_X + F.DATE_WIDTH, y: F.TEACHER_SIG_Y },
    thickness: BORDER_WIDTH,
    color: borderColor
  });

  page.drawText('Date:', {
    x: F.DATE_X,
    y: F.TEACHER_SIG_Y + F.OFFSET_Y,
    size: F.LABEL_SIZE,
    font: font,
    color: textColor
  });

  // Supervisor signature line
  page.drawLine({
    start: { x: F.SIG_LINE_X, y: F.SUPERVISOR_SIG_Y },
    end: { x: F.SIG_LINE_X + F.SIG_LINE_WIDTH, y: F.SUPERVISOR_SIG_Y },
    thickness: BORDER_WIDTH,
    color: borderColor
  });

  page.drawText('SS/CD/Home Base Supervisor Signature:', {
    x: F.SIG_LINE_X,
    y: F.SUPERVISOR_SIG_Y + F.OFFSET_Y,
    size: F.LABEL_SIZE,
    font: font,
    color: textColor
  });

  page.drawLine({
    start: { x: F.DATE_X, y: F.SUPERVISOR_SIG_Y },
    end: { x: F.DATE_X + F.DATE_WIDTH, y: F.SUPERVISOR_SIG_Y },
    thickness: BORDER_WIDTH,
    color: borderColor
  });

  page.drawText('Date:', {
    x: F.DATE_X,
    y: F.SUPERVISOR_SIG_Y + F.OFFSET_Y,
    size: F.LABEL_SIZE,
    font: font,
    color: textColor
  });

  // Totals box on right - Calculate from all entries
  let totalMinutes = 0;
  entries.forEach(entry => {
    totalMinutes += entry.lines.reduce((sum, line) => sum + line.durationMinutes, 0);
  });
  const totalHours = (totalMinutes / 60).toFixed(2);

  const totalsData = [
    { label: 'TOTAL HRS', value: totalHours },
    { label: 'HRLY RATE', value: '' },
    { label: 'TOTAL $', value: '' }
  ];

  totalsData.forEach((item, idx) => {
    const y = F.TOTALS_START_Y - (idx * F.TOTALS_ROW_HEIGHT);

    // Label cell
    page.drawRectangle({
      x: F.TOTALS_X,
      y: y - F.TOTALS_ROW_HEIGHT,
      width: F.TOTALS_LABEL_WIDTH,
      height: F.TOTALS_ROW_HEIGHT,
      color: headerBgColor,
      borderColor: borderColor,
      borderWidth: BORDER_WIDTH
    });

    page.drawText(item.label, {
      x: F.TOTALS_X + F.TOTALS_PADDING,
      y: y - 13,
      size: F.TOTALS_FONT_SIZE,
      font: fontBold,
      color: textColor
    });

    // Value cell
    page.drawRectangle({
      x: F.TOTALS_X + F.TOTALS_LABEL_WIDTH,
      y: y - F.TOTALS_ROW_HEIGHT,
      width: F.TOTALS_VALUE_WIDTH,
      height: F.TOTALS_ROW_HEIGHT,
      borderColor: borderColor,
      borderWidth: BORDER_WIDTH
    });

    if (item.value) {
      page.drawText(item.value, {
        x: F.TOTALS_X + F.TOTALS_LABEL_WIDTH + F.TOTALS_PADDING,
        y: y - 13,
        size: F.TOTALS_FONT_SIZE,
        font: font,
        color: textColor
      });
    }
  });

  // Accounting note
  page.drawText('Original copy to Accounting', {
    x: PDF_COORDINATES.PAGE_WIDTH - PDF_COORDINATES.MARGIN - 140,
    y: F.ACCOUNTING_NOTE_Y,
    size: F.ACCOUNTING_NOTE_SIZE,
    font: font,
    color: textColor
  });

  // Revision date
  page.drawText('Rev. 01.2020', {
    x: F.SIG_LINE_X,
    y: F.ACCOUNTING_NOTE_Y,
    size: F.ACCOUNTING_NOTE_SIZE,
    font: font,
    color: textColor
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
