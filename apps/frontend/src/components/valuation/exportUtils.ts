import type { ValuationResult } from '../../types/valuation';

/* ─── PDF Export ────────────────────────────────── */

export function exportPDF(
  result: ValuationResult,
  labels: {
    title: string;
    ev: string;
    equity: string;
    formula: string;
    explanation: string;
    inputs: string;
    generatedOn: string;
  },
) {
  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TND',
      maximumFractionDigits: 0,
    }).format(v);

  const date = new Date().toLocaleDateString();
  const methodName = result.method.replace(/_/g, ' / ');

  const inputRows = Object.entries(result.inputs)
    .map(
      ([k, v]) =>
        `<tr>
          <td class="input-label">${k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</td>
          <td class="input-value">${v.toLocaleString()}</td>
        </tr>`,
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${labels.title} — ${methodName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      color: #1e293b;
      padding: 48px;
      max-width: 800px;
      margin: auto;
      background: #fff;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #009E87;
      padding-bottom: 20px;
      margin-bottom: 32px;
    }
    .header-left h1 {
      font-size: 24px;
      font-weight: 700;
      color: #009E87;
      letter-spacing: -0.3px;
    }
    .header-left .method-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      background: #009E870F;
      border: 1px solid #009E8730;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      color: #009E87;
      letter-spacing: 0.3px;
    }
    .header-right {
      text-align: right;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .header-right .logo {
      font-weight: 700;
      font-size: 13px;
      color: #009E87;
    }

    /* ── Value Cards ── */
    .values {
      display: flex;
      gap: 16px;
      margin-bottom: 28px;
    }
    .value-card {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
      position: relative;
      overflow: hidden;
    }
    .value-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #009E87, #00D4B4);
    }
    .value-card.equity::before {
      background: linear-gradient(90deg, #6366f1, #818cf8);
    }
    .value-card .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .value-card .amount {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    /* ── Sections ── */
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f1f5f9;
    }
    .formula-box {
      font-family: 'Courier New', monospace;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      padding: 16px 20px;
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.6;
      color: #334155;
      border: 1px solid #e2e8f0;
    }
    .explanation-text {
      font-size: 14px;
      line-height: 1.7;
      color: #475569;
    }

    /* ── Inputs Table ── */
    .inputs-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }
    .inputs-table tr:not(:last-child) td {
      border-bottom: 1px solid #f1f5f9;
    }
    .inputs-table .input-label {
      padding: 12px 16px;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
      width: 50%;
      background: #fafbfc;
    }
    .inputs-table .input-value {
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
    }
    .footer .brand { font-weight: 600; color: #009E87; }

    @media print {
      body { padding: 24px; }
      .value-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${labels.title}</h1>
      <span class="method-badge">${methodName}</span>
    </div>
    <div class="header-right">
      <div class="logo">SmartBiz AI</div>
      <div>${labels.generatedOn}: ${date}</div>
    </div>
  </div>

  <div class="values">
    ${
      result.enterpriseValue !== null
        ? `<div class="value-card">
            <div class="label">${labels.ev}</div>
            <div class="amount">${fmtCurrency(result.enterpriseValue)}</div>
          </div>`
        : ''
    }
    <div class="value-card equity">
      <div class="label">${labels.equity}</div>
      <div class="amount">${fmtCurrency(result.equityValue)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${labels.formula}</div>
    <div class="formula-box">${result.formula}</div>
  </div>

  <div class="section">
    <div class="section-title">${labels.explanation}</div>
    <p class="explanation-text">${result.explanation}</p>
  </div>

  <div class="section">
    <div class="section-title">${labels.inputs}</div>
    <table class="inputs-table">
      <tbody>${inputRows}</tbody>
    </table>
  </div>

  <div class="footer">
    <span><span class="brand">SmartBiz AI</span> — ${labels.title}</span>
    <span>${date}</span>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 400);
}
