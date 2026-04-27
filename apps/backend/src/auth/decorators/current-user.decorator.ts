import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    // Si on passe une propriété spécifique (ex: @CurrentUser('companyId')), on ne retourne que celle-là
    // Sinon, on retourne tout l'objet utilisateur
    return data ? user?.[data] : user;
  },
);
