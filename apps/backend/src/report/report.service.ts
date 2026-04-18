import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Observable, interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { PredictionService } from '../prediction/prediction.service';
import { ReportPdfService } from './report-pdf.service';
import { GeminiService } from './gemini.service';
import {
  GenerateReportDto,
  ReportAnalysisDepth,
  ReportLengthProfile,
  ReportSection,
  ReportTone,
  ReportType,
} from './dto/generate-report.dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly predictionService: PredictionService,
    private readonly reportPdfService: ReportPdfService,
    private readonly geminiService: GeminiService,
  ) {}

  async createReportJob(companyId: string, userId: string, dto: GenerateReportDto) {
    const report = await this.prisma.report.create({
      data: {
        companyId,
        userId,
        status: ReportStatus.QUEUED,
        language: dto.language,
        lengthProfile: dto.lengthProfile,
        reportTypes: dto.reportTypes,
        problemStatement: dto.problemStatement ?? null,
        batchId: dto.batchId ?? null,
        snapshot: {
          includeCharts: dto.includeCharts ?? true,
          analysisDepth: dto.analysisDepth ?? ReportAnalysisDepth.STANDARD,
          tone: dto.tone ?? ReportTone.PROFESSIONAL,
          sections: dto.sections ?? [],
          requestedAt: new Date().toISOString(),
        },
      },
      select: {
        id: true,
        status: true,
        language: true,
        lengthProfile: true,
        reportTypes: true,
        createdAt: true,
      },
    });

    void this.processReport(report.id).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown background error';
      this.logger.error(`Report ${report.id} background generation failed: ${message}`);
    });

    return report;
  }

  async listReports(companyId: string, limit = 20) {
    return this.prisma.report.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      select: {
        id: true,
        status: true,
        language: true,
        lengthProfile: true,
        reportTypes: true,
        pageCount: true,
        createdAt: true,
        generatedAt: true,
        error: true,
      },
    });
  }

  async getReportStatus(companyId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        companyId: true,
        status: true,
        language: true,
        lengthProfile: true,
        reportTypes: true,
        pageCount: true,
        createdAt: true,
        generatedAt: true,
        error: true,
        artifactPath: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (report.companyId !== companyId) {
      throw new ForbiddenException('Access denied for this report');
    }

    return {
      ...report,
      downloadable: report.status === ReportStatus.COMPLETED && !!report.artifactPath,
    };
  }

  async getDownloadInfo(companyId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        companyId: true,
        status: true,
        artifactPath: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (report.companyId !== companyId) {
      throw new ForbiddenException('Access denied for this report');
    }
    if (report.status !== ReportStatus.COMPLETED || !report.artifactPath) {
      throw new NotFoundException('Report artifact is not ready yet');
    }

    return {
      path: report.artifactPath,
      filename: `report-${report.id}.pdf`,
    };
  }

  async deleteReport(companyId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { companyId: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (report.companyId !== companyId) {
      throw new ForbiddenException('Access denied for this report');
    }

    await this.prisma.report.delete({
      where: { id: reportId },
    });

    return { success: true };
  }

  async getAiHealth() {
    const status = this.geminiService.getHealthStatus();
    const connection = await this.geminiService.testConnection();

    return {
      ...status,
      test: connection,
      fallbackReason: connection.ok ? null : connection.error ?? 'Unknown AI provider error',
    };
  }

  streamReportProgress(companyId: string, reportId: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      // Verify report belongs to user's company
      this.prisma.report
        .findUnique({
          where: { id: reportId },
          select: { companyId: true },
        })
        .then((report) => {
          if (!report || report.companyId !== companyId) {
            subscriber.error(new ForbiddenException('Access denied for this report'));
            return;
          }

          const subject = new Subject<void>();
          const pollingInterval$ = interval(1000)
            .pipe(
              switchMap(async () => {
                const latest = await this.prisma.report.findUnique({
                  where: { id: reportId },
                  select: { status: true, error: true },
                });
                return latest;
              }),
              takeUntil(subject),
            )
            .subscribe(
              (report) => {
                if (report?.status === ReportStatus.COMPLETED) {
                  subscriber.next(
                    new MessageEvent('complete', {
                      data: JSON.stringify({ status: 'completed' }),
                    }),
                  );
                  subject.next();
                  subscriber.complete();
                } else if (report?.status === ReportStatus.FAILED) {
                  subscriber.next(
                    new MessageEvent('error', {
                      data: JSON.stringify({ error: report?.error || 'Report generation failed' }),
                    }),
                  );
                  subject.next();
                  subscriber.complete();
                } else {
                  subscriber.next(
                    new MessageEvent('progress', {
                      data: JSON.stringify({ status: report?.status }),
                    }),
                  );
                }
              },
              (error) => {
                subscriber.error(error);
                subject.next();
              },
            );

          return () => {
            subject.next();
            subject.complete();
          };
        })
        .catch((error) => subscriber.error(error));
    });
  }

  private getTargetPageCount(lengthProfile: ReportLengthProfile, analysisDepth: ReportAnalysisDepth) {
    const base = (() => {
      switch (lengthProfile) {
        case ReportLengthProfile.SHORT:
          return 11;
        case ReportLengthProfile.LONG:
          return 22;
        default:
          return 16;
      }
    })();

    if (analysisDepth === ReportAnalysisDepth.DEEP) {
      return base + 2;
    }
    if (analysisDepth === ReportAnalysisDepth.LIGHT) {
      return Math.max(10, base - 1);
    }

    return base;
  }

  private parseSnapshot(snapshot: unknown) {
    const raw = (snapshot && typeof snapshot === 'object' ? snapshot : {}) as {
      includeCharts?: boolean;
      analysisDepth?: string;
      tone?: string;
      sections?: string[];
    };

    const depth =
      raw.analysisDepth && Object.values(ReportAnalysisDepth).includes(raw.analysisDepth as ReportAnalysisDepth)
        ? (raw.analysisDepth as ReportAnalysisDepth)
        : ReportAnalysisDepth.STANDARD;

    const tone =
      raw.tone && Object.values(ReportTone).includes(raw.tone as ReportTone)
        ? (raw.tone as ReportTone)
        : ReportTone.PROFESSIONAL;

    const sections = Array.isArray(raw.sections)
      ? raw.sections.filter((value): value is ReportSection =>
          Object.values(ReportSection).includes(value as ReportSection),
        )
      : [];

    return {
      includeCharts: raw.includeCharts !== false,
      analysisDepth: depth,
      tone,
      sections,
    };
  }

  private getReadableReportType(type: ReportType) {
    switch (type) {
      case ReportType.FINANCIAL:
        return 'Financial Analysis';
      case ReportType.BUSINESS_DESCRIPTION:
        return 'Business Description';
      case ReportType.RISK_ANALYSIS:
        return 'Risk Analysis';
      case ReportType.ACTION_PLAN:
        return 'Action Plan';
      default:
        return 'Section';
    }
  }

  private async processReport(reportId: string) {
    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.PROCESSING, error: null },
    });

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found after queueing');
    }

    try {
      const batch = report.batchId
        ? await this.prisma.importBatch.findFirst({
            where: { id: report.batchId, companyId: report.companyId },
          })
        : await this.prisma.importBatch.findFirst({
            where: { companyId: report.companyId },
            orderBy: { createdAt: 'desc' },
          });

      if (!batch) {
        throw new Error('No imported data found for report generation');
      }

      const prediction = await this.predictionService.getLatestPrediction(
        report.companyId,
        batch.id,
      );

      const financialRows = await this.prisma.financialData.findMany({
        where: { batchId: batch.id },
        orderBy: { period: 'asc' },
      });

      const snapshot = this.parseSnapshot(report.snapshot);
      const targetPages = this.getTargetPageCount(
        report.lengthProfile as ReportLengthProfile,
        snapshot.analysisDepth,
      );
      const generatedAtIso = new Date().toISOString();

      // Generate AI Content
      const generationResult = await this.geminiService.generateReportText({
        reportTypes: report.reportTypes as ReportType[],
        language: report.language,
        financialData: financialRows,
        annualData: (batch.macroFeatures ?? {}) as Record<string, unknown>,
        kpis: {
          cac: Number(batch.cac ?? 0),
          ltv: Number(batch.ltv ?? 0),
          tam: Number(batch.tam ?? 0),
          marketShare: Number(batch.marketShare ?? 0),
          employeeCount: Number(batch.employeeCount ?? 0),
        },
        prediction: prediction,
        analysisDepth: snapshot.analysisDepth,
        problemStatement: report.problemStatement ?? undefined,
        tone: snapshot.tone,
        sections: snapshot.sections,
        targetPages,
      });

      const aiContent = generationResult.content;

      const macroFeatures = (batch.macroFeatures ?? {}) as Record<string, unknown>;
      const annualRevenueSeries = [
        { label: 'N-2', value: this.parseNumeric(macroFeatures.Revenues_N_2) },
        { label: 'N-1', value: this.parseNumeric(macroFeatures.Revenues_N_1) },
        { label: 'N', value: this.parseNumeric(macroFeatures.Revenues_N) },
      ];

      const { buffer, pageCount } = await this.reportPdfService.generateReportPdf({
        reportId: report.id,
        companyId: report.companyId,
        language: report.language,
        lengthProfile: report.lengthProfile,
        reportTypes: report.reportTypes,
        targetPages,
        analysisDepth: snapshot.analysisDepth,
        includeCharts: snapshot.includeCharts,
        problemStatement: report.problemStatement ?? '',
        batchId: batch.id,
        generatedAtIso,
        financialRows,
        annualRevenueSeries,
        prediction: {
          hasPrediction: prediction?.hasPrediction ?? false,
          status: prediction?.status,
          createdAt: prediction?.createdAt,
        },
        aiContent,
        aiSource: generationResult.source,
      });

      const dir = join(process.cwd(), 'reports', 'generated', report.companyId);
      await mkdir(dir, { recursive: true });
      const filePath = join(dir, `${report.id}.pdf`);
      await writeFile(filePath, buffer);

      await this.prisma.report.update({
        where: { id: report.id },
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
            requestedPages: targetPages,
            generatedPages: pageCount,
            includeCharts: snapshot.includeCharts,
            analysisDepth: snapshot.analysisDepth,
            aiUsed: generationResult.aiUsed,
            aiSource: generationResult.source,
            fallbackSections: generationResult.fallbackSections,
            sections: (report.reportTypes as ReportType[]).map((type) => this.getReadableReportType(type)),
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown generation error';

      await this.prisma.report.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.FAILED,
          error: message,
        },
      });

      throw error;
    }
  }

  private parseNumeric(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      const normalized = value.replace(/[^0-9.-]/g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }
}
