<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { relativeTime, truncateText } from '@/utils/format';
import type { Note } from '@/types';

interface Props {
  note: Note;
  selected?: boolean;
  snippet?: string;
}

interface Emits {
  (e: 'click', id: string): void;
  (e: 'delete', id: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  snippet: '',
});

const emit = defineEmits<Emits>();

function onClick(): void {
  emit('click', props.note.id);
}

function onDelete(e: Event): void {
  e.stopPropagation();
  emit('delete', props.note.id);
}
</script>

<template>
  <div
    class="group p-4 bg-white border rounded-lg cursor-pointer transition-all hover:shadow-md"
    :class="selected ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200 hover:border-primary-300'"
    @click="onClick"
  >
    <!-- Header row: type icon + title + delete button -->
    <div class="flex items-start gap-2 mb-2">
      <div class="flex-shrink-0 mt-0.5">
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center"
          :class="note.type === 'selection' ? 'bg-blue-50' : 'bg-purple-50'"
        >
          <Icon
            :icon="note.type === 'selection' ? 'mdi:format-quote-open' : 'mdi:file-document-outline'"
            class="w-4 h-4"
            :class="note.type === 'selection' ? 'text-blue-500' : 'text-purple-500'"
          />
        </div>
      </div>
      <h3 class="flex-1 text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
        {{ note.title }}
      </h3>
      <button
        class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500"
        title="删除笔记"
        @click="onDelete"
      >
        <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
      </button>
    </div>

    <!-- Content preview / search snippet -->
    <p v-if="snippet" class="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2" v-html="snippet" />
    <p v-else class="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">
      {{ truncateText(note.content.text, 120) }}
    </p>

    <!-- Footer: source + tags + time -->
    <div class="flex items-center gap-3 text-xs text-gray-400">
      <!-- Source domain -->
      <span class="flex items-center gap-1 truncate max-w-[140px]">
        <Icon icon="mdi:web" class="w-3.5 h-3.5 flex-shrink-0" />
        <span class="truncate">{{ note.source.domain || note.source.url }}</span>
      </span>

      <!-- Tags -->
      <span v-if="note.tags.length > 0" class="flex items-center gap-0.5 flex-shrink-0">
        <Icon icon="mdi:tag-multiple-outline" class="w-3.5 h-3.5" />
        {{ note.tags.length }}
      </span>

      <!-- Time -->
      <span class="flex items-center gap-1 ml-auto flex-shrink-0">
        <Icon icon="mdi:clock-outline" class="w-3.5 h-3.5" />
        {{ relativeTime(note.createdAt) }}
      </span>
    </div>
  </div>
</template>
