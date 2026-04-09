import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Récupération des rôles exigés pour cette route spécifique
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la route n'a pas le décorateur @Roles(), on autorise l'accès par défaut
    if (!requiredRoles) {
      return true;
    }

    // 2. Récupération de l'utilisateur injecté précédemment par le JwtAuthGuard
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('Utilisateur non identifié.');
    }

    // 3. Vérification de l'intersection des rôles
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('Vous n\'avez pas les permissions nécessaires pour effectuer cette action.');
    }

    return true;
  }
}