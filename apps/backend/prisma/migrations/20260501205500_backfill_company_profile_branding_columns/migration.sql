-- Backfill Company profile and branding columns for databases initialized
-- before these fields were introduced in schema.prisma.
ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "sector" TEXT,
  ADD COLUMN IF NOT EXISTS "currency" TEXT,
  ADD COLUMN IF NOT EXISTS "fiscalYearStart" INTEGER,
  ADD COLUMN IF NOT EXISTS "country" TEXT,
  ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#1E3A5F',
  ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT DEFAULT '#2563EB';