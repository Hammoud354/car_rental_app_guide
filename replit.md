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
- Print styles configured for invoices and contracts
- Landing page: Professional design with FleetMaster branding, blue-600 accent, animated dashboard preview
- Auth pages (SignIn/SignUp): Split-panel layout with dark branding panel + white form panel
- Logo: SVG car icon in gradient blue/indigo rounded-xl box, "Fleet**Master**" text with "Master" in blue-600
- **Consistent page headers**: `<h1 className="text-2xl font-bold text-gray-900">` + `<p className="text-sm text-gray-500 mt-0.5">` subtitle
- **Stat cards**: white div with `rounded-xl border border-gray-200 p-5`, icon in colored bg `rounded-lg p-2`
- **Alert widgets**: `border-[color]-200 bg-[color]-50/50`, compact with ChevronRight link
- **Button sizing**: `size="sm"` for header action buttons; icons use `h-3.5 w-3.5 mr-1.5`
- **Sidebar**: Car icon, `from-blue-600 to-indigo-700` gradient, "FleetMaster" branding

## Business Logic
- Invoice tax calculation uses company profile VAT rate (not hardcoded)
- Invoice numbering uses MAX(invoice_number) with collision fallback
- Late fee default: 150% of daily rate per day late (configurable per contract)

## Auth
- Local authentication with username/password (cookie-based sessions)
- Admin user: `admin` / `Admin123!` (role: `super_admin`)
- Demo mode: `/demo` route auto-creates demo user with 10-minute session, pre-seeded data via `server/seedDemoData.ts`
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
