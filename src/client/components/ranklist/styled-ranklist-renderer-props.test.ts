import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createMemoryHistory, createRouter } from 'vue-router';
import type * as srk from '@algoux/standard-ranklist';

vi.mock('@algoux/standard-ranklist-renderer-component-vue', async () => {
  const { defineComponent, h } = await vi.importActual<typeof import('vue')>('vue');
  return {
    DefaultSolutionModal: defineComponent({ setup: () => () => h('div') }),
    Modal: defineComponent({
      setup: (_props, { slots }) => () => h('div', slots.default?.()),
    }),
    ProgressBar: defineComponent({ setup: () => () => h('div') }),
    Ranklist: defineComponent({
      props: {
        showDirtColumn: { type: Boolean, default: false },
        showProblemStatisticsFooter: { type: Boolean, default: false },
        showSEColumn: { type: Boolean, default: false },
        statusColorAsText: { type: Boolean, default: false },
      },
      setup: (props) => () =>
        h('div', {
          'data-id': 'ranklist-prop-probe',
          'data-show-dirt-column': String(props.showDirtColumn),
          'data-show-problem-statistics-footer': String(props.showProblemStatisticsFooter),
          'data-show-s-e-column': String(props.showSEColumn),
          'data-status-color-as-text': String(props.statusColorAsText),
        }),
    }),
  };
});

describe('StyledRanklistRenderer Ranklist props', () => {
  it('enables professional problem extras when professional mode is on and problems exist', async () => {
    const html = await renderStyledRanklistWithProfessionalMode(createRanklistFixture({
      problems: [{ alias: 'A' }],
      statuses: [{ result: 'AC', time: [10, 'min'], tries: 1 }],
    }));

    expect(html).toContain('data-show-problem-statistics-footer="true"');
    expect(html).toContain('data-show-dirt-column="true"');
    expect(html).toContain('data-show-s-e-column="true"');
  });

  it('disables professional problem extras when the ranklist has no problems', async () => {
    const html = await renderStyledRanklistWithProfessionalMode(createRanklistFixture({
      problems: [],
      statuses: [],
    }));

    expect(html).toContain('data-show-problem-statistics-footer="false"');
    expect(html).toContain('data-show-dirt-column="false"');
    expect(html).toContain('data-show-s-e-column="false"');
  });

  it('forces status colors to text for score sorter ranklists', async () => {
    const html = await renderStyledRanklistWithProfessionalMode(
      createRanklistFixture({
        problems: [{ alias: 'A' }],
        statuses: [{ result: 'AC', time: [10, 'min'], tries: 1 }],
        sorter: { algorithm: 'score', config: {} },
      }),
      { statusColorAsText: false },
    );

    expect(html).toContain('data-status-color-as-text="true"');
  });

  it('keeps saved status color mode for non-score sorter ranklists', async () => {
    const html = await renderStyledRanklistWithProfessionalMode(
      createRanklistFixture({
        problems: [{ alias: 'A' }],
        statuses: [{ result: 'AC', time: [10, 'min'], tries: 1 }],
        sorter: { algorithm: 'ICPC', config: {} },
      }),
      { statusColorAsText: false },
    );

    expect(html).toContain('data-status-color-as-text="false"');
  });
});

function createRanklistFixture({
  problems,
  sorter,
  statuses,
}: {
  problems: srk.Problem[];
  sorter?: srk.Sorter;
  statuses: srk.Status[];
}): srk.Ranklist {
  return {
    type: 'general',
    version: '0.3.13',
    contest: {
      title: 'Professional Props Fixture',
      startAt: '2026-06-01T09:00:00+08:00',
      duration: [5, 'h'],
    },
    problems,
    series: [{ title: '#', rule: { preset: 'ICPC', options: { count: { value: [] } } } }],
    rows: [
      {
        user: { id: 'alice', name: 'Alice', official: true },
        score: { value: 1, time: [10, 'min'] },
        statuses,
      },
    ],
    sorter,
  };
}

async function renderStyledRanklistWithProfessionalMode(
  data: srk.Ranklist,
  settings?: Partial<{
    statusColorAsText: boolean;
  }>,
) {
  const { default: StyledRanklistRenderer } = await import('./StyledRanklistRenderer.vue');
  const localStorage = {
    getItem: (key: string) =>
      key === 'StyledRanklistSettings'
        ? JSON.stringify({
          professionalMode: true,
          statusCellPreset: 'minimal',
          statusColorAsText: true,
          rowStriped: false,
          tableBordered: true,
          emptyStatusPlaceholder: 'dash',
          splitOrganization: true,
          userAvatarPlacement: 'user',
          ...settings,
        })
        : undefined,
    setItem: () => {},
  };
  vi.stubGlobal('window', {
    document: {
      body: {
        dataset: { ranklandHydrated: 'true' },
      },
    },
    localStorage,
    location: {
      host: 'rl.local',
      protocol: 'https:',
    },
  });
  const app = createSSRApp(StyledRanklistRenderer, {
    data,
    id: 'fixture',
    name: 'fixture',
    showProgress: false,
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  });
  app.use(router);
  await router.push('/');
  await router.isReady();
  try {
    return await renderToString(app);
  } finally {
    vi.unstubAllGlobals();
  }
}
