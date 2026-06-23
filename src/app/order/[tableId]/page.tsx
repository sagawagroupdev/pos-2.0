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

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) notFound();

  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);

  return (
    <CustomerOrder
      tableId={table.id}
      tableNumber={table.number}
      menu={menu}
      storeName={settings.storeName}
      taxRate={settings.taxRate}
      taxEnabled={settings.taxEnabled}
      qrisImageUrl={settings.qrisImageUrl}
    />
  );
}
