import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30_000,       // 30s timeout for ML inference
      maxRedirects: 3,
    }),
    PrismaModule,
  ],
  controllers: [PredictionController],
  providers: [PredictionService],
  exports: [PredictionService],
})
export class PredictionModule {}
