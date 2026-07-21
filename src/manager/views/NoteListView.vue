<script setup lang="ts">
import { Icon } from '@iconify/vue';
import NoteCard from '@/components/NoteCard.vue';
import SearchBar from '@/components/SearchBar.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useNoteStore } from '@/stores/noteStore';
import type { Note, SearchResult } from '@/types';

interface Props {
  notes: Note[];
  selectedNoteId?: string;
  searchResults?: SearchResult[];
  searchSnippetMap?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  selectedNoteId: '',
  searchResults: () => [],
  searchSnippetMap: () => ({}),
});

interface Emits {
  (e: 'select-note', id: string): void;
  (e: 'delete-note', id: string): void;
  (e: 'search', query: string): void;
  (e: 'clear-search'): void;
}

const emit = defineEmits<Emits>();
const store = useNoteStore();

/** Get search snippet for a note, if available */
function getSnippet(noteId: string): string {
  return props.searchSnippetMap[noteId] || '';
}

/** Notes to display: search results or the passed-in (tag-filtered) list */
function displayNotes(): Note[] {
  if (store.isSearching && props.searchResults.length >= 0) {
    return props.searchResults.map((r) => r.note);
  }
  return props.notes;
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Search bar -->
    <div class="p-4 border-b border-gray-200">
      <SearchBar
        v-model="store.searchQuery"
        @search="(q: string) => emit('search', q)"
        @clear="() => emit('clear-search')"
      />
    </div>

    <!-- Note list -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Loading state -->
      <div v-if="store.loading" class="flex items-center justify-center py-12">
        <Icon icon="mdi:loading" class="w-8 h-8 text-gray-300 animate-spin" />
      </div>

      <!-- Empty: no notes at all -->
      <EmptyState
        v-else-if="!store.isSearching && notes.length === 0"
        icon="mdi:notebook-plus-outline"
        title="还没有笔记"
        description="在浏览网页时，选中文字后右键「保存选区为网页笔记」，或点击扩展按钮保存整页内容。"
      />

      <!-- Empty: search no results -->
      <EmptyState
        v-else-if="store.isSearching && searchResults.length === 0"
        icon="mdi:magnify-close"
        title="没有找到匹配的笔记"
        :description="`未找到包含「${store.searchQuery}」的笔记`"
      />

      <!-- Note cards -->
      <div v-else>
        <div class="text-xs text-gray-400 mb-3">
          {{
            store.isSearching
              ? `${searchResults.length} 条搜索结果`
              : `${notes.length} 条笔记`
          }}
        </div>
        <div class="space-y-3">
          <NoteCard
            v-for="note in displayNotes()"
            :key="note.id"
            :note="note"
            :selected="note.id === selectedNoteId"
            :snippet="getSnippet(note.id)"
            @click="(id: string) => emit('select-note', id)"
            @delete="(id: string) => emit('delete-note', id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
