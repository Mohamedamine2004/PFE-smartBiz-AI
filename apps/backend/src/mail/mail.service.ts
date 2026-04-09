import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendUserConfirmation(email: string, token: string) {
    const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000/api/v1';
    const confirmationUrl = `${apiUrl}/auth/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: '"SmartBiz AI" <noreply@smartbiz.ai>',
        to: email,
        subject: 'Confirmez votre adresse email',
        html: `
          <h2>Bienvenue sur SmartBiz AI</h2>
          <p>Cliquez sur le lien ci-dessous pour vérifier votre compte :</p>
          <a href="${confirmationUrl}">Confirmer mon compte</a>
        `,
      });
      this.logger.log(`Email de confirmation envoyé à : ${email}`);
    } catch (error) {
      this.logger.error(`Erreur d'envoi à ${email}`, error);
    }
  }

  async sendPasswordReset(email: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: '"SmartBiz AI" <noreply@smartbiz.ai>',
        to: email,
        subject: 'Réinitialisation de mot de passe',
        html: `
          <h2>Réinitialisation de mot de passe</h2>
          <p>Cliquez sur le lien ci-dessous pour changer votre mot de passe (valide 15 minutes) :</p>
          <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
        `,
      });
      this.logger.log(`Email de réinitialisation envoyé à : ${email}`);
    } catch (error) {
      this.logger.error(`Erreur d'envoi à ${email}`, error);
    }
  }

  async sendTeamInvite(email: string, token: string, companyName: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const inviteUrl = `${frontendUrl}/accept-invite?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: '"SmartBiz AI" <noreply@smartbiz.ai>',
        to: email,
        subject: `Invitation à rejoindre ${companyName} sur SmartBiz AI`,
        html: `
          <h2>Vous avez été invité !</h2>
          <p>L'administrateur de <strong>${companyName}</strong> vous a invité à rejoindre son équipe sur SmartBiz AI.</p>
          <p>Cliquez sur le lien ci-dessous pour créer votre profil et activer votre compte :</p>
          <br/>
          <a href="${inviteUrl}" style="padding: 10px 20px; background-color: #009E87; color: white; text-decoration: none; border-radius: 5px;">Accepter l'invitation</a>
          <br/><br/>
          <p>Ce lien expirera dans 7 jours.</p>
        `,
      });
      this.logger.log(`Email d'invitation envoyé à : ${email}`);
    } catch (error) {
      this.logger.error(`Erreur d'envoi à ${email}`, error);
      throw new Error("Impossible d'envoyer l'email d'invitation.");
    }
  }
}