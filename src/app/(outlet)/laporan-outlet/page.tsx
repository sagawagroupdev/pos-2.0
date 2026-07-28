import { requireRole } from "@/lib/session";
import { getOutletReportData } from "@/lib/reports";
import { prisma } from "@/lib/db";
import { dateStrInTz } from "@/lib/format";
import { LaporanOutletView } from "./laporan-view";

function wibDayStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+07:00`);
}
function wibDayEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999+07:00`);
}

export default async function LaporanPage() {
  const session = await requireRole("OUTLET");
  const userId = session.user.id;

  // Default: bulan ini
  const todayWib = dateStrInTz(new Date());
  const defaultFrom = `${todayWib.slice(0, 7)}-01`;
  const defaultTo = todayWib;

  const [reportData, outletUser] = await Promise.all([
    getOutletReportData(userId, wibDayStart(defaultFrom), wibDayEnd(defaultTo)),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true,
        outletAddress: true,
        outletPhone: true,
        outletLogo: true,
        outletPic: true,
        partnership: { select: { logo: true } },
        subPartnership: { select: { logo: true } },
      },
    }),
  ]);

  const outletInfo = {
    name: outletUser.name,
    address: outletUser.outletAddress,
    phone: outletUser.outletPhone,
    logo:
      outletUser.outletLogo ??
      outletUser.subPartnership?.logo ??
      outletUser.partnership?.logo ??
      null,
    pic: outletUser.outletPic,
  };

  return (
    <LaporanOutletView
      initialData={reportData}
      outletInfo={outletInfo}
      defaultFrom={defaultFrom}
      defaultTo={defaultTo}
    />
  );
}
