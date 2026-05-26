import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const EXPORT_REDIRECT = '/reports';

/**
 * Exports a DOM element as PDF using html2canvas + jsPDF.
 * @param elementId - The ID of the DOM element to capture
 * @param filename - Optional filename for the PDF (default: dashboard-export)
 */
export const exportToPDF = async (
  elementId: string = 'dashboard-root-export',
  filename?: string,
): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      console.error(`Element with id "${elementId}" not found`);
      return false;
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Calculate PDF dimensions (A4 format)
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Handle multi-page if content is longer than one page
    let heightLeft = imgHeight - pageHeight;
    let position = -pageHeight;
    
    while (heightLeft > 0) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;
    }

    // Generate filename with date
    const defaultFilename = `SmartBiz-Dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename || defaultFilename);
    
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    return false;
  }
};

/**
 * Export utility for capturing dashboard charts as image.
 * This provides a fallback for charts that may not render well in canvas.
 */
export const exportChartsAsImage = async (
  elementId: string,
  filename?: string,
): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      return false;
    }

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = filename || `chart-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    return true;
  } catch (error) {
    console.error('Image export failed:', error);
    return false;
  }
};