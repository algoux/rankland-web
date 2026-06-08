import { describe, expect, it } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createMemoryHistory, createRouter } from 'vue-router';
import type * as srk from '@algoux/standard-ranklist';
import StyledRanklist from './StyledRanklist.vue';
import StyledRanklistRenderer from './StyledRanklistRenderer.vue';
import BeianLink from '@/components/site/BeianLink.vue';
import ClientOnly from '@/components/common/ClientOnly.vue';
import CompetitionProgressBar from '@/components/ranklist/CompetitionProgressBar.vue';
import ContactUs from '@/components/site/ContactUs.vue';
import CopyToClipboardButton from '@/components/common/CopyToClipboardButton.vue';
import Loading from '@/components/common/Loading.vue';
import RankCurve from '@/components/ranklist/RankCurve.vue';
import SrkAssetImage from '@/components/ranklist/SrkAssetImage.vue';
import UserInfoModal from '@/components/ranklist/UserInfoModal.vue';

describe('ranklist Vue components', () => {
  it('can be imported by Vite/Vitest so templates stay compilable before routes use them', () => {
    expect(StyledRanklist).toBeTruthy();
    expect(StyledRanklistRenderer).toBeTruthy();
    expect(BeianLink).toBeTruthy();
    expect(ClientOnly).toBeTruthy();
    expect(CompetitionProgressBar).toBeTruthy();
    expect(ContactUs).toBeTruthy();
    expect(CopyToClipboardButton).toBeTruthy();
    expect(Loading).toBeTruthy();
    expect(RankCurve).toBeTruthy();
    expect(SrkAssetImage).toBeTruthy();
    expect(UserInfoModal).toBeTruthy();
  });

  it('SSR-renders a minimal ranklist fixture', async () => {
    const data: srk.Ranklist = {
      type: 'general',
      version: '0.3.12',
      contest: {
        title: 'Example Contest',
        startAt: '2026-06-01T09:00:00+08:00',
        duration: [5, 'h'],
      },
      problems: [{ alias: 'A' }],
      series: [{ title: '#', rule: { preset: 'ICPC', options: { count: { value: [] } } } }],
      rows: [
        {
          user: { id: 'alice', name: 'Alice', organization: 'Wonderland University', official: true },
          score: { value: 1, time: [10, 'min'] },
          statuses: [{ result: 'AC', time: [10, 'min'], tries: 1, solutions: [{ result: 'AC', time: [10, 'min'] }] }],
        },
      ],
    };
    const app = createSSRApp(StyledRanklist, { data, name: 'example', showProgress: false });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    });
    app.use(router);
    await router.push('/');
    await router.isReady();

    const html = await renderToString(app);

    expect(html).toContain('Example Contest');
    expect(html).toContain('Alice');
  });
});
