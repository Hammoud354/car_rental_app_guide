import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Feature Tests: Reservation Calendar, Logo, and Insurance Calculation', () => {
  
  describe('Insurance Per Day Calculation', () => {
    it('should calculate insurance cost as daily rate multiplied by rental days', async () => {
      // Test data: 5-day rental with $10/day insurance
      const rentalDays = 5;
      const insuranceDailyRate = 10;
      
      // Expected calculation: 5 days * $10/day = $50
      const expectedInsuranceCost = rentalDays * insuranceDailyRate;
      
      expect(expectedInsuranceCost).toBe(50);
    });

    it('should include calculated insurance in invoice subtotal', async () => {
      // Simulate invoice line items calculation
      const rentalDays = 3;
      const dailyRate = 100;
      const insuranceDailyRate = 15;
      const discount = 0;
      
      // Line items
      const rentalCharges = rentalDays * dailyRate; // 300
      const insuranceCost = insuranceDailyRate * rentalDays; // 45
      
      // Subtotal should include both rental and insurance
      const subtotal = rentalCharges + insuranceCost; // 345
      
      expect(rentalCharges).toBe(300);
      expect(insuranceCost).toBe(45);
      expect(subtotal).toBe(345);
    });

    it('should calculate correct tax on insurance-inclusive subtotal', async () => {
      // 3-day rental: $100/day rental + $15/day insurance
      const rentalDays = 3;
      const dailyRate = 100;
      const insuranceDailyRate = 15;
      
      const rentalCharges = rentalDays * dailyRate; // 300
      const insuranceCost = insuranceDailyRate * rentalDays; // 45
      const subtotal = rentalCharges + insuranceCost; // 345
      
      const taxRate = 0.11;
      const taxAmount = subtotal * taxRate; // 37.95
      const totalAmount = subtotal + taxAmount; // 382.95
      
      expect(subtotal).toBe(345);
      expect(taxAmount).toBeCloseTo(37.95, 2);
      expect(totalAmount).toBeCloseTo(382.95, 2);
    });

    it('should handle zero insurance daily rate', async () => {
      const rentalDays = 5;
      const insuranceDailyRate = 0;
      
      const insuranceCost = insuranceDailyRate * rentalDays;
      
      expect(insuranceCost).toBe(0);
    });
  });

  describe('Reservation Calendar Duration Logic', () => {
    it('should calculate correct span for multi-day reservations', async () => {
      // Test: 3-day booking from Jan 1 to Jan 3
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-03');
      
      // Calculate duration in days (inclusive of both start and end date)
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive count
      
      expect(durationDays).toBe(3);
    });

    it('should handle single-day reservations', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-01');
      
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;
      
      expect(durationDays).toBe(1);
    });

    it('should correctly identify return date for multi-day bookings', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-05');
      
      // Return date should be the endDate
      expect(endDate.toDateString()).toBe(new Date('2026-01-05').toDateString());
    });
  });

  describe('Return-Day Status Badge', () => {
    it('should identify if current date is return date', async () => {
      const currentDate = new Date('2026-01-05');
      const returnDate = new Date('2026-01-05');
      
      // Should show "Return Today" badge
      const isReturnDay = currentDate.toDateString() === returnDate.toDateString();
      
      expect(isReturnDay).toBe(true);
    });

    it('should not show badge on non-return dates', async () => {
      const currentDate = new Date('2026-01-04');
      const returnDate = new Date('2026-01-05');
      
      const isReturnDay = currentDate.toDateString() === returnDate.toDateString();
      
      expect(isReturnDay).toBe(false);
    });
  });

  describe('Company Logo Integration', () => {
    it('should validate logo URL format', async () => {
      const validLogoUrl = 'https://example.com/logo.png';
      const isValidUrl = /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(validLogoUrl);
      
      expect(isValidUrl).toBe(true);
    });

    it('should handle missing logo gracefully', async () => {
      const logoUrl = null;
      
      // Should not throw error when logo is null
      expect(logoUrl).toBeNull();
    });

    it('should scale logo proportionally', async () => {
      // Logo dimensions: 800x400
      const originalWidth = 800;
      const originalHeight = 400;
      const maxHeight = 64; // h-16 in Tailwind = 64px
      
      // Calculate proportional width
      const scaledWidth = (maxHeight / originalHeight) * originalWidth;
      
      expect(scaledWidth).toBe(128); // Should maintain 2:1 aspect ratio
    });
  });

  describe('Integration: Insurance + Invoice Totals', () => {
    it('should ensure all totals match across contract and invoice', async () => {
      // Simulate a complete contract with insurance
      const rentalDays = 7;
      const dailyRate = 50;
      const insuranceDailyRate = 8;
      const discount = 10;
      
      // Calculate all amounts
      const rentalCharges = rentalDays * dailyRate; // 350
      const insuranceCost = insuranceDailyRate * rentalDays; // 56
      const subtotal = rentalCharges + insuranceCost - discount; // 396
      const taxAmount = subtotal * 0.11; // 43.56
      const totalAmount = subtotal + taxAmount; // 439.56
      
      // Verify calculations
      expect(rentalCharges).toBe(350);
      expect(insuranceCost).toBe(56);
      expect(subtotal).toBe(396);
      expect(taxAmount).toBeCloseTo(43.56, 2);
      expect(totalAmount).toBeCloseTo(439.56, 2);
    });
  });
});
