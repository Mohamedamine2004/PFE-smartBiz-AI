import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ReportAnalysisDepth,
  ReportSection,
  ReportTone,
  ReportType,
} from './dto/generate-report.dto';

type FinancialRow = {
  metric?: string;
  value?: number;
  period?: string | Date;
};

type PredictionInput = {
  hasPrediction?: boolean;
  status?: string;
  createdAt?: string | Date;
};

type GeminiKpis = {
  cac: number;
  ltv: number;
  tam: number;
  marketShare: number;
  employeeCount: number;
};

type GenerateInput = {
  reportTypes: ReportType[];
  language: string;
  financialData: FinancialRow[];
  annualData?: Record<string, unknown>;
  kpis?: GeminiKpis;
  prediction: PredictionInput;
  analysisDepth?: ReportAnalysisDepth;
  problemStatement?: string;
  tone?: ReportTone;
  sections?: ReportSection[];
  targetPages?: number;
};

export type ReportContentSource = 'xai' | 'openrouter' | 'fallback' | 'mixed';

type ActiveLlmProvider = 'xai' | 'openrouter';

export type GeneratedReportText = {
  content: Record<string, string>;
  aiUsed: boolean;
  source: ReportContentSource;
  fallbackSections: number;
};

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  /** Grok / xAI takes priority over OpenRouter when configured. */
  private activeLlm: ActiveLlmProvider | null = null;
  private activeApiKey: string | null = null;
  private activeModel = '';
  /** Normalized base URL without trailing slash (xAI only). */
  private xaiBaseUrl = 'https://api.x.ai/v1';
  private generationQueue: Promise<void> = Promise.resolve();
  private readonly requestTimeoutMs = 90000;
  /** Hard cap on full user prompt to reduce context-length / invalid-request 400s. */
  private readonly maxLlmPromptChars = 100_000;
  /** Cap on the embedded monthly trend block inside the base prompt. */
  private readonly maxMonthlyTableChars = 45_000;

  constructor(private readonly configService: ConfigService) {
    const xaiKey =
      this.configService.get<string>('XAI_API_KEY')?.trim() ||
      this.configService.get<string>('GROK_API_KEY')?.trim() ||
      null;
    const xaiModelConfigured = this.configService.get<string>('XAI_MODEL')?.trim();
    const xaiBaseConfigured = this.configService.get<string>('XAI_BASE_URL')?.trim();

    const openRouterKey = this.configService.get<string>('OPENROUTER_API_KEY')?.trim();
    const openRouterModelConfigured = this.configService.get<string>('OPENROUTER_MODEL')?.trim();

    if (xaiKey) {
      this.activeLlm = 'xai';
      this.activeApiKey = xaiKey;
      this.activeModel = xaiModelConfigured || 'grok-4-1-fast-non-reasoning';
      if (xaiBaseConfigured) {
        this.xaiBaseUrl = xaiBaseConfigured.replace(/\/+$/, '');
      }
      this.logger.log(
        `Initializing xAI Grok (priority): ${xaiKey.slice(0, 8)}...${xaiKey.slice(-4)} | model=${this.activeModel} | base=${this.xaiBaseUrl}`,
      );
      return;
    }

    if (openRouterKey) {
      this.activeLlm = 'openrouter';
      this.activeApiKey = openRouterKey;
      this.activeModel = openRouterModelConfigured || 'mistralai/mistral-7b-instruct';
      this.logger.log(
        `Initializing OpenRouter: ${openRouterKey.slice(0, 8)}...${openRouterKey.slice(-4)} | model=${this.activeModel}`,
      );
      return;
    }

    this.logger.warn(
      'No LLM API key — set XAI_API_KEY (or GROK_API_KEY) or OPENROUTER_API_KEY. Using data-driven fallback for reports.',
    );
  }

  getHealthStatus() {
    return {
      provider: (this.activeLlm ?? 'none') as 'xai' | 'openrouter' | 'none',
      configured: Boolean(this.activeApiKey),
      model: this.activeModel || 'none',
      keyPresent: Boolean(this.activeApiKey),
    };
  }

  /**
   * Test if the configured LLM API (xAI Grok or OpenRouter) is reachable.
   */
  async testConnection(): Promise<{ ok: boolean; model: string; error?: string }> {
    if (!this.activeApiKey || !this.activeLlm) {
      return {
        ok: false,
        model: 'none',
        error: 'No LLM key (set XAI_API_KEY / GROK_API_KEY or OPENROUTER_API_KEY)',
      };
    }
    try {
      const text = await this.enqueueChatCompletion('Reply with only the word OK');
      this.logger.log(`LLM (${this.activeLlm}) test response: "${text.trim()}"`);
      return { ok: true, model: this.activeModel };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`LLM (${this.activeLlm}) test failed: ${msg}`);
      return { ok: false, model: this.activeModel, error: msg };
    }
  }

  async generateReportText(input: GenerateInput): Promise<GeneratedReportText> {
    const {
      reportTypes,
      language,
      financialData,
      annualData,
      kpis,
      prediction,
      problemStatement,
      analysisDepth = ReportAnalysisDepth.STANDARD,
      tone = ReportTone.PROFESSIONAL,
      sections: requestedSections = [],
      targetPages = 12,
    } = input;

    const annual = this.extractAnnualNumbers(annualData ?? {});
    const metrics = this.extractLatestMetrics(financialData);

    if (!this.activeApiKey || !this.activeLlm) {
      this.logger.warn('╔══════════════════════════════════════════════════════╗');
      this.logger.warn('║  ⚠️  LLM NOT CONFIGURED — USING TEMPLATE FALLBACK   ║');
      this.logger.warn('║  Set XAI_API_KEY (Grok) or OPENROUTER_API_KEY       ║');
      this.logger.warn('╚══════════════════════════════════════════════════════╝');
      const content = this.generateComprehensiveFallback({
        reportTypes,
        requestedSections,
        financialData,
        annual,
        metrics,
        kpis,
        prediction,
        problemStatement,
        language,
      });
      return {
        content,
        aiUsed: false,
        source: 'fallback',
        fallbackSections: Object.keys(content).length,
      };
    }

    const providerLabel = this.activeLlm === 'xai' ? 'xAI Grok' : 'OpenRouter';
    this.logger.log('╔══════════════════════════════════════════════════════╗');
    this.logger.log(`║  🤖 ${providerLabel} — Starting generation`);
    this.logger.log(`║  Model: ${this.activeModel}`);
    this.logger.log(`║  Sections: ${reportTypes.length} report types + ${requestedSections.length} extra sections`);
    this.logger.log('╚══════════════════════════════════════════════════════╝');

    const sectionContent: Record<string, string> = {};
    const sectionSources: Record<string, 'AI' | 'FALLBACK'> = {};
    const growthYoy = this.safeGrowth(annual.Revenues_N, annual.Revenues_N_1);
    const growth2Y = this.safeGrowth(annual.Revenues_N, annual.Revenues_N_2);
    const ltvCac = this.safeRatio(kpis?.ltv ?? 0, kpis?.cac ?? 0);
    const monthlyTable = this.buildMonthlyTable(financialData);
    const locale = this.languageToHuman(language);
    const pagesPerSection = Math.max(
      2,
      Math.round(targetPages / Math.max(reportTypes.length + requestedSections.length, 1)),
    );

    const basePrompt = this.buildBasePrompt({
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
      pagesPerSection,
      prediction,
    });

    const fallbackContext = {
      language,
      annual,
      metrics,
      kpis,
      prediction,
      problemStatement,
      reportTypes,
      requestedSections,
    };

    for (const type of reportTypes) {
      const sectionName = this.getPromptForType(type);
      const fallbackText = this.buildFallbackForKey(type, fallbackContext);
      sectionContent[type] = await this.generateWithRetry(
        `${basePrompt}\n\n=== YOUR TASK ===\nWrite ONLY this section: "${sectionName}".\nProvide a thorough, multi-paragraph analysis with concrete data references.\nUse markdown headings (##, ###), bullet points, and structured paragraphs.\nAim for at least 800 words.`,
        type,
        fallbackContext,
      );
      sectionSources[type] = sectionContent[type] === fallbackText ? 'FALLBACK' : 'AI';
      await this.sleep(3000); // 3s delay between sections to avoid free-tier rate limits
    }

    for (const section of requestedSections) {
      if (section === ReportSection.EXECUTIVE_SUMMARY && sectionContent['EXECUTIVE_SUMMARY']) {
        continue;
      }
      const key = `SECTION_${section}`;
      const sectionName = this.getSectionName(section);
      const fallbackText = this.buildFallbackForKey(key, fallbackContext);
      sectionContent[key] = await this.generateWithRetry(
        `${basePrompt}\n\n=== YOUR TASK ===\nWrite ONLY this section: "${sectionName}".\nProvide a thorough, multi-paragraph analysis with concrete data references.\nUse markdown headings (##, ###), bullet points, and structured paragraphs.\nAim for at least 600 words.`,
        key,
        fallbackContext,
      );
      sectionSources[key] = sectionContent[key] === fallbackText ? 'FALLBACK' : 'AI';
      await this.sleep(1000);
    }

    // Generate Executive Summary only if not already present
    if (!sectionContent['EXECUTIVE_SUMMARY'] && !sectionContent['SECTION_EXECUTIVE_SUMMARY']) {
      const fallbackText = this.buildFallbackForKey('EXECUTIVE_SUMMARY', fallbackContext);
      sectionContent['EXECUTIVE_SUMMARY'] = await this.generateWithRetry(
        `${basePrompt}\n\n=== YOUR TASK ===\nWrite ONLY an Executive Summary with key findings and immediate priorities.\nProvide a thorough, structured summary with clear subsections.\nAim for at least 500 words.`,
        'EXECUTIVE_SUMMARY',
        fallbackContext,
      );
      sectionSources['EXECUTIVE_SUMMARY'] = sectionContent['EXECUTIVE_SUMMARY'] === fallbackText ? 'FALLBACK' : 'AI';
    }

    // ─── DIAGNOSTIC SUMMARY ───
    this.logger.log('╔══════════════════════════════════════════════════════╗');
    this.logger.log('║  📊 REPORT GENERATION SUMMARY                       ║');
    this.logger.log('╠══════════════════════════════════════════════════════╣');
    for (const [key, source] of Object.entries(sectionSources)) {
      const icon = source === 'AI' ? '✅ AI' : '⚠️  FALLBACK';
      const chars = sectionContent[key]?.length ?? 0;
      this.logger.log(`║  ${icon} │ ${key.padEnd(30)} │ ${chars} chars`);
    }
    this.logger.log('╚══════════════════════════════════════════════════════╝');

    const fallbackSections = Object.values(sectionSources).filter((value) => value === 'FALLBACK').length;
    const primarySource: ReportContentSource =
      this.activeLlm === 'xai' ? 'xai' : 'openrouter';
    const source: ReportContentSource =
      fallbackSections === 0
        ? primarySource
        : fallbackSections === Object.keys(sectionSources).length
          ? 'fallback'
          : 'mixed';

    return {
      content: sectionContent,
      aiUsed: source === 'openrouter' || source === 'xai',
      source,
      fallbackSections,
    };
  }

  private async generateWithRetry(
    prompt: string,
    sectionKey: string,
    fallbackContext: {
      language: string;
      annual: Record<string, number>;
      metrics: Record<string, number>;
      kpis?: GeminiKpis;
      prediction: PredictionInput;
      problemStatement?: string;
      reportTypes: ReportType[];
      requestedSections: ReportSection[];
    },
  ): Promise<string> {
    if (!this.activeApiKey || !this.activeLlm) {
      this.logger.warn(`No LLM API key for ${sectionKey} — using data-driven fallback`);
      return this.buildFallbackForKey(sectionKey, fallbackContext);
    }

    let lastError: string | null = null;
    const delays = [2000, 5000, 12000];
    const providerTag = this.activeLlm === 'xai' ? 'xAI' : 'OpenRouter';

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        this.logger.log(`[${sectionKey}] ${providerTag} attempt ${attempt + 1}/3 (model: ${this.activeModel})`);
        const text = await this.enqueueChatCompletion(prompt);
        if (text.length > 0) {
          this.logger.log(`[${sectionKey}] ${providerTag} returned ${text.length} chars successfully`);
          return text;
        }
        lastError = `empty response from ${providerTag}`;
        this.logger.warn(`[${sectionKey}] ${providerTag} returned empty response on attempt ${attempt + 1}`);
      } catch (error) {
        lastError = this.describeLlmHttpError(error);
        this.logger.warn(`[${sectionKey}] ${providerTag} attempt ${attempt + 1} failed: ${lastError}`);

        // Auth error — no point in retrying
        if (lastError.includes('401') || lastError.includes('403') || lastError.includes('API_KEY') || lastError.includes('PERMISSION_DENIED')) {
          this.logger.error(`[${sectionKey}] Authentication/permission error — cannot retry: ${lastError}`);
          break;
        }

        // Rate limit — wait longer
        if (lastError.includes('429') || lastError.includes('RESOURCE_EXHAUSTED')) {
          const rateLimitDelay = 15000 * (attempt + 1);
          this.logger.warn(`[${sectionKey}] Rate limited — waiting ${rateLimitDelay}ms before retry`);
          await this.sleep(rateLimitDelay);
          continue;
        }
      }

      if (attempt < delays.length) {
        this.logger.log(`[${sectionKey}] Waiting ${delays[attempt]}ms before retry...`);
        await this.sleep(delays[attempt]);
      }
    }

    this.logger.error(`[${sectionKey}] All ${providerTag} attempts failed. Last error: ${lastError}. Using fallback content.`);
    return this.buildFallbackForKey(sectionKey, fallbackContext);
  }

  /**
   * Truncate very long prompts before sending to the LLM (context window / request size limits).
   */
  private capPromptForLlm(prompt: string): string {
    if (prompt.length <= this.maxLlmPromptChars) {
      return prompt;
    }
    this.logger.warn(
      `LLM prompt truncated from ${prompt.length} to ${this.maxLlmPromptChars} chars (API context limits)`,
    );
    return (
      prompt.slice(0, this.maxLlmPromptChars) +
      '\n\n[Report prompt truncated for API safety limits.]'
    );
  }

  /**
   * OpenAI-compatible APIs may return `message.content` as a string or as an array of parts
   * (e.g. `{ type: 'text', text: '...' }`). Treating non-strings as "empty" caused LLM
   * calls to succeed on the wire but fall back to template content for every section.
   */
  private extractChatCompletionText(data: unknown): string {
    const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]
      ?.message?.content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }
          if (part && typeof part === 'object') {
            const p = part as Record<string, unknown>;
            if (typeof p.text === 'string') {
              return p.text;
            }
            if (typeof p.content === 'string') {
              return p.content;
            }
          }
          return '';
        })
        .join('');
    }

    return '';
  }

  private enqueueChatCompletion(prompt: string): Promise<string> {
    if (!this.activeApiKey || !this.activeLlm) {
      return Promise.reject(new Error('No LLM API key configured'));
    }

    const url =
      this.activeLlm === 'xai'
        ? `${this.xaiBaseUrl}/chat/completions`
        : 'https://openrouter.ai/api/v1/chat/completions';

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.activeApiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.activeLlm === 'openrouter') {
      const referer =
        this.configService.get<string>('OPENROUTER_HTTP_REFERER')?.trim() ||
        this.configService.get<string>('FRONTEND_URL')?.split(',')[0]?.trim() ||
        'http://localhost:5173';
      headers['HTTP-Referer'] = referer;
      headers['X-Title'] = 'SmartBiz AI — Report generation';
    }

    const runLabel =
      this.activeLlm === 'xai' ? 'xAI Grok chat completion' : 'OpenRouter chat completion';

    const cappedPrompt = this.capPromptForLlm(prompt);

    const parseCap = (raw: string | undefined, fallback: number) => {
      const n = Number.parseInt(raw ?? '', 10);
      return Number.isFinite(n) && n > 0 ? Math.min(n, 128_000) : fallback;
    };
    const xaiMaxCompletion = parseCap(
      this.configService.get<string>('XAI_MAX_COMPLETION_TOKENS'),
      4096,
    );
    const openRouterMaxTokens = parseCap(
      this.configService.get<string>('OPENROUTER_MAX_TOKENS'),
      4096,
    );

    const requestBody =
      this.activeLlm === 'xai'
        ? {
            model: this.activeModel,
            messages: [{ role: 'user', content: cappedPrompt }],
            temperature: 0.7,
            stream: false,
            max_completion_tokens: xaiMaxCompletion,
          }
        : {
            model: this.activeModel,
            messages: [{ role: 'user', content: cappedPrompt }],
            temperature: 0.7,
            max_tokens: openRouterMaxTokens,
          };

    const run = this.generationQueue.then(async () => {
      this.logger.debug(
        `Sending prompt (${cappedPrompt.length} chars, capped from ${prompt.length}) to ${this.activeLlm}...`,
      );
      const response = await this.runWithTimeout(
        axios.post(url, requestBody, {
          headers,
          timeout: this.requestTimeoutMs,
        }),
        this.requestTimeoutMs,
        runLabel,
      );

      const text = this.extractChatCompletionText(response.data);
      if (text.trim().length === 0) {
        const apiError = (response.data as { error?: { message?: string } })?.error?.message;
        throw new Error(apiError || 'LLM returned an empty response');
      }

      this.logger.debug(`LLM (${this.activeLlm}) raw response: ${text.length} chars`);
      return this.normalizeResponseText(text);
    });

    this.generationQueue = run.then(
      () => undefined,
      () => undefined,
    );

    return run;
  }

  private describeLlmHttpError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const rawData = error.response?.data;

      if (status !== undefined && status >= 400 && rawData !== undefined) {
        const serialized =
          typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
        const truncated =
          serialized.length > 4000 ? `${serialized.slice(0, 4000)}...[truncated]` : serialized;
        this.logger.error(`LLM HTTP ${status} response body: ${truncated}`);
      }

      const data = rawData as
        | { error?: { message?: string }; message?: string }
        | undefined;

      const apiMessage =
        data?.error?.message ??
        (typeof data?.message === 'string' ? data.message : undefined) ??
        undefined;

      const parts = [
        status ? `HTTP ${status}` : undefined,
        apiMessage,
        error.message,
      ].filter((value): value is string => Boolean(value && value.trim()));

      return parts.length > 0 ? parts.join(' | ') : 'Unknown Axios/LLM error';
    }

    return error instanceof Error ? error.message : 'unknown error';
  }

  private async runWithTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private buildBasePrompt(input: {
    locale: string;
    annual: Record<string, number>;
    growthYoy: number;
    growth2Y: number;
    kpis?: GeminiKpis;
    ltvCac: number;
    monthlyTable: string;
    analysisDepth: ReportAnalysisDepth;
    problemStatement?: string;
    tone: ReportTone;
    pagesPerSection: number;
    prediction: PredictionInput;
  }): string {
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
      pagesPerSection,
      prediction,
    } = input;

    return `You are a senior business consultant generating a section of a formal report for a SaaS client on SmartBiz AI.

Write the output entirely in ${locale}.

=== COMPANY FINANCIAL DATA ===
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

=== REPORT INSTRUCTIONS ===
Tone: ${tone}
Analysis depth: ${analysisDepth}
Target length for this section: about ${pagesPerSection} pages
Main business problem: ${problemStatement?.trim() || 'No specific problem provided'}

=== OUTPUT RULES ===
- Use markdown headings (## and ###) to structure the content.
- Use bullet points for lists and key takeaways.
- Reference real numeric values from the data above.
- Provide actionable recommendations.
- Do not invent financial numbers beyond provided context.
- Write at least 600 words for a thorough analysis.
- Be concise and business-ready.`;
  }

  private extractAnnualNumbers(annualData: Record<string, unknown>): Record<string, number> {
    const toNumber = (value: unknown): number => {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
      }
      if (typeof value === 'string') {
        const normalized = value.replace(/[^0-9.-]/g, '');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    return {
      Assets_N: toNumber(annualData.Assets_N),
      Assets_N_1: toNumber(annualData.Assets_N_1),
      Liabilities_N: toNumber(annualData.Liabilities_N),
      Revenues_N: toNumber(annualData.Revenues_N),
      Revenues_N_1: toNumber(annualData.Revenues_N_1),
      Revenues_N_2: toNumber(annualData.Revenues_N_2),
      NetIncome_N: toNumber(annualData.NetIncome_N),
      OperatingIncome_N: toNumber(annualData.OperatingIncome_N),
      CashAndEquivalents_N: toNumber(annualData.CashAndEquivalents_N),
    };
  }

  private extractLatestMetrics(financialData: FinancialRow[]): Record<string, number> {
    const metrics: Record<string, number> = {};
    const sorted = [...financialData]
      .filter((r) => r.metric && r.value !== undefined)
      .sort((a, b) => new Date(b.period ?? 0).getTime() - new Date(a.period ?? 0).getTime());

    for (const row of sorted) {
      const key = row.metric ?? '';
      if (!metrics[key]) {
        metrics[key] = Number(row.value) || 0;
      }
    }
    return metrics;
  }

  private safeGrowth(current: number, previous: number): number {
    if (!Number.isFinite(previous) || previous === 0) {
      return 0;
    }
    return ((current - previous) / previous) * 100;
  }

  private safeRatio(numerator: number, denominator: number): number {
    if (!Number.isFinite(denominator) || denominator === 0) {
      return 0;
    }
    return numerator / denominator;
  }

  private buildMonthlyTable(financialData: FinancialRow[]): string {
    const rows = financialData
      .filter((row) => typeof row.metric === 'string')
      .slice(-24)
      .map((row) => `${row.metric}: ${Number(row.value ?? 0).toFixed(2)} (${this.toIsoDate(row.period)})`);

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
      this.logger.warn(
        `Monthly trend table truncated to ${lines.length} rows (${joined.length} chars) for LLM context limits`,
      );
    }
    return joined;
  }

  private toIsoDate(value: string | Date | undefined): string {
    if (!value) {
      return 'N/A';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toISOString().slice(0, 10);
  }

  private getSectionName(section: ReportSection): string {
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
      default:
        return 'Report Section';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildFallbackForKey(
    sectionKey: string,
    context: {
      language: string;
      annual: Record<string, number>;
      metrics: Record<string, number>;
      kpis?: GeminiKpis;
      prediction: PredictionInput;
      problemStatement?: string;
      reportTypes: ReportType[];
      requestedSections: ReportSection[];
    },
  ): string {
    const isFr = context.language === 'FR';
    const fmt = (n: number) => n.toLocaleString(isFr ? 'fr-FR' : 'en-US');
    const revenue = context.metrics['Gross_Revenue'] || context.annual.Revenues_N || 0;
    const opex = context.metrics['Operating_Expenses_Total'] || 0;
    const cashBurn = context.metrics['Net_Cash_Burn'] || 0;
    const cashBalance = context.metrics['Ending_Cash_Balance'] || context.annual.CashAndEquivalents_N || 0;
    const payroll = context.metrics['Payroll_Expenses'] || 0;
    const marketing = context.metrics['Marketing_Spend'] || 0;
    const newCustomers = context.metrics['New_Customers_Acquired'] || 0;
    const churned = context.metrics['Customers_Churned'] || 0;
    const growthYoy = this.safeGrowth(context.annual.Revenues_N, context.annual.Revenues_N_1);
    const ltvCac = this.safeRatio(context.kpis?.ltv ?? 0, context.kpis?.cac ?? 0);
    const cashRunwayMonths = cashBurn < 0 ? Math.abs(cashBalance / cashBurn) : 0;

    switch (sectionKey) {
      case 'EXECUTIVE_SUMMARY':
        return this.generateComprehensiveFallback({
          reportTypes: context.reportTypes,
          requestedSections: context.requestedSections,
          financialData: [],
          annual: context.annual,
          metrics: context.metrics,
          kpis: context.kpis,
          prediction: context.prediction,
          problemStatement: context.problemStatement,
          language: context.language,
        })['EXECUTIVE_SUMMARY'];
      case 'FINANCIAL':
        return this.buildFinancialSection(isFr, { revenue, opex, cashBurn, cashBalance, payroll, marketing, growthYoy, annual: context.annual, fmt });
      case 'BUSINESS_DESCRIPTION':
        return this.buildBusinessSection(isFr, { revenue, newCustomers, churned, kpis: context.kpis, ltvCac, fmt });
      case 'RISK_ANALYSIS':
        return this.buildRiskSection(isFr, { cashBurn, cashBalance, cashRunwayMonths, churned, newCustomers, opex, revenue, fmt });
      case 'ACTION_PLAN':
        return this.buildActionPlanSection(isFr, { cashBurn, cashBalance, churned, newCustomers, marketing, revenue, opex, fmt });
      case 'SECTION_EXECUTIVE_SUMMARY':
        return this.generateComprehensiveFallback({
          reportTypes: context.reportTypes,
          requestedSections: context.requestedSections,
          financialData: [],
          annual: context.annual,
          metrics: context.metrics,
          kpis: context.kpis,
          prediction: context.prediction,
          problemStatement: context.problemStatement,
          language: context.language,
        })['EXECUTIVE_SUMMARY'];
      case 'SECTION_SWOT_ANALYSIS':
        return this.buildSwotSection(isFr, { revenue, cashBurn, newCustomers, churned, cashRunwayMonths, prediction: context.prediction, kpis: context.kpis, fmt });
      case 'SECTION_PERFORMANCE_ANALYSIS':
        return this.buildPerformanceSection(isFr, { revenue, opex, cashBurn, payroll, marketing, newCustomers, churned, fmt });
      case 'SECTION_FINANCIAL_OVERVIEW':
        return this.buildFinancialSection(isFr, { revenue, opex, cashBurn, cashBalance, payroll, marketing, growthYoy, annual: context.annual, fmt });
      case 'SECTION_RECOMMENDATIONS':
        return this.buildActionPlanSection(isFr, { cashBurn, cashBalance, churned, newCustomers, marketing, revenue, opex, fmt });
      case 'SECTION_FORECASTS_TRENDS':
        return this.buildForecastSection(isFr, { revenue, cashBurn, growthYoy, prediction: context.prediction, fmt });
      default:
        return isFr
          ? 'Analyse de cette section basée sur les données disponibles.'
          : 'Analysis for this section based on available data.';
    }
  }

  private languageToHuman(language: string): string {
    if (language === 'FR') return 'French';
    if (language === 'AR') return 'Arabic';
    return 'English';
  }

  private normalizeResponseText(text: string): string {
    // Preserve markdown structure (headings, bold, bullets) for better PDF formatting
    return text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks only
      .replace(/\n{3,}/g, '\n\n')    // Collapse excessive newlines
      .trim();
  }

  private getPromptForType(type: ReportType): string {
    switch (type) {
      case ReportType.FINANCIAL:
        return 'Financial Analysis: Detailed review of revenue trends, profitability, and financial stability.';
      case ReportType.BUSINESS_DESCRIPTION:
        return 'Business Context: Analysis of the current business state, market position, and operational environment.';
      case ReportType.RISK_ANALYSIS:
        return 'Risk Analysis: Identification of key financial and operational risks based on historical volatility and predictions.';
      case ReportType.ACTION_PLAN:
        return 'Strategic Action Plan: Concrete, data-driven recommendations and next steps for management.';
      default:
        return `${type} Analysis: General professional analysis of this specific area.`;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPREHENSIVE DATA-DRIVEN FALLBACK (when Gemini is unavailable)
  // ═══════════════════════════════════════════════════════════════

  private generateComprehensiveFallback(input: {
    reportTypes: ReportType[];
    requestedSections: ReportSection[];
    financialData: FinancialRow[];
    annual: Record<string, number>;
    metrics: Record<string, number>;
    kpis?: GeminiKpis;
    prediction: PredictionInput;
    problemStatement?: string;
    language: string;
  }): Record<string, string> {
    const { reportTypes, requestedSections, annual, metrics, kpis, prediction, problemStatement, language } = input;
    const isFr = language === 'FR';

    const revenue = metrics['Gross_Revenue'] || annual.Revenues_N || 0;
    const opex = metrics['Operating_Expenses_Total'] || 0;
    const cashBurn = metrics['Net_Cash_Burn'] || 0;
    const cashBalance = metrics['Ending_Cash_Balance'] || annual.CashAndEquivalents_N || 0;
    const payroll = metrics['Payroll_Expenses'] || 0;
    const marketing = metrics['Marketing_Spend'] || 0;
    const newCustomers = metrics['New_Customers_Acquired'] || 0;
    const churned = metrics['Customers_Churned'] || 0;
    const growthYoy = this.safeGrowth(annual.Revenues_N, annual.Revenues_N_1);
    const ltvCac = this.safeRatio(kpis?.ltv ?? 0, kpis?.cac ?? 0);
    const cashRunwayMonths = cashBurn < 0 ? Math.abs(cashBalance / cashBurn) : 0;

    const fmt = (n: number) => n.toLocaleString('fr-FR');
    const sections: Record<string, string> = {};

    // ─── EXECUTIVE SUMMARY ───
    sections['EXECUTIVE_SUMMARY'] = isFr ? [
      '## Synthèse Exécutive',
      '',
      `Ce rapport présente une analyse détaillée de la performance financière et opérationnelle de l'entreprise. L'analyse repose sur les données financières mensuelles importées, les indicateurs clés de performance (KPIs), et les projections du moteur de machine learning SmartBiz AI.`,
      '',
      '### Indicateurs Clés',
      '',
      `- **Revenu brut mensuel** : ${fmt(revenue)} DA`,
      `- **Charges opérationnelles totales** : ${fmt(opex)} DA`,
      `- **Cash burn net mensuel** : ${fmt(cashBurn)} DA`,
      `- **Solde de trésorerie** : ${fmt(cashBalance)} DA`,
      `- **Nouveaux clients acquis** : ${newCustomers}`,
      `- **Clients perdus (churn)** : ${churned}`,
      cashRunwayMonths > 0 ? `- **Piste de trésorerie estimée** : ${cashRunwayMonths.toFixed(1)} mois` : '',
      '',
      '### Points d\'Attention Prioritaires',
      '',
      cashBurn < 0
        ? `Le cash burn net de ${fmt(Math.abs(cashBurn))} DA/mois indique une consommation de trésorerie qui nécessite une attention immédiate. Avec un solde de ${fmt(cashBalance)} DA, la piste de trésorerie est limitée.`
        : 'Le flux de trésorerie opérationnel est actuellement positif, ce qui est un signe encourageant de viabilité financière.',
      '',
      churned > newCustomers
        ? `Le taux de churn (${churned} clients perdus vs ${newCustomers} acquis) indique un problème de rétention client qui impacte directement la croissance.`
        : `L'acquisition nette de clients est positive (${newCustomers} acquis vs ${churned} perdus), soutenant la trajectoire de croissance.`,
      '',
      `Le moteur de prédiction ML est ${prediction.status === 'COMPLETED' ? 'actif et a complété son analyse' : 'en cours de traitement'}. Les résultats sont intégrés dans les recommandations stratégiques ci-dessous.`,
      '',
      problemStatement ? `### Focus Spécifique\n\n${problemStatement}` : '',
    ].filter(Boolean).join('\n') : [
      '## Executive Summary',
      '',
      `This report presents a detailed analysis of the company's financial and operational performance. The analysis is based on imported monthly financial data, key performance indicators (KPIs), and SmartBiz AI machine learning projections.`,
      '',
      '### Key Metrics',
      '',
      `- **Monthly Gross Revenue**: ${fmt(revenue)}`,
      `- **Total Operating Expenses**: ${fmt(opex)}`,
      `- **Net Monthly Cash Burn**: ${fmt(cashBurn)}`,
      `- **Cash Balance**: ${fmt(cashBalance)}`,
      `- **New Customers Acquired**: ${newCustomers}`,
      `- **Customers Churned**: ${churned}`,
      cashRunwayMonths > 0 ? `- **Estimated Cash Runway**: ${cashRunwayMonths.toFixed(1)} months` : '',
      '',
      '### Priority Areas',
      '',
      cashBurn < 0
        ? `The net cash burn of ${fmt(Math.abs(cashBurn))}/month requires immediate attention. With a balance of ${fmt(cashBalance)}, the cash runway is limited.`
        : 'Operational cash flow is currently positive, which is an encouraging sign of financial viability.',
      '',
      `ML prediction engine status: ${prediction.status === 'COMPLETED' ? 'Active — analysis completed' : 'Processing'}.`,
      '',
      problemStatement ? `### Specific Focus\n\n${problemStatement}` : '',
    ].filter(Boolean).join('\n');

    // ─── REPORT TYPE SECTIONS ───
    for (const type of reportTypes) {
      switch (type) {
        case ReportType.FINANCIAL:
          sections[type] = this.buildFinancialSection(isFr, { revenue, opex, cashBurn, cashBalance, payroll, marketing, growthYoy, annual, fmt });
          break;
        case ReportType.BUSINESS_DESCRIPTION:
          sections[type] = this.buildBusinessSection(isFr, { revenue, newCustomers, churned, kpis, ltvCac, fmt });
          break;
        case ReportType.RISK_ANALYSIS:
          sections[type] = this.buildRiskSection(isFr, { cashBurn, cashBalance, cashRunwayMonths, churned, newCustomers, opex, revenue, fmt });
          break;
        case ReportType.ACTION_PLAN:
          sections[type] = this.buildActionPlanSection(isFr, { cashBurn, cashBalance, churned, newCustomers, marketing, revenue, opex, fmt });
          break;
        default:
          sections[type] = isFr
            ? 'Analyse de cette section basée sur les données disponibles.'
            : 'Analysis for this section based on available data.';
      }
    }

    // ─── REQUESTED SECTIONS ───
    for (const section of requestedSections) {
      if (section === ReportSection.EXECUTIVE_SUMMARY) continue;
      const key = `SECTION_${section}`;
      switch (section) {
        case ReportSection.SWOT_ANALYSIS:
          sections[key] = this.buildSwotSection(isFr, { revenue, cashBurn, newCustomers, churned, cashRunwayMonths, prediction, kpis, fmt });
          break;
        case ReportSection.PERFORMANCE_ANALYSIS:
          sections[key] = this.buildPerformanceSection(isFr, { revenue, opex, cashBurn, payroll, marketing, newCustomers, churned, fmt });
          break;
        case ReportSection.FINANCIAL_OVERVIEW:
          sections[key] = this.buildFinancialSection(isFr, { revenue, opex, cashBurn, cashBalance, payroll, marketing, growthYoy, annual, fmt });
          break;
        case ReportSection.RECOMMENDATIONS:
          sections[key] = this.buildActionPlanSection(isFr, { cashBurn, cashBalance, churned, newCustomers, marketing, revenue, opex, fmt });
          break;
        case ReportSection.FORECASTS_TRENDS:
          sections[key] = this.buildForecastSection(isFr, { revenue, cashBurn, growthYoy, prediction, fmt });
          break;
        default:
          sections[key] = isFr ? 'Section en cours de traitement.' : 'Section being processed.';
      }
    }

    return sections;
  }

  private buildFinancialSection(isFr: boolean, d: any): string {
    if (isFr) {
      return [
        '## Analyse Financière Détaillée',
        '',
        '### Structure des Revenus',
        '',
        `Le revenu brut mensuel s'établit à **${d.fmt(d.revenue)} DA**, tandis que les charges opérationnelles totales atteignent **${d.fmt(d.opex)} DA**. Cette situation révèle un déficit opérationnel mensuel de **${d.fmt(d.revenue - d.opex)} DA**.`,
        '',
        d.growthYoy !== 0 ? `La croissance annuelle du chiffre d'affaires est de **${d.growthYoy.toFixed(1)}%**, ${d.growthYoy > 0 ? 'indiquant une trajectoire de croissance positive' : 'signalant une contraction nécessitant une attention urgente'}.` : '',
        '',
        '### Répartition des Charges',
        '',
        `- **Masse salariale** : ${d.fmt(d.payroll)} DA (${d.opex > 0 ? ((d.payroll / d.opex) * 100).toFixed(1) : '0'}% des charges totales)`,
        `- **Marketing** : ${d.fmt(d.marketing)} DA (${d.opex > 0 ? ((d.marketing / d.opex) * 100).toFixed(1) : '0'}% des charges totales)`,
        `- **Autres charges** : ${d.fmt(d.opex - d.payroll - d.marketing)} DA`,
        '',
        '### Position de Trésorerie',
        '',
        `Le solde de trésorerie est de **${d.fmt(d.cashBalance)} DA** avec un cash burn net mensuel de **${d.fmt(d.cashBurn)} DA**.`,
        '',
        d.cashBurn < 0
          ? `⚠️ **Alerte** : Le burn rate actuel de ${d.fmt(Math.abs(d.cashBurn))} DA/mois nécessite des mesures correctives immédiates pour préserver la capacité opérationnelle de l'entreprise.`
          : '✅ Le flux de trésorerie opérationnel positif assure la stabilité financière à court terme.',
        '',
        '### Ratios Clés',
        '',
        `| Indicateur | Valeur |`,
        `|---|---|`,
        `| Revenu / Charges | ${d.opex > 0 ? (d.revenue / d.opex * 100).toFixed(1) : 'N/A'}% |`,
        `| Charges salariales / Total | ${d.opex > 0 ? (d.payroll / d.opex * 100).toFixed(1) : 'N/A'}% |`,
        `| Marketing / Revenu | ${d.revenue > 0 ? (d.marketing / d.revenue * 100).toFixed(1) : 'N/A'}% |`,
        '',
        '### Recommandations Financières',
        '',
        '- Optimiser le ratio coûts opérationnels/revenus par une rationalisation des postes de dépenses non-essentiels',
        '- Mettre en place un suivi hebdomadaire du cash burn pour anticiper les tensions de trésorerie',
        '- Explorer des leviers de réduction de la masse salariale ou d\'augmentation de productivité',
        '- Renforcer le contrôle des dépenses marketing et mesurer le ROI de chaque canal',
      ].filter(Boolean).join('\n');
    }
    return [
      '## Detailed Financial Analysis',
      '',
      '### Revenue Structure',
      '',
      `Monthly gross revenue stands at **${d.fmt(d.revenue)}**, while total operating expenses reach **${d.fmt(d.opex)}**. This reveals a monthly operating gap of **${d.fmt(d.revenue - d.opex)}**.`,
      '',
      '### Cost Breakdown',
      '',
      `- **Payroll**: ${d.fmt(d.payroll)} (${d.opex > 0 ? ((d.payroll / d.opex) * 100).toFixed(1) : '0'}% of total expenses)`,
      `- **Marketing**: ${d.fmt(d.marketing)} (${d.opex > 0 ? ((d.marketing / d.opex) * 100).toFixed(1) : '0'}% of total expenses)`,
      '',
      '### Cash Position',
      '',
      `Cash balance: **${d.fmt(d.cashBalance)}** with net monthly cash burn of **${d.fmt(d.cashBurn)}**.`,
      '',
      '### Recommendations',
      '',
      '- Optimize the cost-to-revenue ratio by rationalizing non-essential spending',
      '- Implement weekly cash burn monitoring to anticipate cash flow tensions',
      '- Explore levers to improve productivity and reduce overhead',
    ].join('\n');
  }

  private buildBusinessSection(isFr: boolean, d: any): string {
    if (isFr) {
      return [
        '## Analyse du Modèle Économique',
        '',
        '### Dynamique Client',
        '',
        `L'entreprise acquiert **${d.newCustomers} nouveaux clients** par mois, avec un taux de churn de **${d.churned} clients** perdus par période.`,
        '',
        d.churned > d.newCustomers
          ? `⚠️ Le churn net est négatif (perte nette de ${d.churned - d.newCustomers} clients/mois), ce qui érode la base client et menace la viabilité à moyen terme.`
          : `✅ L'acquisition nette est positive (+${d.newCustomers - d.churned} clients/mois), soutenant la croissance de la base installée.`,
        '',
        '### Économie Unitaire',
        '',
        `- **Coût d'Acquisition Client (CAC)** : ${d.fmt(d.kpis?.cac ?? 0)} DA`,
        `- **Valeur Vie Client (LTV)** : ${d.fmt(d.kpis?.ltv ?? 0)} DA`,
        `- **Ratio LTV/CAC** : ${d.ltvCac.toFixed(1)}x ${d.ltvCac >= 3 ? '✅ (sain, > 3x)' : d.ltvCac >= 1 ? '⚠️ (à améliorer)' : '🔴 (critique, < 1x)'}`,
        '',
        '### Positionnement Marché',
        '',
        `- **Marché Total Addressable (TAM)** : ${d.fmt(d.kpis?.tam ?? 0)} DA`,
        `- **Part de marché estimée** : ${((d.kpis?.marketShare ?? 0) * 100).toFixed(1)}%`,
        '',
        '### Recommandations',
        '',
        '- Investir dans la rétention client pour réduire le taux de churn',
        '- Optimiser le parcours d\'onboarding pour améliorer l\'activation des nouveaux clients',
        '- Analyser les segments clients à haute valeur pour cibler l\'acquisition',
      ].join('\n');
    }
    return [
      '## Business Model Analysis',
      '',
      '### Customer Dynamics',
      '',
      `The company acquires **${d.newCustomers} new customers** per month, with **${d.churned} customers** lost per period.`,
      '',
      '### Unit Economics',
      '',
      `- **CAC**: ${d.fmt(d.kpis?.cac ?? 0)}`,
      `- **LTV**: ${d.fmt(d.kpis?.ltv ?? 0)}`,
      `- **LTV/CAC Ratio**: ${d.ltvCac.toFixed(1)}x`,
      '',
      '### Recommendations',
      '',
      '- Invest in customer retention to reduce churn rate',
      '- Optimize onboarding to improve new customer activation',
    ].join('\n');
  }

  private buildRiskSection(isFr: boolean, d: any): string {
    if (isFr) {
      return [
        '## Analyse des Risques',
        '',
        '### Matrice des Risques Identifiés',
        '',
        '#### 🔴 Risque Critique : Trésorerie',
        '',
        d.cashBurn < 0
          ? `Le cash burn mensuel de ${d.fmt(Math.abs(d.cashBurn))} DA avec un solde de ${d.fmt(d.cashBalance)} DA donne une piste de trésorerie de **${d.cashRunwayMonths.toFixed(1)} mois**. Ce niveau est critique et nécessite une action immédiate.`
          : 'Le flux de trésorerie est actuellement positif, réduisant le risque de liquidité à court terme.',
        '',
        '#### 🟡 Risque Modéré : Rétention Client',
        '',
        d.churned > d.newCustomers
          ? `Le taux de churn dépasse l'acquisition (${d.churned} vs ${d.newCustomers}), entraînant une érosion nette de la base client. Impact estimé sur le revenu : **${d.fmt(d.churned * (d.revenue / (d.churned + d.newCustomers + 1)))} DA/mois** de revenu menacé.`
          : `Le churn est maîtrisé avec un ratio acquisition/churn de ${(d.newCustomers / Math.max(d.churned, 1)).toFixed(1)}x.`,
        '',
        '#### 🟡 Risque Modéré : Concentration des Coûts',
        '',
        `Les charges opérationnelles de ${d.fmt(d.opex)} DA représentent **${d.revenue > 0 ? (d.opex / d.revenue * 100).toFixed(0) : 'N/A'}%** du revenu brut, indiquant une structure de coûts lourde.`,
        '',
        '### Plan d\'Atténuation',
        '',
        '- **Court terme (0-3 mois)** : Réduire le burn rate de 20% via gel des recrutements et optimisation des contrats fournisseurs',
        '- **Moyen terme (3-6 mois)** : Implémenter un programme de rétention client ciblé',
        '- **Long terme (6-12 mois)** : Diversifier les sources de revenus et améliorer les marges unitaires',
      ].join('\n');
    }
    return [
      '## Risk Analysis',
      '',
      '### Identified Risk Matrix',
      '',
      '#### Critical Risk: Cash Flow',
      d.cashBurn < 0
        ? `Monthly burn of ${d.fmt(Math.abs(d.cashBurn))} with balance of ${d.fmt(d.cashBalance)} gives runway of **${d.cashRunwayMonths.toFixed(1)} months**.`
        : 'Cash flow is currently positive.',
      '',
      '#### Moderate Risk: Customer Retention',
      `Churn: ${d.churned}, New Customers: ${d.newCustomers}`,
      '',
      '### Mitigation Plan',
      '- **Short term**: Reduce burn rate by 20%',
      '- **Medium term**: Implement targeted retention program',
      '- **Long term**: Diversify revenue sources',
    ].join('\n');
  }

  private buildActionPlanSection(isFr: boolean, d: any): string {
    if (isFr) {
      return [
        '## Plan d\'Action Stratégique',
        '',
        '### Actions Prioritaires',
        '',
        '#### 1. Stabilisation de la Trésorerie (Priorité Critique)',
        '',
        '- **Objectif** : Réduire le cash burn net de 30% en 90 jours',
        `- **Situation actuelle** : Cash burn de ${d.fmt(Math.abs(d.cashBurn))} DA/mois, solde trésorerie ${d.fmt(d.cashBalance)} DA`,
        '- **Actions** :',
        '  - Audit complet des dépenses récurrentes et élimination des postes non-essentiels',
        '  - Renégociation des contrats fournisseurs majeurs',
        '  - Mise en place d\'un comité de validation des dépenses > 1000 DA',
        '- **KPI de suivi** : Taux de réduction du burn rate mensuel',
        '',
        '#### 2. Optimisation de la Rétention Client',
        '',
        '- **Objectif** : Réduire le churn de 25% en 6 mois',
        `- **Situation actuelle** : ${d.churned} clients perdus vs ${d.newCustomers} acquis par mois`,
        '- **Actions** :',
        '  - Déployer un programme de suivi proactif des clients à risque',
        '  - Améliorer l\'onboarding et le support client',
        '  - Créer un programme de fidélité',
        '- **KPI de suivi** : Taux de churn mensuel, NPS score',
        '',
        '#### 3. Croissance du Revenu',
        '',
        '- **Objectif** : Augmenter le revenu brut de 20% en 6 mois',
        `- **Situation actuelle** : Revenu brut de ${d.fmt(d.revenue)} DA/mois`,
        '- **Actions** :',
        '  - Lancer des campagnes d\'upselling et cross-selling ciblées',
        '  - Optimiser le tunnel de conversion d\'acquisition',
        `  - Réallouer ${d.fmt(d.marketing)} DA de budget marketing vers les canaux les plus performants`,
        '- **KPI de suivi** : MRR, taux de conversion, ARPU',
        '',
        '### Calendrier de Mise en Œuvre',
        '',
        '| Trimestre | Action | Responsable | Objectif |',
        '|---|---|---|---|',
        '| Q1 | Stabilisation trésorerie | Direction Financière | -30% burn rate |',
        '| Q1-Q2 | Programme rétention | Direction Produit | -25% churn |',
        '| Q2-Q3 | Croissance revenus | Direction Commerciale | +20% MRR |',
      ].join('\n');
    }
    return [
      '## Strategic Action Plan',
      '',
      '### Priority Actions',
      '',
      '#### 1. Cash Stabilization (Critical)',
      `- Current: Cash burn of ${d.fmt(Math.abs(d.cashBurn))}/month`,
      '- Target: Reduce by 30% in 90 days',
      '',
      '#### 2. Customer Retention Optimization',
      `- Current: ${d.churned} churned vs ${d.newCustomers} acquired`,
      '- Target: Reduce churn by 25% in 6 months',
      '',
      '#### 3. Revenue Growth',
      `- Current: Revenue of ${d.fmt(d.revenue)}/month`,
      '- Target: +20% in 6 months',
    ].join('\n');
  }

  private buildSwotSection(isFr: boolean, d: any): string {
    if (isFr) {
      return [
        '## Analyse SWOT',
        '',
        '### Forces (Strengths)',
        '',
        d.prediction.status === 'COMPLETED' ? '- Capacité d\'analyse prédictive ML active et opérationnelle' : '',
        d.newCustomers > 0 ? `- Capacité d'acquisition client (${d.newCustomers} nouveaux clients/mois)` : '',
        '- Plateforme SmartBiz AI avec intelligence artificielle intégrée',
        '- Infrastructure de reporting automatisée',
        '',
        '### Faiblesses (Weaknesses)',
        '',
        d.cashBurn < 0 ? `- **Cash burn net élevé** de ${d.fmt(Math.abs(d.cashBurn))} DA/mois` : '',
        d.churned > d.newCustomers ? `- **Taux de churn supérieur à l'acquisition** (${d.churned} vs ${d.newCustomers})` : '',
        `- Ratio revenu/charges défavorable (${d.revenue > 0 ? ((d.opex || 0) / d.revenue * 100).toFixed(0) : 'N/A'}% de charges)`,
        '- Dépendance potentielle à un nombre limité de canaux de revenus',
        '',
        '### Opportunités (Opportunities)',
        '',
        '- Marché SaaS en croissance avec demande pour l\'analyse prédictive',
        '- Potentiel d\'expansion des revenus par upselling et services premium',
        '- Optimisation de la productivité opérationnelle via l\'automatisation',
        d.kpis?.tam ? `- Marché adressable de ${d.fmt(d.kpis.tam)} DA` : '',
        '',
        '### Menaces (Threats)',
        '',
        d.cashRunwayMonths > 0 && d.cashRunwayMonths < 12 ? `- **Piste de trésorerie limitée** : ${d.cashRunwayMonths.toFixed(1)} mois` : '',
        '- Pression concurrentielle dans le secteur fintech/BI',
        '- Risque de perte accélérée de clients si le churn n\'est pas maîtrisé',
        '- Volatilité des coûts d\'acquisition et des budgets marketing',
      ].filter(Boolean).join('\n');
    }
    return [
      '## SWOT Analysis',
      '',
      '### Strengths',
      d.prediction.status === 'COMPLETED' ? '- Active ML prediction capability' : '',
      `- Customer acquisition: ${d.newCustomers} new/month`,
      '- SmartBiz AI platform with integrated AI',
      '',
      '### Weaknesses',
      d.cashBurn < 0 ? `- High cash burn of ${d.fmt(Math.abs(d.cashBurn))}/month` : '',
      d.churned > d.newCustomers ? `- Churn exceeds acquisition (${d.churned} vs ${d.newCustomers})` : '',
      '',
      '### Opportunities',
      '- Growing SaaS market demand for predictive analytics',
      '- Revenue expansion through upselling and premium features',
      '',
      '### Threats',
      d.cashRunwayMonths > 0 ? `- Limited runway: ${d.cashRunwayMonths.toFixed(1)} months` : '',
      '- Competitive pressure in fintech/BI sector',
    ].filter(Boolean).join('\n');
  }

  private buildPerformanceSection(isFr: boolean, d: any): string {
    if (isFr) {
      return [
        '## Analyse de Performance',
        '',
        '### Indicateurs Opérationnels',
        '',
        `| Métrique | Valeur | Tendance |`,
        `|---|---|---|`,
        `| Revenu brut | ${d.fmt(d.revenue)} DA | ${d.revenue > 0 ? '📈' : '📉'} |`,
        `| Charges opérationnelles | ${d.fmt(d.opex)} DA | - |`,
        `| Marge opérationnelle | ${d.revenue > 0 ? ((d.revenue - d.opex) / d.revenue * 100).toFixed(1) : 'N/A'}% | ${d.revenue > d.opex ? '📈' : '📉'} |`,
        `| Cash burn net | ${d.fmt(d.cashBurn)} DA | ${d.cashBurn >= 0 ? '📈' : '📉'} |`,
        `| Nouveaux clients | ${d.newCustomers} | - |`,
        `| Clients perdus | ${d.churned} | ${d.churned > d.newCustomers ? '📉' : '📈'} |`,
        '',
        '### Analyse de la Marge',
        '',
        `La marge opérationnelle de **${d.revenue > 0 ? ((d.revenue - d.opex) / d.revenue * 100).toFixed(1) : '0'}%** ${d.revenue > d.opex ? 'est positive mais reste fragile' : 'est négative, indiquant que les charges dépassent les revenus'}.`,
        '',
        '### Ventilation des Dépenses',
        '',
        `- **Masse salariale** : ${d.fmt(d.payroll)} DA soit ${d.opex > 0 ? (d.payroll / d.opex * 100).toFixed(1) : '0'}% des charges — ${d.payroll / d.opex > 0.6 ? 'ratio élevé nécessitant attention' : 'dans la norme du secteur'}`,
        `- **Marketing** : ${d.fmt(d.marketing)} DA soit ${d.opex > 0 ? (d.marketing / d.opex * 100).toFixed(1) : '0'}% des charges`,
        `- **Efficacité marketing** : ${d.newCustomers > 0 && d.marketing > 0 ? d.fmt(Math.round(d.marketing / d.newCustomers)) + ' DA/nouveau client' : 'N/A'}`,
      ].join('\n');
    }
    return [
      '## Performance Analysis',
      '',
      `| Metric | Value |`,
      `|---|---|`,
      `| Gross Revenue | ${d.fmt(d.revenue)} |`,
      `| Operating Expenses | ${d.fmt(d.opex)} |`,
      `| Operating Margin | ${d.revenue > 0 ? ((d.revenue - d.opex) / d.revenue * 100).toFixed(1) : 'N/A'}% |`,
      `| New Customers | ${d.newCustomers} |`,
      `| Churned | ${d.churned} |`,
    ].join('\n');
  }

  private buildForecastSection(isFr: boolean, d: any): string {
    if (isFr) {
      return [
        '## Prévisions & Tendances',
        '',
        '### État du Moteur de Prédiction',
        '',
        `Le moteur de machine learning SmartBiz AI est **${d.prediction.status === 'COMPLETED' ? 'actif et opérationnel' : 'en cours de traitement'}**.`,
        '',
        d.prediction.status === 'COMPLETED'
          ? 'Les projections sont basées sur l\'analyse des tendances historiques et intègrent les variables macro-économiques importées.'
          : 'Les projections seront disponibles une fois le traitement ML terminé.',
        '',
        '### Projections de Revenu',
        '',
        d.growthYoy !== 0
          ? `Sur la base de la croissance YoY de **${d.growthYoy.toFixed(1)}%**, la projection de revenu pour les prochains trimestres est la suivante :`
          : 'Les données historiques ne permettent pas de calculer une tendance de croissance annuelle.',
        '',
        d.revenue > 0 ? [
          `| Période | Projection (scénario base) | Projection (optimiste +10%) | Projection (pessimiste -10%) |`,
          `|---|---|---|---|`,
          `| M+3 | ${d.fmt(Math.round(d.revenue * 3))} DA | ${d.fmt(Math.round(d.revenue * 3 * 1.1))} DA | ${d.fmt(Math.round(d.revenue * 3 * 0.9))} DA |`,
          `| M+6 | ${d.fmt(Math.round(d.revenue * 6))} DA | ${d.fmt(Math.round(d.revenue * 6 * 1.15))} DA | ${d.fmt(Math.round(d.revenue * 6 * 0.85))} DA |`,
          `| M+12 | ${d.fmt(Math.round(d.revenue * 12))} DA | ${d.fmt(Math.round(d.revenue * 12 * 1.2))} DA | ${d.fmt(Math.round(d.revenue * 12 * 0.8))} DA |`,
        ].join('\n') : '',
        '',
        '### Tendances Observées',
        '',
        '- La trajectoire de revenu nécessite une accélération de l\'acquisition client',
        d.cashBurn < 0 ? '- Le trend de trésorerie est descendant et requiert une correction structurelle' : '- La tendance de trésorerie est stable et positive',
        '- L\'efficacité opérationnelle doit s\'améliorer pour atteindre le point mort',
      ].filter(Boolean).join('\n');
    }
    return [
      '## Forecasts & Trends',
      '',
      `### ML Prediction Engine: **${d.prediction.status === 'COMPLETED' ? 'Active' : 'Processing'}**`,
      '',
      d.growthYoy !== 0
        ? `Based on YoY growth of **${d.growthYoy.toFixed(1)}%**, revenue projections are detailed above.`
        : 'Historical data does not support annual growth trend calculation.',
      '',
      '### Observed Trends',
      '- Revenue trajectory requires accelerated customer acquisition',
      '- Operational efficiency must improve to reach breakeven',
    ].join('\n');
  }
}
