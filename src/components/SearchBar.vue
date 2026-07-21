<script setup lang="ts">
import { ref, watch } from 'vue';
import { Icon } from '@iconify/vue';

interface Props {
  modelValue: string;
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
  (e: 'clear'): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索笔记...',
});

const emit = defineEmits<Emits>();

const inputValue = ref(props.modelValue);

// Sync external changes (e.g., clear)
watch(
  () => props.modelValue,
  (val) => {
    inputValue.value = val;
  }
);

function onInput(): void {
  emit('update:modelValue', inputValue.value);
}

function onSearch(): void {
  emit('search', inputValue.value);
}

function onClear(): void {
  inputValue.value = '';
  emit('update:modelValue', '');
  emit('clear');
}
</script>

<template>
  <div class="relative w-full">
    <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
      <Icon icon="mdi:magnify" class="w-5 h-5 text-gray-400" />
    </div>
    <input
      v-model="inputValue"
      type="text"
      :placeholder="placeholder"
      class="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      @input="onInput"
      @keyup.enter="onSearch"
    />
    <button
      v-if="inputValue"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      title="清空搜索"
      @click="onClear"
    >
      <Icon icon="mdi:close-circle" class="w-5 h-5" />
    </button>
  </div>
</template>
