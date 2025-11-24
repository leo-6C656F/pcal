import type { Goal } from './types';

/**
 * Hard-coded business data for the 6 developmental goals.
 * DO NOT MODIFY - These must match the official Head Start form.
 */
export const GOALS: Goal[] = [
  {
    code: 1,
    description: "Child will manage actions and behavior with support of familiar adults.",
    activities: [
      "Visuals",
      "Imitation (Good listening, stop)",
      "Encourage positive behavior 'Thank you for listening'",
      "Taking turns"
    ]
  },
  {
    code: 2,
    description: "Child will show awareness about self and how to connect with others.",
    activities: [
      "Mirror play (eyes, nose, mouth)",
      "Family pictures and naming who is there"
    ]
  },
  {
    code: 3,
    description: "Child will comprehend meaning from pictures and stories.",
    activities: [
      "Reading books and being descriptive"
    ]
  },
  {
    code: 4,
    description: "Will use spatial awareness to understand their movement in space.",
    activities: [
      "Working on puzzles",
      "Putting in and taking out toys",
      "Rolling balls under/around objects"
    ]
  },
  {
    code: 5,
    description: "Will demonstrate effective and efficient use of large muscles for movement.",
    activities: [
      "Cruising against furniture",
      "Balancing on her own",
      "Obstacle course",
      "Walking with parent"
    ]
  },
  {
    code: 6,
    description: "Child will communicate needs and wants non-verbally and by using language.",
    activities: [
      "Using sign language (more, all done)",
      "Enunciating words (More m m m)",
      "Repetition with songs (Brown Bear)"
    ]
  }
];

/**
 * PDF Coordinate Map - Exact match to Orange County Head Start PCAL form
 * Letter size (612 x 792 points)
 * Updated to match HTML/CSS design with improved spacing and typography
 */
export const PDF_COORDINATES = {
  PAGE_WIDTH: 612,
  PAGE_HEIGHT: 792,

  // Margins (0.5 inches = 36 points)
  MARGIN: 36,

  // Border styling - exact match to official form
  BORDER_WIDTH: 0.5,  // 0.5pt as per specification

  // Colors - exact match to official form
  COLORS: {
    BORDER_COLOR: { r: 0, g: 0, b: 0 },
    TABLE_HEADER_BG: { r: 1, g: 1, b: 1 },  // Pure white
    TABLE_CELL_SHADE: { r: 1, g: 1, b: 1 },  // Pure white (no shading)
    ACTIVITIES_HEADER_BG: { r: 1, g: 1, b: 1 },  // Pure white
    ACTIVITIES_HEADER_TEXT: { r: 0, g: 0, b: 0 },  // Black text
    TEXT_DARK: { r: 0, g: 0, b: 0 },
    TEXT_GRAY: { r: 0.27, g: 0.27, b: 0.27 },
    TEXT_RED: { r: 0.64, g: 0.22, b: 0.17 }  // Dark red #A4372B for "Original copy to Accounting"
  },

  // Logo and Title section - logo flush left, title centered
  LOGO: {
    Y: 748,           // Vertically centered with title
    HEIGHT: 27,       // Scaled proportionally (maintaining aspect ratio)
    WIDTH: 97,        // 1.35in = 97pt (per HTML template)
    X: 36             // Flush left at margin
  },

  TITLE: {
    Y: 752,           // Same baseline as logo (centered)
    SIZE: 12,         // 12pt bold as per specification
    LOGO_NOTE_Y: 745,
    LOGO_NOTE_SIZE: 9
  },

  // Header fields - two rows with proper alignment per HTML template
  HEADER_FIELDS: {
    Y_START: 720,
    LINE_HEIGHT: 20,  // Spacing between rows
    LABEL_SIZE: 10,   // 10pt Arial
    VALUE_SIZE: 10,
    GAP: 12,          // 0.17in = 12pt gap between columns (per HTML template)
    LABEL_OFFSET: 5,  // Raise labels above underline
    TEXT_PADDING: 3,  // 3pt left padding from underline

    // Row 1: 3 columns with 12pt gaps - (540 - 24) / 3 = 172pt per column
    COL_WIDTH_ROW1: 172,

    // Row 2: 2 columns with 12pt gap - (540 - 12) / 2 = 264pt per column
    COL_WIDTH_ROW2: 264,

    // Row 1 column positions
    CENTER_LABEL_X: 36,
    CENTER_VALUE_X: 39,
    CENTER_WIDTH: 172,

    TEACHER_LABEL_X: 220,  // 36 + 172 + 12
    TEACHER_VALUE_X: 223,
    TEACHER_WIDTH: 172,

    MONTH_LABEL_X: 404,    // 36 + 172 + 12 + 172 + 12
    MONTH_VALUE_X: 407,
    MONTH_WIDTH: 172,

    // Row 2 column positions
    CHILD_LABEL_X: 36,
    CHILD_VALUE_X: 39,
    CHILD_WIDTH: 264,

    PARENT_LABEL_X: 312,   // 36 + 264 + 12
    PARENT_VALUE_X: 315,
    PARENT_WIDTH: 264
  },

  // Instruction text below header - centered italic (no markdown)
  INSTRUCTION_TEXT: {
    Y: 680,
    SIZE: 9,  // 9pt italic Arial
    TEXT: "Teacher is to set goals with parent based on child's individual needs and list suggested home activities to meet these goals"
  },

  // Goals reference table - 6 equal columns, 0.95in row height (per HTML template)
  GOALS_TABLE: {
    Y_START: 660,
    HEADER_HEIGHT: 20,  // 10pt bold + padding
    CELL_HEIGHT: 68,    // 0.95in = 68.4pt (rounded to 68pt)
    GOAL_WIDTH: 90,     // 540pt / 6 = 90pt per column
    START_X: 36,
    FONT_SIZE: 10,      // 10pt bold headers
    PADDING_V: 4,       // 4pt top & bottom
    PADDING_H: 6        // 6pt left & right
  },

  // Activities section - bold 10pt, all caps header
  ACTIVITIES_SECTION: {
    Y: 568,
    HEIGHT: 18,         // Space for 10pt bold
    FONT_SIZE: 10       // 10pt bold, all caps
  },

  // Activities by goal - 6 columns aligned under goals
  GOAL_ACTIVITIES: {
    Y_START: 550,
    ROW_HEIGHT: 60,     // Sufficient for bullet list
    GOAL_WIDTH: 90,     // Match GOALS_TABLE width (540pt / 6 = 90pt)
    START_X: 36,
    FONT_SIZE: 9,       // 9pt for activity text
    TITLE_SIZE: 10,     // 10pt bold for "Goal X Activities"
    PADDING_V: 4,       // 4pt top & bottom
    PADDING_H: 6        // 6pt left & right
  },

  // Guidance note above log table
  GUIDANCE_NOTE: {
    Y: 425,
    SIZE: 9,  // 9pt italic as per HTML
    TEXT: 'Write down what the parent and child did together to make progress towards this goal. For example: Parent read "Polar Bear, Polar Bear" and discussed animals and animal sounds with the child.'
  },

  // Main data entry table - exact column widths as specified
  DATA_TABLE: {
    Y_START: 400,
    HEADER_Y: 415,
    ROW_HEIGHT: 32,     // 0.4-0.45in = 29-32pt for handwriting
    MAX_ROWS: 8,
    FONT_SIZE: 9,       // Arial 9pt
    HEADER_FONT_SIZE: 8,  // Arial 8pt bold (reduced to fit two lines in 20pt cell)
    PADDING: 4,

    // Column widths proportionally scaled from 0.9|3.8|0.7|0.8|0.8|1.4|0.9 inches
    DATE_X: 36,
    DATE_WIDTH: 52,

    ACTIVITY_DESC_X: 88,
    ACTIVITY_DESC_WIDTH: 221,

    GOAL_NUM_X: 309,
    GOAL_NUM_WIDTH: 41,

    START_TIME_X: 350,
    START_TIME_WIDTH: 46,

    END_TIME_X: 396,
    END_TIME_WIDTH: 46,

    SIGNATURE_X: 442,
    SIGNATURE_WIDTH: 81,

    ELAPSED_X: 523,
    ELAPSED_WIDTH: 53
  },

  // Footer section - signature lines, totals box
  FOOTER: {
    TEACHER_SIG_Y: 120,
    SUPERVISOR_SIG_Y: 90,
    SIG_LINE_X: 36,
    SIG_LINE_WIDTH: 300,
    DATE_X: 360,
    DATE_WIDTH: 80,

    LABEL_SIZE: 10,       // Arial 10pt
    OFFSET_Y: 3,

    // Totals box - right-aligned, 1.55in wide, aligned with signature lines
    TOTALS_X: 464,        // 612 - 36 - 112 = 464
    TOTALS_START_Y: 150,
    TOTALS_WIDTH: 112,    // 1.55in = 112pt (per HTML template)
    TOTALS_ROW_HEIGHT: 20,
    TOTALS_LABEL_WIDTH: 67,
    TOTALS_VALUE_WIDTH: 45,
    TOTALS_FONT_SIZE: 10,    // Bold 10pt
    TOTALS_PADDING: 4,

    ACCOUNTING_NOTE_Y: 58,  // 0.4in from bottom = 36 + 22
    ACCOUNTING_NOTE_SIZE: 9  // Arial 9pt
  }
};
