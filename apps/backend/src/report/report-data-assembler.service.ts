import { Injectable } from '@nestjs/common';
import { FinancialRow } from './interfaces/report-content.types';

@Injectable()
export class ReportDataAssembler {
  extractAnnualNumbers(
    annualData: Record<string, unknown>,
  ): Record<string, number> {
    const toNumber = (value: unknown): number => {
      if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
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

  extractLatestMetrics(financialData: FinancialRow[]): Record<string, number> {
    const metrics: Record<string, number> = {};
    const sorted = [...financialData]
      .filter((r) => r.metric && r.value !== undefined)
      .sort(
        (a, b) =>
          new Date(b.period ?? 0).getTime() - new Date(a.period ?? 0).getTime(),
      );

    for (const row of sorted) {
      const key = row.metric ?? '';
      if (!metrics[key]) {
        metrics[key] = Number(row.value) || 0;
      }
    }
    return metrics;
  }

  buildMonthlyTable(
    financialData: FinancialRow[],
    maxMonthlyTableChars: number,
  ): string {
    const rows = financialData
      .filter((row) => typeof row.metric === 'string')
      .slice(-24)
      .map((row) => {
        const date = row.period
          ? new Date(row.period).toISOString().slice(0, 10)
          : 'N/A';
        return `${row.metric}: ${Number(row.value ?? 0).toFixed(2)} (${date})`;
      });

    if (rows.length === 0) return 'No monthly data available.';

    let joined = rows.join('\n');
    if (joined.length > maxMonthlyTableChars) {
      let lines = [...rows];
      while (joined.length > maxMonthlyTableChars && lines.length > 1) {
        lines = lines.slice(1);
        joined = lines.join('\n');
      }
    }
    return joined;
  }
}
