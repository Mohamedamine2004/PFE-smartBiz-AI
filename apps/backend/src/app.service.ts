import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  // Injection de dépendance du PrismaService
  constructor(private readonly prisma: PrismaService) {}

  async testDatabaseConnection(): Promise<{
    status: string;
    message: string;
    userCount?: number;
    details?: string;
  }> {
    try {
      const userCount = await this.prisma.user.count();

      return {
        status: 'success',
        message:
          'La connexion à la base de données PostgreSQL est opérationnelle.',
        userCount,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'error',
        message: 'Échec de la connexion à la base de données.',
        details: errorMessage,
      };
    }
  }
}
