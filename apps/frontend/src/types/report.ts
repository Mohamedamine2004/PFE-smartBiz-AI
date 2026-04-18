export const ReportLanguage = {
  FR: 'FR',
  EN: 'EN',
  AR: 'AR',
} as const;

export type ReportLanguage = (typeof ReportLanguage)[keyof typeof ReportLanguage];

export const ReportLengthProfile = {
  SHORT: 'SHORT',
  MEDIUM: 'MEDIUM',
  LONG: 'LONG',
} as const;

export type ReportLengthProfile =
  (typeof ReportLengthProfile)[keyof typeof ReportLengthProfile];

export const ReportType = {
  FINANCIAL: 'FINANCIAL',
  BUSINESS_DESCRIPTION: 'BUSINESS_DESCRIPTION',
  RISK_ANALYSIS: 'RISK_ANALYSIS',
  ACTION_PLAN: 'ACTION_PLAN',
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const ReportAnalysisDepth = {
  LIGHT: 'LIGHT',
  STANDARD: 'STANDARD',
  DEEP: 'DEEP',
} as const;

export type ReportAnalysisDepth =
  (typeof ReportAnalysisDepth)[keyof typeof ReportAnalysisDepth];

export const ReportTone = {
  PROFESSIONAL: 'PROFESSIONAL',
  ANALYTICAL: 'ANALYTICAL',
  EXECUTIVE: 'EXECUTIVE',
  CONSULTATIVE: 'CONSULTATIVE',
} as const;

export type ReportTone = (typeof ReportTone)[keyof typeof ReportTone];

export const ReportSection = {
  EXECUTIVE_SUMMARY: 'EXECUTIVE_SUMMARY',
  SWOT_ANALYSIS: 'SWOT_ANALYSIS',
  PERFORMANCE_ANALYSIS: 'PERFORMANCE_ANALYSIS',
  FINANCIAL_OVERVIEW: 'FINANCIAL_OVERVIEW',
  RECOMMENDATIONS: 'RECOMMENDATIONS',
  FORECASTS_TRENDS: 'FORECASTS_TRENDS',
} as const;

export type ReportSection = (typeof ReportSection)[keyof typeof ReportSection];

export interface GenerateReportPayload {
  batchId?: string;
  language: ReportLanguage;
  lengthProfile: ReportLengthProfile;
  reportTypes: ReportType[];
  analysisDepth?: ReportAnalysisDepth;
  problemStatement?: string;
  includeCharts?: boolean;
  tone?: ReportTone;
  sections?: ReportSection[];
}

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
