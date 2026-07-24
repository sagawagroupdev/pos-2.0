import { prisma } from "@/lib/db";

const SETTINGS_ID = "default";

export type StoreSettings = {
  id: string;
  storeName: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  taxRate: number;
  taxEnabled: boolean;
  enableDraftOrders: boolean;
  qrisImageUrl: string | null;
  receiptFooter: string | null;
  printerName: string | null;
  paperSize: string | null;
};

export type CashierOutlet = {
  outletName: string;
  outletAddress: string | null;
  outletPhone: string | null;
  outletLogo: string | null;
};

export type BusinessHours = Record<
  string,
  { mode: "hours" | "24h" | "closed"; open?: string; close?: string }
>;

export function getDefaultBusinessHours(): BusinessHours {
  return Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [String(i + 1), { mode: "24h" as const }])
  );
}

export async function getBusinessHours(userId: string): Promise<BusinessHours> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessHours: true },
  });
  if (!user?.businessHours) return getDefaultBusinessHours();
  try {
    return JSON.parse(user.businessHours) as BusinessHours;
  } catch {
    return getDefaultBusinessHours();
  }
}

export function isOpenNow(hours: BusinessHours): { open: boolean; message?: string } {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon..7=Sun
  const today = hours[String(day)] ?? { mode: "24h" };

  if (today.mode === "closed") {
    return { open: false, message: "Outlet tutup hari ini" };
  }
  if (today.mode === "24h") {
    return { open: true };
  }
  // hours mode
  if (!today.open || !today.close) {
    return { open: false, message: "Jam operasional belum diatur" };
  }
  const [oh, om] = today.open.split(":").map(Number);
  const [ch, cm] = today.close.split(":").map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (closeMinutes <= openMinutes) {
    //跨越 tengah malam (misal 22:00 - 04:00)
    const isOpen = nowMinutes >= openMinutes || nowMinutes < closeMinutes;
    if (!isOpen) {
      return { open: false, message: `Outlet tutup. Jam operasional hari ini: ${today.open} - ${today.close}` };
    }
    return { open: true };
  }

  if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
    return { open: true };
  }
  return { open: false, message: `Outlet tutup. Jam operasional hari ini: ${today.open} - ${today.close}` };
}

export async function getCashierOutlet(userId: string): Promise<CashierOutlet> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      outletAddress: true,
      outletPhone: true,
      outletLogo: true,
      partnership: { select: { logo: true } },
      subPartnership: { select: { logo: true } },
    },
  });
  return {
    outletName: user.name,
    outletAddress: user.outletAddress,
    outletPhone: user.outletPhone,
    outletLogo: user.outletLogo ?? user.subPartnership?.logo ?? user.partnership?.logo ?? null,
  };
}

export async function getSettings(): Promise<StoreSettings> {
  const existing = await prisma.setting.findFirst();
  if (existing) return existing;
  return prisma.setting.create({ data: { id: SETTINGS_ID } });
}
