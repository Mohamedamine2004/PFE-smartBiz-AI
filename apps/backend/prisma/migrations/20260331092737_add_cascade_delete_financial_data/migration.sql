-- DropForeignKey
ALTER TABLE "FinancialData" DROP CONSTRAINT "FinancialData_batchId_fkey";

-- AddForeignKey
ALTER TABLE "FinancialData" ADD CONSTRAINT "FinancialData_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
