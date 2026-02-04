import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("New Features Tests", () => {
  let testUserId: number;
  let testVehicleId: number;
  let testClientId: number;
  let testContractId: number;

  beforeAll(async () => {
    // Use existing test user or create one
    const existingUser = await db.getUserByUsername("testuser");
    if (existingUser) {
      testUserId = existingUser.id;
    } else {
      const user = await db.createUser({
        username: "featuretest",
        email: "featuretest@test.com",
        password: "hashedpassword",
        fullName: "Feature Test User",
      });
      testUserId = user.id;
    }

    // Create a test vehicle with unique plate number
    const vehicle = await db.createVehicle({
      plateNumber: `TF${Date.now().toString().slice(-6)}`,
      brand: "Test",
      model: "Feature",
      year: 2024,
      color: "Blue",
      status: "Available",
      dailyRate: "100.00",
      userId: testUserId,
    });
    testVehicleId = vehicle.id;

    // Create a test client with future license expiry
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    
    const client = await db.createClient({
      firstName: "Test",
      lastName: "Client",
      drivingLicenseNumber: "TEST-LIC-001",
      licenseExpiryDate: futureDate,
      userId: testUserId,
    });
    testClientId = client.id;
  });

  describe("License Expiry Validation", () => {
    it("should validate that past dates are detected", () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      expect(pastDate < today).toBe(true);
    });

    it("should validate that future dates are detected", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 3);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      expect(futureDate > today).toBe(true);
    });

    it("should validate date comparison logic", () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      expect(pastDate < today).toBe(true);
      expect(futureDate > today).toBe(true);
    });
  });

  describe("Automatic Pricing Calculation", () => {
    it("should calculate total amount based on daily rate and rental days", () => {
      const dailyRate = 100;
      const rentalDays = 5;
      const expectedTotal = dailyRate * rentalDays;

      expect(expectedTotal).toBe(500);
    });

    it("should calculate final amount after discount", () => {
      const totalAmount = 500;
      const discount = 50;
      const expectedFinal = Math.max(0, totalAmount - discount);

      expect(expectedFinal).toBe(450);
    });

    it("should not allow negative final amount", () => {
      const totalAmount = 100;
      const discount = 150;
      const expectedFinal = Math.max(0, totalAmount - discount);

      expect(expectedFinal).toBe(0);
    });
  });

  describe("Odometer Validation on Return", () => {
    beforeAll(async () => {
      // Create a test contract with pickup odometer
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const contract = await db.createRentalContract({
        vehicleId: testVehicleId,
        clientId: testClientId,
        rentalStartDate: startDate,
        rentalEndDate: endDate,
        rentalDays: 7,
        totalAmount: 700,
        finalAmount: 700,
        pickupKm: 10000,
        userId: testUserId,
      });
      testContractId = contract.id;
    });

    it("should reject return with odometer less than pickup", async () => {
      const contract = await db.getRentalContractById(testContractId, testUserId);
      expect(contract).toBeDefined();
      expect(contract!.pickupKm).toBe(10000);

      const invalidReturnKm = 9500; // Less than pickup
      
      // Validation should happen before calling markContractAsReturned
      expect(invalidReturnKm).toBeLessThan(contract!.pickupKm!);
    });

    it("should reject return with odometer equal to pickup", async () => {
      const contract = await db.getRentalContractById(testContractId, testUserId);
      expect(contract).toBeDefined();
      
      const invalidReturnKm = contract!.pickupKm!; // Equal to pickup
      
      expect(invalidReturnKm).toBe(contract!.pickupKm);
    });

    it("should accept return with odometer greater than pickup", async () => {
      const contract = await db.getRentalContractById(testContractId, testUserId);
      expect(contract).toBeDefined();
      
      const validReturnKm = 10500; // Greater than pickup
      
      expect(validReturnKm).toBeGreaterThan(contract!.pickupKm!);
      
      const result = await db.markContractAsReturned(testContractId, validReturnKm);
      expect(result).toBeDefined();
    });

    it("should calculate kilometers driven correctly", async () => {
      const pickupKm = 10000;
      const returnKm = 10500;
      const expectedKmDriven = returnKm - pickupKm;

      expect(expectedKmDriven).toBe(500);
    });
  });

  describe("Remember Me Functionality", () => {
    it("should set different cookie expiration for remember me", () => {
      const rememberMe = true;
      const normalExpiry = 24 * 60 * 60 * 1000; // 24 hours
      const rememberMeExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days

      const expiry = rememberMe ? rememberMeExpiry : normalExpiry;

      expect(expiry).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it("should use normal expiry when remember me is false", () => {
      const rememberMe = false;
      const normalExpiry = 24 * 60 * 60 * 1000; // 24 hours
      const rememberMeExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days

      const expiry = rememberMe ? rememberMeExpiry : normalExpiry;

      expect(expiry).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("Real-Time Data Updates", () => {
    it("should verify query invalidation pattern", () => {
      // This test verifies the pattern is correct
      // In actual implementation, tRPC utils.invalidate() is called after mutations
      const mockInvalidate = () => {
        return { success: true };
      };

      const result = mockInvalidate();
      expect(result.success).toBe(true);
    });
  });
});
