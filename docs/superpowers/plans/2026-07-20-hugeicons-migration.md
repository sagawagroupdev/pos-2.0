# HugeIcons Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all React icon usage with official free HugeIcons and remove old icon dependencies.

**Architecture:** Use the official renderer/data split: `HugeiconsIcon` from `@hugeicons/react`, icon definitions from `@hugeicons/core-free-icons`. No local wrapper; keep existing component layout and sizing intact.

**Tech Stack:** Next.js 16, React 19, TypeScript, `@hugeicons/react`, `@hugeicons/core-free-icons`, npm.

## Global Constraints

- Use `@hugeicons/react` and `@hugeicons/core-free-icons` only for React icons.
- Remove `iconsax-react` and `lucide-react` after replacement.
- Use `color="currentColor"` for theme-aware icons.
- Use `strokeWidth={1.5}` unless a component needs an existing visual weight preserved.
- Update `CLAUDE.md` icon convention.
- Verify with `npx tsc --noEmit` and `npm run build`.
- No visual redesign, no local icon adapter, no premium package.

---

## File Structure

- Modify `package.json` and `package-lock.json`: replace icon dependencies.
- Modify `CLAUDE.md`: update icon convention.
- Modify all `src/**/*.tsx` imports from `iconsax-react` and `lucide-react`.
- Do not create new source files.

---

### Task 1: Update icon dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: npm package manager.
- Produces: installed packages `@hugeicons/react` and `@hugeicons/core-free-icons`; removed packages `iconsax-react` and `lucide-react`.

- [ ] **Step 1: Install HugeIcons and remove old icon libs**

Run:

```bash
npm install @hugeicons/react @hugeicons/core-free-icons
npm uninstall iconsax-react lucide-react
```

Expected: `package.json` contains HugeIcons packages and no `iconsax-react`/`lucide-react`.

- [ ] **Step 2: Verify package references**

Run:

```bash
npm ls @hugeicons/react @hugeicons/core-free-icons iconsax-react lucide-react
```

Expected: HugeIcons packages are installed. Old icon packages are absent or marked empty.

---

### Task 2: Replace app icon imports and render calls

**Files:**
- Modify: `src/components/dashboard/dashboard-shell.tsx`
- Modify: `src/app/pos/qr-order-sheet.tsx`
- Modify: `src/app/pos/pos-terminal.tsx`
- Modify: `src/app/pos/pos-header.tsx`
- Modify: `src/app/pos/draft-sheet.tsx`
- Modify: `src/app/pos/cart-panel.tsx`
- Modify: `src/app/order/[tableId]/menu-search.tsx`
- Modify: `src/app/order/[tableId]/menu-list.tsx`
- Modify: `src/app/order/[tableId]/customer-order.tsx`
- Modify: `src/app/order/[tableId]/confirm-step.tsx`
- Modify: `src/app/order/[tableId]/checkout-step.tsx`
- Modify: `src/app/order/[tableId]/cart-bar.tsx`
- Modify: `src/app/(admin)/kasir/cashier-manager.tsx`
- Modify: `src/app/(admin)/kasir/_components/cashier-form-fields.tsx`
- Modify: `src/app/(admin)/kemitraan/kemitraan-manager.tsx`
- Modify: `src/app/(admin)/kemitraan/_components/sub-item.tsx`
- Modify: `src/app/(admin)/kemitraan/_components/logo-field.tsx`

**Interfaces:**
- Consumes: `HugeiconsIcon` component and named HugeIcons definitions.
- Produces: app screens with equivalent icon semantics and no old icon imports.

- [ ] **Step 1: Replace imports**

Use this target pattern in each file:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
```

- [ ] **Step 2: Replace JSX icon components**

Convert old direct icon components:

```tsx
<SearchNormal size="16" color="currentColor" />
```

To HugeIcons renderer calls:

```tsx
<HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" strokeWidth={1.5} />
```

Preserve existing `className` props on the new `HugeiconsIcon` call.

- [ ] **Step 3: Type check this task**

Run:

```bash
npx tsc --noEmit
```

Expected: no missing imports, no invalid icon names, no type errors from icon props.

---

### Task 3: Replace shadcn/Base UI lucide imports

**Files:**
- Modify: `src/components/ui/breadcrumb.tsx`
- Modify: `src/components/ui/calendar.tsx`
- Modify: `src/components/ui/combobox.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/dropdown-menu.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/sheet.tsx`

**Interfaces:**
- Consumes: HugeIcons packages from Task 1.
- Produces: UI primitives with no `lucide-react` dependency.

- [ ] **Step 1: Replace lucide imports**

Use semantic equivalents for:

```tsx
ChevronRightIcon
MoreHorizontalIcon
ChevronLeftIcon
CheckIcon
ChevronsUpDownIcon
XIcon
ChevronDownIcon
ChevronUpIcon
```

- [ ] **Step 2: Preserve class-based sizing**

For icon-only class sizing, keep existing class names:

```tsx
<HugeiconsIcon icon={Cancel01Icon} className="size-4" color="currentColor" strokeWidth={1.5} />
```

- [ ] **Step 3: Type check this task**

Run:

```bash
npx tsc --noEmit
```

Expected: UI primitive files compile without lucide imports.

---

### Task 4: Update project convention and final verification

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: completed migration from Tasks 1-3.
- Produces: docs and build verification for future work.

- [ ] **Step 1: Update icon convention**

Replace the Iconsax convention with:

```md
## Ikon
- Pakai **HugeIcons official free**: `@hugeicons/react` + `@hugeicons/core-free-icons`. Render via `HugeiconsIcon` dan selalu set `color="currentColor"` agar ikut warna tema.
```

- [ ] **Step 2: Confirm no old icon imports remain**

Run:

```bash
rg "iconsax-react|lucide-react|react-iconsax" src package.json package-lock.json CLAUDE.md
```

Expected: no matches.

- [ ] **Step 3: Run final checks**

Run:

```bash
npx tsc --noEmit
npm run build
```

Expected: both commands pass.

- [ ] **Step 4: Report browser testing status**

State explicitly whether browser UI was tested. If no login session was used, report: `UI belum dites di browser karena butuh sesi login.`
