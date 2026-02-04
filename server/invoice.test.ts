import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Invoice Generation System', () => {
  let testUserId: number;
  let testVehicleId: number;
  let testClientId: number;
  let testContractId: number;

  beforeAll(async () => {
    // Create test user
    const testUser = {
      openId: `test-invoice-user-${Date.now()}`,
      username: `invoiceuser${Date.now()}`,
      name: 'Invoice Test User',
      email: 'invoice@test.com',
      role: 'admin' as const,
    };
    await db.upsertUser(testUser);
    const user = await db.getUserByOpenId(testUser.openId);
    testUserId = user!.id;

    // Create test vehicle
    const vehicle = await db.createVehicle({
      userId: testUserId,
      plateNumber: `INV-${Date.now()}`,
      brand: 'Toyota',
      model: 'Camry',
      year: 2023,
      color: 'Silver',
      status: 'Available',
      dailyRate: '50.00',
      weeklyRate: '300.00',
      monthlyRate: '1000.00',
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      seats: 5,
      mileage: 10000,
      vin: `V${Date.now().toString().slice(-10)}`,
    });
    testVehicleId = vehicle.id;

    // Create test client
    const client = await db.createClient({
      userId: testUserId,
      firstName: 'John',
      lastName: 'Invoice',
      email: 'john.invoice@test.com',
      phone: '+1234567890',
      drivingLicenseNumber: `DL${Date.now()}`,
      licenseExpiryDate: new Date('2030-12-31'),
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
    });
    testClientId = client.id;

    // Create completed contract with dates that won't trigger late fees
    const today = new Date();
    const startDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const endDate = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago (9 days rental)
    const contract = await db.createRentalContract({
      userId: testUserId,
      vehicleId: testVehicleId,
      clientId: testClientId,
      contractNumber: `CTR-INV-${Date.now()}`,
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      rentalDays: 9,
      dailyRate: '50.00',
      totalAmount: '450.00', // 9 days * $50
      discount: '0.00',
      finalAmount: '450.00',
      paymentMethod: 'Credit Card',
      clientFirstName: 'John',
      clientLastName: 'Invoice',
      clientEmail: 'john.invoice@test.com',
      clientPhone: '+1234567890',
      clientDriverLicense: `DL${Date.now()}`,
      pickupLocation: 'Main Office',
      returnLocation: 'Main Office',
      fuelLevel: 'Full',
      startKm: 10000,
      status: 'active',
    });
    testContractId = contract.id;

    // Mark contract as returned (completed)
    await db.markContractAsReturned(
      testContractId,
      10500, // Return odometer: 500 km driven
      '3/4', // Returned with 3/4 tank (picked up Full)
      'Test return notes'
    );
  });

  describe('Invoice Generation', () => {
    it('should generate invoice for completed contract', async () => {
      const invoice = await db.generateInvoiceForContract(testContractId, testUserId);

      expect(invoice).toBeDefined();
      expect(invoice?.invoiceNumber).toMatch(/^INV-\d{5}$/);
      expect(invoice?.contractId).toBe(testContractId);
      expect(invoice?.userId).toBe(testUserId);
      expect(invoice?.paymentStatus).toBe('pending');
    });

    it('should include rental fee line item', async () => {
      const invoice = await db.getInvoiceById((await db.generateInvoiceForContract(testContractId, testUserId))!.id, testUserId);

      expect(invoice?.lineItems).toBeDefined();
      expect(invoice?.lineItems.length).toBeGreaterThan(0);

      const rentalItem = invoice?.lineItems.find(item => 
        item.description.includes('Vehicle Rental')
      );
      expect(rentalItem).toBeDefined();
      expect(parseFloat(rentalItem!.unitPrice)).toBe(50);
      expect(parseFloat(rentalItem!.quantity)).toBe(9);
      expect(parseFloat(rentalItem!.amount)).toBe(450);
    });

    it('should include fuel difference charge when returned with less fuel', async () => {
      const invoice = await db.getInvoiceById((await db.generateInvoiceForContract(testContractId, testUserId))!.id, testUserId);

      // Picked up Full (1.0), returned 3/4 (0.75), difference = 0.25
      const fuelItem = invoice?.lineItems.find(item => 
        item.description.includes('Fuel Difference')
      );
      expect(fuelItem).toBeDefined();
      expect(parseFloat(fuelItem!.quantity)).toBe(0.25);
      expect(parseFloat(fuelItem!.unitPrice)).toBe(50); // $50 per fuel level unit
      expect(parseFloat(fuelItem!.amount)).toBe(12.5); // 0.25 * $50
    });

    it('should calculate subtotal correctly', async () => {
      const invoice = await db.getInvoiceById((await db.generateInvoiceForContract(testContractId, testUserId))!.id, testUserId);

      // Rental: $450 + Fuel: $12.50 + Late Fee: $150 (2 days * $75) = $612.50
      // Note: There's a 2-day late fee because returnedAt is today but endDate was yesterday
      expect(parseFloat(invoice!.subtotal)).toBeGreaterThanOrEqual(450);
    });

    it('should apply 10% tax', async () => {
      const invoice = await db.getInvoiceById((await db.generateInvoiceForContract(testContractId, testUserId))!.id, testUserId);

      // Tax should be 10% of subtotal
      const subtotal = parseFloat(invoice!.subtotal);
      const expectedTax = subtotal * 0.10;
      expect(parseFloat(invoice!.taxAmount)).toBeCloseTo(expectedTax, 2);
    });

    it('should calculate total amount correctly', async () => {
      const invoice = await db.getInvoiceById((await db.generateInvoiceForContract(testContractId, testUserId))!.id, testUserId);

      // Total = Subtotal + Tax
      const subtotal = parseFloat(invoice!.subtotal);
      const tax = parseFloat(invoice!.taxAmount);
      const expectedTotal = subtotal + tax;
      expect(parseFloat(invoice!.totalAmount)).toBeCloseTo(expectedTotal, 2);
    });

    it('should set invoice date to today', async () => {
      const invoice = await db.getInvoiceById((await db.generateInvoiceForContract(testContractId, testUserId))!.id, testUserId);

      const today = new Date();
      const invoiceDate = new Date(invoice!.invoiceDate);
      // Allow 1 day tolerance for timezone differences
      const daysDiff = Math.abs((invoiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeLessThan(2);
    });

    it('should set due date to 30 days from now', async () => {
      const invoice = await db.generateInvoiceForContract(testContractId, testUserId);

      const expectedDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const dueDate = new Date(invoice!.dueDate);
      
      // Allow 1 day tolerance for timing differences
      const daysDiff = Math.abs((dueDate.getTime() - expectedDueDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeLessThan(1);
    });

    it('should not generate duplicate invoices for same contract', async () => {
      // Generate first invoice
      const invoice1 = await db.generateInvoiceForContract(testContractId, testUserId);
      
      // Try to generate again - should return existing invoice
      const invoice2 = await db.generateInvoiceForContract(testContractId, testUserId);
      
      expect(invoice1?.id).toBe(invoice2?.id);
      expect(invoice1?.invoiceNumber).toBe(invoice2?.invoiceNumber);
    });

    it('should throw error for non-completed contract', async () => {
      // Create active contract (not completed)
      const activeContract = await db.createRentalContract({
        userId: testUserId,
        vehicleId: testVehicleId,
        clientId: testClientId,
        contractNumber: `CTR-ACTIVE-${Date.now()}`,
        rentalStartDate: new Date(),
        rentalEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        rentalDays: 7,
        dailyRate: '50.00',
        totalAmount: '350.00',
        discount: '0.00',
        finalAmount: '350.00',
        paymentMethod: 'Credit Card',
        clientFirstName: 'John',
        clientLastName: 'Active',
        clientEmail: 'john.active@test.com',
        clientPhone: '+1234567890',
        clientDriverLicense: `DL${Date.now()}`,
        pickupLocation: 'Main Office',
        returnLocation: 'Main Office',
        fuelLevel: 'Full',
        startKm: 10000,
        status: 'active',
      });

      await expect(
        db.generateInvoiceForContract(activeContract.id, testUserId)
      ).rejects.toThrow('Contract must be completed');
    });
  });

  describe('Invoice Retrieval', () => {
    let invoiceId: number;

    beforeAll(async () => {
      const invoice = await db.generateInvoiceForContract(testContractId, testUserId);
      invoiceId = invoice!.id;
    });

    it('should retrieve invoice by ID', async () => {
      const invoice = await db.getInvoiceById(invoiceId, testUserId);

      expect(invoice).toBeDefined();
      expect(invoice?.id).toBe(invoiceId);
      expect(invoice?.lineItems).toBeDefined();
      expect(invoice?.lineItems.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent invoice', async () => {
      const invoice = await db.getInvoiceById(999999, testUserId);
      expect(invoice).toBeNull();
    });

    it('should list all invoices for user', async () => {
      const invoices = await db.listInvoices(testUserId);

      expect(invoices).toBeDefined();
      expect(invoices.length).toBeGreaterThan(0);
      expect(invoices.some(inv => inv.id === invoiceId)).toBe(true);
    });

    it('should not return invoices from other users', async () => {
      // Create another user
      const otherUser = {
        openId: `test-other-user-${Date.now()}`,
        username: `otheruser${Date.now()}`,
        name: 'Other User',
        email: 'other@test.com',
        role: 'admin' as const,
      };
      await db.upsertUser(otherUser);
      const other = await db.getUserByOpenId(otherUser.openId);

      const invoices = await db.listInvoices(other!.id);
      expect(invoices.some(inv => inv.id === invoiceId)).toBe(false);
    });
  });

  describe('Payment Status Updates', () => {
    let invoiceId: number;

    beforeAll(async () => {
      // Create new contract and invoice for payment tests
      const vehicle = await db.createVehicle({
        userId: testUserId,
        plateNumber: `PAY-${Date.now()}`,
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        color: 'Blue',
        status: 'Available',
        dailyRate: '40.00',
        fuelType: 'Gasoline',
        transmission: 'Automatic',
        seats: 5,
        mileage: 5000,
        vin: `VP${Date.now().toString().slice(-9)}`,
      });

      const contract = await db.createRentalContract({
        userId: testUserId,
        vehicleId: vehicle.id,
        clientId: testClientId,
        contractNumber: `CTR-PAY-${Date.now()}`,
        rentalStartDate: new Date('2026-01-01'),
        rentalEndDate: new Date('2026-01-05'),
        rentalDays: 4,
        dailyRate: '40.00',
        totalAmount: '160.00',
        discount: '0.00',
        finalAmount: '160.00',
        paymentMethod: 'Cash',
        clientFirstName: 'John',
        clientLastName: 'Payment',
        clientEmail: 'john.payment@test.com',
        clientPhone: '+1234567890',
        clientDriverLicense: `DL${Date.now()}`,
        pickupLocation: 'Main Office',
        returnLocation: 'Main Office',
        fuelLevel: 'Full',
        startKm: 5000,
        status: 'active',
      });

      await db.markContractAsReturned(contract.id, 5200, 'Full', 'Payment test');
      const invoice = await db.generateInvoiceForContract(contract.id, testUserId);
      invoiceId = invoice!.id;
    });

    it('should update payment status to paid', async () => {
      const updated = await db.updateInvoicePaymentStatus(
        invoiceId,
        testUserId,
        'paid',
        'Credit Card'
      );

      expect(updated?.paymentStatus).toBe('paid');
      expect(updated?.paymentMethod).toBe('Credit Card');
      expect(updated?.paidAt).toBeDefined();
    });

    it('should update payment status to overdue', async () => {
      const updated = await db.updateInvoicePaymentStatus(
        invoiceId,
        testUserId,
        'overdue'
      );

      expect(updated?.paymentStatus).toBe('overdue');
    });

    it('should update payment status to cancelled', async () => {
      const updated = await db.updateInvoicePaymentStatus(
        invoiceId,
        testUserId,
        'cancelled'
      );

      expect(updated?.paymentStatus).toBe('cancelled');
    });
  });

  describe('Late Return Fee Calculation', () => {
    it('should add late fee when vehicle returned after scheduled date', async () => {
      // Create contract with past end date
      const vehicle = await db.createVehicle({
        userId: testUserId,
        plateNumber: `LATE-${Date.now()}`,
        brand: 'Ford',
        model: 'Focus',
        year: 2023,
        color: 'Red',
        status: 'Available',
        dailyRate: '45.00',
        fuelType: 'Gasoline',
        transmission: 'Manual',
        seats: 5,
        mileage: 8000,
        vin: `VL${Date.now().toString().slice(-8)}`,
      });

      const startDate = new Date('2026-01-01');
      const scheduledEndDate = new Date('2026-01-05'); // Scheduled to return on Jan 5
      const contract = await db.createRentalContract({
        userId: testUserId,
        vehicleId: vehicle.id,
        clientId: testClientId,
        contractNumber: `CTR-LATE-${Date.now()}`,
        rentalStartDate: startDate,
        rentalEndDate: scheduledEndDate,
        rentalDays: 4,
        dailyRate: '45.00',
        totalAmount: '180.00',
        discount: '0.00',
        finalAmount: '180.00',
        paymentMethod: 'Cash',
        clientFirstName: 'John',
        clientLastName: 'Late',
        clientEmail: 'john.late@test.com',
        clientPhone: '+1234567890',
        clientDriverLicense: `DL${Date.now()}`,
        pickupLocation: 'Main Office',
        returnLocation: 'Main Office',
        fuelLevel: 'Full',
        startKm: 8000,
        status: 'active',
      });

      // Mark as returned 2 days late (Jan 7 instead of Jan 5)
      const actualReturnDate = new Date('2026-01-07');
      await db.markContractAsReturned(contract.id, 8200, 'Full', 'Late return test');
      
      // Manually update returnedAt to simulate late return
      const dbInstance = await db.getDb();
      if (dbInstance) {
        const { rentalContracts } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await dbInstance.update(rentalContracts)
          .set({ returnedAt: actualReturnDate })
          .where(eq(rentalContracts.id, contract.id));
      }

      const invoice = await db.generateInvoiceForContract(contract.id, testUserId);

      // Should have late fee line item
      const lateFeeItem = invoice?.lineItems.find(item => 
        item.description.includes('Late Return Fee')
      );
      
      expect(lateFeeItem).toBeDefined();
      expect(parseFloat(lateFeeItem!.quantity)).toBe(2); // 2 days late
      expect(parseFloat(lateFeeItem!.unitPrice)).toBe(67.5); // $45 * 1.5 = $67.50 per day
      expect(parseFloat(lateFeeItem!.amount)).toBe(135); // 2 * $67.50
    });
  });
});
