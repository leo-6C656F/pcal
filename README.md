# PCAL - Parent-Child Activity Log

**Version:** 1.0 (Build Bible Implementation)
**Target:** Head Start Programs
**Core Constraint:** 100% Offline, Local-First, Fault-Tolerant PWA

## Overview

PCAL is a Progressive Web Application designed for tracking parent-child developmental activities in Head Start programs. The application operates completely offline, uses event sourcing for data integrity, and generates "smart PDFs" with embedded metadata for backup and restore.

## Architecture

### Event Sourcing (The Journal)
- All user actions are stored as immutable events in IndexedDB
- Events are the source of truth
- Application state is derived by replaying events
- Crash recovery: Replay journal to restore exact state

### Smart PDF (The Backup)
- PDFs contain embedded JSON metadata
- Import PDF feature restores full editable state
- No backend server required for backups

### Coordinate-Based PDF Generation
- Uses `pdf-lib` for precise coordinate-based layout
- NO html2canvas or jspdf HTML rendering
- Matches official Head Start form layout

## Technical Stack

- **Framework:** React 18 + TypeScript + Vite
- **State Management:** Zustand (UI) + Dexie.js (IndexedDB)
- **PDF Generation:** pdf-lib
- **Time Utilities:** date-fns
- **Signature Capture:** react-signature-canvas
- **Styling:** Tailwind CSS
- **PWA:** vite-plugin-pwa + Workbox

## Project Structure

```
pcal/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx
│   │   ├── DailyEntryForm.tsx
│   │   ├── GoalSelector.tsx
│   │   ├── TimeInput.tsx
│   │   ├── SignaturePad.tsx
│   │   └── PDFPreview.tsx
│   ├── services/            # Business logic
│   │   ├── aiService.ts     # Waterfall AI logic
│   │   ├── journalReplay.ts # Event sourcing
│   │   └── pdfGenerator.ts  # PDF generation
│   ├── constants.ts         # Hard-coded goals & PDF coordinates
│   ├── db.ts               # Dexie database schema
│   ├── store.ts            # Zustand state management
│   ├── types.ts            # TypeScript interfaces
│   └── App.tsx             # Main app component
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Key Features

### 1. Event Sourcing
Every action is recorded as an immutable event:
- `ENTRY_CREATED`
- `LINE_ADDED`
- `LINE_UPDATED`
- `LINE_DELETED`
- `SIGNATURE_SAVED`
- `PDF_EXPORTED`

### 2. Time Entry (Dual Mode)
- **Mode 1:** Start + Duration → End (calculated)
- **Mode 2:** Start + End → Duration (calculated)

### 3. AI Summary (Waterfall Logic)
1. **Tier 1:** Browser Native AI (`window.ai`) if available
2. **Tier 2:** User's OpenAI API Key (GPT-4o-mini)
3. **Tier 3:** Deterministic fallback (always works offline)

### 4. Hard-Coded Developmental Goals

**Goal 1:** Child will manage actions and behavior with support of familiar adults.
- Visuals
- Imitation (Good listening, stop)
- Encourage positive behavior 'Thank you for listening'
- Taking turns

**Goal 2:** Child will show awareness about self and how to connect with others.
- Mirror play (eyes, nose, mouth)
- Family pictures and naming who is there

**Goal 3:** Child will comprehend meaning from pictures and stories.
- Reading books and being descriptive

**Goal 4:** Will use spatial awareness to understand their movement in space.
- Working on puzzles
- Putting in and taking out toys
- Rolling balls under/around objects

**Goal 5:** Will demonstrate effective and efficient use of large muscles for movement.
- Cruising against furniture
- Balancing on her own
- Obstacle course
- Walking with parent

**Goal 6:** Child will communicate needs and wants non-verbally and by using language.
- Using sign language (more, all done)
- Enunciating words (More m m m)
- Repetition with songs (Brown Bear)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Data Schema

### JournalEvent
```typescript
interface JournalEvent {
  id: string;          // UUID
  timestamp: number;   // Date.now()
  type: 'ENTRY_CREATED' | 'LINE_ADDED' | ...;
  payload: any;        // Event data
  checksum: string;    // SHA-256 integrity check
}
```

### DailyEntry
```typescript
interface DailyEntry {
  id: string;
  date: string;        // "YYYY-MM-DD"
  childId: string;
  lines: ActivityLine[];
  signatureBase64?: string;
  aiSummary?: string;
  isLocked: boolean;
}
```

### ActivityLine
```typescript
interface ActivityLine {
  id: string;
  goalCode: 1 | 2 | 3 | 4 | 5 | 6;
  selectedActivities: string[];
  customNarrative: string;
  startTime: string;   // "09:00"
  endTime: string;     // "09:30"
  durationMinutes: number;
}
```

## PDF Coordinate Map

- **Page Size:** Letter (612 x 792 points)
- **Max Lines Per Page:** 15
- **Header:** Center name, Teacher, Child name
- **Grid:** Date, Narrative, Goal Code, Start Time, End Time, Elapsed Time
- **Footer:** Total Hours

## Fault Tolerance

The app implements a recovery flow:

1. On app launch, check if DailyEntries table is empty
2. If empty but Journal has data → Crash detected
3. Replay all journal events to rebuild state
4. Verify checksums for data integrity
5. Restore application to exact pre-crash state

## Offline Support

- All data stored in IndexedDB (Dexie.js)
- Service Worker caches all assets
- No network required for core functionality
- Optional: OpenAI API for enhanced summaries (requires network)

## Browser Compatibility

- Modern browsers with IndexedDB support
- Chrome/Edge (recommended for `window.ai` support)
- Firefox, Safari (fallback AI only)

## License

Built for Head Start Programs - Educational Use

## Support

For issues or questions, please refer to the Build Bible specification document.
