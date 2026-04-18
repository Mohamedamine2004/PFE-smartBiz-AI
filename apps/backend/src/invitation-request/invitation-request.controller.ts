import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { InvitationRequestService } from './invitation-request.service';
import { CreateInvitationRequestDto } from './dto/create-invitation-request.dto';
import { UpdateInvitationRequestStatusDto } from './dto/update-invitation-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('invitations')
export class InvitationRequestController {
  constructor(private readonly invitationRequestService: InvitationRequestService) {}

  @Post()
  create(@Body() createDto: CreateInvitationRequestDto) {
    return this.invitationRequestService.create(createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.invitationRequestService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateInvitationRequestStatusDto,
  ) {
    return this.invitationRequestService.updateStatus(id, updateDto);
  }
}
