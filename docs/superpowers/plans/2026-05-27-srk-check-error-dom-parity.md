# SRK Check Error DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React SRK checker-error DOM for structurally invalid SRK objects.

**Architecture:** Keep parsing in Playground and rendering in the shared `RanklandRanklist` wrapper. Add a checker helper before `convertToStaticRanklist`, split checker failures into a distinct state, and render the old `ml-8` heading/pre DOM without changing renderer-error Alert behavior.

**Tech Stack:** Vue 3 SFC, `ts-interface-checker`, Playwright full-chain E2E, Vitest where needed.

---

### Task 1: Add RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [x] **Step 1: Update the invalid object test to assert checker-error DOM**

Replace the current `contains renderer conversion errors for object JSON that is not renderable SRK` expectations with:

```ts
  test('preserves the legacy checker error DOM for object JSON that is not valid SRK', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await markPlaygroundWelcomeRead(page);
    await page.goto('/playground');

    await expectMonacoReady(page);
    await replaceMonacoSource(page, '{"type":"general"}');

    const checkError = page.locator('[data-id="rankland-ranklist-check-error"]');
    await expect(checkError).toBeVisible();
    await expect(checkError).toHaveClass(/(^|\s)ml-8(\s|$)/);
    await expect(checkError.locator('h3')).toHaveText('Error occurred while checking srk:');
    await expect(checkError.locator('pre')).not.toBeEmpty();
    await expect(checkError).toHaveCSS('margin-left', '32px');
    await expect(page.locator('[data-id="rankland-ranklist-render-error"]')).toHaveCount(0);

    const requests = await readRequests(request);
    expect(requests).toHaveLength(0);
  });
```

- [x] **Step 2: Run the focused RED command**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "preserves the legacy checker error DOM"
```

Expected: FAIL because `[data-id="rankland-ranklist-check-error"]` is missing and the current Vue wrapper renders the renderer-error Alert.

### Task 2: Add Checker State

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Add: `src/client/lib/srk-checker/index.d.ti.ts`
- Add: `src/client/components/rankland-ranklist-checker.ts`
- Modify: `src/client/components/rankland-ranklist-state.ts`
- Modify: `tests/fixtures/ranklist.srk.json`
- Modify: `tests/unit/rankland-ranklist-state.spec.ts`

- [x] **Step 1: Add the checker runtime dependency**

Run:

```bash
corepack pnpm add ts-interface-checker@1.0.2
```

Expected: `package.json` and `pnpm-lock.yaml` add `ts-interface-checker`.

- [x] **Step 2: Copy the generated SRK checker module**

Copy the old generated checker from:

```text
/Users/cooper/Projects/RankLand/rankland-fe/src/lib/srk-checker/index.d.ti.ts
```

to:

```text
/Users/cooper/Projects/RankLand/rankland-web/src/client/lib/srk-checker/index.d.ti.ts
```

- [x] **Step 3: Add the checker helper**

Create `src/client/components/rankland-ranklist-checker.ts`:

```ts
import { createCheckers } from 'ts-interface-checker';
import srkChecker from '@client/lib/srk-checker/index.d.ti';
import type * as srk from '@algoux/standard-ranklist';

const { Ranklist: ranklistChecker } = createCheckers(srkChecker);

export function getLegacyRanklistCheckError(ranklist: srk.Ranklist): string | null {
  try {
    ranklistChecker.check(ranklist);
    return null;
  } catch (error) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return String(error || 'Unknown srk check error.');
  }
}
```

- [x] **Step 4: Split checker failures from renderer failures**

In `src/client/components/rankland-ranklist-state.ts`, import the helper and extend `RanklandRanklistState`:

```ts
import { getLegacyRanklistCheckError } from './rankland-ranklist-checker';
```

Add this union member:

```ts
  | {
      kind: 'check-error';
      message: string;
    }
```

At the start of `createRanklandRanklistState()`, before `deriveTimeTravelRanklist()`:

```ts
    const checkError = getLegacyRanklistCheckError(ranklist);
    if (checkError) {
      return {
        kind: 'check-error',
        message: checkError,
      };
    }
```

- [x] **Step 5: Render the old checker-error DOM**

In `src/client/components/rankland-ranklist.vue`, insert the checker branch before the renderer-error branch:

```vue
    <div
      v-if="ranklistState.kind === 'check-error'"
      data-id="rankland-ranklist-check-error"
      class="rankland-ranklist-check-error ml-8"
    >
      <h3>Error occurred while checking srk:</h3>
      <pre>{{ ranklistState.message }}</pre>
    </div>
```

Add scoped utility CSS:

```less
.ml-8 {
  margin-left: 32px;
}
```

- [x] **Step 6: Keep deterministic fixtures valid under the old checker**

Change the mock `Silver Group` marker style in `tests/fixtures/ranklist.srk.json` from the segment preset `silver` to the marker preset `blue`, preserving the public marker id and label:

```json
{ "id": "silver", "label": "Silver Group", "style": "blue" }
```

In `tests/unit/rankland-ranklist-state.spec.ts`, keep the local marker fixture styles checker-valid:

```ts
ranklist.markers = [
  { id: 'gold', label: 'Gold Group', style: 'yellow' },
  { id: 'silver', label: 'Silver Group', style: 'blue' },
];
```

- [x] **Step 7: Update state-unit expectations**

Change the object-input unit test to expect `check-error` instead of `error`, then run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-ranklist-state.spec.ts
```

Expected: PASS with 8 tests.

- [x] **Step 8: Run the focused GREEN command**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "preserves the legacy checker error DOM"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-srk-check-error-dom-parity.md`

- [x] **Step 1: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands exit 0.

- [x] **Step 2: Update migration docs**

Record `SRK checker error DOM parity`, focused RED/GREEN evidence, the new checker dependency, and the full gate result in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 3: Commit**

Run:

```bash
git add package.json pnpm-lock.yaml src/client/lib/srk-checker/index.d.ti.ts src/client/components/rankland-ranklist-checker.ts src/client/components/rankland-ranklist-state.ts src/client/components/rankland-ranklist.vue tests/fixtures/ranklist.srk.json tests/unit/rankland-ranklist-state.spec.ts tests/e2e/full-chain/playground.spec.ts docs/superpowers/specs/2026-05-27-srk-check-error-dom-parity-design.md docs/superpowers/plans/2026-05-27-srk-check-error-dom-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原 SRK 校验错误 DOM"
```
