import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

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

@Injectable()
export class TeamManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * TEAM: INVITE MEMBER
   * Rules: OWNER can invite anyone (ADMIN/COLLAB/READER)
   *        ADMIN can invite COLLAB or READER only
   *        Nobody can invite as OWNER via invitation
   */
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
        'Le rôle Super Administrateur (OWNER) ne peut pas être attribué par invitation. Utilisez le transfert de propriété.',
      );
    }

    // ADMIN can only invite COLLAB or READER
    if (inviterIsAdmin && role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Un Administrateur ne peut inviter que des Collaborateurs ou des Lecteurs. Seul le Super Administrateur peut créer un nouvel Administrateur.',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
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
        preference: {
          create: {},
        },
      },
    });

    await this.mailService.sendTeamInvite(
      email,
      inviteToken,
      inviter.company.name,
    );

    return { message: 'Invitation envoyée avec succès.' };
  }

  /**
   * TEAM: ACCEPT INVITE
   */
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

  /**
   * TEAM: GET MEMBERS
   * OWNER and ADMIN can view the team
   */
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

  /**
   * TEAM: UPDATE MEMBER ROLE
   * Rules:
   *   - OWNER can change anyone's role (except assigning OWNER — use transferOwnership)
   *   - ADMIN can only change COLLAB ↔ READER (roles below ADMIN)
   *   - Nobody can downgrade the OWNER without simultaneous transfer
   */
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
    if (
      !target ||
      target.companyId !== requester.companyId ||
      target.deletedAt
    ) {
      throw new NotFoundException(
        'Utilisateur introuvable dans votre entreprise.',
      );
    }

    // Cannot change your own role
    if (requesterId === targetUserId) {
      throw new BadRequestException(
        'Vous ne pouvez pas modifier votre propre rôle. Utilisez le transfert de propriété si vous souhaitez céder le statut OWNER.',
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
          'Un Administrateur ne peut modifier que les rôles qui lui sont inférieurs (Collaborateur / Lecteur). Seul le Super Administrateur peut modifier un autre Administrateur.',
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

  /**
   * TEAM: TRANSFER OWNERSHIP
   * Only the current OWNER can call this.
   * Atomically: new user becomes OWNER, current OWNER becomes ADMIN.
   */
  async transferOwnership(ownerId: string, newOwnerId: string) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== UserRole.OWNER) {
      throw new ForbiddenException(
        'Seul le Super Administrateur (OWNER) peut transférer la propriété.',
      );
    }

    if (ownerId === newOwnerId) {
      throw new BadRequestException('Vous êtes déjà le Super Administrateur.');
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
        const currentOwner = await tx.user.findUnique({
          where: { id: ownerId },
        });
        if (!currentOwner || currentOwner.role !== UserRole.OWNER) {
          throw new ForbiddenException(
            'Le role OWNER a change. Rechargez la page puis reessayez.',
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
    } catch (error: unknown) {
      const prismaError = error as {
        code?: string;
        meta?: Record<string, unknown>;
      };
      if (prismaError.code === 'P2002' && prismaError.meta?.target) {
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

  /**
   * TEAM: DELETE MEMBER
   * Rules:
   *   - OWNER can delete anyone except themselves (must transfer first)
   *   - ADMIN can delete only COLLAB or READER (not ADMIN, not OWNER)
   *   - Nobody can delete the OWNER directly
   */
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
        'Un Administrateur ne peut pas supprimer un autre Administrateur. Seul le Super Administrateur peut effectuer cette action.',
      );
    }

    await this.prisma.user.update({
      where: { id: userIdToDelete },
      data: { deletedAt: new Date() },
    });

    return { message: 'Utilisateur supprimé avec succès.' };
  }
}
