import jsPDF from 'jspdf';

/**
 * Report generation utilities for PDF and Excel exports.
 */

interface DashboardMetrics {
  chartData: any[];
  strategicKpis: {
    cac: number;
    ltv: number;
    tam: number;
    marketShare: number;
    employeeCount: number;
  };
}

/**
 * Generate executive summary PDF report
 */
export const generateExecutiveSummary = async (
  companyName: string,
  metrics: DashboardMetrics,
  period: string,
): Promise<Blob> => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(24);
  doc.setTextColor(33, 33, 33);
  doc.text('Executive Summary', 105, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(companyName, 105, 40, { align: 'center' });
  doc.text(`Period: ${period}`, 105, 48, { align: 'center' });
  
  // Key Metrics Section
  doc.setFontSize(16);
  doc.setTextColor(33, 33, 33);
  doc.text('Key Performance Indicators', 14, 65);
  
  // KPI Table
  const kpiData = [
    ['Customer Acquisition Cost (CAC)', metrics.strategicKpis.cac ? `$${metrics.strategicKpis.cac.toLocaleString('en-US')}` : 'N/A'],
    ['Lifetime Value (LTV)', metrics.strategicKpis.ltv ? `$${metrics.strategicKpis.ltv.toLocaleString('en-US')}` : 'N/A'],
    ['LTV/CAC Ratio', (metrics.strategicKpis.ltv && metrics.strategicKpis.cac) ? (metrics.strategicKpis.ltv / metrics.strategicKpis.cac).toFixed(2) : 'N/A'],
    ['Total Addressable Market', metrics.strategicKpis.tam ? `$${metrics.strategicKpis.tam.toLocaleString('en-US')}` : 'N/A'],
    ['Market Share', metrics.strategicKpis.marketShare ? `${metrics.strategicKpis.marketShare}%` : 'N/A'],
  ];
  
  // Use autoTable if available, otherwise simple text
  if ((doc as any).autoTable) {
    (doc as any).autoTable({
      startY: 70,
      head: [['Metric', 'Value']],
      body: kpiData,
      theme: 'grid',
      styles: { fontSize: 11 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  } else {
    let y = 70;
    kpiData.forEach(([metric, value]) => {
      doc.setFontSize(11);
      doc.text(`${metric}: ${value}`, 14, y);
      y += 8;
    });
  }
  
  // Revenue Trend Section
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Revenue Trends', 14, 20);
  
  if (metrics.chartData && metrics.chartData.length > 0) {
    const revenueData = metrics.chartData.slice(-12).map(d => [
      d.period || d.month || 'N/A',
      d.revenue ? `$${d.revenue.toLocaleString('en-US')}` : 'N/A',
      d.expenses ? `$${d.expenses.toLocaleString('en-US')}` : 'N/A',
      d.cashflow ? `$${d.cashflow.toLocaleString('en-US')}` : 'N/A',
    ]);
    
    if ((doc as any).autoTable) {
      (doc as any).autoTable({
        startY: 25,
        head: [['Period', 'Revenue', 'Expenses', 'Cash Flow']],
        body: revenueData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94] },
      });
    }
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-US')} by SmartBiz AI`,
    105,
    doc.internal.pageSize.height - 10,
    { align: 'center' },
  );
  
  return doc.output('blob');
};

/**
 * Download PDF report
 */
export const downloadPDFReport = async (
  companyName: string,
  metrics: DashboardMetrics,
  period: string,
) => {
  const blob = await generateExecutiveSummary(companyName, metrics, period);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `executive-summary-${companyName}-${Date.now()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Export data to Excel (CSV format for simplicity)
 */
export const exportToExcel = async (
  metrics: DashboardMetrics,
  companyName: string,
) => {
  // Create CSV content
  let csv = 'Metric,Value\n';
  
  if (metrics.strategicKpis) {
    csv += `CAC,${metrics.strategicKpis.cac || 'N/A'}\n`;
    csv += `LTV,${metrics.strategicKpis.ltv || 'N/A'}\n`;
    csv += `TAM,${metrics.strategicKpis.tam || 'N/A'}\n`;
    csv += `Market Share,${metrics.strategicKpis.marketShare || 'N/A'}%\n`;
  }
  
  if (metrics.chartData && metrics.chartData.length > 0) {
    csv += '\nPeriod,Revenue,Expenses,Cash Flow\n';
    metrics.chartData.forEach(d => {
      csv += `${d.period || d.month},${d.revenue || 0},${d.expenses || 0},${d.cashflow || 0}\n`;
    });
  }
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${companyName}-metrics-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
