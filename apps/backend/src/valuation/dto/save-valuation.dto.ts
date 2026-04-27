import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ValuationMethod } from './calculate-valuation.dto';

export class SaveValuationDto {
  @IsEnum(ValuationMethod)
  method: ValuationMethod;

  // --- inputs (same validation as CalculateValuationDto) ---

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

  @ValidateIf((o) => o.method === ValuationMethod.EV_REVENUE)
  @IsNumber()
  @IsPositive()
  revenue?: number;

  @ValidateIf((o) => o.method === ValuationMethod.PE_RATIO)
  @IsNumber()
  @IsPositive()
  netIncome?: number;

  @ValidateIf((o) => o.method === ValuationMethod.PE_RATIO)
  @IsNumber()
  @IsPositive()
  peRatio?: number;

  @ValidateIf((o) => o.method === ValuationMethod.ASSET_BASED)
  @IsNumber()
  @IsPositive()
  totalAssets?: number;

  @ValidateIf((o) => o.method === ValuationMethod.ASSET_BASED)
  @IsNumber()
  totalLiabilities?: number;

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

  // --- optional label ---
  @IsOptional()
  @IsString()
  label?: string;
}
