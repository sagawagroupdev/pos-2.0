@AGENTS.md

# Sagawa POS — Project Conventions

Sistem Kasir POS + QR Table Ordering. Stack: Next.js 16, React 19, Prisma 7 (Neon Postgres), Better Auth, Redis (ioredis), Cloudflare R2, Tailwind v4 + shadcn (Base UI), Pusher.

## Design System
- **Font**: Inter (via `next/font/google` di root layout, variabel `--font-inter` → `--font-sans`).
- **Primary color**: `#FF3131` (≈ `oklch(0.628 0.247 27.3)`) di `--primary`, light & dark, di `globals.css`.

## Next.js 16 gotchas (beda dari versi lama)
- Middleware sekarang **`proxy.ts`** (fungsi `proxy()`), bukan `middleware.ts`. File di `src/proxy.ts`.
- Page/route `params` adalah **Promise** — harus `await`.
- Komponen yang pakai `useSearchParams` wajib dibungkus `<Suspense>` atau build gagal.

## Prisma 7 gotchas
- Generator `prisma-client` (bukan `prisma-client-js`); output ke `src/generated/prisma`. Import dari `@/generated/prisma/client`.
- **`url` TIDAK boleh di datasource** schema — ada di `prisma.config.ts`. Client butuh driver adapter (`@prisma/adapter-pg` + `pg`); lihat `src/lib/db.ts`.
- Script yang dijalankan via `tsx` (mis. `prisma/seed.ts`) **wajib `import "dotenv/config"`** di baris pertama, kalau tidak `DATABASE_URL` kosong → `ECONNREFUSED`.

## Better Auth
- Pakai plugin `username` + `admin`. Login kasir **username + password saja**; `name` & `email` diturunkan dari username (`{username}@sagawa.pos`).
- Admin plugin cek izin **case-sensitive** terhadap `roles[user.role]`. Karena enum kita `ADMIN`/`CASHIER` (uppercase), `auth.ts` mendaftarkan custom `roles: { ADMIN: adminAc, CASHIER: userAc }` — jangan dihapus atau buat-kasir gagal "not allowed to create users".
- Buat user via `auth.api.createUser` (admin plugin), lalu update relasi non-auth (mis. `subPartnershipId`) via Prisma terpisah.

## shadcn = Base UI (bukan Radix)
- Pakai prop **`render={<Comp/>}`**, bukan `asChild`. Berlaku untuk DialogTrigger, BreadcrumbLink, Button, dll.
- `Select onValueChange` memberi `string | null` — handle null-nya.

## Ikon
- Pakai **`iconsax-react`** (bukan `react-iconsax` yang rusak untuk Next.js). Selalu set `color="currentColor"` agar ikut warna tema; default-nya `#000` (tak terlihat di tombol ghost/tema gelap).

## R2 / gambar
- `R2_PUBLIC_URL` = custom domain (`r2.dev` diblokir ISP Indonesia). `next.config.ts` menarik hostname-nya otomatis untuk `next/image`.

## Verifikasi
- Setelah perubahan: `npx tsc --noEmit` lalu `npm run build`. UI tidak bisa di-test otomatis tanpa sesi login — nyatakan eksplisit kalau belum di-test di browser.
