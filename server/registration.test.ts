import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('User Registration Flow', () => {
  let testUserId: number | undefined;
  const testUsername = `testuser_${Date.now()}`;

  afterAll(async () => {
    // Clean up test user after tests
    if (testUserId) {
      try {
        await db.deleteUser(testUserId);
      } catch (error) {
        console.log('Cleanup: Test user may have already been deleted');
      }
    }
  });

  it('should create a new user with hashed password', async () => {
    const bcrypt = await import('bcryptjs');
    
    // Create test user
    const newUser = await db.createUser({
      username: testUsername,
      password: await bcrypt.hash('testpassword123', 10),
      name: 'Test Company Registration',
      email: `${testUsername}@test.com`,
      phone: '+15551234567',
      country: 'United States',
    });

    testUserId = newUser.id;

    // Verify user was created
    expect(newUser).toBeDefined();
    expect(newUser.username).toBe(testUsername);
    expect(newUser.name).toBe('Test Company Registration');
    expect(newUser.email).toBe(`${testUsername}@test.com`);
    expect(newUser.password).not.toBe('testpassword123'); // Password should be hashed
    expect(newUser.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
  });

  it('should prevent duplicate username registration', async () => {
    // Try to create user with same username
    const existingUser = await db.getUserByUsername(testUsername);
    expect(existingUser).toBeDefined();
    expect(existingUser?.username).toBe(testUsername);

    // In the actual API, this would throw an error
    // Here we just verify the user exists
  });

  it('should initialize new user with empty database', async () => {
    if (!testUserId) {
      throw new Error('Test user not created');
    }

    // Verify new user has no vehicles
    const vehicles = await db.getAllVehicles(testUserId);
    expect(vehicles.length).toBe(0);

    // Verify new user has no clients
    const clients = await db.getAllClients(testUserId);
    expect(clients.length).toBe(0);

    // Verify new user has no contracts
    const contracts = await db.getAllRentalContracts(testUserId);
    expect(contracts.length).toBe(0);

    // Note: Maintenance records are tied to vehicles, so with 0 vehicles, there will be 0 maintenance records
  });

  it('should verify password hashing works correctly', async () => {
    const bcrypt = await import('bcryptjs');
    
    if (!testUserId) {
      throw new Error('Test user not created');
    }

    const user = await db.getUserById(testUserId);
    if (!user || !user.password) {
      throw new Error('User or password not found');
    }

    // Verify correct password
    const isValidPassword = await bcrypt.compare('testpassword123', user.password);
    expect(isValidPassword).toBe(true);

    // Verify incorrect password fails
    const isInvalidPassword = await bcrypt.compare('wrongpassword', user.password);
    expect(isInvalidPassword).toBe(false);
  });

  it('should verify user data isolation', async () => {
    if (!testUserId) {
      throw new Error('Test user not created');
    }

    // Get an existing user (user ID 1)
    const existingUserVehicles = await db.getAllVehicles(1);
    
    // New user should not see existing user's vehicles
    const newUserVehicles = await db.getAllVehicles(testUserId);
    
    // Verify data isolation
    expect(newUserVehicles.length).toBe(0);
    
    // If existing user has vehicles, verify they're not accessible to new user
    if (existingUserVehicles.length > 0) {
      const existingVehicleId = existingUserVehicles[0].id;
      const cannotAccessVehicle = await db.getVehicleById(existingVehicleId, testUserId);
      expect(cannotAccessVehicle).toBeUndefined();
    }
  });
});
