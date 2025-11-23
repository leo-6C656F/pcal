import Dexie, { type Table } from 'dexie';
import type { JournalEvent, DailyEntry, ChildContext } from './types';

/**
 * PCAL Database - The Vault
 * Implements Event Sourcing with Journal as the source of truth
 */
export class PCALDatabase extends Dexie {
  // Tables
  journal!: Table<JournalEvent, string>;
  dailyEntries!: Table<DailyEntry, string>;
  children!: Table<ChildContext, string>;

  constructor() {
    super('PCALDatabase');

    this.version(1).stores({
      journal: 'id, timestamp, type',
      dailyEntries: 'id, date, childId, isLocked',
      children: 'id, name'
    });
  }
}

// Export singleton instance
export const db = new PCALDatabase();

/**
 * Generate a simple UUID v4
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate SHA-256 checksum for integrity
 */
export async function generateChecksum(data: any): Promise<string> {
  const jsonString = JSON.stringify(data);
  const msgBuffer = new TextEncoder().encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Add an event to the journal
 */
export async function addJournalEvent(
  type: JournalEvent['type'],
  payload: any
): Promise<JournalEvent> {
  const checksum = await generateChecksum(payload);
  const event: JournalEvent = {
    id: generateId(),
    timestamp: Date.now(),
    type,
    payload,
    checksum
  };

  await db.journal.add(event);
  return event;
}
