# Live Mobile Toggle Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the `/live/:id` scroll-solution toggle on mobile to match the old React live page while preserving desktop and query-driven behavior.

**Architecture:** Use a full-chain Playwright test to pin the user-visible mobile behavior, then apply a CSS-only visibility rule to the existing Vue label. This avoids new runtime width state and keeps WebSocket/data flow unchanged.

**Tech Stack:** Vue 3 SFC, Less scoped styles, Playwright full-chain E2E, RankLand mock backend.

---

## File Structure

- Modify `tests/e2e/full-chain/live.spec.ts` to add the mobile viewport parity test.
- Modify `src/client/modules/live/live.view.vue` to hide `.live-scroll-toggle` below `768px`.
- Modify `docs/migration/status.md` after verification to record the slice.
- No generated router files should change.

## Tasks

### Task 1: Add failing mobile full-chain coverage

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Add the mobile parity test**

Add this test after the main desktop live route test:

```ts
  test('hides the scroll-solution toggle on mobile while preserving live ranklist rendering', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await denyExternalCalls(page);
    await stubWebSocket(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.goto('/live/live-test-key?token=t0&focus=yes');

    await expect(page.locator('[data-id="live-ranklist-content"]')).toBeVisible();
    await expect(page.locator('[data-id="live-hydrated"]')).toHaveText('hydrated');
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.locator('[data-id="live-scroll-solution-toggle"]')).toBeHidden();
    await expect(page.locator('[data-id="live-scroll-solution"]')).toBeHidden();
  });
```

- [x] **Step 2: Run the narrow full-chain test and confirm red**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts -g "hides the scroll-solution toggle on mobile"
```

Result: failed as expected because the current Vue page rendered the toggle on mobile.

### Task 2: Implement CSS-only mobile parity

**Files:**
- Modify: `src/client/modules/live/live.view.vue`

- [x] **Step 1: Hide the toggle below 768px**

Inside the existing `@media (max-width: 767px)` block, replace the mobile `.live-scroll-toggle` rule with:

```less
  .live-scroll-toggle {
    display: none;
  }
```

- [x] **Step 2: Re-run the focused full-chain test**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts -g "hides the scroll-solution toggle on mobile"
```

Result: passed. The command runs the full live spec file through the current npm script argument shape, so it verified all 5 `/live/:id` full-chain tests.

### Task 3: Verify live route and document status

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-22-live-mobile-toggle-parity.md`

- [x] **Step 1: Run the live full-chain suite**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts
```

Result: passed for all 5 `/live/:id` full-chain tests.

- [x] **Step 2: Update migration status**

Set the current slice to `live mobile scroll-solution toggle parity`, record the live full-chain gate, and keep `realtime reconnect policy` as remaining review work.

- [x] **Step 3: Check off completed plan tasks**

Result: completed through Task 3 after the migration status update.

### Task 4: Commit the slice

**Files:**
- Add/modify all files from Tasks 1-3.

- [x] **Step 1: Inspect the diff**

Run:

```bash
git diff -- tests/e2e/full-chain/live.spec.ts src/client/modules/live/live.view.vue docs/migration/status.md docs/superpowers/specs/2026-05-22-live-mobile-toggle-parity-design.md docs/superpowers/plans/2026-05-22-live-mobile-toggle-parity.md
```

Result: only the planned test, CSS, and docs changes are present.

- [x] **Step 2: Commit**

Run:

```bash
git add tests/e2e/full-chain/live.spec.ts src/client/modules/live/live.view.vue docs/migration/status.md docs/superpowers/specs/2026-05-22-live-mobile-toggle-parity-design.md docs/superpowers/plans/2026-05-22-live-mobile-toggle-parity.md
git commit -m "fix: 对齐实时榜单移动端开关显示"
```
