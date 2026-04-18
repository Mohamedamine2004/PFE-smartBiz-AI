import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PredictionModule } from '../prediction/prediction.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportPdfService } from './report-pdf.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [PrismaModule, PredictionModule],
  controllers: [ReportController],
  providers: [ReportService, ReportPdfService, GeminiService],
})
export class ReportModule {}
