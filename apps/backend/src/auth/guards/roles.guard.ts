import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Role hierarchy — higher index = more privileged.
 * A user with a higher rank implicitly satisfies lower-rank role requirements.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.READER]: 0,
  [UserRole.COLLAB]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.OWNER]: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the required roles for this route
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @Roles() decorator, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. Get the authenticated user from the JWT guard
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('Utilisateur non identifié.');
    }

    const userRank = ROLE_HIERARCHY[user.role] ?? -1;

    // 3. Check if the user's rank meets at least one of the required roles
    // OWNER (rank 3) automatically satisfies any lower-rank requirement
    const hasPermission = requiredRoles.some(
      (required) => userRank >= ROLE_HIERARCHY[required],
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        "Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
      );
    }

    return true;
  }
}
