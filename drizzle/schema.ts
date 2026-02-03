import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

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
  openId: varchar("openId", { length: 64 }).unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }), // Hashed password
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  countryCode: varchar("countryCode", { length: 10 }), // e.g., +1, +961
  country: varchar("country", { length: 100 }), // Country where system is managed
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
  userId: int("userId").notNull(), // Foreign key to users table
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
  insuranceCost: decimal("insuranceCost", { precision: 10, scale: 2 }), // Annual or total insurance cost
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
  userId: int("userId").notNull(), // Foreign key to users table
  vehicleId: int("vehicleId").notNull(),
  maintenanceType: mysqlEnum("maintenanceType", [
    "Routine", 
    "Repair", 
    "Inspection", 
    "Emergency",
    "Oil Change",
    "Brake Pads Change",
    "Oil + Filter"
  ]).notNull(),
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  performedAt: timestamp("performedAt").notNull(),
  performedBy: varchar("performedBy", { length: 200 }),
  garageLocation: varchar("garageLocation", { length: 300 }),
  mileageAtService: int("mileageAtService"),
  kmDueMaintenance: int("kmDueMaintenance"),
  garageEntryDate: timestamp("garageEntryDate"), // Date when vehicle entered the garage
  garageExitDate: timestamp("garageExitDate"), // Date when vehicle exited the garage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = typeof maintenanceRecords.$inferInsert;

/**
 * Clients table for managing rental customers
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  nationality: varchar("nationality", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  drivingLicenseNumber: varchar("drivingLicenseNumber", { length: 100 }).notNull(),
  licenseIssueDate: timestamp("licenseIssueDate"),
  licenseExpiryDate: timestamp("licenseExpiryDate").notNull(),
  email: varchar("email", { length: 320 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Rental contracts table
 */
export const rentalContracts = mysqlTable("rentalContracts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  vehicleId: int("vehicleId").notNull(),
  clientId: int("clientId"), // Optional: reference to clients table if using existing client
  // Keep inline client fields for backward compatibility and quick contracts without pre-registered clients
  clientFirstName: varchar("clientFirstName", { length: 100 }),
  clientLastName: varchar("clientLastName", { length: 100 }),
  clientNationality: varchar("clientNationality", { length: 100 }),
  clientPhone: varchar("clientPhone", { length: 20 }),
  clientAddress: text("clientAddress"),
  drivingLicenseNumber: varchar("drivingLicenseNumber", { length: 100 }),
  licenseIssueDate: timestamp("licenseIssueDate"),
  licenseExpiryDate: timestamp("licenseExpiryDate"),
  rentalStartDate: timestamp("rentalStartDate").notNull(),
  rentalEndDate: timestamp("rentalEndDate").notNull(),
  rentalDays: int("rentalDays").notNull(),
  dailyRate: decimal("dailyRate", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  finalAmount: decimal("finalAmount", { precision: 10, scale: 2 }).notNull(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull(),
  signatureData: text("signatureData"), // Base64 encoded signature image
  fuelLevel: mysqlEnum("fuelLevel", ["Empty", "1/4", "1/2", "3/4", "Full"]).default("Full"), // Fuel level at rental start
  pickupKm: int("pickupKm"), // Odometer reading at pickup/contract creation
  returnKm: int("returnKm"), // Odometer reading at return/contract completion
  lateFeePercentage: decimal("lateFeePercentage", { precision: 5, scale: 2 }).default("150.00"), // Percentage of daily rate for late fees (default 150%)
  lateFee: decimal("lateFee", { precision: 10, scale: 2 }).default("0.00"), // Calculated late fee amount
  status: mysqlEnum("status", ["active", "completed", "overdue"]).default("active").notNull(),
  returnedAt: timestamp("returnedAt"), // Timestamp when contract was marked as returned
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
  userId: int("userId").notNull(), // Foreign key to users table
  contractId: int("contractId").notNull(),
  xPosition: decimal("xPosition", { precision: 5, scale: 2 }).notNull(), // Percentage position
  yPosition: decimal("yPosition", { precision: 5, scale: 2 }).notNull(), // Percentage position
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DamageMark = typeof damageMarks.$inferSelect;
export type InsertDamageMark = typeof damageMarks.$inferInsert;

/**
 * Car makers table - stores car manufacturers by country
 */
export const carMakers = mysqlTable("carMakers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(), // Country where this maker is available
  isCustom: boolean("isCustom").default(false).notNull(), // True if added by user
  userId: int("userId"), // User who added this custom maker
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CarMaker = typeof carMakers.$inferSelect;
export type InsertCarMaker = typeof carMakers.$inferInsert;

/**
 * Car models/SKUs table - stores car models for each maker
 */
export const carModels = mysqlTable("carModels", {
  id: int("id").autoincrement().primaryKey(),
  makerId: int("makerId").notNull(), // Foreign key to carMakers
  modelName: varchar("modelName", { length: 100 }).notNull(),
  year: int("year"), // Optional year for specific model years
  isCustom: boolean("isCustom").default(false).notNull(), // True if added by user
  userId: int("userId"), // User who added this custom model
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CarModel = typeof carModels.$inferSelect;
export type InsertCarModel = typeof carModels.$inferInsert;


/**
 * Company Settings table - stores company information for contracts
 */
export const companySettings = mysqlTable("companySettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One settings record per user
  companyName: varchar("companyName", { length: 255 }).notNull(),
  logo: text("logo"), // S3 URL for company logo
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  taxId: varchar("taxId", { length: 100 }),
  website: varchar("website", { length: 255 }),
  termsAndConditions: text("termsAndConditions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = typeof companySettings.$inferInsert;
