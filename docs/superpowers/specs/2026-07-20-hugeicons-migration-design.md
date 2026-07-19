# HugeIcons Migration Design

Date: 2026-07-20

## Goal

Migrate all React icon usage in the dashboard admin app to the official free HugeIcons packages:

- `@hugeicons/react`
- `@hugeicons/core-free-icons`

Remove the old icon dependencies after the migration:

- `iconsax-react`
- `lucide-react`

## Current State

The app currently uses two icon libraries:

- `iconsax-react` in dashboard, POS, QR order, cashier, and partnership screens.
- `lucide-react` in shadcn/Base UI components and a few app components.

The project convention in `CLAUDE.md` currently points to `iconsax-react`; it must be updated to HugeIcons.

## Recommended Approach

Use a direct full migration.

Replace every `iconsax-react` and `lucide-react` import with HugeIcons imports. Render icons through `HugeiconsIcon` from `@hugeicons/react` and icon definitions from `@hugeicons/core-free-icons`.

Example target pattern:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

<HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" strokeWidth={1.5} />
```

No local icon adapter will be added. The direct pattern is clear enough and avoids unnecessary abstraction.

## Scope

### Package changes

- Install `@hugeicons/react`.
- Install `@hugeicons/core-free-icons`.
- Remove `iconsax-react`.
- Remove `lucide-react`.

### Code changes

- Replace all `iconsax-react` imports in `src`.
- Replace all `lucide-react` imports in `src`.
- Keep icon sizing, color inheritance, and layout behavior equivalent where possible.
- Use `color="currentColor"` on HugeIcons usage so icons follow theme colors.
- Use `strokeWidth={1.5}` unless an icon needs a different visual weight.
- Update `CLAUDE.md` icon convention from Iconsax to HugeIcons.

### Out of scope

- No visual redesign.
- No new wrapper component.
- No premium HugeIcons package.
- No unrelated component refactors.

## Icon Mapping Strategy

Use the closest HugeIcons equivalent by meaning, not by exact old component name.

Examples:

- Search icons -> search icon.
- Trash/delete icons -> delete/trash icon.
- Eye/eye slash -> view/view-off icon.
- Arrows/chevrons -> matching left/right/down/up arrow or chevron icon.
- Shop/menu/cart/printer/calendar/upload icons -> closest semantic HugeIcons equivalent.

If an exact match is unavailable in the free pack, choose the nearest free semantic icon and keep the existing UI size/color classes intact.

## Error Handling

This migration has no runtime data flow. The main failure modes are build-time issues:

- Missing icon export name.
- Prop/type mismatch.
- Unused imports after replacement.

Fix these through TypeScript and build verification.

## Verification

Run after code changes:

```bash
npx tsc --noEmit
npm run build
```

Browser UI testing requires a logged-in session, so it will be reported separately if not performed.

## Approved Direction

The user approved option 1: full direct migration to official free HugeIcons and uninstalling other icon dependencies.
