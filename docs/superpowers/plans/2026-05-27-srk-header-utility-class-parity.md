# SRK Header Utility Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React SRK header utility class tokens while preserving the existing Vue header behavior.

**Architecture:** Keep the shared `RanklandRanklist` header structure and scoped CSS. Add class-token assertions to the existing ranklist full-chain route, then append the old utility classes beside migrated hooks in `rankland-ranklist.vue`.

**Tech Stack:** Vue 3 SFC, scoped Less, Ant Design Vue, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add header utility class helper**

Add this helper near `getRanklistHeaderTitlePresentation`:

```ts
async function getHeaderUtilityClasses(page: Page) {
  return page.evaluate(() => {
    const banner = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-banner"]');
    const bannerWrap = banner?.parentElement;
    const title = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-title"]');
    const meta = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-meta"]');
    const contributors = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-contributors"]');
    const time = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-time"]');
    if (!banner || !bannerWrap || !title || !meta || !contributors || !time) {
      throw new Error('Missing ranklist header utility class targets');
    }
    return {
      bannerWrapClasses: Array.from(bannerWrap.classList),
      bannerClasses: Array.from(banner.classList),
      titleClasses: Array.from(title.classList),
      metaClasses: Array.from(meta.classList),
      contributorsClasses: Array.from(contributors.classList),
      timeClasses: Array.from(time.classList),
    };
  });
}
```

- [x] **Step 2: Assert old header utility class tokens**

In the main `/ranklist/:id` full-chain test, after the existing title presentation assertion, add:

```ts
expect(await getHeaderUtilityClasses(page)).toMatchObject({
  bannerWrapClasses: expect.arrayContaining(['rankland-ranklist-banner-wrap', 'flex', 'items-center', 'justify-center']),
  bannerClasses: expect.arrayContaining(['rankland-ranklist-banner', 'mb-2']),
  titleClasses: expect.arrayContaining(['text-center', 'mb-1']),
  metaClasses: expect.arrayContaining(['rankland-ranklist-header-meta', 'text-center', 'mt-1']),
  contributorsClasses: expect.arrayContaining(['rankland-ranklist-contributors', 'mb-0']),
  timeClasses: expect.arrayContaining(['rankland-ranklist-time', 'text-center', 'mb-0']),
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the current Vue header lacks the old utility class tokens.

### Task 2: Restore Header Utility Class Tokens

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add old classes to header nodes**

Change the header template to:

```vue
<div v-if="contestBannerSrc" class="rankland-ranklist-banner-wrap flex items-center justify-center">
  <img
    data-id="rankland-ranklist-banner"
    ...
    class="rankland-ranklist-banner mb-2"
  >
</div>
<h1 data-id="rankland-ranklist-title" class="text-center mb-1">{{ ranklistTitle }}</h1>
<div data-id="rankland-ranklist-header-meta" class="rankland-ranklist-header-meta text-center mt-1">
...
<p data-id="rankland-ranklist-contributors" class="rankland-ranklist-contributors mb-0">
...
<p data-id="rankland-ranklist-time" class="rankland-ranklist-time text-center mb-0">{{ contestTimeRange }}</p>
```

Keep text, links, banner src, and existing header behavior unchanged.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record SRK header utility class parity in the route row, SRK wrapper summary, manual checklist ranklist notes, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-srk-header-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-srk-header-utility-class-parity.md
git commit -m "fix: 还原 SRK 头部旧版工具类"
```
