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

  private getEmailTemplate(title: string, content: string): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background-color: #0f172a;
      padding: 30px 40px;
      text-align: center;
      border-bottom: 4px solid #009E87;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header h1 span {
      color: #009E87;
    }
    .content {
      padding: 40px;
    }
    .content h2 {
      color: #0f172a;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      margin-bottom: 16px;
      font-size: 16px;
    }
    .btn-container {
      margin: 32px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 12px 28px;
      background-color: #009E87;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 24px 40px;
      text-align: center;
      font-size: 14px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SmartBiz <span>AI</span></h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} SmartBiz AI. Tous droits réservés.</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
    `;
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
        html: this.getEmailTemplate(
          'Confirmez votre adresse email',
          `
            <h2>Bienvenue sur SmartBiz AI !</h2>
            <p>Nous sommes ravis de vous compter parmi nous. Pour commencer à utiliser notre plateforme et sécuriser votre compte, veuillez confirmer votre adresse email.</p>
            <div class="btn-container">
              <a href="${confirmationUrl}" class="btn">Confirmer mon compte</a>
            </div>
            <p style="font-size: 14px; color: #64748b; margin-top: 24px;">Si vous n'avez pas créé de compte sur SmartBiz AI, vous pouvez ignorer cet email en toute sécurité.</p>
          `
        ),
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
        html: this.getEmailTemplate(
          'Réinitialisation de mot de passe',
          `
            <h2>Demande de réinitialisation</h2>
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte SmartBiz AI.</p>
            <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valide pendant 15 minutes.</p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
            </div>
            <p style="font-size: 14px; color: #64748b; margin-top: 24px;">Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. Votre mot de passe restera inchangé.</p>
          `
        ),
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
        html: this.getEmailTemplate(
          'Invitation à rejoindre une équipe',
          `
            <h2>Vous avez été invité !</h2>
            <p>L'administrateur de l'espace de travail <strong>${companyName}</strong> vous invite à rejoindre son équipe sur SmartBiz AI.</p>
            <p>Rejoignez votre équipe pour collaborer et profiter de toute la puissance de notre plateforme d'intelligence artificielle.</p>
            <div class="btn-container">
              <a href="${inviteUrl}" class="btn">Accepter l'invitation</a>
            </div>
            <p style="font-size: 14px; color: #64748b; margin-top: 24px;">Ce lien d'invitation expirera dans 7 jours.</p>
          `
        ),
      });
      this.logger.log(`Email d'invitation envoyé à : ${email}`);
    } catch (error) {
      this.logger.error(`Erreur d'envoi à ${email}`, error);
      throw new Error("Impossible d'envoyer l'email d'invitation.");
    }
  }

  async sendInvitationAccepted(email: string, fullName: string) {
    if (!this.isConfigured) {
      this.logger.warn(`⚠️  Email not sent to ${email} - Mail service not configured`);
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const registerUrl = `${frontendUrl}/register?email=${encodeURIComponent(email)}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM') || '"SmartBiz AI" <noreply@smartbiz.ai>',
        to: email,
        subject: `Votre demande d'invitation à SmartBiz AI a été acceptée !`,
        html: this.getEmailTemplate(
          'Demande acceptée',
          `
            <h2>Félicitations ${fullName} !</h2>
            <p>Nous sommes ravis de vous informer que votre demande d'accès à <strong>SmartBiz AI</strong> a été approuvée par l'administrateur.</p>
            <p>Vous pouvez dès à présent créer votre compte et commencer à explorer notre plateforme.</p>
            <div class="btn-container">
              <a href="${registerUrl}" class="btn">Créer mon compte</a>
            </div>
            <p>Bienvenue dans l'équipe, nous avons hâte de voir ce que vous allez accomplir !</p>
          `
        ),
      });
      this.logger.log(`Email d'acceptation d'invitation envoyé à : ${email}`);
    } catch (error) {
      this.logger.error(`Erreur d'envoi à ${email}`, error);
    }
  }

  async sendInvitationRejected(email: string, fullName: string) {
    if (!this.isConfigured) {
      this.logger.warn(`⚠️  Email not sent to ${email} - Mail service not configured`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM') || '"SmartBiz AI" <noreply@smartbiz.ai>',
        to: email,
        subject: `Mise à jour concernant votre demande à SmartBiz AI`,
        html: this.getEmailTemplate(
          'Mise à jour de votre demande',
          `
            <h2>Bonjour ${fullName},</h2>
            <p>Nous vous remercions pour l'intérêt que vous portez à <strong>SmartBiz AI</strong> et pour le temps que vous avez pris afin de nous soumettre votre demande.</p>
            <p>Après examen, nous ne sommes malheureusement pas en mesure de donner suite à votre demande d'accès pour le moment.</p>
            <p>Nous conservons néanmoins vos coordonnées pour de futures opportunités et vous tiendrons informé si de nouvelles places se libèrent.</p>
            <p>Cordialement,<br>L'équipe SmartBiz AI</p>
          `
        ),
      });
      this.logger.log(`Email de refus d'invitation envoyé à : ${email}`);
    } catch (error) {
      this.logger.error(`Erreur d'envoi à ${email}`, error);
    }
  }
}