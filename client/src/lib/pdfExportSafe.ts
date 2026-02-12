/**
 * PDF Export Safe Utility
 * 
 * This utility solves the OKLCH color parsing error in html2canvas by:
 * 1. Cloning the DOM element to be exported
 * 2. Converting all computed OKLCH colors to RGB/HEX
 * 3. Injecting sanitized inline styles
 * 4. Returning a safe clone for PDF rendering
 * 
 * The live app keeps OKLCH colors, but PDF export receives only RGB/HEX.
 */

/**
 * Convert OKLCH color to RGB
 * Based on OKLCH color space conversion formulas
 */
function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  // Convert OKLCH to OKLAB
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  // Convert OKLAB to linear RGB
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let b_rgb = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  // Apply gamma correction (linear to sRGB)
  const gammaCorrect = (val: number) => {
    if (val <= 0.0031308) {
      return 12.92 * val;
    } else {
      return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
    }
  };

  r = gammaCorrect(r);
  g = gammaCorrect(g);
  b_rgb = gammaCorrect(b_rgb);

  // Clamp to 0-255
  r = Math.max(0, Math.min(255, Math.round(r * 255)));
  g = Math.max(0, Math.min(255, Math.round(g * 255)));
  b_rgb = Math.max(0, Math.min(255, Math.round(b_rgb * 255)));

  return { r, g, b: b_rgb };
}

/**
 * Parse OKLCH color string and convert to RGB hex
 */
function parseOklchToHex(oklchString: string): string | null {
  // Match oklch(l c h) or oklch(l c h / alpha)
  const match = oklchString.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/);
  
  if (!match) {
    return null;
  }

  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);
  const alpha = match[4] ? parseFloat(match[4]) : 1;

  const { r, g, b } = oklchToRgb(l, c, h);

  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Convert to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert any color value to a safe format (RGB/HEX)
 * If it's OKLCH, convert it. Otherwise, return as-is.
 */
function convertColorToSafe(colorValue: string): string {
  if (!colorValue || typeof colorValue !== 'string') {
    return colorValue;
  }

  // If it contains oklch, convert it
  if (colorValue.includes('oklch(')) {
    const converted = parseOklchToHex(colorValue);
    return converted || colorValue;
  }

  return colorValue;
}

/**
 * Properties that may contain color values
 */
const COLOR_PROPERTIES = [
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'columnRuleColor',
  'fill',
  'stroke',
  'caretColor',
  'boxShadow',
  'textShadow',
];

/**
 * Sanitize an element by converting all OKLCH colors in computed styles to RGB/HEX
 */
function sanitizeElement(element: HTMLElement): void {
  const computedStyle = window.getComputedStyle(element);

  // Convert each color property
  for (const prop of COLOR_PROPERTIES) {
    const value = computedStyle.getPropertyValue(prop);
    if (value && value.includes('oklch(')) {
      const safeValue = convertColorToSafe(value);
      element.style.setProperty(prop, safeValue, 'important');
    }
  }

  // Also check for CSS variables that might contain OKLCH
  for (let i = 0; i < computedStyle.length; i++) {
    const propName = computedStyle[i];
    if (propName.startsWith('--')) {
      const value = computedStyle.getPropertyValue(propName);
      if (value && value.includes('oklch(')) {
        const safeValue = convertColorToSafe(value);
        element.style.setProperty(propName, safeValue, 'important');
      }
    }
  }
}

/**
 * Recursively sanitize an element and all its children
 */
function sanitizeElementRecursive(element: HTMLElement): void {
  sanitizeElement(element);

  // Sanitize all children
  const children = element.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child instanceof HTMLElement) {
      sanitizeElementRecursive(child);
    }
  }
}

/**
 * Create a safe clone of an element for PDF export
 * This clone has all OKLCH colors converted to RGB/HEX
 * 
 * @param element - The element to clone and sanitize
 * @returns A sanitized clone safe for html2canvas
 */
export function createPdfSafeClone(element: HTMLElement): HTMLElement {
  // Deep clone the element
  const clone = element.cloneNode(true) as HTMLElement;

  // Make the clone invisible and append to body temporarily
  // (needed for getComputedStyle to work)
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '-9999px';
  document.body.appendChild(clone);

  try {
    // Sanitize all OKLCH colors in the clone
    sanitizeElementRecursive(clone);
  } catch (error) {
    console.error('Error sanitizing clone:', error);
  }

  return clone;
}

/**
 * Clean up a PDF-safe clone
 * @param clone - The clone to remove
 */
export function cleanupPdfSafeClone(clone: HTMLElement): void {
  if (clone && clone.parentNode) {
    clone.parentNode.removeChild(clone);
  }
}

/**
 * Log computed styles to verify no OKLCH remains
 * @param element - Element to check
 */
export function verifyNoOklch(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  let hasOklch = false;

  // Check all properties
  for (let i = 0; i < computedStyle.length; i++) {
    const propName = computedStyle[i];
    const value = computedStyle.getPropertyValue(propName);
    if (value && value.includes('oklch(')) {
      console.warn(`OKLCH found in ${propName}:`, value);
      hasOklch = true;
    }
  }

  // Check children
  const children = element.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child instanceof HTMLElement) {
      if (verifyNoOklch(child)) {
        hasOklch = true;
      }
    }
  }

  return hasOklch;
}
