import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Vehicles table for fleet management
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  plateNumber: varchar("plateNumber", { length: 20 }).notNull().unique(),
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year").notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  category: mysqlEnum("category", ["Economy", "Compact", "Midsize", "SUV", "Luxury", "Van", "Truck"]).notNull(),
  status: mysqlEnum("status", ["Available", "Rented", "Maintenance", "Out of Service"]).default("Available").notNull(),
  dailyRate: decimal("dailyRate", { precision: 10, scale: 2 }).notNull(),
  weeklyRate: decimal("weeklyRate", { precision: 10, scale: 2 }),
  monthlyRate: decimal("monthlyRate", { precision: 10, scale: 2 }),
  mileage: int("mileage").default(0),
  vin: varchar("vin", { length: 17 }),
  insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 100 }),
  insuranceExpiryDate: timestamp("insuranceExpiryDate"),
  registrationExpiryDate: timestamp("registrationExpiryDate"),
  photoUrl: text("photoUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Maintenance records table
 */
export const maintenanceRecords = mysqlTable("maintenanceRecords", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  maintenanceType: mysqlEnum("maintenanceType", ["Routine", "Repair", "Inspection", "Emergency"]).notNull(),
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  performedAt: timestamp("performedAt").notNull(),
  performedBy: varchar("performedBy", { length: 200 }),
  garageLocation: varchar("garageLocation", { length: 300 }),
  mileageAtService: int("mileageAtService"),
  kmDueMaintenance: int("kmDueMaintenance"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = typeof maintenanceRecords.$inferInsert;
/**
 * Rental contracts table
 */
export const rentalContracts = mysqlTable("rentalContracts", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  clientFirstName: varchar("clientFirstName", { length: 100 }).notNull(),
  clientLastName: varchar("clientLastName", { length: 100 }).notNull(),
  clientNationality: varchar("clientNationality", { length: 100 }),
  drivingLicenseNumber: varchar("drivingLicenseNumber", { length: 100 }).notNull(),
  licenseIssueDate: timestamp("licenseIssueDate"),
  licenseExpiryDate: timestamp("licenseExpiryDate").notNull(),
  rentalStartDate: timestamp("rentalStartDate").notNull(),
  rentalEndDate: timestamp("rentalEndDate").notNull(),
  signatureData: text("signatureData"), // Base64 encoded signature image
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RentalContract = typeof rentalContracts.$inferSelect;
export type InsertRentalContract = typeof rentalContracts.$inferInsert;

/**
 * Car damage marks table for rental contracts
 */
export const damageMarks = mysqlTable("damageMarks", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  xPosition: decimal("xPosition", { precision: 5, scale: 2 }).notNull(), // Percentage position
  yPosition: decimal("yPosition", { precision: 5, scale: 2 }).notNull(), // Percentage position
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DamageMark = typeof damageMarks.$inferSelect;
export type InsertDamageMark = typeof damageMarks.$inferInsert;
