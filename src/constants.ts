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

  // Border styling
  BORDER_WIDTH: 0.6,

  // Colors
  COLORS: {
    BORDER_COLOR: { r: 0, g: 0, b: 0 },
    TABLE_HEADER_BG: { r: 0.95, g: 0.95, b: 0.95 },  // #f3f3f3
    TABLE_CELL_SHADE: { r: 0.85, g: 0.9, b: 0.95 },
    TEXT_DARK: { r: 0, g: 0, b: 0 },
    TEXT_GRAY: { r: 0.27, g: 0.27, b: 0.27 }  // #444
  },

  // Title section
  TITLE: {
    Y: 735,
    SIZE: 12,  // 12pt as per HTML
    LOGO_NOTE_Y: 745,
    LOGO_NOTE_SIZE: 9  // 9pt as per HTML
  },

  // Header fields (CENTER, TEACHER, CHILD NAME, PARENT NAME, MONTH/YEAR)
  // Using CSS grid layout: 3 columns with 12pt gap
  HEADER_FIELDS: {
    Y_START: 700,
    LINE_HEIGHT: 18,  // Increased for 10pt font
    LABEL_SIZE: 10,   // 10pt as per HTML
    VALUE_SIZE: 10,   // 10pt as per HTML
    GAP: 12,          // 12pt gap between columns

    // Column widths (evenly distributed with gaps)
    COL_WIDTH: 180,

    CENTER_LABEL_X: 36,
    CENTER_VALUE_X: 36,

    TEACHER_LABEL_X: 228,  // 36 + 180 + 12
    TEACHER_VALUE_X: 228,

    MONTH_LABEL_X: 420,    // 36 + 180 + 12 + 180 + 12
    MONTH_VALUE_X: 420,

    CHILD_LABEL_X: 36,
    CHILD_VALUE_X: 36,

    PARENT_LABEL_X: 228,
    PARENT_VALUE_X: 228
  },

  // Instruction text below header
  INSTRUCTION_TEXT: {
    Y: 655,
    SIZE: 9,  // 9pt italic as per HTML
    TEXT: "Teacher is to set goals with parent based on child's individual needs and list suggested home activities to meet these goals"
  },

  // Goals reference table at top (GOAL 1 through GOAL 6)
  GOALS_TABLE: {
    Y_START: 635,
    HEADER_HEIGHT: 18,  // Increased for 10pt font + padding
    CELL_HEIGHT: 50,    // Increased for better readability (42pt in HTML)
    GOAL_WIDTH: 90,
    START_X: 36,
    FONT_SIZE: 10,      // 10pt as per HTML
    PADDING: 6          // 6pt padding as per HTML
  },

  // Activities section header
  ACTIVITIES_SECTION: {
    Y: 505,
    HEIGHT: 14,         // Increased for 10pt font
    FONT_SIZE: 10       // 10pt uppercase as per HTML
  },

  // Activities by goal (the list under each goal)
  GOAL_ACTIVITIES: {
    Y_START: 490,
    ROW_HEIGHT: 50,     // Increased for better content fit
    GOAL_WIDTH: 90,
    START_X: 36,
    FONT_SIZE: 10,      // 10pt as per HTML
    TITLE_SIZE: 10,     // 10pt bold for titles
    PADDING: 6          // 6pt padding as per HTML
  },

  // Guidance note above log table
  GUIDANCE_NOTE: {
    Y: 425,
    SIZE: 9,  // 9pt italic as per HTML
    TEXT: 'Write down what the parent and child did together to make progress towards this goal. For example: Parent read "Polar Bear, Polar Bear" and discussed animals and animal sounds with the child.'
  },

  // Main data entry table
  DATA_TABLE: {
    Y_START: 400,
    HEADER_Y: 415,
    ROW_HEIGHT: 20,     // 20pt height as per HTML
    MAX_ROWS: 8,
    FONT_SIZE: 10,      // 10pt as per HTML
    HEADER_FONT_SIZE: 10,  // 10pt as per HTML
    PADDING: 6,         // 6pt padding as per HTML

    // Column X positions and widths (matching HTML table)
    DATE_X: 36,
    DATE_WIDTH: 72,     // 1.0in

    ACTIVITY_DESC_X: 108,
    ACTIVITY_DESC_WIDTH: 200,

    GOAL_NUM_X: 308,
    GOAL_NUM_WIDTH: 58,  // 0.8in

    START_TIME_X: 366,
    START_TIME_WIDTH: 65,  // 0.9in

    END_TIME_X: 431,
    END_TIME_WIDTH: 65,  // 0.9in

    SIGNATURE_X: 496,
    SIGNATURE_WIDTH: 115,  // 1.6in adjusted

    ELAPSED_X: 519,
    ELAPSED_WIDTH: 65   // 0.9in
  },

  // Footer section with signature lines and totals
  FOOTER: {
    TEACHER_SIG_Y: 120,
    SUPERVISOR_SIG_Y: 90,
    SIG_LINE_X: 36,
    SIG_LINE_WIDTH: 320,  // 1.5fr proportion
    DATE_X: 380,          // Adjusted for grid layout
    DATE_WIDTH: 100,      // 0.8fr proportion

    LABEL_SIZE: 10,       // 10pt as per HTML
    OFFSET_Y: 3,

    // Totals box on right (absolute positioned)
    TOTALS_X: 476,        // Right side (1.4in from right = 612 - 36 - 100)
    TOTALS_START_Y: 150,
    TOTALS_WIDTH: 100,    // 1.4in width
    TOTALS_ROW_HEIGHT: 20,
    TOTALS_LABEL_WIDTH: 65,  // 65% of width
    TOTALS_VALUE_WIDTH: 35,  // 35% of width
    TOTALS_FONT_SIZE: 10,    // 10pt as per HTML
    TOTALS_PADDING: 6,

    ACCOUNTING_NOTE_Y: 50,
    ACCOUNTING_NOTE_SIZE: 9  // 9pt as per HTML
  }
};
