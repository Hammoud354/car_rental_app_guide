import { describe, it, expect } from 'vitest';

/**
 * Tiered Pricing Logic Tests
 * 
 * Tests the pricing calculation logic used in the rental contract creation form.
 * The logic is implemented in client/src/pages/RentalContracts.tsx in a useEffect hook.
 * 
 * Pricing Tiers:
 * - Daily Rate: 1-6 days
 * - Weekly Rate: 7-29 days
 * - Monthly Rate: 30+ days
 */

// Helper function that mirrors the frontend pricing logic
function calculateDailyRate(
  rentalDays: number,
  vehicle: {
    dailyRate?: string | null;
    weeklyRate?: string | null;
    monthlyRate?: string | null;
  }
): number {
  let rate = 0;

  if (rentalDays >= 30 && vehicle.monthlyRate) {
    rate = parseFloat(vehicle.monthlyRate);
  } else if (rentalDays >= 7 && vehicle.weeklyRate) {
    rate = parseFloat(vehicle.weeklyRate);
  } else if (vehicle.dailyRate) {
    rate = parseFloat(vehicle.dailyRate);
  }

  return rate;
}

describe('Tiered Pricing Logic', () => {
  const testVehicle = {
    dailyRate: '40.00',
    weeklyRate: '35.00',
    monthlyRate: '30.00',
  };

  describe('Daily Rate Tier (1-6 days)', () => {
    it('should use daily rate for 1 day rental', () => {
      const rate = calculateDailyRate(1, testVehicle);
      expect(rate).toBe(40);
    });

    it('should use daily rate for 3 days rental', () => {
      const rate = calculateDailyRate(3, testVehicle);
      expect(rate).toBe(40);
    });

    it('should use daily rate for 6 days rental', () => {
      const rate = calculateDailyRate(6, testVehicle);
      expect(rate).toBe(40);
    });

    it('should calculate correct total for 5 days at daily rate', () => {
      const rentalDays = 5;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const total = rentalDays * rate;
      expect(total).toBe(200); // 5 × $40 = $200
    });
  });

  describe('Weekly Rate Tier (7-29 days)', () => {
    it('should use weekly rate for exactly 7 days rental', () => {
      const rate = calculateDailyRate(7, testVehicle);
      expect(rate).toBe(35);
    });

    it('should use weekly rate for 14 days rental', () => {
      const rate = calculateDailyRate(14, testVehicle);
      expect(rate).toBe(35);
    });

    it('should use weekly rate for 20 days rental', () => {
      const rate = calculateDailyRate(20, testVehicle);
      expect(rate).toBe(35);
    });

    it('should use weekly rate for 29 days rental', () => {
      const rate = calculateDailyRate(29, testVehicle);
      expect(rate).toBe(35);
    });

    it('should calculate correct total for 21 days at weekly rate', () => {
      const rentalDays = 21;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const total = rentalDays * rate;
      expect(total).toBe(735); // 21 × $35 = $735
    });
  });

  describe('Monthly Rate Tier (30+ days)', () => {
    it('should use monthly rate for exactly 30 days rental', () => {
      const rate = calculateDailyRate(30, testVehicle);
      expect(rate).toBe(30);
    });

    it('should use monthly rate for 45 days rental', () => {
      const rate = calculateDailyRate(45, testVehicle);
      expect(rate).toBe(30);
    });

    it('should use monthly rate for 60 days rental', () => {
      const rate = calculateDailyRate(60, testVehicle);
      expect(rate).toBe(30);
    });

    it('should use monthly rate for 365 days rental', () => {
      const rate = calculateDailyRate(365, testVehicle);
      expect(rate).toBe(30);
    });

    it('should calculate correct total for 30 days at monthly rate', () => {
      const rentalDays = 30;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const total = rentalDays * rate;
      expect(total).toBe(900); // 30 × $30 = $900
    });

    it('should calculate correct total for 135 days at monthly rate', () => {
      const rentalDays = 135;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const total = rentalDays * rate;
      expect(total).toBe(4050); // 135 × $30 = $4,050
    });
  });

  describe('Boundary Testing', () => {
    it('should transition from daily to weekly rate at 7 days', () => {
      const rate6Days = calculateDailyRate(6, testVehicle);
      const rate7Days = calculateDailyRate(7, testVehicle);
      
      expect(rate6Days).toBe(40); // Daily rate
      expect(rate7Days).toBe(35); // Weekly rate
    });

    it('should transition from weekly to monthly rate at 30 days', () => {
      const rate29Days = calculateDailyRate(29, testVehicle);
      const rate30Days = calculateDailyRate(30, testVehicle);
      
      expect(rate29Days).toBe(35); // Weekly rate
      expect(rate30Days).toBe(30); // Monthly rate
    });
  });

  describe('Edge Cases - Missing Rates', () => {
    it('should fall back to daily rate when weekly rate is null', () => {
      const vehicle = {
        dailyRate: '40.00',
        weeklyRate: null,
        monthlyRate: '30.00',
      };
      const rate = calculateDailyRate(10, vehicle);
      expect(rate).toBe(40); // Falls back to daily rate
    });

    it('should fall back to weekly rate when monthly rate is null', () => {
      const vehicle = {
        dailyRate: '40.00',
        weeklyRate: '35.00',
        monthlyRate: null,
      };
      const rate = calculateDailyRate(35, vehicle);
      expect(rate).toBe(35); // Falls back to weekly rate
    });

    it('should fall back to daily rate when both weekly and monthly rates are null', () => {
      const vehicle = {
        dailyRate: '40.00',
        weeklyRate: null,
        monthlyRate: null,
      };
      const rate = calculateDailyRate(50, vehicle);
      expect(rate).toBe(40); // Falls back to daily rate
    });

    it('should return 0 when all rates are null', () => {
      const vehicle = {
        dailyRate: null,
        weeklyRate: null,
        monthlyRate: null,
      };
      const rate = calculateDailyRate(10, vehicle);
      expect(rate).toBe(0);
    });

    it('should handle undefined rates', () => {
      const vehicle = {
        dailyRate: '40.00',
      };
      const rate = calculateDailyRate(15, vehicle);
      expect(rate).toBe(40); // Falls back to daily rate when weekly/monthly undefined
    });
  });

  describe('Discount Application', () => {
    it('should calculate final amount with discount', () => {
      const rentalDays = 10;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const totalAmount = rentalDays * rate; // 10 × $35 = $350
      const discount = 50;
      const finalAmount = totalAmount - discount;
      
      expect(totalAmount).toBe(350);
      expect(finalAmount).toBe(300);
    });

    it('should handle zero discount', () => {
      const rentalDays = 5;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const totalAmount = rentalDays * rate;
      const discount = 0;
      const finalAmount = totalAmount - discount;
      
      expect(finalAmount).toBe(totalAmount);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate correctly for weekend rental (2 days)', () => {
      const rentalDays = 2;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const total = rentalDays * rate;
      
      expect(rate).toBe(40);
      expect(total).toBe(80);
    });

    it('should calculate correctly for one-week rental (7 days)', () => {
      const rentalDays = 7;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const total = rentalDays * rate;
      
      expect(rate).toBe(35);
      expect(total).toBe(245);
    });

    it('should calculate correctly for two-week rental (14 days)', () => {
      const rentalDays = 14;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const total = rentalDays * rate;
      
      expect(rate).toBe(35);
      expect(total).toBe(490);
    });

    it('should calculate correctly for one-month rental (30 days)', () => {
      const rentalDays = 30;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const total = rentalDays * rate;
      
      expect(rate).toBe(30);
      expect(total).toBe(900);
    });

    it('should calculate correctly for three-month rental (90 days)', () => {
      const rentalDays = 90;
      const rate = calculateDailyRate(rentalDays, testVehicle);
      const total = rentalDays * rate;
      
      expect(rate).toBe(30);
      expect(total).toBe(2700);
    });
  });
});
