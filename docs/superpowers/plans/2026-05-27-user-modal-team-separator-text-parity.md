# User Modal Team Separator Text Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock the old React raw `' / '` team-member separator text in Vue SRK user modal full-chain coverage.

**Architecture:** Keep the existing team-members row structure, selectors, classes, CSS, and production template. Add a raw `textContent` full-chain assertion because current runtime output already matches the old React span.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Capture Raw Text Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add a raw separator text assertion**

Replace the current separator assertion block:

```ts
await expect(teamMembers.locator('[data-id="rankland-user-modal-team-separator"]')).toHaveText('/');
```

with:

```ts
const teamSeparator = teamMembers.locator('[data-id="rankland-user-modal-team-separator"]');
await expect(teamSeparator).toHaveText('/');
expect(await teamSeparator.evaluate((element) => element.textContent)).toBe(' / ');
```

- [x] **Step 2: Keep existing separator style assertions**

The test must continue to verify:

```ts
const separatorStyle = await teamMembers
  .locator('[data-id="rankland-user-modal-team-separator"]')
  .evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      opacity: style.opacity,
      fontSize: style.fontSize,
    };
  });
expect(separatorStyle).toMatchObject({
  opacity: '0.5',
  fontSize: '11.2px',
});
```

- [x] **Step 3: Run the focused full-chain test**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS because the current rendered Vue DOM already exposes exact raw textContent `' / '`.

### Task 2: Confirm No Production Implementation Is Needed

**Files:**
- Inspect: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Keep the existing production template unchanged**

The current template remains:

```vue
<span
  v-if="memberIndex > 0"
  data-id="rankland-user-modal-team-separator"
  class="rankland-user-modal-team-separator user-modal-info-team-members-slash"
>
  /
</span>
```

The focused full-chain run proves this renders raw textContent `' / '`, so changing it would be churn rather than parity work.

- [x] **Step 2: Record the focused full-chain result**

Already run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS.

### Task 3: Update Migration Records And Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Record team separator raw text coverage**

Update migration docs to mention the old React raw `' / '` team separator text coverage in addition to the existing team-members row style coverage.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration test suite, and whitespace check.

- [x] **Step 3: Commit the verified slice**

Run:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-team-separator-text-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-team-separator-text-parity.md
git commit -m "test: 覆盖用户弹窗旧版队员分隔符文本"
```
