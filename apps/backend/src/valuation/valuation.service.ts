import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CalculateValuationDto,
  ValuationMethod,
} from './dto/calculate-valuation.dto';
import { SaveValuationDto } from './dto/save-valuation.dto';

export interface ValuationResult {
  method: ValuationMethod;
  enterpriseValue: number | null;
  equityValue: number;
  formula: string;
  explanation: string;
  inputs: Record<string, number>;
}

export interface SavedValuationRecord {
  id: string;
  method: string;
  inputs: any;
  enterpriseValue: number | null;
  equityValue: number;
  formula: string;
  explanation: string;
  label: string | null;
  createdAt: Date;
}

export interface ValuationMethodInfo {
  id: ValuationMethod;
  name: string;
  formula: string;
  description: string;
  bestUseCase: string;
  requiredFields: string[];
}

@Injectable()
export class ValuationService {
  constructor(private readonly prisma: PrismaService) {}
  getMethods(): ValuationMethodInfo[] {
    return [
      {
        id: ValuationMethod.EV_EBITDA,
        name: 'EV / EBITDA',
        formula: 'EV = EBITDA × Multiple → Equity = EV − Net Debt',
        description:
          'Values a company based on its operating earnings before non-cash charges.',
        bestUseCase:
          'Profitable companies, private equity, public comps comparison.',
        requiredFields: ['ebitda', 'multiple', 'netDebt'],
      },
      {
        id: ValuationMethod.EV_REVENUE,
        name: 'EV / Revenue',
        formula: 'EV = Revenue × Multiple → Equity = EV − Net Debt',
        description:
          'Values a company based on its top-line revenue, useful when earnings are negative.',
        bestUseCase: 'Startups, SaaS, high-growth, not yet profitable.',
        requiredFields: ['revenue', 'multiple', 'netDebt'],
      },
      {
        id: ValuationMethod.PE_RATIO,
        name: 'P/E Ratio',
        formula: 'Equity = Net Income × P/E',
        description:
          'Values equity directly based on earnings and a price-to-earnings multiple.',
        bestUseCase: 'Public companies, simple equity estimate.',
        requiredFields: ['netIncome', 'peRatio'],
      },
      {
        id: ValuationMethod.ASSET_BASED,
        name: 'Asset-Based (Book Value)',
        formula: 'Equity = Total Assets − Total Liabilities',
        description:
          'Values equity as the net book value of assets minus liabilities.',
        bestUseCase:
          'Distressed companies, liquidation scenarios, asset-heavy businesses.',
        requiredFields: ['totalAssets', 'totalLiabilities'],
      },
      {
        id: ValuationMethod.GORDON_GROWTH,
        name: 'Gordon Growth Model',
        formula: 'Value = FCF × (1 + g) / (WACC − g)',
        description:
          'Discounted cash flow approach for stable, mature companies with predictable growth.',
        bestUseCase:
          'Mature, stable companies with predictable cash flows.',
        requiredFields: ['freeCashFlow', 'growthRate', 'wacc'],
      },
    ];
  }

  calculate(dto: CalculateValuationDto): ValuationResult {
    switch (dto.method) {
      case ValuationMethod.EV_EBITDA:
        return this.calculateEvEbitda(dto);
      case ValuationMethod.EV_REVENUE:
        return this.calculateEvRevenue(dto);
      case ValuationMethod.PE_RATIO:
        return this.calculatePeRatio(dto);
      case ValuationMethod.ASSET_BASED:
        return this.calculateAssetBased(dto);
      case ValuationMethod.GORDON_GROWTH:
        return this.calculateGordonGrowth(dto);
      default:
        throw new BadRequestException('Unknown valuation method.');
    }
  }

  private calculateEvEbitda(dto: CalculateValuationDto): ValuationResult {
    const ebitda = dto.ebitda!;
    const multiple = dto.multiple!;
    const netDebt = dto.netDebt!;
    const ev = ebitda * multiple;
    const equity = ev - netDebt;

    return {
      method: ValuationMethod.EV_EBITDA,
      enterpriseValue: this.round(ev),
      equityValue: this.round(equity),
      formula: `EV = ${ebitda.toLocaleString()} × ${multiple} = ${this.round(ev).toLocaleString()} → Equity = ${this.round(ev).toLocaleString()} − ${netDebt.toLocaleString()} = ${this.round(equity).toLocaleString()}`,
      explanation:
        'Enterprise Value is calculated by multiplying EBITDA by the industry multiple. Equity Value is derived by subtracting Net Debt from EV.',
      inputs: { ebitda, multiple, netDebt },
    };
  }

  private calculateEvRevenue(dto: CalculateValuationDto): ValuationResult {
    const revenue = dto.revenue!;
    const multiple = dto.multiple!;
    const netDebt = dto.netDebt!;
    const ev = revenue * multiple;
    const equity = ev - netDebt;

    return {
      method: ValuationMethod.EV_REVENUE,
      enterpriseValue: this.round(ev),
      equityValue: this.round(equity),
      formula: `EV = ${revenue.toLocaleString()} × ${multiple} = ${this.round(ev).toLocaleString()} → Equity = ${this.round(ev).toLocaleString()} − ${netDebt.toLocaleString()} = ${this.round(equity).toLocaleString()}`,
      explanation:
        'Enterprise Value is calculated by multiplying Revenue by the industry multiple. Equity Value subtracts Net Debt.',
      inputs: { revenue, multiple, netDebt },
    };
  }

  private calculatePeRatio(dto: CalculateValuationDto): ValuationResult {
    const netIncome = dto.netIncome!;
    const peRatio = dto.peRatio!;
    const equity = netIncome * peRatio;

    return {
      method: ValuationMethod.PE_RATIO,
      enterpriseValue: null,
      equityValue: this.round(equity),
      formula: `Equity = ${netIncome.toLocaleString()} × ${peRatio} = ${this.round(equity).toLocaleString()}`,
      explanation:
        'Equity Value is calculated directly by multiplying Net Income by the P/E ratio. No separate Enterprise Value is computed.',
      inputs: { netIncome, peRatio },
    };
  }

  private calculateAssetBased(dto: CalculateValuationDto): ValuationResult {
    const totalAssets = dto.totalAssets!;
    const totalLiabilities = dto.totalLiabilities!;
    const equity = totalAssets - totalLiabilities;

    return {
      method: ValuationMethod.ASSET_BASED,
      enterpriseValue: null,
      equityValue: this.round(equity),
      formula: `Equity = ${totalAssets.toLocaleString()} − ${totalLiabilities.toLocaleString()} = ${this.round(equity).toLocaleString()}`,
      explanation:
        'Equity Value equals Total Assets minus Total Liabilities (book value approach).',
      inputs: { totalAssets, totalLiabilities },
    };
  }

  private calculateGordonGrowth(dto: CalculateValuationDto): ValuationResult {
    const freeCashFlow = dto.freeCashFlow!;
    const growthRate = dto.growthRate!;
    const wacc = dto.wacc!;

    if (wacc <= growthRate) {
      throw new BadRequestException(
        'WACC must be greater than the growth rate for the Gordon Growth Model.',
      );
    }

    const equity = (freeCashFlow * (1 + growthRate)) / (wacc - growthRate);

    return {
      method: ValuationMethod.GORDON_GROWTH,
      enterpriseValue: null,
      equityValue: this.round(equity),
      formula: `Value = ${freeCashFlow.toLocaleString()} × (1 + ${growthRate}) / (${wacc} − ${growthRate}) = ${this.round(equity).toLocaleString()}`,
      explanation:
        'Intrinsic value is estimated using the Gordon Growth Model by discounting future free cash flows at the WACC minus the perpetual growth rate.',
      inputs: { freeCashFlow, growthRate, wacc },
    };
  }

  // ── Save & History ──────────────────────────────────────

  async saveValuation(
    dto: SaveValuationDto,
    userId: string,
    companyId: string,
  ): Promise<SavedValuationRecord> {
    // Calculate first
    const result = this.calculate(dto as CalculateValuationDto);

    const saved = await this.prisma.savedValuation.create({
      data: {
        companyId,
        userId,
        method: dto.method,
        inputs: result.inputs,
        enterpriseValue: result.enterpriseValue,
        equityValue: result.equityValue,
        formula: result.formula,
        explanation: result.explanation,
        label: dto.label ?? null,
      },
    });

    return saved;
  }

  async getHistory(
    companyId: string,
    limit = 20,
  ): Promise<SavedValuationRecord[]> {
    return this.prisma.savedValuation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async deleteValuation(id: string, companyId: string): Promise<void> {
    const record = await this.prisma.savedValuation.findFirst({
      where: { id, companyId },
    });
    if (!record) {
      throw new BadRequestException('Valuation not found.');
    }
    await this.prisma.savedValuation.delete({ where: { id } });
  }

  async getValuationById(
    id: string,
    companyId: string,
  ): Promise<SavedValuationRecord | null> {
    return this.prisma.savedValuation.findFirst({
      where: { id, companyId },
    });
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
