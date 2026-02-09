import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Data Isolation Tests', () => {
  let user1Id: number;
  let user2Id: number;
  let maker1Id: number;
  let maker2Id: number;

  beforeAll(async () => {
    // Create two test users
    const user1 = await db.createUser({
      username: `testuser1_${Date.now()}`,
      password: 'hashedpassword123',
      name: 'Test User 1',
      email: `testuser1_${Date.now()}@test.com`,
      country: 'Lebanon',
    });
    user1Id = user1.id;

    const user2 = await db.createUser({
      username: `testuser2_${Date.now()}`,
      password: 'hashedpassword456',
      name: 'Test User 2',
      email: `testuser2_${Date.now()}@test.com`,
      country: 'Lebanon',
    });
    user2Id = user2.id;

    // Create simple test makers instead of populating full database
    const maker1 = await db.createCarMaker({
      name: 'Test Maker 1',
      country: 'Lebanon',
      isCustom: false,
      userId: user1Id,
    });
    maker1Id = maker1.id;

    const maker2 = await db.createCarMaker({
      name: 'Test Maker 2',
      country: 'Lebanon',
      isCustom: false,
      userId: user2Id,
    });
    maker2Id = maker2.id;

    // Create test models
    await db.createCarModel({
      makerId: maker1Id,
      modelName: 'Model 1',
      isCustom: false,
      userId: user1Id,
    });

    await db.createCarModel({
      makerId: maker2Id,
      modelName: 'Model 2',
      isCustom: false,
      userId: user2Id,
    });
  }, 30000);

  it('should create separate car makers for each user', async () => {
    const user1Makers = await db.getCarMakersByCountry('Lebanon', user1Id);
    const user2Makers = await db.getCarMakersByCountry('Lebanon', user2Id);

    expect(user1Makers.length).toBeGreaterThan(0);
    expect(user2Makers.length).toBeGreaterThan(0);

    // Verify all makers belong to the correct user
    user1Makers.forEach(maker => {
      expect(maker.userId).toBe(user1Id);
    });

    user2Makers.forEach(maker => {
      expect(maker.userId).toBe(user2Id);
    });

    // Store maker IDs for later tests
    maker1Id = user1Makers[0].id;
    maker2Id = user2Makers[0].id;
  });

  it('should not show user2 makers to user1', async () => {
    const user1Makers = await db.getCarMakersByCountry('Lebanon', user1Id);
    
    // Verify none of user2's makers appear in user1's list
    const user2MakerIds = (await db.getCarMakersByCountry('Lebanon', user2Id)).map(m => m.id);
    const user1MakerIds = user1Makers.map(m => m.id);

    user2MakerIds.forEach(id => {
      expect(user1MakerIds).not.toContain(id);
    });
  });

  it('should isolate car models by userId', async () => {
    const user1Models = await db.getCarModelsByMaker(maker1Id, user1Id);
    const user2Models = await db.getCarModelsByMaker(maker2Id, user2Id);

    expect(user1Models.length).toBeGreaterThan(0);
    expect(user2Models.length).toBeGreaterThan(0);

    // Verify all models belong to the correct user
    user1Models.forEach(model => {
      expect(model.userId).toBe(user1Id);
    });

    user2Models.forEach(model => {
      expect(model.userId).toBe(user2Id);
    });
  });

  it('should create custom maker with userId', async () => {
    const customMaker = await db.createCarMaker({
      name: 'Custom Maker Test',
      country: 'Lebanon',
      isCustom: true,
      userId: user1Id,
    });

    expect(customMaker.userId).toBe(user1Id);
    expect(customMaker.isCustom).toBe(true);

    // Verify user2 cannot see user1's custom maker
    const user2Makers = await db.getCarMakersByCountry('Lebanon', user2Id);
    expect(user2Makers.find(m => m.id === customMaker.id)).toBeUndefined();
  });

  it('should create custom model with userId', async () => {
    const customModel = await db.createCarModel({
      makerId: maker1Id,
      modelName: 'Custom Model Test',
      isCustom: true,
      userId: user1Id,
    });

    expect(customModel.userId).toBe(user1Id);
    expect(customModel.isCustom).toBe(true);

    // Verify user2 cannot see user1's custom model
    const user2Models = await db.getCarModelsByMaker(maker1Id, user2Id);
    expect(user2Models.find(m => m.id === customModel.id)).toBeUndefined();
  });

  it('should return empty array when querying without userId', async () => {
    const makers = await db.getCarMakersByCountry('Lebanon', undefined);
    expect(makers).toEqual([]);

    const models = await db.getCarModelsByMaker(maker1Id, undefined);
    expect(models).toEqual([]);
  });

  it('should verify clients are isolated by userId', async () => {
    // Create clients for both users
    const client1 = await db.createClient({
      userId: user1Id,
      firstName: 'Client',
      lastName: 'One',
      nationality: 'Lebanese',
      phone: '+9611234567',
      drivingLicenseNumber: 'DL123456',
      licenseExpiryDate: new Date('2025-12-31'),
    });

    const client2 = await db.createClient({
      userId: user2Id,
      firstName: 'Client',
      lastName: 'Two',
      nationality: 'Lebanese',
      phone: '+9617654321',
      drivingLicenseNumber: 'DL654321',
      licenseExpiryDate: new Date('2025-12-31'),
    });

    // Verify user1 only sees their own clients
    const user1Clients = await db.getAllClients(user1Id);
    expect(user1Clients.find(c => c.id === client1.id)).toBeDefined();
    expect(user1Clients.find(c => c.id === client2.id)).toBeUndefined();

    // Verify user2 only sees their own clients
    const user2Clients = await db.getAllClients(user2Id);
    expect(user2Clients.find(c => c.id === client2.id)).toBeDefined();
    expect(user2Clients.find(c => c.id === client1.id)).toBeUndefined();
  });
});
