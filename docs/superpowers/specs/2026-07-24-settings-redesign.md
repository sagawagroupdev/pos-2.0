# Settings Dashboard Redesign — Cashier

**Date:** 2026-07-24
**Status:** Draft
**Scope:** Cashier settings page (`(cashier)/settings/`)

## Motivation

The current settings page is a single scroll of cards with no navigation structure. Switches require a manual "Simpan" button, native HTML elements are used in place of project components, placeholders are missing, and the layout is not responsive.

## Design Overview

Tab-based layout splitting settings into three focused groups. Switches auto-save on toggle. All native elements replaced with project components (`Input`, `Button`, `Switch`, `Tabs`, `Card`). Every Input gets a placeholder; every Card gets a description.

## Architecture

### Component Tree

```
SettingsPage (server — fetch data)
└── SettingsForm (client — interactivity)
    ├── <Tabs>
    │   ├── Tab: Outlet
    │   │   └── <Card> — form outlet (manual save, ada logo upload)
    │   ├── Tab: Jadwal
    │   │   └── <Card> — 7-day business hours (manual save)
    │   └── Tab: Pengaturan
    │       └── <Card> — 3 settings items (auto-save switches)
    └── <Tabs>
```

### File Changes

| File | Action |
|------|--------|
| `(cashier)/settings/settings-form.tsx` | **Rewrite** — tab layout, component-only, auto-save switches |
| `(cashier)/settings/actions.ts` | **Minor updates** — add individual toggle actions for switches |
| `(cashier)/settings/page.tsx` | **No change** — server component stays the same |

## Detailed Design

### 1. Tab Structure (Outlet | Jadwal | Pengaturan)

Menggunakan komponen `Tabs` existing dari `@/components/ui/tabs`.
- Tab aktif: `line` variant dengan underline
- Desktop: horizontal tabs, rata kiri
- Mobile: scrollable horizontal tabs

### 2. Tab "Outlet"

Fields:

| Field | Type | Placeholder | Notes |
|-------|------|-------------|-------|
| Nama Outlet | `Input` | `"e.g. Warung Sate Pak Budi"` | required |
| Alamat | `Input` | `"Jl. Merdeka No. 123"` | |
| No. Telepon | `Input` | `"0812-3456-7890"` | |
| Logo | `Input type="file"` | — | image preview |

- Action: tombol **Simpan Perubahan** (manual submit — karena ada file upload)
- Card title: "Informasi Outlet"
- Card description: *"Data outlet Anda. Informasi ini muncul di header struk dan halaman QR order pelanggan."*

### 3. Tab "Jadwal"

- Card title: "Jam Operasional"
- Card description: *"Atur jam buka outlet setiap hari. Pelanggan tidak bisa melakukan QR order di luar jam operasional."*

7 rows, each:

| Element | Component | Notes |
|---------|-----------|-------|
| Day name | `<span>` | "Senin" — "Minggu" |
| Mode buttons | `Button` (3 tombol) | Buka / 24 Jam / Tutup |
| Time inputs | `Input type="time"` | Muncul hanya jika mode "Buka" |

Style: satu baris per hari, `flex-wrap` untuk responsive. Di mobile, day name di atas, controls di bawah.

- Action: tombol **Simpan Jadwal** (manual submit — karena multiple fields)
- Mode button active state: Buka = `bg-primary`, 24 Jam = `bg-emerald-500`, Tutup = `bg-destructive`

### 4. Tab "Pengaturan"

- Card title: "Pengaturan Umum"
- Card description: *"Konfigurasi umum untuk sistem POS Anda."*

Tiga setting items dalam satu card, dipisah dengan `border-b` separator:

| Setting | Control | Auto-save | Description |
|---------|---------|-----------|-------------|
| Pajak PB1 10% | `Switch` | ✅ | "Terapkan pajak PB1 10% ke setiap transaksi" |
| Printer Thermal | `BlePrinterStatus` | — | (existing component, tidak berubah) |
| Pesanan Draft | `Switch` | ✅ | "Izinkan kasir menahan pesanan untuk diselesaikan nanti" |

### 5. Auto-save Switch Pattern

Switch `onCheckedChange` langsung trigger server action tanpa tombol:

```tsx
<Switch
  checked={taxEnabled}
  onCheckedChange={(checked) => {
    setTaxEnabled(checked);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taxEnabled", checked ? "on" : "off");
      const res = await updateSettings(fd);
      if (res.ok) {
        toast.success(checked ? "Pajak diaktifkan" : "Pajak dinonaktifkan");
        router.refresh();
      } else {
        // rollback UI
        setTaxEnabled(!checked);
        toast.error(res.error);
      }
    });
  }}
/>
```

Poin penting:
- `startTransition` agar UI tidak blocking
- `toast.success` dengan pesan spesifik (bukan generic "disimpan")
- **Rollback** jika gagal — switch dikembalikan ke state sebelumnya
- Server action existing (`updateSettings`) diupdate untuk handle single-field submit

### 6. Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| ≥ 768px | Tabs horizontal, content dalam 1 kolom |
| < 768px | Tabs scrollable (overflow-x auto), setiap hari di Jadwal jadi stacked |
| < 480px | Padding card dikurangi `p-4` → `p-3` |

### 7. Error Handling

- **Auto-save switch gagal:** UI rollback + toast error + pesan spesifik
- **Form outlet gagal:** toast error dari server action, field tetap terisi
- **Business hours gagal:** toast error dari server action
- **Loading state:** Switch auto-save pake `useTransition` (disabled visual via opacity)
- **Optimistic update:** Switch auto-save set UI dulu, rollback jika error

## Actions Updates

Di `actions.ts` perlu tambahan:
1. `updateTaxSetting(formData)` — khusus toggle pajak (opsional, bisa pakai `updateSettings` yang sudah ada)
2. `updateDraftOrdersSetting(formData)` — khusus toggle draft orders

Atau cukup pakai `updateSettings` existing yang sudah handle single field — yg penting auto-save di client dan server action bisa terima partial data.

## Open Questions / TBD

- none

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/app/(cashier)/settings/settings-form.tsx` | Full rewrite — tab layout, component-only, auto-save |
| `src/app/(cashier)/settings/actions.ts` | Minor: ensure single-field submit works |

## Implementation Plan

1. Rewrite `settings-form.tsx` with Tabs wrapper, move each section into its own Tab
2. Replace all native `<button>` and `<input type="time">` with project components
3. Implement auto-save on Switch `onCheckedChange` with optimistic update + rollback
4. Add placeholders to all Input fields
5. Adjust layout for responsive breakpoints
6. Verify with `npx tsc --noEmit && npm run build`
