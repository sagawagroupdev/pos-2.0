import "dotenv/config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function main() {
  const email = "admin@sagawagroup.id";
  const username = "administrator";
  const password = "@sagawagroup222!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", existing.username);
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password, name: "Administrator", username },
  });

  await prisma.user.update({
    where: { email },
    data: { role: "ADMIN", emailVerified: true },
  });

  console.log("Seeded admin -> username:", username, "password:", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
