import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "admin", "super_admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Password reset tokens table for forgot password functionality
 */
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Company profiles table for branding and company information
 */
export const companyProfiles = mysqlTable("companyProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the company profile
  companyName: varchar("companyName", { length: 255 }).notNull(),
  registrationNumber: varchar("registrationNumber", { length: 100 }),
  taxId: varchar("taxId", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  logoUrl: text("logoUrl"), // S3 URL for company logo
  primaryColor: varchar("primaryColor", { length: 7 }), // Hex color code
  secondaryColor: varchar("secondaryColor", { length: 7 }), // Hex color code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = typeof companyProfiles.$inferInsert;

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
  purchaseCost: decimal("purchaseCost", { precision: 10, scale: 2 }), // Vehicle purchase cost for P&L analysis
  registrationExpiryDate: timestamp("registrationExpiryDate"),
  // AI Maintenance - Vehicle specifications for intelligent scheduling
  engineType: varchar("engineType", { length: 50 }), // e.g., "Gasoline", "Diesel", "Hybrid", "Electric"
  transmission: varchar("transmission", { length: 50 }), // e.g., "Automatic", "Manual", "CVT"
  fuelType: varchar("fuelType", { length: 50 }), // e.g., "Gasoline", "Diesel", "Electric", "Hybrid"
  engineSize: varchar("engineSize", { length: 20 }), // e.g., "2.0L", "1.6L"
  purchaseDate: timestamp("purchaseDate"), // When vehicle was acquired
  averageDailyKm: int("averageDailyKm"), // Average daily usage for predictive maintenance
  usagePattern: varchar("usagePattern", { length: 50 }), // e.g., "City", "Highway", "Mixed"
  climate: varchar("climate", { length: 50 }), // e.g., "Hot", "Cold", "Moderate", "Humid"
  lastServiceDate: timestamp("lastServiceDate"), // Last major service date
  lastServiceKm: int("lastServiceKm"), // Mileage at last service
  // Maintenance schedule tracking
  nextMaintenanceDate: timestamp("nextMaintenanceDate"), // Next scheduled maintenance date
  nextMaintenanceKm: int("nextMaintenanceKm"), // Next maintenance at this mileage
  maintenanceIntervalKm: int("maintenanceIntervalKm").default(5000), // Maintenance every X km (default 5000km)
  maintenanceIntervalMonths: int("maintenanceIntervalMonths").default(6), // Maintenance every X months (default 6 months)
  aiMaintenanceEnabled: boolean("aiMaintenanceEnabled").default(true), // Whether AI maintenance is enabled for this vehicle
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
 * AI-generated maintenance tasks table
 * Stores intelligent maintenance recommendations with priority levels
 */
export const maintenanceTasks = mysqlTable("maintenanceTasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  vehicleId: int("vehicleId").notNull(),
  taskName: varchar("taskName", { length: 200 }).notNull(), // e.g., "Engine Oil Change", "Brake Inspection"
  description: text("description"), // Detailed description of the task
  priority: mysqlEnum("priority", ["Critical", "Important", "Recommended", "Optional"]).notNull(),
  category: varchar("category", { length: 100 }), // e.g., "Engine", "Brakes", "Tires", "Fluids"
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 2 }), // AI-estimated cost
  estimatedDuration: int("estimatedDuration"), // Estimated time in minutes
  // Trigger conditions
  triggerType: mysqlEnum("triggerType", ["Mileage", "Time", "Both"]).notNull(),
  triggerMileage: int("triggerMileage"), // Trigger at this mileage
  triggerDate: timestamp("triggerDate"), // Trigger at this date
  intervalMileage: int("intervalMileage"), // Repeat every X km
  intervalMonths: int("intervalMonths"), // Repeat every X months
  // Status tracking
  status: mysqlEnum("status", ["Pending", "Overdue", "Completed", "Skipped", "Dismissed"]).default("Pending").notNull(),
  completedAt: timestamp("completedAt"),
  completedMileage: int("completedMileage"),
  actualCost: decimal("actualCost", { precision: 10, scale: 2 }),
  // AI metadata
  aiGenerated: boolean("aiGenerated").default(true), // Whether this was AI-generated or manually created
  aiReasoning: text("aiReasoning"), // AI's explanation for this recommendation
  userOverridden: boolean("userOverridden").default(false), // Whether user modified AI recommendation
  overrideNotes: text("overrideNotes"), // User's notes when overriding
  // Linked maintenance record (when completed)
  maintenanceRecordId: int("maintenanceRecordId"), // Links to maintenanceRecords table when task is completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;
export type InsertMaintenanceTask = typeof maintenanceTasks.$inferInsert;

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
  returnFuelLevel: mysqlEnum("returnFuelLevel", ["Empty", "1/4", "1/2", "3/4", "Full"]), // Fuel level at return
  pickupKm: int("pickupKm"), // Odometer reading at pickup/contract creation
  returnKm: int("returnKm"), // Odometer reading at return/contract completion
  returnNotes: text("returnNotes"), // Notes about vehicle condition at return
  damageInspection: text("damageInspection"), // Damage inspection notes at return
  kmLimit: int("kmLimit"), // Maximum allowed kilometers for the rental period
  overLimitKmFee: decimal("overLimitKmFee", { precision: 10, scale: 2 }).default("0.00"), // Fee for exceeding KM limit
  overLimitKmRate: decimal("overLimitKmRate", { precision: 10, scale: 2 }).default("0.50"), // Rate per KM over limit (default $0.50/km)
  lateFeePercentage: decimal("lateFeePercentage", { precision: 5, scale: 2 }).default("150.00"), // Percentage of daily rate for late fees (default 150%)
  lateFee: decimal("lateFee", { precision: 10, scale: 2 }).default("0.00"), // Calculated late fee amount
  // Insurance package selection
  insurancePackage: mysqlEnum("insurancePackage", ["None", "Basic", "Premium", "Full Coverage"]).default("None"),
  insuranceCost: decimal("insuranceCost", { precision: 10, scale: 2 }).default("0.00"), // Total insurance cost for rental period
  insuranceDailyRate: decimal("insuranceDailyRate", { precision: 10, scale: 2 }).default("0.00"), // Daily insurance rate
  // Deposit management
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }).default("0.00"), // Security deposit amount
  depositStatus: mysqlEnum("depositStatus", ["None", "Held", "Refunded", "Forfeited"]).default("None"),
  depositRefundDate: timestamp("depositRefundDate"), // Date when deposit was refunded
  depositNotes: text("depositNotes"), // Notes about deposit (reason for forfeit, etc.)
  // Fuel policy
  fuelPolicy: mysqlEnum("fuelPolicy", ["Full-to-Full", "Same-to-Same", "Pre-purchase"]).default("Full-to-Full"),
  fuelCharge: decimal("fuelCharge", { precision: 10, scale: 2 }).default("0.00"), // Fuel charges (if applicable)
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
  exchangeRateLbpToUsd: decimal("exchangeRateLbpToUsd", { precision: 10, scale: 2 }).default("89700.00").notNull(), // LBP per 1 USD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = typeof companySettings.$inferInsert;

/**
 * Invoices table for billing and payment tracking
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contractId: int("contractId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  invoiceDate: date("invoiceDate").notNull(),
  dueDate: date("dueDate").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paidAt: timestamp("paidAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Invoice line items table for itemized charges
 */
export const invoiceLineItems = mysqlTable("invoiceLineItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

/**
 * Nationalities table for autocomplete dropdown
 * Stores unique nationalities entered by users for future selection
 */
export const nationalities = mysqlTable("nationalities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  nationality: varchar("nationality", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Nationality = typeof nationalities.$inferSelect;
export type InsertNationality = typeof nationalities.$inferInsert;

/**
 * Audit logs table for tracking admin actions
 * Records all administrative operations with actor and timestamp information
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  /** User ID of the admin who performed the action */
  actorId: int("actorId").notNull(),
  /** Username of the admin who performed the action */
  actorUsername: varchar("actorUsername", { length: 100 }).notNull(),
  /** Role of the admin at the time of action */
  actorRole: varchar("actorRole", { length: 20 }).notNull(),
  /** Type of action performed */
  action: varchar("action", { length: 50 }).notNull(), // e.g., "role_change", "user_delete", "user_create"
  /** ID of the target user (if applicable) */
  targetUserId: int("targetUserId"),
  /** Username of the target user (if applicable) */
  targetUsername: varchar("targetUsername", { length: 100 }),
  /** Detailed description of the action */
  details: text("details").notNull(),
  /** Previous state before action (JSON) */
  previousState: text("previousState"),
  /** New state after action (JSON) */
  newState: text("newState"),
  /** IP address of the actor */
  ipAddress: varchar("ipAddress", { length: 45 }),
  /** Timestamp of the action */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Vehicle images table for storing multiple photos per vehicle
 * Supports exterior and interior photos with S3 URLs
 */
export const vehicleImages = mysqlTable("vehicleImages", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(), // Foreign key to vehicles table
  userId: int("userId").notNull(), // Foreign key to users table
  imageUrl: text("imageUrl").notNull(), // S3 URL for the image
  imageType: mysqlEnum("imageType", ["exterior", "interior"]).notNull(),
  displayOrder: int("displayOrder").default(0), // Order for displaying images
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VehicleImage = typeof vehicleImages.$inferSelect;
export type InsertVehicleImage = typeof vehicleImages.$inferInsert;


/**
 * Dashboard preferences table for customizable dashboard widgets
 */
export const dashboardPreferences = mysqlTable("dashboardPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  widgetId: varchar("widgetId", { length: 100 }).notNull(), // e.g., "total_vehicles", "active_contracts", "revenue_chart"
  position: int("position").notNull(), // Order of widget on dashboard
  isVisible: boolean("isVisible").default(true).notNull(),
  settings: text("settings"), // JSON string for widget-specific settings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DashboardPreference = typeof dashboardPreferences.$inferSelect;
export type InsertDashboardPreference = typeof dashboardPreferences.$inferInsert;


/**
 * Contract amendments table for tracking all changes made to rental contracts
 */
export const contractAmendments = mysqlTable("contractAmendments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(), // Foreign key to rentalContracts
  userId: int("userId").notNull(), // User who made the amendment
  amendmentType: mysqlEnum("amendmentType", ["date_change", "vehicle_change", "rate_adjustment", "other"]).notNull(),
  amendmentReason: text("amendmentReason").notNull(),
  previousValues: text("previousValues").notNull(), // JSON string of old values
  newValues: text("newValues").notNull(), // JSON string of new values
  amountDifference: decimal("amountDifference", { precision: 10, scale: 2 }).default("0.00"), // Change in total amount
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractAmendment = typeof contractAmendments.$inferSelect;
export type InsertContractAmendment = typeof contractAmendments.$inferInsert;


/**
 * WhatsApp message templates table for customizable contract sharing
 */
export const whatsappTemplates = mysqlTable("whatsappTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  templateType: mysqlEnum("templateType", [
    "contract_created",
    "contract_renewed", 
    "contract_completed",
    "invoice_generated"
  ]).notNull(),
  messageTemplate: text("messageTemplate").notNull(), // Template with variables like {{contractNumber}}, {{clientName}}
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = typeof whatsappTemplates.$inferInsert;
