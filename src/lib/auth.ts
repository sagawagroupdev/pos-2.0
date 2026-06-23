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
      // Map our uppercase Role enum to the plugin's access-control roles.
      // hasPermission() looks up roles[session.user.role] case-sensitively,
      // so the keys must match the values stored in User.role exactly.
      roles: {
        ADMIN: adminAc,
        CASHIER: userAc,
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
