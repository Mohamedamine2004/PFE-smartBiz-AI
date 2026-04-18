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
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { PostLoginService } from './post-login.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly postLoginService: PostLoginService,
  ) {}

  /**
   * Inscription d'une nouvelle entreprise et de son administrateur
   */
  async register(dto: RegisterDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
      const existingCompany = await this.prisma.company.findUnique({
        where: { registrationNumber: dto.registrationNumber },
      });

      if (existingUser || existingCompany) {
        throw new ConflictException(
          'Un utilisateur avec cet email ou une entreprise avec ce matricule fiscal existe déjà.',
        );
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const verifyToken = crypto.randomBytes(32).toString('hex');

      const company = await this.prisma.company.create({
        data: {
          name: dto.companyName,
          registrationNumber: dto.registrationNumber,
          users: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              email: dto.email,
              password: hashedPassword,
              role: UserRole.ADMIN,
              isEmailVerified: true, // ✅ Auto-verify email on registration
            },
          },
        },
        include: {
          users: true,
        },
      });

      // Skip email sending - auto-verify
      // await this.mailService.sendUserConfirmation(dto.email, verifyToken);

      const { password, refreshToken, verifyEmailToken, ...adminWithoutSecrets } = company.users[0];

      return {
        message: 'Entreprise créée avec succès.',
        company: {
          id: company.id,
          name: company.name,
          registrationNumber: company.registrationNumber,
        },
        admin: adminWithoutSecrets,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException("Une erreur est survenue lors de l'inscription.");
    }
  }

  /**
   * Validation de l'adresse email via le jeton envoyé
   */
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { verifyEmailToken: token },
    });

    if (!user) {
      throw new BadRequestException('Jeton de vérification invalide ou expiré.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verifyEmailToken: null,
      },
    });

    return { message: 'Votre adresse email a été vérifiée avec succès.' };
  }

  /**
   * Connexion initiale et génération de la paire de tokens
   */
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

      // ✅ Email verification check removed - auto-verified on registration
      // if (!user.isEmailVerified) {
      //   throw new ForbiddenException('Veuillez vérifier votre adresse email avant de vous connecter.');
      // }

      const tokens = await this.getTokens(user.id, user.email, user.role, user.companyId);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      // Déterminer la destination post-login
      const postLoginInfo = await this.postLoginService.getRedirectInfo(user.companyId);

      const { password, refreshToken, verifyEmailToken, resetPasswordToken, resetPasswordExpires, inviteToken, inviteTokenExpires, ...userWithoutSecrets } = user;

      return {
        ...tokens,
        user: userWithoutSecrets,
        redirect: postLoginInfo.redirect,
        onboardingComplete: postLoginInfo.onboardingComplete,
        hasFinancialData: postLoginInfo.hasFinancialData,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Une erreur est survenue lors de la connexion.');
    }
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'Si cet email correspond à un compte, un lien de réinitialisation a été envoyé.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedResetToken,
        resetPasswordExpires: expiresAt,
      },
    });

    await this.mailService.sendPasswordReset(user.email, resetToken);

    return { message: 'Si cet email correspond à un compte, un lien de réinitialisation a été envoyé.' };
  }

  /**
   * Application du nouveau mot de passe
   */
  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findUnique({
      where: { resetPasswordToken: hashedToken },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Jeton de réinitialisation invalide ou expiré.');
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

  /**
   * Rafraîchissement des tokens via le Refresh Token validé depuis le cookie
   */
  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      
      const userId = payload.sub;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.refreshToken) {
        throw new ForbiddenException('Accès refusé : Session expirée ou invalide.');
      }

      const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!refreshTokenMatches) {
        throw new ForbiddenException('Accès refusé : Token non reconnu.');
      }

      const tokens = await this.getTokens(user.id, user.email, user.role, user.companyId);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      
      return tokens;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ForbiddenException('Refresh token invalide ou expiré.');
    }
  }

  /**
   * Utilitaire : Génération des tokens Access et Refresh
   */
  async getTokens(userId: string, email: string, role: string, companyId: string) {
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

  /**
   * Utilitaire : Mise à jour du hash du Refresh Token en base
   */
  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken }, 
    });
  }

  /**
   * Déconnexion — Invalide le refresh token en BDD
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Changement de mot de passe (utilisateur connecté)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Le mot de passe actuel est incorrect.');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Le nouveau mot de passe doit contenir au moins 8 caractères.');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Mot de passe modifié avec succès.' };
  }

  /**
   * Invitation d'un membre d'équipe
   */
  async inviteMember(adminId: string, email: string, role: UserRole) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      include: { company: true }
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException("Seul un administrateur peut inviter des membres.");
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException("Cet utilisateur existe déjà.");
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const hashedInviteToken = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const dummyPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await this.prisma.user.create({
      data: {
        firstName: 'En attente',
        lastName: 'En attente',
        email,
        password: dummyPassword,
        role,
        companyId: admin.companyId,
        isEmailVerified: false,
        inviteToken: hashedInviteToken,
        inviteTokenExpires: expires,
      }
    });

    await this.mailService.sendTeamInvite(email, inviteToken, admin.company.name);

    return { message: "Invitation envoyée avec succès." };
  }

  /**
   * Acceptation d'une invitation
   */
  async acceptInvite(token: string, newPassword: string, firstName: string, lastName: string) {
    const hashedInviteToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await this.prisma.user.findUnique({
      where: { inviteToken: hashedInviteToken }
    });

    if (!user || !user.inviteTokenExpires || user.inviteTokenExpires < new Date()) {
      throw new BadRequestException("Le lien d'invitation est invalide ou a expiré.");
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
      }
    });

    return { message: "Compte activé avec succès. Vous pouvez maintenant vous connecter." };
  }

  /**
   * Récupération des membres de l'équipe
   */
  async getTeamMembers(adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException("Seul un administrateur peut voir l'équipe.");
    }

    const team = await this.prisma.user.findMany({
      where: { 
        companyId: admin.companyId,
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return team;
  }

  /**
   * Suppression d'un membre de l'équipe (Soft Delete)
   */
  async deleteTeamMember(adminId: string, userIdToDelete: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException("Seul un administrateur peut supprimer un membre.");
    }

    if (adminId === userIdToDelete) {
      throw new BadRequestException("Vous ne pouvez pas supprimer votre propre compte.");
    }

    const userToDelete = await this.prisma.user.findUnique({
      where: { id: userIdToDelete },
    });

    if (!userToDelete || userToDelete.companyId !== admin.companyId) {
      throw new NotFoundException("Utilisateur introuvable dans votre entreprise.");
    }

    await this.prisma.user.update({
      where: { id: userIdToDelete },
      data: { deletedAt: new Date() },
    });

    return { message: "Utilisateur supprimé avec succès." };
  }
}                                   