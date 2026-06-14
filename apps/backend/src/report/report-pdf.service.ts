import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { ReportContentSource } from './interfaces/report-content.types';

type FinancialRow = {
  metric: string;
  value: number;
  period: Date;
};

type PredictionSummary = {
  hasPrediction: boolean;
  status?: string;
  createdAt?: Date;
};

type GeneratePdfInput = {
  reportId: string;
  companyId: string;
  language: string;
  lengthProfile: string;
  reportTypes: string[];
  targetPages: number;
  analysisDepth: string;
  includeCharts: boolean;
  problemStatement: string;
  batchId: string;
  generatedAtIso: string;
  financialRows: FinancialRow[];
  annualRevenueSeries?: Array<{ label: string; value: number }>;
  prediction: PredictionSummary;
  aiContent: Record<string, string>;
  aiSource?: ReportContentSource;
  primaryColor?: string;
  secondaryColor?: string;
  logoBase64?: string;
};

// ─── Theme constants ───
const DEFAULT_THEME = {
  // Primary palette
  primary: '#1E3A5F', // Deep navy
  primaryLight: '#2A5B8C',
  primaryDark: '#0F2137',
  accent: '#2563EB', // Blue accent
  accentLight: '#3B82F6',
  accentSoft: '#DBEAFE',

  // Backgrounds
  coverBg: '#0F2137',
  sidebarBg: '#1E3A5F',
  pageBg: '#FFFFFF',
  sectionBg: '#F8FAFC',
  tableBg: '#F1F5F9',
  tableHeaderBg: '#1E3A5F',
  alertBg: '#FEF3C7',
  alertBgRed: '#FEE2E2',
  alertBgGreen: '#DCFCE7',
  highlightBg: '#EFF6FF',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  textWhite: '#FFFFFF',
  textOnDark: '#E2E8F0',

  // Accents
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',

  // Borders
  borderLight: '#E2E8F0',
  borderMedium: '#CBD5E1',

  // Chart colors
  chartBar: '#2563EB',
  chartBarAlt: '#7C3AED',
  chartLine: '#16A34A',
};

const FONTS = {
  heading: 'Helvetica-Bold',
  body: 'Helvetica',
  mono: 'Courier',
};

@Injectable()
export class ReportPdfService {
  private readonly logger = new Logger(ReportPdfService.name);

  async generateReportPdf(
    input: GeneratePdfInput,
  ): Promise<{ buffer: Buffer; pageCount: number }> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 56, right: 56 },
      bufferPages: true,
    });

    const theme = { ...DEFAULT_THEME };
    if (input.primaryColor) {
      theme.primary = input.primaryColor;
      theme.primaryLight = input.primaryColor;
      theme.primaryDark = input.primaryColor;
      theme.coverBg = input.primaryColor;
      theme.tableHeaderBg = input.primaryColor;
    }
    if (input.secondaryColor) {
      theme.accent = input.secondaryColor;
      theme.accentLight = input.secondaryColor;
      theme.chartBar = input.secondaryColor;
    }
    (doc as any).theme = theme;
    const THEME = theme;

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk as Buffer));

    let pageCount = 1;
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const contentW = pageW - 112; // margins

    const addPage = () => {
      doc.addPage({ margins: { top: 60, bottom: 60, left: 56, right: 56 } });
      pageCount += 1;
      // Draw subtle header stripe on every content page
      this.drawPageHeader(doc, pageW);
    };

    const revenueSeries = this.extractRevenueSeries(
      input.financialRows,
      input.annualRevenueSeries,
    );
    const localized = this.getLabels(input.language);

    // ═══════════════════════════════════════════════════════════════
    // PAGE 1: COVER PAGE - Professional dark design
    // ═══════════════════════════════════════════════════════════════
    // Disable margins so full-bleed cover elements never trigger an auto-page-break
    doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
    this.drawCoverPage(doc, input, localized, pageW, pageH);
    // CRITICAL FIX: force doc.y to a safe position so PDFKit does NOT
    // silently insert an empty page before our explicit addPage() call.
    doc.y = 10;

    // ═══════════════════════════════════════════════════════════════
    // PAGE 2: TABLE OF CONTENTS
    // ═══════════════════════════════════════════════════════════════
    addPage();
    this.drawTableOfContents(doc, input, localized, contentW);

    // ═══════════════════════════════════════════════════════════════
    // PAGE 3: EXECUTIVE SUMMARY
    // ═══════════════════════════════════════════════════════════════
    addPage();
    this.drawSectionPage(
      doc,
      localized.summaryTitle,
      localized.summarySubtitle,
      contentW,
    );
    const execSummary =
      input.aiContent['EXECUTIVE_SUMMARY'] ||
      input.aiContent['SECTION_EXECUTIVE_SUMMARY'] ||
      'AI-generated summary is currently unavailable.';
    this.renderMarkdownContent(doc, execSummary, contentW);

    // ═══════════════════════════════════════════════════════════════
    // AI ANALYSIS SECTIONS (one page each, with overflow)
    // ═══════════════════════════════════════════════════════════════
    for (const type of input.reportTypes) {
      addPage();
      const prettyName = this.prettyType(type, input.language);
      const sectionIcon = this.getSectionIcon(type, input.language);
      this.drawSectionPage(doc, prettyName, sectionIcon, contentW);

      const sectionText =
        input.aiContent[type] ||
        `AI analysis for ${prettyName} is being processed.`;
      this.renderMarkdownContent(doc, sectionText, contentW);

      if (type === 'FINANCIAL' && input.includeCharts) {
        this.ensureSpace(doc, 220, () => {
          addPage();
        });
        doc.moveDown(1.5);
        this.drawEnhancedBarChart(doc, revenueSeries, localized.chartTitle);

        // Secondary Chart (Breakdown of top metrics for latest period)
        if (input.financialRows && input.financialRows.length > 0) {
          const sorted = [...input.financialRows].sort(
            (a, b) =>
              new Date(b.period).getTime() - new Date(a.period).getTime(),
          );
          const latestPeriod = sorted[0].period;
          const latestRows = sorted.filter(
            (r) =>
              new Date(r.period).getTime() === new Date(latestPeriod).getTime(),
          );
          const nonRevenue = latestRows.filter(
            (r) =>
              !r.metric.toLowerCase().includes('revenu') &&
              !r.metric.toLowerCase().includes('chiffre'),
          );
          const topMetrics = nonRevenue
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .slice(0, 5);

          if (topMetrics.length > 0) {
            const secondarySeries = topMetrics.map((r) => ({
              label: r.metric.substring(0, 12),
              value: Math.abs(r.value),
            }));
            this.ensureSpace(doc, 220, () => {
              addPage();
            });
            doc.moveDown(1.5);
            this.drawEnhancedBarChart(
              doc,
              secondarySeries,
              input.language === 'FR'
                ? 'Répartition (Dernière Période)'
                : 'Breakdown (Latest Period)',
            );
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ADDITIONAL REQUESTED SECTIONS (SWOT, Performance, etc.)
    // ═══════════════════════════════════════════════════════════════
    const sectionKeys = Object.keys(input.aiContent).filter(
      (k) =>
        k.startsWith('SECTION_') &&
        k !== 'SECTION_EXECUTIVE_SUMMARY' &&
        input.aiContent[k],
    );
    for (const key of sectionKeys) {
      addPage();
      const sectionName = this.prettySectionKey(key, input.language);
      this.drawSectionPage(doc, sectionName, '', contentW);
      this.renderMarkdownContent(doc, input.aiContent[key], contentW);
    }

    // ═══════════════════════════════════════════════════════════════
    // ML PREDICTION CONTEXT PAGE
    // ═══════════════════════════════════════════════════════════════
    addPage();
    this.drawSectionPage(doc, localized.predictionTitle, '', contentW);
    this.renderPredictionPage(doc, input, localized, contentW);

    // ═══════════════════════════════════════════════════════════════
    // PROBLEM STATEMENT / FOCUS PAGE
    // ═══════════════════════════════════════════════════════════════
    if (input.problemStatement) {
      addPage();
      this.drawSectionPage(doc, localized.focusTitle, '', contentW);
      // Draw focus box
      const focusY = doc.y;
      doc
        .roundedRect(56, focusY, contentW, 3, 1)
        .fill((doc as any).theme.accent);
      doc.moveDown(0.5);

      const label =
        input.language === 'FR'
          ? "Contexte soumis par l'utilisateur :"
          : input.language === 'AR'
            ? 'السياق المقدم من قبل المستخدم :'
            : 'User-provided context:';

      doc
        .font(FONTS.heading)
        .fontSize(10)
        .fillColor((doc as any).theme.textSecondary)
        .text(label, 56, doc.y);
      doc.moveDown(0.5);

      this.renderMarkdownContent(doc, input.problemStatement, contentW);
    }

    // ═══════════════════════════════════════════════════════════════
    // DATA APPENDIX
    // ═══════════════════════════════════════════════════════════════
    addPage();
    this.drawSectionPage(
      doc,
      localized.appendixTitle,
      localized.appendixSubtitle,
      contentW,
    );
    this.drawEnhancedMetricsTable(doc, input.financialRows, contentW);

    // ═══════════════════════════════════════════════════════════════
    // RENDER ANY REMAINING UNUSED AI CONTENT
    // ═══════════════════════════════════════════════════════════════
    const unusedKeys = Object.keys(input.aiContent).filter((k) => {
      const content = input.aiContent[k];
      return (
        !input.reportTypes.includes(k) &&
        k !== 'EXECUTIVE_SUMMARY' &&
        k !== 'SECTION_EXECUTIVE_SUMMARY' &&
        !k.startsWith('SECTION_') &&
        content &&
        content.trim() !== ''
      );
    });

    for (const key of unusedKeys) {
      addPage();
      this.drawSectionPage(
        doc,
        this.prettySectionKey(key, input.language),
        '',
        contentW,
      );
      this.renderMarkdownContent(doc, input.aiContent[key], contentW);
    }

    // ═══════════════════════════════════════════════════════════════
    // FOOTERS on all pages
    // ═══════════════════════════════════════════════════════════════
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i += 1) {
      doc.switchToPage(i);
      this.drawPageFooter(doc, i, range.count, pageW, pageH, input.aiSource);
    }

    doc.end();

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    return { buffer, pageCount: range.count };
  }

  // ═══════════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════════
  private drawCoverPage(
    doc: PDFKit.PDFDocument,
    input: GeneratePdfInput,
    localized: ReturnType<typeof this.getLabels>,
    pageW: number,
    pageH: number,
  ) {
    // 1. Premium Linear Gradient Background
    const bgGrad = doc.linearGradient(0, 0, pageW, pageH);
    bgGrad.stop(0, (doc as any).theme.primaryDark || '#0F2137');
    bgGrad.stop(1, (doc as any).theme.coverBg || '#1E3A5F');
    doc.rect(0, 0, pageW, pageH).fill(bgGrad);

    // 2. Technical Blueprint Grid Overlay (Subtle)
    doc.save();
    doc.opacity(0.03);
    doc.strokeColor((doc as any).theme.accentLight || '#00d1ff');
    doc.lineWidth(0.5);
    for (let gx = 60; gx < pageW; gx += 60) {
      doc.moveTo(gx, 0).lineTo(gx, pageH).stroke();
    }
    for (let gy = 60; gy < pageH; gy += 60) {
      doc.moveTo(0, gy).lineTo(pageW, gy).stroke();
    }
    doc.restore();

    // 3. Ambient Cockpit Neon Radial Glows
    doc.save();
    try {
      // Top-right Cyan radial glow
      const radialGlow1 = doc.radialGradient(pageW - 80, 120, 10, pageW - 80, 120, 250);
      radialGlow1.stop(0, 'rgba(0, 209, 255, 0.15)');
      radialGlow1.stop(1, 'rgba(0, 209, 255, 0)');
      doc.circle(pageW - 80, 120, 250).fill(radialGlow1);

      // Bottom-left Indigo radial glow
      const radialGlow2 = doc.radialGradient(80, pageH - 120, 10, 80, pageH - 120, 200);
      radialGlow2.stop(0, 'rgba(99, 102, 241, 0.15)');
      radialGlow2.stop(1, 'rgba(99, 102, 241, 0)');
      doc.circle(80, pageH - 120, 200).fill(radialGlow2);
    } catch {
      // safe fallback if gradients fail
    }
    doc.restore();

    // 4. Top Accent Stripe
    doc.rect(0, 0, pageW, 6).fill((doc as any).theme.accent);

    // 5. Left Double Accent Stripes
    doc.rect(56, 160, 4, 110).fill((doc as any).theme.accent);
    doc.rect(64, 175, 1.5, 80).fill((doc as any).theme.accentLight);

    // Custom Logo or SmartBiz AI logo text
    if (input.logoBase64) {
      try {
        const base64Data = input.logoBase64.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const logoBuffer = Buffer.from(base64Data, 'base64');
        // Draw at top right
        doc.image(logoBuffer, pageW - 140, 56, {
          fit: [84, 84],
          align: 'right',
        });
      } catch (e) {
        this.logger.error('Failed to draw cover logo', e);
      }
    } else {
      doc
        .font(FONTS.heading)
        .fontSize(13)
        .fillColor((doc as any).theme.accentLight)
        .text('SMARTBIZ AI', 56, 120, { characterSpacing: 4 });
    }

    // Main Title with slight shift
    doc
      .font(FONTS.heading)
      .fontSize(32)
      .fillColor((doc as any).theme.textWhite)
      .text(localized.reportTitle, 76, 175, { width: pageW - 150 });

    // Subtitle
    doc.moveDown(0.5);
    doc
      .font(FONTS.body)
      .fontSize(13)
      .fillColor((doc as any).theme.textOnDark)
      .text(localized.reportSubtitle, 76, doc.y, { width: pageW - 150 });

    // Elegant Divider Line
    doc
      .moveTo(56, 310)
      .lineTo(pageW - 56, 310)
      .strokeColor((doc as any).theme.primaryLight)
      .lineWidth(0.5)
      .stroke();

    // Metadata section with glassmorphic cards
    const metaY = 340;
    doc
      .font(FONTS.heading)
      .fontSize(11)
      .fillColor((doc as any).theme.accentLight)
      .text(localized.metadata.toUpperCase(), 56, metaY, {
        characterSpacing: 2,
      });

    const metaItems = [
      ['Report ID', input.reportId],
      ['Company ID', input.companyId],
      ['Language', this.languageLabel(input.language)],
      ['Length', input.lengthProfile],
      ['Depth', input.analysisDepth],
      ['Pages', `${input.targetPages}`],
      ['Batch', input.batchId],
      ['Generated', this.formatDateTime(input.generatedAtIso)],
    ];

    // Render metadata as premium grids of 2-column cards
    const cardW = (pageW - 132) / 2;
    const cardH = 46;
    const gapX = 20;
    const startX = 56;
    const cardY = metaY + 24;

    metaItems.forEach(([label, value], index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cellX = startX + col * (cardW + gapX);
      const cellY = cardY + row * (cardH + 12);

      // Card Background (transparent glass-like box)
      doc
        .roundedRect(cellX, cellY, cardW, cardH, 6)
        .fill('rgba(255, 255, 255, 0.035)');
      
      // Thin outline for cards
      doc
        .roundedRect(cellX, cellY, cardW, cardH, 6)
        .strokeColor('rgba(255, 255, 255, 0.05)')
        .lineWidth(0.5)
        .stroke();

      // Card side neon indicator
      doc
        .roundedRect(cellX, cellY, 2.5, cardH, 1)
        .fill(col === 0 ? (doc as any).theme.accent : (doc as any).theme.accentLight);

      // Card label text
      doc
        .font(FONTS.heading)
        .fontSize(7.5)
        .fillColor((doc as any).theme.textLight)
        .text(label.toUpperCase(), cellX + 12, cellY + 9, { characterSpacing: 0.5 });

      // Card value text
      doc
        .font(FONTS.body)
        .fontSize(9.5)
        .fillColor((doc as any).theme.textWhite)
        .text(value, cellX + 12, cellY + 23, { width: cardW - 20, ellipsis: true });
    });

    // Bottom decorative bar
    doc.rect(0, pageH - 40, pageW, 40).fill((doc as any).theme.primaryDark);
    doc.rect(0, pageH - 40, pageW, 2).fill((doc as any).theme.accent);

    // Bottom text
    const poweredByLabel = this.getPoweredByLabel(input.aiSource);
    doc
      .font(FONTS.body)
      .fontSize(8)
      .fillColor((doc as any).theme.textLight)
      .text(`${poweredByLabel}  •  SmartBiz AI Platform`, 56, pageH - 26, {
        width: pageW - 112,
        align: 'center',
      });
  }

  // ═══════════════════════════════════════════════════════════════
  // TABLE OF CONTENTS
  // ═══════════════════════════════════════════════════════════════
  private drawTableOfContents(
    doc: PDFKit.PDFDocument,
    input: GeneratePdfInput,
    localized: ReturnType<typeof this.getLabels>,
    contentW: number,
  ) {
    // Section title
    this.drawSectionPage(
      doc,
      localized.contentsTitle,
      localized.contentsSubtitle,
      contentW,
    );

    let tocPage = 3;
    const tocItems: Array<{ label: string; page: number }> = [];

    tocItems.push({ label: `1. ${localized.summaryTitle}`, page: tocPage });
    tocPage += 1;

    input.reportTypes.forEach((type, index) => {
      tocItems.push({
        label: `${index + 2}. ${this.prettyType(type, input.language)}`,
        page: tocPage,
      });
      tocPage += 1;
    });

    // Additional sections
    const sectionKeys = Object.keys(input.aiContent).filter(
      (k) => k.startsWith('SECTION_') && k !== 'SECTION_EXECUTIVE_SUMMARY',
    );
    sectionKeys.forEach((key, index) => {
      tocItems.push({
        label: `${input.reportTypes.length + index + 2}. ${this.prettySectionKey(key, input.language)}`,
        page: tocPage,
      });
      tocPage += 1;
    });

    tocItems.push({
      label: `${tocItems.length + 1}. ${localized.predictionTitle}`,
      page: tocPage,
    });

    if (input.problemStatement) {
      tocPage += 1;
      tocItems.push({
        label: `${tocItems.length + 1}. ${localized.focusTitle}`,
        page: tocPage,
      });
    }

    tocPage += 1;
    tocItems.push({
      label: `${tocItems.length + 1}. ${localized.appendixTitle}`,
      page: tocPage,
    });

    // Render TOC items with dotted leaders
    let tocY = doc.y + 10;
    for (const item of tocItems) {
      // Item background stripe (alternating)
      if (tocItems.indexOf(item) % 2 === 0) {
        doc.rect(56, tocY - 4, contentW, 28).fill((doc as any).theme.sectionBg);
      }

      doc
        .font(FONTS.body)
        .fontSize(11)
        .fillColor((doc as any).theme.textPrimary)
        .text(item.label, 66, tocY, { width: contentW - 60 });

      // Page number on right
      doc
        .font(FONTS.heading)
        .fontSize(11)
        .fillColor((doc as any).theme.accent)
        .text(`${item.page}`, 56, tocY, { width: contentW, align: 'right' });

      // Dotted line
      doc.font(FONTS.body).fontSize(11);
      const labelWidth = doc.widthOfString(item.label);
      const pageNumStart = 56 + contentW - 30;
      const dotStart = 66 + labelWidth + 8;
      if (dotStart < pageNumStart) {
        doc
          .font(FONTS.body)
          .fontSize(9)
          .fillColor((doc as any).theme.textLight);
        let dotX = dotStart;
        while (dotX < pageNumStart - 10) {
          doc.text('.', dotX, tocY + 1, { width: 6 });
          dotX += 6;
        }
      }

      tocY += 30;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION PAGE HEADER — Premium Colorful Design
  // ═══════════════════════════════════════════════════════════════
  private drawSectionPage(
    doc: PDFKit.PDFDocument,
    title: string,
    subtitle: string,
    contentW: number,
  ) {
    const startY = doc.y;
    const pageW = doc.page.width;
    const bandH = 52;

    // ── Gradient title band (full width) ──────────────────────────
    try {
      const grad = doc.linearGradient(56, startY, 56 + contentW, startY);
      grad.stop(0, (doc as any).theme.primary || '#1E3A5F');
      grad.stop(0.6, (doc as any).theme.accent || '#2563EB');
      grad.stop(1, (doc as any).theme.accentLight || '#3B82F6');
      doc.roundedRect(56, startY, contentW, bandH, 6).fill(grad);
    } catch {
      // Fallback: solid primary color band
      doc.roundedRect(56, startY, contentW, bandH, 6)
         .fill((doc as any).theme.primary || '#1E3A5F');
    }

    // ── Bright left accent stripe on top of band ──────────────────
    doc.roundedRect(56, startY, 5, bandH, 3)
       .fill((doc as any).theme.accentLight || '#3B82F6');

    // ── Micro category label (top-left, white on band) ────────────
    doc
      .font(FONTS.heading)
      .fontSize(6.5)
      .fillColor('rgba(255,255,255,0.65)')
      .text('SMARTBIZ AI  •  STRATEGIC INTELLIGENCE', 68, startY + 7, {
        characterSpacing: 0.8,
        width: contentW - 80,
      });

    // ── Main Section Title (white, bold, large) ───────────────────
    doc
      .font(FONTS.heading)
      .fontSize(20)
      .fillColor('#FFFFFF')
      .text(title, 68, startY + 20, { width: contentW - 80 });

    doc.y = startY + bandH + 6;

    // ── Subtitle below the band ───────────────────────────────────
    if (subtitle) {
      doc
        .font(FONTS.body)
        .fontSize(9)
        .fillColor((doc as any).theme.textMuted || '#64748B')
        .text(subtitle, 56, doc.y, { width: contentW });
      doc.moveDown(0.4);
    }

    // ── Three-segment separator line ──────────────────────────────
    const lineY = doc.y + 4;
    // Full light line
    doc
      .moveTo(56, lineY)
      .lineTo(56 + contentW, lineY)
      .strokeColor((doc as any).theme.borderLight || '#E2E8F0')
      .lineWidth(0.8)
      .stroke();
    // Accent segment (left third)
    doc
      .moveTo(56, lineY)
      .lineTo(56 + contentW * 0.33, lineY)
      .strokeColor((doc as any).theme.accent || '#2563EB')
      .lineWidth(2.5)
      .stroke();
    // Lighter segment (middle third)
    doc
      .moveTo(56 + contentW * 0.33, lineY)
      .lineTo(56 + contentW * 0.55, lineY)
      .strokeColor((doc as any).theme.accentLight || '#3B82F6')
      .lineWidth(1.5)
      .stroke();

    doc.y = lineY + 14;
  }

  // ═══════════════════════════════════════════════════════════════
  // MARKDOWN CONTENT RENDERER
  // ═══════════════════════════════════════════════════════════════
  private renderMarkdownContent(
    doc: PDFKit.PDFDocument,
    text: string,
    contentW: number,
  ) {
    const lines = this.sanitizePdfText(text).split('\n');
    const leftMargin = 56;
    let isFirstContent = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines (add small spacing)
      if (!trimmed) {
         doc.moveDown(0.3);
         continue;
      }

      // Check for page overflow
      if (doc.y > doc.page.height - 90) {
        doc.addPage({ margins: { top: 60, bottom: 60, left: 56, right: 56 } });
        this.drawPageHeader(doc, doc.page.width);
      }

      // Skip the very first "## Heading 2" since drawSectionPage already draws a section title
      if (isFirstContent && trimmed.startsWith('## ')) {
        isFirstContent = false;
        continue;
      }
      isFirstContent = false;

      // ## Heading 2
      if (trimmed.startsWith('## ')) {
        // Prevent orphan headings at the bottom of the page
        if (doc.y > doc.page.height - 130) {
          doc.addPage({ margins: { top: 60, bottom: 60, left: 56, right: 56 } });
          this.drawPageHeader(doc, doc.page.width);
        }
        doc.moveDown(0.6);
        const headingText = trimmed.replace(/^##\s+/, '');
        // Draw elegant rounded heading background
        doc
          .roundedRect(leftMargin, doc.y - 2, contentW, 28, 4)
          .fill((doc as any).theme.highlightBg);
        doc.rect(leftMargin, doc.y - 2, 3.5, 28).fill((doc as any).theme.accent);
        doc
          .font(FONTS.heading)
          .fontSize(13)
          .fillColor((doc as any).theme.primary)
          .text(headingText, leftMargin + 12, doc.y + 6, {
            width: contentW - 20,
          });
        doc.moveDown(0.8);
        continue;
      }

      // ### Heading 3
      if (trimmed.startsWith('### ')) {
        // Prevent orphan headings at the bottom of the page
        if (doc.y > doc.page.height - 110) {
          doc.addPage({ margins: { top: 60, bottom: 60, left: 56, right: 56 } });
          this.drawPageHeader(doc, doc.page.width);
        }
        doc.moveDown(0.4);
        const headingText = trimmed.replace(/^###\s+/, '');
        doc
          .font(FONTS.heading)
          .fontSize(12)
          .fillColor((doc as any).theme.primaryLight)
          .text(headingText, leftMargin, doc.y, { width: contentW });
        doc.moveDown(0.4);
        continue;
      }

      // #### Heading 4
      if (trimmed.startsWith('#### ')) {
        // Prevent orphan headings at the bottom of the page
        if (doc.y > doc.page.height - 100) {
          doc.addPage({ margins: { top: 60, bottom: 60, left: 56, right: 56 } });
          this.drawPageHeader(doc, doc.page.width);
        }
        doc.moveDown(0.3);
        const headingText = trimmed.replace(/^####\s+/, '');
        doc
          .font(FONTS.heading)
          .fontSize(11)
          .fillColor((doc as any).theme.textSecondary)
          .text(headingText, leftMargin, doc.y, { width: contentW });
        doc.moveDown(0.3);
        continue;
      }

      // Table row: | ... | ... |
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        // Check if it's a separator row
        if (trimmed.match(/^\|[-\s|]+\|$/)) {
          continue; // Skip separator lines
        }
        this.renderTableRow(
          doc,
          trimmed,
          leftMargin,
          contentW,
          i === 0 || (i > 0 && lines[i - 1]?.trim().startsWith('|') === false),
        );
        continue;
      }

      // Bullet point: - text or * text
      if (trimmed.match(/^[-*]\s/)) {
        const bulletText = this.stripMarkdownFormatting(
          trimmed.replace(/^[-*]\s+/, ''),
        );
        const bulletY = doc.y;

        // Bullet dot
        doc
          .circle(leftMargin + 8, bulletY + 5, 2.5)
          .fill((doc as any).theme.accent);

        // Check for bold prefix (like **Key**: value)
        this.renderFormattedText(
          doc,
          bulletText,
          leftMargin + 18,
          contentW - 24,
        );
        doc.moveDown(0.15);
        continue;
      }

      // Sub-bullet: ‑ text (indented)
      if (trimmed.match(/^\s+[-*]\s/)) {
        const bulletText = this.stripMarkdownFormatting(
          trimmed.replace(/^\s+[-*]\s+/, ''),
        );
        const bulletY = doc.y;

        doc
          .circle(leftMargin + 24, bulletY + 5, 2)
          .fill((doc as any).theme.textMuted);
        this.renderFormattedText(
          doc,
          bulletText,
          leftMargin + 34,
          contentW - 40,
        );
        doc.moveDown(0.15);
        continue;
      }

      // Alert lines with emoji indicators
      if (trimmed.startsWith('⚠️') || trimmed.startsWith('🔴')) {
        this.drawAlertBox(doc, trimmed, leftMargin, contentW, 'warning');
        continue;
      }
      if (trimmed.startsWith('✅')) {
        this.drawAlertBox(doc, trimmed, leftMargin, contentW, 'success');
        continue;
      }

      // Regular paragraphs
      this.renderFormattedText(doc, trimmed, leftMargin, contentW);
      doc.moveDown(0.2);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FORMATTED TEXT RENDERER (handles **bold** inline)
  // ═══════════════════════════════════════════════════════════════
  private renderFormattedText(
    doc: PDFKit.PDFDocument,
    text: string,
    x: number,
    width: number,
  ) {
    const safe = this.sanitizePdfText(text);
    // Split text by **bold** markers
    const parts = safe.split(/(\*\*[^*]+\*\*)/g);

    if (parts.length === 1) {
      // No bold markers, render as plain text
      doc
        .font(FONTS.body)
        .fontSize(10)
        .fillColor((doc as any).theme.textPrimary)
        .text(this.stripMarkdownFormatting(safe), x, doc.y, {
          width,
          lineGap: 3,
          align: 'justify',
        });
      return;
    }

    // Render inline with bold segments
    let isFirst = true;
    for (const part of parts) {
      if (!part) continue;

      const isBold = part.startsWith('**') && part.endsWith('**');
      const cleanText = isBold ? part.slice(2, -2) : part;

      if (isFirst) {
        doc
          .font(isBold ? FONTS.heading : FONTS.body)
          .fontSize(10)
          .fillColor(
            isBold
              ? (doc as any).theme.primary
              : (doc as any).theme.textPrimary,
          )
          .text(cleanText, x, doc.y, {
            width,
            lineGap: 3,
            continued: parts.indexOf(part) < parts.length - 1,
          });
        isFirst = false;
      } else {
        doc
          .font(isBold ? FONTS.heading : FONTS.body)
          .fontSize(10)
          .fillColor(
            isBold
              ? (doc as any).theme.primary
              : (doc as any).theme.textPrimary,
          )
          .text(cleanText, {
            lineGap: 3,
            continued: parts.indexOf(part) < parts.length - 1,
          });
      }
    }
  }

  /**
   * PDF built-in fonts (Helvetica) do not cover full Unicode; drop C0 controls (except tab/LF/CR)
   * and replace astral characters to avoid garbled glyphs.
   */
  private sanitizePdfText(text: string): string {
    let out = '';
    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      if (cp < 32 && cp !== 9 && cp !== 10 && cp !== 13) {
        continue;
      }
      if (cp >= 0xd800 && cp <= 0xdfff) {
        continue;
      }
      out += cp > 0xffff ? '?' : ch;
    }
    return out;
  }

  private stripMarkdownFormatting(text: string): string {
    return this.sanitizePdfText(
      text
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers for plain text rendering
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic markers
        .replace(/`([^`]+)`/g, '$1'), // Remove code markers
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TABLE RENDERER
  // ═══════════════════════════════════════════════════════════════
  private renderTableRow(
    doc: PDFKit.PDFDocument,
    row: string,
    x: number,
    contentW: number,
    isHeader: boolean,
  ) {
    const cells = row
      .split('|')
      .filter((c) => c.trim())
      .map((c) => c.trim());
    if (cells.length === 0) return;

    const colW = contentW / cells.length;
    const rowH = 22;
    const y = doc.y;

    if (isHeader) {
      // Header row with dark background
      doc.rect(x, y, contentW, rowH).fill((doc as any).theme.tableHeaderBg);
      doc
        .font(FONTS.heading)
        .fontSize(8.5)
        .fillColor((doc as any).theme.textWhite);
    } else {
      // Alternating body rows
      doc.rect(x, y, contentW, rowH).fill((doc as any).theme.sectionBg);
      // Modern subtle border bottom for rows
      doc
        .moveTo(x, y + rowH)
        .lineTo(x + contentW, y + rowH)
        .strokeColor((doc as any).theme.borderLight || '#E2E8F0')
        .lineWidth(0.5)
        .stroke();
      doc
        .font(FONTS.body)
        .fontSize(8.5)
        .fillColor((doc as any).theme.textPrimary);
    }

    cells.forEach((cell, colIdx) => {
      const cleanCell = this.stripMarkdownFormatting(cell);
      doc.text(cleanCell, x + colIdx * colW + 6, y + 6, {
        width: colW - 12,
        lineBreak: false,
      });
    });

    doc.y = y + rowH;
  }

  // ═══════════════════════════════════════════════════════════════
  // ALERT BOX
  // ═══════════════════════════════════════════════════════════════
  private drawAlertBox(
    doc: PDFKit.PDFDocument,
    text: string,
    x: number,
    w: number,
    type: 'warning' | 'success',
  ) {
    const bgColor =
      type === 'warning'
        ? (doc as any).theme.alertBg
        : (doc as any).theme.alertBgGreen;
    const borderColor =
      type === 'warning'
        ? (doc as any).theme.warning
        : (doc as any).theme.success;
    const cleanText = this.stripMarkdownFormatting(text);

    const y = doc.y;
    const boxH = 36;

    doc.roundedRect(x, y, w, boxH, 4).fill(bgColor);
    doc.rect(x, y, 4, boxH).fill(borderColor);

    doc
      .font(FONTS.body)
      .fontSize(9.5)
      .fillColor((doc as any).theme.textPrimary)
      .text(cleanText, x + 14, y + 10, { width: w - 24 });

    doc.y = y + boxH + 6;
  }

  // ═══════════════════════════════════════════════════════════════
  // PREDICTION PAGE
  // ═══════════════════════════════════════════════════════════════
  private renderPredictionPage(
    doc: PDFKit.PDFDocument,
    input: GeneratePdfInput,
    localized: ReturnType<typeof this.getLabels>,
    contentW: number,
  ) {
    const x = 56;

    // Intro text
    doc
      .font(FONTS.body)
      .fontSize(10.5)
      .fillColor((doc as any).theme.textSecondary)
      .text(localized.predictionBody, x, doc.y, {
        width: contentW,
        lineGap: 4,
        align: 'justify',
      });
    doc.moveDown(1.2);

    // Prediction status card
    const cardY = doc.y;
    const cardH = 90;
    doc
      .roundedRect(x, cardY, contentW, cardH, 6)
      .fill((doc as any).theme.highlightBg);
    doc
      .roundedRect(x, cardY, contentW, cardH, 6)
      .strokeColor((doc as any).theme.borderLight)
      .lineWidth(1)
      .stroke();

    // Status indicator
    const statusColor =
      input.prediction.status === 'COMPLETED'
        ? (doc as any).theme.success
        : (doc as any).theme.warning;
    doc.circle(x + 20, cardY + 20, 6).fill(statusColor);

    doc
      .font(FONTS.heading)
      .fontSize(11)
      .fillColor((doc as any).theme.primary)
      .text('Machine Learning Engine', x + 36, cardY + 14);

    doc
      .font(FONTS.body)
      .fontSize(10)
      .fillColor((doc as any).theme.textSecondary);
    doc.text(`Status: ${input.prediction.status ?? 'N/A'}`, x + 20, cardY + 38);
    doc.text(
      `Prediction Available: ${input.prediction.hasPrediction ? 'Yes' : 'No'}`,
      x + 20,
      cardY + 54,
    );
    if (input.prediction.createdAt) {
      doc.text(
        `Timestamp: ${new Date(input.prediction.createdAt).toISOString()}`,
        x + 20,
        cardY + 70,
      );
    }

    doc.y = cardY + cardH + 16;
  }

  // ═══════════════════════════════════════════════════════════════
  // ENHANCED BAR CHART
  // ═══════════════════════════════════════════════════════════════
  private drawEnhancedBarChart(
    doc: PDFKit.PDFDocument,
    data: Array<{ label: string; value: number }>,
    title: string,
  ) {
    const x = 56;
    const y = doc.y + 8;
    const width = doc.page.width - 112;
    const height = 200;

    // Chart container with shadow effect
    doc.roundedRect(x + 2, y + 2, width, height, 6).fill('#F1F5F9'); // shadow
    doc.roundedRect(x, y, width, height, 6).fill((doc as any).theme.pageBg);
    doc
      .roundedRect(x, y, width, height, 6)
      .strokeColor((doc as any).theme.borderLight)
      .lineWidth(1)
      .stroke();

    // Chart title
    doc
      .font(FONTS.heading)
      .fontSize(10)
      .fillColor((doc as any).theme.primary)
      .text(title || 'Revenue Trend', x + 16, y + 12);

    if (data.length === 0 || data.every((d) => d.value === 0)) {
      doc
        .font(FONTS.body)
        .fontSize(10)
        .fillColor((doc as any).theme.textMuted)
        .text('No revenue data available for chart rendering.', x + 16, y + 90);
      doc.y = y + height + 10;
      return;
    }

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const chartLeft = x + 60;
    const chartRight = x + width - 20;
    const chartTop = y + 40;
    const chartBottom = y + height - 35;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;
    const barGap = 12;
    const barWidth = Math.max(
      16,
      (chartWidth - barGap * (data.length - 1)) / data.length,
    );

    // Y-axis gridlines with labels
    for (let i = 0; i <= 4; i++) {
      const gridY = chartBottom - (i / 4) * chartHeight;
      const gridValue = (maxValue * i) / 4;

      doc
        .moveTo(chartLeft, gridY)
        .lineTo(chartRight, gridY)
        .strokeColor((doc as any).theme.borderLight)
        .lineWidth(0.5)
        .dash(3, { space: 3 })
        .stroke();
      doc.undash();

      doc
        .font(FONTS.body)
        .fontSize(7)
        .fillColor((doc as any).theme.textMuted)
        .text(this.formatNumber(gridValue), x + 8, gridY - 4, {
          width: 48,
          align: 'right',
        });
    }

    // Bars
    data.forEach((point, i) => {
      const barHeight = Math.max(3, (point.value / maxValue) * chartHeight);
      const barX = chartLeft + i * (barWidth + barGap);
      const barY = chartBottom - barHeight;

      // Premium bar gradient (from accent to primaryLight)
      const barGrad = doc.linearGradient(barX, barY, barX, barY + barHeight);
      barGrad.stop(0, (doc as any).theme.accent || '#2563EB');
      barGrad.stop(1, (doc as any).theme.primaryLight || '#1E3A5F');

      doc
        .roundedRect(barX, barY, barWidth, barHeight, 3)
        .fill(barGrad);
      
      doc
        .roundedRect(barX, barY, barWidth, Math.min(3, barHeight), 1)
        .fill((doc as any).theme.accentLight); // highlight top

      // Value label on top
      if (point.value > 0) {
        doc
          .font(FONTS.heading)
          .fontSize(7)
          .fillColor((doc as any).theme.primary)
          .text(this.formatNumber(point.value), barX - 4, barY - 12, {
            width: barWidth + 8,
            align: 'center',
          });
      }

      // X-axis label
      doc
        .font(FONTS.body)
        .fontSize(7.5)
        .fillColor((doc as any).theme.textSecondary)
        .text(point.label, barX - 4, chartBottom + 6, {
          width: barWidth + 8,
          align: 'center',
        });
    });

    doc.y = y + height + 12;
  }

  // ═══════════════════════════════════════════════════════════════
  // ENHANCED METRICS TABLE
  // ═══════════════════════════════════════════════════════════════
  private drawEnhancedMetricsTable(
    doc: PDFKit.PDFDocument,
    rows: FinancialRow[],
    contentW: number,
  ) {
    const latestRows = [...rows]
      .sort(
        (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime(),
      )
      .slice(0, 18);

    if (latestRows.length === 0) {
      doc
        .font(FONTS.body)
        .fontSize(10)
        .fillColor((doc as any).theme.textMuted)
        .text('No metrics available.');
      return;
    }

    const x = 56;
    let y = doc.y + 8;
    const colWidths = [
      Math.floor(contentW * 0.45),
      Math.floor(contentW * 0.27),
      Math.floor(contentW * 0.28),
    ];
    const rowH = 24;

    // Header row
    doc
      .roundedRect(x, y, contentW, rowH, 3)
      .fill((doc as any).theme.tableHeaderBg);
    doc
      .font(FONTS.heading)
      .fontSize(9)
      .fillColor((doc as any).theme.textWhite);
    doc.text('Metric', x + 10, y + 7, { width: colWidths[0] - 15 });
    doc.text('Value', x + colWidths[0] + 8, y + 7, {
      width: colWidths[1] - 12,
    });
    doc.text('Period', x + colWidths[0] + colWidths[1] + 8, y + 7, {
      width: colWidths[2] - 12,
    });

    y += rowH;
    doc.font(FONTS.body).fontSize(9);

    latestRows.forEach((row, index) => {
      if (y > doc.page.height - 80) return;

      // Alternating row colors
      const bg =
        index % 2 === 0
          ? (doc as any).theme.pageBg
          : (doc as any).theme.sectionBg;
      doc.rect(x, y, contentW, rowH).fill(bg);

      // Modern subtle border bottom for rows
      doc
        .moveTo(x, y + rowH)
        .lineTo(x + contentW, y + rowH)
        .strokeColor((doc as any).theme.borderLight || '#E2E8F0')
        .lineWidth(0.5)
        .stroke();

      // Metric name
      doc
        .fillColor((doc as any).theme.textPrimary)
        .text(this.formatMetricName(row.metric), x + 10, y + 7, {
          width: colWidths[0] - 15,
        });

      // Value with color coding
      const numValue = Number(row.value) || 0;
      const valueColor =
        numValue < 0
          ? (doc as any).theme.danger
          : (doc as any).theme.textPrimary;
      doc
        .fillColor(valueColor)
        .text(numValue.toLocaleString(), x + colWidths[0] + 8, y + 7, {
          width: colWidths[1] - 12,
        });

      // Period
      doc
        .fillColor((doc as any).theme.textSecondary)
        .text(
          new Date(row.period).toISOString().slice(0, 10),
          x + colWidths[0] + colWidths[1] + 8,
          y + 7,
          {
            width: colWidths[2] - 12,
          },
        );

      y += rowH;
    });

    // Bottom border
    doc
      .moveTo(x, y)
      .lineTo(x + contentW, y)
      .strokeColor((doc as any).theme.borderMedium)
      .lineWidth(1)
      .stroke();
    doc.y = y + 8;
  }

  // ═══════════════════════════════════════════════════════════════
  // SUPPLEMENTAL PAGES (with real derived content instead of placeholders)

  // ═══════════════════════════════════════════════════════════════
  // PAGE DECORATIONS
  // ═══════════════════════════════════════════════════════════════
  private drawPageHeader(doc: PDFKit.PDFDocument, pageW: number) {
    doc.save();
    
    // Top accent thin bar
    doc.rect(0, 0, pageW, 4).fill((doc as any).theme.accent);
    
    // Thin header border line
    doc
      .moveTo(56, 40)
      .lineTo(pageW - 56, 40)
      .strokeColor((doc as any).theme.borderLight || '#E2E8F0')
      .lineWidth(0.5)
      .stroke();
      
    // Subtle top header text
    doc
      .font(FONTS.heading)
      .fontSize(7)
      .fillColor((doc as any).theme.textLight || '#94A3B8')
      .text('SMARTBIZ AI  •  STRATEGIC REPORT', 56, 28, { characterSpacing: 1 });
      
    doc.restore();
    
    // Reset doc.y below the header area
    doc.y = 60;
  }

  private drawPageFooter(
    doc: PDFKit.PDFDocument,
    pageIndex: number,
    totalPages: number,
    pageW: number,
    pageH: number,
    aiSource?: ReportContentSource,
  ) {
    const footerY = pageH - 45;

    // Footer separator
    doc
      .moveTo(56, footerY)
      .lineTo(pageW - 56, footerY)
      .strokeColor((doc as any).theme.borderLight)
      .lineWidth(0.5)
      .stroke();

    // Left: Brand
    doc
      .font(FONTS.heading)
      .fontSize(7.5)
      .fillColor((doc as any).theme.textMuted)
      .text('SmartBiz AI', 56, footerY + 8);

    // Center: generation source
    const poweredByLabel = this.getPoweredByLabel(aiSource);
    doc
      .font(FONTS.body)
      .fontSize(7.5)
      .fillColor((doc as any).theme.textLight)
      .text(poweredByLabel, 56, footerY + 8, {
        width: pageW - 112,
        align: 'center',
      });

    // Right: Page number
    doc
      .font(FONTS.heading)
      .fontSize(8)
      .fillColor((doc as any).theme.accent)
      .text(`${pageIndex + 1} / ${totalPages}`, 56, footerY + 8, {
        width: pageW - 112,
        align: 'right',
      });
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════
  private ensureSpace(
    doc: PDFKit.PDFDocument,
    needed: number,
    addPageFn: () => void,
  ) {
    if (doc.y + needed > doc.page.height - 80) {
      addPageFn();
    }
  }

  private getPoweredByLabel(aiSource?: ReportContentSource): string {
    if (aiSource === 'fallback') {
      return 'Powered by SmartBiz Engine (Fallback Mode)';
    }
    if (aiSource === 'mixed') {
      return 'Powered by AI + SmartBiz Fallback';
    }
    if (aiSource === 'xai') {
      return 'Powered by xAI Grok';
    }
    if (aiSource === 'openrouter') {
      return 'Powered by OpenRouter AI';
    }
    return 'Powered by SmartBiz AI';
  }

  private getLabels(language: string) {
    if (language === 'FR') {
      return {
        reportTitle: 'Rapport SmartBiz AI',
        reportSubtitle:
          'Analyse financière et stratégique générée par Intelligence Artificielle',
        metadata: 'Métadonnées du rapport',
        contentsTitle: 'Table des Matières',
        contentsSubtitle: 'Structure du document',
        summaryTitle: 'Résumé Exécutif',
        summarySubtitle: 'Vue stratégique de haut niveau',
        predictionTitle: 'Contexte de Prédiction ML',
        predictionBody:
          'Le moteur de machine learning a analysé les tendances historiques pour fournir le statut suivant. Ce contexte alimente la narration stratégique générée ci-dessus.',
        focusTitle: "Focus d'Analyse Approfondie",
        appendixTitle: 'Annexe de Données',
        appendixSubtitle: 'Principaux indicateurs financiers extraits',
        chartTitle: 'Tendance des Revenus (N-2 / N-1 / N)',
      };
    }

    if (language === 'AR') {
      return {
        reportTitle: 'تقرير SmartBiz AI',
        reportSubtitle: 'تحليل مالي واستراتيجي مولد بالذكاء الاصطناعي',
        metadata: 'بيانات التقرير',
        contentsTitle: 'جدول المحتويات',
        contentsSubtitle: 'هيكل المستند',
        summaryTitle: 'الملخص التنفيذي',
        summarySubtitle: 'نظرة استراتيجية عامة',
        predictionTitle: 'سياق توقعات التعلم الآلي',
        predictionBody:
          'قام محرك التعلم الآلي بتحليل الأنماط التاريخية لتقديم الحالة التي يستند إليها هذا التقرير.',
        focusTitle: 'محور التحليل المتعمق',
        appendixTitle: 'ملحق البيانات',
        appendixSubtitle: 'أهم المؤشرات المالية المستخرجة',
        chartTitle: 'اتجاه الإيرادات',
      };
    }

    return {
      reportTitle: 'SmartBiz AI Report',
      reportSubtitle: 'AI-Generated Financial & Strategic Analysis',
      metadata: 'Report Metadata',
      contentsTitle: 'Table of Contents',
      contentsSubtitle: 'Document structure and sections',
      summaryTitle: 'Executive Summary',
      summarySubtitle: 'High-level strategic overview',
      predictionTitle: 'ML Prediction Context',
      predictionBody:
        'Our machine-learning engine analyzed historical patterns to provide the following status. This context is used to ground the AI-generated strategic narrative above.',
      focusTitle: 'Deep-dive Focus',
      appendixTitle: 'Data Appendix',
      appendixSubtitle: 'Key extracted financial metrics',
      chartTitle: 'Revenue Trend (N-2 / N-1 / N)',
    };
  }

  private prettyType(type: string, lang: string): string {
    const isFr = lang === 'FR';
    const isAr = lang === 'AR';
    switch (type) {
      case 'FINANCIAL':
        return isFr
          ? 'Analyse Financière'
          : isAr
            ? 'التحليل المالي'
            : 'Financial Analysis';
      case 'BUSINESS_DESCRIPTION':
        return isFr
          ? "Description de l'Entreprise"
          : isAr
            ? 'وصف الشركة'
            : 'Business Description';
      case 'RISK_ANALYSIS':
        return isFr
          ? 'Analyse des Risques'
          : isAr
            ? 'تحليل المخاطر'
            : 'Risk Analysis';
      case 'ACTION_PLAN':
        return isFr
          ? "Plan d'Action Stratégique"
          : isAr
            ? 'خطة العمل الاستراتيجية'
            : 'Strategic Action Plan';
      default:
        return type;
    }
  }

  private prettySectionKey(key: string, lang: string): string {
    const name = key.replace(/^SECTION_/, '');
    const isFr = lang === 'FR';
    const isAr = lang === 'AR';
    switch (name) {
      case 'EXECUTIVE_SUMMARY':
        return isFr
          ? 'Résumé Exécutif'
          : isAr
            ? 'الملخص التنفيذي'
            : 'Executive Summary';
      case 'SWOT_ANALYSIS':
        return isFr ? 'Analyse SWOT' : isAr ? 'تحليل SWOT' : 'SWOT Analysis';
      case 'PERFORMANCE_ANALYSIS':
        return isFr
          ? 'Analyse de Performance'
          : isAr
            ? 'تحليل الأداء'
            : 'Performance Analysis';
      case 'FINANCIAL_OVERVIEW':
        return isFr
          ? 'Aperçu Financier'
          : isAr
            ? 'نظرة عامة مالية'
            : 'Financial Overview';
      case 'RECOMMENDATIONS':
        return isFr ? 'Recommandations' : isAr ? 'التوصيات' : 'Recommendations';
      case 'FORECASTS_TRENDS':
        return isFr
          ? 'Prévisions et Tendances'
          : isAr
            ? 'التوقعات والاتجاهات'
            : 'Forecasts & Trends';
      default:
        return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  private getSectionIcon(type: string, lang: string): string {
    const isFr = lang === 'FR';
    const isAr = lang === 'AR';
    switch (type) {
      case 'FINANCIAL':
        return isFr
          ? 'Examen détaillé des revenus, de la rentabilité et de la stabilité financière'
          : isAr
            ? 'مراجعة مفصلة للإيرادات والربحية والاستقرار المالي'
            : 'Detailed review of revenue, profitability, and financial stability';
      case 'BUSINESS_DESCRIPTION':
        return isFr
          ? "Analyse de l'état actuel de l'entreprise et de sa position sur le marché"
          : isAr
            ? 'تحليل الوضع الحالي للشركة ومكانتها في السوق'
            : 'Analysis of current business state and market position';
      case 'RISK_ANALYSIS':
        return isFr
          ? 'Identification des principaux risques financiers et opérationnels'
          : isAr
            ? 'تحديد المخاطر المالية والتشغيلية الرئيسية'
            : 'Identification of key financial and operational risks';
      case 'ACTION_PLAN':
        return isFr
          ? 'Recommandations concrètes basées sur les données et prochaines étapes'
          : isAr
            ? 'توصيات ملموسة مبنية على البيانات والخطوات التالية'
            : 'Concrete, data-driven recommendations and next steps';
      default:
        return '';
    }
  }

  private languageLabel(lang: string): string {
    if (lang === 'FR') return 'Français';
    if (lang === 'AR') return 'العربية';
    return 'English';
  }

  private formatDateTime(iso: string): string {
    try {
      const d = new Date(iso);
      return (
        d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
        ' ' +
        d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return iso;
    }
  }

  private formatNumber(n: number): string {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
  }

  private formatMetricName(metric: string): string {
    return metric.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private extractRevenueSeries(
    rows: FinancialRow[],
    annualRevenueSeries?: Array<{ label: string; value: number }>,
  ) {
    if (
      Array.isArray(annualRevenueSeries) &&
      annualRevenueSeries.length === 3 &&
      annualRevenueSeries.some((point) => Number(point.value) > 0)
    ) {
      return annualRevenueSeries.map((point) => ({
        label: point.label,
        value: Number(point.value) || 0,
      }));
    }

    return rows
      .filter((r) => r.metric.toLowerCase().includes('revenue'))
      .sort(
        (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime(),
      )
      .slice(-10)
      .map((r) => ({
        label: new Date(r.period).toISOString().slice(0, 7),
        value: Number(r.value) || 0,
      }));
  }
}
