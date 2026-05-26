<template>
  <main data-id="search-page" class="search-page">
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle">
      <link rel="canonical" :href="canonicalPath">
    </Head>

    <section class="search-panel">
      <div data-id="search-hydrated" class="search-hydrated">{{ hydrated ? 'hydrated' : 'csr' }}</div>
      <h1>在榜单数据库中探索</h1>

      <form class="search-form" @submit.prevent="submitSearch">
        <input
          v-model="inputKeyword"
          data-id="search-input"
          class="search-input"
          type="search"
          placeholder="输入关键词搜索"
        >
        <button data-id="search-submit" class="search-submit" type="submit">搜索</button>
      </form>

      <div v-if="loading" data-id="search-loading" class="search-state">Loading</div>

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
        <div v-if="searchRows.length === 0" data-id="search-empty-state" class="search-empty-state">暂无匹配的榜单</div>
        <ul v-else class="search-list">
          <li
            v-for="item in searchRows"
            :key="item.uniqueKey"
            data-id="search-ranklist-item"
            class="search-list-item"
            :data-ranklist-key="item.uniqueKey"
          >
            <router-link
              data-id="search-ranklist-link"
              :data-ranklist-key="item.uniqueKey"
              :to="buildRanklistPath(item.uniqueKey)"
            >
              {{ item.name }}
            </router-link>
            <span class="search-view-count"><EyeOutlined /> {{ item.viewCnt }}</span>
            <p class="search-created-at">创建于 {{ formatCreatedAt(item.createdAt) }}</p>
          </li>
        </ul>
      </section>

      <section v-else data-id="search-recent-section" class="search-section">
        <div class="search-section-title">最近更新</div>
        <div v-if="recentRows.length === 0" class="search-empty-state">暂无最近更新的榜单</div>
        <ul v-else class="search-list">
          <li
            v-for="item in recentRows"
            :key="item.uniqueKey"
            data-id="search-ranklist-item"
            class="search-list-item"
            :data-ranklist-key="item.uniqueKey"
          >
            <router-link
              data-id="search-ranklist-link"
              :data-ranklist-key="item.uniqueKey"
              :to="buildRanklistPath(item.uniqueKey)"
            >
              {{ item.name }}
            </router-link>
            <span class="search-view-count"><EyeOutlined /> {{ item.viewCnt }}</span>
            <p class="search-created-at">创建于 {{ formatCreatedAt(item.createdAt) }}</p>
          </li>
        </ul>
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
    submitSearch() {
      const target = ranklandRoutes.search.build({ kw: this.inputKeyword.trim() || undefined });
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
  padding: 48px 16px;
}

.search-panel {
  max-width: 840px;
  margin: 0 auto;
}

.search-hydrated {
  color: #64748b;
  font-size: 12px;
}

.search-form {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 16px;
}

.search-submit {
  padding: 10px 18px;
  border: 1px solid #2368bf;
  border-radius: 4px;
  color: #fff;
  background: #2368bf;
  cursor: pointer;
}

.search-section,
.search-state {
  margin-top: 40px;
}

.search-error {
  color: #b42318;
}

.search-section-title {
  color: #475569;
}

.search-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.search-list-item {
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.search-view-count {
  margin-left: 8px;
  color: #64748b;
}

.search-created-at {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.search-empty-state {
  margin-top: 12px;
  color: #64748b;
}

@media (max-width: 640px) {
  .search-form {
    flex-direction: column;
  }
}
</style>
