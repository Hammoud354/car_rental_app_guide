import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { appRouter } from "./routers";
import { eq } from "drizzle-orm";
import { rentalContracts, invoices } from "../drizzle/schema";

describe("Invoice Creation on Contract Creation", () => {
  let testUserId: number;
  let testVehicleId: number;
  let testClientId: number;

  beforeAll(async () => {
    // Create test user
    const testUser = await db.createUser({
      username: `test_contract_invoice_${Date.now()}`,
      password: "test123",
      name: "Contract Invoice Test User",
      email: "contractinvoice@example.com",
      phone: "+1234567890",
      country: "US",
    });
    testUserId = testUser.id;

    // Create test vehicle
    const vehicle = await db.createVehicle({
      userId: testUserId,
      plateNumber: `TCINV${Date.now() % 100000}`,
      brand: "Honda",
      model: "Accord",
      year: 2024,
      color: "Black",
      category: "Midsize",
      dailyRate: "60.00",
      mileage: 5000,
    });
    testVehicleId = vehicle.id;

    // Create test client
    const client = await db.createClient({
      userId: testUserId,
      firstName: "Jane",
      lastName: "Smith",
      drivingLicenseNumber: `LIC-CINV-${Date.now()}`,
      licenseExpiryDate: new Date(2030, 11, 31),
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    const dbInstance = await db.getDb();
    if (dbInstance) {
      // Delete invoices first (foreign key constraint)
      await dbInstance.delete(invoices).where(eq(invoices.userId, testUserId));
      // Delete contracts
      await dbInstance.delete(rentalContracts).where(eq(rentalContracts.userId, testUserId));
      // Note: We don't delete user, vehicle, client as they might be used by other tests
    }
  });

  it("should create invoice immediately when contract is created", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, role: "user" },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 5); // 5 day rental

    // Create contract
    const result = await caller.contracts.create({
      vehicleId: testVehicleId,
      clientFirstName: "Jane",
      clientLastName: "Smith",
      clientNationality: "American",
      clientPhone: "+1234567890",
      clientAddress: "123 Test St",
      drivingLicenseNumber: `LIC-CINV-${Date.now()}`,
      licenseIssueDate: new Date(2020, 0, 1),
      licenseExpiryDate: new Date(2030, 11, 31),
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      rentalDays: 5,
      dailyRate: "60.00",
      totalAmount: "300.00",
      discount: "0.00",
      finalAmount: "300.00",
      fuelLevel: "Full",
      pickupKm: 5000,
    });

    // Verify contract was created
    expect(result.id).toBeDefined();
    expect(result.contractNumber).toMatch(/^CTR-\d{3}$/);

    // Verify invoice was created and returned
    expect(result.invoice).toBeDefined();
    expect(result.invoice.invoiceNumber).toMatch(/^INV-\d{8}-\d{6}-\d{3}$/);
    expect(result.invoice.contractId).toBe(result.id);
    expect(result.invoice.userId).toBe(testUserId);
    expect(result.invoice.paymentStatus).toBe("pending");

    // Verify invoice exists in database
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const invoiceInDb = await dbInstance
      .select()
      .from(invoices)
      .where(eq(invoices.contractId, result.id))
      .limit(1);

    expect(invoiceInDb.length).toBe(1);
    expect(invoiceInDb[0].invoiceNumber).toBe(result.invoice.invoiceNumber);
  });

  it("should calculate correct invoice amounts on contract creation", async () => {
    // Create a new vehicle for this test to avoid conflicts
    const vehicle2 = await db.createVehicle({
      userId: testUserId,
      plateNumber: `TCINV2-${Date.now() % 100000}`,
      brand: "Toyota",
      model: "Camry",
      year: 2024,
      color: "Silver",
      category: "Midsize",
      dailyRate: "60.00",
      mileage: 8000,
    });

    const caller = appRouter.createCaller({
      user: { id: testUserId, role: "user" },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 10); // 10 day rental

    // Create contract with discount
    const result = await caller.contracts.create({
      vehicleId: vehicle2.id,
      clientFirstName: "Jane",
      clientLastName: "Smith",
      clientNationality: "American",
      clientPhone: "+1234567890",
      clientAddress: "123 Test St",
      drivingLicenseNumber: `LIC-CINV-${Date.now()}`,
      licenseIssueDate: new Date(2020, 0, 1),
      licenseExpiryDate: new Date(2030, 11, 31),
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      rentalDays: 10,
      dailyRate: "60.00",
      totalAmount: "600.00",
      discount: "50.00",
      finalAmount: "550.00",
      fuelLevel: "Full",
      pickupKm: 5000,
    });

    // Verify invoice amounts
    expect(result.invoice).toBeDefined();
    
    // Subtotal should be rental - discount = 600 - 50 = 550
    const subtotal = parseFloat(result.invoice.subtotal);
    expect(subtotal).toBe(550);

    // Tax should be 11% of subtotal = 550 * 0.11 = 60.50
    const taxAmount = parseFloat(result.invoice.taxAmount);
    expect(taxAmount).toBeCloseTo(60.5, 2);

    // Total should be subtotal + tax = 550 + 60.50 = 610.50
    const totalAmount = parseFloat(result.invoice.totalAmount);
    expect(totalAmount).toBeCloseTo(610.5, 2);
  });

  it("should not create duplicate invoices for same contract", { timeout: 10000 }, async () => {
    // Create a new vehicle for this test to avoid conflicts
    const vehicle3 = await db.createVehicle({
      userId: testUserId,
      plateNumber: `TCINV3-${Date.now() % 100000}`,
      brand: "Nissan",
      model: "Altima",
      year: 2024,
      color: "Blue",
      category: "Midsize",
      dailyRate: "60.00",
      mileage: 12000,
    });

    const caller = appRouter.createCaller({
      user: { id: testUserId, role: "user" },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    // Create first contract
    const result1 = await caller.contracts.create({
      vehicleId: vehicle3.id,
      clientFirstName: "Jane",
      clientLastName: "Smith",
      clientNationality: "American",
      clientPhone: "+1234567890",
      clientAddress: "123 Test St",
      drivingLicenseNumber: `LIC-CINV-${Date.now()}`,
      licenseIssueDate: new Date(2020, 0, 1),
      licenseExpiryDate: new Date(2030, 11, 31),
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      rentalDays: 3,
      dailyRate: "60.00",
      totalAmount: "180.00",
      discount: "0.00",
      finalAmount: "180.00",
      fuelLevel: "Full",
      pickupKm: 5000,
    });

    const firstInvoiceId = result1.invoice.id;

    // Try to generate invoice again for the same contract (simulating idempotency)
    const invoice = await db.autoGenerateInvoice(result1.id, testUserId);

    // Should return the same invoice, not create a new one
    expect(invoice.id).toBe(firstInvoiceId);

    // Verify only one invoice exists for this contract
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const allInvoices = await dbInstance
      .select()
      .from(invoices)
      .where(eq(invoices.contractId, result1.id));

    expect(allInvoices.length).toBe(1);
  });
});
