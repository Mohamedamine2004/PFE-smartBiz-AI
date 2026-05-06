import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PdfRenderOptions } from '../interfaces/report-content.types';
import { processPdfText, containsArabic as isArabicText } from './pdf-text-processor';

@Injectable()
export class PdfComponentsService {
  constructor() {}

  /**
   * Process text for Arabic RTL rendering.
   * Applies reshaping and word-order reversal so PDFKit displays Arabic correctly.
   */
  private processText(text: string, isRTL: boolean): string {
    return processPdfText(text, isRTL);
  }

  /**
   * Detect if text contains Arabic characters
   */
  private hasArabic(text: string): boolean {
    return isArabicText(text);
  }

  /**
   * Select appropriate font based on text content
   */
  private selectFontForText(
    doc: typeof PDFDocument,
    text: string,
    isBold: boolean,
    fonts: any,
  ): void {
    if (this.hasArabic(text)) {
      try {
        const fontName = isBold ? 'Arabic-Bold' : 'Arabic';
        doc.font(fontName);
      } catch (e) {
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
      }
    } else {
      // ALWAYS use Helvetica for non-Arabic text (numbers, French, English)
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
    }
  }

  /**
   * Draw a small section number badge above the section header.
   */
  drawSectionNumber(
    doc: typeof PDFDocument,
    num: number,
    options: PdfRenderOptions,
  ) {
    const { theme, fonts, leftMargin, contentW, isRTL } = options;
    const y = doc.y;
    const label = String(num).padStart(2, '0');

    // Position: RTL = right side, LTR = left side
    const pillX = isRTL ? leftMargin + contentW - 36 : leftMargin;
    doc.roundedRect(pillX, y, 36, 18, 9).fill(theme.accent);
    doc.font(fonts.heading).fontSize(9).fillColor(theme.textWhite)
      .text(label, pillX, y + 4, { width: 36, align: 'center' });

    doc.y = y + 26;
  }

  drawSectionHeader(
    doc: typeof PDFDocument,
    title: string,
    subtitle: string,
    options: PdfRenderOptions,
  ) {
    const { contentW, theme, fonts, leftMargin, isRTL } = options;
    const textAlign = isRTL ? 'right' as const : 'left' as const;

    this.checkPageBreak(doc, 100);

    const startY = doc.y;

    // Process title for Arabic RTL
    const processedTitle = this.processText(title, isRTL);

    // Section title - use smart font selection
    this.selectFontForText(doc, title, true, fonts);
    doc.fontSize(22).fillColor(theme.textPrimary)
      .text(processedTitle, leftMargin, startY, {
        width: contentW,
        align: textAlign,
      });

    if (subtitle) {
      doc.moveDown(0.3);
      const processedSubtitle = this.processText(subtitle, isRTL);
      this.selectFontForText(doc, subtitle, false, fonts);
      doc.fontSize(10).fillColor(theme.textMuted)
        .text(processedSubtitle, leftMargin, doc.y, {
          width: contentW,
          align: textAlign,
        });
    }

    // Accent underline (short, on the correct side)
    doc.moveDown(0.6);
    const accentX = isRTL ? leftMargin + contentW - 50 : leftMargin;
    doc.rect(accentX, doc.y, 50, 3).fill(theme.accent);
    doc.moveDown(1.2);
  }

  renderMarkdownContent(
    doc: typeof PDFDocument,
    text: string,
    options: PdfRenderOptions,
  ) {
    const { contentW, theme, fonts, leftMargin, isRTL } = options;
    const textAlign = isRTL ? 'right' as const : 'left' as const;

    // Strip only emoji and symbol characters that PDFKit can't render
    // Keep ALL text characters (Latin, Arabic, numbers, punctuation, math symbols)
    const cleanText = text.replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      '',
    );
    const lines = cleanText.split('\n');

    let inTable = false;
    let tableHeaders: string[] = [];
    let lastWasEmpty = false;
    let tableRowIndex = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        if (inTable) { inTable = false; tableRowIndex = 0; }
        if (!lastWasEmpty) { doc.moveDown(0.5); lastWasEmpty = true; }
        continue;
      }
      lastWasEmpty = false;

      // Horizontal Rules
      if (trimmed === '---' || trimmed === '***') {
        this.checkPageBreak(doc, 20);
        doc.moveDown(0.8);
        doc.moveTo(leftMargin + 40, doc.y).lineTo(leftMargin + contentW - 40, doc.y)
          .strokeColor(theme.borderLight).lineWidth(0.5).stroke();
        doc.moveDown(0.8);
        continue;
      }

      // ─── Tables ───
      if (trimmed.startsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRowIndex = 0;
          tableHeaders = trimmed.split('|').filter(c => c.trim() !== '').map(c => c.trim());
          this.drawTableRow(doc, tableHeaders, true, options, 0);
          tableRowIndex++;
          continue;
        }
        if (trimmed.includes('---')) continue;
        const cells = trimmed.split('|').filter(c => c.trim() !== '').map(c => c.trim());
        this.drawTableRow(doc, cells, false, options, tableRowIndex);
        tableRowIndex++;
        continue;
      }
      if (inTable) { inTable = false; tableRowIndex = 0; }

      // ─── Headings ───
      if (trimmed.startsWith('# ')) {
        this.checkPageBreak(doc, 80);
        const headingText = trimmed.replace(/^#\s+/, '').replace(/\*\*/g, '');
        const processedHeading = this.processText(headingText, isRTL);
        doc.moveDown(1.5);
        this.selectFontForText(doc, headingText, true, fonts);
        doc.fontSize(20).fillColor(theme.textPrimary)
          .text(processedHeading, leftMargin, doc.y, {
            width: contentW,
            align: textAlign,
          });
        doc.moveDown(0.3);
        const h1AccentX = isRTL ? leftMargin + contentW - 40 : leftMargin;
        doc.rect(h1AccentX, doc.y, 40, 2.5).fill(theme.accent);
        doc.moveDown(1);
        continue;
      }

      if (trimmed.startsWith('### ')) {
        this.checkPageBreak(doc, 40);
        const headingText = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '');
        const processedHeading = this.processText(headingText, isRTL);
        doc.moveDown(0.8);
        this.selectFontForText(doc, headingText, true, fonts);
        doc.fontSize(11).fillColor(theme.textSecondary)
          .text(processedHeading, leftMargin, doc.y, {
            width: contentW,
            align: textAlign,
          });
        doc.moveDown(0.4);
        continue;
      }

      if (trimmed.startsWith('## ')) {
        this.checkPageBreak(doc, 60);
        const headingText = trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '');
        const processedHeading = this.processText(headingText, isRTL);
        doc.moveDown(1);

        const h2y = doc.y;
        doc.rect(leftMargin, h2y - 4, contentW, 28).fill(theme.sectionBg);
        // Accent bar on correct side
        const barX = isRTL ? leftMargin + contentW - 3 : leftMargin;
        doc.rect(barX, h2y - 4, 3, 28).fill(theme.accent);

        const textPad = isRTL ? 0 : 14;
        this.selectFontForText(doc, headingText, true, fonts);
        doc.fontSize(13).fillColor(theme.primary)
          .text(processedHeading, leftMargin + textPad, h2y + 2, {
            width: contentW - 20,
            align: textAlign,
          });
        doc.moveDown(0.8);
        continue;
      }

      // ─── Blockquotes ───
      if (trimmed.startsWith('> ')) {
        this.checkPageBreak(doc, 30);
        const quoteText = trimmed.replace(/^>\s+/, '');
        const processedQuote = this.processText(quoteText.replace(/\*\*/g, ''), isRTL);
        const qy = doc.y;
        doc.rect(leftMargin, qy - 2, contentW, 24).fill(theme.highlightBg);
        const quoteBarX = isRTL ? leftMargin + contentW - 3 : leftMargin;
        doc.rect(quoteBarX, qy - 2, 3, 24).fill(theme.accent);
        this.selectFontForText(doc, quoteText, false, fonts);
        doc.fontSize(10).fillColor(theme.textSecondary)
          .text(processedQuote, leftMargin + 14, qy + 5, {
            width: contentW - 20,
            align: textAlign,
          });
        doc.moveDown(0.6);
        continue;
      }

      // ─── Lists ───
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        this.checkPageBreak(doc, 20);
        const itemText = trimmed.substring(2);
        this.renderFormattedText(doc, itemText, leftMargin + 18, contentW - 18, options, true);
        continue;
      }

      // ─── Numbered Lists ───
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        this.checkPageBreak(doc, 20);
        const num = numberedMatch[1];
        const itemText = numberedMatch[2];
        const y = doc.y;
        const numX = isRTL ? leftMargin + contentW - 18 : leftMargin;
        doc.font(fonts.heading).fontSize(10).fillColor(theme.accent)
          .text(`${num}.`, numX, y, { width: 18, align: isRTL ? 'right' : 'left' });
        doc.y = y;
        const textX = isRTL ? leftMargin : leftMargin + 18;
        this.renderFormattedText(doc, itemText, textX, contentW - 18, options);
        continue;
      }

      // ─── Normal Paragraphs ───
      this.checkPageBreak(doc, 20);
      this.renderFormattedText(doc, trimmed, leftMargin, contentW, options);
    }
  }

  // ─── Private Helpers ───

  private renderFormattedText(
    doc: typeof PDFDocument,
    text: string,
    x: number,
    w: number,
    options: PdfRenderOptions,
    isBullet = false,
  ) {
    const { theme, fonts, isRTL } = options;
    const y = doc.y;
    const textAlign = isRTL ? 'right' as const : 'left' as const;

    if (isBullet) {
      const bulletX = isRTL ? x + w + 4 : x - 8;
      doc.circle(bulletX, y + 6, 2.5).fill(theme.accent);
    }

    const parts = text.split(/(\*\*[^*]+\*\*)/);

    if (parts.length === 1) {
      // Process text for Arabic RTL
      const processedText = this.processText(text, isRTL);
      this.selectFontForText(doc, text, false, fonts);
      doc.fontSize(10.5).fillColor(theme.textPrimary)
        .text(processedText, x, y, {
          width: w,
          align: textAlign,
          lineGap: 3.5,
        });
    } else {
      const richText = parts.map(p => p.replace(/\*\*/g, '')).join('');
      const processedText = this.processText(richText, isRTL);
      const hasBold = parts.some(p => p.startsWith('**'));
      this.selectFontForText(doc, richText, hasBold, fonts);
      doc.fontSize(10.5).fillColor(theme.textPrimary)
        .text(processedText, x, y, {
          width: w,
          align: textAlign,
          lineGap: 3.5,
        });
    }

    doc.moveDown(0.3);
  }

  private drawTableRow(
    doc: typeof PDFDocument,
    cells: string[],
    isHeader: boolean,
    options: PdfRenderOptions,
    rowIndex: number,
  ) {
    const { contentW, theme, fonts, leftMargin, isRTL } = options;
    this.checkPageBreak(doc, 30);

    const rowY = doc.y;
    const rowHeight = 26;
    const colWidth = contentW / cells.length;

    // Row Background
    if (isHeader) {
      doc.rect(leftMargin, rowY, contentW, rowHeight).fill(theme.primary);
    } else {
      const bg = rowIndex % 2 === 0 ? theme.highlightBg : theme.pageBg;
      doc.rect(leftMargin, rowY, contentW, rowHeight).fill(bg);
    }

    doc.rect(leftMargin, rowY, contentW, rowHeight)
      .strokeColor(theme.borderLight).lineWidth(0.3).stroke();

    // For RTL, reverse the cell order
    const orderedCells = isRTL ? [...cells].reverse() : cells;

    orderedCells.forEach((cell, i) => {
      const cleanCell = cell.replace(/\*\*/g, '');
      const processedCell = this.processText(cleanCell, isRTL);
      const cellX = leftMargin + i * colWidth;
      this.selectFontForText(doc, cleanCell, isHeader, fonts);
      doc.fontSize(9)
        .fillColor(isHeader ? theme.textWhite : theme.textPrimary)
        .text(processedCell, cellX + 8, rowY + 8, {
          width: colWidth - 16,
          align: 'center',
          lineBreak: false,
        });

      if (i > 0) {
        doc.moveTo(cellX, rowY).lineTo(cellX, rowY + rowHeight)
          .strokeColor(isHeader ? theme.primaryLight : theme.borderLight)
          .lineWidth(0.3).stroke();
      }
    });

    doc.y = rowY + rowHeight;
  }

  private checkPageBreak(doc: typeof PDFDocument, requiredSpace: number) {
    if (doc.y + requiredSpace > doc.page.height - 72) {
      doc.addPage();
    }
  }
}
