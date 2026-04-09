-- AlterTable
ALTER TABLE "ImportBatch" ADD COLUMN     "cac" DOUBLE PRECISION,
ADD COLUMN     "employeeCount" INTEGER,
ADD COLUMN     "ltv" DOUBLE PRECISION,
ADD COLUMN     "macroFeatures" JSONB,
ADD COLUMN     "marketShare" DOUBLE PRECISION,
ADD COLUMN     "tam" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "FinancialData_batchId_metric_period_idx" ON "FinancialData"("batchId", "metric", "period");
