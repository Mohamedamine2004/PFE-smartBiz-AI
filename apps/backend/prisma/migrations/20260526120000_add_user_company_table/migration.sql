-- ============================================================
-- Migration: Add UserCompany junction table for multi-tenancy
-- This table was missing from all previous migrations.
-- ============================================================

-- Step 1: Add firstName and lastName columns to User table if missing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT NOT NULL DEFAULT '';

-- Step 2: Add refreshToken column if missing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "refreshToken" TEXT;

-- Step 3: Add company branding columns if missing
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "sector" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "fiscalYearStart" INTEGER;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#1E3A5F';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT DEFAULT '#2563EB';

-- Step 4: Create the UserCompany junction table for multi-company membership
CREATE TABLE IF NOT EXISTS "UserCompany" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role"      "UserRole" NOT NULL DEFAULT 'COLLAB',
    "password"  TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCompany_pkey" PRIMARY KEY ("id")
);

-- Step 5: Add unique constraint (one membership per user per company)
CREATE UNIQUE INDEX IF NOT EXISTS "UserCompany_userId_companyId_key"
    ON "UserCompany"("userId", "companyId");

-- Step 6: Add foreign keys
ALTER TABLE "UserCompany"
    ADD CONSTRAINT "UserCompany_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserCompany"
    ADD CONSTRAINT "UserCompany_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Backfill existing users into UserCompany
-- For each existing user, create a UserCompany entry using their current role and password
INSERT INTO "UserCompany" ("id", "userId", "companyId", "role", "password", "createdAt")
SELECT
    gen_random_uuid()::text,
    u."id",
    u."companyId",
    u."role",
    u."password",
    u."createdAt"
FROM "User" u
WHERE u."deletedAt" IS NULL
ON CONFLICT ("userId", "companyId") DO NOTHING;
