const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.upsert({
    where: { registrationNumber: 'TEST-REG-001' },
    update: { name: 'SmartBiz Test Company' },
    create: {
      name: 'SmartBiz Test Company',
      registrationNumber: 'TEST-REG-001',
    },
  });

  const password = await bcrypt.hash('Admin123!', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@smartbiz.test' },
    update: {
      firstName: 'Admin',
      lastName: 'Test',
      password,
      role: 'ADMIN',
      companyId: company.id,
      isEmailVerified: true,
    },
    create: {
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin@smartbiz.test',
      password,
      role: 'ADMIN',
      companyId: company.id,
      isEmailVerified: true,
    },
  });

  console.log(JSON.stringify({
    companyId: company.id,
    companyName: company.name,
    registrationNumber: company.registrationNumber,
    userId: user.id,
    email: user.email,
    role: user.role,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
