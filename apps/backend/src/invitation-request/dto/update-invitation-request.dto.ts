import { IsEnum, IsNotEmpty } from 'class-validator';
import { InvitationRequestStatus } from '@prisma/client';

export class UpdateInvitationRequestStatusDto {
  @IsNotEmpty()
  @IsEnum(InvitationRequestStatus)
  status: InvitationRequestStatus;
}
