"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ViewIcon,
  ViewOffIcon,
  CashierIcon,
  QrCodeIcon,
  FileChartColumnIncreasingIcon,
  Mail02Icon,
  LockPasswordIcon,
} from "@hugeicons/core-free-icons";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang")
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .max(100, "Password terlalu panjang"),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message ?? "Input tidak valid";
      toast.error(errorMessage);
      return;
    }

    const { email: sanitizedEmail, password: sanitizedPassword } = result.data;

    setLoading(true);
    const { error } = await signIn.email({
      email: sanitizedEmail,
      password: sanitizedPassword,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? "Email atau password salah");
      return;
    }

    toast.success("Berhasil masuk");
    const redirect = searchParams.get("redirect");
    router.push(redirect ?? "/overview");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <HugeiconsIcon icon={Mail02Icon} size={18} color="currentColor" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="nama@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="h-10 pl-10 text-sm"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <HugeiconsIcon icon={LockPasswordIcon} size={18} color="currentColor" />
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="h-10 pl-10 pr-10 text-sm font-mono"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <HugeiconsIcon
              icon={showPassword ? ViewOffIcon : ViewIcon}
              size={18}
              color="currentColor"
            />
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full h-10 text-sm font-semibold" loading={loading}>
        Masuk ke Dashboard
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left Side: Brand Panel (Visible on md+) */}
      <div className="relative hidden w-1/2 bg-zinc-50 border-r border-zinc-200/80 p-10 text-zinc-900 md:flex lg:w-3/5 overflow-hidden">
        {/* Grid Background Pattern (Light Mode) */}
        <svg
          className="absolute inset-0 z-0 h-full w-full stroke-zinc-300/50 mask-[radial-gradient(100%_100%_at_top_right,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="grid-light"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
              x="-1"
              y="-1"
            >
              <path d="M.5 40V.5H40" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-light)" />
        </svg>

        {/* Content Container */}
        <div className="relative z-10 flex h-full w-full flex-col justify-between">
          {/* Top: Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 p-2 ring-1 ring-primary/20">
              <Image
                src="/assets/img/pos-sgw.svg"
                alt="Sagawa Icon"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">Sagawa POS</span>
          </div>

          {/* Middle: Value Proposition */}
          <div className="my-auto max-w-lg space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 lg:text-5xl">
                Sistem Kasir & QR Table Ordering
              </h1>
              <p className="text-zinc-600 text-base lg:text-lg">
                Kelola transaksi outlet, menu, meja, dan pantau laporan penjualan secara real-time dalam satu dashboard terintegrasi.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-zinc-200 shadow-xs">
                  <HugeiconsIcon icon={CashierIcon} size={18} color="currentColor" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-800">Point of Sale (POS)</h3>
                  <p className="text-sm text-zinc-500">Transaksi kasir cepat, cetak struk thermal, dan kelola pembayaran.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-zinc-200 shadow-xs">
                  <HugeiconsIcon icon={QrCodeIcon} size={18} color="currentColor" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-800">QR Table Ordering</h3>
                  <p className="text-sm text-zinc-500">Pelanggan pesan langsung dari meja lewat scan QR Code unik.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-zinc-200 shadow-xs">
                  <HugeiconsIcon icon={FileChartColumnIncreasingIcon} size={18} color="currentColor" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-800">Laporan Real-time</h3>
                  <p className="text-sm text-zinc-500">Pantau omset harian, produk terlaris, dan performa outlet kapan saja.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Footer */}
          <div className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} Sagawa POS. Hak Cipta Dilindungi.
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex w-full flex-col justify-between p-6 md:w-1/2 md:p-10 lg:w-2/5">
        {/* Top: Mobile Logo (Hidden on md+) */}
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/img/pos-sgw.svg"
              alt="Sagawa Icon"
              width={28}
              height={28}
            />
            <span className="font-bold tracking-tight">Sagawa POS</span>
          </div>
        </div>

        {/* Middle: Form Container */}
        <div className="mx-auto my-auto w-full max-w-md space-y-8 py-12">
          <div className="space-y-2">
            <div className="flex justify-center md:justify-start">
              <Image
                src="/assets/img/sagawa_logo.svg"
                alt="Sagawa Logo"
                width={140}
                height={56}
                className="h-12 w-auto object-contain"
              />
            </div>
            <h2 className="text-2xl lg:text-left text-center font-bold tracking-tight text-foreground">
              Login
            </h2>
            <p className="lg:text-left text-center text-sm text-muted-foreground">
              Masukkan email dan password Anda untuk mengakses dashboard outlet.
            </p>
          </div>

          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-muted" />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Bottom: Mobile Footer (Hidden on md+) */}
        <div className="text-center text-xs text-muted-foreground md:hidden">
          &copy; {new Date().getFullYear()} Sagawa POS.
        </div>
      </div>
    </div>
  );
}
