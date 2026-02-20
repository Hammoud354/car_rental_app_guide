import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { companyProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";

describe("Company Profile - Logo and Currency Settings", () => {
  const mockUser = {
    id: 9999,
    openId: "test-company-user-123",
    name: "Test Company User",
    email: "company@example.com",
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
    
    await db.delete(companyProfiles).where(eq(companyProfiles.userId, mockUser.id));
  });

  it("should create company profile with logo URL", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const logoUrl = "https://example.com/logo.png";
    const profile = await caller.company.updateProfile({
      companyName: "Test Company",
      logoUrl,
      registrationNumber: "REG123",
      taxId: "TAX456",
    });

    expect(profile).toBeDefined();
    expect(profile?.logoUrl).toBe(logoUrl);
    expect(profile?.companyName).toBe("Test Company");
  });

  it("should retrieve company profile with logo URL", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const logoUrl = "https://example.com/logo.png";
    
    // Create profile
    await caller.company.updateProfile({
      companyName: "Test Company",
      logoUrl,
    });

    // Retrieve profile
    const profile = await caller.company.getProfile();

    expect(profile).toBeDefined();
    expect(profile?.logoUrl).toBe(logoUrl);
  });

  it("should update logo URL on existing profile", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const logoUrl1 = "https://example.com/logo1.png";
    const logoUrl2 = "https://example.com/logo2.png";
    
    // Create with first logo
    await caller.company.updateProfile({
      companyName: "Test Company",
      logoUrl: logoUrl1,
    });

    // Update with second logo
    const updated = await caller.company.updateProfile({
      companyName: "Test Company",
      logoUrl: logoUrl2,
    });

    expect(updated?.logoUrl).toBe(logoUrl2);

    // Verify in database
    const retrieved = await caller.company.getProfile();
    expect(retrieved?.logoUrl).toBe(logoUrl2);
  });

  it("should save and retrieve exchange rate", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const exchangeRate = 89700;
    const profile = await caller.company.updateProfile({
      companyName: "Test Company",
      exchangeRate,
      defaultCurrency: "USD",
      localCurrencyCode: "LBP",
    });

    expect(profile?.exchangeRate).toBe("89700.0000");
    
    // Verify retrieval
    const retrieved = await caller.company.getProfile();
    expect(retrieved?.exchangeRate).toBe("89700.0000");
  });

  it("should persist exchange rate across multiple updates", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const exchangeRate = 89700;
    
    // Create with exchange rate
    await caller.company.updateProfile({
      companyName: "Test Company",
      exchangeRate,
      defaultCurrency: "USD",
    });

    // Update other fields without changing exchange rate
    await caller.company.updateProfile({
      companyName: "Updated Company",
      exchangeRate,
      defaultCurrency: "USD",
    });

    // Verify exchange rate is still there
    const retrieved = await caller.company.getProfile();
    expect(retrieved?.exchangeRate).toBe("89700.0000");
  });

  it("should auto-detect currency code from country", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const profile = await caller.company.updateProfile({
      companyName: "Test Company",
      country: "United Arab Emirates",
      // Not providing localCurrencyCode - should auto-detect
    });

    // Should auto-detect AED for UAE
    expect(profile?.localCurrencyCode).toBe("AED");
  });

  it("should allow manual currency code override", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const profile = await caller.company.updateProfile({
      companyName: "Test Company",
      country: "United Arab Emirates",
      localCurrencyCode: "LBP", // Override auto-detection
    });

    expect(profile?.localCurrencyCode).toBe("LBP");
  });

  it("should save logo and exchange rate together", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const logoUrl = "https://example.com/logo.png";
    const exchangeRate = 89700;
    
    const profile = await caller.company.updateProfile({
      companyName: "Test Company",
      logoUrl,
      exchangeRate,
      defaultCurrency: "USD",
      localCurrencyCode: "LBP",
    });

    expect(profile?.logoUrl).toBe(logoUrl);
    expect(profile?.exchangeRate).toBe("89700.0000");
    expect(profile?.localCurrencyCode).toBe("LBP");

    // Verify both are persisted
    const retrieved = await caller.company.getProfile();
    expect(retrieved?.logoUrl).toBe(logoUrl);
    expect(retrieved?.exchangeRate).toBe("89700.0000");
    expect(retrieved?.localCurrencyCode).toBe("LBP");
  });

  it("should handle empty string logo URL", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const profile = await caller.company.updateProfile({
      companyName: "Test Company",
      logoUrl: "",
    });

    expect(profile?.logoUrl).toBe("");
  });

  it("should isolate company profiles by user", async () => {
    const user2 = {
      ...mockUser,
      id: 10000,
      openId: "test-company-user-456",
      email: "company2@example.com",
    };

    const caller1 = appRouter.createCaller(mockContext);
    const caller2 = appRouter.createCaller({
      ...mockContext,
      user: user2,
    });

    const logo1 = "https://example.com/logo1.png";
    const logo2 = "https://example.com/logo2.png";

    // User 1 creates profile with logo1
    await caller1.company.updateProfile({
      companyName: "Company 1",
      logoUrl: logo1,
      exchangeRate: 89700,
    });

    // User 2 creates profile with logo2
    await caller2.company.updateProfile({
      companyName: "Company 2",
      logoUrl: logo2,
      exchangeRate: 90000,
    });

    // Verify isolation
    const profile1 = await caller1.company.getProfile();
    const profile2 = await caller2.company.getProfile();

    expect(profile1?.logoUrl).toBe(logo1);
    expect(profile1?.exchangeRate).toBe("89700.0000");
    expect(profile2?.logoUrl).toBe(logo2);
    expect(profile2?.exchangeRate).toBe("90000.0000");

    // Clean up user 2
    const db = await getDb();
    if (db) {
      await db.delete(companyProfiles).where(eq(companyProfiles.userId, user2.id));
    }
  });

  it("should handle decimal exchange rates", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    const exchangeRate = 89700.5555;
    const profile = await caller.company.updateProfile({
      companyName: "Test Company",
      exchangeRate,
    });

    expect(profile?.exchangeRate).toBe("89700.5555");

    const retrieved = await caller.company.getProfile();
    expect(retrieved?.exchangeRate).toBe("89700.5555");
  });
});
