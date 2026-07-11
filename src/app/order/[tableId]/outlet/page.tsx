import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { OutletInfo } from "./outlet-info";
import { getDefaultBusinessHours } from "@/lib/business-hours";
import type { BusinessHours } from "@/lib/business-hours";

export default async function OutletPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: {
      cashier: {
        select: {
          name: true,
          outletAddress: true,
          outletPhone: true,
          outletLogo: true,
          businessHours: true,
        },
      },
    },
  });
  if (!table) notFound();

  const cashier = table.cashier;
  let parsedHours: BusinessHours = getDefaultBusinessHours();
  if (cashier?.businessHours) {
    try {
      parsedHours = JSON.parse(cashier.businessHours) as BusinessHours;
    } catch {
      // fallback to default
    }
  }

  return (
    <OutletInfo
      tableId={tableId}
      storeName={cashier?.name ?? "Toko Saya"}
      outletName={cashier?.name ?? "Toko Saya"}
      outletPhone={cashier?.outletPhone ?? null}
      outletAddress={cashier?.outletAddress ?? null}
      outletLogo={cashier?.outletLogo ?? null}
      businessHours={parsedHours}
    />
  );
}
