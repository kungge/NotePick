<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { Icon } from '@iconify/vue';
import TagInput from '@/components/TagInput.vue';
import AnnotationEditor from '@/components/AnnotationEditor.vue';
import { useNoteStore } from '@/stores/noteStore';
import { formatDate, truncateText } from '@/utils/format';
import type { Note } from '@/types';

interface Props {
  note: Note;
}

interface Emits {
  (e: 'back'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const store = useNoteStore();

// Local editing state
const editingTitle = ref(false);
const titleDraft = ref(props.note.title);
const annotationDraft = ref(props.note.annotation);
const tagsDraft = ref<string[]>([...props.note.tags]);

// Sync when note changes
watch(
  () => props.note.id,
  () => {
    titleDraft.value = props.note.title;
    annotationDraft.value = props.note.annotation;
    tagsDraft.value = [...props.note.tags];
    editingTitle.value = false;
  }
);

// Debounce for title editing
let titleTimer: ReturnType<typeof setTimeout> | null = null;

function startEditingTitle(): void {
  editingTitle.value = true;
  titleDraft.value = props.note.title;
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>('input[type="text"]');
    input?.focus();
    input?.select();
  });
}

function onTitleInput(): void {
  if (titleTimer) clearTimeout(titleTimer);
  titleTimer = setTimeout(() => {
    saveTitle();
  }, 500);
}

function saveTitle(): void {
  const trimmed = titleDraft.value.trim();
  if (trimmed && trimmed !== props.note.title) {
    store.updateTitle(props.note.id, trimmed);
  } else {
    titleDraft.value = props.note.title;
  }
  editingTitle.value = false;
}

function onTitleBlur(): void {
  if (titleTimer) {
    clearTimeout(titleTimer);
    titleTimer = null;
  }
  saveTitle();
}

function onTitleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault();
    (e.target as HTMLInputElement).blur();
  } else if (e.key === 'Escape') {
    titleDraft.value = props.note.title;
    editingTitle.value = false;
  }
}

// Annotation
function onAnnotationInput(value: string): void {
  annotationDraft.value = value;
}

function onAnnotationSave(value: string): void {
  store.updateAnnotation(props.note.id, value);
}

// Tags
function onTagsChange(newTags: string[]): void {
  tagsDraft.value = newTags;
  store.updateTags(props.note.id, newTags);
}

// Delete
const showDeleteConfirm = ref(false);

function onDeleteClick(): void {
  showDeleteConfirm.value = true;
}

function confirmDelete(): void {
  store.deleteNote(props.note.id);
  showDeleteConfirm.value = false;
  emit('back');
}

function cancelDelete(): void {
  showDeleteConfirm.value = false;
}

// Source info
const sourceDomain = computed(() => props.note.source.domain || 'unknown');
const sourceUrl = computed(() => props.note.source.url);

function openSource(): void {
  window.open(props.note.source.url, '_blank');
}

// Content display
const contentPreview = computed(() => {
  const text = props.note.content.text;
  return text;
});

const isExtractionFailed = computed(
  () => props.note.type === 'page' && props.note.extractionFailed
);
</script>

<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Top bar: back button + actions -->
    <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
      <button
        class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        title="返回列表"
        @click="emit('back')"
      >
        <Icon icon="mdi:arrow-left" class="w-5 h-5" />
      </button>

      <div class="flex items-center gap-1.5 text-sm text-gray-500">
        <Icon
          :icon="note.type === 'selection' ? 'mdi:format-quote-open' : 'mdi:file-document-outline'"
          class="w-4 h-4"
        />
        <span>{{ note.type === 'selection' ? '选区笔记' : '整页笔记' }}</span>
      </div>

      <div class="ml-auto flex items-center gap-1">
        <button
          class="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400"
          title="删除笔记"
          @click="onDeleteClick"
        >
          <Icon icon="mdi:trash-can-outline" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-3xl mx-auto p-6">
        <!-- Title (editable) -->
        <div class="mb-4">
          <input
            v-if="editingTitle"
            v-model="titleDraft"
            type="text"
            class="w-full text-xl font-bold text-gray-800 border-none outline-none bg-gray-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            @input="onTitleInput"
            @blur="onTitleBlur"
            @keydown="onTitleKeydown"
          />
          <h1
            v-else
            class="text-xl font-bold text-gray-800 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 -mx-3 -my-0 transition-colors"
            title="点击编辑标题"
            @click="startEditingTitle"
          >
            {{ note.title }}
          </h1>
        </div>

        <!-- Source info -->
        <div class="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <img
            v-if="note.source.favicon"
            :src="note.source.favicon"
            alt=""
            class="w-4 h-4 rounded-sm flex-shrink-0"
            @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
          />
          <div class="flex-1 min-w-0">
            <div class="text-sm text-gray-600 truncate">{{ note.source.title }}</div>
            <button
              class="text-xs text-primary-500 hover:text-primary-700 hover:underline truncate block max-w-full text-left"
              @click="openSource"
            >
              {{ sourceDomain }} ↗
            </button>
          </div>
          <div class="text-xs text-gray-400 flex-shrink-0">
            {{ formatDate(note.createdAt) }}
          </div>
        </div>

        <!-- Extraction warning -->
        <div
          v-if="isExtractionFailed"
          class="flex items-center gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700"
        >
          <Icon icon="mdi:alert-outline" class="w-5 h-5 flex-shrink-0" />
          正文提取失败，已保存原始页面快照
        </div>

        <!-- Read-only content -->
        <div class="mb-6">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
            正文内容
          </h2>
          <div
            v-if="note.content.html"
            class="notepick-content text-sm text-gray-700 leading-relaxed p-4 bg-gray-50 rounded-lg overflow-hidden"
            v-html="note.content.html"
          />
          <pre
            v-else
            class="text-sm text-gray-700 whitespace-pre-wrap p-4 bg-gray-50 rounded-lg leading-relaxed font-sans"
          >{{ contentPreview }}</pre>
        </div>

        <!-- Tags -->
        <div class="mb-6">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
            标签
          </h2>
          <TagInput
            v-model="tagsDraft"
            :suggestions="store.tags"
            placeholder="输入标签后回车..."
            @change="onTagsChange"
          />
        </div>

        <!-- Annotation -->
        <div class="mb-6">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
            个人批注
          </h2>
          <AnnotationEditor
            v-model="annotationDraft"
            @save="onAnnotationSave"
          />
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      @click.self="cancelDelete"
    >
      <div class="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Icon icon="mdi:trash-can-outline" class="w-5 h-5 text-red-500" />
          </div>
          <h3 class="text-base font-semibold text-gray-800">删除笔记</h3>
        </div>
        <p class="text-sm text-gray-500 mb-4">
          确定要删除「{{ truncateText(note.title, 40) }}」吗？删除后可在回收站恢复。
        </p>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            @click="cancelDelete"
          >
            取消
          </button>
          <button
            class="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            @click="confirmDelete"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
