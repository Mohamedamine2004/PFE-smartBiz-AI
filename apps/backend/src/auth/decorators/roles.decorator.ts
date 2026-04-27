import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client'; // Importe l'énumération générée par Prisma

export const ROLES_KEY = 'roles';

// Permet de passer un ou plusieurs rôles (ex: @Roles(UserRole.ADMIN, UserRole.MANAGER))
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
