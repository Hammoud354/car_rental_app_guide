import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Subscription System", () => {
  const testUserId = 2730024;

  describe("getUserSubscription", () => {
    it("should return subscription data for user 2730024", async () => {
      const subscription = await db.getUserSubscription(testUserId);
      
      expect(subscription).toBeDefined();
      expect(subscription?.userId).toBe(testUserId);
      expect(subscription?.status).toBe("active");
      expect(subscription?.tier).toBeDefined();
    });

    it("should return Starter plan details", async () => {
      const subscription = await db.getUserSubscription(testUserId);
      
      expect(subscription?.tier?.name).toBe("Starter");
      expect(subscription?.tier?.maxVehicles).toBe(15);
      expect(subscription?.tier?.maxClients).toBe(100);
    });

    it("should parse features correctly", async () => {
      const subscription = await db.getUserSubscription(testUserId);
      
      expect(subscription?.tier?.features).toBeDefined();
      // Features should be an object or array, not a string
      expect(typeof subscription?.tier?.features).not.toBe("string");
    });
  });

  describe("Vehicle Count Query", () => {
    it("should count vehicles for user 2730024", async () => {
      const database = await db.getDb();
      expect(database).toBeDefined();

      if (database) {
        const { sql } = await import("drizzle-orm");
        const result = await database.execute(
          sql`SELECT COUNT(*) as count FROM vehicles WHERE userId = ${testUserId}`
        ) as any;

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        
        // The result structure is: result[0] = array of rows, result[0][0] = first row
        const count = result[0]?.[0]?.count;
        expect(count).toBe(15);
      }
    });
  });

  describe("Client Count Query", () => {
    it("should count clients for user 2730024", async () => {
      const database = await db.getDb();
      expect(database).toBeDefined();

      if (database) {
        const { sql } = await import("drizzle-orm");
        const result = await database.execute(
          sql`SELECT COUNT(*) as count FROM clients WHERE userId = ${testUserId}`
        ) as any;

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        
        // The result structure is: result[0] = array of rows, result[0][0] = first row
        const count = result[0]?.[0]?.count;
        expect(typeof count).toBe("number");
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Subscription Limits", () => {
    it("user 2730024 should have 15 of 15 vehicles used", async () => {
      const subscription = await db.getUserSubscription(testUserId);
      const database = await db.getDb();

      if (database && subscription?.tier) {
        const { sql } = await import("drizzle-orm");
        const result = await database.execute(
          sql`SELECT COUNT(*) as count FROM vehicles WHERE userId = ${testUserId}`
        ) as any;

        const vehicleCount = result[0]?.[0]?.count || 0;
        const maxVehicles = subscription.tier.maxVehicles;

        expect(vehicleCount).toBe(15);
        expect(maxVehicles).toBe(15);
        expect(vehicleCount).toBe(maxVehicles);
      }
    });

    it("user 2730024 should be at their vehicle limit", async () => {
      const subscription = await db.getUserSubscription(testUserId);
      const database = await db.getDb();

      if (database && subscription?.tier) {
        const { sql } = await import("drizzle-orm");
        const result = await database.execute(
          sql`SELECT COUNT(*) as count FROM vehicles WHERE userId = ${testUserId}`
        ) as any;

        const vehicleCount = result[0]?.[0]?.count || 0;
        const maxVehicles = subscription.tier.maxVehicles;

        // User should not be able to add more vehicles
        expect(vehicleCount >= maxVehicles).toBe(true);
      }
    });
  });
});
