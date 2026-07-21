import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { noteService } from '@/services/noteService';
import { tagService } from '@/services/tagService';
import { searchService } from '@/services/searchService';
import type { Note, SearchResult } from '@/types';

/**
 * Pinia store for the Manager page.
 * Loads all active notes into memory on mount, then performs
 * in-memory search and editing operations directly against IndexedDB.
 */
export const useNoteStore = defineStore('note', () => {
  // ===== State =====
  const notes = ref<Note[]>([]);
  const selectedNote = ref<Note | null>(null);
  const searchQuery = ref('');
  const searchResults = ref<SearchResult[]>([]);
  const loading = ref(false);
  const tags = ref<string[]>([]);

  // ===== Computed =====

  /** Whether search mode is active */
  const isSearching = computed(() => searchQuery.value.trim().length > 0);

  /** Notes to display: search results or all notes */
  const displayNotes = computed<Note[]>(() => {
    if (isSearching.value) {
      return searchResults.value.map((r) => r.note);
    }
    return notes.value;
  });

  /** Total active note count */
  const noteCount = computed(() => notes.value.length);

  // ===== Actions =====

  /**
   * Load all active notes from IndexedDB into memory.
   * Called once when the Manager page mounts.
   */
  async function loadNotes(): Promise<void> {
    loading.value = true;
    try {
      notes.value = await noteService.getActiveNotes();
      tags.value = (await tagService.getAllTags()).map((t) => t.name);
    } catch (error) {
      console.error('[NotePick] Failed to load notes:', error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Select a note to view in the detail panel.
   */
  function selectNote(id: string): void {
    const note = notes.value.find((n) => n.id === id);
    if (note) {
      selectedNote.value = { ...note };
    }
  }

  /**
   * Clear the selected note.
   */
  function clearSelection(): void {
    selectedNote.value = null;
  }

  /**
   * Execute an in-memory search across all loaded notes.
   */
  function search(query: string): void {
    searchQuery.value = query;
    if (!query.trim()) {
      searchResults.value = [];
      return;
    }
    searchResults.value = searchService.search(query, notes.value);
  }

  /**
   * Clear search and restore full list view.
   */
  function clearSearch(): void {
    searchQuery.value = '';
    searchResults.value = [];
  }

  /**
   * Soft-delete a note and remove it from the in-memory list.
   */
  async function deleteNote(id: string): Promise<void> {
    await noteService.softDelete(id);
    notes.value = notes.value.filter((n) => n.id !== id);
    if (selectedNote.value?.id === id) {
      selectedNote.value = null;
    }
    // Re-run search if active
    if (isSearching.value) {
      search(searchQuery.value);
    }
  }

  /**
   * Update the annotation of a note (auto-save with debounce).
   */
  async function updateAnnotation(id: string, text: string): Promise<void> {
    await noteService.updateNote(id, { annotation: text });

    // Update in-memory state
    const note = notes.value.find((n) => n.id === id);
    if (note) {
      note.annotation = text;
      note.updatedAt = Date.now();
    }
    if (selectedNote.value?.id === id) {
      selectedNote.value.annotation = text;
      selectedNote.value.updatedAt = Date.now();
    }
  }

  /**
   * Update the title of a note.
   */
  async function updateTitle(id: string, title: string): Promise<void> {
    await noteService.updateNote(id, { title });

    const note = notes.value.find((n) => n.id === id);
    if (note) {
      note.title = title;
      note.updatedAt = Date.now();
    }
    if (selectedNote.value?.id === id) {
      selectedNote.value.title = title;
      selectedNote.value.updatedAt = Date.now();
    }
  }

  /**
   * Update the tags of a note.
   * Also ensures any new tag names are registered in the Tag table.
   */
  async function updateTags(id: string, newTags: string[]): Promise<void> {
    await noteService.updateNote(id, { tags: newTags });

    const note = notes.value.find((n) => n.id === id);
    if (note) {
      note.tags = newTags;
      note.updatedAt = Date.now();
    }
    if (selectedNote.value?.id === id) {
      selectedNote.value.tags = newTags;
      selectedNote.value.updatedAt = Date.now();
    }

    // Ensure new tags are registered
    for (const tagName of newTags) {
      if (!tags.value.includes(tagName)) {
        await tagService.ensureTag(tagName);
        tags.value.push(tagName);
      }
    }
  }

  return {
    // State
    notes,
    selectedNote,
    searchQuery,
    searchResults,
    loading,
    tags,
    // Computed
    isSearching,
    displayNotes,
    noteCount,
    // Actions
    loadNotes,
    selectNote,
    clearSelection,
    search,
    clearSearch,
    deleteNote,
    updateAnnotation,
    updateTitle,
    updateTags,
  };
});
