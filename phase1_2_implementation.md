# Phase 1 + 2 Implementation Plan

## PHASE 1: CRITICAL BUSINESS FEATURES

### 1. Insurance Package Selection System
- [ ] Add insurance packages table to database (Basic, Premium, Full Coverage)
- [ ] Add insurance selection to contract creation form
- [ ] Calculate insurance cost based on package and rental duration
- [ ] Display insurance details in contract view
- [ ] Include insurance in invoice generation

### 2. Deposit Management System
- [ ] Add deposit fields to contracts table (depositAmount, depositStatus, depositRefundDate)
- [ ] Add deposit capture UI in contract creation
- [ ] Implement deposit hold workflow (Held, Refunded, Forfeited)
- [ ] Add deposit refund action in contract completion
- [ ] Track deposit status in contract list
- [ ] Include deposit in financial calculations

### 3. Fuel Policy Options
- [ ] Add fuel policy field to contracts (Full-to-Full, Same-to-Same, Pre-purchase)
- [ ] Add fuel level tracking (pickup and return)
- [ ] Calculate fuel charges based on policy
- [ ] Display fuel policy in contract details
- [ ] Include fuel charges in invoice

### 4. Late Return Penalty Calculator
- [ ] Add late return penalty configuration to settings
- [ ] Calculate late hours/days automatically
- [ ] Apply hourly/daily penalty rates
- [ ] Display late penalty in contract completion
- [ ] Include late fees in invoice
- [ ] Show late return warnings in dashboard

### 5. Contract Amendment Workflow
- [ ] Create contract amendment modal/page
- [ ] Allow extending rental dates
- [ ] Allow changing vehicle (if available)
- [ ] Allow adding services/add-ons
- [ ] Calculate price difference
- [ ] Track amendment history
- [ ] Generate amendment invoice

### 6. Vehicle Availability Conflict Prevention
- [ ] Check vehicle availability before contract creation
- [ ] Validate date ranges against existing bookings
- [ ] Show availability calendar for vehicles
- [ ] Prevent double-booking with validation
- [ ] Display conflict warnings
- [ ] Suggest alternative vehicles

### 7. Automated Invoice Generation
- [ ] Auto-generate invoice on contract completion
- [ ] Include all charges (rental, insurance, fuel, deposits, penalties, add-ons)
- [ ] Calculate taxes automatically
- [ ] Set initial status as "Pending"
- [ ] Auto-open invoice after generation
- [ ] Send invoice via email (if configured)

---

## PHASE 2: PROFESSIONAL DESIGN SYSTEM

### 8. Unified Color Palette & Theme
- [ ] Define primary color (#0066CC blue)
- [ ] Define secondary color (#10B981 green)
- [ ] Define accent color (#F59E0B amber)
- [ ] Define danger color (#EF4444 red)
- [ ] Define neutral grays (50-900 scale)
- [ ] Update CSS variables in index.css
- [ ] Apply colors consistently across all components

### 9. Typography Hierarchy
- [ ] Define H1: 2.5rem/3rem, font-bold, tracking-tight
- [ ] Define H2: 2rem/2.5rem, font-semibold
- [ ] Define H3: 1.5rem/2rem, font-semibold
- [ ] Define H4: 1.25rem/1.75rem, font-medium
- [ ] Define Body: 1rem/1.5rem, font-normal
- [ ] Define Caption: 0.875rem/1.25rem, font-normal
- [ ] Define Label: 0.875rem/1.25rem, font-medium
- [ ] Apply hierarchy to all pages

### 10. Button System Standardization
- [ ] Primary button: bg-primary, text-white, hover:bg-primary/90
- [ ] Secondary button: bg-secondary, text-white, hover:bg-secondary/90
- [ ] Outline button: border-primary, text-primary, hover:bg-primary/10
- [ ] Ghost button: text-primary, hover:bg-primary/10
- [ ] Danger button: bg-destructive, text-white, hover:bg-destructive/90
- [ ] Size variants: sm (h-8), default (h-10), lg (h-12)
- [ ] Consistent padding and border-radius
- [ ] Update all buttons across app

### 11. Card Component Library
- [ ] Standard card: border, rounded-lg, shadow-sm, p-6
- [ ] Hover card: add hover:shadow-md transition
- [ ] Clickable card: add cursor-pointer, hover:border-primary
- [ ] Stat card: icon + number + label layout
- [ ] Info card: title + description + actions layout
- [ ] Consistent spacing (gap-4, gap-6)
- [ ] Apply to Dashboard, Fleet, Clients, Contracts

### 12. Icon System Consistency
- [ ] Use only Lucide React icons
- [ ] Standard size: h-5 w-5 (20px)
- [ ] Large size: h-6 w-6 (24px)
- [ ] Small size: h-4 w-4 (16px)
- [ ] Consistent stroke-width
- [ ] Replace any mixed icon sets
- [ ] Add icons to all buttons and cards

### 13. Spacing System
- [ ] Define spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- [ ] Apply to padding: p-4, p-6, p-8
- [ ] Apply to margins: m-4, m-6, m-8
- [ ] Apply to gaps: gap-4, gap-6, gap-8
- [ ] Consistent section spacing
- [ ] Consistent form field spacing

### 14. Shadow System
- [ ] shadow-sm: subtle elevation
- [ ] shadow: default elevation
- [ ] shadow-md: medium elevation
- [ ] shadow-lg: high elevation
- [ ] Apply to cards, modals, dropdowns
- [ ] Consistent across all components

### 15. Loading States & Skeletons
- [ ] Create skeleton components for cards
- [ ] Create skeleton for tables
- [ ] Add loading spinners for buttons
- [ ] Add loading overlays for forms
- [ ] Show skeletons while data loads
- [ ] Add loading indicators to all async operations

### 16. Empty States
- [ ] Design empty state component (icon + message + CTA)
- [ ] Add to Fleet page (no vehicles)
- [ ] Add to Clients page (no clients)
- [ ] Add to Contracts page (no contracts)
- [ ] Add to Maintenance page (no records)
- [ ] Add to Dashboard widgets (no data)
- [ ] Include helpful actions/links

### 17. Breadcrumb Navigation
- [ ] Create Breadcrumb component
- [ ] Add to all pages (Dashboard > Fleet > Vehicle Details)
- [ ] Make breadcrumbs clickable
- [ ] Show current page as non-clickable
- [ ] Consistent positioning (top of page)
- [ ] Mobile-responsive (collapse on small screens)

### 18. Form Validation & UX
- [ ] Real-time validation on blur
- [ ] Show error messages below fields
- [ ] Red border for invalid fields
- [ ] Green checkmark for valid fields
- [ ] Disable submit until valid
- [ ] Show validation summary at top
- [ ] Clear, helpful error messages

### 19. Required Field Indicators
- [ ] Add red asterisk (*) to required field labels
- [ ] Add "Required" text for screen readers
- [ ] Consistent styling across all forms
- [ ] Update Contract form
- [ ] Update Client form
- [ ] Update Fleet form
- [ ] Update Settings form

### 20. Auto-save Drafts
- [ ] Implement localStorage draft saving
- [ ] Save form state every 30 seconds
- [ ] Restore draft on page reload
- [ ] Show "Draft saved" indicator
- [ ] Clear draft on successful submit
- [ ] Add "Discard draft" option

---

## Implementation Order

1. **Database Schema Updates** (Items 1, 2, 3, 4, 5, 6, 7)
2. **Design System Foundation** (Items 8, 9, 10, 11, 12, 13, 14)
3. **Backend API Endpoints** (Items 1-7)
4. **Frontend Components** (Items 15, 16, 17, 18, 19, 20)
5. **Integration & Testing** (All items)
6. **Polish & Refinement**

---

## Success Criteria

✅ All contracts include insurance, deposit, fuel policy
✅ Late returns automatically calculate penalties
✅ Contracts can be amended without recreation
✅ Vehicle double-booking is impossible
✅ Invoices generate automatically on completion
✅ Entire app has consistent colors, fonts, buttons
✅ All pages have loading states and empty states
✅ Forms have clear validation and required indicators
✅ Navigation includes breadcrumbs
✅ Professional, modern appearance throughout

---

## Estimated Timeline

- **Phase 1 (Critical Features)**: 3-4 hours
- **Phase 2 (Design System)**: 2-3 hours
- **Total**: 5-7 hours of focused implementation

Let's build! 🚀
