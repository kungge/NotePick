import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import type { Note, CreateNoteInput, NoteUpdateInput } from '@/types';

/**
 * Note service — handles CRUD operations for notes in IndexedDB.
 * Exported as object literal per architecture convention.
 */
export const noteService = {
  /**
   * Create a new note from capture input.
   * Generates UUID, timestamps, and defaults.
   */
  async createNote(input: CreateNoteInput): Promise<Note> {
    const now = Date.now();
    const note: Note = {
      id: uuidv4(),
      type: input.type,
      title: input.title,
      content: input.content,
      annotation: '',
      source: input.source,
      tags: input.tags ?? [],
      extractionFailed: input.extractionFailed,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await db.notes.add(note);
    return note;
  },

  /**
   * Get a single note by ID.
   */
  async getNote(id: string): Promise<Note | undefined> {
    return db.notes.get(id);
  },

  /**
   * Get all active (non-deleted) notes, sorted by createdAt descending.
   */
  async getActiveNotes(): Promise<Note[]> {
    const allNotes = await db.notes.toArray();
    return allNotes
      .filter((n) => n.deletedAt === null)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  /**
   * Get the N most recent active notes (for Popup display).
   */
  async getRecentNotes(limit: number): Promise<Note[]> {
    const active = await this.getActiveNotes();
    return active.slice(0, limit);
  },

  /**
   * Update an editable field (title/annotation/tags).
   * Content is read-only and cannot be updated.
   */
  async updateNote(id: string, patch: NoteUpdateInput): Promise<number> {
    const updateData: NoteUpdateInput = {
      ...patch,
      updatedAt: patch.updatedAt ?? Date.now(),
    };
    return db.notes.update(id, updateData as Partial<Note>);
  },

  /**
   * Soft-delete a note by setting deletedAt timestamp.
   */
  async softDelete(id: string): Promise<number> {
    return db.notes.update(id, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
};
