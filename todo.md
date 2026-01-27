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
