import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { companySettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";

describe("Settings Router - Exchange Rate", () => {
  const mockUser = {
    id: 999,
    openId: "test-user-123",
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
    loginMethod: "manus" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const mockContext: TrpcContext = {
    user: mockUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  beforeEach(async () => {
    // Clean up test data before each test
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db.delete(companySettings).where(eq(companySettings.userId, mockUser.id));
  });

  it("should return null when no settings exist", async () => {
    const caller = appRouter.createCaller(mockContext);
    const result = await caller.settings.get();

    // When no settings exist, the endpoint returns null
    expect(result).toBeNull();
  });

  it("should create company settings with exchange rate on first update", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    // Update exchange rate for the first time
    await caller.settings.update({ companyName: "Test Company", exchangeRateLbpToUsd: 95000 });

    // Fetch the updated rate
    const result = await caller.settings.get();
    
    expect(result.exchangeRateLbpToUsd).toBe("95000.00");
  });

  it("should update existing exchange rate", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    // Set initial rate
    await caller.settings.update({ companyName: "Test Company", exchangeRateLbpToUsd: 90000 });
    
    // Update to new rate
    await caller.settings.update({ companyName: "Test Company", exchangeRateLbpToUsd: 100000 });
    
    // Verify the rate was updated
    const result = await caller.settings.get();
    expect(result.exchangeRateLbpToUsd).toBe("100000.00");
  });

  it("should handle decimal exchange rates", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    // Set rate with decimals
    await caller.settings.update({ companyName: "Test Company", exchangeRateLbpToUsd: 89750.50 });
    
    const result = await caller.settings.get();
    expect(result.exchangeRateLbpToUsd).toBe("89750.50");
  });

  it("should reject invalid exchange rates", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    // Test negative rate
    await expect(
      caller.settings.update({ companyName: "Test Company", exchangeRateLbpToUsd: -1000 })
    ).rejects.toThrow();
    
    // Test zero rate
    await expect(
      caller.settings.update({ companyName: "Test Company", exchangeRateLbpToUsd: 0 })
    ).rejects.toThrow();
  });

  it("should isolate exchange rates by user", async () => {
    const caller1 = appRouter.createCaller(mockContext);
    const caller2 = appRouter.createCaller({
      ...mockContext,
      user: {
        ...mockUser,
        id: 2,
        openId: "test-user-456",
        email: "test2@example.com",
      },
    });

    // User 1 sets rate to 95000
    await caller1.settings.update({ companyName: "Company 1", exchangeRateLbpToUsd: 95000 });
    
    // User 2 sets rate to 100000
    await caller2.settings.update({ companyName: "Company 2", exchangeRateLbpToUsd: 100000 });
    
    // Verify each user gets their own rate
    const result1 = await caller1.settings.get();
    const result2 = await caller2.settings.get();
    
    expect(result1.exchangeRateLbpToUsd).toBe("95000.00");
    expect(result2.exchangeRateLbpToUsd).toBe("100000.00");
    
    // Clean up user 2
    const db = await getDb();
    if (db) {
      await db.delete(companySettings).where(eq(companySettings.userId, 2));
    }
  });

  it("should persist exchange rate across multiple fetches", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    // Set rate
    await caller.settings.update({ companyName: "Test Company", exchangeRateLbpToUsd: 92000 });
    
    // Fetch multiple times
    const result1 = await caller.settings.get();
    const result2 = await caller.settings.get();
    const result3 = await caller.settings.get();
    
    expect(result1.exchangeRateLbpToUsd).toBe("92000.00");
    expect(result2.exchangeRateLbpToUsd).toBe("92000.00");
    expect(result3.exchangeRateLbpToUsd).toBe("92000.00");
  });

  it("should handle very large exchange rates", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    // Set a very large rate (e.g., hyperinflation scenario)
    await caller.settings.update({ companyName: "Test Company", exchangeRateLbpToUsd: 1000000 });
    
    const result = await caller.settings.get();
    expect(result.exchangeRateLbpToUsd).toBe("1000000.00");
  });
});
