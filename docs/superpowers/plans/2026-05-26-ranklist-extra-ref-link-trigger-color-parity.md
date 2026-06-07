# Ranklist Extra Ref Link Trigger Color Parity Plan

## Slice

Restore old React color behavior for the `and N more` hidden ref-link dropdown trigger in the shared RankLand ranklist header.

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Add: `docs/superpowers/specs/2026-05-26-ranklist-extra-ref-link-trigger-color-parity-design.md`
- Add: `docs/superpowers/plans/2026-05-26-ranklist-extra-ref-link-trigger-color-parity.md`

## Tasks

- [x] Compare old React hidden ref-link trigger with current Vue wrapper.
- [x] Write this spec and plan.
- [x] Add RED full-chain assertion for inherited extra ref-link trigger color.
- [x] Run focused ranklist full-chain test and confirm the expected color mismatch.
- [x] Remove the hard-coded blue trigger color in `rankland-ranklist.vue`.
- [x] Run focused ranklist full-chain test and confirm GREEN.
- [x] Run the ranklist full-chain spec.
- [x] Update migration docs with this verified parity slice.
- [x] Run final gates:

```bash
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

- [ ] Commit:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-26-ranklist-extra-ref-link-trigger-color-parity-design.md docs/superpowers/plans/2026-05-26-ranklist-extra-ref-link-trigger-color-parity.md
git commit -m "fix: 还原隐藏相关链接触发器颜色"
```
