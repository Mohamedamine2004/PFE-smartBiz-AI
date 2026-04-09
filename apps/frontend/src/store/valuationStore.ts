import { create } from 'zustand';
import type {
  ValuationMethod,
  ValuationMethodInfo,
  ValuationResult,
  SavedValuation,
} from '../types/valuation';

interface ValuationState {
  methods: ValuationMethodInfo[];
  selectedMethod: ValuationMethod | null;
  result: ValuationResult | null;
  loading: boolean;
  error: string | null;

  // History
  history: SavedValuation[];
  historyOpen: boolean;

  // Comparison
  compareResult: ValuationResult | null;
  compareMethod: ValuationMethod | null;

  // Actions
  setMethods: (methods: ValuationMethodInfo[]) => void;
  setSelectedMethod: (method: ValuationMethod) => void;
  setResult: (result: ValuationResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHistory: (history: SavedValuation[]) => void;
  setHistoryOpen: (open: boolean) => void;
  setCompareResult: (result: ValuationResult | null) => void;
  setCompareMethod: (method: ValuationMethod | null) => void;
  reset: () => void;
}

export const useValuationStore = create<ValuationState>((set) => ({
  methods: [],
  selectedMethod: null,
  result: null,
  loading: false,
  error: null,
  history: [],
  historyOpen: false,
  compareResult: null,
  compareMethod: null,
  setMethods: (methods) => set({ methods }),
  setSelectedMethod: (method) =>
    set({ selectedMethod: method, result: null, error: null }),
  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setHistory: (history) => set({ history }),
  setHistoryOpen: (open) => set({ historyOpen: open }),
  setCompareResult: (result) => set({ compareResult: result }),
  setCompareMethod: (method) => set({ compareMethod: method }),
  reset: () =>
    set({
      selectedMethod: null,
      result: null,
      error: null,
      compareResult: null,
      compareMethod: null,
    }),
}));
