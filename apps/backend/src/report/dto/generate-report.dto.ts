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

export enum ReportLanguage {
  FR = 'FR',
  EN = 'EN',
  AR = 'AR',
}

export enum ReportLengthProfile {
  SHORT = 'SHORT',
  MEDIUM = 'MEDIUM',
  LONG = 'LONG',
}

export enum ReportType {
  FINANCIAL = 'FINANCIAL',
  BUSINESS_DESCRIPTION = 'BUSINESS_DESCRIPTION',
  RISK_ANALYSIS = 'RISK_ANALYSIS',
  ACTION_PLAN = 'ACTION_PLAN',
}

export enum ReportAnalysisDepth {
  LIGHT = 'LIGHT',
  STANDARD = 'STANDARD',
  DEEP = 'DEEP',
}

export enum ReportTone {
  PROFESSIONAL = 'PROFESSIONAL',
  ANALYTICAL = 'ANALYTICAL',
  EXECUTIVE = 'EXECUTIVE',
  CONSULTATIVE = 'CONSULTATIVE',
}

export enum ReportSection {
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
  SWOT_ANALYSIS = 'SWOT_ANALYSIS',
  PERFORMANCE_ANALYSIS = 'PERFORMANCE_ANALYSIS',
  FINANCIAL_OVERVIEW = 'FINANCIAL_OVERVIEW',
  RECOMMENDATIONS = 'RECOMMENDATIONS',
  FORECASTS_TRENDS = 'FORECASTS_TRENDS',
}

export class GenerateReportDto {
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsEnum(ReportLanguage)
  language: ReportLanguage = ReportLanguage.FR;

  @IsEnum(ReportLengthProfile)
  lengthProfile: ReportLengthProfile = ReportLengthProfile.MEDIUM;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(ReportType, { each: true })
  reportTypes: ReportType[] = [ReportType.FINANCIAL];

  @IsOptional()
  @IsEnum(ReportAnalysisDepth)
  analysisDepth?: ReportAnalysisDepth = ReportAnalysisDepth.STANDARD;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  problemStatement?: string;

  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean = true;

  @IsOptional()
  @IsEnum(ReportTone)
  tone?: ReportTone = ReportTone.PROFESSIONAL;

  @IsOptional()
  @IsArray()
  @IsEnum(ReportSection, { each: true })
  sections?: ReportSection[] = [];
}
