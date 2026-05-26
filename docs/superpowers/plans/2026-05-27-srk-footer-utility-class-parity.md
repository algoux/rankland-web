# SRK Footer Utility Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React SRK footer utility class tokens while preserving the existing Vue footer behavior.

**Architecture:** Keep the shared `RanklandRanklist` footer and scoped CSS. Add class-token assertions to the existing ranklist full-chain route, then append the old utility classes beside migrated hooks in `rankland-ranklist.vue`.

**Tech Stack:** Vue 3 SFC, scoped Less, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add footer utility class helper**

Add this helper near `getFooterParagraphSpacing`:

```ts
async function getFooterUtilityClasses(page: Page) {
  return page.evaluate(() => {
    const footer = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-footer"]');
    const paragraphs = Array.from(
      document.querySelectorAll<HTMLElement>('[data-id="rankland-ranklist-footer"] p'),
    );
    if (!footer || paragraphs.length < 5) {
      throw new Error('Missing ranklist footer or footer paragraphs');
    }
    return {
      footerClasses: Array.from(footer.classList),
      paragraphClasses: paragraphs.slice(0, 5).map((paragraph) => Array.from(paragraph.classList)),
    };
  });
}
```

- [x] **Step 2: Assert old footer utility class tokens**

In the main `/ranklist/:id` full-chain test, after the existing `getFooterParagraphSpacing` assertion, add:

```ts
expect(await getFooterUtilityClasses(page)).toMatchObject({
  footerClasses: expect.arrayContaining(['rankland-ranklist-footer', 'text-center', 'mt-8']),
  paragraphClasses: [
    expect.arrayContaining(['mb-0']),
    expect.arrayContaining(['mt-1', 'mb-0']),
    expect.arrayContaining(['mt-1', 'mb-0']),
    expect.arrayContaining(['mt-1', 'mb-0']),
    expect.arrayContaining(['mt-1', 'mb-0']),
  ],
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the current Vue footer root lacks `text-center mt-8` and paragraphs lack `mb-0` / `mt-1`.

### Task 2: Restore Footer Utility Class Tokens

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add old classes to the footer root and paragraphs**

Change the footer template to:

```vue
<footer v-if="showFooter" data-id="rankland-ranklist-footer" class="rankland-ranklist-footer text-center mt-8">
  <p class="mb-0">© 2022-present algoUX. All Rights Reserved.</p>
  <p class="mt-1 mb-0">...</p>
  <p class="mt-1 mb-0">...</p>
  <p class="mt-1 mb-0">...</p>
  <p class="mt-1 mb-0">...</p>
  <p v-if="footerSiteState.showBeian" data-id="rankland-ranklist-beian" class="mt-1 mb-0">...</p>
</footer>
```

Keep each paragraph's existing text and links unchanged.

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

Record SRK footer utility class parity in the route row, SRK wrapper summary, manual checklist ranklist notes, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-srk-footer-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-srk-footer-utility-class-parity.md
git commit -m "fix: 还原 SRK 页脚旧版工具类"
```
