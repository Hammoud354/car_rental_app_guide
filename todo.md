# Car Rental App Guide - Dynamic Prototype TODO

## Phase 1: Project Upgrade & Setup
- [x] Upgrade project to full-stack with database support
- [x] Resolve Home.tsx merge conflict
- [x] Fix TypeScript errors

## Phase 2: Database Schema
- [x] Design vehicles table schema
- [x] Add maintenance records table
- [x] Push database migrations

## Phase 3: Backend API
- [x] Create vehicle CRUD procedures in routers.ts
- [x] Add database query helpers in db.ts
- [x] Test API endpoints

## Phase 4: Frontend Implementation
- [x] Create Fleet Management page with vehicle list
- [x] Build Add Vehicle form
- [x] Implement Edit/Delete functionality
- [x] Add vehicle status management

## Phase 5: Testing & Delivery
- [x] Test all CRUD operations
- [x] Verify data persistence
- [ ] Create checkpoint and deliver to user

## Maintenance Tracking Feature

### Phase 1: Database Schema
- [x] Update maintenance records schema with garage location
- [x] Add kilometer reading field
- [x] Ensure all maintenance details are captured

### Phase 2: Maintenance UI
- [x] Create Add Maintenance Record form
- [x] Add maintenance type selector (Routine, Repair, Inspection, Emergency)
- [x] Add garage location input
- [x] Add kilometer reading input
- [x] Add cost and date fields

### Phase 3: Maintenance History
- [x] Create maintenance history view for each vehicle
- [x] Display all past maintenance records
- [x] Show maintenance timeline
- [ ] Add edit/delete maintenance records

### Phase 4: Testing & Delivery
- [x] Test maintenance CRUD operations
- [x] Verify maintenance history displays correctly
- [ ] Create checkpoint and deliver

## Rental Contract System

### Phase 1: Database Schema
- [x] Replace nextServiceDue with kmDueMaintenance in maintenance records
- [x] Create rental contracts table
- [x] Create contract damage marks table
- [x] Push database migrations

### Phase 2: Contract Form
- [x] Create Rental Contracts page
- [x] Build client information form (name, nationality, license)
- [x] Add rental date range picker
- [x] Implement vehicle selection

### Phase 3: Car Diagram & Signature
- [x] Create interactive car damage diagram component
- [x] Add damage marker functionality
- [x] Implement signature pad
- [x] Save damage marks to database

### Phase 4: Testing & Delivery
- [x] Test contract creation flow
- [x] Test damage marking and signature
- [ ] Create checkpoint and deliver
- [ ] Create checkpoint and deliver

## Contract Improvements

### Phase 1: Add Contact Fields
- [x] Add address field to rental contracts schema
- [x] Add phone number field to rental contracts schema
- [x] Update contract form with new fields
- [x] Push database migration

### Phase 2: Improve Date Inputs
- [x] Replace basic date inputs with calendar date pickers
- [x] Add date navigation for easier selection

### Phase 3: Redesign Car Diagram
- [x] Create more realistic car diagram (better proportions)
- [x] Add more vehicle details (doors, windows, lights)
- [x] Improve visual clarity of damage markers

### Phase 4: Testing & Delivery
- [x] Test new fields save correctly
- [x] Test date picker functionality
- [x] Verify improved car diagram
- [ ] Create checkpoint and deliver

## Pricing & Date Enhancements

### Phase 1: Add Pricing Fields
- [x] Add dailyRate, totalAmount, discount, finalAmount to contracts schema
- [x] Add rentalDays field to track duration
- [x] Push database migration

### Phase 2: Replace Date Pickers
- [x] Create dropdown selectors for year, month, day
- [x] Replace calendar pickers with dropdown selectors
- [x] Add number of days input field

### Phase 3: Implement Calculations
- [x] Auto-calculate rental duration from date range
- [x] Auto-calculate return date from start date + days
- [x] Calculate total amount (days × daily rate)
- [x] Apply discount and calculate final amount
- [x] Display all calculations in real-time

### Phase 4: Testing & Delivery
- [x] Test date calculations
- [x] Test pricing calculations
- [x] Verify discount functionality
- [ ] Create checkpoint and deliver

## Bug Fixes - Rental Contract Calculations

### Issues Reported
- [x] Total amount not calculating in real-time when rental days or discount changes
- [x] Rental dates should auto-set from number of days (start = today, end = today + days)
- [x] Remove requirement to manually select dates when using days input

### Implementation
- [x] Fix useEffect dependencies for real-time calculation
- [x] Auto-set rental start date to today when days input changes
- [x] Auto-calculate rental end date from start date + days
- [x] Make date selectors optional/read-only when using days input
- [x] Test all calculation scenarios

## Client Management & Contract Details View

### Phase 1: Database Schema
- [x] Create clients table (firstName, lastName, nationality, phone, address, licenseNumber, licenseIssue, licenseExpiry)
- [x] Update contracts table to reference clientId instead of storing client data directly
- [x] Push database migrations

### Phase 2: Client Management UI
- [x] Create Clients page with client list
- [x] Add "New Client" button and form
- [x] Add "View Clients" navigation link
- [x] Display client details (name, phone, nationality, license)

### Phase 3: Contract Details View
- [x] Add "View Details" button to each contract in the list
- [x] Create contract details dialog showing all information
- [x] Display client info, vehicle info, dates, pricing
- [x] Show damage diagram and signature

### Phase 4: Client Selection in Contracts
- [x] Add client selector dropdown in contract form
- [x] Load existing clients for selection
- [x] Auto-fill client details when client is selected
- [x] Keep option to add new client inline

### Phase 5: Testing & Delivery
- [x] Test client CRUD operations
- [x] Test contract details view
- [x] Test client selection and auto-fill
- [ ] Create checkpoint and deliver


## Bug Fix - Contracts Page Not Found
- [x] Check App.tsx for Contracts route
- [x] Verify RentalContracts component import
- [x] Test navigation to Contracts page


## Bug Fix - Nested Anchor Tags Error
- [x] Find and fix nested <a> tags in RentalContracts page
- [x] Replace Link wrapper with Button or div
- [x] Test page loads correctly


## Find All Nested Anchor Tags
- [x] Search all page files for Link wrapping Button
- [x] Search for Link inside Link patterns
- [x] Fix all instances found (Home.tsx, Dashboard.tsx, FleetManagement.tsx, Maintenance.tsx, Clients.tsx)
- [x] Fix App.tsx Route path syntax issues
- [x] Test Contracts page loads successfully
- [x] All tests passing (14/14)


## Route Naming Consistency Fix
- [x] Change /contracts route to /rental-contracts in App.tsx
- [x] Update all navigation links in sidebar to use /rental-contracts
- [x] Update Home page navigation links
- [x] Test all navigation works correctly
- [x] Verified /rental-contracts route loads successfully


## Vehicle Status Display in Contract Form
- [x] Add vehicle status badges to vehicle selection dropdown
- [x] Use color-coded indicators (🟢 Available, 🔴 Rented, 🟡 Maintenance, ⚫ Out of Service)
- [x] Disable non-available vehicles in dropdown (prevents selection)
- [x] Show status label with color coding next to each vehicle
- [x] Test the status display - working perfectly
- [x] All vehicles visible with clear status indicators


## Automatic Vehicle Status Updates Based on Rental Contracts
- [x] Modify backend to check for active rental contracts when fetching vehicles
- [x] Calculate effective status: if vehicle has active rental (today between start and return date), mark as "Rented"
- [x] Override manual status with rental-based status (rental takes priority for Available vehicles)
- [x] Maintenance/Out of Service statuses take priority over rental status
- [x] Update vehicle list query to include rental status check
- [x] Test that rented vehicles show as "Rented" in contract form - Kia Rio showing 🔴 correctly
- [x] Vehicles will automatically return to "Available" after rental period ends
- [x] All 14 tests passing


## Contract Renewal & Printable Improvements

### Contract Renewal Feature
- [x] Add "Renew Contract" button to contract details dialog
- [x] Create renewal form with new end date and additional days
- [x] Calculate additional charges based on daily rate
- [x] Update contract end date and total amount in database
- [x] Test contract renewal functionality - working perfectly

### Realistic Car Inspection Diagram
- [x] Design new car diagram with realistic proportions
- [x] Add proper car shape (hood, windshield, roof, trunk)
- [x] Include side mirrors, wheels, doors, windows, headlights, taillights
- [x] Make damage markers more visible with red X markers
- [x] Test damage marking on new diagram - already implemented

### Printable Signature Field
- [x] Remove digital signature pad component
- [x] Add blank signature line for pen signing
- [x] Add "Signature:" label, date field, and print name field
- [x] Ensure signature section prints clearly
- [x] Remove signature validation (no longer needed)

### Testing & Delivery
- [x] Test contract renewal workflow - renewal dialog opens and calculates correctly
- [x] Test new car diagram damage marking - realistic diagram already in place
- [x] Test printable signature field - replaced digital pad with printable lines
- [x] Run all tests - 14/14 passing
- [x] Ready to save checkpoint
