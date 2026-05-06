const PDFDocument = require('pdfkit');
const fs = require('fs');
const ArabicReshaper = require('arabic-reshaper');
const bidiFactory = require('bidi-js');
const bidi = bidiFactory();

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test_arabic.pdf'));

const fontPath = '/usr/src/app/fonts/NotoSansArabic-Regular.ttf'; 
// if running inside container, but I am running outside, I will just use a font from the system or skip font loading and rely on default.
// Wait, I am running inside the backend folder, maybe the font is in `../../fonts` or similar? Let's check `PdfCoreService` to see where it finds fonts.
// `path.resolve('/usr/src/app/fonts')` means it's an absolute path inside docker.
// I will not test font loading, just verify that `pdf-components.service.ts` can import bidi and reshaper correctly.
