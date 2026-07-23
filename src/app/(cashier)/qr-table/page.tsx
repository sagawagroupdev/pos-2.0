import { headers } from "next/headers";
import QRCode from "qrcode";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { QrTableManager, type TableRow } from "./qr-table-manager";

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

export default async function QrTablePage() {
  const session = await requireRole("CASHIER");
  const baseUrl = await getBaseUrl();

  const tables = await prisma.table.findMany({
    where: { cashierId: session.user.id },
    orderBy: { number: "asc" },
  });

  const rows: TableRow[] = await Promise.all(
    tables.map(async (t) => {
      const orderUrl = `${baseUrl}/order/${t.id}`;
      const qrDataUrl = await QRCode.toDataURL(orderUrl, {
        width: 320,
        margin: 1,
      });
      return {
        id: t.id,
        number: t.number,
        name: t.name,
        orderUrl,
        qrDataUrl,
      };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <QrTableManager tables={rows} />
    </div>
  );
}
