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
}
