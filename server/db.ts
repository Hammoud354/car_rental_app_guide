import { eq, and, or, lte, gte, lt, sql, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, vehicles, InsertVehicle, maintenanceRecords, InsertMaintenanceRecord, maintenanceTasks, InsertMaintenanceTask, rentalContracts, InsertRentalContract, damageMarks, InsertDamageMark, clients, InsertClient, Client, carMakers, carModels, companySettings, InsertCompanySettings, CompanySettings, invoices, invoiceLineItems, InsertInvoice, nationalities, InsertNationality, auditLogs, InsertAuditLog, vehicleImages, InsertVehicleImage, whatsappTemplates, InsertWhatsappTemplate, insurancePolicies, InsertInsurancePolicy } from "../drizzle/schema";
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

// Helper function to check if a user is Super Admin
export async function isSuperAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user.length > 0 && user[0].role === 'super_admin';
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
      values.role = 'super_admin';
      updateSet.role = 'super_admin';
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
export async function getAllVehicles(userId: number, filterUserId?: number | null) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vehicles: database not available");
    return [];
  }
  
  // All users (including super admin) see only their own data by default
  // Super Admin can optionally filter by specific user in admin panel
  const targetUserId = filterUserId !== undefined && filterUserId !== null ? filterUserId : userId;
  const allVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, targetUserId));
  
  // Calculate total maintenance cost and effective status for each vehicle
  const now = new Date();
  const vehiclesWithCosts = await Promise.all(
    allVehicles.map(async (vehicle) => {
      const records = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.vehicleId, vehicle.id));
      const totalMaintenanceCost = records.reduce((sum, record) => {
        const cost = record.cost ? parseFloat(record.cost.toString()) : 0;
        return sum + cost;
      }, 0);
      
      // Check if vehicle has any active contracts
      const activeContracts = await db.select()
        .from(rentalContracts)
        .where(
          and(
            eq(rentalContracts.vehicleId, vehicle.id),
            or(
              eq(rentalContracts.status, 'active'),
              eq(rentalContracts.status, 'overdue')
            ),
            lte(rentalContracts.rentalStartDate, now),
            gte(rentalContracts.rentalEndDate, now)
          )
        );
      
      // Calculate effective status:
      // - If Maintenance or Out of Service, keep that status (takes priority)
      // - If has active contracts, show as Rented
      // - Otherwise, show as Available
      let effectiveStatus = vehicle.status;
      if (vehicle.status === 'Available' && activeContracts.length > 0) {
        effectiveStatus = 'Rented';
      } else if (vehicle.status === 'Rented' && activeContracts.length === 0) {
        effectiveStatus = 'Available';
      }
      
      return {
        ...vehicle,
        status: effectiveStatus,
        totalMaintenanceCost: totalMaintenanceCost.toFixed(2)
      };
    })
  );
  
  return vehiclesWithCosts;
}

export async function getAvailableVehiclesForMaintenance(userId: number, filterUserId?: number | null) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vehicles: database not available");
    return [];
  }
  
  // Get all vehicles first - all users see only their own data by default
  const targetUserId = filterUserId !== undefined && filterUserId !== null ? filterUserId : userId;
  const allVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, targetUserId));
  
  // Filter out vehicles with active contracts (status = 'Active')
  const availableVehicles = await Promise.all(
    allVehicles.map(async (vehicle) => {
      const activeContracts = await db.select()
        .from(rentalContracts)
        .where(
          and(
            eq(rentalContracts.vehicleId, vehicle.id),
            eq(rentalContracts.status, 'active')
          )
        );
      
      // Return vehicle only if it has no active contracts
      return activeContracts.length === 0 ? vehicle : null;
    })
  );
  
  // Filter out null values and return
  return availableVehicles.filter(v => v !== null);
}

export async function getVehicleById(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vehicle: database not available");
    return undefined;
  }
  
  // All users (including super admin) can only view their own vehicles
  const result = await db.select().from(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, userId))).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createVehicle(vehicle: InsertVehicle) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Build insert object explicitly, only including fields with actual values
  const insertData: any = {
    userId: vehicle.userId,
    plateNumber: vehicle.plateNumber,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    category: vehicle.category,
    status: "Available", // Always set to Available for new vehicles
    dailyRate: vehicle.dailyRate,
  };
  
  // Only add optional fields if they have values (not empty string or undefined)
  if (vehicle.weeklyRate && vehicle.weeklyRate !== '') insertData.weeklyRate = vehicle.weeklyRate;
  if (vehicle.monthlyRate && vehicle.monthlyRate !== '') insertData.monthlyRate = vehicle.monthlyRate;
  if (vehicle.mileage !== undefined && vehicle.mileage !== null) insertData.mileage = vehicle.mileage;
  if (vehicle.vin && vehicle.vin !== '') insertData.vin = vehicle.vin;
  if (vehicle.insurancePolicyNumber && vehicle.insurancePolicyNumber !== '') insertData.insurancePolicyNumber = vehicle.insurancePolicyNumber;
  if (vehicle.insuranceCost && vehicle.insuranceCost !== '') insertData.insuranceCost = vehicle.insuranceCost;
  if (vehicle.purchaseCost && vehicle.purchaseCost !== '') insertData.purchaseCost = vehicle.purchaseCost;
  if (vehicle.photoUrl && vehicle.photoUrl !== '') insertData.photoUrl = vehicle.photoUrl;
  if (vehicle.notes && vehicle.notes !== '') insertData.notes = vehicle.notes;
  
  // For timestamp fields, only add if they exist
  if (vehicle.insuranceExpiryDate) insertData.insuranceExpiryDate = vehicle.insuranceExpiryDate;
  if (vehicle.registrationExpiryDate) insertData.registrationExpiryDate = vehicle.registrationExpiryDate;
  if (vehicle.nextMaintenanceDate) insertData.nextMaintenanceDate = vehicle.nextMaintenanceDate;
  if (vehicle.nextMaintenanceKm !== undefined && vehicle.nextMaintenanceKm !== null) insertData.nextMaintenanceKm = vehicle.nextMaintenanceKm;
  
  const result = await db.insert(vehicles).values(insertData);
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
  
  // All users (including super admin) can only delete their own vehicles
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

export async function deleteMaintenanceRecord(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.delete(maintenanceRecords).where(and(eq(maintenanceRecords.id, id), eq(maintenanceRecords.userId, userId)));
  return { success: true };
}

export async function updateMaintenanceRecord(id: number, userId: number, updates: Partial<InsertMaintenanceRecord>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.update(maintenanceRecords)
    .set(updates)
    .where(and(eq(maintenanceRecords.id, id), eq(maintenanceRecords.userId, userId)));
  const updated = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id)).limit(1);
  if (updated.length === 0) {
    throw new Error("Maintenance record not found or unauthorized");
  }
  return updated[0];
}

// Rental Contract Queries
export async function getAllRentalContracts(userId: number, filterUserId?: number | null) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contracts: database not available");
    return [];
  }
  // All users (including super admin) see only their own contracts by default
  const targetUserId = filterUserId !== undefined && filterUserId !== null ? filterUserId : userId;
  return await db.select().from(rentalContracts).where(eq(rentalContracts.userId, targetUserId));
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

export async function getRentalContractsByStatus(userId: number, status?: "active" | "completed" | "overdue", filterUserId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contracts: database not available");
    return [];
  }
  // All users (including super admin) see only their own contracts by default
  const targetUserId = filterUserId !== undefined && filterUserId !== null ? filterUserId : userId;
  
  if (!status) {
    // Return all contracts if no status specified
    return await db.select().from(rentalContracts).where(eq(rentalContracts.userId, targetUserId));
  }
  return await db.select().from(rentalContracts).where(and(eq(rentalContracts.userId, targetUserId), eq(rentalContracts.status, status)));
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
  overLimitKmFee?: number,
  depositRefund?: boolean,
  depositRefundNotes?: string
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
  
  // Calculate late fee if vehicle is returned after rental end date
  let calculatedLateFee = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rentalEndDate = new Date(contract[0].rentalEndDate);
  rentalEndDate.setHours(0, 0, 0, 0);
  
  if (today > rentalEndDate) {
    // Calculate days late
    const daysLate = Math.ceil((today.getTime() - rentalEndDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = parseFloat(contract[0].dailyRate || '0');
    const lateFeePercentage = parseFloat(contract[0].lateFeePercentage || '150') / 100; // Default 150%
    
    // Late fee = days late * daily rate * late fee percentage
    calculatedLateFee = daysLate * dailyRate * lateFeePercentage;
  }
  
  // Update contract status and return information
  const updateData: any = {
    status: "completed",
    returnedAt: new Date(),
    ...(returnKm !== undefined && { returnKm }),
    ...(returnFuelLevel && { returnFuelLevel }),
    ...(returnNotes && { returnNotes }),
    ...(damageInspection && { damageInspection }),
    ...(overLimitKmFee !== undefined && { overLimitKmFee: overLimitKmFee.toFixed(2) }),
    ...(calculatedLateFee > 0 && { lateFee: calculatedLateFee.toFixed(2) }),
  };
  
  // Handle deposit refund
  if (depositRefund !== undefined) {
    updateData.depositStatus = depositRefund ? "Refunded" : "Forfeited";
    if (depositRefundNotes) {
      updateData.depositNotes = depositRefundNotes;
    }
  }
  
  await db
    .update(rentalContracts)
    .set(updateData)
    .where(eq(rentalContracts.id, contractId));
  
  // Update vehicle status back to Available
  if (contract[0].vehicleId) {
    await db
      .update(vehicles)
      .set({ status: "Available" })
      .where(eq(vehicles.id, contract[0].vehicleId));
  }
  
  // Auto-generate invoice for the completed contract
  const invoice = await autoGenerateInvoice(contractId, contract[0].userId);
  
  return { success: true, contractId, maintenanceAlert, invoice };
}

export async function deleteRentalContract(contractId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Get the contract to find the associated vehicle
  const contract = await db.select().from(rentalContracts).where(eq(rentalContracts.id, contractId)).limit(1);
  
  if (contract.length > 0) {
    const vehicleId = contract[0].vehicleId;
    
    // Delete associated damage marks first
    await db.delete(damageMarks).where(eq(damageMarks.contractId, contractId));
    
    // Delete the contract
    await db.delete(rentalContracts).where(eq(rentalContracts.id, contractId));
    
    // Check if the vehicle has any other active contracts
    const now = new Date();
    const activeContracts = await db.select()
      .from(rentalContracts)
      .where(
        and(
          eq(rentalContracts.vehicleId, vehicleId),
          or(
            eq(rentalContracts.status, 'active'),
            eq(rentalContracts.status, 'overdue')
          ),
          lte(rentalContracts.rentalStartDate, now),
          gte(rentalContracts.rentalEndDate, now)
        )
      );
    
    // If no active contracts remain, return vehicle to Available status
    if (activeContracts.length === 0) {
      await db.update(vehicles)
        .set({ status: 'Available' })
        .where(eq(vehicles.id, vehicleId));
    }
  }
  
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

export async function getOverdueStatistics(userId: number, filterUserId?: number | null) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get overdue statistics: database not available");
    return { count: 0, totalLateFees: "0.00", avgDaysOverdue: 0 };
  }
  
  // Use filterUserId if provided (Super Admin filtering), otherwise use userId
  const effectiveUserId = filterUserId !== undefined && filterUserId !== null ? filterUserId : userId;
  
  const overdueContracts = await db
    .select()
    .from(rentalContracts)
    .where(and(eq(rentalContracts.userId, effectiveUserId), eq(rentalContracts.status, "overdue")));
  
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

export async function getExpiringContracts(userId: number, daysAhead: number = 3, filterUserId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get expiring contracts: database not available");
    return [];
  }
  
  const targetUserId = filterUserId !== undefined && filterUserId !== null ? filterUserId : userId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + daysAhead);
  
  // Get active contracts expiring within the specified days
  const contracts = await db.select().from(rentalContracts)
    .where(
      and(
        eq(rentalContracts.userId, targetUserId),
        eq(rentalContracts.status, "active"),
        gte(rentalContracts.rentalEndDate, today),
        lte(rentalContracts.rentalEndDate, futureDate)
      )
    )
    .orderBy(asc(rentalContracts.rentalEndDate));
  
  return contracts;
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

export async function getAllClients(userId: number, filterUserId?: number | null): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  
  // All users (including super admin) see only their own clients by default
  const targetUserId = filterUserId !== undefined && filterUserId !== null ? filterUserId : userId;
  return await db.select().from(clients).where(eq(clients.userId, targetUserId));
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
  
  console.log('[DB] updateClient called with:', { id, userId, updates });
  
  // First check if the client exists
  const existingClient = await getClientById(id, userId);
  if (!existingClient) {
    console.error('[DB] Client not found:', { id, userId });
    throw new Error(`Client with id ${id} not found or doesn't belong to user ${userId}`);
  }
  
  console.log('[DB] Existing client before update:', existingClient);
  
  // Perform the update
  const result: any = await db.update(clients).set(updates).where(and(eq(clients.id, id), eq(clients.userId, userId)));
  console.log('[DB] update result (affected rows):', result);
  
  // Fetch the updated client
  const updatedClient = await getClientById(id, userId);
  console.log('[DB] fetched updated client after update:', updatedClient);
  
  return updatedClient;
}

export async function deleteClient(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First verify the client exists and belongs to this user
  const existingClient = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .limit(1);
  
  if (existingClient.length === 0) {
    throw new Error("Client not found or you don't have permission to delete this client.");
  }
  
  // Check if client has any related contracts
  const relatedContracts = await db
    .select()
    .from(rentalContracts)
    .where(and(
      eq(rentalContracts.clientId, id),
      eq(rentalContracts.userId, userId)
    ))
    .limit(1);
  
  if (relatedContracts.length > 0) {
    throw new Error("Cannot delete client with existing rental contracts. Please delete the contracts first.");
  }
  
  // No related records, safe to delete
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

// Vehicle Profitability Analytics
export async function getVehicleProfitabilityAnalytics(userId: number, filterUserId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  
  const allVehicles = await getAllVehicles(userId, filterUserId);
  
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

export async function listAllUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select({
    id: users.id,
    username: users.username,
    name: users.name,
    email: users.email,
    phone: users.phone,
    role: users.role,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users);
  
  return result;
}

export async function updateUserRole(userId: number, role: 'user' | 'admin', requestingUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get requesting user to verify they're super admin
  const requestingUser = await getUserById(requestingUserId);
  if (!requestingUser || requestingUser.role !== 'super_admin') {
    throw new Error("Only Super Admin can change user roles");
  }
  
  // Get target user
  const targetUser = await getUserById(userId);
  if (!targetUser) {
    throw new Error("User not found");
  }
  
  // Prevent changing super admin role
  if (targetUser.role === 'super_admin') {
    throw new Error("Cannot modify Super Admin role");
  }
  
  // Prevent promoting to super admin
  if (role === 'super_admin' as any) {
    throw new Error("Cannot promote users to Super Admin");
  }
  
  await db.update(users).set({ role }).where(eq(users.id, userId));
  
  // Log the action
  await createAuditLog({
    actorId: requestingUser.id,
    actorUsername: requestingUser.username,
    actorRole: requestingUser.role,
    action: 'role_change',
    targetUserId: userId,
    targetUsername: targetUser.username,
    details: `Changed role from ${targetUser.role} to ${role}`,
    previousState: { role: targetUser.role },
    newState: { role },
  });
  
  return await getUserById(userId);
}

export async function deleteUser(userId: number, requestingUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get requesting user to verify they're super admin
  const requestingUser = await getUserById(requestingUserId);
  if (!requestingUser || requestingUser.role !== 'super_admin') {
    throw new Error("Only Super Admin can delete users");
  }
  
  // Get target user
  const targetUser = await getUserById(userId);
  if (!targetUser) {
    throw new Error("User not found");
  }
  
  // Prevent deleting super admin
  if (targetUser.role === 'super_admin') {
    throw new Error("Cannot delete Super Admin");
  }
  
  // Prevent deleting self
  if (userId === requestingUserId) {
    throw new Error("Cannot delete your own account");
  }
  
  await db.delete(users).where(eq(users.id, userId));
  
  // Log the action
  await createAuditLog({
    actorId: requestingUser.id,
    actorUsername: requestingUser.username,
    actorRole: requestingUser.role,
    action: 'user_delete',
    targetUserId: userId,
    targetUsername: targetUser.username,
    details: `Deleted user account: ${targetUser.username} (${targetUser.name || 'N/A'})`,
    previousState: { 
      username: targetUser.username, 
      role: targetUser.role,
      email: targetUser.email,
    },
  });
  
  return { success: true };
}

// Audit Log Functions
export async function createAuditLog(logData: {
  actorId: number;
  actorUsername: string;
  actorRole: string;
  action: string;
  targetUserId?: number;
  targetUsername?: string;
  details: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(auditLogs).values({
    actorId: logData.actorId,
    actorUsername: logData.actorUsername,
    actorRole: logData.actorRole,
    action: logData.action,
    targetUserId: logData.targetUserId,
    targetUsername: logData.targetUsername,
    details: logData.details,
    previousState: logData.previousState ? JSON.stringify(logData.previousState) : null,
    newState: logData.newState ? JSON.stringify(logData.newState) : null,
    ipAddress: logData.ipAddress,
  });
}

export async function getAuditLogs(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const logs = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);
  
  return logs.map(log => ({
    ...log,
    previousState: log.previousState ? JSON.parse(log.previousState) : null,
    newState: log.newState ? JSON.parse(log.newState) : null,
  }));
}

export async function getAuditLogsByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const logs = await db
    .select()
    .from(auditLogs)
    .where(or(eq(auditLogs.actorId, userId), eq(auditLogs.targetUserId, userId)))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
  
  return logs.map(log => ({
    ...log,
    previousState: log.previousState ? JSON.parse(log.previousState) : null,
    newState: log.newState ? JSON.parse(log.newState) : null,
  }));
}

export async function getAuditLogsByAction(action: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action, action))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
  
  return logs.map(log => ({
    ...log,
    previousState: log.previousState ? JSON.parse(log.previousState) : null,
    newState: log.newState ? JSON.parse(log.newState) : null,
  }));
}


// Car Makers and Models Management
export async function getCarMakersByCountry(country: string, userId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  // STRICT ISOLATION: Only return makers belonging to this specific user
  if (!userId) return [];
  
  const result = await db.select().from(carMakers).where(
    and(
      eq(carMakers.country, country),
      eq(carMakers.userId, userId)
    )
  );
  return result;
}

export async function getCarModelsByMaker(makerId: number, userId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  // STRICT ISOLATION: Only return models belonging to this specific user
  if (!userId) return [];
  
  const result = await db.select().from(carModels).where(
    and(
      eq(carModels.makerId, makerId),
      eq(carModels.userId, userId)
    )
  );
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

export async function populateCarMakersForCountry(country: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if makers already exist for this user and country
  const existing = await getCarMakersByCountry(country, userId);
  if (existing.length > 0) {
    return existing; // Already populated for this user
  }
  
  // Import car data
  const { getCarMakersByCountry: getCarData } = await import('./carData');
  const carData = getCarData(country);
  
  // Insert makers and their models FOR THIS USER
  for (const maker of carData) {
    const makerResult = await db.insert(carMakers).values({
      name: maker.name,
      country: maker.country,
      isCustom: false,
      userId: userId, // CRITICAL: Assign to specific user
    });
    
    const makerId = Number(makerResult[0].insertId);
    
    // Insert models for this maker FOR THIS USER
    for (const modelName of maker.popularModels) {
      await db.insert(carModels).values({
        makerId,
        modelName,
        isCustom: false,
        userId: userId, // CRITICAL: Assign to specific user
      });
    }
  }
  
  return await getCarMakersByCountry(country, userId);
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
    // Only show active contracts in reservations calendar
    eq(rentalContracts.status, 'active'),
    // Contract overlaps with the month
    sql`${rentalContracts.rentalStartDate} <= ${lastDay}`,
    sql`${rentalContracts.rentalEndDate} >= ${firstDay}`,
    // Contract end date is in the future or today
    sql`${rentalContracts.rentalEndDate} >= ${today}`
  ))
  .orderBy(rentalContracts.rentalStartDate);

  // Detect conflicts: check if any vehicle has overlapping reservations
  // Only active contracts can cause conflicts - completed contracts should not block new reservations
  const reservationsWithConflicts = contracts.map(contract => {
    // Find other contracts for the same vehicle that overlap with this one
    const conflicts = contracts.filter(other => 
      other.id !== contract.id && 
      other.vehicleId === contract.vehicleId &&
      other.status === 'active' && // Only check active contracts for conflicts
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

  return profile || null;
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
 * Generate invoice number in format INV-YYYYMMDD-HHMMSS-XXX
 */
async function generateInvoiceNumber(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  // Include timestamp in invoice number for uniqueness
  return `INV-${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}`;
}

/**
 * Auto-generate invoice when contract is completed
 */
export async function autoGenerateInvoice(contractId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get contract details
  const [contract] = await db.select().from(rentalContracts)
    .where(eq(rentalContracts.id, contractId))
    .limit(1);
  
  if (!contract) throw new Error("Contract not found");
  
  // Get vehicle details
  const [vehicle] = await db.select().from(vehicles)
    .where(eq(vehicles.id, contract.vehicleId))
    .limit(1);
  
  if (!vehicle) throw new Error("Vehicle not found");
  
  // Check if invoice already exists for this contract
  const existingInvoice = await db.select().from(invoices)
    .where(eq(invoices.contractId, contractId))
    .limit(1);
  
  if (existingInvoice.length > 0) {
    return existingInvoice[0]; // Invoice already exists, return it
  }
  
  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(userId);
  
  // Calculate line items
  const lineItems: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    amount: string;
  }> = [];
  
  // 1. Rental charges with vehicle details
  const rentalDays = contract.rentalDays || 1;
  const dailyRate = parseFloat(contract.dailyRate || '0');
  const rentalCharges = rentalDays * dailyRate;
  const vehicleInfo = `${vehicle.brand} ${vehicle.model} (Plate: ${vehicle.plateNumber})`;
  lineItems.push({
    description: `Vehicle Rental - ${vehicleInfo} (${rentalDays} days @ $${dailyRate}/day)`,
    quantity: String(rentalDays),
    unitPrice: contract.dailyRate,
    amount: rentalCharges.toFixed(2),
  });
  
  // 2. Insurance (if any)
  const insuranceDailyRate = parseFloat(contract.insuranceDailyRate || '0');
  if (insuranceDailyRate > 0) {
    const insurancePackage = contract.insurancePackage || 'Insurance';
    const calculatedInsuranceCost = insuranceDailyRate * rentalDays;
    lineItems.push({
      description: `Insurance - ${insurancePackage} (${rentalDays} days @ $${insuranceDailyRate}/day)`,
      quantity: String(rentalDays),
      unitPrice: insuranceDailyRate.toFixed(2),
      amount: calculatedInsuranceCost.toFixed(2),
    });
  }
  
  // 3. Discount (if any)
  const discount = parseFloat(contract.discount || '0');
  if (discount > 0) {
    lineItems.push({
      description: 'Discount',
      quantity: '1',
      unitPrice: `-${discount.toFixed(2)}`,
      amount: `-${discount.toFixed(2)}`,
    });
  }
  
  // 4. Over-limit KM fee (if any)
  const overLimitKmFee = parseFloat(contract.overLimitKmFee || '0');
  if (overLimitKmFee > 0) {
    lineItems.push({
      description: 'Over-Limit Kilometer Fee',
      quantity: '1',
      unitPrice: overLimitKmFee.toFixed(2),
      amount: overLimitKmFee.toFixed(2),
    });
  }
  
  // 5. Late fee (if any)
  const lateFee = parseFloat(contract.lateFee || '0');
  if (lateFee > 0) {
    lineItems.push({
      description: 'Late Return Fee',
      quantity: '1',
      unitPrice: lateFee.toFixed(2),
      amount: lateFee.toFixed(2),
    });
  }
  
  // Calculate subtotal
  const subtotal = lineItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  
  // Calculate tax (11%)
  const taxRate = 0.11;
  const taxAmount = subtotal * taxRate;
  
  // Calculate total
  const totalAmount = subtotal + taxAmount;
  
  // Create invoice
  const invoiceDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days
  
  const [invoiceResult] = await db.insert(invoices).values({
    userId,
    contractId,
    invoiceNumber,
    invoiceDate: sql`CURDATE()`,
    dueDate: sql`DATE_ADD(CURDATE(), INTERVAL 30 DAY)`,
    subtotal: subtotal.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    paymentStatus: 'pending',
  });
  
  const invoiceId = Number(invoiceResult.insertId);
  
  // Insert line items
  for (const item of lineItems) {
    await db.insert(invoiceLineItems).values({
      invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    });
  }
  
  return await getInvoiceById(invoiceId, userId);
}

/**
 * Get invoice by ID with line items
 */
export async function getInvoiceById(invoiceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // All users (including super admin) see only their own invoices
  const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId))).limit(1);
  
  if (!invoice) return null;
  
  const lineItems = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
  
  // Get contract to fetch client information
  const [contract] = await db.select().from(rentalContracts).where(eq(rentalContracts.id, invoice.contractId)).limit(1);
  
  return {
    ...invoice,
    lineItems,
    clientName: contract ? `${contract.clientFirstName} ${contract.clientLastName}` : 'Client',
    clientPhone: contract?.clientPhone || '',
  };
}

/**
 * List all invoices for a user
 */
export async function listInvoices(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // All users (including super admin) see only their own invoices
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

  try {
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
    
    console.log('[updateInvoicePaymentStatus] Updating invoice:', {
      invoiceId,
      userId,
      updateData
    });
    
    const result = await db
      .update(invoices)
      .set(updateData)
      .where(and(
        eq(invoices.id, invoiceId),
        eq(invoices.userId, userId)
      ));
    
    console.log('[updateInvoicePaymentStatus] Update result:', result);
    
    const updatedInvoice = await getInvoiceById(invoiceId, userId);
    console.log('[updateInvoicePaymentStatus] Updated invoice:', updatedInvoice);
    
    return updatedInvoice;
  } catch (error) {
    console.error('[updateInvoicePaymentStatus] Error:', error);
    throw new Error(`Failed to update invoice payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all nationalities for a user (for autocomplete dropdown)
 */
export async function getAllNationalities(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Super Admin can see all nationalities, regular users only see their own
  const isAdmin = await isSuperAdmin(userId);
  return isAdmin
    ? await db.select().from(nationalities).orderBy(nationalities.nationality)
    : await db.select().from(nationalities).where(eq(nationalities.userId, userId)).orderBy(nationalities.nationality);
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


/**
 * Vehicle Images Functions
 */

/**
 * Add a vehicle image
 */
export async function addVehicleImage(image: InsertVehicleImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(vehicleImages).values(image);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  
  return await db.select().from(vehicleImages).where(eq(vehicleImages.id, insertId)).limit(1).then(rows => rows[0]);
}

/**
 * Get all images for a vehicle
 */
export async function getVehicleImages(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Super Admin can see all images, regular users only see their own
  const isAdmin = await isSuperAdmin(userId);
  return isAdmin
    ? await db.select().from(vehicleImages).where(eq(vehicleImages.vehicleId, vehicleId)).orderBy(vehicleImages.displayOrder, vehicleImages.createdAt)
    : await db.select().from(vehicleImages).where(and(eq(vehicleImages.vehicleId, vehicleId), eq(vehicleImages.userId, userId))).orderBy(vehicleImages.displayOrder, vehicleImages.createdAt);
}

/**
 * Get images by type (exterior/interior)
 */
export async function getVehicleImagesByType(vehicleId: number, userId: number, imageType: "exterior" | "interior") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Super Admin can see all images, regular users only see their own
  const isAdmin = await isSuperAdmin(userId);
  return isAdmin
    ? await db.select().from(vehicleImages).where(and(eq(vehicleImages.vehicleId, vehicleId), eq(vehicleImages.imageType, imageType))).orderBy(vehicleImages.displayOrder, vehicleImages.createdAt)
    : await db.select().from(vehicleImages).where(and(eq(vehicleImages.vehicleId, vehicleId), eq(vehicleImages.userId, userId), eq(vehicleImages.imageType, imageType))).orderBy(vehicleImages.displayOrder, vehicleImages.createdAt);
}

/**
 * Delete a vehicle image
 */
export async function deleteVehicleImage(imageId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Super Admin can delete any image, regular users only their own
  const isAdmin = await isSuperAdmin(userId);
  return isAdmin
    ? await db.delete(vehicleImages).where(eq(vehicleImages.id, imageId))
    : await db.delete(vehicleImages).where(and(eq(vehicleImages.id, imageId), eq(vehicleImages.userId, userId)));
}

/**
 * Update image display order
 */
export async function updateImageDisplayOrder(imageId: number, userId: number, displayOrder: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Super Admin can update any image, regular users only their own
  const isAdmin = await isSuperAdmin(userId);
  return isAdmin
    ? await db.update(vehicleImages).set({ displayOrder }).where(eq(vehicleImages.id, imageId))
    : await db.update(vehicleImages).set({ displayOrder }).where(and(eq(vehicleImages.id, imageId), eq(vehicleImages.userId, userId)));
}

/**
 * Get the last completed contract for a specific vehicle
 * Returns the returnKm (odometer reading) from the most recent completed contract
 */
export async function getLastCompletedContractForVehicle(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get last completed contract: database not available");
    return null;
  }
  
  const contracts = await db
    .select({
      id: rentalContracts.id,
      returnKm: rentalContracts.returnKm,
      returnedAt: rentalContracts.returnedAt,
    })
    .from(rentalContracts)
    .where(
      and(
        eq(rentalContracts.vehicleId, vehicleId),
        eq(rentalContracts.userId, userId),
        eq(rentalContracts.status, "completed")
      )
    )
    .orderBy(desc(rentalContracts.returnedAt))
    .limit(1);
  
  return contracts.length > 0 ? contracts[0] : null;
}


/**
 * Update vehicle mileage
 */
export async function updateVehicleMileage(vehicleId: number, mileage: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(vehicles)
    .set({ mileage })
    .where(eq(vehicles.id, vehicleId));
}


/**
 * Update vehicle maintenance schedule
 */
export async function updateVehicleMaintenanceSchedule(
  vehicleId: number,
  userId: number,
  nextMaintenanceDate?: Date,
  nextMaintenanceKm?: number,
  maintenanceIntervalKm?: number,
  maintenanceIntervalMonths?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(vehicles)
    .set({
      nextMaintenanceDate,
      nextMaintenanceKm,
      maintenanceIntervalKm,
      maintenanceIntervalMonths,
      updatedAt: new Date(),
    })
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)));
}


// ========================================
// P&L (Profit & Loss) Helper Functions
// ========================================

/**
 * Get completed rental contracts for P&L calculations
 */
export async function getCompletedContracts(
  userId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(rentalContracts.userId, userId),
    eq(rentalContracts.status, "completed")
  ];

  // Apply date filters if provided
  if (startDate) {
    conditions.push(gte(rentalContracts.rentalEndDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(rentalContracts.rentalEndDate, endDate));
  }

  return await db
    .select()
    .from(rentalContracts)
    .where(and(...conditions));
}

/**
 * Get paid invoices for P&L calculations
 */
export async function getPaidInvoices(
  userId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(invoices.userId, userId)
    // Note: invoices table doesn't have status field, all invoices are considered
  ];

  // Apply date filters if provided
  if (startDate) {
    conditions.push(gte(invoices.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(invoices.createdAt, endDate));
  }

  return await db
    .select()
    .from(invoices)
    .where(and(...conditions));
}

/**
 * Get maintenance records for P&L calculations
 */
export async function getMaintenanceRecords(
  userId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(maintenanceRecords.userId, userId)];

  // Apply date filters if provided
  if (startDate) {
    conditions.push(gte(maintenanceRecords.performedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(maintenanceRecords.performedAt, endDate));
  }

  return await db
    .select()
    .from(maintenanceRecords)
    .where(and(...conditions));
}

// getAllVehicles already exists above, no need to duplicate

/**
 * WhatsApp Templates
 */
export async function getWhatsappTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(whatsappTemplates)
    .where(eq(whatsappTemplates.userId, userId));
}

export async function getWhatsappTemplateByType(
  userId: number,
  templateType: 'contract_created' | 'contract_renewed' | 'contract_completed' | 'invoice_generated'
) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(whatsappTemplates)
    .where(
      and(
        eq(whatsappTemplates.userId, userId),
        eq(whatsappTemplates.templateType, templateType),
        eq(whatsappTemplates.isActive, true)
      )
    )
    .limit(1);

  return results[0] || null;
}

export async function upsertWhatsappTemplate(
  userId: number,
  templateType: 'contract_created' | 'contract_renewed' | 'contract_completed' | 'invoice_generated',
  messageTemplate: string,
  isActive: boolean = true
) {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');

  // Check if template exists
  const existing = await db
    .select()
    .from(whatsappTemplates)
    .where(
      and(
        eq(whatsappTemplates.userId, userId),
        eq(whatsappTemplates.templateType, templateType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing template
    await db
      .update(whatsappTemplates)
      .set({
        messageTemplate,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(whatsappTemplates.id, existing[0].id));
    
    return { ...existing[0], messageTemplate, isActive };
  } else {
    // Insert new template
    const result = await db
      .insert(whatsappTemplates)
      .values({
        userId,
        templateType,
        messageTemplate,
        isActive,
      });

    const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
    
    return {
      id: insertId,
      userId,
      templateType,
      messageTemplate,
      isActive,
    };
  }
}

export async function deleteWhatsappTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');

  await db
    .delete(whatsappTemplates)
    .where(eq(whatsappTemplates.id, id));

  return { success: true };
}


// ============================================================================
// User Management Functions (Admin Only)
// ============================================================================

export async function getAllUsers() {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');
  
  const allUsers = await db.select().from(users);
  return allUsers;
}

export async function updateUser(userId: number, data: { name: string; email: string; phone: string; country: string }) {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');
  
  await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId));
  
  return { success: true };
}


// ============================================================================
// AI Maintenance Tasks Functions
// ============================================================================

export async function createMaintenanceTask(task: InsertMaintenanceTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(maintenanceTasks).values(task);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const created = await db.select().from(maintenanceTasks).where(eq(maintenanceTasks.id, insertId)).limit(1);
  
  if (created.length === 0) {
    throw new Error("Failed to retrieve created maintenance task");
  }
  
  return created[0];
}

export async function getMaintenanceTasksByVehicleId(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get maintenance tasks: database not available");
    return [];
  }
  
  return await db
    .select()
    .from(maintenanceTasks)
    .where(and(
      eq(maintenanceTasks.vehicleId, vehicleId),
      eq(maintenanceTasks.userId, userId)
    ))
    .orderBy(maintenanceTasks.priority, maintenanceTasks.triggerDate);
}

export async function getAllMaintenanceTasks(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get maintenance tasks: database not available");
    return [];
  }
  
  return await db
    .select()
    .from(maintenanceTasks)
    .where(eq(maintenanceTasks.userId, userId))
    .orderBy(maintenanceTasks.status, maintenanceTasks.priority);
}

export async function updateMaintenanceTask(
  taskId: number,
  userId: number,
  updates: Partial<InsertMaintenanceTask>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(maintenanceTasks)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(maintenanceTasks.id, taskId),
      eq(maintenanceTasks.userId, userId)
    ));
  
  const updated = await db
    .select()
    .from(maintenanceTasks)
    .where(eq(maintenanceTasks.id, taskId))
    .limit(1);
  
  return updated[0];
}

export async function completeMaintenanceTask(
  taskId: number,
  userId: number,
  data: {
    completedMileage?: number;
    actualCost?: string;
    maintenanceRecordId?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(maintenanceTasks)
    .set({
      status: "Completed",
      completedAt: new Date(),
      completedMileage: data.completedMileage,
      actualCost: data.actualCost,
      maintenanceRecordId: data.maintenanceRecordId,
      updatedAt: new Date()
    })
    .where(and(
      eq(maintenanceTasks.id, taskId),
      eq(maintenanceTasks.userId, userId)
    ));
  
  return { success: true };
}

export async function deleteMaintenanceTask(taskId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(maintenanceTasks)
    .where(and(
      eq(maintenanceTasks.id, taskId),
      eq(maintenanceTasks.userId, userId)
    ));
  
  return { success: true };
}

export async function getUpcomingMaintenanceTasks(userId: number, daysAhead: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get upcoming maintenance tasks: database not available");
    return [];
  }
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return await db
    .select()
    .from(maintenanceTasks)
    .where(and(
      eq(maintenanceTasks.userId, userId),
      eq(maintenanceTasks.status, "Pending"),
      // Tasks due within the next X days
      sql`${maintenanceTasks.triggerDate} <= ${futureDate}`
    ))
    .orderBy(maintenanceTasks.triggerDate, maintenanceTasks.priority);
}

export async function getOverdueMaintenanceTasks(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get overdue maintenance tasks: database not available");
    return [];
  }
  
  const today = new Date();
  
  return await db
    .select()
    .from(maintenanceTasks)
    .where(and(
      eq(maintenanceTasks.userId, userId),
      eq(maintenanceTasks.status, "Pending"),
      sql`${maintenanceTasks.triggerDate} < ${today}`
    ))
    .orderBy(maintenanceTasks.priority, maintenanceTasks.triggerDate);
}


/**
 * Get all rental contracts for a specific vehicle (for AI maintenance analysis)
 */
export async function getRentalContractsByVehicle(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get rental contracts by vehicle: database not available");
    return [];
  }
  
  return await db
    .select()
    .from(rentalContracts)
    .where(and(
      eq(rentalContracts.vehicleId, vehicleId),
      eq(rentalContracts.userId, userId)
    ))
    .orderBy(rentalContracts.rentalStartDate);
}


/**
 * Insurance Tracking Functions
 */

/**
 * Get vehicles with insurance expiring within specified days
 */
export async function getVehiclesWithExpiringInsurance(userId: number, daysThreshold: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vehicles with expiring insurance: database not available");
    return [];
  }
  
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysThreshold);
  
  return await db
    .select()
    .from(vehicles)
    .where(and(
      eq(vehicles.userId, userId),
      sql`${vehicles.insuranceExpiryDate} IS NOT NULL`,
      sql`${vehicles.insuranceExpiryDate} > ${today}`,
      sql`${vehicles.insuranceExpiryDate} <= ${futureDate}`
    ))
    .orderBy(vehicles.insuranceExpiryDate);
}

/**
 * Get vehicles with expired insurance
 */
export async function getVehiclesWithExpiredInsurance(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get vehicles with expired insurance: database not available");
    return [];
  }
  
  const today = new Date();
  
  return await db
    .select()
    .from(vehicles)
    .where(and(
      eq(vehicles.userId, userId),
      sql`${vehicles.insuranceExpiryDate} IS NOT NULL`,
      sql`${vehicles.insuranceExpiryDate} < ${today}`
    ))
    .orderBy(vehicles.insuranceExpiryDate);
}

/**
 * Renew vehicle insurance with new policy details
 * Creates a new insurance policy record while preserving historical data
 */
export async function renewVehicleInsurance(
  vehicleId: number,
  userId: number,
  policyStartDate: Date,
  policyExpiryDate: Date,
  annualPremium: string,
  insuranceProvider?: string,
  policyNumber?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Mark previous active policies as expired
  await db
    .update(insurancePolicies)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(and(
      eq(insurancePolicies.vehicleId, vehicleId),
      eq(insurancePolicies.userId, userId),
      eq(insurancePolicies.status, 'active')
    ));
  
  // Create new insurance policy record
  await db.insert(insurancePolicies).values({
    vehicleId,
    userId,
    policyNumber: policyNumber || null,
    insuranceProvider: insuranceProvider || null,
    policyStartDate,
    policyEndDate: policyExpiryDate,
    annualPremium,
    status: 'active'
  });
  
  // Update vehicle record with current policy info (for quick reference)
  const updateData: any = {
    insurancePolicyStartDate: policyStartDate,
    insuranceExpiryDate: policyExpiryDate,
    insuranceAnnualPremium: annualPremium,
    updatedAt: new Date()
  };
  
  if (insuranceProvider !== undefined) {
    updateData.insuranceProvider = insuranceProvider;
  }
  
  if (policyNumber !== undefined) {
    updateData.insurancePolicyNumber = policyNumber;
  }
  
  await db
    .update(vehicles)
    .set(updateData)
    .where(and(
      eq(vehicles.id, vehicleId),
      eq(vehicles.userId, userId)
    ));
  
  return { success: true, message: "Insurance renewed successfully" };
}

/**
 * Get all insurance policies for a vehicle
 */
export async function getVehicleInsurancePolicies(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(insurancePolicies)
    .where(and(
      eq(insurancePolicies.vehicleId, vehicleId),
      eq(insurancePolicies.userId, userId)
    ))
    .orderBy(desc(insurancePolicies.policyStartDate));
}

/**
 * Get active insurance policy for a vehicle
 */
export async function getActiveInsurancePolicy(vehicleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const policies = await db
    .select()
    .from(insurancePolicies)
    .where(and(
      eq(insurancePolicies.vehicleId, vehicleId),
      eq(insurancePolicies.userId, userId),
      eq(insurancePolicies.status, 'active')
    ))
    .limit(1);
  
  return policies.length > 0 ? policies[0] : null;
}

/**
 * Get insurance cost for a specific date range
 * Used for accurate P&L calculations
 */
export async function getInsuranceCostForPeriod(
  vehicleId: number,
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all policies that overlap with the date range
  const policies = await db
    .select()
    .from(insurancePolicies)
    .where(and(
      eq(insurancePolicies.vehicleId, vehicleId),
      eq(insurancePolicies.userId, userId),
      or(
        and(
          lte(insurancePolicies.policyStartDate, endDate),
          gte(insurancePolicies.policyEndDate, startDate)
        )
      )
    ));
  
  // Calculate prorated cost for each policy based on overlap
  let totalCost = 0;
  for (const policy of policies) {
    const policyStart = new Date(policy.policyStartDate);
    const policyEnd = new Date(policy.policyEndDate);
    const overlapStart = policyStart > startDate ? policyStart : startDate;
    const overlapEnd = policyEnd < endDate ? policyEnd : endDate;
    
    const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
    const policyDays = Math.ceil((policyEnd.getTime() - policyStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const proratedCost = (parseFloat(policy.annualPremium) / policyDays) * overlapDays;
    totalCost += proratedCost;
  }
  
  return totalCost;
}


export async function getAllInvoices(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId));
    return result;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export async function getAllInsurancePolicies(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(insurancePolicies)
      .where(eq(insurancePolicies.userId, userId));
    return result;
  } catch (error) {
    console.error("Error fetching insurance policies:", error);
    return [];
  }
}
