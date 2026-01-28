import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
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

  return { ctx };
}

describe("clients", () => {
  it("creates a new client with all details", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const client = await caller.clients.create({
      firstName: "John",
      lastName: "Doe",
      nationality: "American",
      phone: "+1234567890",
      address: "123 Main St, City, State 12345",
      drivingLicenseNumber: "DL123456789",
      licenseIssueDate: new Date("2020-01-01"),
      licenseExpiryDate: new Date("2030-01-01"),
    });

    expect(client).toMatchObject({
      firstName: "John",
      lastName: "Doe",
      nationality: "American",
      phone: "+1234567890",
      address: "123 Main St, City, State 12345",
      drivingLicenseNumber: "DL123456789",
    });
    expect(client.id).toBeGreaterThan(0);
  });

  it("lists all clients", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a client first
    await caller.clients.create({
      firstName: "Jane",
      lastName: "Smith",
      nationality: "Canadian",
      phone: "+1987654321",
      address: "456 Oak Ave, Town, Province A1B2C3",
      drivingLicenseNumber: "DL987654321",
      licenseIssueDate: new Date("2019-06-15"),
      licenseExpiryDate: new Date("2029-06-15"),
    });

    const clients = await caller.clients.list();
    
    expect(clients.length).toBeGreaterThan(0);
    const jane = clients.find((c) => c.firstName === "Jane" && c.lastName === "Smith");
    expect(jane).toBeDefined();
    expect(jane?.drivingLicenseNumber).toBe("DL987654321");
  });
});
