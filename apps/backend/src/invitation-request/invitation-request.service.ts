import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateInvitationRequestDto } from './dto/create-invitation-request.dto';
import { UpdateInvitationRequestStatusDto } from './dto/update-invitation-request.dto';
import { InvitationRequestStatus } from '@prisma/client';

@Injectable()
export class InvitationRequestService {
  private readonly logger = new Logger(InvitationRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
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

    // Optionally send internal admin notification email here
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

  async updateStatus(id: string, updateDto: UpdateInvitationRequestStatusDto) {
    const invitation = await this.findOne(id);
    
    if (invitation.status !== InvitationRequestStatus.PENDING) {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    const updated = await this.prisma.invitationRequest.update({
      where: { id },
      data: { status: updateDto.status },
    });

    // Send email based on status
    if (updateDto.status === InvitationRequestStatus.ACCEPTED) {
      await this.mailService.sendInvitationAccepted(updated.email, updated.fullName);
    } else if (updateDto.status === InvitationRequestStatus.REJECTED) {
      await this.mailService.sendInvitationRejected(updated.email, updated.fullName);
    }

    return updated;
  }
}
