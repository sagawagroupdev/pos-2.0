# Settings Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite cashier settings with tab layout, component-only markup, auto-save switches.

**Architecture:** The settings form is a single client component wrapping three tab panels. Switches auto-save via `onCheckedChange` → `startTransition` → server action with optimistic UI + rollback. Native elements replaced with project components.

**Tech Stack:** Next.js 16, React 19, Base UI (Tabs, Switch, Button, Input), Tailwind v4.

## Global Constraints

- All native HTML elements (`<button>`, `<input type="time">`) must be replaced with project components (`Button`, `Input`)
- Switch auto-save: optimistic update first, rollback UI on error
- Every `Input` must have a `placeholder` prop
- Every `Card` must have a `CardDescription`
- Responsive: tabs scrollable on mobile, business hours stacked on small screens
- Server action must accept partial FormData for auto-save

---

### Task 1: Update server action for partial auto-save

**Files:**
- Modify: `src/app/(cashier)/settings/actions.ts`

**Interfaces:**
- Consumes: existing `updateSettings` function signature
- Produces: `updateSettings` accepts partial FormData — missing fields fall through to `prisma.update` without overwriting

- [ ] **Step 1: Make settings schema partial**

Make all fields in `settingsSchema` optional so a single-field auto-save works without failing validation:

```typescript
const settingsSchema = z.object({
  taxRate: z.coerce.number().min(0).max(100).optional(),
  taxEnabled: z.boolean().optional(),
  enableDraftOrders: z.boolean().optional(),
  receiptFooter: z.string().trim().optional(),
  printerName: z.string().trim().optional(),
  paperSize: z.string().trim().optional(),
});
```

- [ ] **Step 2: Make `updateSettings` merge parsed data into current**

```typescript
// after safeParse, merge with current:
const current = await getSettings();
const data = {
  ...current,
  ...parsed.data,
  id: undefined, // don't override PK
};
```

Wrap in `z.input` or spread to avoid type issues:

```typescript
await prisma.setting.update({
  where: { id: current.id },
  data: {
    ...(parsed.data.taxRate !== undefined && { taxRate: parsed.data.taxRate }),
    ...(parsed.data.taxEnabled !== undefined && { taxEnabled: parsed.data.taxEnabled }),
    ...(parsed.data.enableDraftOrders !== undefined && { enableDraftOrders: parsed.data.enableDraftOrders }),
    ...(parsed.data.receiptFooter !== undefined && { receiptFooter: parsed.data.receiptFooter || null }),
    ...(parsed.data.printerName !== undefined && { printerName: parsed.data.printerName || null }),
    ...(parsed.data.paperSize !== undefined && { paperSize: parsed.data.paperSize }),
  },
});
```

Also handle file upload fields conditionally (only if present in FormData):

```typescript
const qris = formData.get("qrisImage");
if (qris instanceof File && qris.size > 0) {
  // ... existing upload logic
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit` — expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/\(cashier\)/settings/actions.ts
git commit -m "feat: support partial auto-save in settings action"
```

---

### Task 2: Rewrite settings-form.tsx with Tabs, components, auto-save

**Files:**
- Modify: `src/app/(cashier)/settings/settings-form.tsx`

**Interfaces:**
- Consumes: same props as before (`settings`, `outlet`, `businessHours`)
- Produces: new tab-based UI

- [ ] **Step 1: Add Tabs import and wrap the form**

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

Wrap the return with:

```tsx
<Tabs defaultValue="outlet" className="w-full">
  <TabsList>
    <TabsTrigger value="outlet">Outlet</TabsTrigger>
    <TabsTrigger value="jadwal">Jadwal</TabsTrigger>
    <TabsTrigger value="pengaturan">Pengaturan</TabsTrigger>
  </TabsList>

  <TabsContent value="outlet">{/* outlet form */}</TabsContent>
  <TabsContent value="jadwal">{/* business hours */}</TabsContent>
  <TabsContent value="pengaturan">{/* settings + auto-save */}</TabsContent>
</Tabs>
```

- [ ] **Step 2: Outlet tab — move existing form + add placeholders**

Move existing outlet form inside `<TabsContent value="outlet">`.
Add placeholders to Inputs:
- `Nama Outlet`: `"e.g. Warung Sate Pak Budi"` (required)
- `Alamat`: `"Jl. Merdeka No. 123"`
- `No. Telepon`: `"0812-3456-7890"`

```tsx
<Input
  id="outletName"
  name="outletName"
  defaultValue={outlet.outletName}
  placeholder="e.g. Warung Sate Pak Budi"
  required
/>
```

Card description: "Data outlet Anda. Informasi ini muncul di header struk dan halaman QR order pelanggan."

- [ ] **Step 3: Jadwal tab — replace native elements**

Move business hours inside `<TabsContent value="jadwal">`.
Replace native `<button>` with `Button` from components:

```tsx
import { Button } from "@/components/ui/button";
```

Replace:
```tsx
<button type="button" onClick={() => setDayMode(d, m)}
  className={`cursor-pointer rounded-md px-2.5 py-1 text-xs...`}>
```
With:
```tsx
<Button
  type="button"
  size="sm"
  variant={day.mode === m ? (m === "hours" ? "default" : m === "24h" ? "success" : "destructive") : "secondary"}
  onClick={() => setDayMode(d, m)}
>
  {m === "hours" ? "Buka" : m === "24h" ? "24 Jam" : "Tutup"}
</Button>
```

Replace native `<input type="time">` with:

```tsx
<Input
  type="time"
  value={day.open ?? "08:00"}
  onChange={(e) => setDayTime(d, "open", e.target.value)}
  className="w-24"
/>
```

Card description: "Atur jam buka outlet setiap hari. Pelanggan tidak bisa melakukan QR order di luar jam operasional."

- [ ] **Step 4: Pengaturan tab — settings items in one card**

Move Pajak, Printer, Draft Orders inside `<TabsContent value="pengaturan">`.
Group in one Card with separator between items.

Card description: "Konfigurasi umum untuk sistem POS Anda."

- [ ] **Step 5: Auto-save on switch with optimistic UI + rollback**

Remove the enclosing `<form>` and the "Simpan Pengaturan" button from settings section.
Add auto-save handler:

```tsx
function handleAutoSave(field: string, value: boolean) {
  startTransition(async () => {
    const fd = new FormData();
    fd.set(field, value ? "on" : "off");
    const res = await updateSettings(fd);
    if (!res.ok) {
      // rollback
      if (field === "taxEnabled") setTaxEnabled(!value);
      if (field === "enableDraftOrders") setEnableDraftOrders(!value);
      toast.error(res.error);
    } else {
      toast.success(value ? "Pajak diaktifkan" : "Pajak dinonaktifkan");
    }
  });
}
```

Switch usage:

```tsx
<Switch
  name="taxEnabled"
  checked={taxEnabled}
  onCheckedChange={(checked) => {
    setTaxEnabled(checked);
    handleAutoSave("taxEnabled", checked);
  }}
/>
```

Pesan toast disesuaikan per field (pajak vs draft orders).

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit` — expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/app/\(cashier\)/settings/settings-form.tsx
git commit -m "feat: redesign settings with tabs, components, auto-save switches"
```
