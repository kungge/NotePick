<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';

interface Props {
  modelValue: string[];
  suggestions?: string[];
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void;
  (e: 'change', value: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  suggestions: () => [],
  placeholder: '添加标签...',
});

const emit = defineEmits<Emits>();

const inputText = ref('');
const showSuggestions = ref(false);

// Filter suggestions based on current input, excluding already-added tags
const filteredSuggestions = computed<string[]>(() => {
  if (!inputText.value.trim()) {
    return props.suggestions.filter((s) => !props.modelValue.includes(s)).slice(0, 5);
  }
  const lower = inputText.value.toLowerCase().trim();
  return props.suggestions
    .filter(
      (s) => s.toLowerCase().includes(lower) && !props.modelValue.includes(s)
    )
    .slice(0, 5);
});

function addTag(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (props.modelValue.includes(trimmed)) return;
  const newTags = [...props.modelValue, trimmed];
  emit('update:modelValue', newTags);
  emit('change', newTags);
  inputText.value = '';
  showSuggestions.value = false;
}

function removeTag(name: string): void {
  const newTags = props.modelValue.filter((t) => t !== name);
  emit('update:modelValue', newTags);
  emit('change', newTags);
}

function onInput(): void {
  showSuggestions.value = true;
}

function onFocus(): void {
  showSuggestions.value = true;
}

function onBlur(): void {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (inputText.value.trim()) {
      addTag(inputText.value);
    }
  } else if (e.key === 'Backspace' && !inputText.value && props.modelValue.length > 0) {
    // Remove last tag on backspace when input is empty
    removeTag(props.modelValue[props.modelValue.length - 1]);
  }
}
</script>

<template>
  <div class="relative">
    <div
      class="flex flex-wrap items-center gap-1.5 px-2 py-2 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all min-h-[40px]"
    >
      <!-- Existing tags -->
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-md"
      >
        {{ tag }}
        <button
          class="hover:text-primary-900 transition-colors"
          title="移除标签"
          @click="removeTag(tag)"
        >
          <Icon icon="mdi:close" class="w-3 h-3" />
        </button>
      </span>

      <!-- Input -->
      <input
        v-model="inputText"
        type="text"
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        class="flex-1 min-w-[80px] text-sm border-none outline-none bg-transparent py-0.5"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
    </div>

    <!-- Suggestions dropdown -->
    <div
      v-if="showSuggestions && filteredSuggestions.length > 0"
      class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
    >
      <button
        v-for="suggestion in filteredSuggestions"
        :key="suggestion"
        class="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
        @mousedown.prevent="addTag(suggestion)"
      >
        <Icon icon="mdi:tag-outline" class="w-4 h-4 text-gray-400" />
        {{ suggestion }}
      </button>
    </div>
  </div>
</template>
