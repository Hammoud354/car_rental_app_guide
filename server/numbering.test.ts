import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getNextContractNumber,
  getNextInvoiceNumber,
  migrateContractNumber,
  migrateInvoiceNumber,
  getNumberingStatus,
  getNumberingAuditTrail,
} from "./numbering";
import { getDb } from "./db";
import { numberingCounters, numberingAudit } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Numbering Service", () => {
  const testUserId = 999;
  const testAdminId = 1;
  const testAdminUsername = "admin";

  beforeEach(async () => {
    // Clean up test data before each test
    const db = await getDb();
    if (db) {
      await db.delete(numberingCounters).where(eq(numberingCounters.userId, testUserId));
      await db.delete(numberingAudit).where(eq(numberingAudit.userId, testUserId));
    }
  });

  afterEach(async () => {
    // Clean up test data after each test
    const db = await getDb();
    if (db) {
      await db.delete(numberingCounters).where(eq(numberingCounters.userId, testUserId));
      await db.delete(numberingAudit).where(eq(numberingAudit.userId, testUserId));
    }
  });

  describe("Contract Numbering", () => {
    it("should generate first contract number with correct format", async () => {
      const result = await getNextContractNumber(testUserId);

      expect(result.number).toBe(`CONTRACT-${testUserId}-000001`);
      expect(result.sequentialNumber).toBe(1);
    });

    it("should increment contract numbers sequentially", async () => {
      const first = await getNextContractNumber(testUserId);
      const second = await getNextContractNumber(testUserId);
      const third = await getNextContractNumber(testUserId);

      expect(first.sequentialNumber).toBe(1);
      expect(second.sequentialNumber).toBe(2);
      expect(third.sequentialNumber).toBe(3);

      expect(first.number).toBe(`CONTRACT-${testUserId}-000001`);
      expect(second.number).toBe(`CONTRACT-${testUserId}-000002`);
      expect(third.number).toBe(`CONTRACT-${testUserId}-000003`);
    });

    it("should never reset contract numbers", async () => {
      const first = await getNextContractNumber(testUserId);
      expect(first.sequentialNumber).toBe(1);

      // Migrate to 100
      await migrateContractNumber(testUserId, 100, testAdminId, testAdminUsername, "Test migration");

      // Next number should be 101, not reset to 1
      const next = await getNextContractNumber(testUserId);
      expect(next.sequentialNumber).toBe(101);
    });
  });

  describe("Invoice Numbering", () => {
    it("should generate first invoice number with correct format", async () => {
      const result = await getNextInvoiceNumber(testUserId);

      expect(result.number).toBe(`INVOICE-${testUserId}-000001`);
      expect(result.sequentialNumber).toBe(1);
    });

    it("should increment invoice numbers sequentially", async () => {
      const first = await getNextInvoiceNumber(testUserId);
      const second = await getNextInvoiceNumber(testUserId);
      const third = await getNextInvoiceNumber(testUserId);

      expect(first.sequentialNumber).toBe(1);
      expect(second.sequentialNumber).toBe(2);
      expect(third.sequentialNumber).toBe(3);

      expect(first.number).toBe(`INVOICE-${testUserId}-000001`);
      expect(second.number).toBe(`INVOICE-${testUserId}-000002`);
      expect(third.number).toBe(`INVOICE-${testUserId}-000003`);
    });

    it("should never reset invoice numbers", async () => {
      const first = await getNextInvoiceNumber(testUserId);
      expect(first.sequentialNumber).toBe(1);

      // Migrate to 500
      await migrateInvoiceNumber(testUserId, 500, testAdminId, testAdminUsername, "Test migration");

      // Next number should be 501, not reset to 1
      const next = await getNextInvoiceNumber(testUserId);
      expect(next.sequentialNumber).toBe(501);
    });
  });

  describe("Per-User Isolation", () => {
    it("should maintain independent sequences for different users", async () => {
      const userId1 = 100;
      const userId2 = 200;

      // Clean up
      const db = await getDb();
      if (db) {
        await db.delete(numberingCounters).where(eq(numberingCounters.userId, userId1));
        await db.delete(numberingCounters).where(eq(numberingCounters.userId, userId2));
      }

      const user1Contract1 = await getNextContractNumber(userId1);
      const user2Contract1 = await getNextContractNumber(userId2);
      const user1Contract2 = await getNextContractNumber(userId1);

      expect(user1Contract1.number).toBe(`CONTRACT-${userId1}-000001`);
      expect(user2Contract1.number).toBe(`CONTRACT-${userId2}-000001`);
      expect(user1Contract2.number).toBe(`CONTRACT-${userId1}-000002`);

      // Clean up
      if (db) {
        await db.delete(numberingCounters).where(eq(numberingCounters.userId, userId1));
        await db.delete(numberingCounters).where(eq(numberingCounters.userId, userId2));
        await db.delete(numberingAudit).where(eq(numberingAudit.userId, userId1));
        await db.delete(numberingAudit).where(eq(numberingAudit.userId, userId2));
      }
    });

    it("should not affect invoice sequence when generating contracts", async () => {
      const contract1 = await getNextContractNumber(testUserId);
      const invoice1 = await getNextInvoiceNumber(testUserId);
      const contract2 = await getNextContractNumber(testUserId);
      const invoice2 = await getNextInvoiceNumber(testUserId);

      expect(contract1.sequentialNumber).toBe(1);
      expect(invoice1.sequentialNumber).toBe(1);
      expect(contract2.sequentialNumber).toBe(2);
      expect(invoice2.sequentialNumber).toBe(2);
    });
  });

  describe("Migration & Reset", () => {
    it("should migrate contract number to starting value", async () => {
      await migrateContractNumber(testUserId, 500, testAdminId, testAdminUsername, "Migration from legacy system");

      const result = await getNextContractNumber(testUserId);
      expect(result.sequentialNumber).toBe(501);
    });

    it("should migrate invoice number to starting value", async () => {
      await migrateInvoiceNumber(testUserId, 1000, testAdminId, testAdminUsername, "Migration from legacy system");

      const result = await getNextInvoiceNumber(testUserId);
      expect(result.sequentialNumber).toBe(1001);
    });
  });

  describe("Numbering Status", () => {
    it("should return correct status for new user", async () => {
      const status = await getNumberingStatus(testUserId);

      expect(status.userId).toBe(testUserId);
      expect(status.lastContractNumber).toBe(0);
      expect(status.lastInvoiceNumber).toBe(0);
      expect(status.nextContractNumber).toBe(1);
      expect(status.nextInvoiceNumber).toBe(1);
    });

    it("should return correct status after generating numbers", async () => {
      await getNextContractNumber(testUserId);
      await getNextContractNumber(testUserId);
      await getNextInvoiceNumber(testUserId);

      const status = await getNumberingStatus(testUserId);

      expect(status.lastContractNumber).toBe(2);
      expect(status.lastInvoiceNumber).toBe(1);
      expect(status.nextContractNumber).toBe(3);
      expect(status.nextInvoiceNumber).toBe(2);
    });
  });

  describe("Audit Trail", () => {
    it("should log contract number generation", async () => {
      await getNextContractNumber(testUserId);

      const audit = await getNumberingAuditTrail(testUserId, "contract");
      expect(audit.length).toBeGreaterThan(0);
      expect(audit[0].numberType).toBe("contract");
      expect(audit[0].action).toBe("generated");
      expect(audit[0].generatedNumber).toContain("CONTRACT");
    });

    it("should log invoice number generation", async () => {
      await getNextInvoiceNumber(testUserId);

      const audit = await getNumberingAuditTrail(testUserId, "invoice");
      expect(audit.length).toBeGreaterThan(0);
      expect(audit[0].numberType).toBe("invoice");
      expect(audit[0].action).toBe("generated");
      expect(audit[0].generatedNumber).toContain("INVOICE");
    });

    it("should log migration with admin info", async () => {
      await migrateContractNumber(testUserId, 500, testAdminId, testAdminUsername, "Legacy migration");

      const audit = await getNumberingAuditTrail(testUserId, "contract");
      const migrationRecord = audit.find((a: any) => a.action === "migrated");

      expect(migrationRecord).toBeDefined();
      expect(migrationRecord?.actorId).toBe(testAdminId);
      expect(migrationRecord?.actorUsername).toBe(testAdminUsername);
      expect(migrationRecord?.reason).toBe("Legacy migration");
    });
  });
});
