import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser'; 

async function bootstrap() {
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

  app.enableCors({
    origin: 'http://localhost:5173', // Remplacez par le port de votre frontend React si différent
    credentials: true, // LIGNE CRITIQUE : Autorise l'envoi de cookies cross-origin
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();