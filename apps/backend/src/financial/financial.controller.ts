import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  StreamableFile,
  Header
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('financial')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Roles(UserRole.ADMIN, UserRole.COLLAB)
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importBimodalData(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB limit
          new FileTypeValidator({ fileType: /(application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel)/ }),
        ],
      }),
    ) file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.financialService.processBimodalImport(file.buffer, user.companyId);
  }

  // --- DOWNLOAD TEMPLATE ROUTE ---
  @Roles(UserRole.ADMIN, UserRole.COLLAB)
  @Get('template')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="SmartBiz_Financial_Template.xlsx"')
  downloadTemplate(): StreamableFile {
    // Service returns a raw Buffer
    const buffer = this.financialService.generateTemplate();
    
    // StreamableFile automatically pipes the buffer to the client
    return new StreamableFile(buffer);
  }

  // --- FETCH DASHBOARD DATA ROUTE ---
  @Roles(UserRole.ADMIN, UserRole.COLLAB, UserRole.READER)
  @Get('dashboard-metrics')
  async getMetrics(@CurrentUser() user: JwtPayload) {
    return await this.financialService.getDashboardMetrics(user.companyId);
  }

  // --- FETCH SPECIFIC BATCH DASHBOARD DATA ROUTE (for historical batches) ---
  @Roles(UserRole.ADMIN)
  @Get('dashboard-metrics/:batchId')
  async getMetricsByBatchId(
    @Param('batchId') batchId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.financialService.getDashboardMetricsByBatchId(batchId, user.companyId);
  }

  // --- LIST IMPORT HISTORY ROUTE ---
  @Roles(UserRole.ADMIN, UserRole.COLLAB, UserRole.READER)
  @Get('imports')
  async getImportHistory(@CurrentUser() user: JwtPayload) {
    return await this.financialService.getImportHistory(user.companyId);
  }

  // --- DELETE AN IMPORT BATCH ROUTE ---
  @Roles(UserRole.ADMIN)
  @Delete('imports/:batchId')
  async deleteImportBatch(
    @Param('batchId') batchId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.financialService.deleteImportBatch(batchId, user.companyId);
  }
}