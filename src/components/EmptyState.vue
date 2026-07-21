<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
  icon?: string;
  title: string;
  description?: string;
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi:notebook-outline',
  description: '',
});
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div
      class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4"
    >
      <Icon :icon="icon" class="w-10 h-10 text-gray-400" />
    </div>
    <h3 class="text-lg font-semibold text-gray-700 mb-2">{{ title }}</h3>
    <p v-if="description" class="text-sm text-gray-400 max-w-xs leading-relaxed">
      {{ description }}
    </p>
    <slot />
  </div>
</template>
