import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://smartbiz_user:smartbiz_password@postgres:5432/smartbiz_db';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting data migration to UserCompany table...');
  const users = await prisma.user.findMany();
  
  let migratedCount = 0;
  for (const user of users) {
    if (!user.companyId) continue;
    
    // Check if membership already exists
    const existing = await prisma.userCompany.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: user.companyId
        }
      }
    });
    
    if (!existing) {
      await prisma.userCompany.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          role: user.role,
          password: user.password // Keep existing hashed password
        }
      });
      migratedCount++;
    }
  }
  console.log(`Successfully migrated ${migratedCount} user memberships to UserCompany!`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
