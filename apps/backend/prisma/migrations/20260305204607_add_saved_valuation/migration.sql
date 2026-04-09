-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "country" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "fiscalYearStart" INTEGER,
ADD COLUMN     "sector" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "firstName" DROP DEFAULT,
ALTER COLUMN "lastName" DROP DEFAULT;

-- CreateTable
CREATE TABLE "SavedValuation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "enterpriseValue" DOUBLE PRECISION,
    "equityValue" DOUBLE PRECISION NOT NULL,
    "formula" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedValuation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedValuation_companyId_createdAt_idx" ON "SavedValuation"("companyId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "SavedValuation" ADD CONSTRAINT "SavedValuation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
