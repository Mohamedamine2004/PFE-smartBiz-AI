import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import PDFDocument from 'pdfkit';
import { PdfComponentsService } from './pdf-components.service';
import { PdfChartDrawer } from './pdf-chart-drawer.service';
import { processPdfText, containsArabic } from './pdf-text-processor';
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
  ) { }

  private async ensureFonts(): Promise<void> {
    if (this.arabicFontPath && this.arabicBoldFontPath) return;

    const fontsDir = path.resolve('/usr/src/app/fonts');
    if (!fs.existsSync(fontsDir)) {
      fs.mkdirSync(fontsDir, { recursive: true });
    }

    // New filenames to force re-download (old cached files may be corrupt HTML)
    const regularPath = path.join(fontsDir, 'NotoSansArabic-Regular-v3.ttf');
    const boldPath = path.join(fontsDir, 'NotoSansArabic-Bold-v3.ttf');

    // Delete old corrupt cached files
    const oldFiles = ['NotoSansArabic-Regular-v2.ttf', 'NotoSansArabic-Bold-v2.ttf',
      'NotoSansArabic-Regular.ttf', 'NotoSansArabic-Bold.ttf'];
    for (const f of oldFiles) {
      const p = path.join(fontsDir, f);
      if (fs.existsSync(p)) { try { fs.unlinkSync(p); } catch (_) { /* ignore */ } }
    }

    const downloadFont = (urls: string[], dest: string): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        // Validate existing file: real TTF fonts are always > 50KB
        if (fs.existsSync(dest)) {
          const stat = fs.statSync(dest);
          if (stat.size > 50_000) return resolve();
          // File too small = corrupt, delete and re-download
          this.logger.warn(`Font file ${dest} is only ${stat.size} bytes (corrupt), re-downloading...`);
          fs.unlinkSync(dest);
        }

        const tryUrl = (index: number) => {
          if (index >= urls.length) {
            reject(new Error(`All download URLs failed for ${dest}`));
            return;
          }
          const url = urls[index];
          this.logger.log(`Downloading font from ${url}...`);

          const follow = (targetUrl: string, depth: number) => {
            if (depth > 5) { tryUrl(index + 1); return; }
            https.get(targetUrl, (res) => {
              if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                follow(res.headers.location, depth + 1);
                return;
              }
              if (res.statusCode !== 200) {
                this.logger.warn(`Font URL returned ${res.statusCode}: ${url}`);
                tryUrl(index + 1);
                return;
              }
              const file = fs.createWriteStream(dest);
              res.pipe(file);
              file.on('finish', () => {
                file.close();
                const stat = fs.statSync(dest);
                if (stat.size < 50_000) {
                  this.logger.warn(`Downloaded font is too small (${stat.size} bytes), trying next URL...`);
                  fs.unlinkSync(dest);
                  tryUrl(index + 1);
                } else {
                  this.logger.log(`Font downloaded successfully: ${dest} (${stat.size} bytes)`);
                  resolve();
                }
              });
            }).on('error', () => tryUrl(index + 1));
          };
          follow(url, 0);
        };
        tryUrl(0);
      });
    };

    // Multiple CDN sources for reliability
    const regularUrls = [
      'https://cdn.jsdelivr.net/gh/notofonts/arabic@main/fonts/NotoSansArabic/unhinted/ttf/NotoSansArabic-Regular.ttf',
      'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf',
      'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf',
    ];
    const boldUrls = [
      'https://cdn.jsdelivr.net/gh/notofonts/arabic@main/fonts/NotoSansArabic/unhinted/ttf/NotoSansArabic-Bold.ttf',
      'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Bold.ttf',
      'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Bold.ttf',
    ];

    try {
      await downloadFont(regularUrls, regularPath);
      await downloadFont(boldUrls, boldPath);
      this.arabicFontPath = regularPath;
      this.arabicBoldFontPath = boldPath;
      this.logger.log('Arabic fonts ready.');
    } catch (e) {
      this.logger.error('Failed to download Arabic fonts — Arabic text may not render correctly.', e);
    }
  }

  async generateReport(
    input: PdfCoreInput,
  ): Promise<{ buffer: Buffer; pageCount: number }> {
    await this.ensureFonts();
    const isRTL = input.language === 'AR';

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 72, bottom: 72, left: 56, right: 56 },
      bufferPages: true,
    });

    // Register Arabic fonts if available
    if (this.arabicFontPath) {
      try {
        doc.registerFont('Arabic', this.arabicFontPath);
        doc.registerFont('Arabic-Bold', this.arabicBoldFontPath || this.arabicFontPath);
        this.logger.log(`Arabic fonts registered: ${this.arabicFontPath}`);
      } catch (e) {
        this.logger.error(`Failed to register Arabic font: ${e}`);
        this.arabicFontPath = null;
        this.arabicBoldFontPath = null;
      }
    } else {
      this.logger.warn('No Arabic font available — Arabic text will use Helvetica (may show boxes).');
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

  /**
   * Process text for Arabic RTL rendering using centralized processor.
   */
  private processText(text: string, isRTL: boolean): string {
    return processPdfText(text || '', isRTL);
  }

  /**
   * Select appropriate font based on text content
   */
  private selectFontForText(
    doc: typeof PDFDocument,
    text: string,
    isBold: boolean,
    fonts: PdfFonts,
  ): void {
    if (containsArabic(text)) {
      try {
        const fontName = isBold ? 'Arabic-Bold' : 'Arabic';
        doc.font(fontName);
      } catch (e) {
        // Fallback to Helvetica if Arabic font not registered
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
      }
    } else {
      // ALWAYS use Helvetica for non-Arabic text (numbers, French, English)
      // This prevents empty squares when the Arabic font lacks Latin glyphs
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
    }
  }

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
    const companyName = this.processText(input.branding.companyName, isRTL);
    this.selectFontForText(doc, input.branding.companyName, true, fonts);
    doc
      .fontSize(14)
      .fillColor(theme.accentLight)
      .text(isRTL ? companyName : companyName.toUpperCase(), textX, logoY, {
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
    const titleText = titleMap[input.language || 'FR'] || titleMap.EN;
    const processedTitle = this.processText(titleText, isRTL);
    this.selectFontForText(doc, titleText, true, fonts);
    doc
      .fontSize(isRTL ? 38 : 44)
      .fillColor(theme.textWhite)
      .text(processedTitle, textX, titleY, {
        width: contentW * 0.7,
        align: textAlign,
      });

    // ──────── Subtitle ────────
    doc.moveDown(0.5);
    const subtitleMap: Record<string, string> = {
      FR: 'Financiere',
      AR: 'المالي',
      EN: 'Financial',
    };
    const subtitleText = subtitleMap[input.language || 'FR'] || subtitleMap.EN;
    const processedSubtitle = this.processText(subtitleText, isRTL);
    this.selectFontForText(doc, subtitleText, true, fonts);
    doc
      .fontSize(isRTL ? 38 : 44)
      .fillColor(theme.accent)
      .text(processedSubtitle, textX, doc.y, {
        width: contentW * 0.7,
        align: textAlign,
      });

    // ──────── Description Line ────────
    doc.moveDown(1.5);
    const descMap: Record<string, string> = {
      FR: 'Analyse strategique et performance financiere approfondie',
      AR: 'تحليل استراتيجي معمق للأداء المالي',
      EN: 'In-depth strategic analysis and financial performance review',
    };
    const descText = descMap[input.language || 'FR'] || descMap.EN;
    const processedDesc = this.processText(descText, isRTL);
    this.selectFontForText(doc, descText, false, fonts);
    doc
      .fontSize(12)
      .fillColor(theme.accentLight)
      .text(processedDesc, textX, doc.y, {
        width: contentW * 0.65,
        align: textAlign,
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

    this.selectFontForText(doc, dateLabel, false, fonts);
    doc.fontSize(10).fillColor(theme.textWhite)
      .text(this.processText(dateLabel, isRTL), textX, ph - 140, { width: contentW, align: textAlign });
    this.selectFontForText(doc, formattedDate, true, fonts);
    doc.fontSize(12).fillColor(theme.accentLight)
      .text(this.processText(formattedDate, isRTL), textX, ph - 125, { width: contentW, align: textAlign });

    // Report ID
    this.selectFontForText(doc, refLabel, false, fonts);
    doc.fontSize(10).fillColor(theme.textWhite)
      .text(this.processText(refLabel, isRTL), textX, ph - 100, { width: contentW, align: textAlign });
    doc.font(fonts.mono).fontSize(9).fillColor(theme.accentLight)
      .text(input.reportId.substring(0, 18), textX, ph - 85, { width: contentW, align: textAlign });

    // Confidential badge
    const badgeW = 180;
    const badgeX = isRTL ? leftMargin : pw - badgeW - leftMargin;
    const badgeY = ph - 145;
    doc.roundedRect(badgeX, badgeY, badgeW, 28, 4)
      .fillAndStroke(theme.primaryDark, theme.warning);
    const confLabel = input.language === 'AR' ? 'سري للغاية' : input.language === 'FR' ? 'STRICTEMENT CONFIDENTIEL' : 'STRICTLY CONFIDENTIAL';
    this.selectFontForText(doc, confLabel, true, fonts);
    doc.fontSize(9).fillColor(theme.warning)
      .text(this.processText(confLabel, isRTL), badgeX, badgeY + 9, {
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
    const processedTocLabel = this.processText(tocLabel, isRTL);
    this.selectFontForText(doc, tocLabel, true, fonts);
    doc
      .fontSize(10)
      .fillColor(theme.accent)
      .text(isRTL ? processedTocLabel : processedTocLabel.toUpperCase(), leftMargin, 80, {
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
      const processedTocTitle = this.processText(s.title, isRTL);
      this.selectFontForText(doc, s.title, false, fonts);
      doc.fontSize(12).fillColor(theme.textPrimary)
        .text(processedTocTitle, titleX, numY + 6, {
          width: titleW,
          align: textAlign,
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
      this.selectFontForText(doc, h, true, fonts);
      doc.fontSize(9).fillColor(theme.textWhite)
        .text(this.processText(h, isRTL), leftMargin + i * colWidth + 8, headerY + 8, {
          width: colWidth - 16,
          align: 'center',
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
        this.selectFontForText(doc, cell.text, false, fonts);
        doc.fontSize(9).fillColor(cell.color)
          .text(this.processText(cell.text, isRTL), leftMargin + i * colWidth + 8, rowY + 8, {
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

      this.selectFontForText(doc, input.branding.companyName, false, fonts);
      doc.fontSize(7.5).fillColor(theme.textMuted)
        .text(this.processText(input.branding.companyName, isRTL), leftMargin, 16, {
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
      this.selectFontForText(doc, confLabel, false, fonts);
      doc.fontSize(8).fillColor(theme.textMuted)
        .text(this.processText(confLabel, isRTL), leftMargin, footerY + 10, {
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
    // Always use Helvetica as the base fonts.
    // selectFontForText() will dynamically switch to Arabic font
    // when the text contains Arabic characters.
    // This prevents numbers and French/Latin text from showing as empty squares.
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
