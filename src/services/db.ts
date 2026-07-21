import Dexie, { type Table } from 'dexie';
import type { Note, Tag } from '@/types';

/**
 * NotePick IndexedDB database.
 * Stores notes (with full content snapshots) and tags (for uniqueness + autocomplete).
 */
export class NotePickDB extends Dexie {
  notes!: Table<Note, string>;
  tags!: Table<Tag, string>;

  constructor() {
    super('NotePickDB');
    this.version(1).stores({
      // id=primary key, type/title/createdAt/updatedAt=regular indexes,
      // *tags=multiEntry index, deletedAt for soft-delete filtering
      notes: 'id, type, title, createdAt, updatedAt, *tags, deletedAt',
      // id=primary key, &name=unique index, createdAt for sorting
      tags: 'id, &name, createdAt',
    });
  }
}

/** Singleton database instance */
export const db = new NotePickDB();
