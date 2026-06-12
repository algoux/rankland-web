import { describe, expect, it } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createMemoryHistory, createRouter } from 'vue-router';
import type * as srk from '@algoux/standard-ranklist';
import { THEME_TOKEN, type ThemeService } from '@/lib/theme';
import { createEmptyRankTimeData } from '@/utils/rank-time-data.util';
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

  it('passes the injected dark theme to the ranklist renderer during SSR', async () => {
    const data: srk.Ranklist = {
      type: 'general',
      version: '0.3.12',
      contest: {
        title: 'Dark Theme Contest',
        startAt: '2026-06-01T09:00:00+08:00',
        duration: [5, 'h'],
      },
      markers: [
        {
          id: 'vip',
          label: 'VIP',
          style: {
            textColor: { light: '#111111', dark: '#eeeeee' },
            backgroundColor: { light: '#f5f5f5', dark: '#222222' },
          },
        },
      ],
      problems: [{ alias: 'A' }],
      series: [{ title: '#', rule: { preset: 'ICPC', options: { count: { value: [] } } } }],
      rows: [
        {
          user: { id: 'alice', name: 'Alice', organization: 'Wonderland University', official: true, marker: 'vip' },
          score: { value: 1, time: [10, 'min'] },
          statuses: [{ result: 'AC', time: [10, 'min'], tries: 1, solutions: [{ result: 'AC', time: [10, 'min'] }] }],
        },
      ],
    };
    const darkTheme: ThemeService = {
      state: { mode: 'dark', theme: 'dark' },
      setMode: () => {},
      setTheme: () => {},
      mount: () => () => {},
    };
    const app = createSSRApp(StyledRanklist, { data, name: 'dark-theme-example', showProgress: false });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    });
    app.use(router);
    app.provide(THEME_TOKEN, darkTheme);
    await router.push('/');
    await router.isReady();

    const html = await renderToString(app);

    expect(html).toContain('background-color:#222222');
    expect(html).not.toContain('background-color:#f5f5f5');
  });

  it('formats user modal team members with roles during SSR', async () => {
    const user: srk.User = {
      id: 'team-a',
      name: 'Team A',
      organization: 'Example University',
      official: true,
      teamMembers: [
        { name: { 'zh-CN': '张三', fallback: 'Alice' }, role: 'captain' },
        { name: 'Bob' },
      ],
    };
    const row = {
      user,
      score: { value: 1, time: [10, 'min'] },
      statuses: [],
      rankValues: [{ rank: 1, segmentIndex: null }],
    };
    const ranklist: srk.Ranklist = {
      type: 'general',
      version: '0.3.13',
      contest: {
        title: 'Team Member Role Contest',
        startAt: '2026-06-01T09:00:00+08:00',
        duration: [5, 'h'],
      },
      problems: [],
      series: [{ title: '#', rule: { preset: 'ICPC', options: { count: { value: [] } } } }],
      rows: [row],
    };
    const app = createSSRApp(UserInfoModal, {
      user,
      row,
      index: 0,
      ranklist,
      assetsScope: '',
      rankTimeData: createEmptyRankTimeData(),
    });

    const html = await renderToString(app);

    expect(html).toContain('Alice (captain)');
    expect(html).toContain(' / ');
    expect(html).toContain('Bob');
  });
});
