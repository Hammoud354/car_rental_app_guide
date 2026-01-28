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
