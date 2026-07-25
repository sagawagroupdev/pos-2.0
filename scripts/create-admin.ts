import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins/username";
import { admin } from "better-auth/plugins/admin";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL kosong");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [
    username(),
    admin({
      defaultRole: "CASHIER",
      adminRoles: ["ADMIN"],
      roles: { ADMIN: adminAc, CASHIER: userAc },
    }),
  ],
});

async function main() {
  const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existing) {
    console.log("Admin sudah ada:", existing.email);
    return;
  }

  await auth.api.createUser({
    body: {
      email: "admin@sagawagroup.id",
      password: "@sagawagroup222!",
      name: "Admin",
      role: "ADMIN",
      data: { username: "administrator" },
    },
  });

  console.log("Admin berhasil dibuat: admin@sagawagroup.id / @sagawagroup222!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
