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
 */
export const PDF_COORDINATES = {
  PAGE_WIDTH: 612,
  PAGE_HEIGHT: 792,

  // Margins (0.5 inches = 36 points)
  MARGIN: 36,

  // Title section
  TITLE: {
    Y: 735,
    SIZE: 12,
    LOGO_AREA_HEIGHT: 50
  },

  // Header fields (CENTER, TEACHER, CHILD NAME, PARENT NAME, MONTH/YEAR)
  HEADER_FIELDS: {
    Y_START: 690,
    LINE_HEIGHT: 15,
    LABEL_SIZE: 8,
    VALUE_SIZE: 9,

    CENTER_LABEL_X: 36,
    CENTER_VALUE_X: 81,

    TEACHER_LABEL_X: 290,
    TEACHER_VALUE_X: 371,

    MONTH_LABEL_X: 490,
    MONTH_VALUE_X: 545,

    CHILD_LABEL_X: 36,
    CHILD_VALUE_X: 101,

    PARENT_LABEL_X: 290,
    PARENT_VALUE_X: 366
  },

  // Instruction text below header
  INSTRUCTION_TEXT: {
    Y: 655,
    SIZE: 9,
    TEXT: "Teacher is to set goals with parent based on child's individual needs and list suggested home activities to meet these goals"
  },

  // Goals reference table at top (GOAL 1 through GOAL 6)
  GOALS_TABLE: {
    Y_START: 630,
    HEADER_HEIGHT: 15,
    CELL_HEIGHT: 40,
    GOAL_WIDTH: 90,
    START_X: 36,
    FONT_SIZE: 7,
    TITLE_SIZE: 6
  },

  // Activities section header
  ACTIVITIES_SECTION: {
    Y: 400,
    HEIGHT: 12,
    FONT_SIZE: 7
  },

  // Activities by goal (the list under each goal)
  GOAL_ACTIVITIES: {
    Y_START: 382,
    ROW_HEIGHT: 35,
    GOAL_WIDTH: 90,
    START_X: 36,
    FONT_SIZE: 6,
    TITLE_SIZE: 6
  },

  // Main data entry table
  DATA_TABLE: {
    Y_START: 330,
    HEADER_Y: 345,
    ROW_HEIGHT: 25,
    MAX_ROWS: 8,
    FONT_SIZE: 8,
    HEADER_FONT_SIZE: 7,

    // Column X positions and widths
    DATE_X: 36,
    DATE_WIDTH: 50,

    ACTIVITY_DESC_X: 86,
    ACTIVITY_DESC_WIDTH: 235,

    GOAL_NUM_X: 321,
    GOAL_NUM_WIDTH: 40,

    START_TIME_X: 361,
    START_TIME_WIDTH: 40,

    END_TIME_X: 401,
    END_TIME_WIDTH: 40,

    SIGNATURE_X: 441,
    SIGNATURE_WIDTH: 93,

    ELAPSED_X: 534,
    ELAPSED_WIDTH: 42
  },

  // Footer section with signature lines and totals
  FOOTER: {
    TEACHER_SIG_Y: 115,
    SUPERVISOR_SIG_Y: 90,
    SIG_LINE_X: 36,
    SIG_LINE_WIDTH: 270,
    DATE_X: 450,
    DATE_WIDTH: 80,

    LABEL_SIZE: 8,
    OFFSET_Y: -3,

    // Totals box on right
    TOTALS_X: 534,
    TOTALS_START_Y: 115,
    TOTALS_WIDTH: 42,
    TOTALS_ROW_HEIGHT: 18,
    TOTALS_FONT_SIZE: 7,

    ACCOUNTING_NOTE_Y: 50,
    ACCOUNTING_NOTE_SIZE: 7
  }
};
