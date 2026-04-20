import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prediction')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  /**
   * POST /api/v1/prediction/run
   * Triggers a new ML prediction for the authenticated user's company.
   */
  @Roles(UserRole.ADMIN, UserRole.COLLAB)
  @Post('run')
  async runPrediction(
    @CurrentUser() user: JwtPayload,
    @Body('batchId') batchId?: string,
  ) {
    return await this.predictionService.runPrediction(user.companyId, batchId);
  }

  /**
   * GET /api/v1/prediction/latest
   * Returns the most recent completed prediction for the company.
   */
  @Roles(UserRole.ADMIN, UserRole.COLLAB, UserRole.READER)
  @Get('latest')
  async getLatest(
    @CurrentUser() user: JwtPayload,
    @Query('batchId') batchId?: string,
  ) {
    return await this.predictionService.getLatestPrediction(user.companyId, batchId);
  }
}
