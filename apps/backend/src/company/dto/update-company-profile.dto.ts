import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateCompanyProfileDto {
  @IsString()
  @IsNotEmpty()
  sector: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStart: number;

  @IsOptional()
  @IsString()
  country?: string;
}
