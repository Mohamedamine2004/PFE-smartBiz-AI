import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // L'injection se fait via les paramètres du constructeur (sans 'private')
  constructor(configService: ConfigService) {
    // 1. Récupération sécurisée via le cycle de vie NestJS
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not defined in the environment variables (ConfigService).',
      );
    }

    // 2. Initialisation du Pool PostgreSQL natif
    const pool = new Pool({ connectionString });

    // 3. Liaison du Pool à l'adaptateur Prisma V7
    const adapter = new PrismaPg(pool);

    // 4. Appel du constructeur parent (PrismaClient) avec l'adaptateur
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
