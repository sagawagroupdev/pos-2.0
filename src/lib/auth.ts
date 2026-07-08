import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins/username";
import { admin } from "better-auth/plugins/admin";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    admin({
      defaultRole: "CASHIER",
      adminRoles: ["ADMIN"],
      roles: {
        ADMIN: adminAc,
        CASHIER: userAc,
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
