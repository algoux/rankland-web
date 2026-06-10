<template>
  <main class="rankland-page rankland-home-page" data-id="home-page">
    <section class="rankland-home-intro">
      <h1 class="rankland-home-title">欢迎来到 RankLand</h1>
      <p class="rankland-home-description">
        这里是一个由算法竞赛爱好者们自发维护的、专注于托管和分享任何竞赛榜单的宝地，你可以轻松查阅 ICPC、CCPC
        等赛事的历史榜单。
      </p>
    </section>

    <section class="rankland-section">
      <h2 class="rankland-section-title">为你推荐</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <router-link :to="explorePath" class="block">
          <Card class="rankland-home-card">
            <div class="rankland-home-card-body">
              <h2 class="rankland-home-card-title">
                <List class="rankland-home-card-icon" />
                探索
              </h2>
              <p class="rankland-home-card-text">
                在 <strong>{{ totalSrkCount }}</strong> 个高质量程序设计竞赛榜单中自由浏览和搜索
              </p>
            </div>
          </Card>
        </router-link>
        <router-link :to="collectionPath" class="block">
          <Card class="rankland-home-card">
            <div class="rankland-home-card-body">
              <h2 class="rankland-home-card-title">
                <Trophy class="rankland-home-card-icon" />
                榜单合集
              </h2>
              <p class="rankland-home-card-text">查阅由 SDUTACM 和 algoUX 团队精心整理的历年赛事榜单合集</p>
            </div>
          </Card>
        </router-link>
      </div>
    </section>

    <section class="rankland-section">
      <h2 class="rankland-section-title">算竞周边工具</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <a href="https://paste.then.ac/?utm_source=rankland" target="_blank" rel="noopener" class="block">
          <Card class="rankland-home-card">
            <div class="rankland-home-card-body">
              <h2 class="rankland-home-card-title">
                <img :src="pasteThenACLogo" alt="paste.then.ac logo" class="rankland-home-card-logo p-0.5" />
                paste.then.ac
              </h2>
              <p class="rankland-home-card-text">免注册、更适合算竞宝宝体质的的代码剪贴板</p>
            </div>
          </Card>
        </a>
        <a href="https://ab.algoux.cn/?utm_source=rankland" target="_blank" rel="noopener" class="block">
          <Card class="rankland-home-card">
            <div class="rankland-home-card-body">
              <h2 class="rankland-home-card-title">
                <img :src="algoBootstrapLogo" alt="Algo Bootstrap logo" class="rankland-home-card-logo" />
                Algo Bootstrap
              </h2>
              <p class="rankland-home-card-text">一键配置 C++、Python 和 VS Code 编程环境</p>
            </div>
          </Card>
        </a>
      </div>
    </section>

    <section class="rankland-section">
      <h2 class="rankland-section-title">资源和生态</h2>
      <ul class="rankland-home-list">
        <li>
          <a href="https://srk.algoux.org/?utm_source=rankland" target="_blank" rel="noopener">Standard Ranklist</a>
          ：标准榜单格式（srk）旨在标准化榜单数据，欢迎了解和共建生态
        </li>
        <li>
          <a href="https://github.com/algoux/srk-collection" target="_blank" rel="noopener">collection</a>
          ：长期维护的历年算竞榜单合集
        </li>
        <li>
          <a href="https://github.com/algoux/standard-ranklist-renderer-component" target="_blank" rel="noopener">renderer-component</a>
          ：在 Web 项目中使用渲染组件展示标准榜单
        </li>
        <li>
          <a href="https://github.com/algoux/standard-ranklist-utils" target="_blank" rel="noopener">utils</a>
          ：标准榜单开发实用工具库
        </li>
        <li>
          <a href="https://github.com/algoux/standard-ranklist-convert-to" target="_blank" rel="noopener">convert-to</a>
          ：转换标准榜单到 Excel、Gym Ghost、VJ 等其他格式
        </li>
      </ul>
    </section>

    <section class="rankland-section">
      <h2 class="rankland-section-title">联系我们</h2>
      <p class="rankland-home-paragraph">
        如要为赛事寻求专业的实时外榜托管服务或希望补全/纠正本站数据，欢迎
        <ContactUs>
          <a>与我们联系</a>
        </ContactUs>。
      </p>
    </section>

    <section class="rankland-section mb-8">
      <h2 class="rankland-section-title">关于我们</h2>
      <div class="rankland-home-about">
        <p>algoUX: Where <span class="rankland-home-about-em-gradient"><strong>Algo</strong>rithms</span> Meet <strong class="rankland-home-about-em">UX</strong></p>
        <p>
          Find us on
          <a href="https://github.com/algoux" target="_blank" rel="noopener">GitHub</a>
        </p>
        <p>© 2022-present algoUX. All Rights Reserved.</p>
        <p>榜单访问统计：至少 {{ totalViewCount }} 次</p>
        <p>
          其他链接：
          <a href="https://algoux.org" target="_blank" rel="noopener">首页</a>
          <span class="mx-2">|</span>
          <a href="https://servicestatus.algoux.org" target="_blank" rel="noopener">服务状态</a>
        </p>
        <p v-if="buildCommitLink">
          RankLand 构建版本
          <a :href="buildCommitLink.href" target="_blank" rel="noopener">{{ buildCommitLink.label }}</a> · Powered by <a href="https://github.com/bwcxjs/bwcx" target="_blank" rel="noopener">bwcx</a>
        </p>
        <p v-if="showBeian">
          备案号：
          <BeianLink />
        </p>
      </div>
    </section>
  </main>
</template>

<script lang="ts">
import { Options, Vue, setup } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { useHead } from '@vueuse/head';
import { View, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { List, Trophy } from 'lucide-vue-next';
import type { AsyncDataOptions } from '@client/typings';
import type { IApiStatistics } from '@/services/ranklist-api';
import { Card } from '@/components/ui/card';
import BeianLink from '@/components/site/BeianLink.vue';
import ContactUs from '@/components/site/ContactUs.vue';
import { formatTitle } from '@/app/title-format';
import { getFullUrl, getRanklandBuildCommitLink, getRanklandRuntimeConfig, ranklandRoutes } from '@/app/config';
import pasteThenACLogo from '@/assets/paste-then-ac_logo.png';
import algoBootstrapLogo from '@/assets/algo-bootstrap_logo.png';

@View('/')
@RenderMethod(RenderMethodKind.SSR)
@Options({
  components: {
    BeianLink,
    Card,
    ContactUs,
    List,
    Trophy,
  },
})
export default class Home extends Vue {
  @Prop() statistics?: IApiStatistics;

  pasteThenACLogo = pasteThenACLogo;
  algoBootstrapLogo = algoBootstrapLogo;
  explorePath = ranklandRoutes.formatUrl('Search');
  collectionPath = ranklandRoutes.formatUrl('Collection', { id: 'official' });

  head = setup(() => {
    const homepageUrl = getFullUrl(ranklandRoutes.formatUrl('Home'));
    const exploreUrl = getFullUrl(ranklandRoutes.formatUrl('Search'));
    const collectionUrl = getFullUrl(ranklandRoutes.formatUrl('Collection', { id: 'official' }));

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
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'RankLand',
            url: homepageUrl,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${exploreUrl}?kw={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'SiteNavigationElement', name: '探索', url: exploreUrl },
              { '@type': 'SiteNavigationElement', name: '榜单合集', url: collectionUrl },
            ],
          }),
        },
      ],
    });
    return {};
  });

  get totalSrkCount() {
    return this.statistics?.totalSrkCount ?? '-';
  }

  get totalViewCount() {
    return this.statistics?.totalViewCount ?? '-';
  }

  get showBeian() {
    return getRanklandRuntimeConfig().siteAlias === 'cnn';
  }

  get buildCommitLink() {
    return getRanklandBuildCommitLink();
  }

  async asyncData({ api }: AsyncDataOptions) {
    const statistics = await api.getStatistics();
    return {
      statistics,
    };
  }
}
</script>
