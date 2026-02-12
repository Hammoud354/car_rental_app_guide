import { getDb } from "./db";
import { vehicles, companySettings } from "../drizzle/schema";
import { sql, and, or, isNotNull, lt, lte } from "drizzle-orm";

/**
 * Check for vehicles with maintenance due and return alert details
 * Maintenance is considered due if:
 * - Next maintenance date is within 7 days
 * - Current mileage is within 500km of next maintenance km
 */
export async function checkMaintenanceDue(userId: number) {
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  // Get all vehicles with maintenance schedules
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const vehiclesWithMaintenance = await db
    .select()
    .from(vehicles)
    .where(
      and(
        sql`${vehicles.userId} = ${userId}`,
        or(
          // Date-based: maintenance due within 7 days
          and(
            isNotNull(vehicles.nextMaintenanceDate),
            lte(vehicles.nextMaintenanceDate, sevenDaysFromNow)
          ),
          // Mileage-based: within 500km of next maintenance
          and(
            isNotNull(vehicles.nextMaintenanceKm),
            isNotNull(vehicles.mileage),
            sql`${vehicles.nextMaintenanceKm} - ${vehicles.mileage} <= 500`
          )
        )
      )
    );

  const alerts: Array<{
    vehicleId: number;
    plateNumber: string;
    brand: string;
    model: string;
    dueType: "date" | "mileage" | "both";
    daysUntilDue?: number;
    kmUntilDue?: number;
    nextMaintenanceDate?: Date | null;
    nextMaintenanceKm?: number | null;
    currentMileage?: number | null;
  }> = [];

  for (const vehicle of vehiclesWithMaintenance) {
    let dueType: "date" | "mileage" | "both" = "date";
    let daysUntilDue: number | undefined;
    let kmUntilDue: number | undefined;

    const isDateDue =
      vehicle.nextMaintenanceDate &&
      new Date(vehicle.nextMaintenanceDate) <= sevenDaysFromNow;
    const isMileageDue =
      vehicle.nextMaintenanceKm &&
      vehicle.mileage &&
      vehicle.nextMaintenanceKm - vehicle.mileage <= 500;

    if (isDateDue && isMileageDue) {
      dueType = "both";
    } else if (isMileageDue) {
      dueType = "mileage";
    }

    if (isDateDue && vehicle.nextMaintenanceDate) {
      const diffTime = new Date(vehicle.nextMaintenanceDate).getTime() - today.getTime();
      daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    if (isMileageDue && vehicle.nextMaintenanceKm && vehicle.mileage) {
      kmUntilDue = vehicle.nextMaintenanceKm - vehicle.mileage;
    }

    alerts.push({
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      dueType,
      daysUntilDue,
      kmUntilDue,
      nextMaintenanceDate: vehicle.nextMaintenanceDate,
      nextMaintenanceKm: vehicle.nextMaintenanceKm,
      currentMileage: vehicle.mileage,
    });
  }

  return alerts;
}

/**
 * Generate WhatsApp message for maintenance alerts
 */
export function generateMaintenanceAlertMessage(
  alerts: Array<{
    plateNumber: string;
    brand: string;
    model: string;
    dueType: "date" | "mileage" | "both";
    daysUntilDue?: number;
    kmUntilDue?: number;
    nextMaintenanceDate?: Date | null;
    nextMaintenanceKm?: number | null;
    currentMileage?: number | null;
  }>
): string {
  if (alerts.length === 0) {
    return "No maintenance alerts at this time.";
  }

  let message = `🔧 *MAINTENANCE ALERT*\\n\\n`;
  message += `${alerts.length} vehicle(s) need maintenance attention:\\n\\n`;

  alerts.forEach((alert, index) => {
    message += `${index + 1}. *${alert.brand} ${alert.model}* (${alert.plateNumber})\\n`;

    if (alert.dueType === "date" || alert.dueType === "both") {
      message += `   📅 Due: ${alert.daysUntilDue === 0 ? "TODAY" : `in ${alert.daysUntilDue} day(s)`}\\n`;
      if (alert.nextMaintenanceDate) {
        message += `   Date: ${new Date(alert.nextMaintenanceDate).toLocaleDateString()}\\n`;
      }
    }

    if (alert.dueType === "mileage" || alert.dueType === "both") {
      message += `   🛣️ ${alert.kmUntilDue}km until maintenance\\n`;
      message += `   Current: ${alert.currentMileage?.toLocaleString()}km → Target: ${alert.nextMaintenanceKm?.toLocaleString()}km\\n`;
    }

    message += `\\n`;
  });

  message += `Please schedule maintenance as soon as possible.`;

  return message;
}

/**
 * Get company phone number for WhatsApp alerts
 */
export async function getCompanyPhoneNumber(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const settings = await db
    .select()
    .from(companySettings)
    .where(sql`${companySettings.userId} = ${userId}`)
    .limit(1);

  if (settings.length > 0 && settings[0].phone) {
    return settings[0].phone;
  }

  return null;
}
