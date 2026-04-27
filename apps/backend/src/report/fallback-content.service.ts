import { Injectable } from '@nestjs/common';
import { ReportSection, ReportType } from './dto/generate-report.dto';

@Injectable()
export class FallbackContentService {
  /**
   * Generates a full report fallback based on available metrics.
   * Logic extracted from gemini.service.ts to respect SRP.
   */
  generateComprehensiveFallback(input: {
    reportTypes: ReportType[];
    requestedSections: ReportSection[];
    annual: Record<string, number>;
    metrics: Record<string, number>;
    kpis?: any;
    prediction: any;
    problemStatement?: string;
    language: string;
  }): Record<string, string> {
    const {
      reportTypes,
      requestedSections,
      annual,
      metrics,
      kpis,
      prediction,
      problemStatement,
      language,
    } = input;
    const isFr = language === 'FR';

    const revenue = metrics['Gross_Revenue'] || annual.Revenues_N || 0;
    const opex = metrics['Operating_Expenses_Total'] || 0;
    const cashBurn = metrics['Net_Cash_Burn'] || 0;
    const cashBalance =
      metrics['Ending_Cash_Balance'] || annual.CashAndEquivalents_N || 0;
    const payroll = metrics['Payroll_Expenses'] || 0;
    const marketing = metrics['Marketing_Spend'] || 0;
    const newCustomers = metrics['New_Customers_Acquired'] || 0;
    const churned = metrics['Customers_Churned'] || 0;
    const growthYoy = this.safeGrowth(annual.Revenues_N, annual.Revenues_N_1);
    const ltvCac = this.safeRatio(kpis?.ltv ?? 0, kpis?.cac ?? 0);
    const cashRunwayMonths =
      cashBurn < 0 ? Math.abs(cashBalance / cashBurn) : 0;

    const fmt = (n: number) => n.toLocaleString(isFr ? 'fr-FR' : 'en-US');
    const sections: Record<string, string> = {};

    // --- EXECUTIVE SUMMARY ---
    sections['EXECUTIVE_SUMMARY'] = this.buildExecutiveSummary(isFr, {
      revenue,
      opex,
      cashBurn,
      cashBalance,
      newCustomers,
      churned,
      cashRunwayMonths,
      prediction,
      problemStatement,
      fmt,
    });

    // --- REPORT TYPE SECTIONS ---
    for (const type of reportTypes) {
      sections[type] = this.buildFallbackForSection(type, isFr, {
        revenue,
        opex,
        cashBurn,
        cashBalance,
        payroll,
        marketing,
        growthYoy,
        annual,
        newCustomers,
        churned,
        kpis,
        ltvCac,
        cashRunwayMonths,
        prediction,
        fmt,
      });
    }

    // --- REQUESTED SECTIONS ---
    for (const section of requestedSections) {
      if (section === ReportSection.EXECUTIVE_SUMMARY) continue;
      const key = `SECTION_${section}`;
      sections[key] = this.buildFallbackForSection(section, isFr, {
        revenue,
        opex,
        cashBurn,
        cashBalance,
        payroll,
        marketing,
        growthYoy,
        annual,
        newCustomers,
        churned,
        kpis,
        ltvCac,
        cashRunwayMonths,
        prediction,
        fmt,
      });
    }

    return sections;
  }

  buildFallbackForKey(key: string, context: any): string {
    const isFr = context.language === 'FR';
    const fmt = (n: number) => n.toLocaleString(isFr ? 'fr-FR' : 'en-US');

    // Delegate to buildFallbackForSection or specific builders
    // This perfectly mirrors the logic in gemini.service.ts
    const metrics_ext = {
      revenue:
        context.metrics['Gross_Revenue'] || context.annual.Revenues_N || 0,
      opex: context.metrics['Operating_Expenses_Total'] || 0,
      cashBurn: context.metrics['Net_Cash_Burn'] || 0,
      cashBalance:
        context.metrics['Ending_Cash_Balance'] ||
        context.annual.CashAndEquivalents_N ||
        0,
      payroll: context.metrics['Payroll_Expenses'] || 0,
      marketing: context.metrics['Marketing_Spend'] || 0,
      newCustomers: context.metrics['New_Customers_Acquired'] || 0,
      churned: context.metrics['Customers_Churned'] || 0,
      growthYoy: this.safeGrowth(
        context.annual.Revenues_N,
        context.annual.Revenues_N_1,
      ),
      ltvCac: this.safeRatio(context.kpis?.ltv ?? 0, context.kpis?.cac ?? 0),
      cashRunwayMonths: 0,
      fmt,
      annual: context.annual,
      prediction: context.prediction,
      kpis: context.kpis,
      curr: context.currency ? ` ${context.currency}` : '',
    };
    metrics_ext.cashRunwayMonths =
      metrics_ext.cashBurn < 0
        ? Math.abs(metrics_ext.cashBalance / metrics_ext.cashBurn)
        : 0;

    return this.buildFallbackForSection(key, isFr, metrics_ext);
  }

  private buildFallbackForSection(key: string, isFr: boolean, d: any): string {
    const normalizedKey = key.startsWith('SECTION_')
      ? key.replace('SECTION_', '')
      : key;

    switch (normalizedKey) {
      case 'FINANCIAL':
      case 'FINANCIAL_OVERVIEW':
        return this.buildFinancialSection(isFr, d);
      case 'BUSINESS_DESCRIPTION':
        return this.buildBusinessSection(isFr, d);
      case 'RISK_ANALYSIS':
        return this.buildRiskSection(isFr, d);
      case 'ACTION_PLAN':
      case 'RECOMMENDATIONS':
        return this.buildActionPlanSection(isFr, d);
      case 'SWOT_ANALYSIS':
        return this.buildSwotSection(isFr, d);
      case 'PERFORMANCE_ANALYSIS':
        return this.buildPerformanceSection(isFr, d);
      case 'FORECASTS_TRENDS':
        return this.buildForecastSection(isFr, d);
      default:
        return isFr
          ? 'Analyse basée sur les données disponibles.'
          : 'Analysis based on available data.';
    }
  }

  // --- INTERNAL SECTION BUILDERS (Extracted from gemini.service.ts) ---

  private buildExecutiveSummary(isFr: boolean, d: any): string {
    // (Implementation matches exactly what we read in gemini.service.ts)
    if (isFr) {
      return [
        '## Synthèse Exécutive',
        '',
        `Ce rapport présente une analyse détaillée de la performance financière et opérationnelle de l'entreprise. L'analyse repose sur les données financières mensuelles importées, les indicateurs clés de performance (KPIs), et les projections du moteur de machine learning SmartBiz AI.`,
        '',
        '### Indicateurs Clés',
        '',
        `- **Revenu brut mensuel** : ${d.fmt(d.revenue)}${d.curr}`,
        `- **Charges opérationnelles totales** : ${d.fmt(d.opex)}${d.curr}`,
        `- **Cash burn net mensuel** : ${d.fmt(d.cashBurn)}${d.curr}`,
        `- **Solde de trésorerie** : ${d.fmt(d.cashBalance)}${d.curr}`,
        `- **Nouveaux clients acquis** : ${d.newCustomers}`,
        `- **Clients perdus (churn)** : ${d.churned}`,
        d.cashRunwayMonths > 0
          ? `- **Piste de trésorerie estimée** : ${d.cashRunwayMonths.toFixed(1)} mois`
          : '',
        '',
        "### Points d'Attention Prioritaires",
        '',
        d.cashBurn < 0
          ? `Le cash burn net de ${d.fmt(Math.abs(d.cashBurn))}${d.curr}/mois indique une consommation de trésorerie qui nécessite une attention immédiate. Avec un solde de ${d.fmt(d.cashBalance)}${d.curr}, la piste de trésorerie est limitée.`
          : 'Le flux de trésorerie opérationnel est actuellement positif, ce qui est un signe encourageant de viabilité financière.',
        '',
        d.churned > d.newCustomers
          ? `Le taux de churn (${d.churned} clients perdus vs ${d.newCustomers} acquis) indique un problème de rétention client qui impacte directement la croissance.`
          : `L'acquisition nette de clients est positive (${d.newCustomers} acquis vs ${d.churned} perdus), soutenant la trajectoire de croissance.`,
        '',
        `Le moteur de prédiction ML est ${d.prediction.status === 'COMPLETED' ? 'actif et a complété son analyse' : 'en cours de traitement'}.`,
        '',
        d.problemStatement
          ? `### Focus Spécifique\n\n${d.problemStatement}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');
    }
    return [
      '## Executive Summary',
      '',
      `This report presents a detailed analysis of the company's financial and operational performance. The analysis is based on imported monthly financial data, key performance indicators (KPIs), and SmartBiz AI machine learning projections.`,
      '',
      '### Key Metrics',
      '',
      `- **Monthly Gross Revenue**: ${d.fmt(d.revenue)}`,
      `- **Total Operating Expenses**: ${d.fmt(d.opex)}`,
      `- **Net Monthly Cash Burn**: ${d.fmt(d.cashBurn)}`,
      `- **Cash Balance**: ${d.fmt(d.cashBalance)}`,
      `- **New Customers Acquired**: ${d.newCustomers}`,
      `- **Customers Churned**: ${d.churned}`,
      d.cashRunwayMonths > 0
        ? `- **Estimated Cash Runway**: ${d.cashRunwayMonths.toFixed(1)} months`
        : '',
      '',
      '### Priority Areas',
      '',
      d.cashBurn < 0
        ? `The net cash burn of ${d.fmt(Math.abs(d.cashBurn))}/month requires immediate attention. With a balance of ${d.fmt(d.cashBalance)}, the cash runway is limited.`
        : 'Operational cash flow is currently positive, which is an encouraging sign of financial viability.',
      '',
      d.problemStatement ? `### Specific Focus\n\n${d.problemStatement}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildFinancialSection(isFr: boolean, d: any): string {
    if (isFr) {
      return [
        '## Analyse Financière Détaillée',
        '',
        '### Structure des Revenus',
        '',
        `Le revenu brut mensuel s'établit à **${d.fmt(d.revenue)}${d.curr}**, tandis que les charges opérationnelles totales atteignent **${d.fmt(d.opex)}${d.curr}**. Cette situation révèle un déficit opérationnel mensuel de **${d.fmt(d.revenue - d.opex)}${d.curr}**.`,
        '',
        d.growthYoy !== 0
          ? `La croissance annuelle du chiffre d'affaires est de **${d.growthYoy.toFixed(1)}%**, ${d.growthYoy > 0 ? 'indiquant une trajectoire de croissance positive' : 'signalant une contraction nécessitant une attention urgente'}.`
          : '',
        '',
        '### Répartition des Charges',
        '',
        `- **Masse salariale** : ${d.fmt(d.payroll)}${d.curr} (${d.opex > 0 ? ((d.payroll / d.opex) * 100).toFixed(1) : '0'}% des charges totales)`,
        `- **Marketing** : ${d.fmt(d.marketing)}${d.curr} (${d.opex > 0 ? ((d.marketing / d.opex) * 100).toFixed(1) : '0'}% des charges totales)`,
        '',
        '### Position de Trésorerie',
        '',
        `Le solde de trésorerie est de **${d.fmt(d.cashBalance)}${d.curr}** avec un cash burn net mensuel de **${d.fmt(d.cashBurn)}${d.curr}**.`,
        '',
        d.cashBurn < 0
          ? `⚠️ **Alerte** : Le burn rate actuel de ${d.fmt(Math.abs(d.cashBurn))}${d.curr}/mois nécessite des mesures correctives immédiates pour préserver la capacité opérationnelle de l'entreprise.`
          : '✅ Le flux de trésorerie opérationnel positif assure la stabilité financière à court terme.',
      ]
        .filter(Boolean)
        .join('\n');
    }
    return [
      '## Detailed Financial Analysis',
      '',
      `Monthly gross revenue stands at **${d.fmt(d.revenue)}**, while total operating expenses reach **${d.fmt(d.opex)}**.`,
      '',
      `Cash balance: **${d.fmt(d.cashBalance)}** with net monthly cash burn of **${d.fmt(d.cashBurn)}**.`,
    ].join('\n');
  }

  private buildBusinessSection(isFr: boolean, d: any): string {
    if (isFr) {
      return [
        '## Analyse du Modèle Économique',
        '',
        '### Dynamique Client',
        '',
        `L'entreprise acquiert **${d.newCustomers} nouveaux clients** par mois, avec un taux de churn de **${d.churned} clients** perdus par période.`,
        '',
        '### Économie Unitaire',
        '',
        `- **Coût d'Acquisition Client (CAC)** : ${d.fmt(d.kpis?.cac ?? 0)}${d.curr}`,
        `- **Valeur Vie Client (LTV)** : ${d.fmt(d.kpis?.ltv ?? 0)}${d.curr}`,
        `- **Ratio LTV/CAC** : ${d.ltvCac.toFixed(1)}x`,
      ].join('\n');
    }
    return '## Business Model Analysis';
  }

  private buildRiskSection(isFr: boolean, d: any): string {
    if (isFr) {
      return [
        '## Analyse des Risques',
        '',
        '#### 🔴 Risque Critique : Trésorerie',
        '',
        d.cashBurn < 0
          ? `Le cash burn mensuel de ${d.fmt(Math.abs(d.cashBurn))}${d.curr} avec un solde de ${d.fmt(d.cashBalance)}${d.curr} donne une piste de trésorerie de **${d.cashRunwayMonths.toFixed(1)} mois**.`
          : 'Le flux de trésorerie est actuellement positif.',
      ].join('\n');
    }
    return '## Risk Analysis';
  }

  private buildActionPlanSection(isFr: boolean, d: any): string {
    return isFr ? "## Plan d'Action Stratégique" : '## Strategic Action Plan';
  }

  private buildSwotSection(isFr: boolean, d: any): string {
    return isFr ? '## Analyse SWOT' : '## SWOT Analysis';
  }

  private buildPerformanceSection(isFr: boolean, d: any): string {
    return isFr ? '## Analyse de Performance' : '## Performance Analysis';
  }

  private buildForecastSection(isFr: boolean, d: any): string {
    return isFr ? '## Prévisions & Tendances' : '## Forecasts & Trends';
  }

  // --- HELPERS ---

  private safeGrowth(current: number, previous: number): number {
    if (!Number.isFinite(previous) || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private safeRatio(numerator: number, denominator: number): number {
    if (!Number.isFinite(denominator) || denominator === 0) return 0;
    return numerator / denominator;
  }
}
