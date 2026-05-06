import { Injectable, Logger } from '@nestjs/common';
import {
  ReportAudience,
  ReportSection,
  ReportType,
} from './dto/generate-report.dto';
import { PromptEngine } from './interfaces/report-services.interfaces';
import {
  BenchmarkDelta,
  FinancialRow,
  GeneratePromptContext,
  SectorBenchmark,
} from './interfaces/report-content.types';

/**
 * SRP: Prompt construction only — no LLM calls, no data fetching.
 * Builds structured prompts enriched with benchmark + audience context.
 */
@Injectable()
export class PromptEngineService implements PromptEngine {
  private readonly logger = new Logger(PromptEngineService.name);
  private readonly maxLlmPromptChars = 100_000;
  private readonly maxMonthlyTableChars = 45_000;

  buildBasePrompt(input: GeneratePromptContext): string {
    const {
      locale,
      annual,
      growthYoy,
      growth2Y,
      kpis,
      ltvCac,
      monthlyTable,
      analysisDepth,
      problemStatement,
      tone,
      audience,
      pagesPerSection,
      prediction,
      benchmark,
      benchmarkDeltas,
      currency,
    } = input;

    const audienceInstruction = this.getAudienceInstruction(audience, locale);
    const benchmarkBlock = this.buildBenchmarkBlock(benchmark, benchmarkDeltas);
    const currencyLabel = currency || 'USD';

    return `You are a senior business consultant generating a section of a formal report for a client on SmartBiz AI.

Write the output entirely in ${locale}.

=== AUDIENCE & TONE ===
${audienceInstruction}
Tone: ${tone}
Analysis depth: ${analysisDepth}
Target length for this section: about ${pagesPerSection} pages

=== COMPANY FINANCIAL DATA ===
Currency: ${currencyLabel} (IMPORTANT: Use ONLY this currency when referencing monetary values. Do NOT use dollars, USD, or any other currency.)
Annual Revenue (N): ${annual.Revenues_N}
Revenue Growth YoY: ${growthYoy.toFixed(1)}%
Revenue Growth 2Y: ${growth2Y.toFixed(1)}%
Net Income: ${annual.NetIncome_N}
Operating Income: ${annual.OperatingIncome_N}
Total Assets: ${annual.Assets_N}
Liabilities: ${annual.Liabilities_N}
Cash & Equivalents: ${annual.CashAndEquivalents_N}
CAC: ${kpis?.cac ?? 0}
LTV: ${kpis?.ltv ?? 0}
LTV/CAC Ratio: ${ltvCac.toFixed(1)}x
TAM: ${kpis?.tam ?? 0}
Market Share: ${((kpis?.marketShare ?? 0) * 100).toFixed(1)}%
Employees: ${kpis?.employeeCount ?? 0}

Monthly Trend (last 12 months):
${monthlyTable}

Prediction status: ${prediction.status ?? 'UNKNOWN'}

${benchmarkBlock}

Main business problem: ${problemStatement?.trim() || 'No specific problem provided'}

=== OUTPUT RULES ===
- Use markdown headings (## and ###) to structure the content.
- Use bullet points for lists and key takeaways.
- Reference ONLY real numeric values from the data above. Do NOT invent numbers.
- ALL monetary values MUST be expressed in ${currencyLabel}. Never use dollars, USD, or any other currency.
- Provide actionable recommendations backed by data.
- Write at least 600 words for a thorough analysis.
- Be concise, data-driven, and business-ready.
- EXTREMELY IMPORTANT: Do NOT blindly regurgitate all the raw metrics (CAC, LTV, Net Income, etc.) in every section. ONLY reference a metric if it is directly the focal point of your specific section. Focus exclusively on insights, strategic implications, and deep analysis pertinent to the current section domain. Eliminate redundancy.`;
  }

  getTypeLabel(type: ReportType | string, language?: string): string {
    if (language === 'AR') {
      switch (type) {
        case ReportType.FINANCIAL: return 'تحليل الأداء المالي';
        case ReportType.STRATEGIC: return 'تحليل استراتيجي';
        case ReportType.MARKETING: return 'تحليل التسويق';
        case ReportType.OPERATIONAL: return 'تحليل الأداء التشغيلي';
        case ReportType.VALUATION: return 'تقييم الشركة';
        default: return String(type);
      }
    }
    switch (type) {
      case ReportType.FINANCIAL:
        return 'Analyse Financière';
      case ReportType.STRATEGIC:
        return 'Analyse Stratégique';
      case ReportType.MARKETING:
        return 'Analyse Marketing';
      case ReportType.OPERATIONAL:
        return 'Analyse Opérationnelle';
      case ReportType.VALUATION:
        return 'Valorisation d\'Entreprise';
      default:
        return String(type);
    }
  }

  getPromptForType(type: ReportType | string): string {
    switch (type) {
      case ReportType.FINANCIAL:
        return 'Financial Analysis: Revenue trends, profitability, cash position, and financial ratios.';
      case ReportType.STRATEGIC:
        return 'Strategic Analysis: Market positioning, competitive landscape, SWOT, and growth strategy.';
      case ReportType.MARKETING:
        return 'Marketing Analysis: CAC efficiency, LTV optimization, customer acquisition channels, and ROI.';
      case ReportType.OPERATIONAL:
        return 'Operational Analysis: Cost structure, workforce productivity, process efficiency, and cash burn.';
      case ReportType.VALUATION:
        return 'Valuation Analysis: Enterprise Value, Equity Value, valuation multiples, and investor readiness.';
      default:
        return `${String(type)} Analysis: Professional analysis of this area.`;
    }
  }

  getSectionName(section: ReportSection | string, language?: string): string {
    if (language === 'AR') {
      switch (section) {
        case ReportSection.EXECUTIVE_SUMMARY: return 'ملخص تنفيذي';
        case ReportSection.SWOT_ANALYSIS: return 'تحليل نقاط القوة والضعف';
        case ReportSection.PERFORMANCE_ANALYSIS: return 'تحليل الأداء';
        case ReportSection.FINANCIAL_OVERVIEW: return 'نظرة عامة مالية';
        case ReportSection.RECOMMENDATIONS: return 'التوصيات';
        case ReportSection.FORECASTS_TRENDS: return 'التنبؤات والاتجاهات';
        case ReportSection.BENCHMARK: return 'المقارنة القطاعية';
        default: return 'قسم التقرير';
      }
    }
    switch (section) {
      case ReportSection.EXECUTIVE_SUMMARY:
        return 'Executive Summary';
      case ReportSection.SWOT_ANALYSIS:
        return 'SWOT Analysis';
      case ReportSection.PERFORMANCE_ANALYSIS:
        return 'Performance Analysis';
      case ReportSection.FINANCIAL_OVERVIEW:
        return 'Financial Overview';
      case ReportSection.RECOMMENDATIONS:
        return 'Recommendations';
      case ReportSection.FORECASTS_TRENDS:
        return 'Forecasts and Trends';
      case ReportSection.BENCHMARK:
        return 'Sector Benchmark';
      default:
        return 'Report Section';
    }
  }

  capPrompt(prompt: string): string {
    if (prompt.length <= this.maxLlmPromptChars) {
      return prompt;
    }
    this.logger.warn(
      `LLM prompt truncated from ${prompt.length} to ${this.maxLlmPromptChars} chars`,
    );
    return (
      prompt.slice(0, this.maxLlmPromptChars) +
      '\n\n[Report prompt truncated for API safety limits.]'
    );
  }

  buildMonthlyTable(financialData: FinancialRow[]): string {
    const rows = financialData
      .filter((row) => typeof row.metric === 'string')
      .slice(-24)
      .map(
        (row) =>
          `${row.metric}: ${Number(row.value ?? 0).toFixed(2)} (${this.toIsoDate(row.period)})`,
      );

    if (rows.length === 0) {
      return 'No monthly data available.';
    }

    let lines = [...rows];
    let joined = lines.join('\n');
    if (joined.length > this.maxMonthlyTableChars) {
      while (joined.length > this.maxMonthlyTableChars && lines.length > 1) {
        lines = lines.slice(1);
        joined = lines.join('\n');
      }
    }
    return joined;
  }

  // ─── Private Helpers ───

  private getAudienceInstruction(
    audience: ReportAudience | undefined,
    locale: string,
  ): string {
    switch (audience) {
      case ReportAudience.INVESTORS:
        return `Audience: Investors / Board of Directors.
Focus on: valuation growth, revenue trajectory, market opportunity, and ROI.
Use confident, forward-looking language. Lead with growth metrics and market potential.`;
      case ReportAudience.BANK:
        return `Audience: Bank / Credit institution.
Focus on: solvency, debt ratios, cash flow stability, and repayment capacity.
Use conservative, risk-aware language. Lead with asset coverage and cash position.`;
      case ReportAudience.INTERNAL:
      default:
        return `Audience: Internal executive team.
Focus on: operational performance, cost optimization, and team productivity.
Use direct, action-oriented language. Lead with performance gaps and improvement areas.`;
    }
  }

  private buildBenchmarkBlock(
    benchmark?: SectorBenchmark,
    deltas?: BenchmarkDelta[],
  ): string {
    if (!benchmark || !deltas || deltas.length === 0) {
      return '=== SECTOR BENCHMARK ===\nNo benchmark data available.';
    }

    const lines = [
      '=== SECTOR BENCHMARK ===',
      `Sector: ${benchmark.sectorLabel} (source: ${benchmark.source}${benchmark.sampleSize > 0 ? `, ${benchmark.sampleSize} companies` : ''})`,
      '',
      '| Metric | Company | Sector Median | Delta |',
      '|--------|---------|---------------|-------|',
    ];

    for (const d of deltas) {
      const sign = d.deltaPercent >= 0 ? '+' : '';
      const arrow =
        d.interpretation === 'above'
          ? '▲'
          : d.interpretation === 'below'
            ? '▼'
            : '═';
      lines.push(
        `| ${d.metric} | ${this.fmtValue(d.companyValue)} | ${this.fmtValue(d.sectorMedian)} | ${arrow} ${sign}${d.deltaPercent.toFixed(1)}% |`,
      );
    }

    lines.push('');
    lines.push(
      'Use these benchmark comparisons in your analysis. Highlight where the company outperforms or underperforms its sector.',
    );

    return lines.join('\n');
  }

  private fmtValue(v: number): string {
    if (Math.abs(v) < 1) return `${(v * 100).toFixed(1)}%`;
    if (Math.abs(v) >= 1_000_000)
      return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toFixed(1);
  }

  private toIsoDate(value: string | Date | undefined): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'N/A'
      : date.toISOString().slice(0, 10);
  }
}
