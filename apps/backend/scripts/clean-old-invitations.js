const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Fetching all companies...');
  const companies = await prisma.company.findMany({
    select: { name: true }
  });
  const companyNames = new Set(companies.map(c => c.name.toLowerCase().trim()));
  console.log(`Active companies: ${[...companyNames].join(', ') || 'None'}`);

  console.log('🔍 Fetching all invitation requests...');
  const invitations = await prisma.invitationRequest.findMany({});
  
  const toDelete = [];
  for (const invite of invitations) {
    const inviteCompany = invite.companyName ? invite.companyName.toLowerCase().trim() : '';
    if (!inviteCompany || !companyNames.has(inviteCompany)) {
      toDelete.push(invite);
    }
  }

  if (toDelete.length === 0) {
    console.log('✅ No orphaned invitation requests found.');
    return;
  }

  console.log(`🧹 Found ${toDelete.length} orphaned invitation request(s) to delete:`);
  for (const invite of toDelete) {
    console.log(`  - ID: ${invite.id}, Name: ${invite.fullName}, Email: ${invite.email}, Company: ${invite.companyName}`);
  }

  const ids = toDelete.map(i => i.id);
  const result = await prisma.invitationRequest.deleteMany({
    where: {
      id: { in: ids }
    }
  });

  console.log(`🎉 Successfully deleted ${result.count} invitation request(s)!`);
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
