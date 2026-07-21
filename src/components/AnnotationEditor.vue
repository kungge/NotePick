<script setup lang="ts">
import { ref, watch } from 'vue';
import { Icon } from '@iconify/vue';

interface Props {
  modelValue: string;
  placeholder?: string;
  maxLength?: number;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'save', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '在这里写下你的批注...',
  maxLength: 5000,
});

const emit = defineEmits<Emits>();

const text = ref(props.modelValue);
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let savedTimer: ReturnType<typeof setTimeout> | null = null;

// Sync external changes
watch(
  () => props.modelValue,
  (val) => {
    if (val !== text.value) {
      text.value = val;
    }
  }
);

function onInput(): void {
  saveStatus.value = 'idle';

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    doSave();
  }, 800);
}

function doSave(): void {
  saveStatus.value = 'saving';
  emit('update:modelValue', text.value);
  emit('save', text.value);

  // Show saved status briefly
  if (savedTimer) clearTimeout(savedTimer);
  savedTimer = setTimeout(() => {
    saveStatus.value = 'saved';
  }, 200);
}

function onBlur(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  doSave();
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <textarea
      v-model="text"
      :placeholder="placeholder"
      :maxlength="maxLength"
      rows="4"
      class="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg bg-white resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all leading-relaxed"
      @input="onInput"
      @blur="onBlur"
    />
    <div class="flex items-center justify-between text-xs">
      <span class="text-gray-400">{{ text.length }} / {{ maxLength }}</span>
      <span
        :class="{
          'text-gray-300': saveStatus === 'idle',
          'text-blue-500': saveStatus === 'saving',
          'text-green-500': saveStatus === 'saved',
        }"
        class="flex items-center gap-1 transition-colors"
      >
        <template v-if="saveStatus === 'saving'">
          <Icon icon="mdi:loading" class="w-3.5 h-3.5 animate-spin" />
          保存中...
        </template>
        <template v-else-if="saveStatus === 'saved'">
          <Icon icon="mdi:check" class="w-3.5 h-3.5" />
          已保存
        </template>
        <template v-else>
          自动保存
        </template>
      </span>
    </div>
  </div>
</template>
