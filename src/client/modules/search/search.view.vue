<template>
  <section class="rankland-page rankland-search-page" data-id="search-page">
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle" />
    </Head>

    <div>
      <h3 class="rankland-search-title">在榜单数据库中探索</h3>

      <form class="rankland-search-form" role="search" @submit.prevent="submitSearch">
        <div class="rankland-search-input-wrap">
          <Input
            :key="keyword"
            ref="searchInput"
            :default-value="keyword"
            class="rankland-search-input"
            placeholder="输入关键词搜索"
            aria-label="输入关键词搜索"
          />
          <button
            v-if="keyword"
            class="rankland-search-clear"
            type="button"
            aria-label="清除搜索"
            @click="clearSearch"
          >
            <CircleX class="rankland-search-clear-icon" />
          </button>
        </div>
        <Button type="submit" class="rankland-search-button" aria-label="搜索">
          <SearchIcon class="rankland-search-button-icon" />
        </Button>
      </form>

      <div v-if="loadFailed" class="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        初始化榜单数据库失败，请刷新再试。
      </div>

      <div
        v-else-if="keyword"
        class="rankland-search-section"
        data-id="search-result-section"
        :data-result-count="String(searchRows.length)"
      >
        <div class="text-sm text-muted-foreground">搜索到 {{ searchRows.length }} 个结果</div>
        <div v-if="searchRows.length > 0" class="rankland-search-list">
          <SearchRanklistItem
            v-for="item in searchRows"
            :key="item.uniqueKey"
            :item="item"
          />
        </div>
      </div>

      <div v-else class="rankland-search-section" data-id="search-recent-section">
        <div class="text-sm text-muted-foreground">最近更新</div>
        <div v-if="recentRows.length > 0" class="rankland-search-list">
          <SearchRanklistItem
            v-for="item in recentRows"
            :key="item.uniqueKey"
            :item="item"
          />
        </div>
        <div v-else class="mt-3 text-sm text-muted-foreground">暂无最近更新的榜单</div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { View, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { CircleX, Search as SearchIcon } from 'lucide-vue-next';
import type { AsyncDataOptions } from '@client/typings';
import type { IApiRanklistInfo } from '@/services/ranklist-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatTitle } from '@/app/title-format';
import { getRecentRanklists, getSearchKeyword, searchRanklists } from '@/domain/ranklist/search';
import SearchRanklistItem from './SearchRanklistItem.vue';

interface SearchAsyncData {
  ranks: IApiRanklistInfo[];
}

@View('/search')
@RenderMethod(RenderMethodKind.SSR)
@Options({
  components: {
    Button,
    CircleX,
    Input,
    SearchIcon,
    SearchRanklistItem,
  },
})
export default class Search extends Vue {
  @Prop() ranklistIndex?: SearchAsyncData;
  @Prop() loadFailed?: boolean;

  pageTitle = formatTitle('探索');

  get keyword() {
    return getSearchKeyword(this.$route.query.kw);
  }

  get allRows() {
    return this.ranklistIndex?.ranks ?? [];
  }

  get searchRows() {
    return searchRanklists(this.allRows, this.keyword);
  }

  get recentRows() {
    return getRecentRanklists(this.allRows, 10);
  }

  async submitSearch() {
    const keyword = this.getSearchInputValue().trim();
    await this.$router.push({
      path: '/search',
      query: keyword ? { kw: keyword } : {},
    });
    await this.focusSearchInput();
  }

  clearSearch() {
    this.$router.push({ path: '/search' });
  }

  async asyncData({ api }: AsyncDataOptions) {
    try {
      const data = await api.listAllRanklists();
      return {
        ranklistIndex: data,
        loadFailed: false,
      };
    } catch (error) {
      console.error(error);
      return {
        ranklistIndex: { ranks: [] },
        loadFailed: true,
      };
    }
  }

  private getSearchInputValue() {
    const ref = this.$refs.searchInput as { $el?: HTMLInputElement } | HTMLInputElement | undefined;
    if (!ref) {
      return this.keyword;
    }
    if (ref instanceof HTMLInputElement) {
      return ref.value;
    }
    return ref.$el?.value ?? this.keyword;
  }

  private async focusSearchInput() {
    await this.$nextTick();
    const ref = this.$refs.searchInput as { $el?: HTMLInputElement } | HTMLInputElement | undefined;
    if (ref instanceof HTMLInputElement) {
      ref.focus();
      return;
    }
    ref?.$el?.focus();
  }
}
</script>
