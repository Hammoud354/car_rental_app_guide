import { eq, and, or, lte, gte, lt, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, vehicles, InsertVehicle, maintenanceRecords, InsertMaintenanceRecord, rentalContracts, InsertRentalContract, damageMarks, InsertDamageMark, clients, InsertClient, Client, carMakers, carModels, companySettings, InsertCompanySettings, CompanySettings, invoices, invoiceLineItems, InsertInvoice, nationalities, InsertNationality } from "../drizzle/schema";
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
      username: user.username || `oauth_${user.openId}`, // Generate username from openId if not provided
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
export async function getAllVehicles(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vehicles: database not available");
    return [];
  }
  
  // Return only vehicles belonging to the specified user
  const allVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, userId));
  
  // Calculate total maintenance cost for each vehicle
  const vehiclesWithCosts = await Promise.all(
    allVehicles.map(async (vehicle) => {
      const records = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.vehicleId, vehicle.id));
      const totalMaintenanceCost = records.reduce((sum, record) => {
        const cost = record.cost ? parseFloat(record.cost.toString()) : 0;
        return sum + cost;
      }, 0);
      return {
        ...vehicle,
        totalMaintenanceCost: totalMaintenanceCost.toFixed(2)
      };
    })
  );
  
  return vehiclesWithCosts;
}

export async function getVehicleById(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vehicle: database not available");
    return undefined;
  }
  const result = await db.select().from(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createVehicle(vehicle: InsertVehicle) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  // Filter out undefined values to prevent database errors
  const cleanedVehicle = Object.fromEntries(
    Object.entries(vehicle).filter(([_, value]) => value !== undefined)
  ) as InsertVehicle;
  const result = await db.insert(vehicles).values(cleanedVehicle);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const created = await db.select().from(vehicles).where(eq(vehicles.id, insertId)).limit(1);
  if (created.length === 0) {
    throw new Error("Failed to retrieve created vehicle");
  }
  return created[0];
}

export async function updateVehicle(id: number, userId: number, vehicle: Partial<InsertVehicle>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.update(vehicles).set(vehicle).where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)));
}

export async function deleteVehicle(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.delete(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)));
}

// Maintenance Records Queries
export async function getMaintenanceRecordsByVehicleId(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get maintenance records: database not available");
    return [];
  }
  return await db.select().from(maintenanceRecords).where(and(eq(maintenanceRecords.vehicleId, vehicleId), eq(maintenanceRecords.userId, userId)));
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
export async function getAllRentalContracts(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contracts: database not available");
    return [];
  }
  return await db.select().from(rentalContracts).where(eq(rentalContracts.userId, userId));
}

export async function getRentalContractById(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contract: database not available");
    return undefined;
  }
  const result = await db.select().from(rentalContracts).where(and(eq(rentalContracts.id, id), eq(rentalContracts.userId, userId))).limit(1);
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

export async function getRentalContractsByStatus(userId: number, status?: "active" | "completed" | "overdue") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contracts: database not available");
    return [];
  }
  if (!status) {
    // Return all contracts if no status specified
    return await db.select().from(rentalContracts).where(eq(rentalContracts.userId, userId));
  }
  return await db.select().from(rentalContracts).where(and(eq(rentalContracts.userId, userId), eq(rentalContracts.status, status)));
}

export async function getActiveContractsByVehicleId(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get active contracts: database not available");
    return [];
  }
  return await db.select().from(rentalContracts)
    .where(and(eq(rentalContracts.vehicleId, vehicleId), eq(rentalContracts.userId, userId), eq(rentalContracts.status, "active")));
}

export async function getRentalContractsByClientId(clientId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contracts by client: database not available");
    return [];
  }
  return await db.select().from(rentalContracts)
    .where(and(eq(rentalContracts.clientId, clientId), eq(rentalContracts.userId, userId)))
    .orderBy(desc(rentalContracts.rentalStartDate));
}

export async function markContractAsReturned(
  contractId: number, 
  returnKm?: number,
  returnFuelLevel?: "Empty" | "1/4" | "1/2" | "3/4" | "Full",
  returnNotes?: string,
  damageInspection?: string,
  overLimitKmFee?: number
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Get the contract to find the vehicle
  const contract = await db.select().from(rentalContracts)
    .where(eq(rentalContracts.id, contractId))
    .limit(1);
  
  if (!contract || contract.length === 0) {
    throw new Error("Contract not found");
  }
  
  // Get the vehicle info
  const vehicle = await db.select().from(vehicles)
    .where(eq(vehicles.id, contract[0].vehicleId))
    .limit(1);
  
  // Check if there's a maintenance record with kmDueMaintenance set for this vehicle
  const maintenanceRecord = await db.select().from(maintenanceRecords)
    .where(eq(maintenanceRecords.vehicleId, contract[0].vehicleId))
    .orderBy(desc(maintenanceRecords.kmDueMaintenance))
    .limit(1);
  
  let maintenanceAlert = null;
  if (vehicle && vehicle.length > 0 && maintenanceRecord && maintenanceRecord.length > 0 && maintenanceRecord[0].kmDueMaintenance && returnKm) {
    const kmDue = maintenanceRecord[0].kmDueMaintenance;
    if (returnKm >= kmDue) {
      maintenanceAlert = {
        isDue: true,
        vehiclePlate: vehicle[0].plateNumber,
        vehicleModel: vehicle[0].model,
        currentKm: returnKm,
        maintenanceDueKm: kmDue,
        kmOverdue: returnKm - kmDue
      };
    }
  }
  
  // Update contract status and return information
  await db
    .update(rentalContracts)
    .set({
      status: "completed",
      returnedAt: new Date(),
      ...(returnKm !== undefined && { returnKm }),
      ...(returnFuelLevel && { returnFuelLevel }),
      ...(returnNotes && { returnNotes }),
      ...(damageInspection && { damageInspection }),
      ...(overLimitKmFee !== undefined && { overLimitKmFee: overLimitKmFee.toFixed(2) }),
    })
    .where(eq(rentalContracts.id, contractId));
  
  // Update vehicle status back to Available
  if (contract[0].vehicleId) {
    await db
      .update(vehicles)
      .set({ status: "Available" })
      .where(eq(vehicles.id, contract[0].vehicleId));
  }
  
  return { success: true, maintenanceAlert };
}

export async function deleteRentalContract(contractId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Delete associated damage marks first
  await db.delete(damageMarks).where(eq(damageMarks.contractId, contractId));
  
  // Then delete the contract
  await db.delete(rentalContracts).where(eq(rentalContracts.id, contractId));
  
  return { success: true };
}

export async function updateOverdueContracts() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update overdue contracts: database not available");
    return { updated: 0 };
  }
  
  // Find all contracts where return date has passed (both active and already overdue)
  const now = new Date();
  
  // Get all contracts that are overdue or should be overdue
  const overdueContracts = await db
    .select()
    .from(rentalContracts)
    .where(
      and(
        or(
          eq(rentalContracts.status, "active"),
          eq(rentalContracts.status, "overdue")
        ),
        lt(rentalContracts.rentalEndDate, now)
      )
    );
  
  // Update each contract with calculated late fee and send notification for newly overdue
  let updatedCount = 0;
  for (const contract of overdueContracts) {
    const daysOverdue = Math.floor((now.getTime() - new Date(contract.rentalEndDate).getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = parseFloat(contract.dailyRate);
    const lateFeePercentage = parseFloat(contract.lateFeePercentage || "100");
    const lateFee = (dailyRate * (lateFeePercentage / 100) * daysOverdue).toFixed(2);
    
    const isNewlyOverdue = contract.status === "active";
    
    await db
      .update(rentalContracts)
      .set({ 
        status: "overdue",
        lateFee: lateFee
      })
      .where(eq(rentalContracts.id, contract.id));
    
    // Only send notification for newly overdue contracts (not already marked as overdue)
    if (isNewlyOverdue) {
      const { notifyOwner } = await import("./_core/notification");
      const { sendWhatsApp } = await import("./_core/whatsapp");
      const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, contract.vehicleId)).limit(1);
      const vehicleInfo = vehicle[0] ? `${vehicle[0].brand} ${vehicle[0].model} (${vehicle[0].plateNumber})` : `Vehicle ID ${contract.vehicleId}`;
      
      const notificationMessage = `Contract ${contract.contractNumber} is now overdue by ${daysOverdue} day(s).\n\nClient: ${contract.clientFirstName} ${contract.clientLastName}\nVehicle: ${vehicleInfo}\nReturn Date: ${new Date(contract.rentalEndDate).toLocaleDateString()}\nLate Fee: $${lateFee}\n\nAction Required: Contact client immediately to arrange vehicle return.`;
      
      // Send in-app notification
      await notifyOwner({
        title: `⚠️ Contract Overdue: ${contract.contractNumber}`,
        content: notificationMessage
      });
      
      // Send WhatsApp notification
      await sendWhatsApp({
        message: `🚨 *RENTAL OVERDUE ALERT*\n\n📋 Contract: ${contract.contractNumber}\n👤 Client: ${contract.clientFirstName} ${contract.clientLastName}\n🚗 Vehicle: ${vehicleInfo}\n⏰ Days Overdue: ${daysOverdue}\n💰 Late Fee: $${lateFee}\n\n⚠️ *Action Required:* Contact client immediately to arrange vehicle return!`
      });
    }
    
    updatedCount++;
  }
  
  return { updated: updatedCount };
}

export async function getOverdueStatistics(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get overdue statistics: database not available");
    return { count: 0, totalLateFees: "0.00", avgDaysOverdue: 0 };
  }
  
  const overdueContracts = await db
    .select()
    .from(rentalContracts)
    .where(and(eq(rentalContracts.userId, userId), eq(rentalContracts.status, "overdue")));
  
  const count = overdueContracts.length;
  const totalLateFees = overdueContracts.reduce((sum, contract) => sum + parseFloat(contract.lateFee || "0"), 0).toFixed(2);
  
  const now = new Date();
  const totalDaysOverdue = overdueContracts.reduce((sum, contract) => {
    const daysOverdue = Math.floor((now.getTime() - new Date(contract.rentalEndDate).getTime()) / (1000 * 60 * 60 * 24));
    return sum + daysOverdue;
  }, 0);
  
  const avgDaysOverdue = count > 0 ? Math.round(totalDaysOverdue / count) : 0;
  
  return { count, totalLateFees, avgDaysOverdue };
}

export async function updateContractStatus(contractId: number, status: "active" | "completed" | "overdue") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  const updateData: any = { status };
  if (status === "completed" && !updateData.returnedAt) {
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

export async function bulkUpdateContractStatus(contractIds: number[], status: "active" | "completed" | "overdue") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  const updateData: any = { status };
  if (status === "completed") {
    updateData.returnedAt = new Date();
  }
  
  // Update all contracts with the given IDs
  for (const contractId of contractIds) {
    await db
      .update(rentalContracts)
      .set(updateData)
      .where(eq(rentalContracts.id, contractId));
  }
  
  return { success: true, updatedCount: contractIds.length };
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

export async function getAllClients(userId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients).where(eq(clients.userId, userId));
}

export async function getClientById(id: number, userId: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId))).limit(1);
  return result[0];
}

export async function getClientByLicenseNumber(licenseNumber: string, userId: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients).where(and(eq(clients.drivingLicenseNumber, licenseNumber), eq(clients.userId, userId))).limit(1);
  return result[0];
}

export async function updateClient(id: number, userId: number, updates: Partial<InsertClient>): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(clients).set(updates).where(and(eq(clients.id, id), eq(clients.userId, userId)));
  return await getClientById(id, userId);
}

export async function deleteClient(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

// Vehicle Profitability Analytics
export async function getVehicleProfitabilityAnalytics(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all vehicles with their financial data for this user
  const allVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, userId));
  
  const analytics = await Promise.all(
    allVehicles.map(async (vehicle) => {
      // Calculate total revenue from completed contracts
      const completedContracts = await db
        .select()
        .from(rentalContracts)
        .where(
          and(
            eq(rentalContracts.vehicleId, vehicle.id),
            eq(rentalContracts.status, "completed")
          )
        );
      
      const totalRevenue = completedContracts.reduce(
        (sum, contract) => sum + Number(contract.finalAmount || 0),
        0
      );
      
      // Calculate total maintenance costs
      const maintenanceHistory = await db
        .select()
        .from(maintenanceRecords)
        .where(eq(maintenanceRecords.vehicleId, vehicle.id));
      
      const totalMaintenanceCost = maintenanceHistory.reduce(
        (sum, record) => sum + Number(record.cost || 0),
        0
      );
      
      // Get insurance cost
      const insuranceCost = Number(vehicle.insuranceCost || 0);
      
      // Calculate net profit
      const netProfit = totalRevenue - totalMaintenanceCost - insuranceCost;
      
      // Calculate profit margin percentage
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        category: vehicle.category,
        totalRevenue,
        totalMaintenanceCost,
        insuranceCost,
        netProfit,
        profitMargin,
        rentalCount: completedContracts.length,
        maintenanceCount: maintenanceHistory.length,
      };
    })
  );
  
  return analytics;
}

export async function getVehicleFinancialDetails(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Get vehicle info for this user
  const vehicle = await db.select().from(vehicles).where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId))).limit(1);
  
  if (!vehicle || vehicle.length === 0) {
    throw new Error("Vehicle not found");
  }
  
  // Get all completed contracts
  const completedContracts = await db
    .select()
    .from(rentalContracts)
    .where(
      and(
        eq(rentalContracts.vehicleId, vehicleId),
        eq(rentalContracts.status, "completed")
      )
    )
    .orderBy(desc(rentalContracts.rentalStartDate));
  
  // Get all maintenance records
  const maintenanceHistory = await db
    .select()
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.vehicleId, vehicleId))
    .orderBy(desc(maintenanceRecords.performedAt));
  
  // Calculate totals
  const totalRevenue = completedContracts.reduce(
    (sum, contract) => sum + Number(contract.finalAmount || 0),
    0
  );
  
  const totalMaintenanceCost = maintenanceHistory.reduce(
    (sum, record) => sum + Number(record.cost || 0),
    0
  );
  
  const insuranceCost = Number(vehicle[0].insuranceCost || 0);
  const netProfit = totalRevenue - totalMaintenanceCost - insuranceCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  return {
    vehicle: vehicle[0],
    summary: {
      totalRevenue,
      totalMaintenanceCost,
      insuranceCost,
      netProfit,
      profitMargin,
      rentalCount: completedContracts.length,
      maintenanceCount: maintenanceHistory.length,
    },
    contracts: completedContracts,
    maintenanceRecords: maintenanceHistory,
  };
}


// User Management Functions
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function createUser(userData: {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  country: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(users).values({
    username: userData.username,
    password: userData.password,
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    country: userData.country,
    role: 'user',
  });
  
  // Return the created user
  const newUser = await getUserByUsername(userData.username);
  if (!newUser) throw new Error("Failed to create user");
  
  return newUser;
}


// Car Makers and Models Management
export async function getCarMakersByCountry(country: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(carMakers).where(eq(carMakers.country, country));
  return result;
}

export async function getCarModelsByMaker(makerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(carModels).where(eq(carModels.makerId, makerId));
  return result;
}

export async function createCarMaker(data: { name: string; country: string; isCustom: boolean; userId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(carMakers).values(data);
  // Fetch the newly created maker
  const [newMaker] = await db.select().from(carMakers).where(eq(carMakers.name, data.name)).orderBy(desc(carMakers.id)).limit(1);
  return newMaker;
}

export async function createCarModel(data: { makerId: number; modelName: string; year?: number; isCustom: boolean; userId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(carModels).values(data);
  // Fetch the newly created model
  const [newModel] = await db.select().from(carModels).where(and(eq(carModels.makerId, data.makerId), eq(carModels.modelName, data.modelName))).orderBy(desc(carModels.id)).limit(1);
  return newModel;
}

export async function populateCarMakersForCountry(country: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if makers already exist for this country
  const existing = await getCarMakersByCountry(country);
  if (existing.length > 0) {
    return existing; // Already populated
  }
  
  // Import car data
  const { getCarMakersByCountry: getCarData } = await import('./carData');
  const carData = getCarData(country);
  
  // Insert makers and their models
  for (const maker of carData) {
    const makerResult = await db.insert(carMakers).values({
      name: maker.name,
      country: maker.country,
      isCustom: false,
    });
    
    const makerId = Number(makerResult[0].insertId);
    
    // Insert models for this maker
    for (const modelName of maker.popularModels) {
      await db.insert(carModels).values({
        makerId,
        modelName,
        isCustom: false,
      });
    }
  }
  
  return await getCarMakersByCountry(country);
}


// ========================================
// Company Settings Functions
// ========================================

/**
 * Get company settings for a specific user
 */
export async function getCompanySettings(userId: number): Promise<CompanySettings | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select().from(companySettings).where(eq(companySettings.userId, userId));
  return results[0] || null;
}

/**
 * Create or update company settings for a user
 */
export async function upsertCompanySettings(data: InsertCompanySettings): Promise<CompanySettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if settings already exist for this user
  const existing = await getCompanySettings(data.userId);

  if (existing) {
    // Update existing settings
    await db.update(companySettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(companySettings.userId, data.userId));
    
    const updated = await getCompanySettings(data.userId);
    if (!updated) throw new Error("Failed to retrieve updated settings");
    return updated;
  } else {
    // Create new settings
    const result = await db.insert(companySettings).values(data);
    const newSettings = await getCompanySettings(data.userId);
    if (!newSettings) throw new Error("Failed to retrieve new settings");
    return newSettings;
  }
}


// Vehicle Analysis
export async function getVehicleAnalysis(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vehicle analysis: database not available");
    return null;
  }

  // Get vehicle details
  const vehicle = await getVehicleById(vehicleId, userId);
  if (!vehicle) {
    return null;
  }

  // Get maintenance records
  const maintenance = await db.select().from(maintenanceRecords)
    .where(and(
      eq(maintenanceRecords.vehicleId, vehicleId),
      eq(maintenanceRecords.userId, userId)
    ))
    .orderBy(desc(maintenanceRecords.performedAt));

  // Get rental contracts
  const contracts = await db.select().from(rentalContracts)
    .where(and(
      eq(rentalContracts.vehicleId, vehicleId),
      eq(rentalContracts.userId, userId)
    ))
    .orderBy(desc(rentalContracts.rentalStartDate));

  // Calculate totals
  const totalMaintenanceCost = maintenance.reduce((sum, record) => {
    const cost = parseFloat(record.cost || "0");
    return sum + cost;
  }, 0);

  const totalRevenue = contracts.reduce((sum, contract) => {
    const amount = parseFloat(contract.finalAmount || contract.totalAmount || "0");
    return sum + amount;
  }, 0);

  const insuranceCost = parseFloat(vehicle.insuranceCost || "0");
  const netProfit = totalRevenue - totalMaintenanceCost - insuranceCost;

  return {
    vehicle,
    maintenanceRecords: maintenance.map(record => ({
      id: record.id,
      type: record.maintenanceType,
      description: record.description,
      cost: parseFloat(record.cost || "0"),
      date: record.performedAt,
      mileage: record.mileageAtService || 0,
    })),
    rentalContracts: contracts.map(contract => ({
      id: contract.id,
      startDate: contract.rentalStartDate,
      endDate: contract.rentalEndDate,
      totalCost: parseFloat(contract.finalAmount || contract.totalAmount || "0"),
      status: contract.status,
    })),
    totalMaintenanceCost,
    totalRevenue,
    insuranceCost,
    netProfit,
    totalContracts: contracts.length,
  };
}

// Get last return KM for a vehicle (from most recent completed rental)
export async function getLastReturnKm(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get last return KM: database not available");
    return null;
  }

  // Get the most recent completed contract for this vehicle
  const lastContract = await db.select()
    .from(rentalContracts)
    .where(and(
      eq(rentalContracts.vehicleId, vehicleId),
      eq(rentalContracts.userId, userId),
      eq(rentalContracts.status, "completed")
    ))
    .orderBy(desc(rentalContracts.returnedAt))
    .limit(1);

  if (lastContract.length === 0 || !lastContract[0].returnKm) {
    return null;
  }

  return lastContract[0].returnKm;
}

// Get future reservations for calendar view
export async function getFutureReservations(month: number, year: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get future reservations: database not available");
    return [];
  }

  // Get first and last day of the month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0, 23, 59, 59);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all contracts that overlap with this month and are in the future or current
  const contracts = await db.select({
    id: rentalContracts.id,
    vehicleId: rentalContracts.vehicleId,
    rentalStartDate: rentalContracts.rentalStartDate,
    rentalEndDate: rentalContracts.rentalEndDate,
    clientFirstName: rentalContracts.clientFirstName,
    clientLastName: rentalContracts.clientLastName,
    clientPhone: rentalContracts.clientPhone,
    status: rentalContracts.status,
    finalAmount: rentalContracts.finalAmount,
    vehicleBrand: vehicles.brand,
    vehicleModel: vehicles.model,
    vehiclePlateNumber: vehicles.plateNumber,
  })
  .from(rentalContracts)
  .leftJoin(vehicles, eq(rentalContracts.vehicleId, vehicles.id))
  .where(and(
    eq(rentalContracts.userId, userId),
    // Contract overlaps with the month
    sql`${rentalContracts.rentalStartDate} <= ${lastDay}`,
    sql`${rentalContracts.rentalEndDate} >= ${firstDay}`,
    // Contract end date is in the future or today
    sql`${rentalContracts.rentalEndDate} >= ${today}`
  ))
  .orderBy(rentalContracts.rentalStartDate);

  // Detect conflicts: check if any vehicle has overlapping reservations
  const reservationsWithConflicts = contracts.map(contract => {
    // Find other contracts for the same vehicle that overlap with this one
    const conflicts = contracts.filter(other => 
      other.id !== contract.id && 
      other.vehicleId === contract.vehicleId &&
      // Check if date ranges overlap
      new Date(other.rentalStartDate) <= new Date(contract.rentalEndDate) &&
      new Date(other.rentalEndDate) >= new Date(contract.rentalStartDate)
    );

    return {
      id: contract.id,
      vehicleId: contract.vehicleId,
      rentalStartDate: contract.rentalStartDate,
      rentalEndDate: contract.rentalEndDate,
      clientName: `${contract.clientFirstName} ${contract.clientLastName}`,
      clientPhone: contract.clientPhone || "N/A",
      status: contract.status,
      totalCost: contract.finalAmount ? parseFloat(contract.finalAmount as string) : 0,
      vehicleBrand: contract.vehicleBrand || "Unknown",
      vehicleModel: contract.vehicleModel || "Unknown",
      vehiclePlateNumber: contract.vehiclePlateNumber || "N/A",
      hasConflict: conflicts.length > 0,
      conflictCount: conflicts.length,
      conflictingContracts: conflicts.map(c => ({
        id: c.id,
        startDate: c.rentalStartDate,
        endDate: c.rentalEndDate,
        clientName: `${c.clientFirstName} ${c.clientLastName}`,
      })),
    };
  });

  return reservationsWithConflicts;
}

// ========================================
// Password Reset Token Functions
// ========================================

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { passwordResetTokens } = await import("../drizzle/schema");
  
  const [result] = await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt,
    used: false,
  });

  return result;
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { passwordResetTokens } = await import("../drizzle/schema");
  
  const [result] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  return result;
}

export async function markTokenAsUsed(tokenId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { passwordResetTokens } = await import("../drizzle/schema");
  
  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, tokenId));
}

export async function updateUserPassword(userId: number, hashedPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId));
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}

/**
 * Get company profile for a user
 */
export async function getCompanyProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { companyProfiles } = await import("../drizzle/schema");
  
  const [profile] = await db
    .select()
    .from(companyProfiles)
    .where(eq(companyProfiles.userId, userId))
    .limit(1);

  return profile;
}

/**
 * Create or update company profile
 */
export async function upsertCompanyProfile(data: {
  userId: number;
  companyName: string;
  registrationNumber?: string;
  taxId?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { companyProfiles } = await import("../drizzle/schema");
  
  // Check if profile exists
  const existing = await getCompanyProfile(data.userId);
  
  if (existing) {
    // Update existing profile
    await db
      .update(companyProfiles)
      .set({
        companyName: data.companyName,
        registrationNumber: data.registrationNumber,
        taxId: data.taxId,
        address: data.address,
        city: data.city,
        country: data.country,
        phone: data.phone,
        email: data.email,
        website: data.website,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
      })
      .where(eq(companyProfiles.userId, data.userId));
    
    return await getCompanyProfile(data.userId);
  } else {
    // Create new profile
    const [result] = await db
      .insert(companyProfiles)
      .values(data)
      .$returningId();
    
    return await getCompanyProfile(data.userId);
  }
}


// ============================================
// Invoice Functions
// ============================================

/**
 * Generate invoice for a completed contract
 */
export async function generateInvoiceForContract(contractId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Tables are already imported at the top of the file
  
  // Get contract details
  const [contract] = await db.select().from(rentalContracts).where(and(eq(rentalContracts.id, contractId), eq(rentalContracts.userId, userId))).limit(1);
  
  if (!contract) throw new Error("Contract not found");
  if (contract.status !== "completed") throw new Error("Contract must be completed before generating invoice");
  
  // Check if invoice already exists for this contract
  const [existingInvoice] = await db.select().from(invoices).where(eq(invoices.contractId, contractId)).limit(1);
  
  if (existingInvoice) {
    return existingInvoice;
  }
  
  // Generate invoice number
  const invoiceCount = await db.select({ count: sql<number>`count(*)` }).from(invoices);
  const invoiceNumber = `INV-${String(invoiceCount[0].count + 1).padStart(5, "0")}`;
  
  // Calculate line items
  const lineItems: { description: string; quantity: number; unitPrice: number; amount: number }[] = [];
  
  // 1. Rental fee (base charge)
  const rentalDays = contract.rentalDays || 1;
  const dailyRate = parseFloat(contract.dailyRate?.toString() || "0");
  const rentalAmount = rentalDays * dailyRate;
  lineItems.push({
    description: `Vehicle Rental - ${rentalDays} day(s) @ $${dailyRate}/day`,
    quantity: rentalDays,
    unitPrice: dailyRate,
    amount: rentalAmount,
  });
  
  // 2. Fuel difference charge (if return fuel < pickup fuel)
  const fuelLevels = { "Empty": 0, "1/4": 0.25, "1/2": 0.5, "3/4": 0.75, "Full": 1 };
  const pickupFuel = fuelLevels[contract.fuelLevel as keyof typeof fuelLevels] || 1;
  const returnFuel = fuelLevels[contract.returnFuelLevel as keyof typeof fuelLevels] || 1;
  const fuelDifference = pickupFuel - returnFuel;
  
  if (fuelDifference > 0) {
    const fuelChargePerUnit = 50; // $50 per fuel level unit
    const fuelCharge = fuelDifference * fuelChargePerUnit;
    lineItems.push({
      description: `Fuel Difference Charge (${Math.round(fuelDifference * 100)}% tank)`,
      quantity: fuelDifference,
      unitPrice: fuelChargePerUnit,
      amount: fuelCharge,
    });
  }
  
  // 3. Late return fee (if returned after scheduled return date)
  if (contract.returnedAt && contract.rentalEndDate) {
    const returnDate = new Date(contract.returnedAt);
    const scheduledReturnDate = new Date(contract.rentalEndDate);
    const daysLate = Math.max(0, Math.ceil((returnDate.getTime() - scheduledReturnDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    if (daysLate > 0) {
      const lateFeePerDay = dailyRate * 1.5; // 150% of daily rate as late fee
      const lateFee = daysLate * lateFeePerDay;
      lineItems.push({
        description: `Late Return Fee - ${daysLate} day(s) @ $${lateFeePerDay.toFixed(2)}/day`,
        quantity: daysLate,
        unitPrice: lateFeePerDay,
        amount: lateFee,
      });
    }
  }
  
  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 0.11; // 11% tax
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;
  
  // Create invoice
  const invoiceDate = new Date();
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  
  const invoiceValues: InsertInvoice = {
      userId,
      contractId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      paymentStatus: "pending",
    };
  
  const invoiceResult = await db
    .insert(invoices)
    .values(invoiceValues);
  
  const invoiceId = Number((invoiceResult as any)[0]?.insertId || (invoiceResult as any).insertId);
  
  // Create line items
  for (const item of lineItems) {
    await db.insert(invoiceLineItems).values({
      invoiceId: invoiceId,
      description: item.description,
      quantity: item.quantity.toFixed(2),
      unitPrice: item.unitPrice.toFixed(2),
      amount: item.amount.toFixed(2),
    });
  }
  
  // Return the created invoice with line items
  return await getInvoiceById(invoiceId, userId);
}

/**
 * Get invoice by ID with line items
 */
export async function getInvoiceById(invoiceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Tables are already imported at the top of the file
  
  const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId))).limit(1);
  
  if (!invoice) return null;
  
  const lineItems = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
  
  return {
    ...invoice,
    lineItems,
  };
}

/**
 * List all invoices for a user
 */
export async function listInvoices(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Tables are already imported at the top of the file
  
  const results = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
  return results;
}

/**
 * Update invoice payment status
 */
export async function updateInvoicePaymentStatus(
  invoiceId: number,
  userId: number,
  paymentStatus: "pending" | "paid" | "overdue" | "cancelled",
  paymentMethod?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Tables are already imported at the top of the file
  
  const updateData: any = {
    paymentStatus,
  };
  
  if (paymentMethod) {
    updateData.paymentMethod = paymentMethod;
  }
  
  if (paymentStatus === "paid") {
    updateData.paidAt = new Date();
  }
  
  await db
    .update(invoices)
    .set(updateData)
    .where(and(
      eq(invoices.id, invoiceId),
      eq(invoices.userId, userId)
    ));
  
  return await getInvoiceById(invoiceId, userId);
}

/**
 * Get all nationalities for a user (for autocomplete dropdown)
 */
export async function getAllNationalities(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select()
    .from(nationalities)
    .where(eq(nationalities.userId, userId))
    .orderBy(nationalities.nationality);
}

/**
 * Add a new nationality to the database if it doesn't exist
 */
export async function addNationality(userId: number, nationality: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if nationality already exists for this user
  const existing = await db.select()
    .from(nationalities)
    .where(and(
      eq(nationalities.userId, userId),
      eq(nationalities.nationality, nationality)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0]; // Already exists, return it
  }
  
  // Insert new nationality
  const [result] = await db.insert(nationalities).values({
    userId,
    nationality,
  });
  
  return { id: Number(result.insertId), userId, nationality, createdAt: new Date() };
}
