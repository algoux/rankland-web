<template>
  <main data-id="home-content" class="home-page">
    <section data-id="home-hero" class="home-hero">
      <h1>欢迎来到 RankLand</h1>
      <p>
        这里是一个由算法竞赛爱好者们自发维护的、专注于托管和分享任何竞赛榜单的宝地，你可以轻松查阅 ICPC、CCPC
        等赛事的历史榜单。
      </p>
      <div data-id="home-hydrated" class="home-hydrated">{{ hydrated ? 'hydrated' : 'ssr' }}</div>
    </section>

    <section data-id="home-recommendations" class="home-section">
      <h2>为你推荐</h2>
      <a-row :gutter="[16, 16]" style="margin-left: 0; margin-right: 0;">
        <a-col :xs="24" :sm="12">
          <router-link
            data-id="home-recommendation-search"
            class="home-card-link"
            :to="searchPath"
          >
            <a-card hoverable class="home-card">
              <h2 class="home-card-title">
                <UnorderedListOutlined class="home-card-icon" />
                <span>探索</span>
              </h2>
              <p>
                在 <em data-id="home-total-srk-count">{{ totalSrkCountText }}</em> 个高质量程序设计竞赛榜单中自由浏览和搜索
              </p>
            </a-card>
          </router-link>
        </a-col>
        <a-col :xs="24" :sm="12">
          <router-link
            data-id="home-recommendation-collection"
            class="home-card-link"
            :to="collectionPath"
          >
            <a-card hoverable class="home-card">
              <h2 class="home-card-title">
                <TrophyOutlined class="home-card-icon" />
                <span>榜单合集</span>
              </h2>
              <p>查阅由 SDUTACM 和 algoUX 团队精心整理的历年赛事榜单合集</p>
            </a-card>
          </router-link>
        </a-col>
      </a-row>
    </section>

    <section data-id="home-tools" class="home-section">
      <h2>算竞周边工具</h2>
      <a-row :gutter="[16, 16]" style="margin-left: 0; margin-right: 0;">
        <a-col :xs="24" :sm="12">
          <a
            data-id="home-tool-paste-then-ac"
            class="home-card-link"
            href="https://paste.then.ac/?utm_source=rankland"
            target="_blank"
            rel="noreferrer"
          >
            <a-card hoverable class="home-card">
              <h2 class="home-card-title">
                <img :src="pasteThenACLogo" alt="paste.then.ac logo" class="home-card-logo-padded">
                <span>paste.then.ac</span>
              </h2>
              <p>免注册、更适合算竞宝宝体质的的代码剪贴板</p>
            </a-card>
          </a>
        </a-col>
        <a-col :xs="24" :sm="12">
          <a
            data-id="home-tool-algo-bootstrap"
            class="home-card-link"
            href="https://ab.algoux.cn/?utm_source=rankland"
            target="_blank"
            rel="noreferrer"
          >
            <a-card hoverable class="home-card">
              <h2 class="home-card-title">
                <img :src="algoBootstrapLogo" alt="Algo Bootstrap logo">
                <span>Algo Bootstrap</span>
              </h2>
              <p>一键配置 C++、Python 和 VS Code 编程环境</p>
            </a-card>
          </a>
        </a-col>
      </a-row>
    </section>

    <section data-id="home-resources" class="home-section">
      <h2>资源和生态</h2>
      <ul>
        <li>
          <a href="https://srk.algoux.org/?utm_source=rankland" target="_blank" rel="noreferrer">Standard Ranklist</a>
          ：标准榜单格式（srk）旨在标准化榜单数据，欢迎了解和共建生态
        </li>
        <li>
          <a href="https://github.com/algoux/srk-collection" target="_blank" rel="noreferrer">collection</a>
          ：长期维护的历年算竞榜单合集
        </li>
        <li>
          <a href="https://github.com/algoux/standard-ranklist-renderer-component" target="_blank" rel="noreferrer">
            renderer-component
          </a>
          ：在 Web 项目中使用渲染组件展示标准榜单
        </li>
        <li>
          <a href="https://github.com/algoux/standard-ranklist-utils" target="_blank" rel="noreferrer">utils</a>
          ：标准榜单开发实用工具库
        </li>
        <li>
          <a href="https://github.com/algoux/standard-ranklist-convert-to" target="_blank" rel="noreferrer">convert-to</a>
          ：转换标准榜单到 Excel、Gym Ghost、VJ 等其他格式
        </li>
      </ul>
    </section>

    <section data-id="home-contact" class="home-section">
      <h2>联系我们</h2>
      <p>
        如要为赛事寻求专业的实时外榜托管服务或希望补全/纠正本站数据，欢迎
        <ContactUs>与我们联系</ContactUs>。
      </p>
    </section>

    <section data-id="home-about" class="home-section">
      <h2>关于我们</h2>
      <p>algoUX: Give your algorithm better UX</p>
      <p>
        Find us on <a href="https://github.com/algoux" target="_blank" rel="noreferrer">GitHub</a>
      </p>
      <p>© 2022-present algoUX. All Rights Reserved.</p>
      <p>
        榜单访问统计：至少 <span data-id="home-total-view-count">{{ totalViewCountText }}</span> 次
      </p>
      <p>
        其他链接：
        <a href="https://algoux.org" target="_blank" rel="noreferrer">首页</a>
        <span class="home-separator">|</span>
        <a href="https://servicestatus.algoux.org" target="_blank" rel="noreferrer">服务状态</a>
      </p>
      <p v-if="showBeian">
        备案号：
        <a data-id="home-beian-link" href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">{{ beianText }}</a>
      </p>
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { useHead } from '@vueuse/head';
import { routeView, RenderMethodKind } from 'bwcx-client-vue3';
import { TrophyOutlined, UnorderedListOutlined } from '@ant-design/icons-vue';
import { ranklandRoutes } from '@common/rankland-router';
import type { IApiStatistics } from '@common/rankland-api';
import type { AsyncDataOptions } from '@client/typings';
import { formatTitle } from '@client/utils/title-format.util';
import ContactUs from '@client/components/contact-us.vue';
import pasteThenACLogo from './assets/paste-then-ac_logo.png';
import algoBootstrapLogo from './assets/algo-bootstrap_logo.png';
import { buildHomeAbsoluteUrl } from './home-site';

const searchPath = ranklandRoutes.search.build();
const collectionPath = ranklandRoutes.collection.build({ id: 'official' });
const homepageUrl = buildHomeAbsoluteUrl(ranklandRoutes.home.build());
const exploreUrl = buildHomeAbsoluteUrl(searchPath);
const collectionUrl = buildHomeAbsoluteUrl(collectionPath);

const websiteJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'RankLand',
  url: homepageUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${exploreUrl}?kw={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

const siteNavigationJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SiteNavigationElement',
      name: '探索',
      url: exploreUrl,
    },
    {
      '@type': 'SiteNavigationElement',
      name: '榜单合集',
      url: collectionUrl,
    },
  ],
});

const HomePage = defineComponent({
  name: 'Home',
  components: {
    ContactUs,
    TrophyOutlined,
    UnorderedListOutlined,
  },
  props: {
    statistics: {
      type: Object as PropType<IApiStatistics>,
      required: false,
    },
  },
  setup() {
    useHead({
      title: formatTitle(),
      meta: [
        { property: 'og:title', content: formatTitle() },
        { property: 'og:url', content: homepageUrl },
      ],
      link: [
        { rel: 'canonical', href: homepageUrl },
      ],
      script: [
        { type: 'application/ld+json', children: websiteJsonLd },
        { type: 'application/ld+json', children: siteNavigationJsonLd },
      ],
    });

    return {
      searchPath,
      collectionPath,
      pasteThenACLogo,
      algoBootstrapLogo,
      beianText: process.env.BEIAN || '',
      showBeian: (process.env.RANKLAND_SITE_ALIAS || process.env.SITE_ALIAS) === 'cnn',
    };
  },
  data() {
    return {
      hydrated: false,
    };
  },
  computed: {
    totalSrkCountText(): string {
      return this.statistics ? String(this.statistics.totalSrkCount) : '-';
    },
    totalViewCountText(): string {
      return this.statistics ? String(this.statistics.totalViewCount) : '-';
    },
  },
  mounted() {
    this.hydrated = true;
  },
  async asyncData({ ranklandApiService }: AsyncDataOptions) {
    const statistics = await ranklandApiService.getStatistics();

    return {
      statistics,
    };
  },
});

export default routeView(HomePage, '/', undefined, undefined, {
  renderMethod: RenderMethodKind.SSR,
});
</script>

<style lang="less" scoped>
.home-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 20px 64px;
}

.home-hero {
  margin-bottom: 40px;
}

.home-hero h1 {
  margin: 0 0 16px;
  font-size: 32px;
  line-height: 1.25;
}

.home-hero p {
  max-width: 760px;
  margin: 0;
  color: #3f4a56;
  font-size: 16px;
  line-height: 1.8;
}

.home-hydrated {
  width: 1px;
  height: 1px;
  overflow: hidden;
  color: transparent;
}

.home-section {
  margin-top: 36px;
}

.home-section h2 {
  margin: 0 0 16px;
  font-size: 22px;
  line-height: 1.35;
}

.home-section p,
.home-section li {
  color: #3f4a56;
  line-height: 1.8;
}

.home-section ul {
  margin: 0;
  padding-left: 22px;
}

.home-section :deep(.ant-row) {
  margin-right: 0 !important;
  margin-left: 0 !important;
}

.home-card-link {
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.home-card {
  height: 100%;
}

.home-card :deep(.ant-card-body) {
  min-height: 128px;
}

.home-card h2 {
  margin: 0 0 14px;
  color: inherit;
  font-size: 20px;
  line-height: 1.4;
}

.home-card p {
  margin: 0;
  color: inherit;
  line-height: 1.7;
}

.home-card em {
  color: inherit;
  font-style: normal;
  font-weight: 700;
}

.home-card-title {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

.home-card-title img {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  object-fit: contain;
}

.home-card-logo-padded {
  padding: 2px;
}

.home-card-icon {
  margin-right: 12px;
  font-size: 24px;
}

.home-separator {
  margin: 0 8px;
  color: #8a96a3;
}

@media (max-width: 720px) {
  .home-page {
    padding-top: 32px;
  }
}
</style>
