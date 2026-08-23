// Creates a default admin account so you can log in immediately.
// Run with: npm run seed
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@society.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", email);
    return;
  }

  const password = await bcrypt.hash("Admin@123", 10);
  await prisma.user.create({
    data: {
      name: "Society Admin",
      email,
      password,
      role: "ADMIN",
      flatNo: "OFFICE",
    },
  });

  console.log("Seeded admin account:");
  console.log("  email:", email);
  console.log("  password: Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
