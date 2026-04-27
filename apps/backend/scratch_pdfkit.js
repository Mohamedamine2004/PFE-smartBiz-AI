import PDFDocument from 'pdfkit';

const doc = new PDFDocument();
try {
  doc.rect(10, NaN, 10, 10);
  console.log("PDFKit: No error");
} catch (e) {
  console.error("PDFKit error:", e.message);
}
