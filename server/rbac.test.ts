import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Role-Based Access Control', () => {
  let superAdminId: number;
  let adminId: number;
  let regularUserId: number;

  beforeAll(async () => {
    // Get the super admin (current user)
    const superAdmin = await db.getUserByOpenId(process.env.OWNER_OPEN_ID!);
    if (!superAdmin) throw new Error("Super admin not found");
    superAdminId = superAdmin.id;

    // Create a test admin user
    const adminUser = await db.createUser({
      username: `test_admin_${Date.now()}`,
      password: 'test_password',
      name: 'Test Admin',
      email: `admin_${Date.now()}@test.com`,
      phone: '+1234567890',
      country: 'Test Country',
    });
    adminId = adminUser.id;
    
    // Promote to admin
    await db.updateUserRole(adminId, 'admin', superAdminId);

    // Create a regular user
    const regularUser = await db.createUser({
      username: `test_user_${Date.now()}`,
      password: 'test_password',
      name: 'Test User',
      email: `user_${Date.now()}@test.com`,
      phone: '+1234567890',
      country: 'Test Country',
    });
    regularUserId = regularUser.id;
  });

  describe('Super Admin Privileges', () => {
    it('should have super_admin role', async () => {
      const user = await db.getUserById(superAdminId);
      expect(user?.role).toBe('super_admin');
    });

    it('should be able to list all users', async () => {
      const users = await db.listAllUsers();
      expect(users.length).toBeGreaterThan(0);
      expect(users.some(u => u.id === superAdminId)).toBe(true);
    });

    it('should be able to update user roles', async () => {
      const updatedUser = await db.updateUserRole(regularUserId, 'admin', superAdminId);
      expect(updatedUser?.role).toBe('admin');
      
      // Revert back
      await db.updateUserRole(regularUserId, 'user', superAdminId);
    });

    it('should be able to delete users', async () => {
      // Create a temporary user to delete
      const tempUser = await db.createUser({
        username: `temp_user_${Date.now()}`,
        password: 'test_password',
        name: 'Temp User',
        email: `temp_${Date.now()}@test.com`,
        phone: '+1234567890',
        country: 'Test Country',
      });

      const result = await db.deleteUser(tempUser.id, superAdminId);
      expect(result.success).toBe(true);

      // Verify user is deleted
      const deletedUser = await db.getUserById(tempUser.id);
      expect(deletedUser).toBeUndefined();
    });
  });

  describe('Role Protection', () => {
    it('should prevent non-super-admin from changing roles', async () => {
      await expect(
        db.updateUserRole(regularUserId, 'admin', adminId)
      ).rejects.toThrow('Only Super Admin can change user roles');
    });

    it('should prevent non-super-admin from deleting users', async () => {
      await expect(
        db.deleteUser(regularUserId, adminId)
      ).rejects.toThrow('Only Super Admin can delete users');
    });

    it('should prevent modifying super admin role', async () => {
      await expect(
        db.updateUserRole(superAdminId, 'user', superAdminId)
      ).rejects.toThrow('Cannot modify Super Admin role');
    });

    it('should prevent deleting super admin', async () => {
      await expect(
        db.deleteUser(superAdminId, superAdminId)
      ).rejects.toThrow('Cannot delete Super Admin');
    });

    it('should prevent promoting users to super admin', async () => {
      await expect(
        db.updateUserRole(regularUserId, 'super_admin' as any, superAdminId)
      ).rejects.toThrow('Cannot promote users to Super Admin');
    });
  });

  describe('Admin Role', () => {
    it('should have admin role after promotion', async () => {
      const user = await db.getUserById(adminId);
      expect(user?.role).toBe('admin');
    });

    it('should not be able to change other user roles', async () => {
      await expect(
        db.updateUserRole(regularUserId, 'admin', adminId)
      ).rejects.toThrow('Only Super Admin can change user roles');
    });
  });

  describe('Regular User Role', () => {
    it('should have user role by default', async () => {
      const user = await db.getUserById(regularUserId);
      expect(user?.role).toBe('user');
    });

    it('should not be able to change roles', async () => {
      await expect(
        db.updateUserRole(adminId, 'user', regularUserId)
      ).rejects.toThrow('Only Super Admin can change user roles');
    });

    it('should not be able to delete users', async () => {
      await expect(
        db.deleteUser(adminId, regularUserId)
      ).rejects.toThrow('Only Super Admin can delete users');
    });
  });
});
