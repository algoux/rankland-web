# User Modal Dark Text Color Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React dark-theme inherited text color for the shared SRK user info modal body.

**Architecture:** The existing theme variables in `src/client/index.less` already expose old Ant Design light/dark text colors. The shared Vue ranklist wrapper should use that variable for user modal body text instead of a hard-coded light-only slate color, with full-chain coverage on the dark `/ranklist/:id` path.

**Tech Stack:** Vue 3, ant-design-vue, Playwright full-chain tests, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Add: `docs/superpowers/specs/2026-05-26-user-modal-dark-text-color-parity-design.md`
- Add: `docs/superpowers/plans/2026-05-26-user-modal-dark-text-color-parity.md`

## Tasks

- [x] Compare old React user modal body styling, old Ant Design modal/body text colors, and current Vue hard-coded modal body color.
- [x] Write this spec and plan.
- [x] Add RED full-chain assertion for dark user modal body text color in `tests/e2e/full-chain/ranklist.spec.ts`.
- [x] Run focused dark ranklist full-chain test and confirm the expected `rgb(31, 41, 55)` mismatch.
- [x] Point `.rankland-user-modal-body` to `var(--rankland-legacy-text-color)`.
- [x] Run focused dark ranklist full-chain test and confirm GREEN.
- [x] Run the full ranklist full-chain spec.
- [x] Stabilize the existing filter reload full-chain path by waiting for SSR hydration before clicking post-reload controls.
- [x] Update migration docs with this verified parity slice.
- [x] Run final gates:

```bash
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

- [x] Commit:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-26-user-modal-dark-text-color-parity-design.md docs/superpowers/plans/2026-05-26-user-modal-dark-text-color-parity.md
git commit -m "fix: 还原用户弹窗暗色文字颜色"
```
