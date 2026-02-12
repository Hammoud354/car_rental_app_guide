import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number, userRole: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: userRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Maintenance WhatsApp Alerts", () => {
  let userId: number;
  let vehicleId: number;
  let settingsId: number;

  beforeEach(async () => {
    // Create a test user
    const user = await db.createUser({
      openId: `test-maintenance-alerts-${Date.now()}`,
      username: `testuser-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    });
    userId = user.id;

    // Create company settings with phone number
    const settings = await db.upsertCompanySettings({
      userId,
      companyName: "Test Company",
      phone: "+1234567890",
      exchangeRateLbpToUsd: 89700,
    });
    settingsId = settings.id;

    // Create a test vehicle with maintenance schedule
    const today = new Date();
    const nextMaintenanceDate = new Date(today);
    nextMaintenanceDate.setDate(today.getDate() + 5); // Due in 5 days

    const vehicle = await db.createVehicle({
      userId,
      plateNumber: `TST${Date.now().toString().slice(-6)}`,
      brand: "Toyota",
      model: "Camry",
      year: 2023,
      color: "Blue",
      mileage: 15000,
      dailyRate: 50,
      status: "available",
      nextMaintenanceDate: nextMaintenanceDate,
      nextMaintenanceKm: 20000,
    });
    vehicleId = vehicle.id;
  });

  it("should check for vehicles with maintenance due soon", async () => {
    const caller = appRouter.createCaller(createTestContext(userId));

    // The checkMaintenanceDue procedure doesn't exist as a standalone procedure
    // It's used internally by sendMaintenanceAlertWhatsApp
    // So we'll test the WhatsApp alert generation which includes the check
    const result = await caller.fleet.sendMaintenanceAlertWhatsApp();

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.alertCount).toBeGreaterThan(0);
    expect(result.whatsappUrl).toBeDefined();
    
    // Verify WhatsApp URL contains vehicle information
    const decodedMessage = decodeURIComponent(result.whatsappUrl!.split("text=")[1]);
    expect(decodedMessage).toContain("Toyota");
    expect(decodedMessage).toContain("Camry");
  });

  it("should generate WhatsApp alert URL with correct message format", async () => {
    const caller = appRouter.createCaller(createTestContext(userId));

    const result = await caller.fleet.sendMaintenanceAlertWhatsApp();

    expect(result.success).toBe(true);
    expect(result.whatsappUrl).toBeDefined();
    expect(result.alertCount).toBeGreaterThan(0);
    
    // Verify WhatsApp URL format
    expect(result.whatsappUrl).toContain("https://wa.me/");
    expect(result.whatsappUrl).toContain("+1234567890".replace(/[\s\-\(\)]/g, ""));
    expect(result.whatsappUrl).toContain("text=");
    
    // Verify message contains maintenance alert information
    const decodedMessage = decodeURIComponent(result.whatsappUrl!.split("text=")[1]);
    expect(decodedMessage).toContain("MAINTENANCE ALERT");
    expect(decodedMessage).toContain("Toyota");
    expect(decodedMessage).toContain("Camry");
  });

  it("should fail if company phone number is not set", async () => {
    // Create another user without phone number in settings
    const userWithoutPhone = await db.createUser({
      openId: `test-no-phone-${Date.now()}`,
      username: `nophone-${Date.now()}`,
      name: "Test User No Phone",
      email: "nophone@example.com",
      role: "user",
    });

    // Create settings without phone
    await db.upsertCompanySettings({
      userId: userWithoutPhone.id,
      companyName: "Test Company No Phone",
      exchangeRateLbpToUsd: 89700,
    });

    // Create a vehicle with maintenance due
    const today = new Date();
    const nextMaintenanceDate = new Date(today);
    nextMaintenanceDate.setDate(today.getDate() + 3);

    await db.createVehicle({
      userId: userWithoutPhone.id,
      plateNumber: `NPH${Date.now().toString().slice(-6)}`,
      brand: "Honda",
      model: "Civic",
      year: 2023,
      color: "Red",
      mileage: 10000,
      dailyRate: 40,
      status: "available",
      nextMaintenanceDate: nextMaintenanceDate,
      nextMaintenanceKm: 15000,
    });

    const caller = appRouter.createCaller(createTestContext(userWithoutPhone.id));

    await expect(caller.fleet.sendMaintenanceAlertWhatsApp()).rejects.toThrow(
      "Company phone number not set in settings"
    );
  });

  it("should return no alerts message when no maintenance is due", async () => {
    // Create a user with no vehicles needing maintenance
    const userNoAlerts = await db.createUser({
      openId: `test-no-alerts-${Date.now()}`,
      username: `noalerts-${Date.now()}`,
      name: "Test User No Alerts",
      email: "noalerts@example.com",
      role: "user",
    });

    await db.upsertCompanySettings({
      userId: userNoAlerts.id,
      companyName: "Test Company No Alerts",
      phone: "+9876543210",
      exchangeRateLbpToUsd: 89700,
    });

    // Create a vehicle with maintenance far in the future
    const today = new Date();
    const nextMaintenanceDate = new Date(today);
    nextMaintenanceDate.setDate(today.getDate() + 60); // 60 days away

    await db.createVehicle({
      userId: userNoAlerts.id,
      plateNumber: `NAL${Date.now().toString().slice(-6)}`,
      brand: "Ford",
      model: "Focus",
      year: 2023,
      color: "White",
      mileage: 5000,
      dailyRate: 35,
      status: "available",
      nextMaintenanceDate: nextMaintenanceDate,
      nextMaintenanceKm: 50000,
    });

    const caller = appRouter.createCaller(createTestContext(userNoAlerts.id));

    const result = await caller.fleet.sendMaintenanceAlertWhatsApp();

    expect(result.success).toBe(false);
    expect(result.message).toBe("No maintenance alerts to send");
    expect(result.whatsappUrl).toBeUndefined();
  });
});
