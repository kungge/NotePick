<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { noteService } from '@/services/noteService';
import { sendMessage, getActiveTab } from '@/utils/messaging';
import { relativeTime, truncateText } from '@/utils/format';
import type { Note } from '@/types';
import type { TriggerPageCaptureMsg, OpenManagerMsg } from '@/types/messages';

// Recent notes for quick access
const recentNotes = ref<Note[]>([]);
const loading = ref(false);

onMounted(() => {
  loadRecentNotes();
});

async function loadRecentNotes(): Promise<void> {
  loading.value = true;
  try {
    recentNotes.value = await noteService.getRecentNotes(3);
  } catch (error) {
    console.error('[NotePick Popup] Failed to load recent notes:', error);
  } finally {
    loading.value = false;
  }
}

/**
 * Trigger full page capture — sends message to SW,
 * which forwards GET_PAGE_CONTENT to the content script.
 */
async function capturePage(): Promise<void> {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  const msg: TriggerPageCaptureMsg = {
    type: 'TRIGGER_PAGE_CAPTURE',
    tabId: tab.id,
  };
  await sendMessage(msg);

  // Close popup after triggering capture
  window.close();
}

/**
 * Open the full Manager page for browsing, searching, and editing notes.
 */
function openManager(): void {
  const msg: OpenManagerMsg = { type: 'OPEN_MANAGER' };
  sendMessage(msg);
  window.close();
}

/**
 * Open a note in the Manager detail view.
 * For MVP, we just open the manager page.
 * P1: Could deep-link to specific note.
 */
function openNote(_id: string): void {
  openManager();
}
</script>

<template>
  <div class="w-[360px] min-h-[400px] bg-gray-50">
    <!-- Header -->
    <header class="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200">
      <Icon icon="mdi:notebook-edit-outline" class="w-6 h-6 text-primary-600" />
      <h1 class="text-base font-bold text-gray-800">NotePick</h1>
      <button
        class="ml-auto p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        title="打开管理页"
        @click="openManager"
      >
        <Icon icon="mdi:open-in-new" class="w-4 h-4" />
      </button>
    </header>

    <!-- Actions -->
    <div class="p-4 space-y-2">
      <!-- Capture full page -->
      <button
        class="w-full flex items-center gap-3 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        @click="capturePage"
      >
        <Icon icon="mdi:file-document-plus-outline" class="w-5 h-5" />
        <span class="text-sm font-medium">保存整页内容</span>
        <Icon icon="mdi:chevron-right" class="w-4 h-4 ml-auto opacity-60" />
      </button>

      <!-- Hint for selection capture -->
      <div
        class="flex items-start gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-600"
      >
        <Icon icon="mdi:information-outline" class="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span class="leading-relaxed">
          选中网页文字后，右键菜单「保存选区为网页笔记」或按 Alt+S 采集选区
        </span>
      </div>
    </div>

    <!-- Recent notes -->
    <div class="px-4 pb-4">
      <div class="flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        <Icon icon="mdi:history" class="w-4 h-4" />
        最近笔记
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-6">
        <Icon icon="mdi:loading" class="w-6 h-6 text-gray-300 animate-spin" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="recentNotes.length === 0"
        class="text-center py-6 text-xs text-gray-400"
      >
        <Icon icon="mdi:notebook-outline" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>还没有笔记，开始采集吧！</p>
      </div>

      <!-- Recent note items -->
      <div v-else class="space-y-2">
        <button
          v-for="note in recentNotes"
          :key="note.id"
          class="w-full flex items-start gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all text-left"
          @click="openNote(note.id)"
        >
          <div class="flex-shrink-0 mt-0.5">
            <Icon
              :icon="note.type === 'selection' ? 'mdi:format-quote-open' : 'mdi:file-document-outline'"
              class="w-4 h-4"
              :class="note.type === 'selection' ? 'text-blue-400' : 'text-purple-400'"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">
              {{ truncateText(note.title, 30) }}
            </p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-gray-400 truncate max-w-[120px]">
                {{ note.source.domain }}
              </span>
              <span class="text-xs text-gray-400 flex-shrink-0">
                {{ relativeTime(note.createdAt) }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-4 py-2 border-t border-gray-200 bg-white">
      <button
        class="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        @click="openManager"
      >
        <Icon icon="mdi:view-grid-outline" class="w-4 h-4" />
        管理全部笔记
      </button>
    </div>
  </div>
</template>
