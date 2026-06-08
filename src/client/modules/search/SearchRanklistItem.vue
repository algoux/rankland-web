<script setup lang="ts">
import { Eye } from 'lucide-vue-next';
import type { IApiRanklistInfo } from '@/services/ranklist-api';
import { ranklandRoutes } from '@/app/config';
import { formatRanklistCreatedAt } from '@/domain/ranklist/search';

const props = defineProps<{
  item: IApiRanklistInfo;
}>();
</script>

<template>
  <article
    class="rankland-search-list-item"
    data-id="search-ranklist-item"
    :data-ranklist-key="props.item.uniqueKey"
  >
    <p class="rankland-search-list-item-title">
      <router-link
        :to="ranklandRoutes.formatUrl('Ranklist', { id: props.item.uniqueKey })"
        class="rankland-search-list-link"
        data-id="search-ranklist-link"
        :data-ranklist-key="props.item.uniqueKey"
      >
        {{ props.item.name }}
      </router-link>
      <span class="rankland-search-list-views">
        <Eye class="rankland-search-list-eye" />
        {{ props.item.viewCnt }}
      </span>
    </p>
    <p class="rankland-search-list-date">
      创建于 {{ formatRanklistCreatedAt(props.item.createdAt) }}
    </p>
  </article>
</template>
