# SRK Asset Image Error Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `SrkAssetImage` broken-image hiding behavior for SRK contest banners and user photos.

**Architecture:** Add a focused Vue `srk-asset-image.vue` component that hides its `<img>` after native load errors and resets on `src` changes. Replace only the shared SRK wrapper's banner and user-photo `<img>` usages while preserving existing selectors, classes, CSS sizing, and asset URL rewriting.

**Tech Stack:** Vue 3 SFC, Playwright full-chain tests, ant-design-vue modal context, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add broken asset assertions**

Add a focused test near the existing `/ranklist/:id` full-chain route tests:

```ts
  test('hides broken SRK asset images like the legacy SrkAssetImage component', async ({ page, request }) => {
    await request.post(`${mockBaseURL}/__reset`);
    await page.route('**/srk-assets/test-key/banner.png', async (route) => {
      await route.fulfill({ status: 404, body: 'missing banner' });
    });
    await page.route('**/srk-assets/test-key/team-alpha.png', async (route) => {
      await route.fulfill({ status: 404, body: 'missing photo' });
    });

    const response = await page.goto('/ranklist/test-key?focus=yes');
    expect(response?.status()).toBe(200);

    const banner = page.locator('[data-id="rankland-ranklist-banner"]');
    await expect(banner).toHaveAttribute('src', `${mockBaseURL}/srk-assets/test-key/banner.png`);
    await expect.poll(async () => banner.evaluate((element) => window.getComputedStyle(element).display)).toBe('none');

    await page.locator('[data-srk-user-id="team-alpha"]').click();
    const userModal = page.locator('.rankland-user-modal');
    await expect(userModal).toBeVisible();
    const photo = userModal.locator('[data-id="rankland-user-modal-photo"]');
    await expect(photo).toHaveAttribute('src', `${mockBaseURL}/srk-assets/test-key/team-alpha.png`);
    await expect.poll(async () => photo.evaluate((element) => window.getComputedStyle(element).display)).toBe('none');
  });
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "hides broken SRK asset images"
```

Expected: FAIL because the current plain Vue `<img>` elements keep their normal computed display after `error`.

### Task 2: Restore Asset Image Error Behavior

**Files:**
- Create: `src/client/components/srk-asset-image.vue`
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add Vue asset image component**

Create `src/client/components/srk-asset-image.vue`:

```vue
<template>
  <img
    ref="image"
    :data-id="dataId"
    :src="src"
    :alt="alt"
    :class="imgClass"
    :style="imageStyle"
    @error="handleError"
  >
</template>

<script lang="ts">
import { defineComponent, nextTick, type PropType } from 'vue';

export default defineComponent({
  name: 'SrkAssetImage',
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: '',
    },
    dataId: {
      type: String,
      default: '',
    },
    imgClass: {
      type: [String, Array, Object] as PropType<string | string[] | Record<string, boolean>>,
      default: '',
    },
  },
  data() {
    return {
      hidden: false,
    };
  },
  computed: {
    imageStyle(): Record<string, string> {
      return this.hidden ? { display: 'none' } : {};
    },
  },
  watch: {
    src() {
      this.hidden = false;
      void nextTick(() => {
        this.hideIfBroken();
      });
    },
  },
  mounted() {
    this.hideIfBroken();
  },
  methods: {
    handleError() {
      this.hidden = true;
    },
    hideIfBroken() {
      const image = this.$refs.image as HTMLImageElement | undefined;
      if (image?.complete && image.naturalWidth === 0) {
        this.hidden = true;
      }
    },
  },
});
</script>
```

- [x] **Step 2: Use component for banner and user photo**

In `src/client/components/rankland-ranklist.vue`, import and register `SrkAssetImage`, then replace the banner and photo `<img>` elements:

```vue
<SrkAssetImage
  data-id="rankland-ranklist-banner"
  :src="contestBannerSrc"
  alt="Contest Banner"
  img-class="rankland-ranklist-banner mb-2"
/>
```

```vue
<SrkAssetImage
  v-if="activeUserPhotoSrc"
  data-id="rankland-user-modal-photo"
  :src="activeUserPhotoSrc"
  alt="选手照片"
/>
```

Do not change surrounding wrappers, CSS, selectors, or URL resolution.

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "hides broken SRK asset images"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-srk-asset-image-error-parity.md`

- [x] **Step 1: Update migration docs**

Record SRK asset image error parity in SRK wrapper route/status coverage, manual acceptance checklist, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/srk-asset-image.vue src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-srk-asset-image-error-parity-design.md docs/superpowers/plans/2026-05-27-srk-asset-image-error-parity.md
git commit -m "fix: 隐藏 SRK 资产破图占位"
```
