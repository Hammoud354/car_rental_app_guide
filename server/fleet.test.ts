import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("fleet.list", () => {
  it("returns an array of vehicles", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.fleet.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("fleet.create", () => {
  it("creates a new vehicle with valid data", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const vehicleData = {
      plateNumber: `TEST-${Date.now()}`,
      brand: "Toyota",
      model: "Camry",
      year: 2024,
      color: "Silver",
      category: "Midsize" as const,
      status: "Available" as const,
      dailyRate: "45.00",
      weeklyRate: "280.00",
      monthlyRate: "1000.00",
      mileage: 0,
    };

    const result = await caller.fleet.create(vehicleData);

    expect(result).toBeDefined();
  });

  it("rejects vehicle creation with invalid year", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const vehicleData = {
      plateNumber: "INVALID-YEAR",
      brand: "Toyota",
      model: "Camry",
      year: 1800, // Invalid year
      color: "Silver",
      category: "Midsize" as const,
      status: "Available" as const,
      dailyRate: "45.00",
    };

    await expect(caller.fleet.create(vehicleData)).rejects.toThrow();
  });
});

describe("fleet.update", () => {
  it("updates vehicle status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First create a vehicle
    const vehicleData = {
      plateNumber: `UPD-${Date.now().toString().slice(-8)}`,
      brand: "Honda",
      model: "Accord",
      year: 2023,
      color: "Black",
      category: "Midsize" as const,
      status: "Available" as const,
      dailyRate: "50.00",
    };

    await caller.fleet.create(vehicleData);

    // Get all vehicles to find the one we just created
    const vehicles = await caller.fleet.list();
    const createdVehicle = vehicles.find(v => v.plateNumber === vehicleData.plateNumber);

    if (!createdVehicle) {
      throw new Error("Vehicle not found after creation");
    }

    // Update the vehicle status
    const result = await caller.fleet.update({
      id: createdVehicle.id,
      data: {
        status: "Maintenance",
      },
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updatedVehicle = await caller.fleet.getById({ id: createdVehicle.id });
    expect(updatedVehicle?.status).toBe("Maintenance");
  });
});

describe("fleet.delete", () => {
  it("deletes a vehicle", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First create a vehicle
    const vehicleData = {
      plateNumber: `DEL-${Date.now().toString().slice(-8)}`,
      brand: "Ford",
      model: "F-150",
      year: 2023,
      color: "Blue",
      category: "Truck" as const,
      status: "Available" as const,
      dailyRate: "75.00",
    };

    await caller.fleet.create(vehicleData);

    // Get all vehicles to find the one we just created
    const vehicles = await caller.fleet.list();
    const createdVehicle = vehicles.find(v => v.plateNumber === vehicleData.plateNumber);

    if (!createdVehicle) {
      throw new Error("Vehicle not found after creation");
    }

    // Delete the vehicle
    const result = await caller.fleet.delete({ id: createdVehicle.id });

    expect(result.success).toBe(true);

    // Verify the deletion
    const deletedVehicle = await caller.fleet.getById({ id: createdVehicle.id });
    expect(deletedVehicle).toBeUndefined();
  });
});
