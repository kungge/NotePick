import { describe, it, expect, beforeEach } from 'vitest';
import { noteService } from './noteService';
import { db } from './db';
import type { CreateNoteInput } from '@/types';

// Helper: create a minimal CreateNoteInput
function makeCreateInput(overrides: Partial<CreateNoteInput> = {}): CreateNoteInput {
  return {
    type: 'selection',
    title: 'Test Note',
    content: { text: 'Some text content', html: '<p>Some text content</p>' },
    source: {
      url: 'https://example.com/page',
      title: 'Example Page',
      domain: 'example.com',
    },
    ...overrides,
  };
}

describe('noteService', () => {
  beforeEach(async () => {
    await db.notes.clear();
    await db.tags.clear();
  });

  // ===== createNote =====
  describe('createNote', () => {
    it('creates a note and returns it with generated fields', async () => {
      const input = makeCreateInput();
      const note = await noteService.createNote(input);

      expect(note.id).toBeDefined();
      expect(note.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(note.type).toBe('selection');
      expect(note.title).toBe('Test Note');
      expect(note.content.text).toBe('Some text content');
      expect(note.annotation).toBe('');
      expect(note.tags).toEqual([]);
      expect(note.deletedAt).toBeNull();
      expect(note.createdAt).toBeGreaterThan(0);
      expect(note.updatedAt).toBe(note.createdAt);
    });

    it('persists the note in the database', async () => {
      const input = makeCreateInput({ title: 'Persisted Note' });
      const created = await noteService.createNote(input);
      const fetched = await noteService.getNote(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.title).toBe('Persisted Note');
    });

    it('accepts custom tags array', async () => {
      const input = makeCreateInput({ tags: ['javascript', 'tutorial'] });
      const note = await noteService.createNote(input);
      expect(note.tags).toEqual(['javascript', 'tutorial']);
    });

    it('defaults tags to empty array when not provided', async () => {
      const input = makeCreateInput();
      const note = await noteService.createNote(input);
      expect(note.tags).toEqual([]);
    });

    it('sets extractionFailed when provided', async () => {
      const input = makeCreateInput({
        type: 'page',
        extractionFailed: true,
      });
      const note = await noteService.createNote(input);
      expect(note.extractionFailed).toBe(true);
    });

    it('preserves source metadata', async () => {
      const input = makeCreateInput({
        source: {
          url: 'https://github.com/repo',
          title: 'GitHub Repo',
          domain: 'github.com',
          favicon: 'https://github.com/favicon.ico',
        },
      });
      const note = await noteService.createNote(input);
      expect(note.source.url).toBe('https://github.com/repo');
      expect(note.source.title).toBe('GitHub Repo');
      expect(note.source.domain).toBe('github.com');
      expect(note.source.favicon).toBe('https://github.com/favicon.ico');
    });
  });

  // ===== getNote =====
  describe('getNote', () => {
    it('returns a note by its ID', async () => {
      const created = await noteService.createNote(makeCreateInput({ title: 'Find Me' }));
      const fetched = await noteService.getNote(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.title).toBe('Find Me');
    });

    it('returns undefined for non-existent ID', async () => {
      const fetched = await noteService.getNote('non-existent-id');
      expect(fetched).toBeUndefined();
    });
  });

  // ===== getActiveNotes =====
  describe('getActiveNotes', () => {
    it('returns empty array when no notes exist', async () => {
      const notes = await noteService.getActiveNotes();
      expect(notes).toEqual([]);
    });

    it('returns only non-deleted notes', async () => {
      const n1 = await noteService.createNote(makeCreateInput({ title: 'Active 1' }));
      const n2 = await noteService.createNote(makeCreateInput({ title: 'Active 2' }));
      await noteService.softDelete(n2.id);

      const notes = await noteService.getActiveNotes();
      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe(n1.id);
    });

    it('sorts notes by createdAt descending (newest first)', async () => {
      const older = await noteService.createNote(
        makeCreateInput({ title: 'Older Note' })
      );
      // Delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const newer = await noteService.createNote(
        makeCreateInput({ title: 'Newer Note' })
      );

      const notes = await noteService.getActiveNotes();
      expect(notes[0].id).toBe(newer.id);
      expect(notes[1].id).toBe(older.id);
    });

    it('includes soft-deleted notes excluded from results', async () => {
      await noteService.createNote(makeCreateInput({ title: 'Note A' }));
      const toDelete = await noteService.createNote(makeCreateInput({ title: 'Note B' }));
      await noteService.createNote(makeCreateInput({ title: 'Note C' }));
      await noteService.softDelete(toDelete.id);

      const notes = await noteService.getActiveNotes();
      expect(notes).toHaveLength(2);
      expect(notes.find((n) => n.title === 'Note B')).toBeUndefined();
    });
  });

  // ===== getRecentNotes =====
  describe('getRecentNotes', () => {
    it('returns the N most recent notes', async () => {
      await noteService.createNote(makeCreateInput({ title: 'Note 1' }));
      await noteService.createNote(makeCreateInput({ title: 'Note 2' }));
      await noteService.createNote(makeCreateInput({ title: 'Note 3' }));

      const recent = await noteService.getRecentNotes(2);
      expect(recent).toHaveLength(2);
    });

    it('returns all notes when limit exceeds available count', async () => {
      await noteService.createNote(makeCreateInput({ title: 'Note 1' }));

      const recent = await noteService.getRecentNotes(10);
      expect(recent).toHaveLength(1);
    });

    it('returns empty array when no notes exist', async () => {
      const recent = await noteService.getRecentNotes(5);
      expect(recent).toEqual([]);
    });

    it('returns newest notes first', async () => {
      const n1 = await noteService.createNote(makeCreateInput({ title: 'First' }));
      // Delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const n2 = await noteService.createNote(makeCreateInput({ title: 'Second' }));

      const recent = await noteService.getRecentNotes(1);
      expect(recent[0].id).toBe(n2.id);
    });
  });

  // ===== updateNote =====
  describe('updateNote', () => {
    it('updates the title of a note', async () => {
      const created = await noteService.createNote(makeCreateInput({ title: 'Old Title' }));
      await noteService.updateNote(created.id, { title: 'New Title' });

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.title).toBe('New Title');
    });

    it('updates the annotation of a note', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await noteService.updateNote(created.id, { annotation: 'My annotation' });

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.annotation).toBe('My annotation');
    });

    it('updates the tags of a note', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await noteService.updateNote(created.id, { tags: ['tag1', 'tag2'] });

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.tags).toEqual(['tag1', 'tag2']);
    });

    it('sets updatedAt to current time when not provided', async () => {
      const created = await noteService.createNote(makeCreateInput());
      const beforeUpdate = created.updatedAt;
      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      await noteService.updateNote(created.id, { title: 'Updated' });

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('uses provided updatedAt when given', async () => {
      const created = await noteService.createNote(makeCreateInput());
      const customTimestamp = 1234567890;
      await noteService.updateNote(created.id, { title: 'Updated', updatedAt: customTimestamp });

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.updatedAt).toBe(customTimestamp);
    });

    it('returns number of updated rows (1 for success)', async () => {
      const created = await noteService.createNote(makeCreateInput());
      const result = await noteService.updateNote(created.id, { title: 'Updated' });
      expect(result).toBe(1);
    });

    it('returns 0 for non-existent note', async () => {
      const result = await noteService.updateNote('non-existent', { title: 'Updated' });
      expect(result).toBe(0);
    });
  });

  // ===== softDelete =====
  describe('softDelete', () => {
    it('sets deletedAt timestamp on the note', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await noteService.softDelete(created.id);

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.deletedAt).not.toBeNull();
      expect(fetched!.deletedAt).toBeGreaterThan(0);
    });

    it('sets updatedAt timestamp', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await noteService.softDelete(created.id);

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);
    });

    it('returns 1 for successful deletion', async () => {
      const created = await noteService.createNote(makeCreateInput());
      const result = await noteService.softDelete(created.id);
      expect(result).toBe(1);
    });

    it('returns 0 for non-existent note', async () => {
      const result = await noteService.softDelete('non-existent');
      expect(result).toBe(0);
    });

    it('makes the note invisible in getActiveNotes', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await noteService.softDelete(created.id);

      const active = await noteService.getActiveNotes();
      expect(active.find((n) => n.id === created.id)).toBeUndefined();
    });
  });
});
