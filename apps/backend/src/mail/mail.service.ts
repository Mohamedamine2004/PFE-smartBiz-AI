import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private isConfigured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');
    const port = this.configService.get<number>('MAIL_PORT');

    if (!host || !user || !pass) {
      this.logger.warn('⚠️  Mail credentials not configured. Email service is DISABLED.');
      this.logger.warn('   Set MAIL_HOST, MAIL_USER, and MAIL_PASSWORD in your .env file');
      this.isConfigured = false;
      return;
    }

    this.isConfigured = true;
    this.transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      auth: {
        user,
        pass,
      },
    });

    // Verify connection on startup
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error(`❌ Mail service connection failed: ${error.message}`);
        this.isConfigured = false;
      } else {
        this.logger.log('✅ Mail service configured successfully');
      }
    });
  }

  async sendUserConfirmation(email: string, token: string) {
    if (!this.isConfigured) {
      this.logger.warn(`⚠️  Email not sent to ${email} - Mail service not configured`);
      return;
    }

    const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000/api/v1';
    const confirmationUrl = `${apiUrl}/auth/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM') || '"SmartBiz AI" <noreply@smartbiz.ai>',
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
    if (!this.isConfigured) {
      this.logger.warn(`⚠️  Email not sent to ${email} - Mail service not configured`);
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM') || '"SmartBiz AI" <noreply@smartbiz.ai>',
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
    if (!this.isConfigured) {
      this.logger.warn(`⚠️  Email not sent to ${email} - Mail service not configured`);
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const inviteUrl = `${frontendUrl}/accept-invite?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM') || '"SmartBiz AI" <noreply@smartbiz.ai>',
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