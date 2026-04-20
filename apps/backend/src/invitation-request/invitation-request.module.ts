import { Module } from '@nestjs/common';
import { InvitationRequestService } from './invitation-request.service';
import { InvitationRequestController } from './invitation-request.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, MailModule, NotificationModule, AuthModule],
  controllers: [InvitationRequestController],
  providers: [InvitationRequestService],
})
export class InvitationRequestModule {}
