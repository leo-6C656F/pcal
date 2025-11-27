import type { DailyEntry, ChildContext, Goal } from '../types';
import { format, parse, startOfWeek } from 'date-fns';

/**
 * HTML Template Generator
 * Generates HTML that matches the exact PCAL form template structure
 * for server-side PDF generation using Puppeteer
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
 * Group activities by week (Sunday to Saturday)
 */
function groupActivitiesByWeek(activities: AggregatedDailyActivity[]): AggregatedDailyActivity[][] {
  if (activities.length === 0) return [];

  // Sort activities by date
  const sortedActivities = [...activities].sort((a, b) => a.date.localeCompare(b.date));

  // Group by week
  const weekGroups: Map<string, AggregatedDailyActivity[]> = new Map();

  sortedActivities.forEach(activity => {
    const activityDate = parse(activity.date, 'yyyy-MM-dd', new Date());
    // Get the start of the week (Sunday)
    const weekStart = startOfWeek(activityDate, { weekStartsOn: 0 }); // 0 = Sunday

    // Create a key for this week (using the week start date)
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!weekGroups.has(weekKey)) {
      weekGroups.set(weekKey, []);
    }
    weekGroups.get(weekKey)!.push(activity);
  });

  // Convert map to array of arrays, sorted by week start date
  return Array.from(weekGroups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, activities]) => activities);
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

  // Get date range
  const startDate = entries[0].date;
  const monthYear = format(parse(startDate, 'yyyy-MM-dd', new Date()), 'yyyy');

  // Ensure we have exactly 6 goals (pad with empty if needed)
  const sixGoals = [...goals];
  while (sixGoals.length < 6) {
    sixGoals.push({ code: sixGoals.length + 1, description: '', activities: [] });
  }

  // Group activities by week (Sunday to Saturday)
  const activityPages: AggregatedDailyActivity[][] = groupActivitiesByWeek(aggregatedActivities);

  // Determine font sizes based on content density
  const descriptionFontSize = aggregatedActivities.length > 6 ? '9px' : '10.5px';
  const goalDescFontSize = aggregatedActivities.length > 6 ? '8px' : '9px';
  const activityFontSize = aggregatedActivities.length > 6 ? '7.5px' : '8.5px';

  // Helper function to generate a single page
  const generatePage = (pageActivities: AggregatedDailyActivity[]) => {
    const fillRows = Math.max(0, 10 - pageActivities.length);

    // Calculate total for THIS page
    const pageTotal = pageActivities.reduce((sum, activity) => sum + activity.totalMinutes, 0);
    const pageTotalHours = (pageTotal / 60).toFixed(2);

    return `
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
                    ${sixGoals.map(goal => `<td style="height: 35px; font-size: ${goalDescFontSize}; line-height: 1.2;">${goal.description}</td>`).join('')}
                </tr>
                <tr>
                    <td colspan="6" class="activities-header" style="text-transform: uppercase;">ACTIVITIES TO SUPPORT HS/EHS Classroom experience and Child's Individual Goals</td>
                </tr>
                <tr>
                    ${sixGoals.map(goal => `<td class="sub-goal-header">Goal ${goal.code} Activities</td>`).join('')}
                </tr>
                <tr>
                    ${sixGoals.map(goal => `
                        <td class="cell-content" style="height: 45px; font-size: ${activityFontSize}; line-height: 1.1;">
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
                ${pageActivities.map((activity, index) => {
                    const offsets = [-5, -3, -1, 0, 1, -4, -2, 2, 3, -6];
                    const topOffset = offsets[index % offsets.length];
                    return `
                    <tr>
                        <td>${format(parse(activity.date, 'yyyy-MM-dd', new Date()), 'MM/dd/yy')}</td>
                        <td style="font-size: ${descriptionFontSize}; line-height: 1.2;">${activity.description}</td>
                        <td style="text-align: center;">${activity.goalCodes.join(', ')}</td>
                        <td>${activity.startTime}</td>
                        <td>${activity.endTime}</td>
                        <td style="padding: 0; position: relative; height: 26px; overflow: visible;">${activity.signatureBase64 ? `<img src="${activity.signatureBase64}" style="position: absolute; top: 50%; left: 2px; transform: translateY(calc(-50% + ${topOffset}px)); max-height: 24px; max-width: calc(100% - 4px); height: auto; object-fit: contain; mix-blend-mode: multiply;" alt="Signature" />` : ''}</td>
                        <td class="grey-col">${(activity.totalMinutes / 60).toFixed(2)}</td>
                    </tr>
                `}).join('')}
                ${Array(fillRows).fill(0).map(() => `
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
            <div class="totals-wrapper">
                <div class="totals-box">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="border: 1px solid black; padding: 2px 3px; font-weight: bold; background-color: #dbe4f1;">TOTAL HRS</td>
                            <td style="border: 1px solid black; padding: 2px 3px; background-color: #dbe4f1;">${pageTotalHours}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid black; padding: 2px 3px; font-weight: bold; background-color: #dbe4f1;">HRLY RATE</td>
                            <td style="border: 1px solid black; padding: 2px 3px; background-color: #dbe4f1;"></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid black; padding: 2px 3px; font-weight: bold; background-color: #dbe4f1;">TOTAL $</td>
                            <td style="border: 1px solid black; padding: 2px 3px; background-color: #dbe4f1;"></td>
                        </tr>
                    </table>
                </div>
                <div style="text-align: center; color: red; font-size: 10px; font-weight: normal; margin-top: 2px; width: 100%;">Original copy to Accounting</div>
            </div>
        </div>
    </div>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PCAL In-Kind Form</title>
    <style>
        /* Page rules for print/PDF generation */
        @page {
            size: letter landscape;
            margin: 0.25in;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .page-container {
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }

            .page-container:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
            }

            /* Ensure logo images are always visible on print */
            .logo-image {
                display: block !important;
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }

        body {
            font-family: "Times New Roman", Times, serif;
            background-color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0;
            margin: 0;
            color: black;
        }

        .page-container {
            width: 1050px;
            background-color: white;
            padding: 20px;
            position: relative;
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .page-container:last-child {
            page-break-after: avoid;
            break-after: avoid;
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
            width: 120px;
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
            height: 15px;
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
            padding-top: 8px;
            font-size: 11px;
            font-weight: bold;
        }

        .signature-line {
            margin-top: 12px;
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

        .totals-wrapper {
            width: 17%;
            font-size: 10px;
            font-weight: bold;
            margin-right: 0px;
            margin-top: -1px;
        }

        .totals-box {
            border-left: 1px solid black;
            border-right: 1px solid black;
            border-bottom: 1px solid black;
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
    ${activityPages.map((pageActivities) => generatePage(pageActivities)).join('')}
</body>
</html>`;
}

