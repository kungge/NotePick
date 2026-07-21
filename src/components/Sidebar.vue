<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
  tags: string[];
  noteCount: number;
  selectedTag?: string;
}

interface Emits {
  (e: 'select-tag', tag: string | null): void;
  (e: 'show-all'): void;
}

const props = withDefaults(defineProps<Props>(), {
  selectedTag: '',
});

const emit = defineEmits<Emits>();

function showAll(): void {
  emit('show-all');
  emit('select-tag', null);
}

function selectTag(tag: string): void {
  if (props.selectedTag === tag) {
    // Deselect if clicking the same tag
    emit('select-tag', null);
  } else {
    emit('select-tag', tag);
  }
}
</script>

<template>
  <aside class="w-56 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
    <!-- All notes -->
    <div class="p-3 border-b border-gray-200">
      <button
        class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
        :class="!selectedTag ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'"
        @click="showAll"
      >
        <Icon icon="mdi:note-multiple-outline" class="w-5 h-5" />
        <span class="flex-1 text-left">全部笔记</span>
        <span
          class="text-xs px-1.5 py-0.5 rounded-full"
          :class="!selectedTag ? 'bg-primary-200 text-primary-800' : 'bg-gray-200 text-gray-500'"
        >
          {{ noteCount }}
        </span>
      </button>
    </div>

    <!-- Tags section -->
    <div class="flex-1 overflow-y-auto p-3">
      <div class="flex items-center gap-1.5 px-1 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        <Icon icon="mdi:tag-multiple-outline" class="w-4 h-4" />
        标签
      </div>

      <div v-if="tags.length === 0" class="px-3 py-2 text-xs text-gray-400">
        暂无标签
      </div>

      <div v-else class="space-y-0.5">
        <button
          v-for="tag in tags"
          :key="tag"
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors"
          :class="selectedTag === tag ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'"
          @click="selectTag(tag)"
        >
          <Icon icon="mdi:tag-outline" class="w-4 h-4 flex-shrink-0" />
          <span class="truncate text-left">{{ tag }}</span>
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-3 border-t border-gray-200">
      <div class="text-xs text-gray-400 text-center">
        NotePick v1.0.0
      </div>
    </div>
  </aside>
</template>
