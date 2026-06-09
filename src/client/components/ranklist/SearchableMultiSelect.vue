<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown, X } from 'lucide-vue-next';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const props = withDefaults(defineProps<{
  modelValue: string[];
  options: string[];
  placeholder?: string;
}>(), {
  placeholder: '选择组织/单位',
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: string[]): void;
}>();

const open = ref(false);
const search = ref('');

const selectedLabel = computed(() =>
  props.modelValue.length > 0 ? `已选择 ${props.modelValue.length} 个` : props.placeholder,
);

const filteredOptions = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase();
  if (!keyword) {
    return props.options;
  }
  return props.options.filter((option) => option.toLocaleLowerCase().includes(keyword));
});
function setOpen(value: boolean) {
  open.value = value;
  if (!value) {
    search.value = '';
  }
}

function isSelected(option: string) {
  return props.modelValue.includes(option);
}

function toggleOption(option: string) {
  if (isSelected(option)) {
    emit('update:modelValue', props.modelValue.filter((item) => item !== option));
    return;
  }
  emit('update:modelValue', [...props.modelValue, option]);
}

function clearSelection() {
  emit('update:modelValue', []);
  setOpen(false);
}
</script>

<template>
  <Popover :open="open" @update:open="setOpen">
    <span class="srk-multi-select" :class="{ 'is-open': open }" @keydown.escape.stop="setOpen(false)">
      <PopoverTrigger as-child>
        <span
          class="srk-ranklist-org-select srk-multi-select-trigger"
          data-id="ranklist-org-multi-select"
          tabindex="0"
          role="combobox"
          aria-haspopup="listbox"
          :aria-expanded="open"
        >
          <span class="srk-multi-select-open-button">
            <span
              class="srk-multi-select-trigger-text"
              :class="{ 'is-placeholder': modelValue.length === 0 }"
              :data-id="modelValue.length > 0 ? 'ranklist-org-selected-count' : undefined"
            >
              {{ selectedLabel }}
            </span>
          </span>
          <button
            v-if="modelValue.length > 0"
            type="button"
            class="srk-multi-select-clear"
            data-id="ranklist-org-clear"
            aria-label="清空组织筛选"
            @click.stop="clearSelection"
          >
            <X />
          </button>
          <span
            class="srk-multi-select-chevron-button"
            aria-hidden="true"
          >
            <ChevronDown class="srk-multi-select-chevron" />
          </span>
        </span>
      </PopoverTrigger>
    </span>
    <PopoverContent
      class="srk-multi-select-dropdown"
      align="start"
      :side-offset="4"
      :collision-padding="8"
      @open-auto-focus.prevent
    >
      <Command
        v-model:search-term="search"
        class="srk-multi-select-command"
        :reset-search-term-on-blur="false"
        :reset-search-term-on-select="false"
      >
        <CommandInput
          data-id="ranklist-org-search"
          class="srk-multi-select-search"
          type="search"
          placeholder="搜索组织/单位"
        />
        <CommandList class="srk-multi-select-options" role="listbox" aria-multiselectable="true">
          <CommandEmpty class="srk-multi-select-empty">无匹配项</CommandEmpty>
          <CommandGroup class="srk-multi-select-options-group">
            <CommandItem
              v-for="option in filteredOptions"
              :key="option"
              class="srk-multi-select-option"
              :value="option"
              role="option"
              :aria-selected="isSelected(option)"
              :data-id="`ranklist-org-option-${option}`"
              @select.prevent="toggleOption(option)"
            >
              <Checkbox
                class="srk-multi-select-option-check"
                :checked="isSelected(option)"
                tabindex="-1"
                aria-hidden="true"
              />
              <span class="srk-multi-select-option-label">{{ option }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
