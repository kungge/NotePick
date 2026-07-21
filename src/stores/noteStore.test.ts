import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNoteStore } from './noteStore';
import { noteService } from '@/services/noteService';
import { tagService } from '@/services/tagService';
import { db } from '@/services/db';
import type { CreateNoteInput, Note } from '@/types';

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

describe('noteStore', () => {
  let store: ReturnType<typeof useNoteStore>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.notes.clear();
    await db.tags.clear();
    store = useNoteStore();
  });

  // ===== State & Computed =====
  describe('initial state', () => {
    it('starts with empty notes array', () => {
      expect(store.notes).toEqual([]);
    });

    it('starts with null selectedNote', () => {
      expect(store.selectedNote).toBeNull();
    });

    it('starts with empty searchQuery', () => {
      expect(store.searchQuery).toBe('');
    });

    it('starts with empty searchResults', () => {
      expect(store.searchResults).toEqual([]);
    });

    it('starts with loading false', () => {
      expect(store.loading).toBe(false);
    });

    it('starts with empty tags', () => {
      expect(store.tags).toEqual([]);
    });

    it('isSearching is false initially', () => {
      expect(store.isSearching).toBe(false);
    });

    it('displayNotes returns notes when not searching', () => {
      expect(store.displayNotes).toEqual([]);
    });

    it('noteCount is 0 initially', () => {
      expect(store.noteCount).toBe(0);
    });
  });

  // ===== loadNotes =====
  describe('loadNotes', () => {
    it('loads active notes from the database into memory', async () => {
      await noteService.createNote(makeCreateInput({ title: 'Note A' }));
      await noteService.createNote(makeCreateInput({ title: 'Note B' }));

      await store.loadNotes();

      expect(store.notes).toHaveLength(2);
      expect(store.noteCount).toBe(2);
    });

    it('loads tags from the database', async () => {
      await tagService.createTag('javascript');
      await tagService.createTag('vue');

      await store.loadNotes();

      expect(store.tags).toEqual(['javascript', 'vue']);
    });

    it('sets loading to true during load and false after', async () => {
      const promise = store.loadNotes();
      expect(store.loading).toBe(true);
      await promise;
      expect(store.loading).toBe(false);
    });

    it('does not include soft-deleted notes', async () => {
      const n1 = await noteService.createNote(makeCreateInput({ title: 'Active' }));
      await noteService.createNote(makeCreateInput({ title: 'Will Delete' }));
      await noteService.softDelete(n1.id);

      await store.loadNotes();

      expect(store.notes).toHaveLength(1);
      expect(store.notes[0].title).toBe('Will Delete');
    });

    it('handles empty database gracefully', async () => {
      await store.loadNotes();
      expect(store.notes).toEqual([]);
      expect(store.tags).toEqual([]);
    });
  });

  // ===== selectNote =====
  describe('selectNote', () => {
    it('sets selectedNote to a copy of the found note', async () => {
      const created = await noteService.createNote(makeCreateInput({ title: 'Select Me' }));
      await store.loadNotes();

      store.selectNote(created.id);

      expect(store.selectedNote).not.toBeNull();
      expect(store.selectedNote!.id).toBe(created.id);
      expect(store.selectedNote!.title).toBe('Select Me');
    });

    it('creates a copy (not a reference) of the note', async () => {
      const created = await noteService.createNote(makeCreateInput({ title: 'Original' }));
      await store.loadNotes();

      store.selectNote(created.id);
      // Mutating selectedNote should not affect the notes array item
      store.selectedNote!.title = 'Modified';
      expect(store.notes.find((n) => n.id === created.id)!.title).toBe('Original');
    });

    it('does nothing when note ID is not found', async () => {
      await noteService.createNote(makeCreateInput());
      await store.loadNotes();

      store.selectNote('non-existent-id');
      expect(store.selectedNote).toBeNull();
    });
  });

  // ===== clearSelection =====
  describe('clearSelection', () => {
    it('sets selectedNote to null', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();
      store.selectNote(created.id);
      expect(store.selectedNote).not.toBeNull();

      store.clearSelection();
      expect(store.selectedNote).toBeNull();
    });
  });

  // ===== search =====
  describe('search', () => {
    it('sets searchQuery and populates searchResults', async () => {
      await noteService.createNote(makeCreateInput({ title: 'JavaScript Guide' }));
      await noteService.createNote(makeCreateInput({ title: 'Python Tutorial' }));
      await store.loadNotes();

      store.search('javascript');

      expect(store.searchQuery).toBe('javascript');
      expect(store.isSearching).toBe(true);
      expect(store.searchResults).toHaveLength(1);
      expect(store.searchResults[0].note.title).toBe('JavaScript Guide');
    });

    it('clears searchResults when query is empty', async () => {
      await noteService.createNote(makeCreateInput());
      await store.loadNotes();
      store.search('test');
      expect(store.searchResults.length).toBeGreaterThan(0);

      store.search('');

      expect(store.searchQuery).toBe('');
      expect(store.isSearching).toBe(false);
      expect(store.searchResults).toEqual([]);
    });

    it('clears searchResults when query is whitespace only', async () => {
      await noteService.createNote(makeCreateInput());
      await store.loadNotes();

      store.search('   ');

      expect(store.isSearching).toBe(false);
      expect(store.searchResults).toEqual([]);
    });

    it('displayNotes returns search result notes when searching', async () => {
      await noteService.createNote(makeCreateInput({ title: 'JavaScript Guide' }));
      await noteService.createNote(makeCreateInput({ title: 'Python Tutorial' }));
      await store.loadNotes();

      store.search('javascript');

      expect(store.displayNotes).toHaveLength(1);
      expect(store.displayNotes[0].title).toBe('JavaScript Guide');
    });

    it('displayNotes returns all notes when not searching', async () => {
      await noteService.createNote(makeCreateInput({ title: 'Note A' }));
      await noteService.createNote(makeCreateInput({ title: 'Note B' }));
      await store.loadNotes();

      expect(store.displayNotes).toHaveLength(2);
    });
  });

  // ===== clearSearch =====
  describe('clearSearch', () => {
    it('resets searchQuery and searchResults', async () => {
      await noteService.createNote(makeCreateInput({ title: 'Test Note' }));
      await store.loadNotes();
      store.search('test');

      store.clearSearch();

      expect(store.searchQuery).toBe('');
      expect(store.searchResults).toEqual([]);
      expect(store.isSearching).toBe(false);
    });
  });

  // ===== deleteNote =====
  describe('deleteNote', () => {
    it('soft-deletes the note in the database', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();

      await store.deleteNote(created.id);

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.deletedAt).not.toBeNull();
    });

    it('removes the note from the in-memory notes array', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();
      expect(store.notes).toHaveLength(1);

      await store.deleteNote(created.id);

      expect(store.notes).toHaveLength(0);
      expect(store.noteCount).toBe(0);
    });

    it('clears selectedNote if the deleted note was selected', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();
      store.selectNote(created.id);
      expect(store.selectedNote).not.toBeNull();

      await store.deleteNote(created.id);

      expect(store.selectedNote).toBeNull();
    });

    it('does not clear selectedNote when a different note is deleted', async () => {
      const n1 = await noteService.createNote(makeCreateInput({ title: 'Note 1' }));
      const n2 = await noteService.createNote(makeCreateInput({ title: 'Note 2' }));
      await store.loadNotes();
      store.selectNote(n1.id);

      await store.deleteNote(n2.id);

      expect(store.selectedNote).not.toBeNull();
      expect(store.selectedNote!.id).toBe(n1.id);
    });

    it('re-runs search if search mode is active', async () => {
      await noteService.createNote(makeCreateInput({ title: 'JavaScript One' }));
      const n2 = await noteService.createNote(makeCreateInput({ title: 'JavaScript Two' }));
      await store.loadNotes();
      store.search('javascript');
      expect(store.searchResults).toHaveLength(2);

      await store.deleteNote(n2.id);

      expect(store.searchResults).toHaveLength(1);
    });
  });

  // ===== updateAnnotation =====
  describe('updateAnnotation', () => {
    it('updates the annotation in the database', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();

      await store.updateAnnotation(created.id, 'New annotation text');

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.annotation).toBe('New annotation text');
    });

    it('updates the in-memory note', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();

      await store.updateAnnotation(created.id, 'Updated annotation');

      const note = store.notes.find((n) => n.id === created.id);
      expect(note!.annotation).toBe('Updated annotation');
    });

    it('updates the selectedNote if it matches', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();
      store.selectNote(created.id);

      await store.updateAnnotation(created.id, 'Annotation for selected');

      expect(store.selectedNote!.annotation).toBe('Annotation for selected');
    });

    it('updates the updatedAt timestamp on the in-memory note', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();
      const originalUpdatedAt = store.notes[0].updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      await store.updateAnnotation(created.id, 'text');

      const note = store.notes.find((n) => n.id === created.id);
      expect(note!.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });
  });

  // ===== updateTitle =====
  describe('updateTitle', () => {
    it('updates the title in the database', async () => {
      const created = await noteService.createNote(makeCreateInput({ title: 'Old Title' }));
      await store.loadNotes();

      await store.updateTitle(created.id, 'New Title');

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.title).toBe('New Title');
    });

    it('updates the in-memory note title', async () => {
      const created = await noteService.createNote(makeCreateInput({ title: 'Old Title' }));
      await store.loadNotes();

      await store.updateTitle(created.id, 'New Title');

      const note = store.notes.find((n) => n.id === created.id);
      expect(note!.title).toBe('New Title');
    });

    it('updates the selectedNote title if it matches', async () => {
      const created = await noteService.createNote(makeCreateInput({ title: 'Old' }));
      await store.loadNotes();
      store.selectNote(created.id);

      await store.updateTitle(created.id, 'New');

      expect(store.selectedNote!.title).toBe('New');
    });
  });

  // ===== updateTags =====
  describe('updateTags', () => {
    it('updates the tags in the database', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();

      await store.updateTags(created.id, ['tag1', 'tag2']);

      const fetched = await noteService.getNote(created.id);
      expect(fetched!.tags).toEqual(['tag1', 'tag2']);
    });

    it('updates the in-memory note tags', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();

      await store.updateTags(created.id, ['newtag']);

      const note = store.notes.find((n) => n.id === created.id);
      expect(note!.tags).toEqual(['newtag']);
    });

    it('updates the selectedNote tags if it matches', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();
      store.selectNote(created.id);

      await store.updateTags(created.id, ['selected-tag']);

      expect(store.selectedNote!.tags).toEqual(['selected-tag']);
    });

    it('registers new tags in the Tag table', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();

      await store.updateTags(created.id, ['brand-new-tag']);

      const tag = await tagService.getTagByName('brand-new-tag');
      expect(tag).toBeDefined();
    });

    it('adds new tag names to the store tags list', async () => {
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();

      await store.updateTags(created.id, ['new-tag-1', 'new-tag-2']);

      expect(store.tags).toContain('new-tag-1');
      expect(store.tags).toContain('new-tag-2');
    });

    it('does not duplicate existing tags in the store tags list', async () => {
      await tagService.createTag('existing-tag');
      const created = await noteService.createNote(makeCreateInput());
      await store.loadNotes();
      // 'existing-tag' is already in store.tags from loadNotes
      expect(store.tags).toContain('existing-tag');

      await store.updateTags(created.id, ['existing-tag']);

      // Should still only have one 'existing-tag'
      expect(store.tags.filter((t) => t === 'existing-tag')).toHaveLength(1);
    });
  });
});
