import api from './axios';
import type {
  GenerateReportPayload,
  ReportJobStatus,
  ReportJobSummary,
} from '../types/report';

const extractFilename = (contentDisposition?: string): string => {
  if (!contentDisposition) return 'report.pdf';

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return 'report.pdf';
};

export const reportApi = {
  generate: async (payload: GenerateReportPayload): Promise<ReportJobSummary> => {
    const { data } = await api.post('/report/generate', payload);
    return data;
  },

  list: async (limit = 20): Promise<ReportJobSummary[]> => {
    const { data } = await api.get('/report/jobs', { params: { limit } });
    return data;
  },

  status: async (id: string): Promise<ReportJobStatus> => {
    const { data } = await api.get(`/report/jobs/${id}`);
    return data;
  },

  download: async (id: string): Promise<{ blob: Blob; filename: string }> => {
    const response = await api.get(`/report/jobs/${id}/download`, {
      responseType: 'blob',
    });

    const filename = extractFilename(response.headers['content-disposition']);
    return {
      blob: new Blob([response.data], { type: 'application/pdf' }),
      filename,
    };
  },
};
