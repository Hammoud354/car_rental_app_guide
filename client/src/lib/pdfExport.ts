/**
 * Universal PDF Export Utility
 * 
 * This module provides a centralized solution for PDF export across the entire application.
 * 
 * ROOT CAUSE:
 * - The design system uses OKLCH color syntax in CSS variables (Tailwind 4)
 * - html2canvas (the PDF rendering engine) cannot parse OKLCH colors
 * - This causes "Attempting to parse an unsupported color function 'oklch'" errors
 * 
 * SOLUTION:
 * - Inject RGB color overrides before any PDF export operation
 * - Remove the overrides after export completes
 * - This works with any existing PDF export code
 */

/**
 * OKLCH to RGB color mappings
 * These are pre-computed RGB equivalents of the OKLCH colors defined in index.css
 */
const LIGHT_MODE_RGB_COLORS = {
  "--background": "rgb(255, 255, 255)",
  "--foreground": "rgb(0, 0, 0)",
  "--card": "rgb(250, 250, 250)",
  "--card-foreground": "rgb(0, 0, 0)",
  "--popover": "rgb(255, 255, 255)",
  "--popover-foreground": "rgb(0, 0, 0)",
  "--primary": "rgb(0, 122, 255)",
  "--primary-foreground": "rgb(255, 255, 255)",
  "--secondary": "rgb(245, 245, 245)",
  "--secondary-foreground": "rgb(0, 0, 0)",
  "--muted": "rgb(245, 245, 245)",
  "--muted-foreground": "rgb(128, 128, 128)",
  "--accent": "rgb(245, 245, 245)",
  "--accent-foreground": "rgb(0, 0, 0)",
  "--destructive": "rgb(255, 59, 48)",
  "--destructive-foreground": "rgb(255, 255, 255)",
  "--border": "rgb(230, 230, 230)",
  "--input": "rgb(230, 230, 230)",
  "--ring": "rgb(0, 122, 255)",
  "--chart-1": "rgb(0, 122, 255)",
  "--chart-2": "rgb(52, 199, 89)",
  "--chart-3": "rgb(255, 149, 0)",
  "--chart-4": "rgb(175, 82, 222)",
  "--chart-5": "rgb(255, 59, 48)",
  "--sidebar": "rgb(248, 248, 248)",
  "--sidebar-foreground": "rgb(0, 0, 0)",
  "--sidebar-primary": "rgb(0, 122, 255)",
  "--sidebar-primary-foreground": "rgb(255, 255, 255)",
  "--sidebar-accent": "rgb(240, 240, 240)",
  "--sidebar-accent-foreground": "rgb(0, 0, 0)",
  "--sidebar-border": "rgb(235, 235, 235)",
  "--sidebar-ring": "rgb(0, 122, 255)",
};

const DARK_MODE_RGB_COLORS = {
  "--background": "rgb(28, 28, 30)",
  "--foreground": "rgb(235, 235, 245)",
  "--card": "rgb(44, 44, 46)",
  "--card-foreground": "rgb(235, 235, 245)",
  "--popover": "rgb(44, 44, 46)",
  "--popover-foreground": "rgb(235, 235, 245)",
  "--primary": "rgb(10, 132, 255)",
  "--primary-foreground": "rgb(250, 250, 250)",
  "--secondary": "rgb(58, 58, 60)",
  "--secondary-foreground": "rgb(235, 235, 245)",
  "--muted": "rgb(58, 58, 60)",
  "--muted-foreground": "rgb(165, 165, 170)",
  "--accent": "rgb(58, 58, 60)",
  "--accent-foreground": "rgb(235, 235, 245)",
  "--destructive": "rgb(255, 69, 58)",
  "--destructive-foreground": "rgb(251, 251, 251)",
  "--border": "rgb(72, 72, 74)",
  "--input": "rgb(72, 72, 74)",
  "--ring": "rgb(10, 132, 255)",
  "--chart-1": "rgb(10, 132, 255)",
  "--chart-2": "rgb(48, 209, 88)",
  "--chart-3": "rgb(255, 159, 10)",
  "--chart-4": "rgb(191, 90, 242)",
  "--chart-5": "rgb(255, 69, 58)",
  "--sidebar": "rgb(44, 44, 46)",
  "--sidebar-foreground": "rgb(235, 235, 245)",
  "--sidebar-primary": "rgb(10, 132, 255)",
  "--sidebar-primary-foreground": "rgb(250, 250, 250)",
  "--sidebar-accent": "rgb(58, 58, 60)",
  "--sidebar-accent-foreground": "rgb(235, 235, 245)",
  "--sidebar-border": "rgb(72, 72, 74)",
  "--sidebar-ring": "rgb(10, 132, 255)",
};

function isDarkMode(): boolean {
  return document.documentElement.classList.contains("dark");
}

function generateRGBStylesheet(): string {
  const colors = isDarkMode() ? DARK_MODE_RGB_COLORS : LIGHT_MODE_RGB_COLORS;
  
  const cssRules = Object.entries(colors)
    .map(([varName, rgbValue]) => `  ${varName}: ${rgbValue};`)
    .join("\n");
  
  return `:root {\n${cssRules}\n}\n\n.dark {\n${cssRules}\n}`;
}

/**
 * Prepare for PDF export by injecting RGB color overrides
 * Call this BEFORE any html2canvas operation
 * 
 * @returns cleanup function to remove the injected styles
 */
export function prepareForPDFExport(): () => void {
  const styleElement = document.createElement("style");
  styleElement.id = "pdf-export-rgb-override";
  styleElement.textContent = generateRGBStylesheet();
  document.head.appendChild(styleElement);
  
  // Return cleanup function
  return () => {
    const existingStyle = document.getElementById("pdf-export-rgb-override");
    if (existingStyle) {
      document.head.removeChild(existingStyle);
    }
  };
}

/**
 * Clean up after PDF export
 * Removes the injected RGB color overrides
 */
export function cleanupAfterPDFExport(): void {
  const existingStyle = document.getElementById("pdf-export-rgb-override");
  if (existingStyle) {
    document.head.removeChild(existingStyle);
  }
}
