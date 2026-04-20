import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateInvitationRequestDto } from './dto/create-invitation-request.dto';
import { UpdateInvitationRequestStatusDto } from './dto/update-invitation-request.dto';
import { InvitationRequestStatus, UserRole } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class InvitationRequestService {
  private readonly logger = new Logger(InvitationRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService,
  ) {}

  async create(createDto: CreateInvitationRequestDto) {
    // Check if email already requested
    const existing = await this.prisma.invitationRequest.findUnique({
      where: { email: createDto.email },
    });

    if (existing) {
      throw new BadRequestException('Une demande avec cet email existe déjà.');
    }

    const invitation = await this.prisma.invitationRequest.create({
      data: createDto,
    });

    this.logger.log(`New invitation request created for ${createDto.email}`);

    // Notify relevant admins in their inbox.
    const targetCompanyName = createDto.companyName?.trim();
    const adminFilter = targetCompanyName
      ? {
          role: UserRole.ADMIN,
          deletedAt: null,
          company: { name: targetCompanyName },
        }
      : {
          role: UserRole.ADMIN,
          deletedAt: null,
        };

    const admins = await this.prisma.user.findMany({
      where: adminFilter,
      select: { id: true },
    });

    if (admins.length > 0) {
      const requestedRole = createDto.role?.trim() || 'COLLAB';
      const requestedCompany = targetCompanyName || 'non spécifiée';

      await Promise.all(
        admins.map((admin) =>
          this.notificationService.createNotification(
            admin.id,
            'TEAM_INVITE',
            'Nouvelle demande d\'invitation',
            `${createDto.fullName} (${createDto.email}) demande l'accès (${requestedRole}) pour ${requestedCompany}.`,
            '/team',
          ),
        ),
      );
    } else {
      this.logger.warn(
        `No admin found to notify for invitation request ${createDto.email}`,
      );
    }

    return invitation;
  }

  async findAll() {
    return this.prisma.invitationRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invitation = await this.prisma.invitationRequest.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Demande introuvable.');
    }

    return invitation;
  }

  async updateStatus(id: string, updateDto: UpdateInvitationRequestStatusDto, adminId: string) {
    const invitation = await this.findOne(id);
    
    if (invitation.status !== InvitationRequestStatus.PENDING) {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    if (updateDto.status === InvitationRequestStatus.ACCEPTED) {
      // Reuse the normal team invitation flow so the user receives the same invite email
      // and appears in Team Management after accepting the invite link.
      const normalizedRole = this.mapRequestedRoleToUserRole(invitation.role);
      await this.authService.inviteMember(adminId, invitation.email, normalizedRole);
    }

    const updated = await this.prisma.invitationRequest.update({
      where: { id },
      data: { status: updateDto.status },
    });

    if (updateDto.status === InvitationRequestStatus.REJECTED) {
      await this.mailService.sendInvitationRejected(updated.email, updated.fullName);
    }

    return updated;
  }

  private mapRequestedRoleToUserRole(role?: string | null): UserRole {
    if (!role) {
      return UserRole.COLLAB;
    }

    const normalized = role.trim().toUpperCase();

    if (normalized === 'ADMIN') {
      return UserRole.ADMIN;
    }

    if (normalized === 'READER') {
      return UserRole.READER;
    }

    return UserRole.COLLAB;
  }
}
