-- Enforce uniqueness of OWNER by company among active users.
CREATE UNIQUE INDEX IF NOT EXISTS "User_company_owner_unique_idx"
ON "User" ("companyId")
WHERE role = 'OWNER'::"UserRole" AND "deletedAt" IS NULL;
