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

## Auth
- Local authentication with username/password
- Admin user: `admin` / `Admin123!` (role: `super_admin`)
- JWT-based sessions

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
