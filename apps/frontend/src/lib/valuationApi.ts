import api from './axios';
import type {
  ValuationInputs,
  ValuationMethodInfo,
  ValuationResult,
  SavedValuation,
} from '../types/valuation';

export const valuationApi = {
  getMethods: async (): Promise<ValuationMethodInfo[]> => {
    const { data } = await api.get('/valuation/methods');
    return data;
  },

  calculate: async (inputs: ValuationInputs): Promise<ValuationResult> => {
    const { data } = await api.post('/valuation/calculate', inputs);
    return data;
  },

  // ── Save & History ───────────────────────────────

  save: async (
    inputs: ValuationInputs & { label?: string },
  ): Promise<SavedValuation> => {
    const { data } = await api.post('/valuation/save', inputs);
    return data;
  },

  getHistory: async (limit = 20): Promise<SavedValuation[]> => {
    const { data } = await api.get('/valuation/history', {
      params: { limit },
    });
    return data;
  },

  getById: async (id: string): Promise<SavedValuation> => {
    const { data } = await api.get(`/valuation/history/${id}`);
    return data;
  },

  deleteValuation: async (id: string): Promise<void> => {
    await api.delete(`/valuation/history/${id}`);
  },
};
