import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { Prediction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

// Maps frontend sector names to 4-digit SIC codes (same mapping as financial.service.ts)
const SECTOR_TO_SIC: Record<string, string> = {
  agriculture: '0500',
  mining: '1200',
  construction: '1700',
  manufacturing: '3500',
  transport: '4200',
  wholesale: '5100',
  retail: '5500',
  services: '7300',
  technology: '7370',
  finance: '7300',
  health: '8500',
};

@Injectable()
export class PredictionService implements OnModuleInit {
  private readonly logger = new Logger(PredictionService.name);
  private mlEngineUrl!: string;
  private mlApiKey!: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.mlEngineUrl = this.configService.get<string>(
      'ML_ENGINE_URL',
      'http://localhost:8000',
    );
    this.mlApiKey = this.configService.get<string>(
      'ML_API_KEY',
      'dev-secret-key',
    );
  }

  /**
   * Runs a prediction for the given company by:
   * 1. Fetching the latest ImportBatch with macroFeatures
   * 2. Mapping the Excel JSON to the FastAPI RawFinancials schema
   * 3. Calling the ML engine
   * 4. Saving the result in the Prediction table
   */
  async runPrediction(companyId: string, customBatchId?: string) {
    // 1. Create a PENDING prediction record
    const prediction = await this.prisma.prediction.create({
      data: { companyId, status: 'PENDING' },
    });

    let sourceBatchId: string | null = null;

    try {
      // 2. Mark as PROCESSING
      await this.prisma.prediction.update({
        where: { id: prediction.id },
        data: { status: 'PROCESSING' },
      });

      // 3. Fetch the specific or latest import batch with macroFeatures
      const batch = customBatchId
        ? await this.prisma.importBatch.findFirst({
            where: { id: customBatchId, companyId },
          })
        : await this.prisma.importBatch.findFirst({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
          });

      if (!batch || !batch.macroFeatures) {
        throw new Error('No financial data found. Please import data first.');
      }

      sourceBatchId = batch.id;

      // Persist batch context early so historical lookups can also resolve PENDING/PROCESSING states.
      await this.prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          result: { sourceBatchId },
        },
      });

      // 4. Fetch the company sector for SIC code mapping
      const company = await this.prisma.company.findUniqueOrThrow({
        where: { id: companyId },
        select: { sector: true },
      });

      const sic =
        (batch.macroFeatures as any).sic_code?.toString().padStart(4, '0') ??
        SECTOR_TO_SIC[company.sector?.toLowerCase() ?? ''] ??
        '7300';

      // 5. Map the Excel macroFeatures JSON to the FastAPI schema
      const macro = batch.macroFeatures as Record<string, any>;
      const payload = {
        companies: [
          {
            sic,
            Assets: Number(macro.Assets_N ?? 0),
            Liabilities: Number(macro.Liabilities_N ?? 0),
            Revenues: Number(macro.Revenues_N ?? 0),
            OperatingIncome: Number(macro.OperatingIncome_N ?? 0),
            OperatingCashFlow: Number(macro.OperatingCashFlow_N ?? 0),
            NetIncomeLoss: Number(macro.NetIncome_N ?? 0),
            Assets_lag1: Number(macro.Assets_N_1 ?? 0),
            Liabilities_lag1: Number(macro.Liabilities_N_1 ?? 0),
            Revenues_lag1: Number(macro.Revenues_N_1 ?? 0),
            Revenues_lag2: Number(macro.Revenues_N_2 ?? 0),
            CashAndEquivalents: Number(macro.CashAndEquivalents_N ?? 0),
          },
        ],
      };

      this.logger.log(`Calling ML engine at ${this.mlEngineUrl}/predict`);

      // 6. Call the FastAPI ML engine
      const { data: mlResult } = await firstValueFrom(
        this.httpService.post(`${this.mlEngineUrl}/predict`, payload, {
          headers: { 'X-API-Key': this.mlApiKey },
          timeout: 30_000,
        }),
      );

      // 7. Save the COMPLETED prediction, embedding batchId inside the result
      const mlResultWithContext = { ...mlResult, sourceBatchId };

      const updated = await this.prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          status: 'COMPLETED',
          result: mlResultWithContext,
        },
      });

      this.logger.log(`Prediction ${prediction.id} completed successfully`);
      return updated;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      // Mark as FAILED with error details
      this.logger.error(`Prediction ${prediction.id} failed: ${errorMessage}`);
      const failed = await this.prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          status: 'FAILED',
          result: {
            sourceBatchId,
            error: errorMessage,
          },
        },
      });
      return failed;
    }
  }

  /**
   * Returns the latest COMPLETED prediction for a company,
   * optionally filtering by a specific historical batch.
   */
  async getLatestPrediction(companyId: string, customBatchId?: string) {
    let prediction: Prediction | null = null;
    const hasMatchingBatch = (p: Prediction) =>
      p.result &&
      typeof p.result === 'object' &&
      (p.result as any).sourceBatchId === customBatchId;

    // Fallback: If customBatchId is provided, we fetch all COMPLETED predictions
    // and find the one whose result.sourceBatchId matches customBatchId.
    if (customBatchId) {
      const allByCompany = await this.prisma.prediction.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });
      // JSON filtering inside Prisma requires raw queries, so we filter in-memory (usually small list).
      // Priority: latest COMPLETED for this batch; fallback to latest state for this same batch.
      prediction =
        allByCompany.find(
          (p) => p.status === 'COMPLETED' && hasMatchingBatch(p),
        ) ??
        allByCompany.find((p) => hasMatchingBatch(p)) ??
        null;
    } else {
      prediction = await this.prisma.prediction.findFirst({
        where: { companyId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (prediction?.status === 'COMPLETED') {
      return {
        hasPrediction: true,
        predictionId: prediction.id,
        createdAt: prediction.createdAt,
        status: prediction.status,
        ...(prediction.result as object),
      };
    }

    // If there is no completed prediction, surface the latest state so the
    // frontend can show a meaningful message (FAILED/PENDING/PROCESSING).
    const latest = customBatchId
      ? prediction
      : await this.prisma.prediction.findFirst({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
        });

    if (!latest) {
      return { hasPrediction: false, data: null };
    }

    const latestResult = (latest.result ?? {}) as Record<string, unknown>;

    return {
      hasPrediction: false,
      predictionId: latest.id,
      createdAt: latest.createdAt,
      status: latest.status,
      error: typeof latestResult.error === 'string' ? latestResult.error : null,
    };
  }
}
