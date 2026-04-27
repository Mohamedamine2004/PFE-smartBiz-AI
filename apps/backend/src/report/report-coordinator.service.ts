import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PredictionService } from '../prediction/prediction.service';
import { LlmStrategyService } from './providers/llm-strategy.service';
import { PromptEngineService } from './prompt-engine.service';
import { ReportDataAssembler } from './report-data-assembler.service';
import { FallbackContentService } from './fallback-content.service';
import { BenchmarkService } from './benchmark/benchmark.service';
import { PdfCoreService } from './pdf/pdf-core.service';
import { ReportStorageService } from './report-storage.service';
import {
  ReportAudience,
  ReportAnalysisDepth,
  ReportLengthProfile,
  ReportSection,
  ReportTone,
  ReportType,
} from './dto/generate-report.dto';
import {
  ChartData,
  CompanyBranding,
  FinancialRow,
  PageBudget,
  SectorBenchmark,
  BenchmarkDelta,
} from './interfaces/report-content.types';

// ─── Internal types for the coordinator ───

type ReportSectionBlock = {
  type: string;
  title: string;
  text: string;
  chartData?: ChartData;
};

/**
 * Orchestrates the entire report generation pipeline.
 * SRP: coordinates between data, LLM, benchmark, and PDF — but delegates all work.
 */
@Injectable()
export class ReportCoordinatorService {
  private readonly logger = new Logger(ReportCoordinatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly predictionService: PredictionService,
    private readonly llmStrategy: LlmStrategyService,
    private readonly promptEngine: PromptEngineService,
    private readonly dataAssembler: ReportDataAssembler,
    private readonly fallbackService: FallbackContentService,
    private readonly benchmarkService: BenchmarkService,
    private readonly pdfCore: PdfCoreService,
    private readonly storage: ReportStorageService,
  ) {}

  async processReport(reportId: string) {
    this.logger.log(`Starting generation for report ${reportId}`);

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.PROCESSING, error: null },
    });

    try {
      // ─── 1. Load Report + Company ───
      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
      });
      if (!report) throw new Error('Report not found');

      const company = await this.prisma.company.findUnique({
        where: { id: report.companyId },
        select: {
          name: true,
          sector: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          currency: true,
        },
      });

      // ─── 2. Load Financial Data ───
      const batch = report.batchId
        ? await this.prisma.importBatch.findFirst({
            where: { id: report.batchId, companyId: report.companyId },
          })
        : await this.prisma.importBatch.findFirst({
            where: { companyId: report.companyId },
            orderBy: { createdAt: 'desc' },
          });
      if (!batch) throw new Error('No financial data found');

      const financialRows = await this.prisma.financialData.findMany({
        where: { batchId: batch.id },
        orderBy: { period: 'asc' },
      });

      const prediction = await this.predictionService.getLatestPrediction(
        report.companyId,
        batch.id,
      );

      // ─── 3. Parse Snapshot & Compute Metrics ───
      const snapshot = this.parseSnapshot(report.snapshot);
      const reportTypes = report.reportTypes as ReportType[];
      const annual = this.dataAssembler.extractAnnualNumbers(
        (batch.macroFeatures ?? {}) as Record<string, unknown>,
      );
      const latestMetrics = this.dataAssembler.extractLatestMetrics(
        financialRows as FinancialRow[],
      );
      const monthlyTable = this.promptEngine.buildMonthlyTable(
        financialRows as FinancialRow[],
      );
      const kpis = {
        cac: Number(batch.cac ?? 0),
        ltv: Number(batch.ltv ?? 0),
        tam: Number(batch.tam ?? 0),
        marketShare: Number(batch.marketShare ?? 0),
        employeeCount: Number(batch.employeeCount ?? 0),
      };
      const growthYoy = this.safeGrowth(
        annual.Revenues_N ?? 0,
        annual.Revenues_N_1 ?? 0,
      );
      const growth2Y = this.safeGrowth(
        annual.Revenues_N ?? 0,
        annual.Revenues_N_2 ?? 0,
      );
      const ltvCac = this.safeRatio(kpis.ltv, kpis.cac);

      // ─── 4. Compute Benchmark ───
      let benchmark: SectorBenchmark | undefined;
      let benchmarkDeltas: BenchmarkDelta[] | undefined;

      if (snapshot.includeBenchmark) {
        benchmark = await this.benchmarkService.getSectorBenchmark(
          report.companyId,
          company?.sector,
        );
        benchmarkDeltas = this.benchmarkService.computeDeltas(
          annual,
          kpis,
          benchmark,
        );
      }

      // ─── 5. Compute Page Budget ───
      const pageBudget = this.computePageBudget(
        report.lengthProfile as ReportLengthProfile,
        reportTypes.length,
        snapshot.includeBenchmark,
      );
      const pagesPerSection = Math.max(
        1,
        Math.round(
          pageBudget.sections /
            Math.max(reportTypes.length + snapshot.sections.length, 1),
        ),
      );

      // ─── 6. Build Base Prompt ───
      const basePrompt = this.promptEngine.capPrompt(
        this.promptEngine.buildBasePrompt({
          locale: this.languageToHuman(report.language),
          annual,
          growthYoy,
          growth2Y,
          kpis,
          ltvCac,
          monthlyTable,
          analysisDepth: snapshot.analysisDepth,
          problemStatement: report.problemStatement ?? undefined,
          tone: snapshot.tone,
          audience: snapshot.audience,
          pagesPerSection,
          prediction,
          benchmark,
          benchmarkDeltas,
        }),
      );

      const fallbackContext = {
        language: report.language,
        annual,
        metrics: latestMetrics,
        kpis,
        prediction,
        problemStatement: report.problemStatement ?? undefined,
        reportTypes,
        requestedSections: snapshot.sections,
        financialData: financialRows as FinancialRow[],
        currency: company?.currency || '',
      };

      // ─── 7. Generate Sections via LLM ───
      const sections: ReportSectionBlock[] = [];
      let fallbackSections = 0;
      let aiSections = 0;

      // 7a. Report type sections
      for (const type of reportTypes) {
        const sectionName = this.promptEngine.getPromptForType(type);
        const prompt = `${basePrompt}\n\n=== YOUR TASK ===\nWrite ONLY this section: "${sectionName}".\nProvide a thorough, multi-paragraph analysis with concrete data references.\nUse markdown headings (##, ###), bullet points, and structured paragraphs.\nAim for at least 800 words.`;

        const generated = await this.llmStrategy
          .generate(prompt, type)
          .catch((error: unknown) => {
            const errMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(
              `[AI Error] Failed to generate section '${type}': ${errMsg}`,
              error instanceof Error ? error.stack : undefined,
            );
            return {
              text: this.fallbackService.buildFallbackForKey(
                type,
                fallbackContext,
              ),
              source: 'fallback' as const,
            };
          });

        // Delay to respect API rate limits
        await this.sleep(2000);

        if (generated.source === 'fallback') fallbackSections += 1;
        else aiSections += 1;

        sections.push({
          type,
          title: this.promptEngine.getTypeLabel(type),
          text: generated.text,
          chartData: this.getChartDataForSection(
            type,
            financialRows as FinancialRow[],
            report.language,
          ),
        });
      }

      // 7b. Additional sections
      for (const section of snapshot.sections) {
        if (section === ReportSection.EXECUTIVE_SUMMARY) continue;
        const key = `SECTION_${section}`;
        const sectionName = this.promptEngine.getSectionName(section);
        const prompt = `${basePrompt}\n\n=== YOUR TASK ===\nWrite ONLY this section: "${sectionName}".\nProvide a thorough, multi-paragraph analysis.\nUse markdown headings (##, ###), bullet points.\nAim for at least 600 words.`;

        const generated = await this.llmStrategy
          .generate(prompt, key)
          .catch((error: unknown) => {
            const errMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(
              `[AI Error] Failed to generate section '${key}': ${errMsg}`,
              error instanceof Error ? error.stack : undefined,
            );
            return {
              text: this.fallbackService.buildFallbackForKey(
                key,
                fallbackContext,
              ),
              source: 'fallback' as const,
            };
          });

        // Delay to respect API rate limits
        await this.sleep(2000);

        if (generated.source === 'fallback') fallbackSections += 1;
        else aiSections += 1;

        sections.push({
          type: key,
          title: sectionName,
          text: generated.text,
          chartData: this.getChartDataForSection(
            section,
            financialRows as FinancialRow[],
            report.language,
          ),
        });
      }

      // 7c. Executive Summary (generated LAST — synthesizes all sections)
      const summaryGenerated = await this.llmStrategy
        .generate(
          `${basePrompt}\n\n=== YOUR TASK ===\nWrite an Executive Summary synthesizing ALL the following sections:\n${sections.map((s) => `- ${s.title}`).join('\n')}\nHighlight 3 strengths, 3 risks, and 3 priority recommendations.\nAim for at least 500 words.`,
          'EXECUTIVE_SUMMARY',
        )
        .catch((error: unknown) => {
          const errMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(
            `[AI Error] Failed to generate section 'EXECUTIVE_SUMMARY': ${errMsg}`,
            error instanceof Error ? error.stack : undefined,
          );
          return {
            text: this.fallbackService.buildFallbackForKey(
              'EXECUTIVE_SUMMARY',
              fallbackContext,
            ),
            source: 'fallback' as const,
          };
        });

      if (summaryGenerated.source === 'fallback') fallbackSections += 1;
      else aiSections += 1;

      sections.unshift({
        type: 'EXECUTIVE_SUMMARY',
        title: this.promptEngine.getSectionName(
          ReportSection.EXECUTIVE_SUMMARY,
        ),
        text: summaryGenerated.text,
      });

      // ─── 8. Company Branding ───
      const branding: CompanyBranding = {
        companyName: company?.name ?? 'Enterprise',
        logoUrl: snapshot.logoBase64 || company?.logoUrl,
        primaryColor: snapshot.primaryColor || company?.primaryColor || '#1E3A5F',
        secondaryColor: snapshot.secondaryColor || company?.secondaryColor || '#2563EB',
      };

      // ─── 9. Generate PDF ───
      const { buffer, pageCount } = await this.pdfCore.generateReport({
        reportId,
        companyId: report.companyId,
        language: report.language,
        sections,
        branding,
        pageBudget,
        benchmark,
        benchmarkDeltas,
      });

      // ─── 10. Save & Update ───
      const filePath = await this.storage.saveReport(
        report.companyId,
        reportId,
        buffer,
      );

      await this.prisma.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.COMPLETED,
          pageCount,
          artifactPath: filePath,
          generatedAt: new Date(),
          content: {
            batchId: batch.id,
            hasPrediction: prediction?.hasPrediction ?? false,
            predictionStatus: prediction?.status ?? null,
            generatedFile: filePath,
            generatedFormat: 'pdf',
            requestedPages: pageBudget.total,
            generatedPages: pageCount,
            includeCharts: snapshot.includeCharts,
            analysisDepth: snapshot.analysisDepth,
            aiUsed: aiSections > 0,
            aiSource:
              fallbackSections === 0
                ? this.llmStrategy.getHealth().primary
                : aiSections === 0
                  ? 'fallback'
                  : 'mixed',
            fallbackSections,
            sections: sections.map((s) => s.title),
          } as Prisma.InputJsonValue,
        },
      });

      this.logger.log(
        `Report ${reportId} completed: ${pageCount} pages, ${aiSections} AI sections, ${fallbackSections} fallback sections`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Coordination failed';
      this.logger.error(`Report ${reportId} error: ${message}`);
      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.FAILED, error: message },
      });
      throw error;
    }
  }

  // ─── Page Budget Calculator ───

  private computePageBudget(
    lengthProfile: ReportLengthProfile | string,
    sectionCount: number,
    hasBenchmark: boolean,
  ): PageBudget {
    switch (lengthProfile) {
      case ReportLengthProfile.SHORT:
        return {
          cover: 1,
          toc: 1,
          executiveSummary: 1,
          sections: Math.max(1, sectionCount),
          benchmark: hasBenchmark ? 1 : 0,
          recommendations: 1,
          annexes: 0,
          total: 5,
        };
      case ReportLengthProfile.LONG:
        return {
          cover: 1,
          toc: 1,
          executiveSummary: 2,
          sections: Math.max(3, sectionCount * 2),
          benchmark: hasBenchmark ? 2 : 0,
          recommendations: 2,
          annexes: 3,
          total: 18,
        };
      case ReportLengthProfile.MEDIUM:
      default:
        return {
          cover: 1,
          toc: 1,
          executiveSummary: 1,
          sections: Math.max(2, sectionCount * 2),
          benchmark: hasBenchmark ? 1 : 0,
          recommendations: 1,
          annexes: 1,
          total: 10,
        };
    }
  }

  // ─── Chart Data for Sections (backend-controlled, NOT LLM) ───

  private getChartDataForSection(
    type: string,
    rows: FinancialRow[],
    lang: string,
  ): ChartData | undefined {
    if (rows.length === 0) return undefined;

    const isFr = lang === 'FR';
    const isAr = lang === 'AR';

    // Helper: get last 12 data points for a specific metric
    const getMetricSeries = (metricName: string) =>
      rows
        .filter((r) => r.metric === metricName)
        .slice(-12)
        .map((r) => ({
          label: this.shortPeriod(r.period),
          value: this.safeNumber(r.value),
        }));

    const getMetricSeriesAbs = (metricName: string) =>
      rows
        .filter((r) => r.metric === metricName)
        .slice(-12)
        .map((r) => ({
          label: this.shortPeriod(r.period),
          value: Math.abs(this.safeNumber(r.value)),
        }));

    const getMetricSeriesLike = (keyword: string) =>
      rows
        .filter((r) => (r.metric ?? '').toLowerCase().includes(keyword))
        .slice(-12)
        .map((r) => ({
          label: this.shortPeriod(r.period),
          value: this.safeNumber(r.value),
        }));

    const label = (fr: string, en: string, ar: string) =>
      isAr ? ar : isFr ? fr : en;

    switch (type) {
      case 'FINANCIAL':
      case ReportSection.FINANCIAL_OVERVIEW:
        return {
          type: 'dual_axis',
          title: label('Revenus vs Dépenses Opérationnelles', 'Revenue vs OpEx', 'الإيرادات مقابل المصاريف التشغيلية'),
          series: getMetricSeries('Gross_Revenue'),
          compareSeries: getMetricSeriesAbs('Operating_Expenses_Total'),
          metricName: 'Revenue_vs_OpEx',
        };
      case 'STRATEGIC':
      case ReportSection.SWOT_ANALYSIS:
        return {
          type: 'area',
          title: label('Évolution de la Trésorerie', 'Cash Position Trend', 'تطور السيولة النقدية'),
          series: getMetricSeries('Cash_and_Equivalents'),
          metricName: 'Cash',
        };
      case 'VALUATION':
        return {
          type: 'bar',
          title: label('Croissance du Résultat Net', 'Net Income Growth', 'نمو صافي الدخل'),
          series: getMetricSeries('Net_Income'),
          metricName: 'NetIncome',
        };
      case 'OPERATIONAL':
      case ReportSection.PERFORMANCE_ANALYSIS:
        return {
          type: 'line',
          title: label('Dépenses Opérationnelles', 'Operating Expenses Trend', 'المصاريف التشغيلية'),
          series: getMetricSeries('Operating_Expenses_Total'),
          metricName: 'OpEx',
        };
      case 'MARKETING':
        return {
          type: 'line',
          title: label('Nouveaux Clients Acquis', 'New Customer Acquisition', 'العملاء الجدد المكتسبون'),
          series: getMetricSeriesLike('new_customers'),
          metricName: 'NewCustomers',
        };
      case 'RISK_ANALYSIS':
      case ReportSection.FORECASTS_TRENDS:
        return {
          type: 'area',
          title: label('Évolution du Cash Burn', 'Cash Burn Trend', 'تطور استهلاك النقدية'),
          series: getMetricSeriesAbs('Net_Cash_Burn'),
          metricName: 'Burn',
        };
      default:
        return undefined;
    }
  }

  // ─── Snapshot Parser ───

  private parseSnapshot(snapshot: unknown) {
    const raw = (snapshot && typeof snapshot === 'object' ? snapshot : {}) as {
      includeCharts?: boolean;
      includeBenchmark?: boolean;
      analysisDepth?: string;
      tone?: string;
      audience?: string;
      sections?: string[];
      primaryColor?: string;
      secondaryColor?: string;
      logoBase64?: string;
    };

    const analysisDepth =
      raw.analysisDepth &&
      Object.values(ReportAnalysisDepth).includes(
        raw.analysisDepth as ReportAnalysisDepth,
      )
        ? (raw.analysisDepth as ReportAnalysisDepth)
        : ReportAnalysisDepth.STANDARD;

    const tone =
      raw.tone &&
      Object.values(ReportTone).includes(raw.tone as ReportTone)
        ? (raw.tone as ReportTone)
        : ReportTone.PROFESSIONAL;

    const audience =
      raw.audience &&
      Object.values(ReportAudience).includes(raw.audience as ReportAudience)
        ? (raw.audience as ReportAudience)
        : ReportAudience.INTERNAL;

    const sections = Array.isArray(raw.sections)
      ? raw.sections.filter((v): v is ReportSection =>
          Object.values(ReportSection).includes(v as ReportSection),
        )
      : [];

    return {
      includeCharts: raw.includeCharts !== false,
      includeBenchmark: raw.includeBenchmark !== false,
      analysisDepth,
      tone,
      audience,
      sections,
      primaryColor: raw.primaryColor as string | undefined,
      secondaryColor: raw.secondaryColor as string | undefined,
      logoBase64: raw.logoBase64 as string | undefined,
    };
  }

  // ─── Helpers ───

  private languageToHuman(language: string): string {
    if (language === 'FR') return 'French';
    if (language === 'AR') return 'Arabic';
    return 'English';
  }

  private safeGrowth(current: number, previous: number): number {
    if (!Number.isFinite(previous) || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private safeRatio(numerator: number, denominator: number): number {
    if (!Number.isFinite(denominator) || denominator === 0) return 0;
    return numerator / denominator;
  }

  private shortPeriod(value: string | Date | undefined): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toISOString().slice(2, 7);
  }

  private safeNumber(val: any): number {
    const num = Number(val);
    return Number.isNaN(num) ? 0 : num;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
