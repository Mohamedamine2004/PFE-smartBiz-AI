import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupérer le profil de l'entreprise
   */
  async getCompanyProfile(companyId: string) {
    return this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        registrationNumber: true,
        sector: true,
        currency: true,
        fiscalYearStart: true,
        country: true,
        createdAt: true,
      },
    });
  }

  /**
   * Mise à jour du profil d'entreprise (onboarding ou paramètres)
   * Seul OWNER/ADMIN peut modifier ces champs.
   */
  async updateCompanyProfile(
    companyId: string,
    userRole: string,
    dto: UpdateCompanyProfileDto,
  ) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.OWNER) {
      throw new ForbiddenException(
        "Seul le Super Administrateur ou un administrateur peut modifier les parametres de l'entreprise.",
      );
    }

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        sector: dto.sector,
        currency: dto.currency,
        fiscalYearStart: dto.fiscalYearStart,
        country: dto.country,
      },
      select: {
        id: true,
        name: true,
        registrationNumber: true,
        sector: true,
        currency: true,
        fiscalYearStart: true,
        country: true,
      },
    });

    return {
      message: "Profil de l'entreprise mis à jour avec succès.",
      company,
    };
  }

  /**
   * Supprimer définitivement l'entreprise.
   * Seul le OWNER peut effectuer cette action.
   */
  async deleteCompany(companyId: string, ownerId: string) {
    const userCompany = await this.prisma.userCompany.findUnique({
      where: { userId_companyId: { userId: ownerId, companyId } },
    });
    
    if (userCompany?.role !== UserRole.OWNER) {
      throw new ForbiddenException("Seul le Super Administrateur peut supprimer l'entreprise.");
    }

    await this.prisma.$transaction(async (tx) => {
      // Get the company name first to delete related landing page invitation requests
      const company = await tx.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });

      if (company?.name) {
        await tx.invitationRequest.deleteMany({
          where: { companyName: company.name },
        });
      }

      // Find all users in this company
      const memberships = await tx.userCompany.findMany({ where: { companyId } });
      const userIds = memberships.map((m) => m.userId);

      // Handle users: if this is their only company, delete the user entirely.
      // If they belong to other companies, switch their active companyId to another one.
      for (const uid of userIds) {
        const otherMemberships = await tx.userCompany.findMany({
          where: { userId: uid, companyId: { not: companyId } },
        });

        if (otherMemberships.length === 0) {
          // This is their only company, delete user-dependent records first to prevent FK constraint issues
          await tx.report.deleteMany({ where: { userId: uid } });
          await tx.savedValuation.deleteMany({ where: { userId: uid } });
          await tx.notification.deleteMany({ where: { userId: uid } });
          // Delete the user completely
          await tx.user.delete({ where: { id: uid } });
        } else {
          // Switch active company if needed
          const user = await tx.user.findUnique({ where: { id: uid } });
          if (user?.companyId === companyId) {
            await tx.user.update({
              where: { id: uid },
              data: {
                companyId: otherMemberships[0].companyId,
                role: otherMemberships[0].role,
              },
            });
          }
        }
      }

      // Delete dependent records manually to prevent foreign key errors where Cascade is missing
      await tx.importBatch.deleteMany({ where: { companyId } });
      await tx.prediction.deleteMany({ where: { companyId } });
      await tx.savedValuation.deleteMany({ where: { companyId } });
      await tx.report.deleteMany({ where: { companyId } });
      
      // Defensive safeguard: ensure no users are left pointing to this companyId to prevent Restrict constraint errors
      const remainingUsers = await tx.user.findMany({ where: { companyId } });
      for (const ru of remainingUsers) {
        const userMemberships = await tx.userCompany.findMany({
          where: { userId: ru.id, companyId: { not: companyId } },
        });
        if (userMemberships.length > 0) {
          await tx.user.update({
            where: { id: ru.id },
            data: {
              companyId: userMemberships[0].companyId,
              role: userMemberships[0].role,
            },
          });
        } else {
          await tx.report.deleteMany({ where: { userId: ru.id } });
          await tx.savedValuation.deleteMany({ where: { userId: ru.id } });
          await tx.notification.deleteMany({ where: { userId: ru.id } });
          await tx.user.delete({ where: { id: ru.id } });
        }
      }

      // UserCompany records have onDelete: Cascade so they will be deleted when company is deleted.
      // Delete the company
      await tx.company.delete({ where: { id: companyId } });
    });

    return {
      message: "L'entreprise a été supprimée avec succès.",
    };
  }
}
