const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://admin:password@localhost:5432/smartbiz_ai?schema=public" } }
});
async function main() {
  const report = await prisma.report.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log(JSON.stringify(report.snapshot, null, 2));
}
main().finally(() => prisma.$disconnect());
