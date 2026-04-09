import api from './axios.ts';

export const financialApi = {
  /**
   * Downloads the Excel template.
   */
  downloadTemplate: async () => {
    const response = await api.get('/financial/template', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'SmartBiz_Financial_Template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Uploads the completed Excel file to the backend.
   */
  importData: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/financial/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Fetches dashboard metrics for the latest batch.
   */
  getDashboardMetrics: async () => {
    const response = await api.get('/financial/dashboard-metrics');
    return response.data;
  },

  /**
   * Fetches metrics for a specific historical import batch.
   */
  getDashboardMetricsByBatchId: async (batchId: string) => {
    const response = await api.get(`/financial/dashboard-metrics/${batchId}`);
    return response.data;
  },

  /**
   * Fetches the full import history (all batches).
   */
  getImportHistory: async () => {
    const response = await api.get('/financial/imports');
    return response.data;
  },

  /**
   * Deletes a specific import batch.
   */
  deleteImportBatch: async (batchId: string) => {
    const response = await api.delete(`/financial/imports/${batchId}`);
    return response.data;
  },

  /**
   * Fetches the latest ML prediction result.
   */
  getPrediction: async () => {
    const response = await api.get('/prediction/latest');
    return response.data;
  },

  /**
   * Triggers a new ML prediction (POST /prediction/run).
   */
  runPrediction: async () => {
    const response = await api.post('/prediction/run');
    return response.data;
  },
};