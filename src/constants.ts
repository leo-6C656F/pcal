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
 * PDF Coordinate Map - Letter size (612 x 792 points)
 */
export const PDF_COORDINATES = {
  PAGE_WIDTH: 612,
  PAGE_HEIGHT: 792,
  MAX_LINES_PER_PAGE: 15,

  // Header fields
  HEADER: {
    CENTER_NAME: { x: 50, y: 700 },
    TEACHER: { x: 250, y: 700 },
    CHILD_NAME: { x: 50, y: 680 }
  },

  // Grid layout
  GRID: {
    Y_START: 650,
    ROW_HEIGHT: 26,
    DATE_COLUMN: 62,
    NARRATIVE_COLUMN: 140,
    NARRATIVE_WIDTH: 315,
    GOAL_CODE_COLUMN: 460,
    START_TIME_COLUMN: 495,
    END_TIME_COLUMN: 550,
    SIGNATURE_COLUMN: 605,
    ELAPSED_TIME_COLUMN: 730
  },

  // Footer
  FOOTER: {
    TOTAL_HOURS: { x: 620, y: 50 }
  }
};
