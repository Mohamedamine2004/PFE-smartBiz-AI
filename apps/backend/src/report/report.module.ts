import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PredictionModule } from '../prediction/prediction.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportPdfService } from './report-pdf.service';
import { ReportCoordinatorService } from './report-coordinator.service';
import { ReportDataAssembler } from './report-data-assembler.service';
import { ReportStorageService } from './report-storage.service';
import { PromptEngineService } from './prompt-engine.service';
import { FallbackContentService } from './fallback-content.service';
import { GeminiProviderService } from './providers/gemini-provider.service';
import { OpenRouterProviderService } from './providers/open-router-provider.service';
import { LlmStrategyService } from './providers/llm-strategy.service';
import { PdfCoreService } from './pdf/pdf-core.service';
import { PdfComponentsService } from './pdf/pdf-components.service';
import { PdfChartDrawer } from './pdf/pdf-chart-drawer.service';
import { BenchmarkService } from './benchmark/benchmark.service';

@Module({
  imports: [PrismaModule, PredictionModule],
  controllers: [ReportController],
  providers: [
    ReportService,
    ReportPdfService,
    ReportCoordinatorService,
    ReportDataAssembler,
    ReportStorageService,
    PromptEngineService,
    FallbackContentService,
    GeminiProviderService,
    OpenRouterProviderService,
    LlmStrategyService,
    PdfCoreService,
    PdfComponentsService,
    PdfChartDrawer,
    BenchmarkService,
  ],
  exports: [ReportService],
})
export class ReportModule {}
