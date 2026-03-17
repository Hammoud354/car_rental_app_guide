# FleetMaster - Car Rental Management System

## Overview
Full-stack car rental management application built with Express + React/Vite, tRPC, Drizzle ORM, and PostgreSQL.

## Architecture
- **Backend**: Express.js with tRPC routers (`server/`)
- **Frontend**: React + Vite with Tailwind CSS v4 (`client/`)
- **Database**: PostgreSQL via Drizzle ORM
- **Shared**: Common types, constants, and data (`shared/`)

## Key Files
- `server/_core/index.ts` - Main server entry point
- `server/db.ts` - Database operations and queries
- `server/routers.ts` - tRPC API routes
- `server/seedDemoData.ts` - Demo data seeder (vehicles, clients, contracts, invoices, maintenance, company profile)
- `server/carData.ts` - Global car makers/models data (70+ brands, country-specific lists)
- `client/src/App.tsx` - Main app with route definitions and SidebarLayout wrapper
- `client/src/pages/Home.tsx` - Landing page with framer-motion animations
- `client/src/pages/SignUp.tsx` - Sign-up with country-based phone formatting
- `client/src/components/SidebarLayout.tsx` - Persistent sidebar navigation
- `client/src/components/ModernDatePicker.tsx` - Standard date picker component (used everywhere)
- `client/src/index.css` - Global styles with dark blue input borders, Tailwind v4 theme
- `shared/countries.ts` - Country data with phone codes and digit counts

## Design System
- Dark blue input borders (`#1e3a8a`, 1.5px) applied globally via CSS
- ModernDatePicker is the standard date picker - all pages use it consistently
- SidebarLayout wraps authenticated routes at the `App.tsx` level (not per-page)
- Tailwind CSS v4 with custom theme tokens (primary, secondary, success, danger, warning)
- Print/PDF: `client/src/lib/printUtils.ts` — shared `printElement()` (iframe-based print) and `exportElementToPDF()` (html2canvas+jsPDF) utilities used by Invoices and Contracts pages; no popup windows or external CDN dependencies
- Landing page: Professional design with FleetMaster branding, blue-600 accent, animated dashboard preview
- Auth pages (SignIn/SignUp): Split-panel layout with dark branding panel + white form panel
- Logo: Animated pure-text "FleetMaster" branding (AnimatedLogo component), no icon; "Fleet" in dark + "Master" in blue-600, CSS slide-in animation
- **Consistent page headers**: `<h1 className="text-2xl font-bold text-gray-900">` + `<p className="text-sm text-gray-500 mt-0.5">` subtitle
- **Stat cards**: white div with `rounded-xl border border-gray-200 p-5`, icon in colored bg `rounded-lg p-2`
- **Alert widgets**: `border-[color]-200 bg-[color]-50/50`, compact with ChevronRight link
- **Button sizing**: `size="sm"` for header action buttons; icons use `h-3.5 w-3.5 mr-1.5`
- **Sidebar**: AnimatedLogo "FleetMaster" branding (no icon), "FM" when collapsed
- **Landing page buttons**: "Sign In" (outlined), "Get Started" (blue solid), "Try Live Demo" (bg-red-700 font-bold)

## Database Notes (CRITICAL)
- **PostgreSQL requires quoted identifiers** for camelCase column/table names in raw SQL
- All raw SQL must use `"tableName"` and `"columnName"` (e.g., `"userId"`, `"subscriptionTiers"`, `"invoiceNumber"`)
- Drizzle `db.execute()` returns `{ rows: [...] }` object, NOT `result[0][0]` — access via `result.rows[0]`
- All insert operations use `.returning({ id: table.id })` for PostgreSQL (NOT MySQL `insertId`)
- Schema column `subscriptionTiers.tierName` (not `name`) — all SQL must reference `"tierName"`
- `isInternal` and `openId` columns added to users table via raw SQL (drizzle push has interactive prompt issues)

## Maintenance Logic
- Vehicle status enum: `Available`, `Rented`, `Maintenance`, `Out of Service`
- **Send to Maintenance**: Sets vehicle status to `Maintenance`, blocking rentals (via `fleet.sendToMaintenance` route)
- **Remove from Maintenance**: Sets status back to `Available`, closes open garage records (via `fleet.removeFromMaintenance` route)
- **Auto-status sync**: Adding a maintenance record with "Vehicle is in the garage" checkbox (or garage entry date without exit) auto-sets vehicle to `Maintenance`
- **Status precedence**: `updateVehicleStatus()` preserves manually-set `Maintenance` and `Out of Service` statuses; only auto-resets to `Available` if status was not explicitly set
- **Server-side enforcement**: Contract creation rejects vehicles with `Maintenance` or `Out of Service` status; also verifies vehicle exists and belongs to user
- Maintenance toggle buttons on both Fleet Management and Maintenance pages
- Tenant-scoped: All maintenance status changes verify vehicle ownership via userId

## AI Maintenance Integration
- **Dashboard Maintenance Alerts**: `aiMaintenance.getMaintenanceAlerts` route aggregates alerts from AI tasks, vehicle insurance, and scheduled maintenance; categorized as Critical/Needs Attention/Can Wait
- **Send Task to Maintenance**: `aiMaintenance.sendTaskToMaintenance` route creates a maintenance record, sends vehicle to garage, and completes the AI task
- **AI task status enum**: `Pending`, `Completed`, `Skipped` (no "Overdue" — overdue is determined by comparing triggerDate to now)
- **Trigger types**: `Mileage`, `Time`, `Both` (matching the triggerType DB enum)
- **Priority levels**: `Critical`, `Important`, `Recommended`, `Optional`

## Business Logic
- Invoice tax calculation uses company profile VAT rate (not hardcoded)
- Invoice numbering uses MAX("invoiceNumber") with collision fallback
- Late fee default: 150% of daily rate per day late (configurable per contract)

## Auth
- Local authentication with username/password (cookie-based sessions)
- Admin user: `admin` / `Admin123!` (role: `super_admin`)
- Demo mode: `/demo` route auto-creates demo user with 10-minute session, pre-seeded data via `server/seedDemoData.ts`
- Demo data: 10 vehicles (with insurance expiry dates), 6 clients, 6 contracts (incl. 1 overdue), 3 invoices with line items, 4 maintenance records, 7 AI maintenance tasks (2 critical overdue, 2 upcoming, 3 can-wait), 1 company profile, 1 damage mark
- Page title: "Fleet Master" (browser tab)
- Auto-country: On first login, company profile is auto-created with country, VAT rate, currency from signup data
- Country data mapping: `shared/countries.ts` (COUNTRY_VAT_CURRENCY) maps country codes to financial settings

## Running
```
NODE_ENV=development tsx server/_core/index.ts
```
Server runs on port 5000, Vite dev server proxied through it.

## Dependencies
- framer-motion (landing page animations)
- date-fns (date formatting)
- drizzle-orm + pg (database)
- @trpc/server + @trpc/client (API layer)
- lucide-react (icons)
- recharts (charts)
- sonner (toast notifications)
