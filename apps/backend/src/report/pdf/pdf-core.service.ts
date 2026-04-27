import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { PdfComponentsService } from './pdf-components.service';
import { PdfChartDrawer } from './pdf-chart-drawer.service';
import {
  CompanyBranding,
  PageBudget,
  PdfFonts,
  PdfRenderOptions,
  PdfTheme,
  SectorBenchmark,
  BenchmarkDelta,
} from '../interfaces/report-content.types';

type ChartSpec = {
  type: 'bar' | 'line' | 'area' | 'donut' | 'benchmark_comparison' | 'dual_axis';
  title: string;
  series: Array<{ label: string; value: number }>;
  metricName: string;
  compareSeries?: Array<{ label: string; value: number }>;
};

type RenderSection = {
  type: string;
  title: string;
  text: string;
  chartData?: ChartSpec;
};

type PdfCoreInput = {
  reportId: string;
  companyId: string;
  language?: string;
  sections: RenderSection[];
  branding: CompanyBranding;
  pageBudget: PageBudget;
  benchmark?: SectorBenchmark;
  benchmarkDeltas?: BenchmarkDelta[];
};

@Injectable()
export class PdfCoreService {
  private readonly logger = new Logger(PdfCoreService.name);
  private arabicFontPath: string | null = null;
  private arabicBoldFontPath: string | null = null;

  constructor(
    private readonly components: PdfComponentsService,
    private readonly charts: PdfChartDrawer,
  ) {
    // Check for Arabic font availability
    const fontsDir = path.resolve('/usr/src/app/fonts');
    const regularPath = path.join(fontsDir, 'NotoSansArabic-Regular.ttf');
    const boldPath = path.join(fontsDir, 'NotoSansArabic-Bold.ttf');

    if (fs.existsSync(regularPath)) {
      this.arabicFontPath = regularPath;
      this.logger.log('Arabic font loaded: NotoSansArabic-Regular.ttf');
    }
    if (fs.existsSync(boldPath)) {
      this.arabicBoldFontPath = boldPath;
      this.logger.log('Arabic bold font loaded: NotoSansArabic-Bold.ttf');
    }
  }

  async generateReport(
    input: PdfCoreInput,
  ): Promise<{ buffer: Buffer; pageCount: number }> {
    const isRTL = input.language === 'AR';

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 72, bottom: 72, left: 56, right: 56 },
      bufferPages: true,
    });

    // Register Arabic fonts if available
    if (this.arabicFontPath) {
      doc.registerFont('Arabic', this.arabicFontPath);
      doc.registerFont('Arabic-Bold', this.arabicBoldFontPath || this.arabicFontPath);
    }

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk as Buffer));

    const leftMargin = 56;
    const contentW = doc.page.width - 112;
    const theme = this.generateTheme(input.branding);
    const fonts = this.getFonts(isRTL);
    const options: PdfRenderOptions = { contentW, theme, fonts, leftMargin, isRTL };

    // 1. Cover Page
    this.renderCover(doc, input, options);

    // 2. Table of Contents
    doc.addPage();
    this.renderTableOfContents(doc, input, options);

    // 3. Sections
    for (let idx = 0; idx < input.sections.length; idx++) {
      const section = input.sections[idx];
      doc.addPage();

      // Section number indicator
      this.components.drawSectionNumber(doc, idx + 1, options);
      this.components.drawSectionHeader(doc, section.title, '', options);

      // Markdown Text
      this.components.renderMarkdownContent(doc, section.text, options);

      // Optional Chart
      if (section.chartData && section.chartData.series.length > 0) {
        if (doc.y > doc.page.height - 280) {
          doc.addPage();
        } else {
          doc.moveDown(2);
        }

        const chartOpts = {
          ...options,
          x: leftMargin,
          y: doc.y,
          width: contentW,
          height: 220,
          title: section.chartData.title,
        };

        if (section.chartData.type === 'bar') {
          await this.charts.drawBarChart(doc, section.chartData.series, chartOpts);
        } else if (section.chartData.type === 'area') {
          await this.charts.drawLineChart(doc, section.chartData.series, {
            ...chartOpts,
            isArea: true,
          });
        } else if (section.chartData.type === 'dual_axis') {
          await this.charts.drawDualAxisChart(doc, section.chartData, chartOpts);
        } else {
          await this.charts.drawLineChart(doc, section.chartData.series, chartOpts);
        }
        doc.y += 240;
      }
    }

    // 4. Benchmark Page (if deltas available)
    if (input.benchmarkDeltas && input.benchmarkDeltas.length > 0 && input.benchmark) {
      doc.addPage();
      this.renderBenchmarkPage(doc, input, options);
    }

    // 5. Global Header/Footer with pagination
    this.addHeadersAndFooters(doc, input, options);

    const finalPageCount = doc.bufferedPageRange().count;

    doc.end();

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    return { buffer, pageCount: finalPageCount };
  }

  // ─── Private Rendering Methods ───

  private renderCover(
    doc: typeof PDFDocument,
    input: PdfCoreInput,
    options: PdfRenderOptions,
  ) {
    const { theme, fonts, leftMargin, contentW, isRTL } = options;
    const pw = doc.page.width;
    const ph = doc.page.height;
    const textAlign = isRTL ? 'right' as const : 'left' as const;
    const textX = isRTL ? leftMargin : leftMargin;

    // ──────── Premium Background ────────
    doc.rect(0, 0, pw, ph).fill(theme.primaryDark);

    // Diagonal accent shape (mirrored for RTL)
    doc.save();
    if (isRTL) {
      doc.polygon(
        [pw, 0],
        [pw * 0.35, 0],
        [pw * 0.65, ph],
        [pw, ph],
      ).fill(theme.primary);
    } else {
      doc.polygon(
        [0, 0],
        [pw * 0.65, 0],
        [pw * 0.35, ph],
        [0, ph],
      ).fill(theme.primary);
    }
    doc.restore();

    // Accent stripe (mirrored)
    if (isRTL) {
      doc.rect(0, 0, 6, ph).fill(theme.accent);
    } else {
      doc.rect(pw - 6, 0, 6, ph).fill(theme.accent);
    }

    // Subtle horizontal lines for texture
    for (let i = 0; i < 8; i++) {
      const lineY = 120 + i * 60;
      doc.save();
      doc.moveTo(0, lineY).lineTo(pw, lineY)
        .strokeColor(theme.accentSoft).lineWidth(0.3).opacity(0.15).stroke();
      doc.restore();
    }

    // ──────── Logo ────────
    let logoY = 100;
    if (input.branding.logoUrl && input.branding.logoUrl.startsWith('data:image/')) {
      try {
        const base64Data = input.branding.logoUrl.replace(/^data:image\/\w+;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');
        const logoX = isRTL ? pw - leftMargin - 120 : leftMargin;
        doc.image(imgBuffer, logoX, 80, { fit: [120, 60], align: 'center' });
        logoY = 160;
      } catch (e) {
        this.logger.warn('Failed to render base64 logo');
      }
    }

    // ──────── Company Name (top) ────────
    doc
      .font(fonts.heading)
      .fontSize(14)
      .fillColor(theme.accentLight)
      .text(input.branding.companyName.toUpperCase(), textX, logoY, {
        width: contentW,
        align: textAlign,
        characterSpacing: isRTL ? 0 : 4,
      });

    // ──────── Decorative Accent Line ────────
    const lineTop = logoY + 30;
    const accentLineX = isRTL ? pw - leftMargin - 60 : leftMargin;
    doc.rect(accentLineX, lineTop, 60, 3).fill(theme.accent);

    // ──────── Main Title ────────
    const titleY = ph * 0.35;
    const titleMap: Record<string, string> = {
      FR: "Rapport d'Analyse",
      AR: 'تقرير التحليل',
      EN: 'Analysis Report',
    };
    doc
      .font(fonts.heading)
      .fontSize(isRTL ? 38 : 44)
      .fillColor(theme.textWhite)
      .text(titleMap[input.language || 'FR'] || titleMap.EN, textX, titleY, {
        width: contentW * 0.7,
        align: textAlign,
        features: isRTL ? ['rtla'] : undefined,
      });

    // ──────── Subtitle ────────
    doc.moveDown(0.5);
    const subtitleMap: Record<string, string> = {
      FR: 'Financiere',
      AR: 'المالي',
      EN: 'Financial',
    };
    doc
      .font(fonts.heading)
      .fontSize(isRTL ? 38 : 44)
      .fillColor(theme.accent)
      .text(subtitleMap[input.language || 'FR'] || subtitleMap.EN, textX, doc.y, {
        width: contentW * 0.7,
        align: textAlign,
        features: isRTL ? ['rtla'] : undefined,
      });

    // ──────── Description Line ────────
    doc.moveDown(1.5);
    const descMap: Record<string, string> = {
      FR: 'Analyse strategique et performance financiere approfondie',
      AR: 'تحليل استراتيجي معمق للأداء المالي',
      EN: 'In-depth strategic analysis and financial performance review',
    };
    doc
      .font(fonts.body)
      .fontSize(12)
      .fillColor(theme.accentLight)
      .text(descMap[input.language || 'FR'] || descMap.EN, textX, doc.y, {
        width: contentW * 0.65,
        align: textAlign,
        features: isRTL ? ['rtla'] : undefined,
      });

    // ──────── Bottom Section ────────
    const sepX = isRTL ? pw - leftMargin - contentW * 0.5 : leftMargin;
    doc.rect(sepX, ph - 160, contentW * 0.5, 1).fill(theme.accentSoft);

    // Date
    const formattedDate = new Date().toLocaleDateString(
      input.language === 'AR' ? 'ar-SA' : input.language === 'FR' ? 'fr-FR' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' },
    );

    const dateLabel = input.language === 'AR' ? 'تاريخ التقرير' : input.language === 'FR' ? 'Date de generation' : 'Report Date';
    const refLabel = input.language === 'AR' ? 'المرجع' : input.language === 'FR' ? 'Reference' : 'Reference ID';

    doc.font(fonts.body).fontSize(10).fillColor(theme.textWhite)
      .text(dateLabel, textX, ph - 140, { width: contentW, align: textAlign });
    doc.font(fonts.heading).fontSize(12).fillColor(theme.accentLight)
      .text(formattedDate, textX, ph - 125, { width: contentW, align: textAlign });

    // Report ID
    doc.font(fonts.body).fontSize(10).fillColor(theme.textWhite)
      .text(refLabel, textX, ph - 100, { width: contentW, align: textAlign });
    doc.font(fonts.mono).fontSize(9).fillColor(theme.accentLight)
      .text(input.reportId.substring(0, 18), textX, ph - 85, { width: contentW, align: textAlign });

    // Confidential badge
    const badgeW = 180;
    const badgeX = isRTL ? leftMargin : pw - badgeW - leftMargin;
    const badgeY = ph - 145;
    doc.roundedRect(badgeX, badgeY, badgeW, 28, 4)
      .fillAndStroke(theme.primaryDark, theme.warning);
    const confLabel = input.language === 'AR' ? 'سري للغاية' : input.language === 'FR' ? 'STRICTEMENT CONFIDENTIEL' : 'STRICTLY CONFIDENTIAL';
    doc.font(fonts.heading).fontSize(9).fillColor(theme.warning)
      .text(confLabel, badgeX, badgeY + 9, {
        width: badgeW,
        align: 'center',
        characterSpacing: isRTL ? 0 : 1.5,
      });

    // SmartBiz AI Branding
    doc.font(fonts.body).fontSize(8).fillColor(theme.textMuted)
      .text('Powered by SmartBiz AI', leftMargin, ph - 60, {
        align: isRTL ? 'right' : 'left',
        width: contentW,
      });
  }

  private renderTableOfContents(
    doc: typeof PDFDocument,
    input: PdfCoreInput,
    options: PdfRenderOptions,
  ) {
    const { theme, fonts, leftMargin, contentW, isRTL } = options;
    const textAlign = isRTL ? 'right' as const : 'left' as const;

    // TOC Header
    const tocLabel = input.language === 'AR' ? 'الفهرس' : input.language === 'FR' ? 'SOMMAIRE' : 'TABLE OF CONTENTS';
    doc
      .font(fonts.heading)
      .fontSize(10)
      .fillColor(theme.accent)
      .text(tocLabel.toUpperCase(), leftMargin, 80, {
        width: contentW,
        align: textAlign,
        characterSpacing: isRTL ? 0 : 3,
      });

    // Accent line under header
    const accentX = isRTL ? leftMargin + contentW - 40 : leftMargin;
    doc.rect(accentX, 100, 40, 3).fill(theme.accent);

    doc.moveDown(3);
    let currentY = doc.y + 10;

    input.sections.forEach((s, idx) => {
      const numX = isRTL ? leftMargin + contentW - 24 : leftMargin;
      const numY = currentY;
      const circleR = 12;

      doc.circle(numX + circleR, numY + circleR, circleR).fill(
        idx === 0 ? theme.accent : theme.sectionBg,
      );
      doc.font(fonts.heading).fontSize(10).fillColor(idx === 0 ? theme.textWhite : theme.primary)
        .text(String(idx + 1).padStart(2, '0'), numX + 2, numY + 6, {
          width: circleR * 2 - 4,
          align: 'center',
        });

      // Section title
      const titleX = isRTL ? leftMargin : numX + circleR * 2 + 12;
      const titleW = isRTL ? contentW - circleR * 2 - 60 : contentW - circleR * 2 - 60;
      doc.font(fonts.body).fontSize(12).fillColor(theme.textPrimary)
        .text(s.title, titleX, numY + 6, {
          width: titleW,
          align: textAlign,
          features: isRTL ? ['rtla'] : undefined,
        });

      currentY += 38;
    });
  }

  private renderBenchmarkPage(
    doc: typeof PDFDocument,
    input: PdfCoreInput,
    options: PdfRenderOptions,
  ) {
    const { theme, fonts, leftMargin, contentW, isRTL } = options;
    const deltas = input.benchmarkDeltas!;
    const benchmark = input.benchmark!;

    const headerLabel = input.language === 'AR' ? 'المقارنة القطاعية'
      : input.language === 'FR' ? 'Benchmark Sectoriel' : 'Sector Benchmark';
    const subtitleLabel = `${benchmark.sectorLabel} (${benchmark.sampleSize} ${input.language === 'AR' ? 'شركة' : input.language === 'FR' ? 'entreprises' : 'companies'})`;

    this.components.drawSectionHeader(doc, headerLabel, subtitleLabel, options);
    doc.moveDown(0.5);

    // Benchmark comparison table
    const colWidth = contentW / 4;
    const headerY = doc.y;

    doc.rect(leftMargin, headerY, contentW, 28).fill(theme.primary);
    const headers = input.language === 'AR'
      ? ['المؤشر', 'قيمتك', 'متوسط القطاع', 'الفرق']
      : input.language === 'FR'
        ? ['Metrique', 'Votre valeur', 'Mediane secteur', 'Ecart']
        : ['Metric', 'Your Value', 'Sector Median', 'Delta'];

    const orderedHeaders = isRTL ? [...headers].reverse() : headers;

    orderedHeaders.forEach((h, i) => {
      doc.font(fonts.heading).fontSize(9).fillColor(theme.textWhite)
        .text(h, leftMargin + i * colWidth + 8, headerY + 8, {
          width: colWidth - 16,
          align: 'center',
          features: isRTL ? ['rtla'] : undefined,
        });
    });

    let rowY = headerY + 28;
    deltas.forEach((delta, idx) => {
      const isAlt = idx % 2 === 0;
      doc.rect(leftMargin, rowY, contentW, 26).fill(isAlt ? theme.highlightBg : theme.pageBg);
      doc.rect(leftMargin, rowY, contentW, 26).strokeColor(theme.borderLight).lineWidth(0.3).stroke();

      const deltaColor = delta.interpretation === 'above' ? theme.success
        : delta.interpretation === 'below' ? theme.danger : theme.textMuted;
      const arrow = delta.interpretation === 'above' ? '+' : delta.interpretation === 'below' ? '' : '=';

      const cells = [
        { text: delta.metric, font: fonts.body, color: theme.textPrimary },
        { text: this.fmtNum(delta.companyValue), font: fonts.mono, color: theme.textSecondary },
        { text: this.fmtNum(delta.sectorMedian), font: fonts.mono, color: theme.textSecondary },
        { text: `${arrow}${delta.deltaPercent.toFixed(1)}%`, font: fonts.heading, color: deltaColor },
      ];

      const orderedCells = isRTL ? [...cells].reverse() : cells;

      orderedCells.forEach((cell, i) => {
        doc.font(cell.font).fontSize(9).fillColor(cell.color)
          .text(cell.text, leftMargin + i * colWidth + 8, rowY + 8, {
            width: colWidth - 16,
            align: 'center',
          });
      });

      rowY += 26;
    });
  }

  private addHeadersAndFooters(
    doc: typeof PDFDocument,
    input: PdfCoreInput,
    options: PdfRenderOptions,
  ) {
    const { theme, fonts, leftMargin, contentW, isRTL } = options;
    const pages = doc.bufferedPageRange().count;

    for (let i = 1; i < pages; i++) {
      doc.switchToPage(i);
      const originalBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      // ──────── Header ────────
      doc.rect(0, 0, doc.page.width, 4).fill(theme.accent);

      doc.font(fonts.body).fontSize(7.5).fillColor(theme.textMuted)
        .text(input.branding.companyName, leftMargin, 16, {
          align: isRTL ? 'right' : 'left',
          width: contentW / 2,
        });
      doc.font(fonts.body).fontSize(7.5).fillColor(theme.textMuted)
        .text('SmartBiz AI', leftMargin + contentW / 2, 16, {
          align: isRTL ? 'left' : 'right',
          width: contentW / 2,
        });

      doc.moveTo(leftMargin, 32).lineTo(leftMargin + contentW, 32)
        .strokeColor(theme.borderLight).lineWidth(0.5).stroke();

      // ──────── Footer ────────
      const footerY = doc.page.height - 50;
      doc.moveTo(leftMargin, footerY).lineTo(leftMargin + contentW, footerY)
        .strokeColor(theme.borderLight).lineWidth(0.5).stroke();

      const confLabel = input.language === 'AR' ? 'سري' : input.language === 'FR' ? 'Confidentiel' : 'Confidential';
      doc.font(fonts.body).fontSize(8).fillColor(theme.textMuted)
        .text(confLabel, leftMargin, footerY + 10, {
          width: contentW / 3,
          align: isRTL ? 'right' : 'left',
        });

      const pageNum = `${i + 1}`;
      const totalPages = `${pages}`;
      doc.font(fonts.heading).fontSize(9).fillColor(theme.primary)
        .text(pageNum, leftMargin + contentW / 3, footerY + 10, {
          width: contentW / 3,
          align: 'center',
        });
      doc.font(fonts.body).fontSize(7).fillColor(theme.textMuted)
        .text(`/ ${totalPages}`, leftMargin + contentW / 3 + 12, footerY + 11, {
          width: contentW / 3 - 12,
          align: 'center',
        });

      doc.page.margins.bottom = originalBottom;
    }
  }

  // ─── Theming & Fonts ───

  private generateTheme(branding: CompanyBranding): PdfTheme {
    const primary = branding.primaryColor || '#1E3A5F';
    const accent = branding.secondaryColor || '#2563EB';

    return {
      primary,
      primaryLight: this.adjustHex(primary, 40),
      primaryDark: this.adjustHex(primary, -30),
      accent,
      accentLight: this.adjustHex(accent, 60),
      accentSoft: this.adjustHex(accent, 100),
      coverBg: this.adjustHex(primary, -40),
      pageBg: '#FFFFFF',
      sectionBg: '#F8FAFC',
      tableBg: '#FFFFFF',
      tableHeaderBg: primary,
      highlightBg: '#F1F5F9',
      textPrimary: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#94A3B8',
      textWhite: '#FFFFFF',
      textOnDark: '#F8FAFC',
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
      borderLight: '#E2E8F0',
      borderMedium: '#CBD5E1',
      chartColors: [accent, '#059669', '#D97706', '#7C3AED', '#0891B2'],
    };
  }

  private getFonts(isRTL: boolean): PdfFonts {
    if (isRTL && this.arabicFontPath) {
      return {
        heading: 'Arabic-Bold',
        body: 'Arabic',
        mono: 'Arabic',
      };
    }
    return {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      mono: 'Courier',
    };
  }

  private fmtNum(val: number): string {
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000) return (val / 1_000).toFixed(1) + 'K';
    return val.toFixed(1);
  }

  private adjustHex(hex: string, amount: number): string {
    let color = hex.replace('#', '');
    if (color.length === 3) {
      color = color.split('').map((c) => c + c).join('');
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;
    r = Math.min(Math.max(0, r), 255);
    g = Math.min(Math.max(0, g), 255);
    b = Math.min(Math.max(0, b), 255);
    return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  }
}
