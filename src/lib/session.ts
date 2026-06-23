import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(role: "ADMIN" | "CASHIER") {
  const session = await requireUser();
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== role) {
    redirect(userRole === "ADMIN" ? "/dashboard" : "/overview");
  }
  return session;
}
