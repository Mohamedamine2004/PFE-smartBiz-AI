import { Module } from '@nestjs/common';
import { InvitationRequestService } from './invitation-request.service';
import { InvitationRequestController } from './invitation-request.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [InvitationRequestController],
  providers: [InvitationRequestService],
})
export class InvitationRequestModule {}
