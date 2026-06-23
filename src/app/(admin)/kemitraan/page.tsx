import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { KemitraanManager, type PartnershipRow } from "./kemitraan-manager";

export default async function KemitraanPage() {
  await requireRole("ADMIN");

  const partnerships = await prisma.partnership.findMany({
    orderBy: { name: "asc" },
    include: {
      subPartnerships: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });

  const rows: PartnershipRow[] = partnerships.map((p) => ({
    id: p.id,
    name: p.name,
    subPartnerships: p.subPartnerships,
  }));

  return <KemitraanManager partnerships={rows} />;
}
