import { IsEnum, IsNumber, IsPositive, ValidateIf } from 'class-validator';

export enum ValuationMethod {
  EV_EBITDA = 'EV_EBITDA',
  EV_REVENUE = 'EV_REVENUE',
  PE_RATIO = 'PE_RATIO',
  ASSET_BASED = 'ASSET_BASED',
  GORDON_GROWTH = 'GORDON_GROWTH',
}

export class CalculateValuationDto {
  @IsEnum(ValuationMethod)
  method: ValuationMethod;

  // EV/EBITDA
  @ValidateIf((o) => o.method === ValuationMethod.EV_EBITDA)
  @IsNumber()
  @IsPositive()
  ebitda?: number;

  @ValidateIf(
    (o) =>
      o.method === ValuationMethod.EV_EBITDA ||
      o.method === ValuationMethod.EV_REVENUE,
  )
  @IsNumber()
  @IsPositive()
  multiple?: number;

  @ValidateIf(
    (o) =>
      o.method === ValuationMethod.EV_EBITDA ||
      o.method === ValuationMethod.EV_REVENUE,
  )
  @IsNumber()
  netDebt?: number;

  // EV/Revenue
  @ValidateIf((o) => o.method === ValuationMethod.EV_REVENUE)
  @IsNumber()
  @IsPositive()
  revenue?: number;

  // P/E Ratio
  @ValidateIf((o) => o.method === ValuationMethod.PE_RATIO)
  @IsNumber()
  @IsPositive()
  netIncome?: number;

  @ValidateIf((o) => o.method === ValuationMethod.PE_RATIO)
  @IsNumber()
  @IsPositive()
  peRatio?: number;

  // Asset-Based
  @ValidateIf((o) => o.method === ValuationMethod.ASSET_BASED)
  @IsNumber()
  @IsPositive()
  totalAssets?: number;

  @ValidateIf((o) => o.method === ValuationMethod.ASSET_BASED)
  @IsNumber()
  totalLiabilities?: number;

  // Gordon Growth
  @ValidateIf((o) => o.method === ValuationMethod.GORDON_GROWTH)
  @IsNumber()
  @IsPositive()
  freeCashFlow?: number;

  @ValidateIf((o) => o.method === ValuationMethod.GORDON_GROWTH)
  @IsNumber()
  growthRate?: number;

  @ValidateIf((o) => o.method === ValuationMethod.GORDON_GROWTH)
  @IsNumber()
  @IsPositive()
  wacc?: number;
}
