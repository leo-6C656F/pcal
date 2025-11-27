import { db, generateChecksum } from '../db';
import type { JournalEvent, DailyEntry } from '../types';

/**
 * Journal Replay Service
 * Implements Event Sourcing - Rebuilds application state from journal events
 */

/**
 * Replay all journal events to rebuild the daily entries
 */
export async function replayJournal(): Promise<DailyEntry[]> {
  console.log('[RECOVERY] Starting journal replay...');

  // Get all events sorted by timestamp
  const events = await db.journal.orderBy('timestamp').toArray();

  if (events.length === 0) {
    console.log('[RECOVERY] No events to replay');
    return [];
  }

  // Verify checksums for integrity
  for (const event of events) {
    const expectedChecksum = await generateChecksum(event.payload);
    if (event.checksum !== expectedChecksum) {
      console.error('[RECOVERY] Checksum mismatch for event:', event.id);
      throw new Error(`Journal integrity violation: Event ${event.id} has invalid checksum`);
    }
  }

  console.log(`[RECOVERY] Replaying ${events.length} events...`);

  // Rebuild state
  const entriesMap = new Map<string, DailyEntry>();

  for (const event of events) {
    applyEvent(entriesMap, event);
  }

  const entries = Array.from(entriesMap.values());

  // Save to database
  await db.dailyEntries.clear();
  await db.dailyEntries.bulkAdd(entries);

  console.log(`[RECOVERY] Restored ${entries.length} daily entries`);
  return entries;
}

/**
 * Apply a single event to the state
 */
function applyEvent(entriesMap: Map<string, DailyEntry>, event: JournalEvent): void {
  switch (event.type) {
    case 'ENTRY_CREATED': {
      const entry: DailyEntry = event.payload;
      entriesMap.set(entry.id, { ...entry });
      break;
    }

    case 'LINE_ADDED': {
      const { entryId, line } = event.payload;
      const entry = entriesMap.get(entryId);
      if (entry) {
        entry.lines.push({ ...line });
      }
      break;
    }

    case 'LINE_UPDATED': {
      const { entryId, lineId, updates } = event.payload;
      const entry = entriesMap.get(entryId);
      if (entry) {
        const lineIndex = entry.lines.findIndex(l => l.id === lineId);
        if (lineIndex !== -1) {
          entry.lines[lineIndex] = { ...entry.lines[lineIndex], ...updates };
        }
      }
      break;
    }

    case 'LINE_DELETED': {
      const { entryId, lineId } = event.payload;
      const entry = entriesMap.get(entryId);
      if (entry) {
        entry.lines = entry.lines.filter(l => l.id !== lineId);
      }
      break;
    }

    case 'SIGNATURE_SAVED': {
      const { entryId, signatureBase64 } = event.payload;
      const entry = entriesMap.get(entryId);
      if (entry) {
        entry.signatureBase64 = signatureBase64;
      }
      break;
    }

    case 'AI_SUMMARY_GENERATED': {
      const { entryId, summary, provider } = event.payload;
      const entry = entriesMap.get(entryId);
      if (entry) {
        entry.aiSummary = summary;
        entry.aiSummaryProvider = provider;
      }
      break;
    }

    case 'AI_SUMMARY_UPDATED': {
      const { entryId, summary } = event.payload;
      const entry = entriesMap.get(entryId);
      if (entry) {
        entry.aiSummary = summary;
      }
      break;
    }

    case 'PDF_EXPORTED': {
      // Just a log event, doesn't change state
      break;
    }

    default:
      console.warn('[RECOVERY] Unknown event type:', (event as any).type);
  }
}

/**
 * Initialize the database - check if recovery is needed
 */
export async function initializeDatabase(): Promise<void> {
  console.log('[DB] Initializing database...');

  const entriesCount = await db.dailyEntries.count();
  const journalCount = await db.journal.count();

  console.log(`[DB] Found ${entriesCount} entries and ${journalCount} journal events`);

  // If we have journal events but no entries, recover from journal
  if (journalCount > 0 && entriesCount === 0) {
    console.log('[DB] Entries missing but journal exists - initiating recovery');
    await replayJournal();
  } else if (journalCount > 0 && entriesCount > 0) {
    console.log('[DB] Database appears healthy');
  } else {
    console.log('[DB] Fresh database - no data yet');
  }
}
