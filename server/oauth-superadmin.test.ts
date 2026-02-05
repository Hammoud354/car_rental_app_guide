import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('OAuth Super Admin Auto-Assignment', () => {
  beforeAll(async () => {
    // Clear owner user for clean test
    const user = await db.getUserByOpenId(process.env.OWNER_OPEN_ID!);
    if (user) {
      const database = await db.getDb();
      if (database) {
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await database.delete(users).where(eq(users.openId, process.env.OWNER_OPEN_ID!));
      }
    }
  });

  it('should automatically assign super_admin role to owner on first login', async () => {
    // Simulate OAuth callback creating user
    await db.upsertUser({
      openId: process.env.OWNER_OPEN_ID!,
      username: `oauth_${process.env.OWNER_OPEN_ID}`,
      name: 'Test Owner',
      email: 'owner@test.com',
      loginMethod: 'oauth',
      lastSignedIn: new Date(),
    });

    // Verify user was created with super_admin role
    const user = await db.getUserByOpenId(process.env.OWNER_OPEN_ID!);
    
    expect(user).toBeDefined();
    expect(user?.role).toBe('super_admin');
    expect(user?.username).toContain('oauth_');
  });

  it('should maintain super_admin role on subsequent logins', async () => {
    // Simulate second login (upsert should update lastSignedIn but keep role)
    await db.upsertUser({
      openId: process.env.OWNER_OPEN_ID!,
      username: `oauth_${process.env.OWNER_OPEN_ID}`,
      name: 'Test Owner Updated',
      email: 'owner@test.com',
      loginMethod: 'oauth',
      lastSignedIn: new Date(),
    });

    // Verify role is still super_admin
    const user = await db.getUserByOpenId(process.env.OWNER_OPEN_ID!);
    
    expect(user).toBeDefined();
    expect(user?.role).toBe('super_admin');
    expect(user?.name).toBe('Test Owner Updated');
  });

  it('should assign regular user role to non-owner accounts', async () => {
    const testOpenId = 'test_non_owner_12345';
    
    // Create non-owner user
    await db.upsertUser({
      openId: testOpenId,
      username: `oauth_${testOpenId}`,
      name: 'Regular User',
      email: 'regular@test.com',
      loginMethod: 'oauth',
      lastSignedIn: new Date(),
    });

    // Verify user was created with user role (not super_admin)
    const user = await db.getUserByOpenId(testOpenId);
    
    expect(user).toBeDefined();
    expect(user?.role).toBe('user');
    
    // Clean up
    const database = await db.getDb();
    if (database) {
      const { users } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      await database.delete(users).where(eq(users.openId, testOpenId));
    }
  });
});
