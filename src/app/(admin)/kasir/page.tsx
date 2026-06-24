import { prisma } from "@/lib/db";
import {
  CashierManager,
  type CashierRow,
  type PartnershipOption,
} from "./cashier-manager";

export default async function KasirPage() {
  const [cashiers, partnerships] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CASHIER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        banned: true,
        createdAt: true,
        partnership: { select: { name: true } },
        subPartnership: {
          select: {
            name: true,
            partnership: { select: { name: true } },
          },
        },
      },
    }),
    prisma.partnership.findMany({
      orderBy: { name: "asc" },
      include: {
        subPartnerships: {
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  const rows: CashierRow[] = cashiers.map((c) => ({
    id: c.id,
    username: c.username,
    banned: c.banned,
    createdAt: c.createdAt.toISOString(),
    partnershipName:
      c.partnership?.name ?? c.subPartnership?.partnership.name ?? null,
    subPartnershipName: c.subPartnership?.name ?? null,
  }));

  const partnershipOptions: PartnershipOption[] = partnerships.map((p) => ({
    id: p.id,
    name: p.name,
    subPartnerships: p.subPartnerships,
  }));

  return <CashierManager cashiers={rows} partnerships={partnershipOptions} />;
}
