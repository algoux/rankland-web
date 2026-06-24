<script setup lang="ts">
import type { PaginationNextProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { PaginationNext } from 'radix-vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const props = defineProps<PaginationNextProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <PaginationNext v-bind="delegatedProps" as-child>
    <Button :class="cn('w-9 h-9 p-0', props.class)" variant="outline">
      <ChevronRight class="h-4 w-4" />
    </Button>
  </PaginationNext>
</template>
