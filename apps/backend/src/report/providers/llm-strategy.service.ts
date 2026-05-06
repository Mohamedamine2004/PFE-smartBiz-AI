import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { GeminiProviderService } from './gemini-provider.service';
import { OpenRouterProviderService } from './open-router-provider.service';
import { LlmProvider } from '../interfaces/report-services.interfaces';
import { ReportContentSource } from '../interfaces/report-content.types';

@Injectable()
export class LlmStrategyService {
  private readonly logger = new Logger(LlmStrategyService.name);
  private primaryProvider: LlmProvider | null = null;
  private fallbackProvider: LlmProvider | null = null;

  /** Track providers that are permanently blocked (limit: 0) this session */
  private blockedProviders = new Set<string>();
  
  /** Track providers with quota exhaustion to fail fast */
  private quotaExhausted = new Map<string, number>();

  constructor(
    private readonly geminiProvider: GeminiProviderService,
    private readonly openRouterProvider: OpenRouterProviderService,
  ) {
    this.selectProvider();
  }

  private selectProvider() {
    const providers: LlmProvider[] = [];
    if (this.geminiProvider.isConfigured()) {
      providers.push(this.geminiProvider);
    }
    if (this.openRouterProvider.isConfigured()) {
      providers.push(this.openRouterProvider);
    }

    if (providers.length > 0) {
      this.primaryProvider = providers[0];
      this.logger.log(`Primary LLM Provider: ${this.primaryProvider.name}`);
      if (providers.length > 1) {
        this.fallbackProvider = providers[1];
        this.logger.log(`Fallback LLM Provider: ${this.fallbackProvider.name}`);
      }
    } else {
      this.logger.warn('No active AI provider configured.');
    }
  }

  async generate(
    prompt: string,
    sectionKey: string,
  ): Promise<{ text: string; source: ReportContentSource }> {
    const providersToTry = [this.primaryProvider, this.fallbackProvider].filter(
      (p): p is LlmProvider => p !== null && !this.blockedProviders.has(p.name),
    );

    if (providersToTry.length === 0) {
      throw new Error('No LLM Provider available (all blocked or unconfigured)');
    }

    let globalLastError: Error | null = null;

    for (const provider of providersToTry) {
      const MAX_ATTEMPTS = 3;
      let providerLastError: Error | null = null;
      let success = false;
      let text = '';

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          this.logger.log(
            `Attempt ${attempt + 1}/${MAX_ATTEMPTS} for section ${sectionKey} using ${provider.name}`,
          );
          text = await provider.generateSection(prompt, sectionKey);
          success = true;
          break;
        } catch (error: unknown) {
          const msg = this.describeLlmHttpError(error);
          providerLastError = new Error(msg);
          this.logger.warn(
            `Attempt ${attempt + 1} failed for ${sectionKey} on ${provider.name}: ${msg.substring(0, 200)}`,
          );

          // ─── Permanent failures: skip immediately to next provider ───
          if (
            msg.includes('401') ||
            msg.includes('402') ||
            msg.includes('403') ||
            msg.includes('API_KEY') ||
            msg.includes('PERMISSION_DENIED')
          ) {
            this.blockedProviders.add(provider.name);
            this.logger.error(`Provider ${provider.name} permanently blocked (auth error). Skipping.`);
            break;
          }

          // Check for permanent quota exhaustion (limit: 0)
          if (msg.includes('limit: 0') || msg.includes('limit:0')) {
            this.blockedProviders.add(provider.name);
            this.logger.error(
              `Provider ${provider.name} has ZERO quota (limit: 0). Skipping for this session.`,
            );
            break;
          }

          // 404 = model not found, skip immediately
          if (msg.includes('404') || msg.includes('No endpoints found')) {
            this.blockedProviders.add(provider.name);
            this.logger.error(`Provider ${provider.name} model not found (404). Skipping.`);
            break;
          }

          // Rate limit / Quota exhaustion handling (fast failover)
          if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
            // Track quota exhaustion count
            const quotaCount = (this.quotaExhausted.get(provider.name) || 0) + 1;
            this.quotaExhausted.set(provider.name, quotaCount);

            // If quota exhausted twice, skip provider entirely (likely daily limit)
            if (quotaCount >= 2) {
              this.logger.error(
                `Provider ${provider.name} quota exhausted (${quotaCount} consecutive 429s). Switching to fallback.`,
              );
              this.blockedProviders.add(provider.name);
              break;
            }

            // First 429: short 3-second wait before trying fallback
            this.logger.log(
              `Rate limited on ${provider.name} (attempt ${attempt + 1}). Short wait before fallback (3s)...`,
            );
            await new Promise((r) => setTimeout(r, 3000));
            
            // Skip remaining attempts, go to next provider
            break;
          }

          // General error — short backoff
          if (attempt < MAX_ATTEMPTS - 1) {
            const delay = 2000 * (attempt + 1);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }

      if (success) {
        return { text, source: provider.name };
      }

      globalLastError = providerLastError;
      this.logger.error(
        `Provider ${provider.name} failed for ${sectionKey}. Trying next provider...`,
      );
    }

    throw (
      globalLastError || new Error(`All LLM providers failed for section ${sectionKey}`)
    );
  }

  getHealth() {
    return {
      primary: this.primaryProvider?.name || 'none',
      fallback: this.fallbackProvider?.name || 'none',
      configured: !!this.primaryProvider,
      model: this.getModel(),
      blocked: Array.from(this.blockedProviders),
    };
  }

  async testConnection() {
    if (!this.primaryProvider) return { ok: false, error: 'No provider' };
    return this.primaryProvider.testConnection();
  }

  getModel(): string {
    if (this.primaryProvider instanceof GeminiProviderService) {
      return this.primaryProvider.getModel();
    }
    if (this.primaryProvider instanceof OpenRouterProviderService) {
      return this.primaryProvider.getModel();
    }
    return 'none';
  }

  /**
   * Parse the retryDelay seconds from a Google API 429 error response.
   */
  private parseRetryDelay(error: unknown): number {
    try {
      const msg = error instanceof Error ? error.message : String(error);
      const match = msg.match(/retry.*?(\d+(?:\.\d+)?)s/i);
      if (match) {
        return Math.ceil(parseFloat(match[1]));
      }
    } catch {
      // ignore parsing errors
    }
    return 0;
  }

  private describeLlmHttpError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as
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
}
