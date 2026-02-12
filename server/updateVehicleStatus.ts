import { getDb } from "./db";
import { vehicles, rentalContracts, maintenanceRecords } from "../drizzle/schema";
import { eq, and, or, lte, gte, isNull } from "drizzle-orm";

/**
 * Automatically calculate and update vehicle status based on:
 * - Active rental contracts (status = "Rented")
 * - Active maintenance records (status = "Maintenance")
 * - Otherwise (status = "Available")
 */
export async function updateVehicleStatus(vehicleId: number): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const now = new Date();

  // Check for active rental contracts
  const activeContracts = await db
    .select()
    .from(rentalContracts)
    .where(
      and(
        eq(rentalContracts.vehicleId, vehicleId),
        or(
          eq(rentalContracts.status, "active"),
          eq(rentalContracts.status, "overdue")
        )
      )
    )
    .limit(1);

  if (activeContracts.length > 0) {
    // Vehicle is currently rented
    await db
      .update(vehicles)
      .set({ status: "Rented" })
      .where(eq(vehicles.id, vehicleId));
    return "Rented";
  }

  // Check for active maintenance records (vehicle in garage - no exit date yet)
  const activeMaintenance = await db
    .select()
    .from(maintenanceRecords)
    .where(
      and(
        eq(maintenanceRecords.vehicleId, vehicleId),
        isNull(maintenanceRecords.garageExitDate)
      )
    )
    .limit(1);

  if (activeMaintenance.length > 0) {
    // Vehicle is in maintenance
    await db
      .update(vehicles)
      .set({ status: "Maintenance" })
      .where(eq(vehicles.id, vehicleId));
    return "Maintenance";
  }

  // No active contracts or maintenance - vehicle is available
  await db
    .update(vehicles)
    .set({ status: "Available" })
    .where(eq(vehicles.id, vehicleId));
  return "Available";
}

/**
 * Update status for all vehicles (useful for batch updates)
 */
export async function updateAllVehicleStatuses(): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const allVehicles = await db.select({ id: vehicles.id }).from(vehicles);
  
  for (const vehicle of allVehicles) {
    await updateVehicleStatus(vehicle.id);
  }
}
