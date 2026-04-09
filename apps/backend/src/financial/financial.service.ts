import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FinancialRowDto, StrategicKpiDto } from './dto/import-data.dto';
import * as XLSX from 'xlsx';

/**
 * Maps each frontend sector to a representative SIC code.
 * These ranges align with the ML training pipeline in sec_data/etl/step3_wide.py:
 *   Agriculture (0–999), Mining (1000–1499), Construction (1500–1999),
 *   Manufacturing (2000–3999), Transport (4000–4999), Wholesale (5000–5199),
 *   Retail (5200–5999), Services (6000–7999), Health (8000–8999).
 */
const SECTOR_TO_SIC: Record<string, number> = {
  agriculture: 500,
  mining: 1200,
  construction: 1700,
  manufacturing: 3500,
  transport: 4200,
  wholesale: 5100,
  retail: 5500,
  services: 7300,
  technology: 7370,   // maps to Services (SIC 6000–7999)
  finance: 7300,   // maps to Services (SIC 6000–7999)
  health: 8500,
};

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) { }

  async processBimodalImport(fileBuffer: Buffer, companyId: string) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });

    // 1. Sheet Presence Validation
    const requiredSheets = ['Valuation_Annual', 'CashFlow_Monthly_TTM', 'Strategic_KPIs'];
    requiredSheets.forEach(sheet => {
      if (!workbook.SheetNames.includes(sheet)) {
        throw new BadRequestException(`Missing required sheet: ${sheet}`);
      }
    });

    return await this.prisma.$transaction(async (tx) => {
      // 2. Parse and Validate Sheet 3: Strategic KPIs
      const rawKPIs = XLSX.utils.sheet_to_json(workbook.Sheets['Strategic_KPIs'])[0] as any;
      if (!rawKPIs) throw new BadRequestException('Strategic KPIs sheet is empty');

      const kpiDto = plainToInstance(StrategicKpiDto, {
        cac: Number(rawKPIs.CAC),
        ltv: Number(rawKPIs.LTV),
        tam: Number(rawKPIs.TAM),
        marketShare: Number(rawKPIs.Market_Share),
        employeeCount: Number(rawKPIs.Employee_Count),
      });

      const kpiErrors = await validate(kpiDto);
      if (kpiErrors.length > 0) throw new BadRequestException('Strategic KPIs sheet has invalid data format');

      // 3. Parse Sheet 1: Valuation Annual
      const valuationData = XLSX.utils.sheet_to_json(workbook.Sheets['Valuation_Annual'])[0];
      if (!valuationData) throw new BadRequestException('Valuation Annual sheet is empty');

      // 3b. Auto-inject sic_code from company sector
      const company = await tx.company.findUniqueOrThrow({ where: { id: companyId }, select: { sector: true } });
      const sicCode = SECTOR_TO_SIC[company.sector?.toLowerCase() ?? ''] ?? SECTOR_TO_SIC['services'];
      (valuationData as any).sic_code = sicCode;

      // 4. Create the unified ImportBatch
      const batch = await tx.importBatch.create({
        data: {
          companyId,
          cac: kpiDto.cac,
          ltv: kpiDto.ltv,
          tam: kpiDto.tam,
          marketShare: kpiDto.marketShare,
          employeeCount: kpiDto.employeeCount,
          macroFeatures: valuationData as Prisma.InputJsonObject,
        },
      });

      // 5. Parse, Validate, and Prepare Sheet 2: Monthly CashFlow
      const validatedRows: Prisma.FinancialDataCreateManyInput[] = [];
      const rawCashflow = XLSX.utils.sheet_to_json(workbook.Sheets['CashFlow_Monthly_TTM']);

      for (const row of (rawCashflow as any[])) {
        const metric = row.Metric;
        if (!metric) continue;

        for (const key of Object.keys(row)) {
          if (key === 'Metric') continue;

          const dtoInstance = plainToInstance(FinancialRowDto, {
            metric,
            value: Number(row[key]),
            period: new Date(key),
          });

          const errors = await validate(dtoInstance);
          if (errors.length > 0) {
            throw new BadRequestException(`Validation failed on CashFlow sheet for metric: ${metric} at period ${key}`);
          }

          validatedRows.push({
            batchId: batch.id,
            metric: dtoInstance.metric,
            value: dtoInstance.value,
            period: dtoInstance.period,
          });
        }
      }

      // 6. Bulk Insert Relational Data
      if (validatedRows.length > 0) {
        await tx.financialData.createMany({ data: validatedRows });
      }

      return {
        success: true,
        batchId: batch.id,
        recordsProcessed: validatedRows.length,
        message: 'Data imported successfully'
      };
    });
  }
  generateTemplate(): Buffer {
    const workbook = XLSX.utils.book_new();

    // 1. Sheet: Valuation_Annual (sic_code is auto-injected from company sector)
    const valuationHeaders = [
      'Assets_N', 'Assets_N_1',
      'Liabilities_N', 'Liabilities_N_1',
      'Revenues_N', 'Revenues_N_1', 'Revenues_N_2',
      'NetIncome_N', 'OperatingIncome_N', 'OperatingCashFlow_N',
      'CashAndEquivalents_N'
    ];
    const valuationSheet = XLSX.utils.json_to_sheet([
      valuationHeaders.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})
    ]);
    XLSX.utils.book_append_sheet(workbook, valuationSheet, 'Valuation_Annual');

    // 2. Sheet: CashFlow_Monthly_TTM
    const currentDate = new Date();
    const monthHeaders: any = { Metric: 'Example_Metric' };
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = d.toISOString().split('T')[0];
      monthHeaders[monthStr] = 0;
    }

    const metricsList = [
      'Gross_Revenue', 'Operating_Expenses_Total', 'Payroll_Expenses',
      'Marketing_Spend', 'Net_Cash_Burn', 'Ending_Cash_Balance',
      'New_Customers_Acquired', 'Customers_Churned'
    ];

    const cashFlowData = metricsList.map(metric => ({ ...monthHeaders, Metric: metric }));
    const cashFlowSheet = XLSX.utils.json_to_sheet(cashFlowData);
    XLSX.utils.book_append_sheet(workbook, cashFlowSheet, 'CashFlow_Monthly_TTM');

    // 3. Sheet: Strategic_KPIs
    const kpiSheet = XLSX.utils.json_to_sheet([{
      CAC: 0, LTV: 0, TAM: 0, Market_Share: 0, Employee_Count: 0
    }]);
    XLSX.utils.book_append_sheet(workbook, kpiSheet, 'Strategic_KPIs');

    // Return the raw buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
  /**
   * Transforms a batch and its financial data into dashboard metrics.
   * Reusable helper for both latest batch and historical batch retrieval.
   */
  private buildDashboardMetricsFromBatch(batch: any) {
    const chartDataMap = new Map<string, any>();

    batch.data.forEach((row: any) => {
      const periodKey = row.period.toISOString().substring(0, 7); // 'YYYY-MM'

      if (!chartDataMap.has(periodKey)) {
        chartDataMap.set(periodKey, { period: periodKey });
      }

      const currentPeriod = chartDataMap.get(periodKey);
      currentPeriod[row.metric] = row.value;
    });

    return {
      hasData: true,
      batchId: batch.id,
      uploadedAt: batch.createdAt,
      strategicKpis: {
        cac: batch.cac,
        ltv: batch.ltv,
        tam: batch.tam,
        marketShare: batch.marketShare,
        employeeCount: batch.employeeCount,
      },
      chartData: Array.from(chartDataMap.values()),
    };
  }

  /**
   * Retrieves the latest imported batch and formats the time-series
   * data for React charting libraries.
   */
  async getDashboardMetrics(companyId: string) {
    // 1. Fetch the most recent successful import batch
    const latestBatch = await this.prisma.importBatch.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        data: {
          orderBy: { period: 'asc' } // Ensure chronological order
        }
      }
    });

    if (!latestBatch) {
      return { hasData: false, data: null };
    }

    return this.buildDashboardMetricsFromBatch(latestBatch);
  }

  /**
   * Retrieves metrics for a specific historical batch (by batchId).
   * Used to allow users to view data from old imports.
   * Verifies that batch belongs to the requesting company.
   */
  async getDashboardMetricsByBatchId(batchId: string, companyId: string) {
    const batch = await this.prisma.importBatch.findUnique({
      where: { id: batchId },
      include: {
        data: {
          orderBy: { period: 'asc' }
        }
      }
    });

    if (!batch) {
      throw new NotFoundException(`Import batch '${batchId}' not found`);
    }

    if (batch.companyId !== companyId) {
      throw new ForbiddenException('You do not have permission to access this import batch');
    }

    return this.buildDashboardMetricsFromBatch(batch);
  }

  /**
   * Returns the list of all ImportBatches for a company (history),
   * ordered from newest to oldest, with the count of FinancialData rows.
   */
  async getImportHistory(companyId: string) {
    const batches = await this.prisma.importBatch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { data: true } },
      },
    });

    return batches.map((batch) => ({
      id: batch.id,
      createdAt: batch.createdAt,
      recordCount: batch._count.data,
      strategicKpis: {
        cac: batch.cac,
        ltv: batch.ltv,
        tam: batch.tam,
        marketShare: batch.marketShare,
        employeeCount: batch.employeeCount,
      },
    }));
  }

  /**
   * Deletes an ImportBatch by ID after verifying ownership.
   * The onDelete: Cascade on FinancialData ensures all related rows
   * are automatically removed by the database.
   */
  async deleteImportBatch(batchId: string, companyId: string) {
    // 1. Find the batch and verify it belongs to the requesting company
    const batch = await this.prisma.importBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Import batch '${batchId}' not found`);
    }

    if (batch.companyId !== companyId) {
      throw new ForbiddenException('You do not have permission to delete this import batch');
    }

    // 2. Delete the batch — cascade will automatically remove all linked FinancialData
    await this.prisma.importBatch.delete({ where: { id: batchId } });

    return {
      success: true,
      message: `Import batch '${batchId}' and all its financial data have been deleted`,
    };
  }
}