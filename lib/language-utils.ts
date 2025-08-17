// Language detection and RTL/LTR utilities

export type TextDirection = 'ltr' | 'rtl';
export type Language = 'ar' | 'en' | 'fr' | 'mixed';

// Arabic Unicode ranges
const ARABIC_RANGES = [
  [0x0600, 0x06FF], // Arabic
  [0x0750, 0x077F], // Arabic Supplement
  [0x08A0, 0x08FF], // Arabic Extended-A
  [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
  [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
];

// Hebrew Unicode ranges (also RTL)
const HEBREW_RANGES = [
  [0x0590, 0x05FF], // Hebrew
];

// Function to check if a character is RTL
function isRTLCharacter(char: string): boolean {
  const code = char.charCodeAt(0);
  
  // Check Arabic ranges
  for (const [start, end] of ARABIC_RANGES) {
    if (code >= start && code <= end) return true;
  }
  
  // Check Hebrew ranges
  for (const [start, end] of HEBREW_RANGES) {
    if (code >= start && code <= end) return true;
  }
  
  return false;
}

// Function to check if a character is Latin (LTR)
function isLatinCharacter(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x0041 && code <= 0x005A) || // A-Z
    (code >= 0x0061 && code <= 0x007A) || // a-z
    (code >= 0x00C0 && code <= 0x00FF) || // Latin-1 Supplement
    (code >= 0x0100 && code <= 0x017F) || // Latin Extended-A
    (code >= 0x0180 && code <= 0x024F)    // Latin Extended-B
  );
}

// Detect the primary language of a text
export function detectLanguage(text: string): Language {
  if (!text || text.trim().length === 0) return 'en';
  
  let arabicCount = 0;
  let latinCount = 0;
  let totalLetters = 0;
  
  for (const char of text) {
    if (isRTLCharacter(char)) {
      arabicCount++;
      totalLetters++;
    } else if (isLatinCharacter(char)) {
      latinCount++;
      totalLetters++;
    }
  }
  
  if (totalLetters === 0) return 'en';
  
  const arabicPercentage = arabicCount / totalLetters;
  const latinPercentage = latinCount / totalLetters;
  
  if (arabicPercentage > 0.3) return 'ar';
  if (latinPercentage > 0.7) return 'en';
  if (arabicCount > 0 && latinCount > 0) return 'mixed';
  
  return 'en'; // Default fallback
}

// Detect text direction based on content
export function detectTextDirection(text: string): TextDirection {
  if (!text || text.trim().length === 0) return 'ltr';
  
  let rtlCount = 0;
  let ltrCount = 0;
  
  for (const char of text) {
    if (isRTLCharacter(char)) {
      rtlCount++;
    } else if (isLatinCharacter(char)) {
      ltrCount++;
    }
  }
  
  // If more than 20% of characters are RTL, use RTL direction
  const totalDirectionalChars = rtlCount + ltrCount;
  if (totalDirectionalChars === 0) return 'ltr';
  
  const rtlPercentage = rtlCount / totalDirectionalChars;
  return rtlPercentage > 0.2 ? 'rtl' : 'ltr';
}

// Get appropriate CSS classes for text direction
export function getDirectionClasses(text: string): string {
  const direction = detectTextDirection(text);
  const language = detectLanguage(text);
  
  const baseClasses = direction === 'rtl' 
    ? 'text-right dir-rtl' 
    : 'text-left dir-ltr';
  
  const languageClasses = {
    'ar': 'font-arabic leading-loose',
    'en': 'font-latin leading-normal', 
    'fr': 'font-latin leading-normal',
    'mixed': 'font-mixed leading-relaxed'
  };
  
  return `${baseClasses} ${languageClasses[language]}`;
}

// Get text alignment based on content
export function getTextAlignment(text: string): 'left' | 'right' | 'center' {
  const direction = detectTextDirection(text);
  return direction === 'rtl' ? 'right' : 'left';
}

// Get flex direction for chat layout
export function getChatAlignment(text: string, isUser: boolean = false): string {
  const direction = detectTextDirection(text);
  
  if (isUser) {
    return direction === 'rtl' ? 'flex-row' : 'flex-row-reverse';
  } else {
    return direction === 'rtl' ? 'flex-row-reverse' : 'flex-row';
  }
}

// Check if text is primarily Arabic
export function isArabicText(text: string): boolean {
  return detectLanguage(text) === 'ar';
}

// Check if text is primarily Latin
export function isLatinText(text: string): boolean {
  const lang = detectLanguage(text);
  return lang === 'en' || lang === 'fr';
}