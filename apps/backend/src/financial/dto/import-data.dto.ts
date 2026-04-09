import { IsString, IsNumber, IsDate, IsNotEmpty, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Sheet 2: Monthly Cashflow
export class FinancialRowDto {
  @IsString()
  @IsNotEmpty()
  metric: string;

  @IsNumber()
  value: number;

  @IsDate()
  @Type(() => Date)
  period: Date;
}

// Sheet 3: Strategic KPIs
export class StrategicKpiDto {
  @IsNumber() @Min(0) cac: number;
  @IsNumber() @Min(0) ltv: number;
  @IsNumber() @IsPositive() tam: number;
  @IsNumber() @Min(0) marketShare: number;
  @IsNumber() @IsPositive() employeeCount: number;
}