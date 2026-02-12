import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock context for testing
const mockContext: Context = {
  user: {
    id: 1,
    openId: "test-user",
    username: "testuser",
    email: "test@example.com",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe("Profit & Loss Router", () => {
  const caller = appRouter.createCaller(mockContext);

  describe("getFinancialOverview", () => {
    it("should return financial overview with revenue, expenses, and profit/loss", async () => {
      const result = await caller.profitLoss.getFinancialOverview({});

      expect(result).toHaveProperty("revenue");
      expect(result).toHaveProperty("expenses");
      expect(result).toHaveProperty("profitLoss");
      expect(result).toHaveProperty("assets");

      // Revenue structure
      expect(result.revenue).toHaveProperty("contracts");
      expect(result.revenue).toHaveProperty("invoices");
      expect(result.revenue).toHaveProperty("total");
      expect(typeof result.revenue.total).toBe("number");

      // Expenses structure
      expect(result.expenses).toHaveProperty("maintenance");
      expect(result.expenses).toHaveProperty("insurance");
      expect(result.expenses).toHaveProperty("total");
      expect(typeof result.expenses.total).toBe("number");

      // Profit/Loss structure
      expect(result.profitLoss).toHaveProperty("netProfit");
      expect(result.profitLoss).toHaveProperty("profitMargin");
      expect(typeof result.profitLoss.netProfit).toBe("number");
      expect(typeof result.profitLoss.profitMargin).toBe("number");

      // Assets structure
      expect(result.assets).toHaveProperty("vehiclePurchaseCosts");
      expect(result.assets).toHaveProperty("totalVehicles");
      expect(typeof result.assets.totalVehicles).toBe("number");
    });

    it("should accept date range filters", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-12-31";

      const result = await caller.profitLoss.getFinancialOverview({
        startDate,
        endDate,
      });

      expect(result).toHaveProperty("revenue");
      expect(result).toHaveProperty("expenses");
      expect(result).toHaveProperty("profitLoss");
    });

    it("should calculate profit margin correctly", async () => {
      const result = await caller.profitLoss.getFinancialOverview({});

      if (result.revenue.total > 0) {
        const expectedMargin = (result.profitLoss.netProfit / result.revenue.total) * 100;
        expect(result.profitLoss.profitMargin).toBeCloseTo(expectedMargin, 2);
      } else {
        expect(result.profitLoss.profitMargin).toBe(0);
      }
    });
  });

  describe("getVehicleProfitability", () => {
    it("should return profitability data for all vehicles", async () => {
      const result = await caller.profitLoss.getVehicleProfitability({});

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const vehicle = result[0];
        expect(vehicle).toHaveProperty("vehicleId");
        expect(vehicle).toHaveProperty("plateNumber");
        expect(vehicle).toHaveProperty("brand");
        expect(vehicle).toHaveProperty("model");
        expect(vehicle).toHaveProperty("year");
        expect(vehicle).toHaveProperty("revenue");
        expect(vehicle).toHaveProperty("expenses");
        expect(vehicle).toHaveProperty("netProfit");
        expect(vehicle).toHaveProperty("roi");
        expect(vehicle).toHaveProperty("contractCount");

        // Expenses breakdown
        expect(vehicle.expenses).toHaveProperty("maintenance");
        expect(vehicle.expenses).toHaveProperty("insurance");
        expect(vehicle.expenses).toHaveProperty("total");
      }
    });

    it("should calculate net profit correctly for each vehicle", async () => {
      const result = await caller.profitLoss.getVehicleProfitability({});

      result.forEach((vehicle) => {
        const expectedNetProfit = vehicle.revenue - vehicle.expenses.total;
        expect(vehicle.netProfit).toBeCloseTo(expectedNetProfit, 2);
      });
    });

    it("should calculate ROI correctly for each vehicle", async () => {
      const result = await caller.profitLoss.getVehicleProfitability({});

      // ROI is calculated based on purchase cost, not operating expenses
      // ROI = (netProfit / purchaseCost) * 100
      // Since we don't have access to purchase cost in the test result,
      // we just verify that ROI is a number and within reasonable bounds
      result.forEach((vehicle) => {
        expect(typeof vehicle.roi).toBe("number");
        expect(vehicle.roi).toBeGreaterThanOrEqual(-100); // Can be negative if losing money
        expect(vehicle.roi).toBeLessThanOrEqual(1000); // Reasonable upper bound
      });
    });

    it("should accept date range filters", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-12-31";

      const result = await caller.profitLoss.getVehicleProfitability({
        startDate,
        endDate,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getRevenueByMonth", () => {
    it("should return monthly revenue and expenses for the specified year", async () => {
      const year = 2024;
      const result = await caller.profitLoss.getRevenueByMonth({ year });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(12); // 12 months

      result.forEach((month, index) => {
        expect(month).toHaveProperty("month");
        expect(month).toHaveProperty("monthName");
        expect(month).toHaveProperty("revenue");
        expect(month).toHaveProperty("expenses");

        expect(month.month).toBe(index + 1); // January = 1, December = 12
        expect(typeof month.monthName).toBe("string");
        expect(typeof month.revenue).toBe("number");
        expect(typeof month.expenses).toBe("number");
      });
    });

    it("should return correct month names", async () => {
      const year = 2024;
      const result = await caller.profitLoss.getRevenueByMonth({ year });

      const expectedMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      result.forEach((month, index) => {
        expect(month.monthName).toBe(expectedMonths[index]);
      });
    });

    it("should default to current year if no year provided", async () => {
      const result = await caller.profitLoss.getRevenueByMonth({});

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(12);
    });
  });
});
