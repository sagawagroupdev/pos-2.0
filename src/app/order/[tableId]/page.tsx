import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getMenu } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { CustomerOrder } from "./customer-order";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { cashier: { select: { name: true, outletAddress: true, outletPhone: true, outletLogo: true } } },
  });
  if (!table) notFound();

  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);

  return (
    <CustomerOrder
      tableId={table.id}
      tableNumber={table.number}
      outletAddress={table.cashier?.outletAddress ?? null}
      outletLogo={table.cashier?.outletLogo ?? null}
      menu={menu}
      storeName={table.cashier?.name ?? settings.storeName}
      taxRate={settings.taxRate}
      taxEnabled={settings.taxEnabled}
      qrisImageUrl={settings.qrisImageUrl}
    />
  );
}
