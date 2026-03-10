import { describe, it, expect } from 'vitest';

describe('Insurance Expiry Date Auto-Calculation', () => {
  it('should calculate expiry date as 1 year from start date', () => {
    const startDate = new Date('2026-03-11');
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    expect(expiryDate.getFullYear()).toBe(2027);
    expect(expiryDate.getMonth()).toBe(startDate.getMonth());
    expect(expiryDate.getDate()).toBe(startDate.getDate());
  });

  it('should handle leap year correctly', () => {
    // Feb 29, 2024 (leap year) + 1 year = Feb 28, 2025 (non-leap year)
    const startDate = new Date('2024-02-29');
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    // JavaScript will automatically adjust Feb 29 to Feb 28 in non-leap years
    expect(expiryDate.getFullYear()).toBe(2025);
    expect(expiryDate.getMonth()).toBe(1); // February
  });

  it('should work with different months', () => {
    const testCases = [
      { month: 0, year: 2026 }, // January
      { month: 6, year: 2026 }, // July
      { month: 11, year: 2026 }, // December
    ];

    testCases.forEach(({ month, year }) => {
      const startDate = new Date(year, month, 15);
      const expiryDate = new Date(startDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      expect(expiryDate.getFullYear()).toBe(year + 1);
      expect(expiryDate.getMonth()).toBe(month);
      expect(expiryDate.getDate()).toBe(15);
    });
  });

  it('should preserve time component', () => {
    const startDate = new Date('2026-03-11T14:30:00Z');
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    expect(expiryDate.getHours()).toBe(startDate.getHours());
    expect(expiryDate.getMinutes()).toBe(startDate.getMinutes());
    expect(expiryDate.getSeconds()).toBe(startDate.getSeconds());
  });

  it('should calculate correct days between start and expiry', () => {
    const startDate = new Date('2026-03-11');
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    const daysRemaining = Math.ceil((expiryDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Should be approximately 365 days (or 366 in leap years)
    expect(daysRemaining).toBeGreaterThanOrEqual(365);
    expect(daysRemaining).toBeLessThanOrEqual(366);
  });

  it('should work with ISO date strings', () => {
    const isoString = '2026-03-11T00:00:00Z';
    const startDate = new Date(isoString);
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    expect(expiryDate.getFullYear()).toBe(2027);
    expect(expiryDate.getMonth()).toBe(2); // March
    expect(expiryDate.getDate()).toBe(11);
  });

  it('should handle null/undefined gracefully', () => {
    const startDate = undefined;
    
    if (startDate) {
      const expiryDate = new Date(startDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      expect(expiryDate).toBeDefined();
    } else {
      expect(startDate).toBeUndefined();
    }
  });

  it('should calculate expiry date for current date', () => {
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    expect(expiryDate.getFullYear()).toBe(today.getFullYear() + 1);
    expect(expiryDate.getMonth()).toBe(today.getMonth());
    expect(expiryDate.getDate()).toBe(today.getDate());
  });
});
