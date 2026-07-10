export type BusinessHours = Record<
  string,
  { mode: "hours" | "24h" | "closed"; open?: string; close?: string }
>;

export function getDefaultBusinessHours(): BusinessHours {
  return Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [String(i + 1), { mode: "24h" as const }])
  );
}

export function isOpenNow(hours: BusinessHours): { open: boolean; message?: string } {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const today = hours[String(day)] ?? { mode: "24h" };

  if (today.mode === "closed") {
    return { open: false, message: "Outlet tutup hari ini" };
  }
  if (today.mode === "24h") {
    return { open: true };
  }

  if (!today.open || !today.close) {
    return { open: false, message: "Jam operasional belum diatur" };
  }

  const [oh, om] = today.open.split(":").map(Number);
  const [ch, cm] = today.close.split(":").map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (closeMinutes <= openMinutes) {
    const isOpen = nowMinutes >= openMinutes || nowMinutes < closeMinutes;
    if (!isOpen) {
      return {
        open: false,
        message: `Outlet tutup. Jam operasional hari ini: ${today.open} - ${today.close}`,
      };
    }
    return { open: true };
  }

  if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
    return { open: true };
  }

  return {
    open: false,
    message: `Outlet tutup. Jam operasional hari ini: ${today.open} - ${today.close}`,
  };
}
