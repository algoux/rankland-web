<script setup lang="ts">
import type { PaginationFirstProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { ChevronsLeft } from 'lucide-vue-next'
import { PaginationFirst } from 'radix-vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const props = defineProps<PaginationFirstProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <PaginationFirst v-bind="delegatedProps" as-child>
    <Button :class="cn('w-9 h-9 p-0', props.class)" variant="outline">
      <ChevronsLeft class="h-4 w-4" />
    </Button>
  </PaginationFirst>
</template>
