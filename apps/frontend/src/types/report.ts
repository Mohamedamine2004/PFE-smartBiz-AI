// ─── Language ───
export const ReportLanguage = {
  FR: 'FR',
  EN: 'EN',
  AR: 'AR',
} as const;
export type ReportLanguage = (typeof ReportLanguage)[keyof typeof ReportLanguage];

// ─── Length Profile ───
export const ReportLengthProfile = {
  SHORT: 'SHORT',   // ~5 pages
  MEDIUM: 'MEDIUM', // ~10 pages
  LONG: 'LONG',     // ~18 pages
} as const;
export type ReportLengthProfile = (typeof ReportLengthProfile)[keyof typeof ReportLengthProfile];

// ─── Report Type (aligned with backend DTO) ───
export const ReportType = {
  FINANCIAL: 'FINANCIAL',
  STRATEGIC: 'STRATEGIC',
  MARKETING: 'MARKETING',
  OPERATIONAL: 'OPERATIONAL',
  VALUATION: 'VALUATION',
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

// ─── Audience (new — drives tone & vocabulary automatically) ───
export const ReportAudience = {
  INTERNAL: 'INTERNAL',
  INVESTORS: 'INVESTORS',
  BANK: 'BANK',
} as const;
export type ReportAudience = (typeof ReportAudience)[keyof typeof ReportAudience];

// ─── Analysis Depth (kept for compatibility) ───
export const ReportAnalysisDepth = {
  LIGHT: 'LIGHT',
  STANDARD: 'STANDARD',
  DEEP: 'DEEP',
} as const;
export type ReportAnalysisDepth = (typeof ReportAnalysisDepth)[keyof typeof ReportAnalysisDepth];

// ─── Tone (kept for compatibility, now auto-derived from audience) ───
export const ReportTone = {
  PROFESSIONAL: 'PROFESSIONAL',
  ANALYTICAL: 'ANALYTICAL',
  EXECUTIVE: 'EXECUTIVE',
  CONSULTATIVE: 'CONSULTATIVE',
} as const;
export type ReportTone = (typeof ReportTone)[keyof typeof ReportTone];

// ─── Sections (auto-selected by backend, kept for reference) ───
export const ReportSection = {
  EXECUTIVE_SUMMARY: 'EXECUTIVE_SUMMARY',
  SWOT_ANALYSIS: 'SWOT_ANALYSIS',
  PERFORMANCE_ANALYSIS: 'PERFORMANCE_ANALYSIS',
  FINANCIAL_OVERVIEW: 'FINANCIAL_OVERVIEW',
  RECOMMENDATIONS: 'RECOMMENDATIONS',
  FORECASTS_TRENDS: 'FORECASTS_TRENDS',
  BENCHMARK: 'BENCHMARK',
} as const;
export type ReportSection = (typeof ReportSection)[keyof typeof ReportSection];

// ─── Simplified 5-Question Payload ───
export interface GenerateReportPayload {
  batchId?: string;
  /** Q1: Type d'analyse */
  reportTypes: ReportType[];
  /** Q2: Audience cible */
  audience: ReportAudience;
  /** Q3: Langue */
  language: ReportLanguage;
  /** Q4: Longueur */
  lengthProfile: ReportLengthProfile;
  /** Q5: Défi principal (optionnel) */
  problemStatement?: string;
  /** Advanced — auto-derived, optional override */
  includeCharts?: boolean;
  includeBenchmark?: boolean;
  /** Custom: Selected Sections */
  sections?: ReportSection[];
  /** Custom: Colors */
  primaryColor?: string;
  secondaryColor?: string;
  /** Custom: Logo (base64) */
  logoBase64?: string;
}

// ─── API Response Types ───
export interface ReportJobSummary {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  language: string;
  lengthProfile: string;
  reportTypes: string[];
  pageCount?: number | null;
  createdAt: string;
  generatedAt?: string | null;
  error?: string | null;
}

export interface ReportJobStatus extends ReportJobSummary {
  downloadable: boolean;
  artifactPath?: string | null;
}

// ─── Benchmark Delta (from backend) ───
export interface BenchmarkDelta {
  metric: string;
  companyValue: number;
  sectorMedian: number;
  deltaPercent: number;
  interpretation: 'above' | 'below' | 'equal';
}
