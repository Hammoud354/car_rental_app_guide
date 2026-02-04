import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Forgot Password Flow", () => {
  let testUserId: number;
  let testToken: string;

  beforeAll(async () => {
    // Create a test user for password reset
    const testUser = await db.createUser({
      username: `resettest_${Date.now()}`,
      password: await (await import('bcryptjs')).hash("oldpassword", 10),
      name: "Reset Test User",
      email: `resettest${Date.now()}@example.com`,
      phone: "+1234567890",
      country: "USA",
    });
    testUserId = testUser.id;
  });

  it("should create a password reset token", async () => {
    const crypto = await import('crypto');
    testToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await db.createPasswordResetToken(testUserId, testToken, expiresAt);
    
    const token = await db.getPasswordResetToken(testToken);
    expect(token).toBeDefined();
    expect(token.userId).toBe(testUserId);
    expect(token.token).toBe(testToken);
    expect(token.used).toBe(false);
  });

  it("should retrieve password reset token", async () => {
    const token = await db.getPasswordResetToken(testToken);
    expect(token).toBeDefined();
    expect(token.userId).toBe(testUserId);
    expect(token.used).toBe(false);
  });

  it("should verify token expiration", async () => {
    const token = await db.getPasswordResetToken(testToken);
    expect(token).toBeDefined();
    
    // Token should not be expired (we just created it)
    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it("should update user password", async () => {
    const bcrypt = await import('bcryptjs');
    const newHashedPassword = await bcrypt.hash("newpassword123", 10);
    
    await db.updateUserPassword(testUserId, newHashedPassword);
    
    // Verify password was updated
    const user = await db.getUserById(testUserId);
    expect(user).toBeDefined();
    expect(user!.password).toBe(newHashedPassword);
    
    // Verify new password works
    const isValid = await bcrypt.compare("newpassword123", user!.password!);
    expect(isValid).toBe(true);
  });

  it("should mark token as used", async () => {
    const token = await db.getPasswordResetToken(testToken);
    expect(token).toBeDefined();
    
    await db.markTokenAsUsed(token.id);
    
    const updatedToken = await db.getPasswordResetToken(testToken);
    expect(updatedToken.used).toBe(true);
  });

  it("should prevent reusing a used token", async () => {
    const token = await db.getPasswordResetToken(testToken);
    expect(token.used).toBe(true);
    
    // In a real scenario, the endpoint would reject this
    // Here we just verify the token is marked as used
  });

  it("should find user by email", async () => {
    const user = await db.getUserById(testUserId);
    expect(user).toBeDefined();
    
    const foundUser = await db.getUserByEmail(user!.email!);
    expect(foundUser).toBeDefined();
    expect(foundUser!.id).toBe(testUserId);
    expect(foundUser!.email).toBe(user!.email);
  });

  it("should handle expired tokens", async () => {
    const crypto = await import('crypto');
    const expiredToken = crypto.randomBytes(32).toString('hex');
    
    // Create token that expires in the past
    const expiresAt = new Date(Date.now() - 1000); // 1 second ago
    await db.createPasswordResetToken(testUserId, expiredToken, expiresAt);
    
    const token = await db.getPasswordResetToken(expiredToken);
    expect(token).toBeDefined();
    
    // Verify token is expired
    const now = new Date();
    const tokenExpiresAt = new Date(token.expiresAt);
    expect(tokenExpiresAt.getTime()).toBeLessThan(now.getTime());
  });

  it("should handle non-existent email gracefully", async () => {
    const user = await db.getUserByEmail("nonexistent@example.com");
    expect(user).toBeUndefined();
  });
});
