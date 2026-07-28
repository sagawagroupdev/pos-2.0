"use server";

import { requireRole } from "@/lib/session";
import {
  getOutletReportData,
  type OutletReportData,
} from "@/lib/reports";

function wibDayStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+07:00`);
}
function wibDayEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999+07:00`);
}

export async function loadLaporan(
  from: string,
  to: string,
): Promise<OutletReportData> {
  const session = await requireRole("OUTLET");
  return getOutletReportData(
    session.user.id,
    wibDayStart(from),
    wibDayEnd(to),
  );
}
