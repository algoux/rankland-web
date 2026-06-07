# User Modal Team Members Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React team-member row presentation in the Vue RankLand user modal.

**Architecture:** Keep the behavior inside `RanklandRanklist`, where user modal team members are already computed. Use the existing Team Alpha modal full-chain path and fixture-backed member data to verify the row and separator styling.

**Tech Stack:** Vue 3 SFC scoped Less, SRK fixture JSON, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/fixtures/ranklist.srk.json`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add Team Alpha team members**

Add to Team Alpha's user object:

```json
"teamMembers": [
  { "name": "Alice" },
  { "name": "Bob" }
]
```

- [x] **Step 2: Add user modal team-member assertions**

After opening Team Alpha's user modal and before marker assertions, add:

```ts
const teamMembers = userModal.locator('[data-id="rankland-user-modal-team-members"]');
await expect(teamMembers.locator('[data-id="rankland-user-modal-team-member"]')).toContainText(['Alice', 'Bob']);
await expect(teamMembers.locator('[data-id="rankland-user-modal-team-separator"]')).toHaveText('/');
const teamMemberStyle = await teamMembers.evaluate((element) => {
  const style = window.getComputedStyle(element);
  return {
    display: style.display,
    opacity: style.opacity,
    paddingTop: style.paddingTop,
  };
});
expect(teamMemberStyle).toMatchObject({
  display: 'block',
  opacity: '0.8',
  paddingTop: '6px',
});
const separatorStyle = await teamMembers.locator('[data-id="rankland-user-modal-team-separator"]').evaluate((element) => {
  const style = window.getComputedStyle(element);
  return {
    opacity: style.opacity,
    fontSize: style.fontSize,
  };
});
expect(separatorStyle).toMatchObject({
  opacity: '0.5',
  fontSize: '12.8px',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fails because `rankland-user-modal-team-members` is absent and the row still uses flex/gap styling.

### Task 2: Implement Vue Team-Member Styling

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add stable selectors and old class names**

Update the team-member template:

```vue
<div
  v-if="activeUserTeamMembers.length > 0"
  data-id="rankland-user-modal-team-members"
  class="rankland-user-modal-team-members user-modal-info-team-members"
>
  <template v-for="(member, memberIndex) in activeUserTeamMembers" :key="memberIndex">
    <span v-if="memberIndex > 0" data-id="rankland-user-modal-team-separator" class="rankland-user-modal-team-separator user-modal-info-team-members-slash"> / </span>
    <span data-id="rankland-user-modal-team-member">{{ resolveTextValue(member.name) }}</span>
  </template>
</div>
```

- [x] **Step 2: Restore old row CSS without touching rank-time events**

Update scoped CSS:

```less
.rankland-user-modal-team-members {
  display: block;
  margin-top: 8px;
  padding-top: 6px;
  opacity: 0.8;
}

.rankland-user-modal-team-separator {
  color: inherit;
  font-size: 80%;
  opacity: 0.5;
}
```

Keep `.rankland-rank-time-events` on its existing flex/gap layout.

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-user-modal-team-members-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record user modal team-member parity in `/ranklist/:id` coverage, SRK wrapper infrastructure status, deferred product decisions, known risks, and current focus.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/fixtures/ranklist.srk.json tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-user-modal-team-members-parity-design.md docs/superpowers/plans/2026-05-26-user-modal-team-members-parity.md
git commit -m "feat: 收口用户弹窗队员行一致性"
```
