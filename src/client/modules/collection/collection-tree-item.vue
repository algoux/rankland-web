<template>
  <li class="collection-tree-item">
    <div
      v-if="isDirectory"
      class="collection-tree-directory"
      :data-id="itemDataId"
      :data-collection-key="item.uniqueKey"
      :data-open="isOpen ? 'true' : 'false'"
    >
      <span>{{ item.name }}</span>
      <ul v-if="children.length > 0" class="collection-tree-children">
        <CollectionTreeItem
          v-for="child in children"
          :key="child.uniqueKey"
          :item="child"
          :collection-id="collectionId"
          :current-rank-id="currentRankId"
          :open-keys="openKeys"
        />
      </ul>
    </div>

    <router-link
      v-else
      class="collection-tree-ranklist"
      :class="{ 'is-selected': isSelected }"
      :to="itemUrl"
      :data-id="itemDataId"
      :data-collection-key="item.uniqueKey"
      :aria-current="isSelected ? 'page' : undefined"
    >
      {{ item.name }}
    </router-link>
  </li>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { CollectionItemType, type IApiCollectionItem } from '@common/rankland-api';
import { ranklandRoutes } from '@common/rankland-router';

export default defineComponent({
  name: 'CollectionTreeItem',
  props: {
    item: {
      type: Object as PropType<IApiCollectionItem>,
      required: true,
    },
    collectionId: {
      type: String,
      required: true,
    },
    currentRankId: {
      type: String,
      required: false,
    },
    openKeys: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  computed: {
    isDirectory(): boolean {
      return this.item.type === CollectionItemType.Directory;
    },
    children(): IApiCollectionItem[] {
      return this.item.children || [];
    },
    itemDataId(): string {
      return `collection-menu-item-${this.item.uniqueKey}`;
    },
    isSelected(): boolean {
      return this.currentRankId === this.item.uniqueKey;
    },
    isOpen(): boolean {
      return this.openKeys.includes(this.item.uniqueKey);
    },
    itemUrl(): string {
      return ranklandRoutes.collection.build({
        id: this.collectionId,
        rankId: this.item.uniqueKey,
      });
    },
  },
});
</script>

<style lang="less" scoped>
.collection-tree-item {
  list-style: none;
}

.collection-tree-directory,
.collection-tree-ranklist {
  display: block;
  padding: 6px 8px;
  color: inherit;
  text-decoration: none;
}

.collection-tree-directory {
  font-weight: 600;
}

.collection-tree-children {
  margin: 4px 0 4px 12px;
  padding: 0;
}

.collection-tree-ranklist.is-selected {
  background: #e6f4ff;
  color: #0958d9;
}
</style>
