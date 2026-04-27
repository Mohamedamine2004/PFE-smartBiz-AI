import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PostLoginResult {
  redirect: '/settings' | '/dashboard';
  onboardingComplete: boolean;
  hasFinancialData: boolean;
}

@Injectable()
export class PostLoginService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Détermine la destination post-login en fonction de l'état du profil entreprise
   * et de la présence de données financières.
   *
   * Scénario 1 : Onboarding incomplet → /settings
   * Scénario 2 : Profil OK, pas de données → /dashboard (empty state)
   * Scénario 3 : Profil OK + données → /dashboard (complet)
   */
  async getRedirectInfo(companyId: string): Promise<PostLoginResult> {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: {
        sector: true,
        currency: true,
        fiscalYearStart: true,
      },
    });

    // Scénario 1 : Onboarding incomplet
    const onboardingComplete = !!(
      company.sector &&
      company.currency &&
      company.fiscalYearStart
    );
    if (!onboardingComplete) {
      return {
        redirect: '/settings',
        onboardingComplete: false,
        hasFinancialData: false,
      };
    }

    // Scénario 2 vs 3 : Vérifier la présence de données financières
    const firstData = await this.prisma.financialData.findFirst({
      where: {
        batch: {
          companyId,
        },
      },
      select: { id: true },
    });

    const hasFinancialData = !!firstData;

    return {
      redirect: '/dashboard',
      onboardingComplete: true,
      hasFinancialData,
    };
  }
}
