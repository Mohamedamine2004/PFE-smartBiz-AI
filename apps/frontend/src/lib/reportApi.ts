import api from './axios';
import type {
  GenerateReportPayload,
  ReportJobStatus,
  ReportJobSummary,
} from '../types/report';

const BASE = '/report';

const extractFilename = (contentDisposition?: string): string => {
  if (!contentDisposition) return 'report.pdf';
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) return asciiMatch[1];
  return 'report.pdf';
};

export const reportApi = {
  /** Create a new report job (5-question wizard) */
  generate: async (payload: GenerateReportPayload): Promise<ReportJobSummary> => {
    const { data } = await api.post(`${BASE}/generate`, payload);
    return data;
  },

  /** List report history for current company */
  list: async (limit = 20): Promise<ReportJobSummary[]> => {
    const { data } = await api.get(`${BASE}/jobs`, { params: { limit } });
    return data;
  },

  /** Get detailed status of a specific report */
  status: async (id: string): Promise<ReportJobStatus> => {
    const { data } = await api.get(`${BASE}/jobs/${id}`);
    return data;
  },

  /** Download report PDF as file attachment */
  download: async (id: string): Promise<{ blob: Blob; filename: string }> => {
    const response = await api.get(`${BASE}/jobs/${id}/download`, {
      responseType: 'blob',
    });
    const filename = extractFilename(response.headers['content-disposition']);
    return {
      blob: new Blob([response.data], { type: 'application/pdf' }),
      filename,
    };
  },

  /** Get preview URL (inline PDF — for iframe viewer) */
  previewUrl: (id: string): string => {
    // Returns a URL suitable for use in <iframe src={...}>
    // The token must be appended via the axios base URL
    const baseURL = (api.defaults.baseURL ?? '').replace(/\/$/, '');
    return `${baseURL}${BASE}/jobs/${id}/preview`;
  },

  /** Delete a report job */
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/jobs/${id}`);
  },

  /** Check AI provider health */
  aiHealth: async (): Promise<{
    provider: string;
    configured: boolean;
    model: string;
  }> => {
    const { data } = await api.get(`${BASE}/ai/health`);
    return data;
  },
};
