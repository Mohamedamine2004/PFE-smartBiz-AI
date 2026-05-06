/**
 * PDF Text Processor for Arabic/RTL text rendering in PDFKit.
 *
 * PDFKit always lays out text left-to-right. To render Arabic correctly we:
 * 1. Reverse the word order so PDFKit draws them in correct RTL visual order.
 * 2. Let the Arabic font (NotoSansArabic) handle character shaping natively
 *    via its built-in OpenType GSUB tables — NO manual reshaping needed.
 *
 * We do NOT use arabic-reshaper because:
 * - It converts characters to Presentation Forms (U+FE70+) which conflict
 *   with fonts that already have OpenType Arabic shaping.
 * - It merges adjacent words, eating the spaces between them.
 * - NotoSansArabic handles joining/shaping correctly on its own.
 */

// ─── Arabic detection ────────────────────────────────────────────────

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Detects if a string contains Arabic characters.
 */
export function containsArabic(text: string): boolean {
  if (!text) return false;
  return ARABIC_REGEX.test(text);
}

// ─── Main entry point ────────────────────────────────────────────────

/**
 * Process text for correct Arabic rendering in PDFKit.
 *
 * Strategy:
 *  - Split text into lines.
 *  - For each line containing Arabic: reverse word order so PDFKit
 *    (which is LTR-only) renders them in the correct RTL visual order
 *    when right-aligned.
 *  - Lines without Arabic are returned unchanged.
 */
export function processPdfText(text: string, isRTL: boolean): string {
  if (!text || typeof text !== 'string') return text;
  if (!isRTL) return text;
  if (!containsArabic(text)) return text;

  const lines = text.split('\n');
  const processedLines = lines.map((line) => {
    if (!containsArabic(line)) return line;
    return reverseWordsForRTL(line);
  });

  return processedLines.join('\n');
}

/**
 * Reverse word order in a line for RTL visual rendering in PDFKit.
 *
 * PDFKit draws text left-to-right. By reversing the words, the first
 * visual word (which should appear on the right in Arabic) is drawn
 * first by PDFKit when using align:'right'.
 *
 * Spaces between words are preserved.
 */
function reverseWordsForRTL(line: string): string {
  // Split into word and whitespace tokens, preserving all spaces
  const tokens = line.split(/(\s+)/);
  // Reverse the token array (words + spaces swap positions)
  const reversed = tokens.reverse().join('');
  return reversed;
}

/**
 * Segments text into Arabic vs non-Arabic parts.
 * Used when we need to apply different fonts to different parts of mixed text.
 */
export function segmentMixedText(
  text: string,
): Array<{ text: string; isArabic: boolean }> {
  const segments: Array<{ text: string; isArabic: boolean }> = [];
  if (!text) return segments;

  // Group consecutive Arabic characters (and spaces between them) together,
  // and consecutive non-Arabic characters together
  const parts = text.match(
    /(?:[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF][^\x00-\x7F]*(?:\s+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF][^\x00-\x7F]*)*)|(?:[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)/g,
  );

  if (!parts) return [{ text, isArabic: false }];

  for (const part of parts) {
    segments.push({ text: part, isArabic: containsArabic(part) });
  }

  return segments;
}
