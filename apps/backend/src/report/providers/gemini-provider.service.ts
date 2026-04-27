import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LlmProvider } from '../interfaces/report-services.interfaces';

@Injectable()
export class GeminiProviderService implements LlmProvider {
  private readonly logger = new Logger(GeminiProviderService.name);
  readonly name = 'gemini' as const;
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY')?.trim() || '';
    this.modelName = this.configService.get<string>('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash';
    
    if (this.isConfigured()) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async generateSection(prompt: string, sectionKey: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          maxOutputTokens: 8192, // Gemini supports high output tokens
          temperature: 0.7,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Gemini returned an empty response');
      }

      return this.normalizeResponseText(text);
    } catch (error: any) {
      this.logger.error(`Error generating section ${sectionKey} with Gemini: ${error.message}`, error.stack);
      throw error;
    }
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

  getModel(): string {
    return this.modelName;
  }

  private normalizeResponseText(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, '') // remove code blocks just in case
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
