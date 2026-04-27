import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

// ─── Report Language ───
export enum ReportLanguage {
  FR = 'FR',
  EN = 'EN',
  AR = 'AR',
}

// ─── Report Length Profile (3 tiers with guaranteed page budgets) ───
export enum ReportLengthProfile {
  /** ~5 pages : Cover + TOC + Summary + 1 Section + Recommendations */
  SHORT = 'SHORT',
  /** ~10 pages : SHORT + 3 detailed sections + charts + benchmark */
  MEDIUM = 'MEDIUM',
  /** ~15-20 pages : MEDIUM + all analyses + valuation + annexes */
  LONG = 'LONG',
}

// ─── Report Type (the primary analysis focus) ───
export enum ReportType {
  FINANCIAL = 'FINANCIAL',
  STRATEGIC = 'STRATEGIC',
  MARKETING = 'MARKETING',
  OPERATIONAL = 'OPERATIONAL',
  VALUATION = 'VALUATION',
}

// ─── Audience determines tone, vocabulary, and section order ───
export enum ReportAudience {
  /** Internal executive team — operational focus */
  INTERNAL = 'INTERNAL',
  /** Investors / Board — valuation & growth focus */
  INVESTORS = 'INVESTORS',
  /** Bank / Credit institution — solvability & cash flow focus */
  BANK = 'BANK',
}

// ─── Analysis Depth (kept for backward compatibility) ───
export enum ReportAnalysisDepth {
  LIGHT = 'LIGHT',
  STANDARD = 'STANDARD',
  DEEP = 'DEEP',
}

// ─── Tone derived automatically from audience, but can be overridden ───
export enum ReportTone {
  PROFESSIONAL = 'PROFESSIONAL',
  ANALYTICAL = 'ANALYTICAL',
  EXECUTIVE = 'EXECUTIVE',
  CONSULTATIVE = 'CONSULTATIVE',
}

// ─── Sections (auto-selected based on length + type, user doesn't pick) ───
export enum ReportSection {
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
  SWOT_ANALYSIS = 'SWOT_ANALYSIS',
  PERFORMANCE_ANALYSIS = 'PERFORMANCE_ANALYSIS',
  FINANCIAL_OVERVIEW = 'FINANCIAL_OVERVIEW',
  RECOMMENDATIONS = 'RECOMMENDATIONS',
  FORECASTS_TRENDS = 'FORECASTS_TRENDS',
  BENCHMARK = 'BENCHMARK',
}


export class GenerateReportDto {
  @IsOptional()
  @IsUUID()
  batchId?: string;

  // ─── Q1: Type d'analyse ───
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(ReportType, { each: true })
  reportTypes: ReportType[] = [ReportType.FINANCIAL];

  // ─── Q2: Audience cible ───
  @IsEnum(ReportAudience)
  audience: ReportAudience = ReportAudience.INTERNAL;

  // ─── Q3: Langue ───
  @IsEnum(ReportLanguage)
  language: ReportLanguage = ReportLanguage.FR;

  // ─── Q4: Longueur ───
  @IsEnum(ReportLengthProfile)
  lengthProfile: ReportLengthProfile = ReportLengthProfile.MEDIUM;

  // ─── Q5: Défi principal (optionnel) ───
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  problemStatement?: string;

  // ─── Advanced (auto-derived, rarely overridden) ───
  @IsOptional()
  @IsEnum(ReportAnalysisDepth)
  analysisDepth?: ReportAnalysisDepth;

  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean = true;

  @IsOptional()
  @IsEnum(ReportTone)
  tone?: ReportTone;

  @IsOptional()
  @IsBoolean()
  includeBenchmark?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsEnum(ReportSection, { each: true })
  sections?: ReportSection[] = [];

  // ─── Customization (Colors & Logo) ───
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  logoBase64?: string;
}
