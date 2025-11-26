import {
  Document,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  ShadingType,
  PageOrientation,
  convertInchesToTwip
} from 'docx';
import type { DailyEntry, ChildContext, Goal } from '../types';
import { format, parse } from 'date-fns';

/**
 * Client-Side Word Document Generator
 * Uses docx library to generate .docx files
 * Fully client-side, no server required
 */

interface WordDocOptions {
  entries: DailyEntry[];
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
  logoBase64?: string;
}

interface AggregatedDailyActivity {
  date: string;
  description: string;
  goalCodes: number[];
  startTime: string;
  endTime: string;
  totalMinutes: number;
}

/**
 * Aggregate activities by date
 */
async function aggregateDailyActivities(entries: DailyEntry[]): Promise<AggregatedDailyActivity[]> {
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
      totalMinutes
    });
  }

  return aggregated;
}

/**
 * Create black border for all sides
 */
const blackBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
};

/**
 * Generate Word Document for PCAL form
 * Returns a Document object that can be converted to a Blob
 */
export async function generateWordDocument(options: WordDocOptions): Promise<Document> {
  const { entries, child, centerName, teacherName, goals } = options;

  if (entries.length === 0) {
    throw new Error('No entries to generate document');
  }

  const aggregatedActivities = await aggregateDailyActivities(entries);

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

  const docChildren: (Paragraph | Table)[] = [];

  // Title
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'PARENT-CHILD ACTIVITY LOG (PCAL) IN-KIND FORM',
          bold: true,
          size: 28,
          font: 'Times New Roman'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  // Header info table
  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
        insideHorizontal: { style: BorderStyle.NONE, size: 0 },
        insideVertical: { style: BorderStyle.NONE, size: 0 }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `CENTER: ${centerName}`, bold: true, font: 'Times New Roman', size: 22 })] })],
              borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
              width: { size: 40, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `TEACHER/HOME VISITOR: ${teacherName}`, bold: true, font: 'Times New Roman', size: 22 })] })],
              borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
              width: { size: 40, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `MONTH/YEAR: ${monthYear}`, bold: true, font: 'Times New Roman', size: 22 })] })],
              borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
              width: { size: 20, type: WidthType.PERCENTAGE }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `CHILD'S NAME: ${child.name}`, bold: true, font: 'Times New Roman', size: 22 })] })],
              borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
              columnSpan: 3
            })
          ]
        })
      ]
    })
  );

  // Goals table
  const goalsTableRows: TableRow[] = [];

  // Goals header
  goalsTableRows.push(
    new TableRow({
      children: sixGoals.map((_goal, index) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `GOAL ${index + 1}`, bold: true, font: 'Times New Roman', size: 20 })], alignment: AlignmentType.CENTER })],
          borders: blackBorder,
          width: { size: 100 / 6, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER
        })
      )
    })
  );

  // Goals content
  goalsTableRows.push(
    new TableRow({
      children: sixGoals.map((goal) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: goal.description || '', font: 'Times New Roman', size: 20 })] })],
          borders: blackBorder,
          width: { size: 100 / 6, type: WidthType.PERCENTAGE }
        })
      )
    })
  );

  // Activities header
  goalsTableRows.push(
    new TableRow({
      children: sixGoals.map(() =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Activities', bold: true, italics: true, font: 'Times New Roman', size: 18 })] })],
          borders: blackBorder,
          width: { size: 100 / 6, type: WidthType.PERCENTAGE }
        })
      )
    })
  );

  // Activities content
  const maxActivities = Math.max(...sixGoals.map(g => g.activities.length), 3);
  for (let i = 0; i < maxActivities; i++) {
    goalsTableRows.push(
      new TableRow({
        children: sixGoals.map((goal) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: goal.activities[i] ? `• ${goal.activities[i]}` : '', font: 'Times New Roman', size: 18 })] })],
            borders: blackBorder,
            width: { size: 100 / 6, type: WidthType.PERCENTAGE }
          })
        )
      })
    );
  }

  docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: goalsTableRows }));

  // Activity log table
  const logTableRows: TableRow[] = [];

  // Log header
  logTableRows.push(
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true, font: 'Times New Roman', size: 20, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })], borders: blackBorder, shading: { fill: '000000', type: ShadingType.SOLID }, width: { size: 10, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Activity Description', bold: true, font: 'Times New Roman', size: 20, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })], borders: blackBorder, shading: { fill: '000000', type: ShadingType.SOLID }, width: { size: 40, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Goal #', bold: true, font: 'Times New Roman', size: 20, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })], borders: blackBorder, shading: { fill: '000000', type: ShadingType.SOLID }, width: { size: 10, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Start Time', bold: true, font: 'Times New Roman', size: 20, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })], borders: blackBorder, shading: { fill: '000000', type: ShadingType.SOLID }, width: { size: 10, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'End Time', bold: true, font: 'Times New Roman', size: 20, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })], borders: blackBorder, shading: { fill: '000000', type: ShadingType.SOLID }, width: { size: 10, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Signature', bold: true, font: 'Times New Roman', size: 20, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })], borders: blackBorder, shading: { fill: '000000', type: ShadingType.SOLID }, width: { size: 10, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Elapsed Time', bold: true, font: 'Times New Roman', size: 20, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })], borders: blackBorder, shading: { fill: 'DBE4F1', type: ShadingType.SOLID }, width: { size: 10, type: WidthType.PERCENTAGE } })
      ]
    })
  );

  // Activity rows
  for (const activity of aggregatedActivities) {
    const formattedDate = format(parse(activity.date, 'yyyy-MM-dd', new Date()), 'M/d');
    logTableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formattedDate, font: 'Times New Roman', size: 20 })] })], borders: blackBorder, width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: activity.description, font: 'Times New Roman', size: 20 })] })], borders: blackBorder, width: { size: 40, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: activity.goalCodes.join(', '), font: 'Times New Roman', size: 20 })], alignment: AlignmentType.CENTER })], borders: blackBorder, width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: activity.startTime, font: 'Times New Roman', size: 20 })], alignment: AlignmentType.CENTER })], borders: blackBorder, width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: activity.endTime, font: 'Times New Roman', size: 20 })], alignment: AlignmentType.CENTER })], borders: blackBorder, width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph('')], borders: blackBorder, width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${activity.totalMinutes}`, font: 'Times New Roman', size: 20 })], alignment: AlignmentType.CENTER })], borders: blackBorder, shading: { fill: 'DBE4F1', type: ShadingType.SOLID }, width: { size: 10, type: WidthType.PERCENTAGE } })
        ]
      })
    );
  }

  // Total row
  logTableRows.push(
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('')], borders: blackBorder, columnSpan: 6 }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `TOTAL: ${totalHours} hrs`, bold: true, font: 'Times New Roman', size: 20 })], alignment: AlignmentType.CENTER })], borders: blackBorder, shading: { fill: 'DBE4F1', type: ShadingType.SOLID }, width: { size: 10, type: WidthType.PERCENTAGE } })
      ]
    })
  );

  docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: logTableRows }));

  // Signatures
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: 'Parent Signature: _________________________    Date: __________', bold: true, font: 'Times New Roman', size: 22 })],
      spacing: { before: 300, after: 200 }
    })
  );

  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: 'Teacher/Home Visitor Signature: _________________________    Date: __________', bold: true, font: 'Times New Roman', size: 22 })],
      spacing: { after: 200 }
    })
  );

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.4),
            right: convertInchesToTwip(0.4),
            bottom: convertInchesToTwip(0.4),
            left: convertInchesToTwip(0.4)
          },
          size: {
            orientation: PageOrientation.LANDSCAPE
          }
        }
      },
      children: docChildren
    }]
  });
}

/**
 * Download Word document as .docx file
 */
export function downloadWordDocument(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
