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
  ImageRun,
  ShadingType,
  PageOrientation,
  convertInchesToTwip
} from 'docx';
import type { DailyEntry, ChildContext, Goal } from '../types';
import { format, parse } from 'date-fns';

/**
 * Word Document Generator for PCAL Form
 * Generates .docx files that match the HTML template structure
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
 * Convert base64 to buffer for docx image
 */
function base64ToBuffer(base64: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
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
 */
export async function generateWordDocument(options: WordDocOptions): Promise<Document> {
  const { entries, child, centerName, teacherName, goals, logoBase64 } = options;

  if (entries.length === 0) {
    throw new Error('No entries to generate document');
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

  const docChildren: (Paragraph | Table)[] = [];

  // Header with logo
  if (logoBase64) {
    try {
      const logoBuffer = base64ToBuffer(logoBase64);
      docChildren.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: logoBuffer as any, // Cast to any to avoid type issues with Buffer
              transformation: {
                width: 150,
                height: 75
              },
              type: 'png'
            } as any)
          ],
          alignment: AlignmentType.CENTER
        })
      );
    } catch (e) {
      console.error('Failed to add logo:', e);
    }
  }

  // Title
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'PARENT-CHILD ACTIVITY LOG (PCAL) IN-KIND FORM',
          bold: true,
          size: 32,
          font: 'Times New Roman'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  // Top info table (Center, Teacher, Month/Year)
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
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'CENTER: ', bold: true, font: 'Times New Roman', size: 22 }),
                    new TextRun({ text: centerName, bold: true, font: 'Times New Roman', size: 22, underline: {} })
                  ]
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 }
              },
              width: { size: 35, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'TEACHER/HOME VISITOR: ', bold: true, font: 'Times New Roman', size: 22 }),
                    new TextRun({ text: teacherName, bold: true, font: 'Times New Roman', size: 22, underline: {} })
                  ]
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 }
              },
              width: { size: 45, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'MONTH/YEAR: ', bold: true, font: 'Times New Roman', size: 22 }),
                    new TextRun({ text: monthYear, bold: true, font: 'Times New Roman', size: 22, underline: {} })
                  ]
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 }
              },
              width: { size: 20, type: WidthType.PERCENTAGE }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "CHILD'S NAME: ", bold: true, font: 'Times New Roman', size: 22 }),
                    new TextRun({ text: child.name, bold: true, font: 'Times New Roman', size: 22, underline: {} })
                  ]
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 }
              },
              width: { size: 45, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'PARENT NAME (Print): ', bold: true, font: 'Times New Roman', size: 22 }),
                    new TextRun({ text: '________________________', bold: true, font: 'Times New Roman', size: 22 })
                  ]
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 }
              },
              width: { size: 55, type: WidthType.PERCENTAGE },
              columnSpan: 2
            })
          ]
        })
      ],
      margins: {
        top: 50,
        bottom: 50,
        left: 0,
        right: 0
      }
    })
  );

  // Instruction text
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Please select the goals you intend to support this month and list activities to support each goal.',
          bold: true,
          font: 'Times New Roman',
          size: 20
        })
      ],
      spacing: { before: 150, after: 100 }
    })
  );

  // Goals table (6 columns)
  const goalsTableRows: TableRow[] = [];

  // Header row
  goalsTableRows.push(
    new TableRow({
      children: sixGoals.map((_goal, index) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `GOAL ${index + 1}`,
                  bold: true,
                  font: 'Times New Roman',
                  size: 18
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: blackBorder,
          width: { size: 100 / 6, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER
        })
      )
    })
  );

  // Sub-header row (Description/Activities)
  goalsTableRows.push(
    new TableRow({
      children: sixGoals.map(() =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Description',
                  bold: true,
                  italics: true,
                  font: 'Times New Roman',
                  size: 16
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: blackBorder,
          width: { size: 100 / 6, type: WidthType.PERCENTAGE }
        })
      )
    })
  );

  // Goal descriptions
  goalsTableRows.push(
    new TableRow({
      children: sixGoals.map((goal) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: goal.description || '',
                  font: 'Times New Roman',
                  size: 18
                })
              ]
            })
          ],
          borders: blackBorder,
          width: { size: 100 / 6, type: WidthType.PERCENTAGE }
        })
      )
    })
  );

  // Activities sub-header
  goalsTableRows.push(
    new TableRow({
      children: sixGoals.map(() =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Activities',
                  bold: true,
                  italics: true,
                  font: 'Times New Roman',
                  size: 16
                })
              ]
            })
          ],
          borders: blackBorder,
          shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
          width: { size: 100 / 6, type: WidthType.PERCENTAGE }
        })
      )
    })
  );

  // Activities content (find max activities count)
  const maxActivities = Math.max(...sixGoals.map(g => g.activities.length), 5);
  for (let i = 0; i < maxActivities; i++) {
    goalsTableRows.push(
      new TableRow({
        children: sixGoals.map((goal) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: goal.activities[i] ? `- ${goal.activities[i]}` : '',
                    font: 'Times New Roman',
                    size: 18
                  })
                ]
              })
            ],
            borders: blackBorder,
            width: { size: 100 / 6, type: WidthType.PERCENTAGE }
          })
        )
      })
    );
  }

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: goalsTableRows
    })
  );

  // Log table header (black row)
  const logTableRows: TableRow[] = [];

  logTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Date', bold: true, font: 'Times New Roman', size: 18, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: blackBorder,
          shading: { fill: '000000', type: ShadingType.SOLID },
          width: { size: 10, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Activity Description', bold: true, font: 'Times New Roman', size: 18, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: blackBorder,
          shading: { fill: '000000', type: ShadingType.SOLID },
          width: { size: 35, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Goal #', bold: true, font: 'Times New Roman', size: 18, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: blackBorder,
          shading: { fill: '000000', type: ShadingType.SOLID },
          width: { size: 10, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Start Time', bold: true, font: 'Times New Roman', size: 18, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: blackBorder,
          shading: { fill: '000000', type: ShadingType.SOLID },
          width: { size: 10, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'End Time', bold: true, font: 'Times New Roman', size: 18, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: blackBorder,
          shading: { fill: '000000', type: ShadingType.SOLID },
          width: { size: 10, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Signature', bold: true, font: 'Times New Roman', size: 18, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: blackBorder,
          shading: { fill: '000000', type: ShadingType.SOLID },
          width: { size: 15, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Elapsed Time', bold: true, font: 'Times New Roman', size: 18, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: blackBorder,
          shading: { fill: 'DBE4F1', type: ShadingType.SOLID },
          width: { size: 10, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER
        })
      ]
    })
  );

  // Data rows
  for (const activity of aggregatedActivities) {
    const formattedDate = format(parse(activity.date, 'yyyy-MM-dd', new Date()), 'M/d');
    const elapsedMinutes = `${activity.totalMinutes}`;

    const signatureChildren = [];
    if (activity.signatureBase64) {
      try {
        const sigBuffer = base64ToBuffer(activity.signatureBase64);
        signatureChildren.push(
          new ImageRun({
            data: sigBuffer as any, // Cast to any to avoid type issues with Buffer
            transformation: {
              width: 60,
              height: 30
            },
            type: 'png'
          } as any)
        );
      } catch (e) {
        console.error('Failed to add signature:', e);
        signatureChildren.push(new TextRun({ text: '', font: 'Times New Roman', size: 18 }));
      }
    } else {
      signatureChildren.push(new TextRun({ text: '', font: 'Times New Roman', size: 18 }));
    }

    logTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: formattedDate, font: 'Times New Roman', size: 18 })] })],
            borders: blackBorder,
            width: { size: 10, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: activity.description, font: 'Times New Roman', size: 18 })] })],
            borders: blackBorder,
            width: { size: 35, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: activity.goalCodes.join(', '), font: 'Times New Roman', size: 18 })],
              alignment: AlignmentType.CENTER
            })],
            borders: blackBorder,
            width: { size: 10, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: activity.startTime, font: 'Times New Roman', size: 18 })],
              alignment: AlignmentType.CENTER
            })],
            borders: blackBorder,
            width: { size: 10, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: activity.endTime, font: 'Times New Roman', size: 18 })],
              alignment: AlignmentType.CENTER
            })],
            borders: blackBorder,
            width: { size: 10, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: signatureChildren })],
            borders: blackBorder,
            width: { size: 15, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: elapsedMinutes, font: 'Times New Roman', size: 18 })],
              alignment: AlignmentType.CENTER
            })],
            borders: blackBorder,
            shading: { fill: 'DBE4F1', type: ShadingType.SOLID },
            width: { size: 10, type: WidthType.PERCENTAGE }
          })
        ]
      })
    );
  }

  // Add 5 empty rows
  for (let i = 0; i < 5; i++) {
    logTableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('')], borders: blackBorder, width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph('')], borders: blackBorder, width: { size: 35, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph('')], borders: blackBorder, width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph('')], borders: blackBorder, width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph('')], borders: blackBorder, width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph('')], borders: blackBorder, width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph('')], borders: blackBorder, shading: { fill: 'DBE4F1', type: ShadingType.SOLID }, width: { size: 10, type: WidthType.PERCENTAGE } })
        ]
      })
    );
  }

  // Totals row
  logTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph('')],
          borders: { ...blackBorder, top: { style: BorderStyle.NONE, size: 0 } },
          columnSpan: 6,
          width: { size: 90, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: `TOTAL HOURS: ${totalHours}`, bold: true, font: 'Times New Roman', size: 18 })],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: blackBorder,
          shading: { fill: 'DBE4F1', type: ShadingType.SOLID },
          width: { size: 10, type: WidthType.PERCENTAGE }
        })
      ]
    })
  );

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: logTableRows
    })
  );

  // Footer signatures
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Parent Signature: _________________________________    Date: ______________',
          bold: true,
          font: 'Times New Roman',
          size: 22
        })
      ],
      spacing: { before: 300, after: 200 }
    })
  );

  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Teacher/Home Visitor Signature: _________________________________    Date: ______________',
          bold: true,
          font: 'Times New Roman',
          size: 22
        })
      ],
      spacing: { after: 200 }
    })
  );

  // Revision date
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Rev. 11/2014',
          bold: true,
          font: 'Times New Roman',
          size: 18
        })
      ],
      spacing: { before: 200 }
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
