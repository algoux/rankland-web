# User Modal Team Member Entry DOM Parity Design

## Goal

Restore the old React user-modal team-member entry wrapper DOM in the shared SRK renderer.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders each team member inside an item-level outer `span`:

```tsx
<div className="user-modal-info-team-members mt-2">
  {user.teamMembers!.map((m, mIndex) => (
    <span key={resolveText(m.name)}>
      {mIndex > 0 && <span className="user-modal-info-team-members-slash"> / </span>}
      <span>{resolveText(m.name)}</span>
    </span>
  ))}
</div>
```

The migrated Vue wrapper already restores the container class, spacing, member text, separator class, separator raw text, and separator style. It still flattens the children as member/separator/member spans, leaving a DOM parity gap for old item-level hooks and style inheritance.

## Target Behavior

- The team-members container keeps `[data-id="rankland-user-modal-team-members"]`, `.rankland-user-modal-team-members`, `.user-modal-info-team-members`, and old `mt-2`.
- Each team member is wrapped in an outer `span` with `[data-id="rankland-user-modal-team-member-entry"]`.
- The first entry contains one `[data-id="rankland-user-modal-team-member"]` child.
- Later entries contain the old separator span followed by the member span.
- Existing visible text, separator raw text ` / `, styles, spacing, and data resolution remain unchanged.

## Non-goals

- Do not change team-member ordering, name resolution, separator styling, or container spacing.
- Do not change marker rows, organization lines, photo/slogan wrappers, rank-time chart, or modal root behavior.
- Do not pursue lower-level SRK table pixel parity in this slice.

## Test Strategy

Use the existing `/ranklist/:id` full-chain route because its fixture opens `Team Alpha` with two team members.

Add a DOM helper that reads direct children of `[data-id="rankland-user-modal-team-members"]`. RED should fail because current Vue exposes flattened children instead of old per-member entry wrappers.

## Acceptance Criteria

- Direct children of the team-members container are two `SPAN` entries with data-id `rankland-user-modal-team-member-entry`.
- First entry text is `Alice` and contains only `rankland-user-modal-team-member`.
- Second entry normalized text is `/ Bob` and contains `rankland-user-modal-team-separator` then `rankland-user-modal-team-member`.
- Existing full-chain assertions for member text, separator raw text, classes, spacing, and styles continue to pass.
- Full migration gate passes.
