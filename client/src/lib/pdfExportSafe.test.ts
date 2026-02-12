/**
 * Tests for PDF Export Safe Utility
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('OKLCH to RGB Conversion', () => {
  let testElement: HTMLElement;

  beforeEach(() => {
    // Create a test element with OKLCH colors
    testElement = document.createElement('div');
    testElement.style.setProperty('--primary', 'oklch(0.45 0.15 250)');
    testElement.style.setProperty('--background', 'oklch(0.99 0 0)');
    testElement.style.color = 'oklch(0 0 0)';
    testElement.style.backgroundColor = 'oklch(0.99 0 0)';
    testElement.textContent = 'Test Element';
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    if (testElement && testElement.parentNode) {
      testElement.parentNode.removeChild(testElement);
    }
  });

  it('should convert OKLCH colors in computed styles to RGB/HEX', async () => {
    // Import the utility dynamically to avoid issues with DOM in Node environment
    const { createPdfSafeClone, cleanupPdfSafeClone, verifyNoOklch } = await import('./pdfExportSafe');

    // Create a safe clone
    const safeClone = createPdfSafeClone(testElement);

    // Verify no OKLCH remains
    const hasOklch = verifyNoOklch(safeClone);
    expect(hasOklch).toBe(false);

    // Clean up
    cleanupPdfSafeClone(safeClone);
  });

  it('should preserve non-OKLCH colors', async () => {
    // Create element with RGB colors
    const rgbElement = document.createElement('div');
    rgbElement.style.color = 'rgb(255, 0, 0)';
    rgbElement.style.backgroundColor = '#ffffff';
    document.body.appendChild(rgbElement);

    const { createPdfSafeClone, cleanupPdfSafeClone } = await import('./pdfExportSafe');

    const safeClone = createPdfSafeClone(rgbElement);

    // Verify colors are preserved
    const computedStyle = window.getComputedStyle(safeClone);
    expect(computedStyle.color).toContain('rgb');
    expect(computedStyle.backgroundColor).toBeTruthy();

    // Clean up
    cleanupPdfSafeClone(safeClone);
    document.body.removeChild(rgbElement);
  });

  it('should handle nested elements with OKLCH colors', async () => {
    // Create nested structure
    const parent = document.createElement('div');
    parent.style.color = 'oklch(0.45 0.15 250)';
    
    const child = document.createElement('span');
    child.style.backgroundColor = 'oklch(0.99 0 0)';
    child.textContent = 'Child';
    
    parent.appendChild(child);
    document.body.appendChild(parent);

    const { createPdfSafeClone, cleanupPdfSafeClone, verifyNoOklch } = await import('./pdfExportSafe');

    const safeClone = createPdfSafeClone(parent);

    // Verify no OKLCH in parent or children
    const hasOklch = verifyNoOklch(safeClone);
    expect(hasOklch).toBe(false);

    // Clean up
    cleanupPdfSafeClone(safeClone);
    document.body.removeChild(parent);
  });
});
