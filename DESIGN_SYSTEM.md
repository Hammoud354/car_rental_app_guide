# Car Rental Management System - Design System Specification

## Design Principles

### Minimalistic & Professional
- Clean layouts with generous white space
- Subtle, elegant color palette
- Modern flat design (no heavy gradients)
- Consistent spacing and alignment
- Clear visual hierarchy

### Modern & Accessible
- High contrast for readability
- Consistent interaction patterns
- Clear call-to-actions
- Responsive and adaptive

---

## Color System

### Light Mode
```css
/* Primary - Professional Blue */
--primary: #2563EB;           /* Blue 600 - Main actions */
--primary-hover: #1D4ED8;     /* Blue 700 - Hover state */
--primary-foreground: #FFFFFF;

/* Secondary - Neutral Gray */
--secondary: #F3F4F6;         /* Gray 100 - Subtle backgrounds */
--secondary-hover: #E5E7EB;   /* Gray 200 - Hover state */
--secondary-foreground: #111827; /* Gray 900 */

/* Success - Green */
--success: #10B981;           /* Emerald 500 */
--success-hover: #059669;     /* Emerald 600 */
--success-foreground: #FFFFFF;

/* Danger - Red */
--danger: #EF4444;            /* Red 500 */
--danger-hover: #DC2626;      /* Red 600 */
--danger-foreground: #FFFFFF;

/* Warning - Amber */
--warning: #F59E0B;           /* Amber 500 */
--warning-hover: #D97706;     /* Amber 600 */
--warning-foreground: #FFFFFF;

/* Background & Surfaces */
--background: #FFFFFF;        /* Pure white */
--surface: #F9FAFB;           /* Gray 50 - Cards, panels */
--surface-elevated: #FFFFFF;  /* Elevated cards */

/* Borders */
--border: #E5E7EB;            /* Gray 200 - Default borders */
--border-strong: #D1D5DB;     /* Gray 300 - Emphasized borders */

/* Text */
--text-primary: #111827;      /* Gray 900 - Main text */
--text-secondary: #6B7280;    /* Gray 500 - Secondary text */
--text-tertiary: #9CA3AF;     /* Gray 400 - Tertiary text */
```

### Dark Mode
```css
/* Primary - Professional Blue */
--primary: #3B82F6;           /* Blue 500 */
--primary-hover: #2563EB;     /* Blue 600 */
--primary-foreground: #FFFFFF;

/* Secondary - Neutral Gray */
--secondary: #1F2937;         /* Gray 800 */
--secondary-hover: #374151;   /* Gray 700 */
--secondary-foreground: #F9FAFB;

/* Success - Green */
--success: #10B981;           /* Emerald 500 */
--success-hover: #059669;     /* Emerald 600 */
--success-foreground: #FFFFFF;

/* Danger - Red */
--danger: #EF4444;            /* Red 500 */
--danger-hover: #DC2626;      /* Red 600 */
--danger-foreground: #FFFFFF;

/* Warning - Amber */
--warning: #F59E0B;           /* Amber 500 */
--warning-hover: #D97706;     /* Amber 600 */
--warning-foreground: #FFFFFF;

/* Background & Surfaces */
--background: #0F172A;        /* Slate 900 */
--surface: #1E293B;           /* Slate 800 - Cards, panels */
--surface-elevated: #334155;  /* Slate 700 - Elevated cards */

/* Borders */
--border: #334155;            /* Slate 700 */
--border-strong: #475569;     /* Slate 600 */

/* Text */
--text-primary: #F1F5F9;      /* Slate 100 */
--text-secondary: #CBD5E1;    /* Slate 300 */
--text-tertiary: #94A3B8;     /* Slate 400 */
```

---

## Typography

### Font Families
```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;
```

### Type Scale
```css
/* Headings */
--text-h1: 2.25rem;    /* 36px - Page titles */
--text-h2: 1.875rem;   /* 30px - Section titles */
--text-h3: 1.5rem;     /* 24px - Subsection titles */
--text-h4: 1.25rem;    /* 20px - Card titles */
--text-h5: 1.125rem;   /* 18px - Small titles */

/* Body */
--text-base: 1rem;     /* 16px - Default body text */
--text-sm: 0.875rem;   /* 14px - Small text */
--text-xs: 0.75rem;    /* 12px - Captions, labels */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Typography Hierarchy
- **H1**: 36px/Bold - Page titles
- **H2**: 30px/Semibold - Section headers
- **H3**: 24px/Semibold - Subsection headers
- **H4**: 20px/Semibold - Card titles
- **Body**: 16px/Normal - Default text
- **Small**: 14px/Normal - Secondary text
- **Caption**: 12px/Medium - Labels, metadata

---

## Spacing System

### Scale (8px base unit)
```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

### Component Spacing
- **Button padding**: 12px 24px (medium), 8px 16px (small), 16px 32px (large)
- **Card padding**: 24px
- **Section spacing**: 48px between sections
- **Element spacing**: 16px between related elements

---

## Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px - Small elements */
--radius-md: 0.375rem;  /* 6px - Inputs, small buttons */
--radius-lg: 0.5rem;    /* 8px - Cards, buttons */
--radius-xl: 0.75rem;   /* 12px - Large cards */
--radius-2xl: 1rem;     /* 16px - Modals */
--radius-full: 9999px;  /* Pills, avatars */
```

---

## Shadows

### Elevation System
```css
/* Subtle shadows for depth */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

### Usage
- **Cards**: shadow-sm (subtle lift)
- **Dropdowns/Popovers**: shadow-lg
- **Modals**: shadow-xl
- **Hover states**: Increase shadow by one level

---

## Component Specifications

### Buttons

#### Sizes
- **Small**: h-8 (32px), px-3, text-sm
- **Medium** (default): h-10 (40px), px-4, text-base
- **Large**: h-12 (48px), px-6, text-base

#### Variants
1. **Primary**: bg-primary, text-white, hover:bg-primary-hover
2. **Secondary**: bg-secondary, text-secondary-foreground, hover:bg-secondary-hover
3. **Outline**: border-2 border-border, bg-transparent, hover:bg-secondary
4. **Ghost**: bg-transparent, hover:bg-secondary
5. **Danger**: bg-danger, text-white, hover:bg-danger-hover
6. **Success**: bg-success, text-white, hover:bg-success-hover

#### States
- **Default**: Solid color, medium shadow
- **Hover**: Darker shade, slightly larger shadow
- **Active**: Even darker, pressed appearance
- **Disabled**: opacity-50, cursor-not-allowed
- **Focus**: ring-2 ring-primary ring-offset-2

### Input Fields

#### Specifications
- Height: 40px (h-10)
- Padding: 8px 12px
- Border: 1px solid border
- Border radius: radius-md (6px)
- Font size: text-base (16px)

#### States
- **Default**: border-border
- **Focus**: ring-2 ring-primary, border-primary
- **Error**: border-danger, ring-danger
- **Disabled**: bg-secondary, opacity-60

### Cards

#### Specifications
- Background: surface
- Border: 1px solid border
- Border radius: radius-lg (8px)
- Padding: 24px (p-6)
- Shadow: shadow-sm

#### Variants
- **Default**: Standard card with subtle shadow
- **Elevated**: surface-elevated, shadow-md
- **Interactive**: Hover effect with shadow-md

### Modals/Dialogs

#### Specifications
- Max width: 500px (default), 800px (large)
- Border radius: radius-2xl (16px)
- Shadow: shadow-xl
- Backdrop: rgba(0, 0, 0, 0.5)
- Padding: 32px (p-8)

---

## Icons

### Style Guidelines
- **Library**: Lucide React (consistent stroke-based icons)
- **Stroke width**: 2px (default)
- **Size**: 16px (small), 20px (medium), 24px (large)
- **Color**: Inherit from parent text color

---

## Accessibility

### Contrast Ratios
- **Normal text**: Minimum 4.5:1
- **Large text** (18px+): Minimum 3:1
- **Interactive elements**: Minimum 3:1

### Focus Indicators
- All interactive elements must have visible focus states
- Use ring-2 ring-primary ring-offset-2 for focus

### Motion
- Respect prefers-reduced-motion
- Keep animations subtle and purposeful

---

## Implementation Notes

1. **Consistency**: All components must use design tokens (CSS variables)
2. **No hardcoded values**: Use spacing/color/radius variables
3. **Responsive**: Mobile-first approach
4. **Dark mode**: All colors must have dark mode variants
5. **Testing**: Verify contrast ratios and accessibility

---

## Migration Checklist

- [ ] Update color variables in index.css
- [ ] Update typography system
- [ ] Update spacing scale
- [ ] Redesign Button component
- [ ] Redesign Input components
- [ ] Redesign Card component
- [ ] Redesign Modal/Dialog components
- [ ] Apply to all pages
- [ ] Test light/dark mode
- [ ] Verify accessibility
