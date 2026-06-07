# User Modal Marker Label Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React user modal marker label presentation in the Vue RankLand SRK wrapper.

**Architecture:** Keep the behavior inside `RanklandRanklist`, where user markers are already resolved. Add a small computed view model for modal markers so the template can apply old SRK preset classes and theme-aware inline styles without changing ranklist table rendering.

**Tech Stack:** Vue 3 SFC, SRK utilities, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/fixtures/ranklist.srk.json`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Use an old preset marker style in the fixture**

Change the Team Alpha marker config from a non-preset segment style:

```json
{ "id": "gold", "label": "Gold Group", "style": "gold" }
```

to a supported SRK preset marker style while keeping the public id and label:

```json
{ "id": "gold", "label": "Gold Group", "style": "yellow" }
```

- [x] **Step 2: Add user modal marker assertions**

After opening Team Alpha's user modal, assert:

```ts
const marker = userModal.locator('[data-id="rankland-user-modal-marker"]').first();
await expect(marker).toHaveText('Gold Group');
await expect(marker).toHaveClass(/user-modal-info-marker/);
await expect(marker).toHaveClass(/srk-preset-marker-yellow/);
const markerStyle = await marker.evaluate((element) => {
  const style = window.getComputedStyle(element);
  return {
    display: style.display,
    fontSize: style.fontSize,
    borderRadius: style.borderRadius,
    borderTopWidth: style.borderTopWidth,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    marginRight: style.marginRight,
  };
});
expect(markerStyle).toMatchObject({
  display: 'inline-block',
  fontSize: '12px',
  borderRadius: '4px',
  borderTopWidth: '1px',
  paddingTop: '2px',
  paddingRight: '2px',
  paddingBottom: '2px',
  paddingLeft: '2px',
  marginRight: '0px',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fails because `rankland-user-modal-marker` is absent and the Vue marker does not carry `srk-preset-marker-yellow`.

### Task 2: Implement Vue Marker Label Styling

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add marker presentation types and computed model**

Add:

```ts
interface ActiveUserMarkerLabel {
  id: string;
  label: string;
  className: string;
  style: Record<string, string>;
}
```

Change `activeUserMarkers` into `activeUserMarkerLabels` that resolves user markers, maps string styles to `srk-preset-marker-${style}`, and maps object styles through `resolveStyle(style)` with `this.ranklistTheme`.

- [x] **Step 2: Render old modal marker class contract**

Update the marker template:

```vue
<div v-if="activeUserMarkerLabels.length > 0" class="rankland-user-modal-markers user-modal-info-markers">
  <span
    v-for="marker in activeUserMarkerLabels"
    :key="marker.id"
    data-id="rankland-user-modal-marker"
    class="rankland-user-modal-marker user-modal-info-marker"
    :class="marker.className"
    :style="marker.style"
  >
    {{ marker.label }}
  </span>
</div>
```

- [x] **Step 3: Restore old CSS without touching rank-time events**

Update marker CSS:

```less
.rankland-user-modal-markers {
  display: block;
  margin-top: 8px;
}

.rankland-user-modal-marker {
  display: inline-block;
  padding: 2px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
}

.rankland-user-modal-marker:not(:last-of-type) {
  margin-right: 4px;
}
```

Keep `.rankland-rank-time-events` and `.rankland-rank-time-event` on their existing flex/gap/min-height badge styling.

- [x] **Step 4: Add old preset marker color classes**

Add:

```less
.srk-preset-marker-red {
  background-color: var(--srk-color-marker-red);
}
```

Repeat the same mapping for `orange`, `yellow`, `green`, `blue`, `purple`, and `pink`.

- [x] **Step 5: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-user-modal-marker-label-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record user modal marker label parity in `/ranklist/:id` coverage, SRK wrapper infrastructure status, deferred product decisions, known risks, and current focus.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/fixtures/ranklist.srk.json tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-user-modal-marker-label-parity-design.md docs/superpowers/plans/2026-05-26-user-modal-marker-label-parity.md
git commit -m "feat: 收口用户弹窗标记标签一致性"
```
