import { getDb } from "./db";
import { vehicles, clients, rentalContracts, maintenanceRecords, invoices, invoiceLineItems, companyProfiles, damageMarks } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function seedDemoData(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const existingVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, userId)).limit(1);
  if (existingVehicles.length > 0) {
    console.log("[Demo] Data already exists for user", userId);
    return;
  }

  console.log("[Demo] Seeding data for user", userId);

  const vehicleData = [
    { userId, plateNumber: "ABC-1234", brand: "Toyota", model: "Camry", year: 2022, color: "Silver", category: "Midsize" as const, status: "Available" as const, dailyRate: "45.00", weeklyRate: "280.00", monthlyRate: "1000.00", mileage: 15000, purchaseCost: "25000.00", insuranceCost: "1200.00" },
    { userId, plateNumber: "XYZ-5678", brand: "Honda", model: "Civic", year: 2023, color: "Blue", category: "Compact" as const, status: "Rented" as const, dailyRate: "40.00", weeklyRate: "250.00", monthlyRate: "900.00", mileage: 8000, purchaseCost: "22000.00", insuranceCost: "1000.00" },
    { userId, plateNumber: "DEF-9012", brand: "Ford", model: "Explorer", year: 2021, color: "Black", category: "SUV" as const, status: "Available" as const, dailyRate: "65.00", weeklyRate: "400.00", monthlyRate: "1500.00", mileage: 25000, purchaseCost: "35000.00", insuranceCost: "1500.00" },
    { userId, plateNumber: "GHI-3456", brand: "Hyundai", model: "Elantra", year: 2023, color: "White", category: "Economy" as const, status: "Available" as const, dailyRate: "35.00", weeklyRate: "220.00", monthlyRate: "800.00", mileage: 5000, purchaseCost: "20000.00", insuranceCost: "900.00" },
    { userId, plateNumber: "JKL-7890", brand: "BMW", model: "5 Series", year: 2022, color: "Gray", category: "Luxury" as const, status: "Maintenance" as const, dailyRate: "95.00", weeklyRate: "600.00", monthlyRate: "2200.00", mileage: 18000, purchaseCost: "55000.00", insuranceCost: "2500.00" },
    { userId, plateNumber: "MNO-2345", brand: "Nissan", model: "Altima", year: 2022, color: "Red", category: "Midsize" as const, status: "Rented" as const, dailyRate: "42.00", weeklyRate: "260.00", monthlyRate: "950.00", mileage: 12000, purchaseCost: "24000.00", insuranceCost: "1100.00" },
    { userId, plateNumber: "PQR-6789", brand: "Chevrolet", model: "Malibu", year: 2021, color: "Blue", category: "Midsize" as const, status: "Available" as const, dailyRate: "43.00", weeklyRate: "270.00", monthlyRate: "980.00", mileage: 22000, purchaseCost: "23000.00", insuranceCost: "1050.00" },
    { userId, plateNumber: "STU-0123", brand: "Mazda", model: "CX-5", year: 2023, color: "Silver", category: "SUV" as const, status: "Available" as const, dailyRate: "55.00", weeklyRate: "350.00", monthlyRate: "1300.00", mileage: 7000, purchaseCost: "30000.00", insuranceCost: "1400.00" },
    { userId, plateNumber: "VWX-4567", brand: "Kia", model: "Optima", year: 2022, color: "Black", category: "Midsize" as const, status: "Available" as const, dailyRate: "41.00", weeklyRate: "255.00", monthlyRate: "920.00", mileage: 14000, purchaseCost: "23500.00", insuranceCost: "1080.00" },
    { userId, plateNumber: "YZA-8901", brand: "Mercedes-Benz", model: "C-Class", year: 2023, color: "White", category: "Luxury" as const, status: "Available" as const, dailyRate: "90.00", weeklyRate: "580.00", monthlyRate: "2100.00", mileage: 6000, purchaseCost: "50000.00", insuranceCost: "2300.00" },
  ];

  const createdVehicles: { id: number }[] = [];
  for (const vData of vehicleData) {
    const [row] = await db.insert(vehicles).values(vData).returning({ id: vehicles.id });
    createdVehicles.push(row);
  }

  const clientData = [
    { userId, name: "John Smith", nationality: "American", email: "john.smith@email.com", phone: "+1-555-0101", driverLicenseNumber: "DL123456", address: "123 Main St, New York, NY 10001" },
    { userId, name: "Sarah Johnson", nationality: "Canadian", email: "sarah.j@email.com", phone: "+1-555-0102", driverLicenseNumber: "DL789012", address: "456 Oak Ave, Toronto, ON M5H 2N2" },
    { userId, name: "Michael Brown", nationality: "British", email: "m.brown@email.com", phone: "+44-20-7123-4567", driverLicenseNumber: "DL345678", address: "789 High Street, London, UK SW1A 1AA" },
    { userId, name: "Emily Davis", nationality: "Australian", email: "emily.davis@email.com", phone: "+61-2-9876-5432", driverLicenseNumber: "DL901234", address: "321 Beach Rd, Sydney, NSW 2000" },
    { userId, name: "David Wilson", nationality: "American", email: "david.w@email.com", phone: "+1-555-0103", driverLicenseNumber: "DL567890", address: "654 Pine St, Los Angeles, CA 90001" },
    { userId, name: "Lisa Martinez", nationality: "Spanish", email: "lisa.m@email.com", phone: "+34-91-123-4567", driverLicenseNumber: "DL234567", address: "987 Plaza Mayor, Madrid, Spain 28013" },
  ];

  const createdClients: { id: number }[] = [];
  for (const cData of clientData) {
    const [row] = await db.insert(clients).values(cData).returning({ id: clients.id });
    createdClients.push(row);
  }

  const now = new Date();
  const contractData = [
    {
      userId,
      clientId: createdClients[0].id,
      clientName: "John Smith",
      clientPhone: "+1-555-0101",
      clientEmail: "john.smith@email.com",
      vehicleId: createdVehicles[1].id,
      rentalStartDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      rentalEndDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      rentalDays: 15,
      dailyRate: "40.00",
      totalAmount: "600.00",
      finalAmount: "600.00",
      contractNumber: `CNT-${Date.now()}-001`,
      status: "active" as const,
      pickupKm: 8000,
    },
    {
      userId,
      clientId: createdClients[1].id,
      clientName: "Sarah Johnson",
      clientPhone: "+1-555-0102",
      clientEmail: "sarah.j@email.com",
      vehicleId: createdVehicles[5].id,
      rentalStartDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      rentalEndDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      rentalDays: 7,
      dailyRate: "42.00",
      totalAmount: "294.00",
      finalAmount: "294.00",
      contractNumber: `CNT-${Date.now()}-002`,
      status: "active" as const,
      pickupKm: 12000,
    },
    {
      userId,
      clientId: createdClients[2].id,
      clientName: "Michael Brown",
      clientPhone: "+44-20-7123-4567",
      clientEmail: "m.brown@email.com",
      vehicleId: createdVehicles[0].id,
      rentalStartDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      rentalEndDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      rentalDays: 10,
      dailyRate: "45.00",
      totalAmount: "450.00",
      finalAmount: "450.00",
      contractNumber: `CNT-${Date.now()}-003`,
      status: "completed" as const,
      pickupKm: 14500,
      returnKm: 14800,
      returnedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      userId,
      clientId: createdClients[3].id,
      clientName: "Emily Davis",
      clientPhone: "+61-2-9876-5432",
      clientEmail: "emily.davis@email.com",
      vehicleId: createdVehicles[2].id,
      rentalStartDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
      rentalEndDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      rentalDays: 7,
      dailyRate: "65.00",
      totalAmount: "455.00",
      finalAmount: "455.00",
      contractNumber: `CNT-${Date.now()}-004`,
      status: "completed" as const,
      pickupKm: 24000,
      returnKm: 24350,
      returnedAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
    },
    {
      userId,
      clientId: createdClients[4].id,
      clientName: "David Wilson",
      clientPhone: "+1-555-0103",
      clientEmail: "david.w@email.com",
      vehicleId: createdVehicles[3].id,
      rentalStartDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      rentalEndDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      rentalDays: 7,
      dailyRate: "35.00",
      totalAmount: "245.00",
      finalAmount: "245.00",
      contractNumber: `CNT-${Date.now()}-005`,
      status: "active" as const,
      pickupKm: 5000,
    },
  ];

  const createdContracts: { id: number }[] = [];
  for (const contractInfo of contractData) {
    const [row] = await db.insert(rentalContracts).values(contractInfo).returning({ id: rentalContracts.id });
    createdContracts.push(row);
  }

  const maintenanceData = [
    { userId, vehicleId: createdVehicles[4].id, maintenanceType: "Routine" as const, description: "Regular oil change and filter replacement", cost: "120.00", performedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), performedBy: "AutoCare Center", mileageAtService: 18000 },
    { userId, vehicleId: createdVehicles[0].id, maintenanceType: "Oil Change" as const, description: "Oil and filter change", cost: "85.00", performedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), performedBy: "Quick Lube", mileageAtService: 14500 },
    { userId, vehicleId: createdVehicles[2].id, maintenanceType: "Brake Pads Change" as const, description: "Front brake pads replacement", cost: "280.00", performedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), performedBy: "Brake Masters", mileageAtService: 24000 },
    { userId, vehicleId: createdVehicles[1].id, maintenanceType: "Inspection" as const, description: "Annual safety inspection", cost: "50.00", performedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), performedBy: "State Inspection Center", mileageAtService: 7500 },
  ];

  for (const mData of maintenanceData) {
    await db.insert(maintenanceRecords).values(mData);
  }

  const invoiceData = [
    {
      userId,
      contractId: createdContracts[2].id,
      invoiceNumber: `INV-${Date.now()}-001`,
      invoiceDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: "450.00",
      taxAmount: "45.00",
      totalAmount: "495.00",
      paymentStatus: "paid" as const,
      paidAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
    },
    {
      userId,
      contractId: createdContracts[3].id,
      invoiceNumber: `INV-${Date.now()}-002`,
      invoiceDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: "455.00",
      taxAmount: "45.50",
      totalAmount: "500.50",
      paymentStatus: "paid" as const,
      paidAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000),
    },
    {
      userId,
      contractId: createdContracts[0].id,
      invoiceNumber: `INV-${Date.now()}-003`,
      invoiceDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: "600.00",
      taxAmount: "60.00",
      totalAmount: "660.00",
      paymentStatus: "pending" as const,
    },
  ];

  const createdInvoices: { id: number }[] = [];
  for (const invData of invoiceData) {
    const [row] = await db.insert(invoices).values(invData).returning({ id: invoices.id });
    createdInvoices.push(row);
  }

  const lineItemsData = [
    { invoiceId: createdInvoices[0].id, description: "Toyota Camry Rental (10 days)", quantity: "10", unitPrice: "45.00", amount: "450.00" },
    { invoiceId: createdInvoices[1].id, description: "Ford Explorer Rental (7 days)", quantity: "7", unitPrice: "65.00", amount: "455.00" },
    { invoiceId: createdInvoices[2].id, description: "Honda Civic Rental (15 days)", quantity: "15", unitPrice: "40.00", amount: "600.00" },
  ];

  for (const lineItem of lineItemsData) {
    await db.insert(invoiceLineItems).values(lineItem);
  }

  const existingProfile = await db.select().from(companyProfiles).where(eq(companyProfiles.userId, userId)).limit(1);
  if (existingProfile.length === 0) {
    await db.insert(companyProfiles).values({
      userId,
      companyName: "FleetMaster Demo Agency",
      registrationNumber: "REG-2024-001",
      taxId: "TAX-123456789",
      address: "123 Demo Boulevard",
      city: "New York",
      country: "United States",
      phone: "+1-555-0100",
      email: "demo@fleetmaster.com",
      localCurrencyCode: "USD",
      vatRate: "10.00",
      exchangeRate: "1.00",
      defaultCurrency: "USD",
    });
  }

  const overdueContract = {
    userId,
    clientId: createdClients[5].id,
    clientName: "Lisa Martinez",
    clientPhone: "+34-91-123-4567",
    clientEmail: "lisa.m@email.com",
    vehicleId: createdVehicles[6].id,
    rentalStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    rentalEndDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    rentalDays: 11,
    dailyRate: "43.00",
    totalAmount: "473.00",
    finalAmount: "473.00",
    contractNumber: `CNT-${Date.now()}-006`,
    status: "active" as const,
    pickupKm: 22000,
  };
  await db.insert(rentalContracts).values(overdueContract);

  await db.insert(damageMarks).values({
    userId,
    contractId: createdContracts[2].id,
    xPosition: "150.00",
    yPosition: "200.00",
    description: "Minor scratch on front bumper",
  });

  console.log("[Demo] Successfully seeded demo data for user", userId);
}
