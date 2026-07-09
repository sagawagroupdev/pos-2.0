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
        name: true,
        email: true,
        banned: true,
        createdAt: true,
        partnershipId: true,
        subPartnershipId: true,
        outletAddress: true,
        outletPhone: true,
        outletPic: true,
        outletFoundedDate: true,
        partnership: { select: { name: true, logo: true } },
        subPartnership: {
          select: {
            name: true,
            logo: true,
            partnership: { select: { name: true, logo: true } },
          },
        },
      },
    }),
    prisma.partnership.findMany({
      orderBy: { name: "asc" },
      include: {
        subPartnerships: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, logo: true },
        },
      },
    }),
  ]);

  const rows: CashierRow[] = cashiers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    banned: c.banned,
    createdAt: c.createdAt.toISOString(),
    partnershipName:
      c.partnership?.name ?? c.subPartnership?.partnership.name ?? null,
    subPartnershipName: c.subPartnership?.name ?? null,
    partnershipId: c.partnershipId,
    subPartnershipId: c.subPartnershipId,
    partnershipLogo: c.subPartnership?.logo ?? c.partnership?.logo ?? null,
    outletAddress: c.outletAddress,
    outletPhone: c.outletPhone,
    outletPic: c.outletPic,
    outletFoundedDate: c.outletFoundedDate?.toISOString() ?? null,
  }));

  const partnershipOptions: PartnershipOption[] = partnerships.map((p) => ({
    id: p.id,
    name: p.name,
    logo: p.logo,
    subPartnerships: p.subPartnerships,
  }));

  return <CashierManager cashiers={rows} partnerships={partnershipOptions} />;
}
