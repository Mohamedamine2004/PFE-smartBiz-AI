import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BenchmarkDelta,
  ReportKpis,
  SectorBenchmark,
} from '../interfaces/report-content.types';
import * as staticBenchmarks from './sector-benchmarks.json';

/**
 * SRP: Sector Benchmark calculation only.
 *
 * Two-level fallback:
 *   Level 1 — Aggregate from DB if ≥3 companies share the same sector.
 *   Level 2 — Static JSON fallback for cold-start scenarios.
 */
@Injectable()
export class BenchmarkService {
  private readonly logger = new Logger(BenchmarkService.name);
  private readonly MIN_SAMPLE_SIZE = 3;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get sector benchmark data for a company's sector.
   */
  async getSectorBenchmark(
    companyId: string,
    sector: string | null | undefined,
  ): Promise<SectorBenchmark> {
    const sectorKey = this.normalizeSector(sector);

    // Level 1: Try to compute from real DB data
    const dbBenchmark = await this.computeFromDatabase(companyId, sectorKey);
    if (dbBenchmark) {
      this.logger.log(
        `Benchmark for "${sectorKey}": computed from ${dbBenchmark.sampleSize} companies in DB`,
      );
      return dbBenchmark;
    }

    // Level 2: Fall back to static JSON
    this.logger.log(
      `Benchmark for "${sectorKey}": using static fallback (< ${this.MIN_SAMPLE_SIZE} companies in DB)`,
    );
    return this.getStaticBenchmark(sectorKey);
  }

  /**
   * Compute deltas between company KPIs and sector medians.
   */
  computeDeltas(
    annual: Record<string, number>,
    kpis: ReportKpis | undefined,
    benchmark: SectorBenchmark,
  ): BenchmarkDelta[] {
    const deltas: BenchmarkDelta[] = [];

    // Gross Margin
    const revenue = annual.Revenues_N || 0;
    const opIncome = annual.OperatingIncome_N || 0;
    if (revenue > 0) {
      const companyMargin = opIncome / revenue;
      deltas.push(
        this.buildDelta(
          'Marge Opérationnelle',
          companyMargin,
          benchmark.grossMarginMedian,
        ),
      );
    }

    // Net Margin
    const netIncome = annual.NetIncome_N || 0;
    if (revenue > 0) {
      const companyNetMargin = netIncome / revenue;
      deltas.push(
        this.buildDelta(
          'Marge Nette',
          companyNetMargin,
          benchmark.netMarginMedian,
        ),
      );
    }

    // Debt Ratio
    const assets = annual.Assets_N || 0;
    const liabilities = annual.Liabilities_N || 0;
    if (assets > 0) {
      const debtRatio = liabilities / assets;
      deltas.push(
        this.buildDelta(
          "Ratio d'Endettement",
          debtRatio,
          benchmark.debtRatioMedian,
        ),
      );
    }

    // LTV/CAC
    if (kpis && kpis.cac > 0 && kpis.ltv > 0) {
      const ltvCac = kpis.ltv / kpis.cac;
      deltas.push(
        this.buildDelta('Ratio LTV/CAC', ltvCac, benchmark.ltvCacRatioMedian),
      );
    }

    // CAC
    if (kpis && kpis.cac > 0) {
      deltas.push(
        this.buildDelta("Coût d'Acquisition", kpis.cac, benchmark.cacMedian),
      );
    }

    // Revenue Growth
    const revN1 = annual.Revenues_N_1 || 0;
    if (revN1 > 0 && revenue > 0) {
      const growth = (revenue - revN1) / revN1;
      deltas.push(
        this.buildDelta('Croissance CA', growth, benchmark.revenueGrowthMedian),
      );
    }

    return deltas;
  }

  // ─── Private Helpers ───

  private buildDelta(
    metric: string,
    companyValue: number,
    sectorMedian: number,
  ): BenchmarkDelta {
    const deltaPercent =
      sectorMedian !== 0
        ? ((companyValue - sectorMedian) / Math.abs(sectorMedian)) * 100
        : 0;
    const interpretation: BenchmarkDelta['interpretation'] =
      Math.abs(deltaPercent) < 2
        ? 'equal'
        : deltaPercent > 0
          ? 'above'
          : 'below';

    return { metric, companyValue, sectorMedian, deltaPercent, interpretation };
  }

  /**
   * Level 1: Aggregate real data from companies in the same sector.
   */
  private async computeFromDatabase(
    excludeCompanyId: string,
    sectorKey: string,
  ): Promise<SectorBenchmark | null> {
    try {
      const peerCompanies = await this.prisma.company.findMany({
        where: {
          sector: { contains: sectorKey, mode: 'insensitive' },
          id: { not: excludeCompanyId },
          deletedAt: null,
        },
        select: { id: true },
      });

      if (peerCompanies.length < this.MIN_SAMPLE_SIZE) {
        return null;
      }

      const peerIds = peerCompanies.map((c) => c.id);

      // Fetch the latest batch for each peer
      const batches = await this.prisma.importBatch.findMany({
        where: { companyId: { in: peerIds } },
        orderBy: { createdAt: 'desc' },
        distinct: ['companyId'],
        select: {
          macroFeatures: true,
          cac: true,
          ltv: true,
        },
      });

      if (batches.length < this.MIN_SAMPLE_SIZE) {
        return null;
      }

      // Extract and compute medians
      const margins: number[] = [];
      const netMargins: number[] = [];
      const cacs: number[] = [];
      const ltvCacRatios: number[] = [];

      for (const batch of batches) {
        const macro = (batch.macroFeatures ?? {}) as Record<string, number>;
        const rev = Number(macro.Revenues_N) || 0;
        const opInc = Number(macro.OperatingIncome_N) || 0;
        const netInc = Number(macro.NetIncome_N) || 0;

        if (rev > 0) {
          margins.push(opInc / rev);
          netMargins.push(netInc / rev);
        }
        if (batch.cac && batch.cac > 0) cacs.push(batch.cac);
        if (batch.ltv && batch.cac && batch.cac > 0) {
          ltvCacRatios.push(batch.ltv / batch.cac);
        }
      }

      return {
        sectorKey,
        sectorLabel: sectorKey,
        grossMarginMedian: this.median(margins),
        netMarginMedian: this.median(netMargins),
        cacMedian: this.median(cacs),
        ltvCacRatioMedian: this.median(ltvCacRatios),
        churnRateMedian: 0.05, // Not easily aggregated, use default
        revenueGrowthMedian: 0.12,
        debtRatioMedian: 0.45,
        source: 'database',
        sampleSize: batches.length,
      };
    } catch (error) {
      this.logger.warn(
        `DB benchmark computation failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return null;
    }
  }

  /**
   * Level 2: Static JSON data for cold-start.
   */
  private getStaticBenchmark(sectorKey: string): SectorBenchmark {
    const data = staticBenchmarks as Record<
      string,
      {
        grossMarginMedian: number;
        netMarginMedian: number;
        cacMedian: number;
        ltvCacRatioMedian: number;
        churnRateMedian: number;
        revenueGrowthMedian: number;
        debtRatioMedian: number;
      }
    >;

    // Try exact match first, then fuzzy match, then default
    const matchedKey =
      Object.keys(data).find(
        (k) => k.toLowerCase() === sectorKey.toLowerCase(),
      ) ??
      Object.keys(data).find((k) =>
        sectorKey.toLowerCase().includes(k.toLowerCase()),
      ) ??
      'Default';

    const entry = data[matchedKey] ?? data['Default'];

    return {
      sectorKey: matchedKey,
      sectorLabel: matchedKey,
      ...entry,
      source: 'static',
      sampleSize: 0,
    };
  }

  private normalizeSector(sector: string | null | undefined): string {
    if (!sector || sector.trim().length === 0) return 'Default';
    return sector.trim();
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
