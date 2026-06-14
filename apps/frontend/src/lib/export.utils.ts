import domtoimage from 'dom-to-image-more';
import jsPDF from 'jspdf';

export const EXPORT_REDIRECT = '/reports';

/**
 * Captures a DOM element as a pixel-perfect PNG and embeds it into a
 * PDF using dom-to-image-more + jsPDF. Preserves Tailwind v4 oklch/oklab
 * colors, gradients, custom fonts, and charts exactly as they appear.
 */
export const exportToPDF = async (
  elementId: string = 'dashboard-root-export',
  filename?: string,
): Promise<boolean> => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`[exportToPDF] Element #${elementId} not found.`);
    return false;
  }

  // 1. Show a premium full-screen loading overlay
  const overlay = document.createElement('div');
  overlay.id = '__pdf-export-overlay__';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '99999',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(6px)',
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    gap: '16px',
  });
  overlay.innerHTML = `
    <div style="position:relative; width:50px; height:50px;">
      <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg"
           style="animation:spin 1s linear infinite">
        <circle cx="25" cy="25" r="21" stroke="rgba(255,255,255,0.15)" stroke-width="4"/>
        <path d="M25 4 A21 21 0 0 1 46 25" stroke="#00D1FF" stroke-width="4" stroke-linecap="round"/>
      </svg>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    <span style="font-size:15px;font-weight:600;letter-spacing:.5px;color:#E2E8F0">SmartBiz AI — Generating Premium PDF Report…</span>`;
  document.body.appendChild(overlay);

  try {
    // 2. Capture using dom-to-image-more
    // Fetch computed background color dynamically
    const computedStyle = window.getComputedStyle(element);
    const bgColor = computedStyle.backgroundColor && computedStyle.backgroundColor !== 'transparent' && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
      ? computedStyle.backgroundColor 
      : '#0b0f19'; // fallback to dashboard premium dark cockpit bg

    const dataUrl = await domtoimage.toPng(element, {
      quality: 1,
      bgcolor: bgColor,
      style: {
        transform: 'none',
        borderRadius: '0',
      },
    });

    // 3. Build landscape A4 PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const img = new Image();
    img.src = dataUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const pdfW = 297; // A4 landscape width
    const pdfH = 210; // A4 landscape height
    
    const ratio = img.width / img.height;
    const imgH = pdfW / ratio;

    let yOffset = 0;
    let remaining = imgH;
    let isFirstPage = true;

    while (remaining > 0) {
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      pdf.addImage(dataUrl, 'PNG', 0, -yOffset, pdfW, imgH, undefined, 'FAST');
      yOffset += pdfH;
      remaining -= pdfH;
    }

    const defaultName = `SmartBiz-Dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename || defaultName);

    return true;
  } catch (err) {
    console.error('[exportToPDF] Export failed:', err);
    return false;
  } finally {
    overlay.remove();
  }
};

/**
 * Capture utility for single element PNG downloads using dom-to-image-more.
 */
export const exportChartsAsImage = async (
  elementId: string,
  filename?: string,
): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) return false;

    const dataUrl = await domtoimage.toPng(element, {
      quality: 1,
      bgcolor: 'transparent',
    });

    const link = document.createElement('a');
    link.download = filename || `chart-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    return true;
  } catch (error) {
    console.error('[exportChartsAsImage] Export failed:', error);
    return false;
  }
};