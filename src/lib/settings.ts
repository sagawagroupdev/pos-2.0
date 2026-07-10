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

export async function getCashierOutlet(userId: string): Promise<CashierOutlet> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, outletAddress: true, outletPhone: true, outletLogo: true },
  });
  return {
    outletName: user.name,
    outletAddress: user.outletAddress,
    outletPhone: user.outletPhone,
    outletLogo: user.outletLogo,
  };
}

export async function getSettings(): Promise<StoreSettings> {
  const existing = await prisma.setting.findFirst();
  if (existing) return existing;
  return prisma.setting.create({ data: { id: SETTINGS_ID } });
}
