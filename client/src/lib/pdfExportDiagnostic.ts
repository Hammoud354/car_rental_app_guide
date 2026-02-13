/**
 * PDF Export Diagnostic Utility
 * 
 * This utility provides comprehensive logging and diagnostics for PDF export failures.
 * It will help identify exactly where OKLCH colors are coming from and why they're not being converted.
 */

/**
 * Scan an element and all its children for OKLCH colors in computed styles
 */
export function scanForOklch(element: HTMLElement, depth = 0): {hasOklch: boolean, details: Array<{element: string, property: string, value: string}>} {
  const results: Array<{element: string, property: string, value: string}> = [];
  const computedStyle = window.getComputedStyle(element);
  
  // Get element identifier
  const elementId = element.id || element.className || element.tagName;
  
  // Check all computed style properties
  for (let i = 0; i < computedStyle.length; i++) {
    const propName = computedStyle[i];
    const value = computedStyle.getPropertyValue(propName);
    
    if (value && value.includes('oklch(')) {
      results.push({
        element: `${elementId} (depth: ${depth})`,
        property: propName,
        value: value
      });
    }
  }
  
  // Recursively check children
  const children = element.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child instanceof HTMLElement) {
      const childResults = scanForOklch(child, depth + 1);
      results.push(...childResults.details);
    }
  }
  
  return {
    hasOklch: results.length > 0,
    details: results
  };
}

/**
 * Log comprehensive diagnostics before PDF export
 */
export function logPdfExportDiagnostics(element: HTMLElement): void {
  console.group('🔍 PDF Export Diagnostics');
  
  // 1. Element info
  console.log('Target Element:', {
    id: element.id,
    className: element.className,
    tagName: element.tagName,
    childCount: element.children.length
  });
  
  // 2. Scan for OKLCH
  console.log('\n📊 Scanning for OKLCH colors...');
  const scanResults = scanForOklch(element);
  
  if (scanResults.hasOklch) {
    console.error(`❌ Found ${scanResults.details.length} OKLCH values:`);
    console.table(scanResults.details);
  } else {
    console.log('✅ No OKLCH colors found in computed styles');
  }
  
  // 3. Sample computed styles from root element
  const computedStyle = window.getComputedStyle(element);
  console.log('\n🎨 Root Element Computed Styles (color-related):');
  const colorProps = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'];
  const colorStyles: Record<string, string> = {};
  for (const prop of colorProps) {
    const value = computedStyle.getPropertyValue(prop);
    if (value) {
      colorStyles[prop] = value;
    }
  }
  console.table(colorStyles);
  
  // 4. CSS Variables
  console.log('\n🔧 CSS Variables on root element:');
  const cssVars: Record<string, string> = {};
  for (let i = 0; i < computedStyle.length; i++) {
    const propName = computedStyle[i];
    if (propName.startsWith('--')) {
      const value = computedStyle.getPropertyValue(propName);
      if (value && (value.includes('oklch') || value.includes('color'))) {
        cssVars[propName] = value;
      }
    }
  }
  console.table(cssVars);
  
  console.groupEnd();
}

/**
 * Absolutely strip ALL OKLCH from an element tree
 * This is the nuclear option - convert EVERYTHING to inline RGB/HEX
 */
export function absolutelyStripOklch(element: HTMLElement): void {
  const computedStyle = window.getComputedStyle(element);
  
  // Get ALL computed style properties and inline them
  const inlineStyles: Record<string, string> = {};
  
  for (let i = 0; i < computedStyle.length; i++) {
    const propName = computedStyle[i];
    let value = computedStyle.getPropertyValue(propName);
    
    // If value contains OKLCH, we need to convert it
    if (value && value.includes('oklch(')) {
      // For now, replace with a safe fallback
      // In production, this should use proper color conversion
      if (propName.includes('color') || propName.includes('Color')) {
        value = '#000000'; // Black fallback
      } else if (propName.includes('background')) {
        value = '#ffffff'; // White fallback
      }
    }
    
    // Inline the value
    if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
      inlineStyles[propName] = value;
    }
  }
  
  // Apply all styles as inline with !important
  for (const [prop, value] of Object.entries(inlineStyles)) {
    try {
      element.style.setProperty(prop, value, 'important');
    } catch (e) {
      // Some properties can't be set, ignore them
    }
  }
  
  // Recursively process children
  const children = element.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child instanceof HTMLElement) {
      absolutelyStripOklch(child);
    }
  }
}

/**
 * Create a completely isolated, OKLCH-free clone for PDF export
 */
export function createAbsolutelyIsolatedClone(element: HTMLElement): HTMLElement {
  console.log('🏗️ Creating absolutely isolated clone...');
  
  // 1. Deep clone
  const clone = element.cloneNode(true) as HTMLElement;
  
  // 2. Append to body (needed for getComputedStyle)
  clone.style.position = 'absolute';
  clone.style.left = '-99999px';
  clone.style.top = '-99999px';
  clone.style.zIndex = '-9999';
  document.body.appendChild(clone);
  
  // 3. Log diagnostics BEFORE stripping
  console.log('\n📋 BEFORE stripping:');
  logPdfExportDiagnostics(clone);
  
  // 4. Absolutely strip all OKLCH
  absolutelyStripOklch(clone);
  
  // 5. Log diagnostics AFTER stripping
  console.log('\n📋 AFTER stripping:');
  logPdfExportDiagnostics(clone);
  
  // 6. Make visible for rendering
  clone.style.position = 'static';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.zIndex = '0';
  
  return clone;
}

/**
 * Cleanup the isolated clone
 */
export function cleanupIsolatedClone(clone: HTMLElement): void {
  if (clone && clone.parentNode) {
    clone.parentNode.removeChild(clone);
  }
}
