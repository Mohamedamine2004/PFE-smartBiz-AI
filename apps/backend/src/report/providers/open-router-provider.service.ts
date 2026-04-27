import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LlmProvider } from '../interfaces/report-services.interfaces';

@Injectable()
export class OpenRouterProviderService implements LlmProvider {
  private readonly logger = new Logger(OpenRouterProviderService.name);
  readonly name = 'openrouter' as const;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('OPENROUTER_API_KEY')?.trim() || '';
    this.model =
      this.configService.get<string>('OPENROUTER_MODEL')?.trim() ||
      'mistralai/mistral-7b-instruct';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async generateSection(prompt: string, _sectionKey: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key is not configured');
    }
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const referer =
      this.configService.get<string>('OPENROUTER_HTTP_REFERER') ||
      'http://localhost:5173';

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': referer,
      'X-Title': 'SmartBiz AI - Report generation',
    };

    const maxTokens = Number.parseInt(
      this.configService.get<string>('OPENROUTER_MAX_TOKENS') || '4096',
      10,
    );

    const requestBody = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    };

    const response = await axios.post(url, requestBody, {
      headers,
      timeout: 90000,
    });
    const text = this.extractContent(response.data);

    if (!text || text.trim().length === 0) {
      throw new Error('OpenRouter returned an empty response');
    }

    return this.normalizeResponseText(text);
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.generateSection('Reply with only the word OK', 'TEST');
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private extractContent(data: unknown): string {
    const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })
      ?.choices?.[0]?.message?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((p) => {
          if (typeof p === 'string') {
            return p;
          }
          if (p && typeof p === 'object') {
            const part = p as Record<string, unknown>;
            if (typeof part.text === 'string') {
              return part.text;
            }
            if (typeof part.content === 'string') {
              return part.content;
            }
          }
          return '';
        })
        .join('');
    }
    return '';
  }

  getModel(): string {
    return this.model;
  }

  private normalizeResponseText(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
