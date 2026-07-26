export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

// ponytail: configurable TZ, default Asia/Jakarta. Change TZ here or pass explicit.
const TZ = "Asia/Jakarta";

/** Format a Date/ISO string to locale string in configured timezone. */
export function formatInTz(
  date: string | Date,
  opts: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    ...opts,
  }).format(typeof date === "string" ? new Date(date) : date);
}

/** Get YYYY-MM-DD date string in configured timezone. */
export function dateStrInTz(date: string | Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date);
}

/** Get today's YYYY-MM-DD string in configured timezone. */
export function todayStrInTz(): string {
  return dateStrInTz(new Date());
}
