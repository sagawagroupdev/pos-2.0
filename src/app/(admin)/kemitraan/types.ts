export type Status = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type SubPartnershipRow = {
  id: string;
  name: string;
  logo: string | null;
  status: Status;
};

export type PartnershipRow = {
  id: string;
  name: string;
  logo: string | null;
  status: Status;
  subPartnerships: SubPartnershipRow[];
};

export const statusLabel: Record<Status, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  SUSPENDED: "Ditangguhkan",
};

export const statusVariant: Record<Status, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};
