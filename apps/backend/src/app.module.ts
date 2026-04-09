import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { MailModule } from './mail/mail.module';
import { ValuationModule } from './valuation/valuation.module';
import { FinancialModule } from './financial/financial.module';
import { PredictionModule } from './prediction/prediction.module';

@Module({
  imports: [
    // Config globale (.env)
    ConfigModule.forRoot({ isGlobal: true }),

    // Protection contre les attaques (rate limiting)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 secondes
        limit: 120,  // max 120 requêtes par IP/min pour éviter les faux blocages au refresh
      },
    ]),

    PrismaModule,
    AuthModule,
    CompanyModule,
    MailModule,
    ValuationModule,
    FinancialModule,
    PredictionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
