"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { BusinessHours } from "@/lib/business-hours";

const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function OutletInfo({
  storeName,
  outletName,
  outletPhone,
  outletAddress,
  outletLogo,
  businessHours,
  tableId,
}: {
  storeName: string;
  outletName: string;
  outletPhone: string | null;
  outletAddress: string | null;
  outletLogo: string | null;
  businessHours: BusinessHours;
  tableId: string;
}) {
  const router = useRouter();
  const todayIndex = new Date().getDay() || 7; // 1=Mon..7=Sun

  function formatHours(day: string) {
    const d = businessHours[day];
    if (!d || d.mode === "closed") return "Tutup";
    if (d.mode === "24h") return "00:00 - 23:59";
    return d.open && d.close ? `${d.open} - ${d.close}` : "";
  }

  const logoInitial = outletName?.charAt(0)?.toUpperCase() ?? "O";

  return (
    <div className="min-h-dvh overflow-x-hidden pb-8">
      {/* Banner — full bleed */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src="/assets/img/bg-header.webp"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        <button
          onClick={() => router.push(`/order/${tableId}`)}
          className="absolute left-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Outlet identity card — with overlapping logo */}
      <div className="relative -mt-16 px-4">
        <div className="relative rounded-xl bg-white shadow-lg shadow-black/15">
          {/* Logo circle — overlap 60% ke atas */}
          <div className="flex justify-center">
            <div className="absolute -top-10 z-10">
              {outletLogo ? (
                <Image
                  src={outletLogo}
                  alt={outletName}
                  width={80}
                  height={80}
                  className="size-20 rounded-full border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full border-4 border-white bg-primary text-2xl font-bold text-primary-foreground shadow-md">
                  {logoInitial}
                </div>
              )}
            </div>
          </div>

          {/* Info content */}
          <div className="px-5 pb-5 pt-14 text-center">
            <h1 className="text-lg font-bold text-foreground">{outletName || storeName}</h1>

            {outletPhone && (
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                {outletPhone}
              </p>
            )}

            {outletAddress && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {outletAddress}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-6" />

      {/* Operational hours section */}
      <div className="px-4">
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <span className="text-sm font-semibold">Jam Operasional Kami</span>
          </div>
          <div className="divide-y">
            {Array.from({ length: 7 }, (_, i) => {
              const dayNum = i + 1;
              const isToday = dayNum === todayIndex;
              return (
                <div
                  key={dayNum}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    isToday ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span className={`text-sm ${isToday ? "font-semibold" : ""}`}>
                    {dayNames[i]}
                  </span>
                  <span className="text-sm">{formatHours(String(dayNum))}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Powered by */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Powered by Sagawa POS
      </p>
    </div>
  );
}
