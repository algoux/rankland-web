<script setup lang="ts">
import type { PaginationPrevProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import { PaginationPrev } from 'radix-vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const props = defineProps<PaginationPrevProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <PaginationPrev v-bind="delegatedProps" as-child>
    <Button :class="cn('w-9 h-9 p-0', props.class)" variant="outline">
      <ChevronLeft class="h-4 w-4" />
    </Button>
  </PaginationPrev>
</template>
