<template>
  <main data-id="search-page" class="search-page normal-content">
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle">
      <link rel="canonical" :href="canonicalPath">
    </Head>

    <section class="search-panel">
      <div data-id="search-hydrated" class="search-hydrated">{{ hydrated ? 'hydrated' : 'csr' }}</div>
      <h3 class="search-heading mb-6">在榜单数据库中探索</h3>

      <a-input-search
        v-model:value="inputKeyword"
        data-id="search-input"
        class="search-input"
        placeholder="输入关键词搜索"
        allow-clear
        enter-button
        @search="submitSearch"
      />

      <a-spin v-if="loading" data-id="search-loading" class="search-state" />

      <div v-else-if="loadError" data-id="search-error" class="search-state search-error">
        初始化榜单数据库失败，请刷新再试。
      </div>

      <section
        v-else-if="hasKeyword"
        data-id="search-result-section"
        class="search-section"
        :data-result-count="searchRows.length"
      >
        <div class="search-section-title">搜索到 <span data-id="search-result-count">{{ searchRows.length }}</span> 个结果</div>
        <a-list v-if="searchRows.length > 0" class="search-list" size="small" :data-source="searchRows">
          <template #renderItem="{ item }">
            <a-list-item
              data-id="search-ranklist-item"
              class="search-list-item"
              :data-ranklist-key="item.uniqueKey"
            >
              <p class="search-row-title">
                <router-link
                  data-id="search-ranklist-link"
                  :data-ranklist-key="item.uniqueKey"
                  :to="buildRanklistPath(item.uniqueKey)"
                >
                  {{ item.name }}
                </router-link>
                <span class="search-view-count"><EyeOutlined /> {{ item.viewCnt }}</span>
              </p>
              <p class="search-created-at">创建于 {{ formatCreatedAt(item.createdAt) }}</p>
            </a-list-item>
          </template>
        </a-list>
      </section>

      <section v-else data-id="search-recent-section" class="search-section">
        <div class="search-section-title">最近更新</div>
        <div v-if="recentRows.length === 0" class="search-empty-state">暂无最近更新的榜单</div>
        <a-list v-else class="search-list" size="small" :data-source="recentRows">
          <template #renderItem="{ item }">
            <a-list-item
              data-id="search-ranklist-item"
              class="search-list-item"
              :data-ranklist-key="item.uniqueKey"
            >
              <p class="search-row-title">
                <router-link
                  data-id="search-ranklist-link"
                  :data-ranklist-key="item.uniqueKey"
                  :to="buildRanklistPath(item.uniqueKey)"
                >
                  {{ item.name }}
                </router-link>
                <span class="search-view-count"><EyeOutlined /> {{ item.viewCnt }}</span>
              </p>
              <p class="search-created-at">创建于 {{ formatCreatedAt(item.createdAt) }}</p>
            </a-list-item>
          </template>
        </a-list>
      </section>
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { routeView } from 'bwcx-client-vue3';
import { EyeOutlined } from '@ant-design/icons-vue';
import type { IApiRanklistInfo } from '@common/rankland-api';
import { ranklandRoutes } from '@common/rankland-router';
import { useRanklandApiService } from '@client/plugins/rankland-api.plugin';
import { formatTitle } from '@client/utils/title-format.util';
import {
  formatSearchCreatedAt,
  getRecentRanklists,
  normalizeSearchKeyword,
  searchRanklists,
} from './search-result';

const SearchPage = defineComponent({
  name: 'Search',
  components: {
    EyeOutlined,
  },
  setup() {
    const ranklandApiService = useRanklandApiService();
    return { ranklandApiService };
  },
  data() {
    return {
      hydrated: false,
      loading: false,
      loadError: undefined as Error | undefined,
      ranklists: [] as IApiRanklistInfo[],
      inputKeyword: '',
    };
  },
  computed: {
    keyword(): string {
      return normalizeSearchKeyword(this.$route.query.kw);
    },
    hasKeyword(): boolean {
      return this.keyword.length > 0;
    },
    searchRows(): IApiRanklistInfo[] {
      return searchRanklists(this.ranklists, this.keyword);
    },
    recentRows(): IApiRanklistInfo[] {
      return getRecentRanklists(this.ranklists);
    },
    pageTitle(): string {
      return formatTitle('探索');
    },
    canonicalPath(): string {
      return ranklandRoutes.search.build({ kw: this.keyword || undefined });
    },
  },
  mounted() {
    this.hydrated = true;
    this.inputKeyword = this.keyword;
    this.loadRanklists();
  },
  watch: {
    keyword(value: string) {
      this.inputKeyword = value;
    },
  },
  methods: {
    async loadRanklists() {
      this.loading = true;
      this.loadError = undefined;

      try {
        const response = await this.ranklandApiService.listAllRanklists();
        this.ranklists = response.ranks;
      } catch (error) {
        this.loadError = error instanceof Error ? error : new Error(String(error));
        this.ranklists = [];
      } finally {
        this.loading = false;
      }
    },
    submitSearch(value?: string) {
      const keyword = typeof value === 'string' ? value : this.inputKeyword;
      const target = ranklandRoutes.search.build({ kw: keyword.trim() || undefined });
      if (target !== this.$route.fullPath) {
        this.$router.push(target);
      }
    },
    buildRanklistPath(id: string) {
      return ranklandRoutes.ranklist.build({ id });
    },
    formatCreatedAt(value: string) {
      return formatSearchCreatedAt(value);
    },
  },
});

export default routeView(SearchPage, '/search');
</script>

<style lang="less" scoped>
.search-page {
  min-height: 70vh;
}

.normal-content {
  padding: 32px 50px;
}

@media screen and (max-width: 768px) {
  .normal-content {
    padding-right: 20px;
    padding-left: 20px;
  }
}

.search-hydrated {
  width: 1px;
  height: 1px;
  overflow: hidden;
  color: transparent;
}

.search-heading {
  margin-top: 0;
}

.mb-6 {
  margin-bottom: 24px;
}

.search-input {
  margin-top: 0;
}

.search-section,
.search-state {
  margin-top: 40px;
}

.search-error {
  color: #ef4444;
}

.search-section-title {
  opacity: 0.7;
}

.search-list {
  margin: 8px 0 0;
}

.search-list-item {
  display: block;
}

.search-row-title {
  margin: 0;
}

.search-view-count {
  margin-left: 8px;
  opacity: 0.7;
}

.search-created-at {
  margin: 0;
  opacity: 0.5;
  font-size: 14px;
}

.search-empty-state {
  margin-top: 8px;
  color: var(--rankland-legacy-text-color);
}

@media (max-width: 640px) {
  .search-form {
    flex-direction: column;
  }
}
</style>
