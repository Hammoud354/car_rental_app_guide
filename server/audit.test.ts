import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Audit Log System', () => {
  let superAdminId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Get the super admin
    const superAdmin = await db.getUserByOpenId(process.env.OWNER_OPEN_ID!);
    if (!superAdmin) throw new Error("Super admin not found");
    superAdminId = superAdmin.id;

    // Create a test user
    const testUser = await db.createUser({
      username: `audit_test_user_${Date.now()}`,
      password: 'test_password',
      name: 'Audit Test User',
      email: `audit_test_${Date.now()}@test.com`,
      phone: '+1234567890',
      country: 'Test Country',
    });
    testUserId = testUser.id;
  });

  describe('Audit Log Creation', () => {
    it('should create audit log for role change', async () => {
      // Change user role
      await db.updateUserRole(testUserId, 'admin', superAdminId);

      // Get recent audit logs
      const logs = await db.getAuditLogs(10, 0);
      
      // Find the role change log
      const roleChangeLog = logs.find(
        log => log.action === 'role_change' && log.targetUserId === testUserId
      );

      expect(roleChangeLog).toBeDefined();
      expect(roleChangeLog?.actorId).toBe(superAdminId);
      expect(roleChangeLog?.action).toBe('role_change');
      expect(roleChangeLog?.details).toContain('Changed role from user to admin');
      expect(roleChangeLog?.previousState).toEqual({ role: 'user' });
      expect(roleChangeLog?.newState).toEqual({ role: 'admin' });
    });

    it('should create audit log for user deletion', async () => {
      // Create a temporary user to delete
      const tempUser = await db.createUser({
        username: `temp_audit_user_${Date.now()}`,
        password: 'test_password',
        name: 'Temp Audit User',
        email: `temp_audit_${Date.now()}@test.com`,
        phone: '+1234567890',
        country: 'Test Country',
      });

      // Delete the user
      await db.deleteUser(tempUser.id, superAdminId);

      // Get recent audit logs
      const logs = await db.getAuditLogs(10, 0);
      
      // Find the deletion log
      const deleteLog = logs.find(
        log => log.action === 'user_delete' && log.targetUserId === tempUser.id
      );

      expect(deleteLog).toBeDefined();
      expect(deleteLog?.actorId).toBe(superAdminId);
      expect(deleteLog?.action).toBe('user_delete');
      expect(deleteLog?.details).toContain('Deleted user account');
      expect(deleteLog?.previousState).toBeDefined();
      expect(deleteLog?.previousState?.username).toBe(tempUser.username);
    });
  });

  describe('Audit Log Retrieval', () => {
    it('should retrieve all audit logs', async () => {
      const logs = await db.getAuditLogs(100, 0);
      
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      
      // Verify log structure
      const firstLog = logs[0];
      expect(firstLog).toHaveProperty('id');
      expect(firstLog).toHaveProperty('actorId');
      expect(firstLog).toHaveProperty('actorUsername');
      expect(firstLog).toHaveProperty('action');
      expect(firstLog).toHaveProperty('details');
      expect(firstLog).toHaveProperty('createdAt');
    });

    it('should retrieve audit logs by user', async () => {
      const logs = await db.getAuditLogsByUser(testUserId, 50);
      
      expect(Array.isArray(logs)).toBe(true);
      
      // All logs should involve the test user
      logs.forEach(log => {
        const involvesUser = 
          log.actorId === testUserId || 
          log.targetUserId === testUserId;
        expect(involvesUser).toBe(true);
      });
    });

    it('should retrieve audit logs by action type', async () => {
      const logs = await db.getAuditLogsByAction('role_change', 50);
      
      expect(Array.isArray(logs)).toBe(true);
      
      // All logs should be role changes
      logs.forEach(log => {
        expect(log.action).toBe('role_change');
      });
    });

    it('should parse JSON state correctly', async () => {
      const logs = await db.getAuditLogs(10, 0);
      
      const logWithState = logs.find(log => log.previousState || log.newState);
      
      if (logWithState) {
        if (logWithState.previousState) {
          expect(typeof logWithState.previousState).toBe('object');
        }
        if (logWithState.newState) {
          expect(typeof logWithState.newState).toBe('object');
        }
      }
    });
  });

  describe('Audit Log Ordering', () => {
    it('should return logs in descending order by timestamp', async () => {
      const logs = await db.getAuditLogs(10, 0);
      
      if (logs.length > 1) {
        for (let i = 0; i < logs.length - 1; i++) {
          const currentTime = new Date(logs[i].createdAt).getTime();
          const nextTime = new Date(logs[i + 1].createdAt).getTime();
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);
        }
      }
    });
  });

  describe('Audit Log Immutability', () => {
    it('should record actor information at time of action', async () => {
      const logs = await db.getAuditLogs(10, 0);
      
      logs.forEach(log => {
        expect(log.actorUsername).toBeTruthy();
        expect(log.actorRole).toBeTruthy();
        expect(['user', 'admin', 'super_admin']).toContain(log.actorRole);
      });
    });
  });
});
