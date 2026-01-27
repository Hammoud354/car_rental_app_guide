import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
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

describe("contracts", () => {
  it("creates a rental contract", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First create a vehicle
    const vehicle = await caller.fleet.create({
      plateNumber: `CTR-${Date.now()}-1`,
      brand: "Toyota",
      model: "Camry",
      year: 2024,
      color: "Silver",
      category: "Midsize",
      status: "Available",
      dailyRate: "50.00",
    });

    // Create a contract
    const contract = await caller.contracts.create({
      vehicleId: vehicle.id,
      clientFirstName: "John",
      clientLastName: "Doe",
      clientNationality: "American",
      clientPhone: "+1 555 123 4567",
      clientAddress: "123 Main St, New York, NY 10001",
      drivingLicenseNumber: "DL123456",
      licenseIssueDate: new Date("2020-01-01"),
      licenseExpiryDate: new Date("2030-01-01"),
      rentalStartDate: new Date("2026-02-01"),
      rentalEndDate: new Date("2026-02-05"),
      signatureData: "data:image/png;base64,test",
    });

    expect(contract).toBeDefined();
    expect(contract.clientFirstName).toBe("John");
    expect(contract.clientLastName).toBe("Doe");
    expect(contract.clientPhone).toBe("+1 555 123 4567");
    expect(contract.clientAddress).toBe("123 Main St, New York, NY 10001");
    expect(contract.drivingLicenseNumber).toBe("DL123456");
    expect(contract.vehicleId).toBe(vehicle.id);
  });

  it("retrieves all contracts", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const contracts = await caller.contracts.list();
    expect(Array.isArray(contracts)).toBe(true);
  });

  it("adds damage marks to a contract", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create vehicle and contract
    const vehicle = await caller.fleet.create({
      plateNumber: `CTR-${Date.now()}-2`,
      brand: "Honda",
      model: "Civic",
      year: 2024,
      color: "Blue",
      category: "Compact",
      status: "Available",
      dailyRate: "45.00",
    });

    const contract = await caller.contracts.create({
      vehicleId: vehicle.id,
      clientFirstName: "Jane",
      clientLastName: "Smith",
      drivingLicenseNumber: "DL789012",
      licenseExpiryDate: new Date("2029-12-31"),
      rentalStartDate: new Date("2026-02-10"),
      rentalEndDate: new Date("2026-02-15"),
      signatureData: "data:image/png;base64,test",
    });

    // Add damage mark
    await caller.contracts.addDamageMark({
      contractId: contract.id,
      xPosition: "25.5",
      yPosition: "40.2",
      description: "Small scratch on front bumper",
    });

    // Retrieve damage marks
    const marks = await caller.contracts.getDamageMarks({ contractId: contract.id });
    expect(marks.length).toBeGreaterThan(0);
    expect(marks[0]?.xPosition).toBe("25.50");
    expect(marks[0]?.description).toBe("Small scratch on front bumper");
  });
});
