import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
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

describe("maintenance tracking", () => {
  it("adds a maintenance record with all details", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a vehicle
    const vehicle = await caller.fleet.create({
      plateNumber: `TM-${Date.now()}`.substring(0, 20),
      brand: "Toyota",
      model: "Camry",
      year: 2023,
      color: "Silver",
      category: "Economy",
      status: "Available",
      dailyRate: "50.00",
      weeklyRate: "300.00",
      monthlyRate: "1000.00",
      mileage: 15000,
    });

    // Add a maintenance record
    const maintenanceRecord = await caller.fleet.addMaintenanceRecord({
      vehicleId: vehicle.id,
      maintenanceType: "Routine",
      description: "Oil change and filter replacement",
      cost: "85.50",
      performedAt: new Date("2024-01-15"),
      performedBy: "John Smith",
      garageLocation: "Downtown Auto Center",
      mileageAtService: 15000,
      nextServiceDue: new Date("2024-07-15"),
    });

    expect(maintenanceRecord).toBeDefined();
    expect(maintenanceRecord.vehicleId).toBe(vehicle.id);
    expect(maintenanceRecord.maintenanceType).toBe("Routine");
    expect(maintenanceRecord.description).toBe("Oil change and filter replacement");
    expect(maintenanceRecord.garageLocation).toBe("Downtown Auto Center");
    expect(maintenanceRecord.mileageAtService).toBe(15000);
  });

  it("retrieves maintenance history for a vehicle", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a vehicle
    const vehicle = await caller.fleet.create({
      plateNumber: `TH-${Date.now()}`.substring(0, 20),
      brand: "Honda",
      model: "Accord",
      year: 2022,
      color: "Blue",
      category: "Economy",
      status: "Available",
      dailyRate: "55.00",
      weeklyRate: "330.00",
      monthlyRate: "1100.00",
      mileage: 25000,
    });

    // Add multiple maintenance records
    await caller.fleet.addMaintenanceRecord({
      vehicleId: vehicle.id,
      maintenanceType: "Routine",
      description: "Regular service",
      performedAt: new Date("2024-01-10"),
      garageLocation: "Main Street Garage",
      mileageAtService: 20000,
    });

    await caller.fleet.addMaintenanceRecord({
      vehicleId: vehicle.id,
      maintenanceType: "Repair",
      description: "Brake pad replacement",
      cost: "250.00",
      performedAt: new Date("2024-02-15"),
      garageLocation: "Quick Fix Auto",
      mileageAtService: 22000,
    });

    // Retrieve maintenance history
    const history = await caller.fleet.getMaintenanceRecords({
      vehicleId: vehicle.id,
    });

    expect(history).toHaveLength(2);
    expect(history[0]?.maintenanceType).toBe("Routine");
    expect(history[1]?.maintenanceType).toBe("Repair");
    expect(history[0]?.garageLocation).toBe("Main Street Garage");
    expect(history[1]?.garageLocation).toBe("Quick Fix Auto");
  });

  it("handles maintenance record with minimal required fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a vehicle
    const vehicle = await caller.fleet.create({
      plateNumber: `TMN-${Date.now()}`.substring(0, 20),
      brand: "Ford",
      model: "Focus",
      year: 2021,
      color: "Red",
      category: "Economy",
      status: "Available",
      dailyRate: "45.00",
      weeklyRate: "270.00",
      monthlyRate: "900.00",
    });

    // Add maintenance record with only required fields
    const maintenanceRecord = await caller.fleet.addMaintenanceRecord({
      vehicleId: vehicle.id,
      maintenanceType: "Inspection",
      description: "Annual safety inspection",
      performedAt: new Date("2024-03-01"),
    });

    expect(maintenanceRecord).toBeDefined();
    expect(maintenanceRecord.maintenanceType).toBe("Inspection");
    expect(maintenanceRecord.description).toBe("Annual safety inspection");
  });
});
