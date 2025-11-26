import type { DailyEntry, ChildContext, Goal } from '../types';
import { format, parse } from 'date-fns';

/**
 * HTML-based PDF Generator
 * Generates HTML that matches the exact template structure,
 * then converts to PDF (can be done client-side or server-side)
 */

interface HTMLPDFOptions {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
}

interface AggregatedDailyActivity {
  date: string;
  description: string;
  goalCodes: number[];
  startTime: string;
  endTime: string;
  totalMinutes: number;
  signatureBase64?: string;
}

/**
 * Aggregate activities by date
 */
async function aggregateDailyActivities(entries: DailyEntry[], _goals: Goal[]): Promise<AggregatedDailyActivity[]> {
  const aggregated: AggregatedDailyActivity[] = [];

  for (const entry of entries) {
    if (entry.lines.length === 0) continue;

    const goalCodes = Array.from(new Set(entry.lines.map(line => line.goalCode))).sort((a, b) => a - b);
    const startTimes = entry.lines.map(line => line.startTime);
    const endTimes = entry.lines.map(line => line.endTime);
    const startTime = startTimes.sort()[0];
    const endTime = endTimes.sort().reverse()[0];
    const totalMinutes = entry.lines.reduce((sum, line) => sum + line.durationMinutes, 0);

    // Generate description
    const description = entry.aiSummary ||
      (entry.lines.length === 1
        ? (entry.lines[0].customNarrative || entry.lines[0].selectedActivities.join(', '))
        : entry.lines.map(line => line.customNarrative || line.selectedActivities.join(', ')).join('; '));

    aggregated.push({
      date: entry.date,
      description,
      goalCodes,
      startTime,
      endTime,
      totalMinutes,
      signatureBase64: entry.signatureBase64
    });
  }

  return aggregated;
}

/**
 * Generate HTML for PCAL form
 */
export async function generateHTML(options: HTMLPDFOptions): Promise<string> {
  const { entries, child, centerName, teacherName, goals } = options;

  if (entries.length === 0) {
    throw new Error('No entries to generate PDF');
  }

  const aggregatedActivities = await aggregateDailyActivities(entries, goals);

  // Calculate totals
  let totalMinutes = 0;
  entries.forEach(entry => {
    totalMinutes += entry.lines.reduce((sum, line) => sum + line.durationMinutes, 0);
  });
  const totalHours = (totalMinutes / 60).toFixed(2);

  // Get date range
  const startDate = entries[0].date;
  const monthYear = format(parse(startDate, 'yyyy-MM-dd', new Date()), 'yyyy');

  // Ensure we have exactly 6 goals (pad with empty if needed)
  const sixGoals = [...goals];
  while (sixGoals.length < 6) {
    sixGoals.push({ code: sixGoals.length + 1, description: '', activities: [] });
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PCAL In-Kind Form</title>
    <style>
        body {
            font-family: "Times New Roman", Times, serif;
            background-color: white;
            display: flex;
            justify-content: center;
            padding: 0;
            margin: 0;
            color: black;
        }

        .page-container {
            width: 1227px;
            background-color: white;
            padding: 40px;
            position: relative;
            box-sizing: border-box;
        }

        /* Header Section */
        .header {
            text-align: center;
            margin-bottom: 12px;
        }

        .logo-area {
            text-align: center;
            margin-bottom: 6px;
            line-height: 1.1;
        }

        .logo-image {
            max-width: 120px;
            height: auto;
            margin: 0 auto 6px auto;
            display: block;
        }

        h1 {
            font-size: 16px;
            font-weight: 900;
            margin: 8px 0 4px 0;
            text-transform: uppercase;
            text-align: center;
        }

        /* Form Inputs - Top Section */
        .input-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 12px;
            font-weight: bold;
            align-items: baseline;
        }

        .input-group {
            display: flex;
            align-items: baseline;
            white-space: nowrap;
        }

        .input-line {
            border-bottom: 1px solid black;
            padding: 0 5px 4px 5px;
            font-weight: bold;
            margin-left: 5px;
            flex-grow: 1;
            min-height: 18px;
            line-height: 1.3;
        }

        /* Specific widths to match visual proportions */
        .w-center { width: 35%; }
        .w-teacher { width: 45%; }
        .w-date { width: 15%; }

        .w-child { width: 45%; }
        .w-parent { width: 50%; }

        .instruction-text {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 3px;
            margin-top: 6px;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
            font-size: 10.5px;
            table-layout: fixed;
        }

        th, td {
            border: 1px solid black;
            padding: 2px 4px 3px 4px;
            vertical-align: top;
            line-height: 1.3;
        }

        /* Goal Table Specifics */
        .goal-header {
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
            background-color: white;
            padding: 3px 4px;
            vertical-align: middle;
        }

        .activities-header {
            background-color: white;
            font-weight: bold;
            font-style: italic;
            text-align: left;
            border-bottom: 1px solid black;
            padding: 2px 4px;
            vertical-align: middle;
        }

        .sub-goal-header {
            font-style: italic;
            text-align: center;
            font-weight: bold;
            text-decoration: underline;
            padding: 3px 4px 2px 4px;
            vertical-align: middle;
        }

        /* Lists in cells */
        .cell-content {
            overflow: hidden;
        }
        .cell-content div {
            margin-bottom: 1px;
            padding-left: 6px;
            text-indent: -6px;
        }
        .cell-content div::before {
            content: "-";
            margin-right: 1px;
        }

        /* Log Table Specifics */
        .log-table {
            border-top: none;
            margin-top: -1px;
        }

        .log-header-row th {
            text-align: center;
            vertical-align: middle;
            font-size: 10px;
        }

        .black-row td {
            background-color: black;
            color: white;
            font-weight: bold;
            text-align: center;
            border-color: white;
            border-right: 1px solid white;
            padding: 4px 0;
        }

        .black-row {
            border-left: 1px solid black;
            border-right: 1px solid black;
        }

        .grey-col {
            background-color: #dbe4f1;
        }

        .office-use {
            background-color: #9daeb9 !important;
            color: white !important;
        }

        .empty-row td {
            height: 20px;
        }

        /* Footer Section */
        .footer-section {
            display: flex;
            justify-content: space-between;
            margin-top: 0;
            position: relative;
        }

        .signatures {
            width: 78%;
            padding-top: 15px;
            font-size: 12px;
            font-weight: bold;
        }

        .signature-line {
            margin-top: 18px;
            display: flex;
            align-items: flex-end;
        }

        .sig-input {
            border-bottom: 1px solid black;
            flex-grow: 1;
            margin: 0 5px;
            height: 1px;
            position: relative;
        }

        .sig-image {
            position: absolute;
            bottom: 0;
            left: 5px;
            max-height: 50px;
            max-width: 200px;
            height: auto;
        }

        .totals-box {
            width: 17%;
            font-size: 10px;
            font-weight: bold;
            border-left: 1px solid black;
            border-right: 1px solid black;
            border-bottom: 1px solid black;
            margin-right: 0px;
            margin-top: -1px;
            background-color: #dbe4f1;
        }

        .total-row {
            display: flex;
            border-top: 1px solid black;
            height: 22px;
            align-items: center;
        }

        .total-label {
            padding: 0 5px;
            width: 55%;
            border-right: 1px solid black;
            height: 100%;
            display: flex;
            align-items: center;
        }
        .total-input {
            width: 45%;
            height: 100%;
            background-color: white;
            display: flex;
            align-items: center;
            padding-left: 5px;
        }

        .rev-date {
            font-size: 10px;
            margin-top: 15px;
            font-weight: bold;
        }

        .accounting-text {
            color: red;
            font-size: 10px;
            text-align: right;
            margin-top: 5px;
            font-weight: normal;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <!-- Header -->
        <div class="header">
            <div class="logo-area">
                <img src="data:image/png;base64,LOGO_BASE64_PLACEHOLDER" alt="Orange County Head Start Logo" class="logo-image">
            </div>
            <h1>Parent-Child Activity Log (PCAL) In-Kind Form</h1>
        </div>

        <!-- Top Inputs -->
        <div class="input-row">
            <div class="input-group w-center">
                CENTER: <div class="input-line">${centerName}</div>
            </div>
            <div class="input-group w-teacher">
                TEACHER/HOME VISITOR: <div class="input-line">${teacherName}</div>
            </div>
            <div class="input-group w-date">
                MONTH/YEAR <div class="input-line" style="text-align: center;">${monthYear}</div>
            </div>
        </div>

        <div class="input-row">
            <div class="input-group w-child">
                CHILD'S NAME: <div class="input-line">${child.name}</div>
            </div>
            <div class="input-group w-parent">
                PARENT NAME (Print): <div class="input-line"></div>
            </div>
        </div>

        <div class="instruction-text">
            **Teacher is to set goals with parent based on child's individual needs and list suggested home activities to meet these goals
        </div>

        <!-- GOALS TABLE -->
        <table>
            <colgroup>
                ${sixGoals.map(() => '<col style="width: 16.66%;">').join('')}
            </colgroup>
            <thead>
                <tr>
                    ${sixGoals.map(goal => `<th class="goal-header">GOAL ${goal.code}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    ${sixGoals.map(goal => `<td style="height: 35px; font-size: 9px; line-height: 1.2;">${goal.description}</td>`).join('')}
                </tr>
                <tr>
                    <td colspan="6" class="activities-header" style="text-transform: uppercase;">ACTIVITIES TO SUPPORT HS/EHS Classroom experience and Child's Individual Goals</td>
                </tr>
                <tr>
                    ${sixGoals.map(goal => `<td class="sub-goal-header">Goal ${goal.code} Activities</td>`).join('')}
                </tr>
                <tr>
                    ${sixGoals.map(goal => `
                        <td class="cell-content" style="height: 45px; font-size: 8.5px; line-height: 1.1;">
                            ${goal.activities.map(activity => `<div>${activity}</div>`).join('')}
                        </td>
                    `).join('')}
                </tr>
            </tbody>
        </table>

        <!-- LOG TABLE -->
        <table class="log-table">
            <colgroup>
                <col style="width: 10%;">
                <col style="width: 44%;">
                <col style="width: 7%;">
                <col style="width: 7%;">
                <col style="width: 7%;">
                <col style="width: 17%;">
                <col style="width: 8%;">
            </colgroup>
            <thead>
                <tr class="log-header-row">
                    <th>DATE</th>
                    <th>
                        Write down what the parent and child did together to make progress towards this goal.<br>
                        <span style="font-weight: normal; font-size: 9.5px;">For example: Parent read "Polar Bear, Polar Bear" and discussed animals and animal sounds with the child.</span>
                    </th>
                    <th>MEETS GOAL<br># ______</th>
                    <th>START TIME</th>
                    <th>END TIME</th>
                    <th>PARENT SIGNATURE</th>
                    <th class="grey-col">ELAPSED TIME</th>
                </tr>
                <tr class="black-row">
                    <td>mm/dd/yy</td>
                    <td>Activity Descriptions</td>
                    <td># of Goals</td>
                    <td>3:00</td>
                    <td>3:25</td>
                    <td>Signature</td>
                    <td class="office-use">Office Use</td>
                </tr>
            </thead>
            <tbody>
                ${aggregatedActivities.map((activity, index) => {
                    // Create varied vertical offsets: centered around middle with variation
                    const offsets = [-5, -3, -1, 0, 1, -4, -2, 2, 3, -6];
                    const topOffset = offsets[index % offsets.length];
                    return `
                    <tr>
                        <td>${format(parse(activity.date, 'yyyy-MM-dd', new Date()), 'MM/dd/yy')}</td>
                        <td>${activity.description}</td>
                        <td style="text-align: center;">${activity.goalCodes.join(', ')}</td>
                        <td>${activity.startTime}</td>
                        <td>${activity.endTime}</td>
                        <td style="padding: 0; position: relative; height: 30px; overflow: visible;">${activity.signatureBase64 ? `<img src="${activity.signatureBase64}" style="position: absolute; top: 50%; left: 2px; transform: translateY(calc(-50% + ${topOffset}px)); max-height: 28px; max-width: calc(100% - 4px); height: auto; object-fit: contain; mix-blend-mode: multiply;" alt="Signature" />` : ''}</td>
                        <td class="grey-col">${(activity.totalMinutes / 60).toFixed(2)}</td>
                    </tr>
                `}).join('')}
                ${Array(Math.max(0, 10 - aggregatedActivities.length)).fill(0).map(() => `
                    <tr class="empty-row">
                        <td></td><td></td><td></td><td></td><td></td><td></td><td class="grey-col"></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Footer & Totals -->
        <div class="footer-section">
            <div class="signatures">
                <div class="signature-line">
                    Teacher/Home Education Signature: <div class="sig-input"></div>
                    <span style="margin-left: 10px;">Date:</span> <div class="sig-input" style="flex-grow: 0; width: 100px;"></div>
                </div>
                <div class="signature-line">
                    SS/CD/Home Base Supervisor Signature: <div class="sig-input"></div>
                    <span style="margin-left: 10px;">Date:</span> <div class="sig-input" style="flex-grow: 0; width: 100px;"></div>
                </div>
                <div class="rev-date">Rev. 01.2020</div>
            </div>

            <!-- Totals Box attached to right side -->
            <div class="totals-box">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px;">
                    <tr>
                        <td style="border: 1px solid black; padding: 3px 4px; font-weight: bold; background-color: #d3d3d3;">TOTAL HRS</td>
                        <td style="border: 1px solid black; padding: 3px 4px; background-color: #d3d3d3;">${totalHours}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 3px 4px; font-weight: bold; background-color: #d3d3d3;">HRLY RATE</td>
                        <td style="border: 1px solid black; padding: 3px 4px; background-color: #d3d3d3;"></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 3px 4px; font-weight: bold; background-color: #d3d3d3;">TOTAL $</td>
                        <td style="border: 1px solid black; padding: 3px 4px; background-color: #d3d3d3;"></td>
                    </tr>
                </table>
                <div style="text-align: right; color: red; font-size: 10px; font-weight: normal;">Original copy to Accounting</div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Convert HTML to PDF by rendering to canvas first, then to PDF
 * This ensures pixel-perfect rendering matching the HTML
 */
export async function htmlToPDF(html: string, logoBase64: string): Promise<Uint8Array> {
  // Import dependencies
  const html2canvas = (await import('html2canvas')).default;
  const { PDFDocument } = await import('pdf-lib');

  // Replace logo placeholder with actual base64
  const htmlWithLogo = html.replace('LOGO_BASE64_PLACEHOLDER', logoBase64);

  // Create a container div to hold everything
  const container = document.createElement('div');
  container.innerHTML = htmlWithLogo;

  // Find the page-container in the parsed HTML
  const pageContainer = container.querySelector('.page-container') as HTMLElement;
  const styleElement = container.querySelector('style') as HTMLStyleElement;

  if (!pageContainer) {
    throw new Error('Could not find .page-container in HTML');
  }

  // Create wrapper with proper structure
  const wrapper = document.createElement('div');
  wrapper.style.fontFamily = '"Times New Roman", Times, serif';
  wrapper.style.backgroundColor = 'white';
  wrapper.style.padding = '0';
  wrapper.style.width = '1227px';

  // Append style element first
  if (styleElement) {
    wrapper.appendChild(styleElement.cloneNode(true));
  }

  // Then append the page container
  wrapper.appendChild(pageContainer);

  // Add to DOM temporarily for rendering
  wrapper.style.position = 'fixed';
  wrapper.style.top = '0';
  wrapper.style.left = '0';
  wrapper.style.zIndex = '9999';
  wrapper.style.pointerEvents = 'none';

  document.body.appendChild(wrapper);

  try {
    // Wait for rendering and images to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Rendering HTML to canvas...');

    // Render to canvas with high quality
    const canvas = await html2canvas(pageContainer, {
      scale: 2, // High DPI
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: pageContainer.offsetWidth,
      height: pageContainer.offsetHeight
    });

    console.log('Canvas created:', canvas.width, 'x', canvas.height);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();

    // Letter size landscape: 11 x 8.5 inches = 792 x 612 points
    const page = pdfDoc.addPage([792, 612]);

    // Convert canvas to PNG
    const pngDataUrl = canvas.toDataURL('image/png');
    const pngImageBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(pngImageBytes);

    // Calculate scaling to fit letter size landscape with margins
    const margin = 28.8; // 0.4 inches = 28.8 points
    const maxWidth = 792 - (margin * 2); // Landscape: page width (11") minus margins
    const maxHeight = 612 - (margin * 2); // Landscape: page height (8.5") minus margins

    const imageAspect = canvas.width / canvas.height;
    const pageAspect = maxWidth / maxHeight;

    let drawWidth, drawHeight;

    if (imageAspect > pageAspect) {
      // Image is wider, fit to width
      drawWidth = maxWidth;
      drawHeight = maxWidth / imageAspect;
    } else {
      // Image is taller, fit to height
      drawHeight = maxHeight;
      drawWidth = maxHeight * imageAspect;
    }

    // Center the image on the page (landscape dimensions)
    const x = (792 - drawWidth) / 2;
    const y = (612 - drawHeight) / 2;

    console.log('Drawing image at:', { x, y, width: drawWidth, height: drawHeight });

    // Draw the image
    page.drawImage(pngImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    console.log('PDF generated, size:', pdfBytes.length);

    return pdfBytes;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    // Clean up
    document.body.removeChild(wrapper);
  }
}
