import { eq, and, lte, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, vehicles, InsertVehicle, maintenanceRecords, InsertMaintenanceRecord, rentalContracts, InsertRentalContract, damageMarks, InsertDamageMark, clients, InsertClient, Client } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Vehicle Management Queries
export async function getAllVehicles() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vehicles: database not available");
    return [];
  }
  
  const now = new Date();
  
  // Get all vehicles with their rental status
  const allVehicles = await db.select().from(vehicles);
  
  // Check each vehicle for active rentals
  const vehiclesWithStatus = await Promise.all(
    allVehicles.map(async (vehicle) => {
      // Check if vehicle has an active rental contract
      const activeRentals = await db
        .select()
        .from(rentalContracts)
        .where(
          and(
            eq(rentalContracts.vehicleId, vehicle.id),
            lte(rentalContracts.rentalStartDate, now),
            gte(rentalContracts.rentalEndDate, now)
          )
        )
        .limit(1);
      
      // If vehicle has an active rental, override status to "Rented"
      // Unless it's in Maintenance or Out of Service (those take priority)
      let effectiveStatus = vehicle.status;
      if (activeRentals.length > 0) {
        if (vehicle.status === "Available") {
          effectiveStatus = "Rented";
        }
        // If status is Maintenance or Out of Service, keep that status
        // (maintenance/repairs take priority over rental status)
      }
      
      return {
        ...vehicle,
        status: effectiveStatus,
      };
    })
  );
  
  return vehiclesWithStatus;
}

export async function getVehicleById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vehicle: database not available");
    return undefined;
  }
  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createVehicle(vehicle: InsertVehicle) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(vehicles).values(vehicle);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const created = await db.select().from(vehicles).where(eq(vehicles.id, insertId)).limit(1);
  if (created.length === 0) {
    throw new Error("Failed to retrieve created vehicle");
  }
  return created[0];
}

export async function updateVehicle(id: number, vehicle: Partial<InsertVehicle>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.update(vehicles).set(vehicle).where(eq(vehicles.id, id));
}

export async function deleteVehicle(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

// Maintenance Records Queries
export async function getMaintenanceRecordsByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get maintenance records: database not available");
    return [];
  }
  return await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.vehicleId, vehicleId));
}

export async function createMaintenanceRecord(record: InsertMaintenanceRecord) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(maintenanceRecords).values(record);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const created = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, insertId)).limit(1);
  if (created.length === 0) {
    throw new Error("Failed to retrieve created maintenance record");
  }
  return created[0];
}

// Rental Contract Queries
export async function getAllRentalContracts() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contracts: database not available");
    return [];
  }
  return await db.select().from(rentalContracts);
}

export async function getRentalContractById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contract: database not available");
    return undefined;
  }
  const result = await db.select().from(rentalContracts).where(eq(rentalContracts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createRentalContract(contract: InsertRentalContract) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(rentalContracts).values(contract);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const created = await db.select().from(rentalContracts).where(eq(rentalContracts.id, insertId)).limit(1);
  if (created.length === 0) {
    throw new Error("Failed to retrieve created contract");
  }
  return created[0];
}

export async function renewRentalContract(input: { contractId: number; additionalDays: number; newEndDate: Date }) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Get the existing contract
  const existing = await db.select().from(rentalContracts).where(eq(rentalContracts.id, input.contractId)).limit(1);
  if (existing.length === 0) {
    throw new Error("Contract not found");
  }
  
  const contract = existing[0];
  const newRentalDays = contract.rentalDays + input.additionalDays;
  const dailyRateNum = parseFloat(contract.dailyRate);
  const additionalAmount = dailyRateNum * input.additionalDays;
  const newTotalAmount = parseFloat(contract.totalAmount) + additionalAmount;
  const discountNum = parseFloat(contract.discount || "0");
  const newFinalAmount = newTotalAmount - discountNum;
  
  // Update the contract
  await db
    .update(rentalContracts)
    .set({
      rentalEndDate: input.newEndDate,
      rentalDays: newRentalDays,
      totalAmount: newTotalAmount.toFixed(2),
      finalAmount: newFinalAmount.toFixed(2),
    })
    .where(eq(rentalContracts.id, input.contractId));
  
  // Return the updated contract
  const updated = await db.select().from(rentalContracts).where(eq(rentalContracts.id, input.contractId)).limit(1);
  return updated[0];
}

export async function getRentalContractsByStatus(status?: "Active" | "Returned" | "Archived") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contracts: database not available");
    return [];
  }
  if (!status) {
    // Return all contracts if no status specified
    return await db.select().from(rentalContracts);
  }
  return await db.select().from(rentalContracts).where(eq(rentalContracts.status, status));
}

export async function markContractAsReturned(contractId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  await db
    .update(rentalContracts)
    .set({
      status: "Returned",
      returnedAt: new Date(),
    })
    .where(eq(rentalContracts.id, contractId));
  
  // Return the updated contract
  const updated = await db.select().from(rentalContracts).where(eq(rentalContracts.id, contractId)).limit(1);
  return updated[0];
}

export async function updateContractStatus(contractId: number, status: "Active" | "Returned" | "Archived") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  const updateData: any = { status };
  if (status === "Returned" && !updateData.returnedAt) {
    updateData.returnedAt = new Date();
  }
  
  await db
    .update(rentalContracts)
    .set(updateData)
    .where(eq(rentalContracts.id, contractId));
  
  // Return the updated contract
  const updated = await db.select().from(rentalContracts).where(eq(rentalContracts.id, contractId)).limit(1);
  return updated[0];
}

export async function getDamageMarksByContractId(contractId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get damage marks: database not available");
    return [];
  }
  return await db.select().from(damageMarks).where(eq(damageMarks.contractId, contractId));
}

export async function createDamageMark(mark: InsertDamageMark) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(damageMarks).values(mark);
  return result;
}


// ===== Client Management =====

export async function createClient(client: InsertClient): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(client);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(clients).where(eq(clients.id, insertId)).limit(1);
  if (!created[0]) throw new Error("Failed to retrieve created client");
  
  return created[0];
}

export async function getAllClients(): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients);
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function getClientByLicenseNumber(licenseNumber: string): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients).where(eq(clients.drivingLicenseNumber, licenseNumber)).limit(1);
  return result[0];
}

export async function updateClient(id: number, updates: Partial<InsertClient>): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(clients).set(updates).where(eq(clients.id, id));
  return await getClientById(id);
}

export async function deleteClient(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(clients).where(eq(clients.id, id));
}
