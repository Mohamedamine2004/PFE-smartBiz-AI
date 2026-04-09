import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PostLoginService } from './post-login.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module'; // <-- Import du MailModule
@Module({
  imports: [
    ConfigModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        const jwtExpiration = configService.get<string>('JWT_EXPIRATION') || '1d';

        if (!jwtSecret) {
          throw new Error('CRITICAL: JWT_SECRET n\'est pas défini dans le fichier .env');
        }

        return {
          secret: jwtSecret,
          signOptions: {
            // L'assertion "as any" neutralise l'erreur stricte liée à "StringValue"
            expiresIn: jwtExpiration as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PostLoginService, JwtStrategy],
})
export class AuthModule {}