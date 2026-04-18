// Sentry MUST be the first import — placed before any other module
import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // Initialize Sentry SDK
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
    profilesSampleRate: 1.0,
  });

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Activation de la validation stricte des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime automatiquement les champs non définis dans le DTO
      forbidNonWhitelisted: true, // Rejette la requête si des champs non autorisés sont envoyés
      transform: true, // Transforme automatiquement les payloads JSON en instances de classes DTO
    }),
  );

  // Configuration du préfixe global pour l'API (ex: http://localhost:3000/api/v1/...)
  app.setGlobalPrefix('api/v1');

  const envOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const frontendOrigins = Array.from(
    new Set(['http://localhost:5173', 'http://localhost:5174', ...envOrigins]),
  );

  app.enableCors({
    origin: frontendOrigins,
    credentials: true, // LIGNE CRITIQUE : Autorise l'envoi de cookies cross-origin
  });

  // ─── Swagger API Documentation ─────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('SmartBiz AI API')
    .setDescription(
      'AI-powered business intelligence platform for SMEs. ' +
      'Features financial data management, company valuation, and ML predictions.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication and authorization')
    .addTag('company', 'Company management')
    .addTag('financial', 'Financial data import and metrics')
    .addTag('valuation', 'Company valuation')
    .addTag('prediction', 'ML predictions')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
  
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'SmartBiz AI API Documentation',
  });
  // ────────────────────────────────────────────────────────────────

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`🚀 Application running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();