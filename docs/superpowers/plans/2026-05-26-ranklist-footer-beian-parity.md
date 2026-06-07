# Ranklist Footer Beian Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React ranklist footer beian line for the China site alias.

**Architecture:** Keep the visible footer in `rankland-ranklist.vue`, but extract the environment decision into a tiny helper that can be unit-tested without mounting the full SRK wrapper. The helper mirrors the home page and legacy React rule by treating `RANKLAND_SITE_ALIAS || SITE_ALIAS` as the site alias and `BEIAN` as the display text.

**Tech Stack:** Vue 3 SFC scoped Less, Vitest, Playwright full-chain tests, pnpm.

---

### Task 1: RED Unit and Full-Chain Coverage

**Files:**
- Create: `tests/unit/rankland-footer-site.spec.ts`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add failing unit coverage for footer beian environment rules**

Create `tests/unit/rankland-footer-site.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRanklandFooterSiteState } from '@client/components/rankland-footer-site';

describe('createRanklandFooterSiteState', () => {
  it('shows beian text for the RankLand cnn alias', () => {
    expect(
      createRanklandFooterSiteState({
        RANKLAND_SITE_ALIAS: 'cnn',
        SITE_ALIAS: 'global',
        BEIAN: '鲁ICP备00000000号',
      }),
    ).toMatchObject({
      showBeian: true,
      beianText: '鲁ICP备00000000号',
    });
  });

  it('supports the legacy SITE_ALIAS cnn env name', () => {
    expect(
      createRanklandFooterSiteState({
        SITE_ALIAS: 'cnn',
        BEIAN: '鲁ICP备11111111号',
      }),
    ).toMatchObject({
      showBeian: true,
      beianText: '鲁ICP备11111111号',
    });
  });

  it('hides beian for non-cnn aliases', () => {
    expect(
      createRanklandFooterSiteState({
        RANKLAND_SITE_ALIAS: 'global',
        SITE_ALIAS: 'cnn',
        BEIAN: '鲁ICP备00000000号',
      }),
    ).toMatchObject({
      showBeian: false,
      beianText: '鲁ICP备00000000号',
    });
  });
});
```

- [x] **Step 2: Add default full-chain non-cnn guard**

In `tests/e2e/full-chain/ranklist.spec.ts`, after existing footer text assertions, add:

```ts
await expect(page.locator('[data-id="rankland-ranklist-beian"]')).toHaveCount(0);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-footer-site.spec.ts --passWithNoTests
```

Expected: fail because `@client/components/rankland-footer-site` does not exist.

### Task 2: Implement Footer Beian State and Vue Rendering

**Files:**
- Create: `src/client/components/rankland-footer-site.ts`
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add the footer site helper**

Create `src/client/components/rankland-footer-site.ts`:

```ts
export interface RanklandFooterSiteEnv {
  RANKLAND_SITE_ALIAS?: string;
  SITE_ALIAS?: string;
  BEIAN?: string;
}

export interface RanklandFooterSiteState {
  showBeian: boolean;
  beianText: string;
}

export function createRanklandFooterSiteState(env: RanklandFooterSiteEnv = process.env): RanklandFooterSiteState {
  const siteAlias = env.RANKLAND_SITE_ALIAS || env.SITE_ALIAS;

  return {
    showBeian: siteAlias === 'cnn',
    beianText: env.BEIAN || '',
  };
}
```

- [x] **Step 2: Render the conditional beian line in the ranklist footer**

Import the helper, expose `footerSiteState` from setup, and add this footer line after the contact row:

```vue
<p v-if="footerSiteState.showBeian" data-id="rankland-ranklist-beian">
  备案号：
  <a
    data-id="rankland-ranklist-beian-link"
    href="https://beian.miit.gov.cn/"
    target="_blank"
    rel="noreferrer"
  >
    {{ footerSiteState.beianText }}
  </a>
</p>
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-footer-site.spec.ts --passWithNoTests
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: both pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-ranklist-footer-beian-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record ranklist footer beian parity in the current slice, route status, SRK wrapper status, and latest gate evidence.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-footer-site.ts src/client/components/rankland-ranklist.vue tests/unit/rankland-footer-site.spec.ts tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-ranklist-footer-beian-parity-design.md docs/superpowers/plans/2026-05-26-ranklist-footer-beian-parity.md
git commit -m "feat: 收口榜单页备案 footer 一致性"
```
