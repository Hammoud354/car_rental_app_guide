import { integer, pgEnum, pgTable, text, timestamp, varchar, decimal, boolean, date, json, serial } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin", "super_admin"]);
export const defaultCurrencyEnum = pgEnum("defaultCurrency", ["USD", "LOCAL"]);
export const vehicleCategoryEnum = pgEnum("category", ["Economy", "Compact", "Midsize", "SUV", "Luxury", "Van", "Truck"]);
export const vehicleStatusEnum = pgEnum("vehicleStatus", ["Available", "Rented", "Maintenance", "Out of Service"]);
export const maintenanceTypeEnum = pgEnum("maintenanceType", ["Routine", "Repair", "Inspection", "Emergency", "Oil Change", "Brake Pads Change", "Oil + Filter"]);
export const priorityEnum = pgEnum("priority", ["Critical", "Important", "Recommended", "Optional"]);
export const triggerTypeEnum = pgEnum("triggerType", ["Mileage", "Time", "Both"]);
export const taskStatusEnum = pgEnum("taskStatus", ["Pending", "Completed", "Skipped"]);
export const fuelLevelEnum = pgEnum("fuelLevel", ["Empty", "1/4", "1/2", "3/4", "Full"]);
export const insurancePackageEnum = pgEnum("insurancePackage", ["None", "Basic", "Premium", "Full Coverage"]);
export const depositStatusEnum = pgEnum("depositStatus", ["None", "Held", "Refunded", "Forfeited"]);
export const fuelPolicyEnum = pgEnum("fuelPolicy", ["Full-to-Full", "Same-to-Same", "Pre-purchase"]);
export const contractStatusEnum = pgEnum("contractStatus", ["active", "completed", "overdue"]);
export const imageTypeEnum = pgEnum("imageType", ["exterior", "interior"]);
export const amendmentTypeEnum = pgEnum("amendmentType", ["date_change", "vehicle_change", "rate_adjustment", "other"]);
export const whatsappTemplateTypeEnum = pgEnum("templateType", ["contract_created", "contract_renewed", "contract_completed", "invoice_generated"]);
export const subscriptionStatusEnum = pgEnum("subscriptionStatus", ["active", "inactive", "cancelled", "expired"]);
export const subscriptionActionEnum = pgEnum("subscriptionAction", ["created", "upgraded", "downgraded", "cancelled", "reactivated"]);
export const actorTypeEnum = pgEnum("actorType", ["user", "admin", "system"]);
export const contractTemplateTypeEnum = pgEnum("contractTemplateType", ["pdf", "image"]);
export const fieldTypeEnum = pgEnum("fieldType", ["text", "date", "number", "phone"]);
export const textAlignmentEnum = pgEnum("textAlignment", ["left", "center", "right"]);
export const paymentStatusEnum = pgEnum("paymentStatus", ["pending", "paid", "overdue", "cancelled"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  countryCode: varchar("countryCode", { length: 10 }),
  country: varchar("country", { length: 100 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  isInternal: boolean("isInternal").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Password reset tokens table for forgot password functionality
 */
export const passwordResetTokens = pgTable("passwordResetTokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
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
export const companyProfiles = pgTable("companyProfiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  registrationNumber: varchar("registrationNumber", { length: 100 }),
  taxId: varchar("taxId", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }),
  secondaryColor: varchar("secondaryColor", { length: 7 }),
  contractTemplateUrl: text("contractTemplateUrl"),
  contractTemplateFieldMap: json("contractTemplateFieldMap"),
  defaultCurrency: defaultCurrencyEnum("defaultCurrency").default("USD").notNull(),
  exchangeRate: decimal("exchangeRate", { precision: 10, scale: 4 }).default("1.0000").notNull(),
  localCurrencyCode: varchar("localCurrencyCode", { length: 3 }).default("LBP"),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("11.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = typeof companyProfiles.$inferInsert;

/**
 * Vehicles table for fleet management
 */
export const vehicles = pgTable(
  "vehicles",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plateNumber: varchar("plateNumber", { length: 20 }).notNull().unique(),
    brand: varchar("brand", { length: 100 }).notNull(),
    model: varchar("model", { length: 100 }).notNull(),
    year: integer("year").notNull(),
    color: varchar("color", { length: 50 }).notNull(),
    category: vehicleCategoryEnum("category").notNull(),
    status: vehicleStatusEnum("status").default("Available").notNull(),
    dailyRate: decimal("dailyRate", { precision: 10, scale: 2 }).notNull(),
    weeklyRate: decimal("weeklyRate", { precision: 10, scale: 2 }),
    monthlyRate: decimal("monthlyRate", { precision: 10, scale: 2 }),
    mileage: integer("mileage").default(0),
    vin: varchar("vin", { length: 17 }),
    insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 100 }),
    insuranceProvider: varchar("insuranceProvider", { length: 200 }),
    insurancePolicyStartDate: timestamp("insurancePolicyStartDate"),
    insuranceExpiryDate: timestamp("insuranceExpiryDate"),
    insuranceAnnualPremium: decimal("insuranceAnnualPremium", { precision: 10, scale: 2 }),
    insuranceCost: decimal("insuranceCost", { precision: 10, scale: 2 }),
    purchaseCost: decimal("purchaseCost", { precision: 10, scale: 2 }),
    registrationExpiryDate: timestamp("registrationExpiryDate"),
    engineType: varchar("engineType", { length: 50 }),
    transmission: varchar("transmission", { length: 50 }),
    fuelType: varchar("fuelType", { length: 50 }),
    engineSize: varchar("engineSize", { length: 20 }),
    purchaseDate: timestamp("purchaseDate"),
    averageDailyKm: integer("averageDailyKm"),
    usagePattern: varchar("usagePattern", { length: 50 }),
    climate: varchar("climate", { length: 50 }),
    lastServiceDate: timestamp("lastServiceDate"),
    lastServiceKm: integer("lastServiceKm"),
    nextMaintenanceDate: timestamp("nextMaintenanceDate"),
    nextMaintenanceKm: integer("nextMaintenanceKm"),
    maintenanceIntervalKm: integer("maintenanceIntervalKm").default(5000),
    maintenanceIntervalMonths: integer("maintenanceIntervalMonths").default(6),
    aiMaintenanceEnabled: boolean("aiMaintenanceEnabled").default(true),
    photoUrl: text("photoUrl"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  }
);

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Maintenance records table
 */
export const maintenanceRecords = pgTable("maintenanceRecords", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  maintenanceType: maintenanceTypeEnum("maintenanceType").notNull(),
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  performedAt: timestamp("performedAt").notNull(),
  performedBy: varchar("performedBy", { length: 200 }),
  garageLocation: varchar("garageLocation", { length: 300 }),
  mileageAtService: integer("mileageAtService"),
  kmDueMaintenance: integer("kmDueMaintenance"),
  garageEntryDate: timestamp("garageEntryDate"),
  garageExitDate: timestamp("garageExitDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = typeof maintenanceRecords.$inferInsert;

/**
 * AI-generated maintenance tasks table
 */
export const maintenanceTasks = pgTable("maintenanceTasks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  taskName: varchar("taskName", { length: 200 }).notNull(),
  description: text("description"),
  priority: priorityEnum("priority").notNull(),
  category: varchar("category", { length: 100 }),
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 2 }),
  estimatedDuration: integer("estimatedDuration"),
  triggerType: triggerTypeEnum("triggerType").notNull(),
  triggerMileage: integer("triggerMileage"),
  triggerDate: timestamp("triggerDate"),
  status: taskStatusEnum("status").default("Pending").notNull(),
  completedAt: timestamp("completedAt"),
  completedMileage: integer("completedMileage"),
  actualCost: decimal("actualCost", { precision: 10, scale: 2 }),
  maintenanceRecordId: integer("maintenanceRecordId"),
  aiGenerated: boolean("aiGenerated").default(true).notNull(),
  aiReasoning: text("aiReasoning"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;
export type InsertMaintenanceTask = typeof maintenanceTasks.$inferInsert;

/**
 * Clients table for customer management
 */
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  fatherName: varchar("fatherName", { length: 200 }),
  motherFullName: varchar("motherFullName", { length: 200 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  nationality: varchar("nationality", { length: 100 }),
  dateOfBirth: timestamp("dateOfBirth"),
  placeOfBirth: varchar("placeOfBirth", { length: 200 }),
  driverLicenseNumber: varchar("driverLicenseNumber", { length: 100 }),
  licenseIssueDate: timestamp("licenseIssueDate"),
  licenseExpiryDate: timestamp("licenseExpiryDate"),
  passportNumber: varchar("passportNumber", { length: 100 }),
  idNumber: varchar("idNumber", { length: 100 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Rental contracts table
 */
export const rentalContracts = pgTable("rentalContracts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  clientId: integer("clientId").references(() => clients.id, { onDelete: "set null" }),
  clientName: varchar("clientName", { length: 200 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 20 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientNationality: varchar("clientNationality", { length: 100 }),
  clientDriverLicense: varchar("clientDriverLicense", { length: 100 }),
  clientPassport: varchar("clientPassport", { length: 100 }),
  clientId2: varchar("clientId2", { length: 100 }),
  clientAddress: text("clientAddress"),
  rentalStartDate: timestamp("rentalStartDate").notNull(),
  rentalEndDate: timestamp("rentalEndDate").notNull(),
  rentalDays: integer("rentalDays").notNull(),
  pickupTime: varchar("pickupTime", { length: 20 }),
  returnTime: varchar("returnTime", { length: 20 }),
  dailyRate: decimal("dailyRate", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  finalAmount: decimal("finalAmount", { precision: 10, scale: 2 }).notNull(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull(),
  signatureData: text("signatureData"),
  vehicleType: varchar("vehicleType", { length: 50 }),
  vehicleColor: varchar("vehicleColor", { length: 50 }),
  vehicleFuelType: varchar("vehicleFuelType", { length: 50 }),
  vehicleVIN: varchar("vehicleVIN", { length: 17 }),
  fuelLevel: fuelLevelEnum("fuelLevel").default("Full"),
  returnFuelLevel: fuelLevelEnum("returnFuelLevel"),
  pickupKm: integer("pickupKm"),
  returnKm: integer("returnKm"),
  returnNotes: text("returnNotes"),
  damageInspection: text("damageInspection"),
  kmLimit: integer("kmLimit"),
  overLimitKmFee: decimal("overLimitKmFee", { precision: 10, scale: 2 }).default("0.00"),
  overLimitKmRate: decimal("overLimitKmRate", { precision: 10, scale: 2 }).default("0.50"),
  lateFeePercentage: decimal("lateFeePercentage", { precision: 5, scale: 2 }).default("150.00"),
  lateFee: decimal("lateFee", { precision: 10, scale: 2 }).default("0.00"),
  insurancePackage: insurancePackageEnum("insurancePackage").default("None"),
  insuranceCost: decimal("insuranceCost", { precision: 10, scale: 2 }).default("0.00"),
  insuranceDailyRate: decimal("insuranceDailyRate", { precision: 10, scale: 2 }).default("0.00"),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }).default("0.00"),
  depositStatus: depositStatusEnum("depositStatus").default("None"),
  depositRefundDate: timestamp("depositRefundDate"),
  depositNotes: text("depositNotes"),
  fuelPolicy: fuelPolicyEnum("fuelPolicy").default("Full-to-Full"),
  fuelCharge: decimal("fuelCharge", { precision: 10, scale: 2 }).default("0.00"),
  status: contractStatusEnum("status").default("active").notNull(),
  returnedAt: timestamp("returnedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RentalContract = typeof rentalContracts.$inferSelect;
export type InsertRentalContract = typeof rentalContracts.$inferInsert;

/**
 * Car damage marks table for rental contracts
 */
export const damageMarks = pgTable("damageMarks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contractId: integer("contractId").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  xPosition: decimal("xPosition", { precision: 5, scale: 2 }).notNull(),
  yPosition: decimal("yPosition", { precision: 5, scale: 2 }).notNull(),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DamageMark = typeof damageMarks.$inferSelect;
export type InsertDamageMark = typeof damageMarks.$inferInsert;

/**
 * Car makers table
 */
export const carMakers = pgTable("carMakers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  isCustom: boolean("isCustom").default(false).notNull(),
  userId: integer("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CarMaker = typeof carMakers.$inferSelect;
export type InsertCarMaker = typeof carMakers.$inferInsert;

/**
 * Car models/SKUs table
 */
export const carModels = pgTable("carModels", {
  id: serial("id").primaryKey(),
  makerId: integer("makerId").notNull().references(() => carMakers.id, { onDelete: "cascade" }),
  modelName: varchar("modelName", { length: 100 }).notNull(),
  year: integer("year"),
  isCustom: boolean("isCustom").default(false).notNull(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CarModel = typeof carModels.$inferSelect;
export type InsertCarModel = typeof carModels.$inferInsert;

/**
 * Company Settings table
 */
export const companySettings = pgTable("companySettings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  logo: text("logo"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  taxId: varchar("taxId", { length: 100 }),
  website: varchar("website", { length: 255 }),
  termsAndConditions: text("termsAndConditions"),
  exchangeRateLbpToUsd: decimal("exchangeRateLbpToUsd", { precision: 10, scale: 2 }).default("89700.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = typeof companySettings.$inferInsert;

/**
 * Invoices table for billing and payment tracking
 */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contractId: integer("contractId").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  invoiceDate: date("invoiceDate").notNull(),
  dueDate: date("dueDate").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paidAt: timestamp("paidAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Invoice line items table for itemized charges
 */
export const invoiceLineItems = pgTable("invoiceLineItems", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoiceId").notNull(),
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
 */
export const nationalities = pgTable("nationalities", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Nationality = typeof nationalities.$inferSelect;
export type InsertNationality = typeof nationalities.$inferInsert;

/**
 * Audit logs table for tracking admin actions
 */
export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  actorId: integer("actorId").notNull(),
  actorUsername: varchar("actorUsername", { length: 100 }).notNull(),
  actorRole: varchar("actorRole", { length: 20 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  targetUserId: integer("targetUserId"),
  targetUsername: varchar("targetUsername", { length: 100 }),
  details: text("details").notNull(),
  previousState: text("previousState"),
  newState: text("newState"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Vehicle images table
 */
export const vehicleImages = pgTable("vehicleImages", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicleId").notNull(),
  userId: integer("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageType: imageTypeEnum("imageType").notNull(),
  displayOrder: integer("displayOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VehicleImage = typeof vehicleImages.$inferSelect;
export type InsertVehicleImage = typeof vehicleImages.$inferInsert;

/**
 * Dashboard preferences table
 */
export const dashboardPreferences = pgTable("dashboardPreferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  widgetId: varchar("widgetId", { length: 100 }).notNull(),
  position: integer("position").notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  settings: text("settings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DashboardPreference = typeof dashboardPreferences.$inferSelect;
export type InsertDashboardPreference = typeof dashboardPreferences.$inferInsert;

/**
 * Contract amendments table
 */
export const contractAmendments = pgTable("contractAmendments", {
  id: serial("id").primaryKey(),
  contractId: integer("contractId").notNull(),
  userId: integer("userId").notNull(),
  amendmentType: amendmentTypeEnum("amendmentType").notNull(),
  amendmentReason: text("amendmentReason").notNull(),
  previousValues: text("previousValues").notNull(),
  newValues: text("newValues").notNull(),
  amountDifference: decimal("amountDifference", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractAmendment = typeof contractAmendments.$inferSelect;
export type InsertContractAmendment = typeof contractAmendments.$inferInsert;

/**
 * WhatsApp message templates table
 */
export const whatsappTemplates = pgTable("whatsappTemplates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  templateType: whatsappTemplateTypeEnum("templateType").notNull(),
  messageTemplate: text("messageTemplate").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = typeof whatsappTemplates.$inferInsert;

/**
 * Insurance policies table
 */
export const insurancePolicies = pgTable("insurancePolicies", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicleId").notNull(),
  userId: integer("userId").notNull(),
  policyNumber: varchar("policyNumber", { length: 100 }),
  insuranceProvider: varchar("insuranceProvider", { length: 200 }),
  policyStartDate: timestamp("policyStartDate").notNull(),
  policyEndDate: timestamp("policyEndDate").notNull(),
  annualPremium: decimal("annualPremium", { precision: 10, scale: 2 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type InsertInsurancePolicy = typeof insurancePolicies.$inferInsert;

/**
 * Subscription tiers table
 */
export const subscriptionTiers = pgTable("subscriptionTiers", {
  id: serial("id").primaryKey(),
  tierName: varchar("tierName", { length: 50 }).notNull().unique(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull(),
  maxVehicles: integer("maxVehicles"),
  maxClients: integer("maxClients"),
  maxUsers: integer("maxUsers"),
  features: json("features"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = typeof subscriptionTiers.$inferInsert;

/**
 * User subscriptions table
 */
export const userSubscriptions = pgTable("userSubscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  tierId: integer("tierId").notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  renewalDate: timestamp("renewalDate"),
  cancelledAt: timestamp("cancelledAt"),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Subscription audit log
 */
export const subscriptionAuditLog = pgTable("subscriptionAuditLog", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  previousTierId: integer("previousTierId"),
  newTierId: integer("newTierId").notNull(),
  action: subscriptionActionEnum("action").notNull(),
  reason: text("reason"),
  actorId: integer("actorId"),
  actorType: actorTypeEnum("actorType").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionAuditLog = typeof subscriptionAuditLog.$inferSelect;
export type InsertSubscriptionAuditLog = typeof subscriptionAuditLog.$inferInsert;

/**
 * Contract templates table
 */
export const contractTemplates = pgTable("contractTemplates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  templateName: varchar("templateName", { length: 255 }).notNull(),
  templateUrl: text("templateUrl").notNull(),
  templateType: contractTemplateTypeEnum("templateType").notNull(),
  templateWidth: integer("templateWidth").notNull(),
  templateHeight: integer("templateHeight").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type InsertContractTemplate = typeof contractTemplates.$inferInsert;

/**
 * Template fields table
 */
export const templateFields = pgTable("templateFields", {
  id: serial("id").primaryKey(),
  templateId: integer("templateId").notNull(),
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  fieldLabel: varchar("fieldLabel", { length: 200 }).notNull(),
  fieldType: fieldTypeEnum("fieldType").default("text").notNull(),
  positionX: integer("positionX").notNull(),
  positionY: integer("positionY").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  fontSize: integer("fontSize").default(12).notNull(),
  fontFamily: varchar("fontFamily", { length: 50 }).default("Arial").notNull(),
  textAlignment: textAlignmentEnum("textAlignment").default("left").notNull(),
  fontColor: varchar("fontColor", { length: 7 }).default("#000000").notNull(),
  isRequired: boolean("isRequired").default(false).notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TemplateField = typeof templateFields.$inferSelect;
export type InsertTemplateField = typeof templateFields.$inferInsert;

/**
 * Generated contracts table
 */
export const generatedContracts = pgTable("generatedContracts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  rentalContractId: integer("rentalContractId").notNull(),
  templateId: integer("templateId").notNull(),
  pdfUrl: text("pdfUrl").notNull(),
  pdfFileName: varchar("pdfFileName", { length: 255 }).notNull(),
  filledData: text("filledData"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedContract = typeof generatedContracts.$inferSelect;
export type InsertGeneratedContract = typeof generatedContracts.$inferInsert;

/**
 * Numbering counters table - tracks sequential numbers per user
 */
export const numberingCounters = pgTable("numberingCounters", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  lastContractNumber: integer("lastContractNumber").default(0).notNull(),
  lastInvoiceNumber: integer("lastInvoiceNumber").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NumberingCounter = typeof numberingCounters.$inferSelect;
export type InsertNumberingCounter = typeof numberingCounters.$inferInsert;

export const numberingAuditActionEnum = pgEnum("numberingAuditAction", ["generated", "migrated", "reset"]);
export const numberingTypeEnum = pgEnum("numberingType", ["contract", "invoice"]);

/**
 * Numbering audit log table
 */
export const numberingAudit = pgTable("numberingAudit", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  numberType: numberingTypeEnum("numberType").notNull(),
  action: numberingAuditActionEnum("action").notNull(),
  generatedNumber: varchar("generatedNumber", { length: 100 }).notNull(),
  sequentialNumber: integer("sequentialNumber").notNull(),
  relatedId: integer("relatedId"),
  previousNumber: integer("previousNumber"),
  newNumber: integer("newNumber"),
  reason: text("reason"),
  actorId: integer("actorId"),
  actorUsername: varchar("actorUsername", { length: 100 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NumberingAudit = typeof numberingAudit.$inferSelect;
export type InsertNumberingAudit = typeof numberingAudit.$inferInsert;
