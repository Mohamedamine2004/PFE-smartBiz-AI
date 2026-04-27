import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // CORRECTION : On utilise désormais JWT_ACCESS_SECRET
    const jwtAccessSecret = configService.get<string>('JWT_ACCESS_SECRET');

    if (!jwtAccessSecret) {
      throw new Error('CRITICAL: JWT_ACCESS_SECRET manquant pour JwtStrategy');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtAccessSecret, // Application de la bonne clé de vérification
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token invalide.');
    }

    // Compatibilité ascendante: certains anciens tokens peuvent manquer de companyId.
    // Dans ce cas, on hydrate les données depuis la base pour éviter les erreurs 500 sur les routes métiers.
    if (!payload.companyId) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          companyId: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException(
          'Utilisateur introuvable pour ce token.',
        );
      }

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      };
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
    };
  }
}
