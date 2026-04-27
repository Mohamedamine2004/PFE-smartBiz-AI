import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PdfRenderOptions } from '../interfaces/report-content.types';

@Injectable()
export class PdfChartDrawer {
  private readonly logger = new Logger(PdfChartDrawer.name);

  // ─── Public Chart Methods ───

  async drawBarChart(
    doc: typeof PDFDocument,
    data: { label: string; value: number }[],
    options: PdfRenderOptions & { x: number; y: number; width: number; height: number; title: string },
  ) {
    const { x, y, width, height, title, theme, fonts, isRTL } = options;
    this.drawChartContainer(doc, x, y, width, height, title, theme, fonts, isRTL);

    if (data.length === 0 || data.every(d => d.value === 0)) {
      this.drawNoData(doc, x, y, height, theme, fonts, isRTL);
      return;
    }

    // For RTL, mirror the Y-axis to the right side
    const yAxisSide = isRTL ? 'right' : 'left';
    const chartX = isRTL ? x + 20 : x + 55;
    const chartY = y + 40;
    const chartW = width - 75;
    const chartH = height - 65;

    const validVals = data.map(d => Math.abs(d.value)).filter(v => !isNaN(v));
    const maxVal = validVals.length > 0 ? Math.max(...validVals) : 0;
    const barW = Math.min(36, (chartW / data.length) - 10);

    // Y-axis gridlines & labels
    for (let i = 0; i <= 4; i++) {
      const lineY = chartY + chartH - (i / 4) * (chartH - 10);
      const val = (maxVal * i) / 4;
      doc.moveTo(chartX, lineY).lineTo(chartX + chartW, lineY)
        .strokeColor(theme.borderLight).lineWidth(0.3).dash(3, { space: 4 }).stroke();
      doc.undash();
      const labelX = isRTL ? x + width - 50 : x + 4;
      doc.font(fonts.mono).fontSize(7).fillColor(theme.textMuted)
        .text(this.formatValue(val), labelX, lineY - 4, { width: 46, align: isRTL ? 'left' : 'right' });
    }

    // Axes
    const axisX = isRTL ? chartX + chartW : chartX;
    doc.moveTo(axisX, chartY).lineTo(axisX, chartY + chartH).strokeColor(theme.borderMedium).lineWidth(0.5).stroke();
    doc.moveTo(chartX, chartY + chartH).lineTo(chartX + chartW, chartY + chartH).stroke();

    // Bars (reverse order for RTL)
    const orderedData = isRTL ? [...data].reverse() : data;
    orderedData.forEach((d, i) => {
      const barH = maxVal > 0 ? (Math.abs(d.value) / maxVal) * (chartH - 10) : 0;
      const barLeft = chartX + i * (chartW / data.length) + (chartW / data.length - barW) / 2;
      const barTop = chartY + chartH - barH;
      const color = d.value >= 0 ? theme.accent : theme.danger;

      // Shadow
      doc.save();
      doc.roundedRect(barLeft + 2, barTop + 2, barW, barH, 3).fillOpacity(0.08).fillColor('#000000').fill();
      doc.restore();

      // Main bar
      doc.roundedRect(barLeft, barTop, barW, barH, 3).fill(color);

      // Highlight
      if (barH > 8) {
        doc.save();
        doc.roundedRect(barLeft + 1, barTop, barW - 2, Math.min(barH * 0.3, 15), 2)
          .fillOpacity(0.2).fillColor('#FFFFFF').fill();
        doc.restore();
      }

      // Label
      doc.font(fonts.mono).fontSize(7).fillColor(theme.textMuted)
        .text(this.truncate(d.label, 8), barLeft - 4, chartY + chartH + 6, { width: barW + 8, align: 'center' });

      // Value
      if (barH > 18) {
        doc.font(fonts.heading).fontSize(7).fillColor(theme.textWhite)
          .text(this.formatValue(d.value), barLeft, barTop + 4, { width: barW, align: 'center' });
      }
    });
  }

  async drawLineChart(
    doc: typeof PDFDocument,
    data: { label: string; value: number }[],
    options: PdfRenderOptions & { x: number; y: number; width: number; height: number; title: string; isArea?: boolean },
  ) {
    const { x, y, width, height, title, theme, fonts, isArea, isRTL } = options;
    this.drawChartContainer(doc, x, y, width, height, title, theme, fonts, isRTL);

    if (data.length === 0) {
      this.drawNoData(doc, x, y, height, theme, fonts, isRTL);
      return;
    }

    const chartX = isRTL ? x + 20 : x + 55;
    const chartY = y + 40;
    const chartW = width - 75;
    const chartH = height - 65;

    const validVals = data.map(d => d.value).filter(v => !isNaN(v));
    const maxVal = validVals.length > 0 ? Math.max(...validVals) : 0;
    const minVal = validVals.length > 0 ? Math.min(...validVals) : 0;
    const range = maxVal - minVal || 1;

    const toPixel = (val: number) => chartY + chartH - ((val - minVal) / range) * (chartH - 10);
    // For RTL, reverse the X direction
    const toX = (i: number) => {
      if (data.length <= 1) return chartX + chartW / 2;
      const ratio = i / (data.length - 1);
      return isRTL
        ? chartX + chartW - ratio * chartW
        : chartX + ratio * chartW;
    };

    // Gridlines
    for (let i = 0; i <= 4; i++) {
      const lineY = chartY + chartH - (i / 4) * (chartH - 10);
      const val = minVal + (range * i) / 4;
      doc.moveTo(chartX, lineY).lineTo(chartX + chartW, lineY)
        .strokeColor(theme.borderLight).lineWidth(0.3).dash(3, { space: 4 }).stroke();
      doc.undash();
      const labelX = isRTL ? x + width - 50 : x + 4;
      doc.font(fonts.mono).fontSize(7).fillColor(theme.textMuted)
        .text(this.formatValue(val), labelX, lineY - 4, { width: 46, align: isRTL ? 'left' : 'right' });
    }

    // Axes
    const axisX = isRTL ? chartX + chartW : chartX;
    doc.moveTo(axisX, chartY).lineTo(axisX, chartY + chartH).strokeColor(theme.borderMedium).lineWidth(0.5).stroke();
    doc.moveTo(chartX, chartY + chartH).lineTo(chartX + chartW, chartY + chartH).stroke();

    // Area fill
    if (isArea && data.length > 1) {
      doc.save();
      doc.moveTo(toX(0), chartY + chartH);
      data.forEach((d, i) => { doc.lineTo(toX(i), toPixel(d.value)); });
      doc.lineTo(toX(data.length - 1), chartY + chartH);
      doc.closePath().fillOpacity(0.15).fillColor(theme.accent).fill();
      doc.restore();
    }

    // Line
    if (data.length > 1) {
      doc.moveTo(toX(0), toPixel(data[0].value));
      data.slice(1).forEach((d, i) => doc.lineTo(toX(i + 1), toPixel(d.value)));
      doc.strokeColor(theme.accent).lineWidth(2.5).stroke();
    }

    // Points & labels
    data.forEach((d, i) => {
      const px = toX(i);
      const py = toPixel(d.value);

      doc.save();
      doc.circle(px, py, 6).fillOpacity(0.15).fillColor(theme.accent).fill();
      doc.restore();

      doc.circle(px, py, 3.5).fillColor('#ffffff').fill();
      doc.circle(px, py, 3.5).strokeColor(theme.accent).lineWidth(2).stroke();

      if (i === 0 || i === data.length - 1 || i % Math.max(1, Math.floor(data.length / 5)) === 0) {
        doc.font(fonts.mono).fontSize(7).fillColor(theme.textMuted)
          .text(this.truncate(d.label, 8), px - 18, chartY + chartH + 6, { width: 36, align: 'center' });
      }
    });
  }

  async drawDualAxisChart(
    doc: typeof PDFDocument,
    chartData: any,
    options: PdfRenderOptions & { x: number; y: number; width: number; height: number; title: string },
  ) {
    const { x, y, width, height, title, theme, fonts, isRTL } = options;
    this.drawChartContainer(doc, x, y, width, height, title, theme, fonts, isRTL);

    const primary = chartData?.series || [];
    const secondary = chartData?.compareSeries || [];

    if (primary.length === 0) {
      this.drawNoData(doc, x, y, height, theme, fonts, isRTL);
      return;
    }

    const chartX = isRTL ? x + 55 : x + 55;
    const chartY = y + 40;
    const chartW = width - 110;
    const chartH = height - 65;

    const barW = Math.min(28, (chartW / primary.length) - 8);
    const primaryVals = primary.map((d: any) => Math.abs(d.value)).filter((v: number) => !isNaN(v));
    const maxBar = primaryVals.length > 0 ? Math.max(...primaryVals, 1) : 1;
    const secondaryVals = secondary.map((d: any) => Math.abs(d.value)).filter((v: number) => !isNaN(v));
    const maxLine = secondaryVals.length > 0 ? Math.max(...secondaryVals, 1) : 1;

    // Gridlines
    for (let i = 0; i <= 4; i++) {
      const lineY = chartY + chartH - (i / 4) * (chartH - 10);
      doc.moveTo(chartX, lineY).lineTo(chartX + chartW, lineY)
        .strokeColor(theme.borderLight).lineWidth(0.3).dash(3, { space: 4 }).stroke();
      doc.undash();
      const val = (maxBar * i) / 4;
      const labelX = isRTL ? x + width - 52 : x + 4;
      doc.font(fonts.mono).fontSize(7).fillColor(theme.textMuted)
        .text(this.formatValue(val), labelX, lineY - 4, { width: 46, align: isRTL ? 'left' : 'right' });
    }

    // Bars (reverse for RTL)
    const orderedPrimary = isRTL ? [...primary].reverse() : primary;
    orderedPrimary.forEach((d: any, i: number) => {
      const barH = (Math.abs(d.value) / maxBar) * (chartH - 10);
      const barLeft = chartX + i * (chartW / primary.length) + (chartW / primary.length - barW) / 2;
      const barTop = chartY + chartH - barH;

      doc.save();
      doc.roundedRect(barLeft + 1, barTop + 1, barW, barH, 2).fillOpacity(0.06).fillColor('#000000').fill();
      doc.restore();

      doc.roundedRect(barLeft, barTop, barW, barH, 2).fill(theme.accent);
      doc.font(fonts.mono).fontSize(7).fillColor(theme.textMuted)
        .text(this.truncate(d.label, 8), barLeft - 4, chartY + chartH + 6, { width: barW + 8, align: 'center' });
    });

    // Line (secondary) — reversed X for RTL
    if (secondary.length > 1) {
      const orderedSecondary = isRTL ? [...secondary].reverse() : secondary;
      const toX = (i: number) => chartX + (i / (orderedSecondary.length - 1)) * chartW;
      const toY = (val: number) => chartY + chartH - (Math.abs(val) / maxLine) * (chartH - 10);

      doc.moveTo(toX(0), toY(orderedSecondary[0].value));
      orderedSecondary.slice(1).forEach((d: any, i: number) => doc.lineTo(toX(i + 1), toY(d.value)));
      doc.strokeColor(theme.success).lineWidth(2.5).stroke();

      orderedSecondary.forEach((d: any, i: number) => {
        doc.circle(toX(i), toY(d.value), 3.5).fillColor('#fff').fill();
        doc.circle(toX(i), toY(d.value), 3.5).strokeColor(theme.success).lineWidth(2).stroke();
      });

      // Secondary axis labels (on opposite side)
      for (let i = 0; i <= 4; i++) {
        const lineY = chartY + chartH - (i / 4) * (chartH - 10);
        const val = (maxLine * i) / 4;
        const labelX = isRTL ? x + 4 : x + width - 52;
        doc.font(fonts.mono).fontSize(7).fillColor(theme.success)
          .text(this.formatValue(val), labelX, lineY - 4, { width: 46, align: isRTL ? 'right' : 'left' });
      }
    }

    // Axes
    const axisX = isRTL ? chartX + chartW : chartX;
    doc.moveTo(axisX, chartY).lineTo(axisX, chartY + chartH).strokeColor(theme.borderMedium).lineWidth(0.5).stroke();
    doc.moveTo(chartX, chartY + chartH).lineTo(chartX + chartW, chartY + chartH).stroke();

    // Legend
    const legendY = y + height - 20;
    doc.roundedRect(chartX, legendY, 10, 10, 2).fill(theme.accent);
    doc.font(fonts.body).fontSize(7.5).fillColor(theme.textSecondary)
      .text(chartData?.metricName || 'Primary', chartX + 14, legendY + 1);
    if (secondary.length > 0) {
      doc.roundedRect(chartX + 90, legendY, 10, 10, 2).fill(theme.success);
      doc.font(fonts.body).fontSize(7.5).fillColor(theme.textSecondary)
        .text('Comparison', chartX + 104, legendY + 1);
    }
  }

  // ─── Private Helpers ───

  private drawChartContainer(
    doc: typeof PDFDocument,
    x: number, y: number, w: number, h: number,
    title: string, theme: any, fonts: any, isRTL: boolean,
  ) {
    doc.save();
    doc.roundedRect(x + 2, y + 2, w, h, 8).fillOpacity(0.04).fillColor('#000000').fill();
    doc.restore();

    doc.roundedRect(x, y, w, h, 8).fill(theme.pageBg);
    doc.roundedRect(x, y, w, h, 8).strokeColor(theme.borderLight).lineWidth(0.5).stroke();

    // Title with accent dot (mirrored for RTL)
    const dotX = isRTL ? x + w - 22 : x + 18;
    doc.circle(dotX, y + 18, 4).fill(theme.accent);

    const titleX = isRTL ? x + 12 : x + 28;
    const titleW = w - 40;
    doc.font(fonts.heading).fontSize(10).fillColor(theme.textPrimary)
      .text(title, titleX, y + 12, {
        width: titleW,
        align: isRTL ? 'right' : 'left',
        features: isRTL ? ['rtla'] : undefined,
      });
  }

  private drawNoData(
    doc: typeof PDFDocument,
    x: number, y: number, h: number,
    theme: any, fonts: any, isRTL: boolean,
  ) {
    const msg = isRTL ? 'بيانات غير كافية لإنشاء هذا الرسم البياني.' : 'Donnees insuffisantes pour generer ce graphique.';
    doc.font(fonts.body).fontSize(10).fillColor(theme.textMuted)
      .text(msg, x + 20, y + h / 2 - 8, { features: isRTL ? ['rtla'] : undefined });
  }

  private truncate(s: string, maxLen: number): string {
    return s.length > maxLen ? s.slice(0, maxLen - 1) + '...' : s;
  }

  private formatValue(val: number): string {
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000) return (val / 1_000).toFixed(1) + 'K';
    return val.toFixed(0);
  }
}
