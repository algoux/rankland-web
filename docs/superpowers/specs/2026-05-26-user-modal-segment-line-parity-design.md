# User Modal Segment Line Parity Design

## Context

The old React `UserInfoModal` renders the matched segment line with Tailwind-like utility spacing:

```tsx
<p className="mt-4 mb-0">
  所在奖区（{matchedMainSeries.title}）：
  <span className={`user-modal-segment-label bg-segment-${matchedSeriesSegment.style}`}>
    {matchedSeriesSegment.title}
  </span>
</p>
```

That maps to a 16px top margin and a zero bottom margin. The migrated Vue modal already restores the segment label text, class, color, and padding, but the line itself currently combines `.rankland-user-modal-line` with `.rankland-user-modal-segment`:

```less
.rankland-user-modal-line {
  margin: 4px 0;
}

.rankland-user-modal-segment {
  margin-top: 16px;
}
```

This leaves the correct 16px top margin but keeps the inherited 4px bottom margin from the shared line style.

## Decision

Restore old `mt-4 mb-0` behavior by setting the segment line shorthand margin to `16px 0 0`. Keep the segment label styles unchanged and keep the shared `.rankland-user-modal-line` default for unrelated modal lines.

## Scope

In scope:

- The `所在奖区` line inside the shared SRK user modal in `src/client/components/rankland-ranklist.vue`.
- Full-chain `/ranklist/:id` coverage using the existing `Team Alpha` fixture.
- Migration dashboard updates.

Out of scope:

- Segment label color/padding/class behavior, already covered by the previous segment-label slice.
- Organization line, unofficial line, team members, marker labels, photo, slogan, and rank-time chart behavior.
- Low-level SRK table pixel parity.

## Test Strategy

Add full-chain Playwright coverage to the existing ranklist user modal assertions:

1. Open `/ranklist/test-key?focus=yes`.
2. Click `Team Alpha`.
3. Assert the segment line text contains `所在奖区（Rank）：`.
4. Assert computed `marginTop` is `16px` and `marginBottom` is `0px`.
5. Keep the existing segment label text and class assertions.

The RED failure should show the current migrated Vue line still has `marginBottom: 4px`.

## Acceptance Criteria

- The segment line preserves old `mt-4 mb-0` spacing: `margin-top: 16px`, `margin-bottom: 0px`.
- Existing segment label text and `bg-segment-*` class assertions stay green.
- Required gates pass: `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
- `docs/migration/status.md` records user modal segment-line spacing parity.
