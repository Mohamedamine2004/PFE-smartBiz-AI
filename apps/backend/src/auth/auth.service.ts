import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { PostLoginService } from './post-login.service';

/** Ordered role hierarchy — higher index = more privileged */
const ROLE_HIERARCHY: UserRole[] = [
  UserRole.READER,
  UserRole.COLLAB,
  UserRole.ADMIN,
  UserRole.OWNER,
];

function roleRank(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

function isUniqueOwnerConstraintError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code !== 'P2002') {
    return false;
  }
  const target = Array.isArray(error.meta?.target)
    ? error.meta?.target.join(',')
    : String(error.meta?.target ?? '');
  return target.includes('User_company_owner_unique_idx');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly postLoginService: PostLoginService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTRATION — creator becomes OWNER automatically
  // ─────────────────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      const existingCompany = await this.prisma.company.findUnique({
        where: { registrationNumber: dto.registrationNumber },
      });

      if (existingUser || existingCompany) {
        throw new ConflictException(
          'Un utilisateur avec cet email ou une entreprise avec ce matricule fiscal existe déjà.',
        );
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      let company;
      try {
        company = await this.prisma.company.create({
          data: {
            name: dto.companyName,
            registrationNumber: dto.registrationNumber,
            users: {
              create: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                password: hashedPassword,
                role: UserRole.OWNER, // creator is always OWNER
                isEmailVerified: true,
              },
            },
          },
          include: { users: true },
        });
      } catch (error) {
        if (isUniqueOwnerConstraintError(error)) {
          throw new ConflictException(
            'Conflit de role detecte: un seul Super Administrateur est autorise par entreprise.',
          );
        }
        throw error;
      }

      const {
        password,
        refreshToken,
        verifyEmailToken,
        ...ownerWithoutSecrets
      } = company.users[0];

      return {
        message: 'Entreprise créée avec succès.',
        company: {
          id: company.id,
          name: company.name,
          registrationNumber: company.registrationNumber,
        },
        admin: ownerWithoutSecrets,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException(
        "Une erreur est survenue lors de l'inscription.",
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { verifyEmailToken: token },
    });

    if (!user) {
      throw new BadRequestException(
        'Jeton de vérification invalide ou expiré.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, verifyEmailToken: null },
    });

    return { message: 'Votre adresse email a été vérifiée avec succès.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Identifiants invalides.');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Identifiants invalides.');
      }

      const tokens = await this.getTokens(
        user.id,
        user.email,
        user.role,
        user.companyId,
      );
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      const postLoginInfo = await this.postLoginService.getRedirectInfo(
        user.companyId,
      );

      const {
        password,
        refreshToken,
        verifyEmailToken,
        resetPasswordToken,
        resetPasswordExpires,
        inviteToken,
        inviteTokenExpires,
        ...userWithoutSecrets
      } = user;

      return {
        ...tokens,
        user: userWithoutSecrets,
        redirect: postLoginInfo.redirect,
        onboardingComplete: postLoginInfo.onboardingComplete,
        hasFinancialData: postLoginInfo.hasFinancialData,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la connexion.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FORGOT / RESET PASSWORD
  // ─────────────────────────────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return {
        message:
          'Si cet email correspond à un compte, un lien de réinitialisation a été envoyé.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedResetToken,
        resetPasswordExpires: expiresAt,
      },
    });

    await this.mailService.sendPasswordReset(user.email, resetToken);

    return {
      message:
        'Si cet email correspond à un compte, un lien de réinitialisation a été envoyé.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findUnique({
      where: { resetPasswordToken: hashedToken },
    });

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException(
        'Jeton de réinitialisation invalide ou expiré.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Votre mot de passe a été réinitialisé avec succès.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TOKEN MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const userId = payload.sub;
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.refreshToken) {
        throw new ForbiddenException(
          'Accès refusé : Session expirée ou invalide.',
        );
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!refreshTokenMatches) {
        throw new ForbiddenException('Accès refusé : Token non reconnu.');
      }

      const tokens = await this.getTokens(
        user.id,
        user.email,
        user.role,
        user.companyId,
      );
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ForbiddenException('Refresh token invalide ou expiré.');
    }
  }

  async getTokens(
    userId: string,
    email: string,
    role: string,
    companyId: string,
  ) {
    const payload = { sub: userId, email, role, companyId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Le mot de passe actuel est incorrect.');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit contenir au moins 8 caractères.',
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Mot de passe modifié avec succès.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEAM: INVITE MEMBER
  // Rules: OWNER can invite anyone (ADMIN/COLLAB/READER)
  //        ADMIN can invite COLLAB or READER only
  //        Nobody can invite as OWNER via invitation
  // ─────────────────────────────────────────────────────────────────────────────
  async inviteMember(inviterId: string, email: string, role: UserRole) {
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      include: { company: true },
    });

    if (!inviter) throw new NotFoundException('Inviteur introuvable.');

    const inviterIsOwner = inviter.role === UserRole.OWNER;
    const inviterIsAdmin = inviter.role === UserRole.ADMIN;

    if (!inviterIsOwner && !inviterIsAdmin) {
      throw new ForbiddenException(
        'Seul un Administrateur ou le Super Administrateur peut inviter des membres.',
      );
    }

    // Nobody can invite as OWNER
    if (role === UserRole.OWNER) {
      throw new ForbiddenException(
        "Le rôle Super Administrateur (OWNER) ne peut pas être attribué par invitation. Utilisez le transfert de propriété.",
      );
    }

    // ADMIN can only invite COLLAB or READER
    if (inviterIsAdmin && role === UserRole.ADMIN) {
      throw new ForbiddenException(
        "Un Administrateur ne peut inviter que des Collaborateurs ou des Lecteurs. Seul le Super Administrateur peut créer un nouvel Administrateur.",
      );
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Cet utilisateur existe déjà.');
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const hashedInviteToken = crypto
      .createHash('sha256')
      .update(inviteToken)
      .digest('hex');
    const dummyPassword = await bcrypt.hash(
      crypto.randomBytes(16).toString('hex'),
      10,
    );
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await this.prisma.user.create({
      data: {
        firstName: 'En attente',
        lastName: 'En attente',
        email,
        password: dummyPassword,
        role,
        companyId: inviter.companyId,
        isEmailVerified: false,
        inviteToken: hashedInviteToken,
        inviteTokenExpires: expires,
      },
    });

    await this.mailService.sendTeamInvite(
      email,
      inviteToken,
      inviter.company.name,
    );

    return { message: 'Invitation envoyée avec succès.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEAM: ACCEPT INVITE
  // ─────────────────────────────────────────────────────────────────────────────
  async acceptInvite(
    token: string,
    newPassword: string,
    firstName: string,
    lastName: string,
  ) {
    const hashedInviteToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.prisma.user.findUnique({
      where: { inviteToken: hashedInviteToken },
    });

    if (
      !user ||
      !user.inviteTokenExpires ||
      user.inviteTokenExpires < new Date()
    ) {
      throw new BadRequestException(
        "Le lien d'invitation est invalide ou a expiré.",
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        password: hashedPassword,
        isEmailVerified: true,
        inviteToken: null,
        inviteTokenExpires: null,
      },
    });

    return {
      message:
        'Compte activé avec succès. Vous pouvez maintenant vous connecter.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEAM: GET MEMBERS
  // OWNER and ADMIN can view the team
  // ─────────────────────────────────────────────────────────────────────────────
  async getTeamMembers(requesterId: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (
      !requester ||
      (requester.role !== UserRole.OWNER && requester.role !== UserRole.ADMIN)
    ) {
      throw new ForbiddenException(
        "Seul un Administrateur ou le Super Administrateur peut voir l'équipe.",
      );
    }

    return this.prisma.user.findMany({
      where: { companyId: requester.companyId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEAM: UPDATE MEMBER ROLE
  // Rules:
  //   - OWNER can change anyone's role (except assigning OWNER — use transferOwnership)
  //   - ADMIN can only change COLLAB ↔ READER (roles below ADMIN)
  //   - Nobody can downgrade the OWNER without simultaneous transfer
  // ─────────────────────────────────────────────────────────────────────────────
  async updateMemberRole(
    requesterId: string,
    targetUserId: string,
    newRole: UserRole,
  ) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester) throw new NotFoundException('Requester introuvable.');

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target || target.companyId !== requester.companyId || target.deletedAt) {
      throw new NotFoundException(
        'Utilisateur introuvable dans votre entreprise.',
      );
    }

    // Cannot change your own role
    if (requesterId === targetUserId) {
      throw new BadRequestException(
        "Vous ne pouvez pas modifier votre propre rôle. Utilisez le transfert de propriété si vous souhaitez céder le statut OWNER.",
      );
    }

    // Nobody can edit OWNER via this route; use ownership transfer.
    if (target.role === UserRole.OWNER) {
      throw new BadRequestException(
        'Le role OWNER ne peut pas etre modifie directement. Utilisez le transfert de propriete.',
      );
    }

    // Nobody can assign OWNER via this route
    if (newRole === UserRole.OWNER) {
      throw new BadRequestException(
        "Pour transférer le statut Super Administrateur, utilisez l'endpoint de transfert de propriété.",
      );
    }

    if (requester.role === UserRole.OWNER) {
      // OWNER can change anyone's role (except the OWNER slot itself)
      // No extra restriction
    } else if (requester.role === UserRole.ADMIN) {
      // ADMIN can only modify users with rank below ADMIN
      if (roleRank(target.role) >= roleRank(UserRole.ADMIN)) {
        throw new ForbiddenException(
          "Un Administrateur ne peut modifier que les rôles qui lui sont inférieurs (Collaborateur / Lecteur). Seul le Super Administrateur peut modifier un autre Administrateur.",
        );
      }
      // ADMIN cannot promote to ADMIN or above
      if (roleRank(newRole) >= roleRank(UserRole.ADMIN)) {
        throw new ForbiddenException(
          "Un Administrateur ne peut pas promouvoir un utilisateur au rang d'Administrateur ou supérieur.",
        );
      }
    } else {
      throw new ForbiddenException(
        "Vous n'avez pas les permissions nécessaires pour modifier les rôles.",
      );
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    return {
      message: `Rôle mis à jour avec succès vers ${newRole}.`,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEAM: TRANSFER OWNERSHIP
  // Only the current OWNER can call this.
  // Atomically: new user becomes OWNER, current OWNER becomes ADMIN.
  // ─────────────────────────────────────────────────────────────────────────────
  async transferOwnership(ownerId: string, newOwnerId: string) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== UserRole.OWNER) {
      throw new ForbiddenException(
        "Seul le Super Administrateur (OWNER) peut transférer la propriété.",
      );
    }

    if (ownerId === newOwnerId) {
      throw new BadRequestException(
        'Vous êtes déjà le Super Administrateur.',
      );
    }

    const newOwner = await this.prisma.user.findUnique({
      where: { id: newOwnerId },
    });
    if (
      !newOwner ||
      newOwner.companyId !== owner.companyId ||
      newOwner.deletedAt
    ) {
      throw new NotFoundException(
        'Le nouvel utilisateur est introuvable dans votre entreprise.',
      );
    }

    try {
      // Atomic swap in a transaction with DB uniqueness guard.
      await this.prisma.$transaction(async (tx) => {
        const currentOwner = await tx.user.findUnique({ where: { id: ownerId } });
        if (!currentOwner || currentOwner.role !== UserRole.OWNER) {
          throw new ForbiddenException(
            "Le role OWNER a change. Rechargez la page puis reessayez.",
          );
        }

        // Demote first then promote to satisfy the unique OWNER index.
        await tx.user.update({
          where: { id: ownerId },
          data: { role: UserRole.ADMIN },
        });
        await tx.user.update({
          where: { id: newOwnerId },
          data: { role: UserRole.OWNER },
        });
      });
    } catch (error) {
      if (isUniqueOwnerConstraintError(error)) {
        throw new ConflictException(
          'Conflit detecte: un autre transfert de propriete est en cours. Reessayez.',
        );
      }
      throw error;
    }

    return {
      message: `La propriété a été transférée à ${newOwner.firstName} ${newOwner.lastName}. Vous êtes maintenant Administrateur.`,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEAM: DELETE MEMBER
  // Rules:
  //   - OWNER can delete anyone except themselves (must transfer first)
  //   - ADMIN can delete only COLLAB or READER (not ADMIN, not OWNER)
  //   - Nobody can delete the OWNER directly
  // ─────────────────────────────────────────────────────────────────────────────
  async deleteTeamMember(requesterId: string, userIdToDelete: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (
      !requester ||
      (requester.role !== UserRole.OWNER && requester.role !== UserRole.ADMIN)
    ) {
      throw new ForbiddenException(
        'Seul un Administrateur ou le Super Administrateur peut supprimer un membre.',
      );
    }

    if (requesterId === userIdToDelete) {
      if (requester.role === UserRole.OWNER) {
        throw new BadRequestException(
          "Le Super Administrateur ne peut pas supprimer son propre compte sans avoir d'abord transféré la propriété à un autre membre.",
        );
      }
      throw new BadRequestException(
        'Vous ne pouvez pas supprimer votre propre compte.',
      );
    }

    const userToDelete = await this.prisma.user.findUnique({
      where: { id: userIdToDelete },
    });

    if (!userToDelete || userToDelete.companyId !== requester.companyId) {
      throw new NotFoundException(
        'Utilisateur introuvable dans votre entreprise.',
      );
    }

    // Protect OWNER from deletion
    if (userToDelete.role === UserRole.OWNER) {
      throw new ForbiddenException(
        "Le Super Administrateur (OWNER) ne peut pas être supprimé. Transférez d'abord la propriété.",
      );
    }

    // ADMIN cannot delete another ADMIN
    if (
      requester.role === UserRole.ADMIN &&
      userToDelete.role === UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        "Un Administrateur ne peut pas supprimer un autre Administrateur. Seul le Super Administrateur peut effectuer cette action.",
      );
    }

    await this.prisma.user.update({
      where: { id: userIdToDelete },
      data: { deletedAt: new Date() },
    });

    return { message: 'Utilisateur supprimé avec succès.' };
  }
}
