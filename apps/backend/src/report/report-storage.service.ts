import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class ReportStorageService {
  private readonly logger = new Logger(ReportStorageService.name);

  async saveReport(
    companyId: string,
    reportId: string,
    buffer: Buffer,
  ): Promise<string> {
    const dir = join(process.cwd(), 'reports', 'generated', companyId);
    await mkdir(dir, { recursive: true });

    const filePath = join(dir, `${reportId}.pdf`);
    await writeFile(filePath, buffer);

    this.logger.log(`Report saved to ${filePath}`);
    return filePath;
  }
}
