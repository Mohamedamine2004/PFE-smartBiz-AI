import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ValuationService,
  type ValuationResult,
  type ValuationMethodInfo,
  type SavedValuationRecord,
} from './valuation.service';
import { CalculateValuationDto } from './dto/calculate-valuation.dto';
import { SaveValuationDto } from './dto/save-valuation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('valuation')
@UseGuards(JwtAuthGuard)
export class ValuationController {
  constructor(private readonly valuationService: ValuationService) {}

  @Get('methods')
  getMethods(): ValuationMethodInfo[] {
    return this.valuationService.getMethods();
  }

  @Post('calculate')
  calculate(@Body() dto: CalculateValuationDto): ValuationResult {
    return this.valuationService.calculate(dto);
  }

  // ── Save & History ──────────────────────────────

  @Post('save')
  save(
    @Body() dto: SaveValuationDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<SavedValuationRecord> {
    return this.valuationService.saveValuation(dto, userId, companyId);
  }

  @Get('history')
  getHistory(
    @CurrentUser('companyId') companyId: string,
    @Query('limit') limit?: string,
  ): Promise<SavedValuationRecord[]> {
    return this.valuationService.getHistory(
      companyId,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('history/:id')
  getById(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<SavedValuationRecord | null> {
    return this.valuationService.getValuationById(id, companyId);
  }

  @Delete('history/:id')
  async deleteValuation(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<{ deleted: boolean }> {
    await this.valuationService.deleteValuation(id, companyId);
    return { deleted: true };
  }
}
