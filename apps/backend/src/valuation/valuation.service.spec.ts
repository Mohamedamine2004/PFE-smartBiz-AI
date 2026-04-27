import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ValuationService } from './valuation.service';
import { ValuationMethod } from './dto/calculate-valuation.dto';

describe('ValuationService', () => {
  let service: ValuationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValuationService],
    }).compile();

    service = module.get<ValuationService>(ValuationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMethods', () => {
    it('should return 5 valuation methods', () => {
      const methods = service.getMethods();
      expect(methods).toHaveLength(5);
    });

    it('should return methods with required properties', () => {
      const methods = service.getMethods();
      methods.forEach((m) => {
        expect(m).toHaveProperty('id');
        expect(m).toHaveProperty('name');
        expect(m).toHaveProperty('formula');
        expect(m).toHaveProperty('description');
        expect(m).toHaveProperty('bestUseCase');
        expect(m).toHaveProperty('requiredFields');
      });
    });
  });

  describe('EV/EBITDA', () => {
    it('should calculate correctly', () => {
      const result = service.calculate({
        method: ValuationMethod.EV_EBITDA,
        ebitda: 1000000,
        multiple: 8,
        netDebt: 2000000,
      });
      expect(result.enterpriseValue).toBe(8000000);
      expect(result.equityValue).toBe(6000000);
      expect(result.method).toBe(ValuationMethod.EV_EBITDA);
    });

    it('should handle zero net debt', () => {
      const result = service.calculate({
        method: ValuationMethod.EV_EBITDA,
        ebitda: 500000,
        multiple: 10,
        netDebt: 0,
      });
      expect(result.enterpriseValue).toBe(5000000);
      expect(result.equityValue).toBe(5000000);
    });
  });

  describe('EV/Revenue', () => {
    it('should calculate correctly', () => {
      const result = service.calculate({
        method: ValuationMethod.EV_REVENUE,
        revenue: 5000000,
        multiple: 3,
        netDebt: 1000000,
      });
      expect(result.enterpriseValue).toBe(15000000);
      expect(result.equityValue).toBe(14000000);
    });
  });

  describe('P/E Ratio', () => {
    it('should calculate correctly', () => {
      const result = service.calculate({
        method: ValuationMethod.PE_RATIO,
        netIncome: 500000,
        peRatio: 15,
      });
      expect(result.enterpriseValue).toBeNull();
      expect(result.equityValue).toBe(7500000);
    });
  });

  describe('Asset-Based', () => {
    it('should calculate correctly', () => {
      const result = service.calculate({
        method: ValuationMethod.ASSET_BASED,
        totalAssets: 10000000,
        totalLiabilities: 4000000,
      });
      expect(result.enterpriseValue).toBeNull();
      expect(result.equityValue).toBe(6000000);
    });

    it('should handle negative equity', () => {
      const result = service.calculate({
        method: ValuationMethod.ASSET_BASED,
        totalAssets: 3000000,
        totalLiabilities: 5000000,
      });
      expect(result.equityValue).toBe(-2000000);
    });
  });

  describe('Gordon Growth', () => {
    it('should calculate correctly', () => {
      const result = service.calculate({
        method: ValuationMethod.GORDON_GROWTH,
        freeCashFlow: 1000000,
        growthRate: 0.03,
        wacc: 0.1,
      });
      // 1000000 * 1.03 / 0.07 = 14714285.71
      expect(result.equityValue).toBeCloseTo(14714285.71, 0);
    });

    it('should throw if WACC <= growthRate', () => {
      expect(() =>
        service.calculate({
          method: ValuationMethod.GORDON_GROWTH,
          freeCashFlow: 1000000,
          growthRate: 0.1,
          wacc: 0.05,
        }),
      ).toThrow(BadRequestException);
    });

    it('should throw if WACC equals growthRate', () => {
      expect(() =>
        service.calculate({
          method: ValuationMethod.GORDON_GROWTH,
          freeCashFlow: 1000000,
          growthRate: 0.1,
          wacc: 0.1,
        }),
      ).toThrow(BadRequestException);
    });
  });
});
