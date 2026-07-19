import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createAdapter() {
  const url = new URL(process.env.DATABASE_URL!);
  // connection_limit & pool_timeout biar koneksi gak drop
  url.searchParams.set("connection_limit", "5");
  url.searchParams.set("pool_timeout", "10");
  const adapter = new PrismaPg({ connectionString: url.toString() });
  return adapter;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: createAdapter() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
