/*import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
*/
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  // Injection de dépendance du PrismaService
  constructor(private readonly prisma: PrismaService) {}

  async testDatabaseConnection(): Promise<any> {
    try {
      // Tente de compter les utilisateurs dans la table "User"
      const userCount = await this.prisma.user.count();

      return {
        status: 'success',
        message:
          'La connexion à la base de données PostgreSQL est opérationnelle.',
        userCount: userCount,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Échec de la connexion à la base de données.',
        details: error.message,
      };
    }
  }
}
