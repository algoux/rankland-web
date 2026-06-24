<script setup lang="ts">
import type { PaginationLastProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { ChevronsRight } from 'lucide-vue-next'
import { PaginationLast } from 'radix-vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const props = defineProps<PaginationLastProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <PaginationLast v-bind="delegatedProps" as-child>
    <Button :class="cn('w-9 h-9 p-0', props.class)" variant="outline">
      <ChevronsRight class="h-4 w-4" />
    </Button>
  </PaginationLast>
</template>
