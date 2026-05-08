-- AlterEnum: Add OWNER to UserRole
-- Step 1: Create new enum type with OWNER
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OWNER' BEFORE 'ADMIN';

-- Step 2: Promote the earliest-created ADMIN of each company to OWNER
-- (Only if no OWNER exists yet for that company)
UPDATE "User" u
SET role = 'OWNER'::"UserRole"
WHERE u.id IN (
  SELECT DISTINCT ON (u2."companyId") u2.id
  FROM "User" u2
  WHERE u2.role = 'ADMIN'::"UserRole"
    AND u2."deletedAt" IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM "User" u3
      WHERE u3."companyId" = u2."companyId"
        AND u3.role = 'OWNER'::"UserRole"
    )
  ORDER BY u2."companyId", u2."createdAt" ASC
);
