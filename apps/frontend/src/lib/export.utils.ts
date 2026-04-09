import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Captures an HTML element by ID and triggers a download of a PDF file.
 * Automatically scales the document to A4 format holding the aspect ratio.
 */
export const exportToPDF = async (elementId: string, filename: string = 'dashboard-export.pdf') => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Export failed: Element with id '${elementId}' not found.`);
    alert('Export failed: Snapshot area not found.');
    return false;
  }

  try {
    // Determine high density resolution for print clarity
    const scale = 2; // retina display sharpness
    
    const imgData = await htmlToImage.toPng(element, {
      quality: 1,
      pixelRatio: scale,
      backgroundColor: '#ffffff', // Ensures no transparency conflicts
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      },
      // html-to-image natively supports ignoring unparsable CSS (like oklab fallback issues)
    });
    
    // Create an upright (portrait) A4 document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    // Create an Image context to safely extract height relative to width
    const img = new Image();
    img.src = imgData;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const pdfHeight = (img.height * pdfWidth) / img.width;
    
    // Embed the snapshot into the generated PDF safely
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    pdf.save(filename);
    return true;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('PDF export failed:', error);
    alert(`Export failed: ${errorMsg}`);
    return false;
  }
};
