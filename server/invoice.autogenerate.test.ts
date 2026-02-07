import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { eq } from "drizzle-orm";
import { rentalContracts, invoices, invoiceLineItems } from "../drizzle/schema";

describe("Automatic Invoice Generation", () => {
  let testUserId: number;
  let testVehicleId: number;
  let testClientId: number;
  let testContractId: number;

  beforeAll(async () => {
    // Create test user
    const testUser = await db.createUser({
      username: `test_invoice_${Date.now()}`,
      password: "test123",
      name: "Invoice Test User",
      email: "test@example.com",
      phone: "+1234567890",
      country: "US",
    });
    testUserId = testUser.id;

    // Create test vehicle
    const vehicle = await db.createVehicle({
      userId: testUserId,
      plateNumber: `TINV${Date.now() % 100000}`,
      brand: "Toyota",
      model: "Camry",
      year: 2023,
      color: "White",
      category: "Midsize",
      dailyRate: "50.00",
      mileage: 10000,
    });
    testVehicleId = vehicle.id;

    // Create test client
    const client = await db.createClient({
      userId: testUserId,
      firstName: "John",
      lastName: "Doe",
      drivingLicenseNumber: `LIC-${Date.now()}`,
      licenseExpiryDate: new Date(2030, 11, 31),
    });
    testClientId = client.id;

    // Create test contract
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 5); // 5 days rental

    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const [contractResult] = await dbInstance.insert(rentalContracts).values({
      userId: testUserId,
      vehicleId: testVehicleId,
      clientId: testClientId,
      clientFirstName: "John",
      clientLastName: "Doe",
      drivingLicenseNumber: `LIC-${Date.now()}`,
      licenseExpiryDate: new Date(2030, 11, 31),
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      rentalDays: 5,
      dailyRate: "50.00",
      totalAmount: "250.00",
      discount: "25.00",
      finalAmount: "225.00",
      contractNumber: `CONTRACT-${Date.now()}`,
      status: "active",
      pickupKm: 10000,
    });

    testContractId = Number(contractResult.insertId);
  });

  it("should auto-generate invoice when contract is marked as returned", async () => {
    // Mark contract as returned
    const result = await db.markContractAsReturned(
      testContractId,
      10500, // return KM
      "Full", // return fuel level
      "Vehicle returned in good condition",
      "No damage",
      0 // no over-limit fee
    );

    // Check that invoice was created
    expect(result.invoice).toBeDefined();
    expect(result.invoice.invoiceNumber).toMatch(/^INV-\d{8}-\d{6}-\d{3}$/);
    expect(result.invoice.contractId).toBe(testContractId);
    expect(result.invoice.userId).toBe(testUserId);
    expect(result.invoice.paymentStatus).toBe("pending");
  });

  it("should calculate correct subtotal, tax, and total", async () => {
    // Get the auto-generated invoice
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const [invoice] = await dbInstance
      .select()
      .from(invoices)
      .where(eq(invoices.contractId, testContractId))
      .limit(1);

    expect(invoice).toBeDefined();

    // Expected: 5 days × $50 = $250, minus $25 discount = $225 subtotal
    // Tax: $225 × 11% = $24.75
    // Total: $225 + $24.75 = $249.75
    expect(parseFloat(invoice.subtotal)).toBe(225.00);
    expect(parseFloat(invoice.taxAmount)).toBeCloseTo(24.75, 2);
    expect(parseFloat(invoice.totalAmount)).toBeCloseTo(249.75, 2);
  });

  it("should create correct line items for rental charges and discount", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const [invoice] = await dbInstance
      .select()
      .from(invoices)
      .where(eq(invoices.contractId, testContractId))
      .limit(1);

    const lineItems = await dbInstance
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoice.id));

    // Should have 2 line items: rental charges and discount
    expect(lineItems.length).toBe(2);

    // Check rental charges line item
    const rentalItem = lineItems.find(item => item.description.includes("Vehicle Rental"));
    expect(rentalItem).toBeDefined();
    expect(parseFloat(rentalItem!.quantity)).toBe(5);
    expect(parseFloat(rentalItem!.unitPrice)).toBe(50.00);
    expect(parseFloat(rentalItem!.amount)).toBe(250.00);

    // Check discount line item
    const discountItem = lineItems.find(item => item.description.includes("Discount"));
    expect(discountItem).toBeDefined();
    expect(parseFloat(discountItem!.amount)).toBe(-25.00);
  });

  it("should not create duplicate invoice if contract is already completed", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Try to generate invoice again for the same contract
    const invoice = await db.autoGenerateInvoice(testContractId, testUserId);

    // Should return the existing invoice, not create a new one
    const allInvoices = await dbInstance
      .select()
      .from(invoices)
      .where(eq(invoices.contractId, testContractId));

    expect(allInvoices.length).toBe(1); // Only one invoice should exist
    expect(allInvoices[0].id).toBe(invoice.id);
  });

  it("should include over-limit KM fee in invoice if applicable", async () => {
    // Create another contract with KM limit
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const [contractResult] = await dbInstance.insert(rentalContracts).values({
      userId: testUserId,
      vehicleId: testVehicleId,
      clientId: testClientId,
      clientFirstName: "Jane",
      lastName: "Smith",
      drivingLicenseNumber: `LIC2-${Date.now()}`,
      licenseExpiryDate: new Date(2030, 11, 31),
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      rentalDays: 3,
      dailyRate: "50.00",
      totalAmount: "150.00",
      discount: "0.00",
      finalAmount: "150.00",
      contractNumber: `CONTRACT2-${Date.now()}`,
      status: "active",
      pickupKm: 10000,
      kmLimit: 300,
      overLimitKmRate: "0.50",
    });

    const contractId2 = Number(contractResult.insertId);

    // Mark as returned with 400 KM driven (100 KM over limit)
    // Over-limit fee: 100 km × $0.50 = $50
    await db.markContractAsReturned(
      contractId2,
      10400,
      "Full",
      undefined,
      undefined,
      50.00 // over-limit fee
    );

    // Get invoice and check line items
    const [invoice] = await dbInstance
      .select()
      .from(invoices)
      .where(eq(invoices.contractId, contractId2))
      .limit(1);

    const lineItems = await dbInstance
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoice.id));

    // Should have rental charges + over-limit fee
    const overLimitItem = lineItems.find(item => item.description.includes("Over-Limit"));
    expect(overLimitItem).toBeDefined();
    expect(parseFloat(overLimitItem!.amount)).toBe(50.00);

    // Subtotal should be $150 + $50 = $200
    expect(parseFloat(invoice.subtotal)).toBe(200.00);
  });

  it("should calculate correct subtotal with discount", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const [invoice] = await dbInstance
      .select()
      .from(invoices)
      .where(eq(invoices.contractId, testContractId))
      .limit(1);

    // Verify invoice number format
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{8}-\d{6}-\d{3}$/);
    
    // Verify payment status is pending
    expect(invoice.paymentStatus).toBe("pending");
  });
});
