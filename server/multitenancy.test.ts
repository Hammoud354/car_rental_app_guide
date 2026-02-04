import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Multi-Tenancy Data Isolation', () => {
  let user1Id: number;
  let user2Id: number;
  let user1VehicleId: number;
  let user2VehicleId: number;

  beforeAll(async () => {
    // Get user IDs - use the actual usernames from the database
    const user1 = await db.getUserById(1); // Mohammad Hammoud
    const user2 = await db.getUserByUsername('testuser2');
    
    if (!user1 || !user2) {
      throw new Error('Test users not found in database');
    }
    
    user1Id = user1.id;
    user2Id = user2.id;
  });

  it('should isolate vehicles between users', async () => {
    // Get vehicles for user 1
    const user1Vehicles = await db.getAllVehicles(user1Id);
    
    // Get vehicles for user 2 (should be empty initially)
    const user2Vehicles = await db.getAllVehicles(user2Id);
    
    // User 1 should have at least one vehicle (TEST-001)
    expect(user1Vehicles.length).toBeGreaterThan(0);
    
    // User 2 should have no vehicles initially
    expect(user2Vehicles.length).toBe(0);
    
    // Verify user 1's vehicle is not accessible by user 2
    if (user1Vehicles.length > 0) {
      user1VehicleId = user1Vehicles[0].id;
      const user2CannotAccessUser1Vehicle = await db.getVehicleById(user1VehicleId, user2Id);
      expect(user2CannotAccessUser1Vehicle).toBeUndefined();
    }
  });

  it('should isolate clients between users', async () => {
    // Get clients for both users
    const user1Clients = await db.getAllClients(user1Id);
    const user2Clients = await db.getAllClients(user2Id);
    
    // User 2 should have no clients initially
    expect(user2Clients.length).toBe(0);
    
    // If user 1 has clients, verify user 2 cannot access them
    if (user1Clients.length > 0) {
      const user1ClientId = user1Clients[0].id;
      const user2CannotAccessUser1Client = await db.getClientById(user1ClientId, user2Id);
      expect(user2CannotAccessUser1Client).toBeUndefined();
    }
  });

  it('should isolate rental contracts between users', async () => {
    // Get contracts for both users
    const user1Contracts = await db.getAllRentalContracts(user1Id);
    const user2Contracts = await db.getAllRentalContracts(user2Id);
    
    // User 2 should have no contracts initially
    expect(user2Contracts.length).toBe(0);
    
    // If user 1 has contracts, verify user 2 cannot access them
    if (user1Contracts.length > 0) {
      const user1ContractId = user1Contracts[0].id;
      const user2CannotAccessUser1Contract = await db.getRentalContractById(user1ContractId, user2Id);
      expect(user2CannotAccessUser1Contract).toBeUndefined();
    }
  });

  it('should allow user 2 to create their own data without affecting user 1', async () => {
    // Create a vehicle for user 2
    const user2Vehicle = await db.createVehicle({
      userId: user2Id,
      plateNumber: 'TEST-USER2',
      brand: 'Honda',
      model: 'Accord',
      year: 2023,
      color: 'Blue',
      category: 'Midsize',
      status: 'Available',
      dailyRate: '45.00',
      mileage: 5000,
    });
    
    user2VehicleId = user2Vehicle.id;
    
    // Verify user 2 can see their vehicle
    const user2Vehicles = await db.getAllVehicles(user2Id);
    expect(user2Vehicles.length).toBe(1);
    expect(user2Vehicles[0].plateNumber).toBe('TEST-USER2');
    
    // Verify user 1 cannot see user 2's vehicle
    const user1Vehicles = await db.getAllVehicles(user1Id);
    const user2VehicleInUser1List = user1Vehicles.find(v => v.id === user2VehicleId);
    expect(user2VehicleInUser1List).toBeUndefined();
    
    // Verify user 1 cannot access user 2's vehicle by ID
    const user1CannotAccessUser2Vehicle = await db.getVehicleById(user2VehicleId, user1Id);
    expect(user1CannotAccessUser2Vehicle).toBeUndefined();
  });

  it('should isolate maintenance records between users', async () => {
    // If user 1 has vehicles, check maintenance records
    const user1Vehicles = await db.getAllVehicles(user1Id);
    
    if (user1Vehicles.length > 0) {
      const user1VehicleId = user1Vehicles[0].id;
      
      // Get maintenance records for user 1's vehicle
      const user1MaintenanceRecords = await db.getMaintenanceRecordsByVehicleId(user1VehicleId, user1Id);
      
      // User 2 should not be able to access user 1's maintenance records
      const user2CannotAccessUser1Maintenance = await db.getMaintenanceRecordsByVehicleId(user1VehicleId, user2Id);
      expect(user2CannotAccessUser1Maintenance.length).toBe(0);
    }
  });

  it('should verify overdue statistics are isolated by user', async () => {
    // Get overdue statistics for both users
    const user1Stats = await db.getOverdueStatistics(user1Id);
    const user2Stats = await db.getOverdueStatistics(user2Id);
    
    // User 2 should have no overdue contracts (new user)
    expect(user2Stats.count).toBe(0);
    expect(user2Stats.totalLateFees).toBe('0.00');
    expect(user2Stats.avgDaysOverdue).toBe(0);
    
    // Both stats should be valid objects with the correct structure
    expect(user1Stats).toHaveProperty('count');
    expect(user1Stats).toHaveProperty('totalLateFees');
    expect(user1Stats).toHaveProperty('avgDaysOverdue');
    expect(user2Stats).toHaveProperty('count');
    expect(user2Stats).toHaveProperty('totalLateFees');
    expect(user2Stats).toHaveProperty('avgDaysOverdue');
  });

  it('should verify vehicle profitability analytics are isolated by user', async () => {
    // Get analytics for both users
    const user1Analytics = await db.getVehicleProfitabilityAnalytics(user1Id);
    const user2Analytics = await db.getVehicleProfitabilityAnalytics(user2Id);
    
    // User 1 should have at least one vehicle in analytics
    expect(user1Analytics.length).toBeGreaterThan(0);
    
    // User 2 should have exactly one vehicle (the one we created)
    expect(user2Analytics.length).toBe(1);
    expect(user2Analytics[0].plateNumber).toBe('TEST-USER2');
    
    // Verify no overlap in vehicle IDs
    const user1VehicleIds = user1Analytics.map(v => v.vehicleId);
    const user2VehicleIds = user2Analytics.map(v => v.vehicleId);
    const overlap = user1VehicleIds.filter(id => user2VehicleIds.includes(id));
    expect(overlap.length).toBe(0);
  });
});
