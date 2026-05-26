-- AlterEnum: Add COLLAB and READER values to UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COLLAB';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'READER';

-- AlterTable: Set new default role to COLLAB
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'COLLAB'::"UserRole";
