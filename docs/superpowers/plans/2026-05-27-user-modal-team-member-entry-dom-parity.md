# User Modal Team Member Entry DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React item-level `span` wrappers around user-modal team members.

**Architecture:** Add a full-chain DOM assertion to the existing ranklist user-modal coverage, then wrap each rendered Vue team member in an outer span while keeping current inner data-id hooks and styles.

**Tech Stack:** Vue 3 SFC, SRK Vue Modal, Playwright full-chain E2E.

---

### Task 1: RED - capture team-member entry DOM

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add a DOM helper**

Add this helper near the other DOM helper functions:

```ts
async function getUserModalTeamMemberEntryDom(page: Page) {
  return page.evaluate(() => {
    const row = document.querySelector<HTMLElement>('[data-id="rankland-user-modal-team-members"]');
    if (!row) {
      throw new Error('Missing user modal team members row');
    }

    return Array.from(row.children).map((child) => ({
      tagName: child.tagName,
      dataId: child.getAttribute('data-id') || '',
      text: (child.textContent || '').replace(/\s+/g, ' ').trim(),
      childDataIds: Array.from(child.children).map((grandchild) => grandchild.getAttribute('data-id') || ''),
    }));
  });
}
```

- [x] **Step 2: Assert old per-member wrappers**

After opening `Team Alpha`, add:

```ts
expect(await getUserModalTeamMemberEntryDom(page)).toEqual([
  {
    tagName: 'SPAN',
    dataId: 'rankland-user-modal-team-member-entry',
    text: 'Alice',
    childDataIds: ['rankland-user-modal-team-member'],
  },
  {
    tagName: 'SPAN',
    dataId: 'rankland-user-modal-team-member-entry',
    text: '/ Bob',
    childDataIds: ['rankland-user-modal-team-separator', 'rankland-user-modal-team-member'],
  },
]);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: FAIL because current Vue renders flattened member/separator/member children.

Result: FAIL reproduced the parity gap. The helper reported direct children as `rankland-user-modal-team-member`, `rankland-user-modal-team-separator`, and `rankland-user-modal-team-member` instead of two `rankland-user-modal-team-member-entry` wrappers.

### Task 2: GREEN - restore entry wrappers

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Wrap each team member**

Change the `activeUserTeamMembers` template so each member renders:

```vue
<span
  v-for="(member, memberIndex) in activeUserTeamMembers"
  :key="memberIndex"
  data-id="rankland-user-modal-team-member-entry"
>
  <span
    v-if="memberIndex > 0"
    data-id="rankland-user-modal-team-separator"
    class="rankland-user-modal-team-separator user-modal-info-team-members-slash"
  >
    {{ ' / ' }}
  </span>
  <span data-id="rankland-user-modal-team-member">{{ resolveTextValue(member.name) }}</span>
</span>
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: PASS.

Result: PASS. The focused full-chain ranklist route verified old per-member entry wrappers while preserving existing member text, raw separator text, spacing, and styles.

### Task 3: Full verification, docs, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation succeeds, migration tests pass, and whitespace check passes.

Result: PASS. Full gate used Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, passed build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 59 passed / 1 skipped full-chain tests; `git diff --check` passed.

- [x] **Step 2: Update migration docs**

Record user-modal team-member entry DOM parity in the current focus, route/SRK wrapper coverage, manual checklist, and final integration review.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/superpowers/specs/2026-05-27-user-modal-team-member-entry-dom-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-team-member-entry-dom-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原用户弹窗团队成员项 DOM"
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: commit succeeds on `migration/live-page-foundation`, post-checks pass.
