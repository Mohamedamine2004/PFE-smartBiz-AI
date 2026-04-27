import {
  Body,
  Controller,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
  Sse,
} from '@nestjs/common';
import { createReadStream } from 'node:fs';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportService } from './report.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Roles(UserRole.ADMIN, UserRole.COLLAB)
  @Post('generate')
  async generate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateReportDto,
  ) {
    return this.reportService.createReportJob(user.companyId, user.userId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.COLLAB, UserRole.READER)
  @Get('jobs')
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reportService.listReports(user.companyId, limit ?? 20);
  }

  @Roles(UserRole.ADMIN, UserRole.COLLAB, UserRole.READER)
  @Get('ai/health')
  async aiHealth() {
    return this.reportService.getAiHealth();
  }

  @Roles(UserRole.ADMIN, UserRole.COLLAB, UserRole.READER)
  @Get('jobs/:id')
  async status(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.reportService.getReportStatus(user.companyId, id);
  }

  @Roles(UserRole.ADMIN, UserRole.COLLAB, UserRole.READER)
  @Get('jobs/:id/download')
  async download(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const info = await this.reportService.getDownloadInfo(user.companyId, id);
    const stream = createReadStream(info.path);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${info.filename}"`,
    });

    return new StreamableFile(stream);
  }

  @Roles(UserRole.ADMIN, UserRole.COLLAB, UserRole.READER)
  @Get('jobs/:id/preview')
  async preview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const info = await this.reportService.getDownloadInfo(user.companyId, id);
    const stream = createReadStream(info.path);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${info.filename}"`,
    });

    return new StreamableFile(stream);
  }

  @Roles(UserRole.ADMIN, UserRole.COLLAB)
  @Delete('jobs/:id')
  async deleteReport(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.reportService.deleteReport(user.companyId, id);
  }

  @Roles(UserRole.ADMIN, UserRole.COLLAB, UserRole.READER)
  @Sse('jobs/:id/progress')
  progressStream(
    @CurrentUser() user: JwtPayload,
    @Param('id') reportId: string,
  ): Observable<MessageEvent> {
    return this.reportService.streamReportProgress(user.companyId, reportId) as Observable<MessageEvent>;
  }
}
