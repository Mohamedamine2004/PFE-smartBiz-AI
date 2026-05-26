const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Starting full database cleanup...');

  // Delete in order to respect foreign key constraints
  await prisma.financialData.deleteMany({});
  console.log('✅ FinancialData cleared');

  await prisma.importBatch.deleteMany({});
  console.log('✅ ImportBatch cleared');

  await prisma.prediction.deleteMany({});
  console.log('✅ Prediction cleared');

  await prisma.savedValuation.deleteMany({});
  console.log('✅ SavedValuation cleared');

  await prisma.notification.deleteMany({});
  console.log('✅ Notification cleared');

  await prisma.report.deleteMany({});
  console.log('✅ Report cleared');

  await prisma.invitationRequest.deleteMany({});
  console.log('✅ InvitationRequest cleared');

  await prisma.user.deleteMany({});
  console.log('✅ All Users deleted');

  await prisma.company.deleteMany({});
  console.log('✅ All Companies deleted');

  console.log('\n🎉 Database is now completely empty!');
  console.log('ℹ️  No default admin was created. You can register a new account from the app.');
}

main()
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
