import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { Ranklist } from '@algoux/standard-ranklist-renderer-component-vue';
import { convertToStaticRanklist } from '@algoux/standard-ranklist-utils';
import fixture from '../../../../tests/fixtures/ranklist.srk.json';
import ccpc26 from '../../../../tests/fixtures/ccpc26.srk.json';
import VirtualRanklist from './VirtualRanklist.vue';
import { getRanklistColumnWidths } from './ranklist-column-widths';
import { RANKLIST_ROW_HEIGHT, initialRanklistRowWindow, getUniformRowWindow } from './ranklist-row-window';

const render = (component: any, props: any) => renderToString(createSSRApp({ render: () => h(component, props) }));

describe('uniform ranklist row geometry', () => {
  it('uses one actual row stride for viewport edges and overscan', () => {
    expect(getUniformRowWindow(100, -1000, 60, 0, 600, 120)).toEqual({ start: 14, end: 29 });
    expect(getUniformRowWindow(2535, -1267 * 60.5, 60.5, 0, 600, 0)).toEqual({ start: 1267, end: 1277 });
  });

  it('clamps empty/offscreen cases and safely handles an unmeasurable row', () => {
    expect(getUniformRowWindow(0, 0, 60, 0, 900)).toEqual({ start: 0, end: 0 });
    expect(getUniformRowWindow(3, -1000, 60, 0, 900, 0)).toEqual({ start: 3, end: 3 });
    expect(getUniformRowWindow(3, 1000, 60, 0, 300, 0)).toEqual({ start: 0, end: 0 });
    expect(getUniformRowWindow(100, 0, 0, 0, 900)).toEqual({ start: 0, end: 40 });
  });

  it('keeps the bounded SSR window deterministic', () => {
    expect(initialRanklistRowWindow(2500)).toEqual({ start: 0, end: 40 });
    expect(initialRanklistRowWindow(3)).toEqual({ start: 0, end: 3 });
  });
});

describe('renderer controlled display window', () => {
  it('preserves complete headers/statistics while rendering global row indices', async () => {
    const data = convertToStaticRanklist(fixture as any);
    const full = await render(Ranklist, { data, showProblemStatisticsFooter: true });
    const windowed = await render(Ranklist, {
      data, showProblemStatisticsFooter: true, rowStriped: true, retainUserText: true,
      rowWindow: { start: 1, end: 2 },
    });
    expect(windowed.match(/data-row-index="\d+"/g)).toHaveLength(data.rows.length);
    expect(windowed.match(/data-rich-row="true"/g)).toHaveLength(1);
    expect(windowed.match(/data-search-text="name"/g)).toHaveLength(data.rows.length);
    expect(windowed).toContain('aria-rowindex="3"');
    expect(windowed).toContain('srk-table-row-striped');
    expect(windowed).toContain(`aria-rowcount="${data.rows.length + 9}"`);
    expect(windowed.match(/<thead>[\s\S]*?<\/thead>/)?.[0]).toBe(full.match(/<thead>[\s\S]*?<\/thead>/)?.[0]);
    expect(windowed.match(/<tfoot[\s\S]*?<\/tfoot>/)?.[0].replace(/ aria-rowindex="\d+"/g, '')).toBe(full.match(/<tfoot[\s\S]*?<\/tfoot>/)?.[0]);
    expect(windowed).toContain(`aria-rowindex="${data.rows.length + 9}"`);
    expect(windowed).not.toContain('srk-row-spacer');
  });

  it('uses the complete CCPC26 reveal layout when the visible row window changes', async () => {
    const data = convertToStaticRanklist(ccpc26 as any);
    const props = { data, enableCCPC26: true, showProblemStatisticsFooter: true, retainUserText: true };
    const full = await render(Ranklist, props);
    const windowed = await render(Ranklist, { ...props, rowWindow: { start: 2, end: 3 } });
    expect(windowed.match(/<thead>[\s\S]*?<\/thead>/)?.[0]).toBe(full.match(/<thead>[\s\S]*?<\/thead>/)?.[0]);
    const fullLastRow = full.match(/<tr data-row-index="2"[\s\S]*?<\/tr>/)?.[0];
    const windowLastRow = windowed.match(/<tr data-row-index="2"[\s\S]*?<\/tr>/)?.[0];
    expect(windowLastRow?.replace(/ aria-rowindex="\d+"| class="srk-window-row-odd"/g, '')).toBe(fullLastRow?.replace(' class=""', ''));
  });

  it('keeps all identities in large SSR output while bounding complex cells', async () => {
    const data = convertToStaticRanklist(fixture as any);
    const small = await render(VirtualRanklist, { data });
    expect(small.match(/data-row-index="\d+"/g)).toHaveLength(data.rows.length);
    const rows = Array.from({ length: 1000 }, (_, index) => ({
      ...data.rows[index % data.rows.length],
      user: { ...data.rows[index % data.rows.length].user, id: `user-${index}` },
    }));
    const large = await render(VirtualRanklist, { data: { ...data, rows } });
    expect(large.match(/data-row-index="\d+"/g)).toHaveLength(1000);
    expect(large.match(/data-rich-row="true"/g)).toHaveLength(40);
    expect(large.match(/data-search-text="name"/g)).toHaveLength(1000);
    expect(large).toContain('data-windowed="true"');
    expect(large).toContain('显示完整榜单');
  });
});

// A minimal host renderer exercises Vue's actual patch/memo path without a DOM
// emulator. Text-node identity is the contract used by native find selections.
interface HostNode {
  tag: string;
  props: Record<string, any>;
  children: HostNode[];
  parent: HostNode | null;
  text?: string;
}
function hostNode(tag: string, text?: string): HostNode {
  return { tag, props: {}, children: [], parent: null, text };
}
function descendants(node: HostNode): HostNode[] {
  return [node, ...node.children.flatMap(descendants)];
}

it('retains the actual name and school text nodes while rich cells change, and invalidates memo on data/language/layout updates', async () => {
  const { createRenderer, nextTick, shallowRef } = await import('vue');
  let hostOperations = 0;
  const guard = () => { if (++hostOperations > 20000) throw new Error('Host renderer operation loop'); };
  const renderer = createRenderer<HostNode, HostNode>({
    createElement: tag => hostNode(tag),
    createText: text => hostNode('#text', text),
    createComment: text => hostNode('#comment', text),
    setText: (node, text) => { node.text = text; },
    setElementText: (node, text) => { const child = hostNode('#text', text); child.parent = node; node.children = [child]; },
    parentNode: node => node.parent,
    nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
    patchProp: (node, name, _previous, value) => { node.props[name] = value; },
    remove: node => { guard(); if (node.parent) { const index = node.parent.children.indexOf(node); if (index < 0) throw new Error('Removing missing host node'); node.parent.children.splice(index, 1); } node.parent = null; },
    insert: (node, parent, anchor) => {
      guard();
      if (node === parent) throw new Error("Host node inserted into itself");
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
      const index = anchor ? parent.children.indexOf(anchor) : -1;
      parent.children.splice(index < 0 ? parent.children.length : index, 0, node);
      node.parent = parent;
    },
  });
  const original = convertToStaticRanklist(fixture as any);
  original.rows = original.rows.map(row => ({ ...row, statuses: row.statuses.map(status => ({ ...status, solutions: [{ result: status.result === 'AC' ? 'AC' as const : 'RJ' as const, time: [1, 'min'] as [number, 'min'] }] })) }));
  original.rows[0].user = {
    ...original.rows[0].user,
    name: { fallback: 'Alpha', 'zh-CN': '甲队' },
    organization: { fallback: 'School', 'zh-CN': '甲校' },
    avatar: 'https://example.test/avatar.png',
  };
  const data = shallowRef(original);
  const range = shallowRef<any>({ start: 0, end: 1 });
  const languages = shallowRef(['zh-CN']);
  const split = shallowRef(false);
  let clicked: any;
  let solutionClicked: any;
  const root = hostNode('root');
  const app = renderer.createApp({ render: () => h(Ranklist, {
    data: data.value, rowWindow: range.value, retainUserText: true, languages: languages.value,
    splitOrganization: split.value, onUserClick: payload => { clicked = payload; },
    onSolutionClick: payload => { solutionClicked = payload; },
  }) });
  app.mount(root);
  const row = (index: number) => descendants(root).find(node => node.tag === 'tr' && node.props['data-row-index'] === index)!;
  const name = () => descendants(row(0)).find(node => node.props['data-search-text'] === 'name')!;
  const school = () => descendants(row(0)).find(node => node.props['data-search-text'] === 'organization')!;
  const originalName = name().children[0];
  const originalSchool = school().children[0];
  expect(originalName.text).toBe('甲队');
  expect(descendants(row(0)).some(node => node.tag === 'img')).toBe(true)
  range.value = { start: 2, end: 3 };
  await nextTick();
  expect(name().children[0] === originalName).toBe(true);
  expect(school().children[0] === originalSchool).toBe(true);
  expect(descendants(row(0)).some(node => node.tag === 'img')).toBe(false);
  expect(row(0).props['data-rich-row']).toBe('false');
  range.value = { start: 0, end: 1 };
  await nextTick();
  expect(name().children[0] === originalName).toBe(true);
  expect(school().children[0] === originalSchool).toBe(true);
  expect(descendants(row(0)).some(node => node.tag === 'img')).toBe(true);
  descendants(row(0)).find(node => String(node.props.class).includes('srk-search-user-cell'))!.props.onClick({ preventDefault() {}, clientX: 0, clientY: 0 });
  expect(clicked.rowIndex).toBe(0);
  expect(clicked.ranklist).toBe(data.value)
  range.value = undefined;
  await nextTick();
  expect(name().children[0] === originalName).toBe(true);
  expect(school().children[0] === originalSchool).toBe(true);
  expect(row(0).props['aria-rowindex']).toBeUndefined();
  range.value = { start: 0, end: 1 };
  await nextTick();
  expect(name().children[0] === originalName).toBe(true);
  expect(row(0).props['aria-rowindex']).toBe(2)
  languages.value = ['en'];
  await nextTick();
  expect(name().children[0].text).toBe('Alpha');
  expect(school().children[0].text).toBe('School')
  data.value = { ...data.value, rows: data.value.rows.map((item, index) => index ? item : { ...item, user: { ...item.user, name: 'Renamed' } }) };
  await nextTick();
  expect(name().children[0].text).toBe('Renamed')
  split.value = true;
  await nextTick();
  const splitSchool = school().children[0];
  range.value = { start: 2, end: 3 };
  await nextTick();
  expect(school().children[0] === splitSchool).toBe(true);
  expect(descendants(row(0)).filter(node => node.props['data-search-text'] === 'organization')).toHaveLength(1);
  data.value = { ...data.value, rows: [...data.value.rows].reverse() };
  range.value = { start: 0, end: 1 };
  await nextTick();
  const mouse = { preventDefault() {}, clientX: 0, clientY: 0 };
  descendants(row(0)).find(node => String(node.props.class).includes('srk-search-user-cell'))!.props.onClick(mouse);
  expect(clicked.user.id).toBe(data.value.rows[0].user.id);
  expect(clicked.rowIndex).toBe(0);
  descendants(row(0)).find(node => node.tag === 'td' && String(node.props.class).includes('srk-prest-status-block') && String(node.props.class).includes('srk--cursor-pointer') && node.props.onClick)!.props.onClick(mouse);
  expect(solutionClicked.user.id).toBe(data.value.rows[0].user.id);
  expect(solutionClicked.rowIndex).toBe(0);
  app.unmount();
});


it('escapes untrusted identity text and title attributes in the actual retained identity SSR', async () => {
  const data = convertToStaticRanklist(fixture as any);
  const attack = '\"><img src=x onerror=alert(1)>&\'\"<script>alert(2)</script>';
  data.rows[0].user = { ...data.rows[0].user, name: attack, organization: attack };
  const html = await render(Ranklist, { data, retainUserText: true, rowWindow: { start: 2, end: 3 } });
  expect(html).not.toMatch(/<script|<img[^>]*onerror/);
  expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;&amp;&#39;&quot;&lt;script&gt;alert(2)&lt;/script&gt;');
  expect(html.match(/data-search-text="name"/g)).toHaveLength(data.rows.length);
  expect(html.match(/data-search-text="organization"/g)).toHaveLength(data.rows.filter(row => row.user.organization).length);
});


it('uses one light cell (two when split), with logical column semantics even for empty series', async () => {
  const source = convertToStaticRanklist(fixture as any);
  const data = { ...source, series: [], rows: source.rows.map(row => ({ ...row, rankValues: [] })) };
  for (const splitOrganization of [false, true]) {
    const html = await render(Ranklist, { data, retainUserText: true, splitOrganization, columnWidths: getRanklistColumnWidths({ data, splitOrganization }), rowWindow: { start: 0, end: 1 } });
    const lightRow = html.match(/<tr data-row-index="1"[\s\S]*?<\/tr>/)?.[0] || '';
    expect(lightRow.match(/<td\b/g)).toHaveLength(splitOrganization ? 2 : 1);
    expect(lightRow).not.toContain('colspan="0"');
    expect(lightRow).toContain(`aria-colindex="${splitOrganization ? 2 : 1}"`);
    expect(lightRow).toContain('aria-colspan="1"');
  }
});


it('applies one row-height contract to small and large boards, independently of the rich window', async () => {
  const data = convertToStaticRanklist(fixture as any);
  const small = await render(VirtualRanklist, { data });
  expect(small).toContain(`data-row-height="${RANKLIST_ROW_HEIGHT}"`);
  expect(small.match(new RegExp(`height:${RANKLIST_ROW_HEIGHT}px`, 'g'))).toHaveLength(data.rows.length);
  const windowed = await render(Ranklist, { data, rowHeight: RANKLIST_ROW_HEIGHT, retainUserText: true, rowWindow: { start: 0, end: 1 } });
  expect(windowed.match(new RegExp(`height:${RANKLIST_ROW_HEIGHT}px`, 'g'))).toHaveLength(data.rows.length);
  const complete = await render(Ranklist, { data, rowHeight: RANKLIST_ROW_HEIGHT, retainUserText: true });
  expect(complete.match(new RegExp(`height:${RANKLIST_ROW_HEIGHT}px`, 'g'))).toHaveLength(data.rows.length);
});
