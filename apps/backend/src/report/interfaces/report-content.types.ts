import {
  ReportAudience,
  ReportSection,
  ReportTone,
  ReportType,
} from '../dto/generate-report.dto';

// ─── Core Data Types ───

export type ReportContentSource = 'gemini' | 'xai' | 'openrouter' | 'fallback' | 'mixed';

export interface FinancialRow {
  metric?: string;
  value?: number;
  period?: string | Date;
}

export interface PredictionSummary {
  hasPrediction: boolean;
  status?: string;
  createdAt?: string | Date;
}

export interface ReportKpis {
  cac: number;
  ltv: number;
  tam: number;
  marketShare: number;
  employeeCount: number;
}

// ─── Benchmark Types ───

export interface SectorBenchmark {
  sectorKey: string;
  sectorLabel: string;
  grossMarginMedian: number;
  netMarginMedian: number;
  cacMedian: number;
  ltvCacRatioMedian: number;
  churnRateMedian: number;
  revenueGrowthMedian: number;
  debtRatioMedian: number;
  source: 'database' | 'static';
  sampleSize: number;
}

export interface BenchmarkDelta {
  metric: string;
  companyValue: number;
  sectorMedian: number;
  deltaPercent: number;
  interpretation: 'above' | 'below' | 'equal';
}

// ─── Branding Types ───

export interface CompanyBranding {
  companyName: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
}

// ─── Chart Types ───

export interface ChartData {
  type: 'bar' | 'line' | 'area' | 'donut' | 'benchmark_comparison' | 'dual_axis';
  title: string;
  series: Array<{ label: string; value: number }>;
  metricName: string;
  /** Optional second series for comparison charts */
  compareSeries?: Array<{ label: string; value: number }>;
}

export interface SectionContent {
  type: string;
  title: string;
  text: string;
  chartData?: ChartData;
}

// ─── Generation Types ───

export interface GeneratedReportText {
  content: Record<string, string>;
  aiUsed: boolean;
  source: ReportContentSource;
  fallbackSections: number;
}

export interface GeneratePromptContext {
  locale: string;
  annual: Record<string, number>;
  growthYoy: number;
  growth2Y: number;
  kpis?: ReportKpis;
  ltvCac: number;
  monthlyTable: string;
  analysisDepth: string;
  problemStatement?: string;
  tone: ReportTone;
  audience: ReportAudience;
  pagesPerSection: number;
  prediction: PredictionSummary;
  benchmark?: SectorBenchmark;
  benchmarkDeltas?: BenchmarkDelta[];
  currency?: string;
}

export interface FallbackContext {
  reportTypes: ReportType[];
  requestedSections: ReportSection[];
  financialData: FinancialRow[];
  annual: Record<string, number>;
  metrics: Record<string, number>;
  kpis?: ReportKpis;
  prediction: PredictionSummary;
  problemStatement?: string;
  language: string;
  currency?: string;
}

// ─── PDF Rendering Types ───

/** Page budget: how many pages each structural block should occupy */
export interface PageBudget {
  cover: 1;
  toc: 1;
  executiveSummary: number;
  sections: number;
  benchmark: number;
  recommendations: number;
  annexes: number;
  total: number;
}

export interface PdfTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  accentSoft: string;
  coverBg: string;
  pageBg: string;
  sectionBg: string;
  tableBg: string;
  tableHeaderBg: string;
  highlightBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textWhite: string;
  textOnDark: string;
  success: string;
  warning: string;
  danger: string;
  borderLight: string;
  borderMedium: string;
  chartColors: string[];
}

export interface PdfFonts {
  heading: string;
  body: string;
  mono: string;
}

export interface PdfRenderOptions {
  contentW: number;
  theme: PdfTheme;
  fonts: PdfFonts;
  leftMargin: number;
  isRTL: boolean;
}
