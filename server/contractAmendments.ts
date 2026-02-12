import { getDb } from "./db";
import { contractAmendments, rentalContracts, vehicles } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Create a contract amendment record
 */
export async function createContractAmendment(
  contractId: number,
  userId: number,
  amendmentType: "date_change" | "vehicle_change" | "rate_adjustment" | "other",
  amendmentReason: string,
  previousValues: any,
  newValues: any,
  amountDifference: number
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [amendment] = await db.insert(contractAmendments).values({
    contractId,
    userId,
    amendmentType,
    amendmentReason,
    previousValues: JSON.stringify(previousValues),
    newValues: JSON.stringify(newValues),
    amountDifference: amountDifference.toFixed(2),
  }).$returningId();

  return amendment;
}

/**
 * Get all amendments for a contract
 */
export async function getContractAmendments(contractId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(contractAmendments)
    .where(eq(contractAmendments.contractId, contractId))
    .orderBy(desc(contractAmendments.createdAt));
}

/**
 * Amend contract dates (extend or shorten rental period)
 */
export async function amendContractDates(
  contractId: number,
  userId: number,
  newStartDate: Date,
  newEndDate: Date,
  reason: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get current contract
  const [contract] = await db
    .select()
    .from(rentalContracts)
    .where(eq(rentalContracts.id, contractId))
    .limit(1);

  if (!contract) {
    throw new Error("Contract not found");
  }

  // Calculate new rental duration and amount
  const oldDuration = Math.ceil(
    (new Date(contract.rentalEndDate).getTime() - new Date(contract.rentalStartDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const newDuration = Math.ceil(
    (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const dailyRate = parseFloat(contract.dailyRate || "0");
  const oldTotalAmount = oldDuration * dailyRate;
  const newTotalAmount = newDuration * dailyRate;
  const amountDifference = newTotalAmount - oldTotalAmount;

  // Store previous values
  const previousValues = {
    rentalStartDate: contract.rentalStartDate,
    rentalEndDate: contract.rentalEndDate,
    rentalDuration: oldDuration,
    totalAmount: oldTotalAmount,
  };

  const newValues = {
    rentalStartDate: newStartDate,
    rentalEndDate: newEndDate,
    rentalDuration: newDuration,
    totalAmount: newTotalAmount,
  };

  // Update contract
  await db
    .update(rentalContracts)
    .set({
      rentalStartDate: newStartDate,
      rentalEndDate: newEndDate,
      finalAmount: newTotalAmount.toFixed(2),
    })
    .where(eq(rentalContracts.id, contractId));

  // Create amendment record
  await createContractAmendment(
    contractId,
    userId,
    "date_change",
    reason,
    previousValues,
    newValues,
    amountDifference
  );

  return { success: true, amountDifference };
}

/**
 * Amend contract vehicle (change to different vehicle)
 */
export async function amendContractVehicle(
  contractId: number,
  userId: number,
  newVehicleId: number,
  reason: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get current contract
  const [contract] = await db
    .select()
    .from(rentalContracts)
    .where(eq(rentalContracts.id, contractId))
    .limit(1);

  if (!contract) {
    throw new Error("Contract not found");
  }

  // Get old and new vehicle details
  const [oldVehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, contract.vehicleId))
    .limit(1);

  const [newVehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, newVehicleId))
    .limit(1);

  if (!newVehicle) {
    throw new Error("New vehicle not found");
  }

  // Check if new vehicle is available
  if (newVehicle.status !== "Available") {
    throw new Error("New vehicle is not available");
  }

  const previousValues = {
    vehicleId: contract.vehicleId,
    vehicleBrand: oldVehicle?.brand,
    vehicleModel: oldVehicle?.model,
    vehiclePlate: oldVehicle?.plateNumber,
  };

  const newValues = {
    vehicleId: newVehicleId,
    vehicleBrand: newVehicle.brand,
    vehicleModel: newVehicle.model,
    vehiclePlate: newVehicle.plateNumber,
  };

  // Update old vehicle status to Available
  if (oldVehicle) {
    await db
      .update(vehicles)
      .set({ status: "Available" })
      .where(eq(vehicles.id, oldVehicle.id));
  }

  // Update new vehicle status to Rented
  await db
    .update(vehicles)
    .set({ status: "Rented" })
    .where(eq(vehicles.id, newVehicleId));

  // Update contract
  await db
    .update(rentalContracts)
    .set({ vehicleId: newVehicleId })
    .where(eq(rentalContracts.id, contractId));

  // Create amendment record
  await createContractAmendment(
    contractId,
    userId,
    "vehicle_change",
    reason,
    previousValues,
    newValues,
    0
  );

  return { success: true };
}

/**
 * Amend contract rate (adjust daily rate or total amount)
 */
export async function amendContractRate(
  contractId: number,
  userId: number,
  newDailyRate: number,
  reason: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get current contract
  const [contract] = await db
    .select()
    .from(rentalContracts)
    .where(eq(rentalContracts.id, contractId))
    .limit(1);

  if (!contract) {
    throw new Error("Contract not found");
  }

  const oldDailyRate = parseFloat(contract.dailyRate || "0");
  const oldTotalAmount = parseFloat(contract.finalAmount || "0");
  // Calculate duration from dates
  const duration = Math.ceil(
    (new Date(contract.rentalEndDate).getTime() - new Date(contract.rentalStartDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const newTotalAmount = newDailyRate * duration;
  const amountDifference = newTotalAmount - oldTotalAmount;

  const previousValues = {
    dailyRate: oldDailyRate,
    totalAmount: oldTotalAmount,
  };

  const newValues = {
    dailyRate: newDailyRate,
    totalAmount: newTotalAmount,
  };

  // Update contract
  await db
    .update(rentalContracts)
    .set({
      dailyRate: newDailyRate.toFixed(2),
      finalAmount: newTotalAmount.toFixed(2),
    })
    .where(eq(rentalContracts.id, contractId));

  // Create amendment record
  await createContractAmendment(
    contractId,
    userId,
    "rate_adjustment",
    reason,
    previousValues,
    newValues,
    amountDifference
  );

  return { success: true, amountDifference };
}
