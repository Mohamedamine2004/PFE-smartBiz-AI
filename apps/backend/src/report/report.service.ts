import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { Observable, interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { ReportCoordinatorService } from './report-coordinator.service';
import { LlmStrategyService } from './providers/llm-strategy.service';
import {
  GenerateReportDto,
  ReportAnalysisDepth,
  ReportTone,
} from './dto/generate-report.dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coordinator: ReportCoordinatorService,
    private readonly llmStrategy: LlmStrategyService,
  ) {}

  async createReportJob(
    companyId: string,
    userId: string,
    dto: GenerateReportDto,
  ) {
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
          primaryColor: dto.primaryColor,
          secondaryColor: dto.secondaryColor,
          logoBase64: dto.logoBase64,
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
      const message =
        error instanceof Error ? error.message : 'Unknown background error';
      this.logger.error(
        `Report ${report.id} background generation failed: ${message}`,
      );
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
      downloadable:
        report.status === ReportStatus.COMPLETED && !!report.artifactPath,
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
    const status = this.llmStrategy.getHealth();
    const connection = await this.llmStrategy.testConnection();

    return {
      ...status,
      test: connection,
      fallbackReason: connection.ok
        ? null
        : (connection.error ?? 'Unknown AI provider error'),
    };
  }

  streamReportProgress(
    companyId: string,
    reportId: string,
  ): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      // Verify report belongs to user's company
      this.prisma.report
        .findUnique({
          where: { id: reportId },
          select: { companyId: true },
        })
        .then((report) => {
          if (!report || report.companyId !== companyId) {
            subscriber.error(
              new ForbiddenException('Access denied for this report'),
            );
            return;
          }

          const subject = new Subject<void>();
          interval(1000)
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
                      data: JSON.stringify({
                        error: report?.error || 'Report generation failed',
                      }),
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

  private async processReport(reportId: string) {
    await this.coordinator.processReport(reportId);
  }
}
