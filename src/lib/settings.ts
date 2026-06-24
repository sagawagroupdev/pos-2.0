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

export async function getSettings(): Promise<StoreSettings> {
  const existing = await prisma.setting.findFirst();
  if (existing) return existing;
  return prisma.setting.create({ data: { id: SETTINGS_ID } });
}
