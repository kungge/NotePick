<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import Sidebar from '@/components/Sidebar.vue';
import NoteListView from './views/NoteListView.vue';
import NoteDetailView from './views/NoteDetailView.vue';
import { useNoteStore } from '@/stores/noteStore';
import type { SearchResult } from '@/types';

const store = useNoteStore();

// View mode: 'list' | 'detail'
const viewMode = ref<'list' | 'detail'>('list');

// Search results state (kept locally for snippet map)
const searchResults = ref<SearchResult[]>([]);
const searchSnippetMap = ref<Record<string, string>>({});

// Tag filter
const selectedTag = ref<string>('');

// Computed: notes filtered by selected tag (applies on top of search)
const filteredNotes = computed(() => {
  if (!selectedTag.value) return store.notes;
  return store.notes.filter((n) => n.tags.includes(selectedTag.value));
});

onMounted(() => {
  store.loadNotes();
});

// Event handlers

/**
 * Execute search through the store, then build snippet map for UI.
 * Search runs only once (in store.search), results are reused for snippets.
 */
function handleSearch(query: string): void {
  if (!query.trim()) {
    handleClearSearch();
    return;
  }

  // Store search updates store.searchQuery + store.searchResults + store.isSearching
  store.search(query);

  // Build snippet map from store's search results (no duplicate search)
  searchResults.value = store.searchResults;

  const map: Record<string, string> = {};
  for (const result of store.searchResults) {
    const snippet =
      result.snippets['title'] ||
      result.snippets['content.text'] ||
      result.snippets['annotation'] ||
      result.snippets['source.title'] ||
      '';
    map[result.note.id] = snippet;
  }
  searchSnippetMap.value = map;
}

function handleClearSearch(): void {
  store.clearSearch();
  searchResults.value = [];
  searchSnippetMap.value = {};
}

function handleSelectNote(id: string): void {
  store.selectNote(id);
  viewMode.value = 'detail';
}

function handleDeleteNote(id: string): void {
  store.deleteNote(id);
  // If currently viewing the deleted note, go back to list
  if (!store.selectedNote) {
    viewMode.value = 'list';
  }
}

function handleBack(): void {
  viewMode.value = 'list';
  store.clearSelection();
}

function handleSelectTag(tag: string | null): void {
  selectedTag.value = tag ?? '';
}

function handleShowAll(): void {
  selectedTag.value = '';
}
</script>

<template>
  <div class="flex h-screen bg-white overflow-hidden">
    <!-- Sidebar -->
    <Sidebar
      :tags="store.tags"
      :note-count="store.noteCount"
      :selected-tag="selectedTag"
      @select-tag="handleSelectTag"
      @show-all="handleShowAll"
    />

    <!-- Main content area -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Top bar -->
      <header
        class="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white"
      >
        <div class="flex items-center gap-2">
          <Icon icon="mdi:notebook-edit-outline" class="w-6 h-6 text-primary-600" />
          <h1 class="text-lg font-bold text-gray-800">NotePick</h1>
        </div>

        <div class="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <span v-if="store.isSearching" class="flex items-center gap-1">
            <Icon icon="mdi:filter-variant" class="w-4 h-4" />
            搜索: {{ store.searchQuery }}
          </span>
          <span v-if="selectedTag" class="flex items-center gap-1">
            <Icon icon="mdi:tag-outline" class="w-4 h-4" />
            {{ selectedTag }}
          </span>
        </div>
      </header>

      <!-- View container -->
      <div class="flex-1 overflow-hidden">
        <!-- Note List View -->
        <NoteListView
          v-if="viewMode === 'list'"
          :notes="filteredNotes"
          :selected-note-id="store.selectedNote?.id ?? ''"
          :search-results="searchResults"
          :search-snippet-map="searchSnippetMap"
          @select-note="handleSelectNote"
          @delete-note="handleDeleteNote"
          @search="handleSearch"
          @clear-search="handleClearSearch"
        />

        <!-- Note Detail View -->
        <NoteDetailView
          v-else-if="viewMode === 'detail' && store.selectedNote"
          :note="store.selectedNote"
          @back="handleBack"
        />

        <!-- Fallback -->
        <div v-else class="flex items-center justify-center h-full text-gray-400 text-sm">
          选择一条笔记查看详情
        </div>
      </div>
    </main>
  </div>
</template>
