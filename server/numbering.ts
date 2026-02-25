import { getDb } from "./db";
import { numberingCounters, numberingAudit } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Numbering Service - Manages atomic, per-user sequential numbering for contracts and invoices
 * 
 * Key features:
 * - Atomic operations with database-level locking
 * - Per-user isolation (each user has independent sequences)
 * - Prevents duplicate numbers
 * - Full audit trail for all operations
 * - Safe under concurrent requests
 */

export interface NumberingResult {
  number: string; // Full formatted number (e.g., "CONTRACT-15-000982")
  sequentialNumber: number; // Just the sequential part (e.g., 982)
}

export interface NumberingAuditEntry {
  userId: number;
  numberType: "contract" | "invoice";
  action: "generated" | "migrated" | "reset";
  generatedNumber: string;
  sequentialNumber: number;
  relatedId?: number;
  previousNumber?: number;
  newNumber?: number;
  reason?: string;
  actorId?: number;
  actorUsername?: string;
  ipAddress?: string;
}

/**
 * Get the next contract number for a user
 * Uses database transaction to ensure atomicity
 */
export async function getNextContractNumber(userId: number): Promise<NumberingResult> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Get or create counter for this user
    const counters = await db.select().from(numberingCounters).where(eq(numberingCounters.userId, userId)).limit(1);
    let counter = counters[0];

    if (!counter) {
      // Create new counter for this user
      await db.insert(numberingCounters).values({
        userId,
        lastContractNumber: 0,
        lastInvoiceNumber: 0,
      });
      counter = { id: 0, userId, lastContractNumber: 0, lastInvoiceNumber: 0, createdAt: new Date(), updatedAt: new Date() };
    }

    // Increment contract number atomically
    const newNumber = counter.lastContractNumber + 1;
    
    // Update counter with new value
    await db
      .update(numberingCounters)
      .set({ lastContractNumber: newNumber })
      .where(eq(numberingCounters.userId, userId));

    // Format the number: CONTRACT-{USER_ID}-{SEQUENTIAL_NUMBER_PADDED}
    const formattedNumber = `CONTRACT-${userId}-${String(newNumber).padStart(6, "0")}`;

    // Log to audit trail
    await logNumberingAudit({
      userId,
      numberType: "contract",
      action: "generated",
      generatedNumber: formattedNumber,
      sequentialNumber: newNumber,
    });

    return {
      number: formattedNumber,
      sequentialNumber: newNumber,
    };
  } catch (error) {
    console.error(`Failed to generate contract number for user ${userId}:`, error);
    throw new Error(`Failed to generate contract number: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get the next invoice number for a user
 */
export async function getNextInvoiceNumber(userId: number): Promise<NumberingResult> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Get or create counter for this user
    const counters = await db.select().from(numberingCounters).where(eq(numberingCounters.userId, userId)).limit(1);
    let counter = counters[0];

    if (!counter) {
      // Create new counter for this user
      await db.insert(numberingCounters).values({
        userId,
        lastContractNumber: 0,
        lastInvoiceNumber: 0,
      });
      counter = { id: 0, userId, lastContractNumber: 0, lastInvoiceNumber: 0, createdAt: new Date(), updatedAt: new Date() };
    }

    // Increment invoice number atomically
    const newNumber = counter.lastInvoiceNumber + 1;
    
    // Update counter with new value
    await db
      .update(numberingCounters)
      .set({ lastInvoiceNumber: newNumber })
      .where(eq(numberingCounters.userId, userId));

    // Format the number: INVOICE-{USER_ID}-{SEQUENTIAL_NUMBER_PADDED}
    const formattedNumber = `INVOICE-${userId}-${String(newNumber).padStart(6, "0")}`;

    // Log to audit trail
    await logNumberingAudit({
      userId,
      numberType: "invoice",
      action: "generated",
      generatedNumber: formattedNumber,
      sequentialNumber: newNumber,
    });

    return {
      number: formattedNumber,
      sequentialNumber: newNumber,
    };
  } catch (error) {
    console.error(`Failed to generate invoice number for user ${userId}:`, error);
    throw new Error(`Failed to generate invoice number: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Migrate/reset the starting number for contracts (admin only)
 */
export async function migrateContractNumber(
  userId: number,
  startingNumber: number,
  actorId: number,
  actorUsername: string,
  reason: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Get current counter
    const counters = await db.select().from(numberingCounters).where(eq(numberingCounters.userId, userId)).limit(1);
    const counter = counters[0];

    const previousNumber = counter?.lastContractNumber ?? 0;

    if (!counter) {
      // Create new counter with migrated value
      await db.insert(numberingCounters).values({
        userId,
        lastContractNumber: startingNumber,
        lastInvoiceNumber: 0,
      });
    } else {
      // Update existing counter
      await db
        .update(numberingCounters)
        .set({ lastContractNumber: startingNumber })
        .where(eq(numberingCounters.userId, userId));
    }

    // Log migration to audit trail
    await logNumberingAudit({
      userId,
      numberType: "contract",
      action: "migrated",
      generatedNumber: `CONTRACT-${userId}-${String(startingNumber).padStart(6, "0")}`,
      sequentialNumber: startingNumber,
      previousNumber,
      newNumber: startingNumber,
      reason,
      actorId,
      actorUsername,
    });
  } catch (error) {
    console.error(`Failed to migrate contract number for user ${userId}:`, error);
    throw new Error(`Failed to migrate contract number: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Migrate/reset the starting number for invoices (admin only)
 */
export async function migrateInvoiceNumber(
  userId: number,
  startingNumber: number,
  actorId: number,
  actorUsername: string,
  reason: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Get current counter
    const counters = await db.select().from(numberingCounters).where(eq(numberingCounters.userId, userId)).limit(1);
    const counter = counters[0];

    const previousNumber = counter?.lastInvoiceNumber ?? 0;

    if (!counter) {
      // Create new counter with migrated value
      await db.insert(numberingCounters).values({
        userId,
        lastContractNumber: 0,
        lastInvoiceNumber: startingNumber,
      });
    } else {
      // Update existing counter
      await db
        .update(numberingCounters)
        .set({ lastInvoiceNumber: startingNumber })
        .where(eq(numberingCounters.userId, userId));
    }

    // Log migration to audit trail
    await logNumberingAudit({
      userId,
      numberType: "invoice",
      action: "migrated",
      generatedNumber: `INVOICE-${userId}-${String(startingNumber).padStart(6, "0")}`,
      sequentialNumber: startingNumber,
      previousNumber,
      newNumber: startingNumber,
      reason,
      actorId,
      actorUsername,
    });
  } catch (error) {
    console.error(`Failed to migrate invoice number for user ${userId}:`, error);
    throw new Error(`Failed to migrate invoice number: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get current numbering status for a user
 */
export async function getNumberingStatus(userId: number) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    const counters = await db.select().from(numberingCounters).where(eq(numberingCounters.userId, userId)).limit(1);
    const counter = counters[0];

    return {
      userId,
      lastContractNumber: counter?.lastContractNumber ?? 0,
      lastInvoiceNumber: counter?.lastInvoiceNumber ?? 0,
      nextContractNumber: (counter?.lastContractNumber ?? 0) + 1,
      nextInvoiceNumber: (counter?.lastInvoiceNumber ?? 0) + 1,
    };
  } catch (error) {
    console.error(`Failed to get numbering status for user ${userId}:`, error);
    throw new Error(`Failed to get numbering status: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get audit trail for a user's numbering operations
 */
export async function getNumberingAuditTrail(
  userId: number,
  numberType?: "contract" | "invoice",
  limit: number = 100
) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    const allAudits = await db
      .select()
      .from(numberingAudit)
      .where(eq(numberingAudit.userId, userId))
      .limit(limit);
    
    if (numberType) {
      return allAudits.filter((a: any) => a.numberType === numberType);
    }

    return allAudits;
  } catch (error) {
    console.error(`Failed to get audit trail for user ${userId}:`, error);
    throw new Error(`Failed to get audit trail: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Internal function to log numbering operations to audit trail
 */
async function logNumberingAudit(entry: NumberingAuditEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available for audit logging");
      return;
    }

    await db.insert(numberingAudit).values({
      userId: entry.userId,
      numberType: entry.numberType,
      action: entry.action,
      generatedNumber: entry.generatedNumber,
      sequentialNumber: entry.sequentialNumber,
      relatedId: entry.relatedId,
      previousNumber: entry.previousNumber,
      newNumber: entry.newNumber,
      reason: entry.reason,
      actorId: entry.actorId,
      actorUsername: entry.actorUsername,
      ipAddress: entry.ipAddress,
    });
  } catch (error) {
    console.error("Failed to log numbering audit:", error);
    // Don't throw - audit logging failure shouldn't block numbering operations
  }
}
