import { ReportContentSource } from './report-content.types';
import { ReportSection, ReportType } from '../dto/generate-report.dto';
import {
  FallbackContext,
  FinancialRow,
  GeneratePromptContext,
  GeneratedReportText,
  PredictionSummary,
} from './report-content.types';

export interface LlmProvider {
  readonly name: Extract<ReportContentSource, 'gemini' | 'xai' | 'openrouter'>;
  isConfigured(): boolean;
  generateSection(prompt: string, sectionKey: string): Promise<string>;
  testConnection(): Promise<{ ok: boolean; error?: string }>;
  getModel(): string;
}

export interface PromptEngine {
  buildBasePrompt(input: GeneratePromptContext): string;
  getPromptForType(type: ReportType): string;
  getSectionName(type: ReportSection, language?: string): string;
  capPrompt(prompt: string): string;
  buildMonthlyTable(financialData: FinancialRow[]): string;
}

export interface FallbackContentProvider {
  generateComprehensiveFallback(input: FallbackContext): Record<string, string>;
  buildFallbackForKey(key: string, context: FallbackContext): string;
}

export interface PdfRenderer {
  generateReportPdf(
    input: PdfRenderInput,
  ): Promise<{ buffer: Buffer; pageCount: number }>;
}

export interface ChartSeriesExtractor {
  extractRevenueSeries(
    financialRows: FinancialRow[],
    annualRevenueSeries?: Array<{ label: string; value: number }>,
  ): Array<{ label: string; value: number }>;
  extractSeriesForSection(
    sectionType: string,
    financialRows: FinancialRow[],
  ): Array<{ label: string; value: number }>;
}

export interface ReportTextGenerator {
  getHealthStatus(): {
    provider: 'xai' | 'openrouter' | 'none';
    configured: boolean;
    model: string;
    keyPresent: boolean;
  };
  testConnection(): Promise<{ ok: boolean; model: string; error?: string }>;
  generateReportText(
    input: ReportGenerationInput,
  ): Promise<GeneratedReportText>;
}

export interface PdfRenderInput {
  reportId: string;
  companyId: string;
  language: string;
  lengthProfile: string;
  reportTypes: string[];
  targetPages: number;
  analysisDepth: string;
  includeCharts: boolean;
  problemStatement: string;
  batchId: string;
  generatedAtIso: string;
  financialRows: FinancialRow[];
  annualRevenueSeries?: Array<{ label: string; value: number }>;
  prediction: PredictionSummary;
  aiContent: Record<string, string>;
  aiSource?: ReportContentSource;
}

export interface ReportGenerationInput {
  reportTypes: ReportType[];
  language: string;
  financialData: FinancialRow[];
  annualData?: Record<string, unknown>;
  kpis?: {
    cac: number;
    ltv: number;
    tam: number;
    marketShare: number;
    employeeCount: number;
  };
  prediction: PredictionSummary;
  analysisDepth?: string;
  problemStatement?: string;
  tone?: string;
  sections?: ReportSection[];
  targetPages?: number;
}
