import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Simple login: username "Mo" (case-insensitive), password "mo"
        if (input.username.toLowerCase() === 'mo' && input.password === 'mo') {
          // Create a simple session cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, 'simple-session-mo', {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
          return {
            success: true,
            user: {
              id: 1,
              name: 'Mo',
              email: 'mo@rental.os',
            },
          };
        }
        throw new Error('Invalid username or password');
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Fleet Management Router
  fleet: router({
    list: publicProcedure.query(async () => {
      return await db.getAllVehicles();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getVehicleById(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        plateNumber: z.string().min(1).max(20),
        brand: z.string().min(1).max(100),
        model: z.string().min(1).max(100),
        year: z.number().int().min(1900).max(2100),
        color: z.string().min(1).max(50),
        category: z.enum(["Economy", "Compact", "Midsize", "SUV", "Luxury", "Van", "Truck"]),
        status: z.enum(["Available", "Rented", "Maintenance", "Out of Service"]).default("Available"),
        dailyRate: z.string(),
        weeklyRate: z.string().optional(),
        monthlyRate: z.string().optional(),
        mileage: z.number().int().optional(),
        vin: z.string().max(17).optional(),
        insurancePolicyNumber: z.string().max(100).optional(),
        insuranceCost: z.string().optional(),
        insuranceExpiryDate: z.date().optional(),
        registrationExpiryDate: z.date().optional(),
        photoUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createVehicle(input);
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          plateNumber: z.string().min(1).max(20).optional(),
          brand: z.string().min(1).max(100).optional(),
          model: z.string().min(1).max(100).optional(),
          year: z.number().int().min(1900).max(2100).optional(),
          color: z.string().min(1).max(50).optional(),
          category: z.enum(["Economy", "Compact", "Midsize", "SUV", "Luxury", "Van", "Truck"]).optional(),
          status: z.enum(["Available", "Rented", "Maintenance", "Out of Service"]).optional(),
          dailyRate: z.string().optional(),
          weeklyRate: z.string().optional(),
          monthlyRate: z.string().optional(),
          mileage: z.number().int().optional(),
          vin: z.string().max(17).optional(),
          insurancePolicyNumber: z.string().max(100).optional(),
          insuranceCost: z.string().optional(),
          insuranceExpiryDate: z.date().optional(),
          registrationExpiryDate: z.date().optional(),
          photoUrl: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateVehicle(input.id, input.data);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVehicle(input.id);
        return { success: true };
      }),
    
    getMaintenanceRecords: publicProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMaintenanceRecordsByVehicleId(input.vehicleId);
      }),
    
    addMaintenanceRecord: publicProcedure
      .input(z.object({
        vehicleId: z.number(),
        maintenanceType: z.enum(["Routine", "Repair", "Inspection", "Emergency", "Oil Change", "Brake Pads Change", "Oil + Filter"]),
        description: z.string().min(1),
        cost: z.string().optional(),
        performedAt: z.date(),
        performedBy: z.string().max(200).optional(),
        garageLocation: z.string().max(300).optional(),
        mileageAtService: z.number().int().optional(),
        kmDueMaintenance: z.number().int().optional(),
        garageEntryDate: z.date().optional(),
        garageExitDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createMaintenanceRecord(input);
      }),
  }),

  // Rental Contracts Router
  contracts: router({
    list: publicProcedure.query(async () => {
      return await db.getAllRentalContracts();
    }),
    
    updateOverdueContracts: publicProcedure.mutation(async () => {
      // Update contracts that are active but have passed their return date
      return await db.updateOverdueContracts();
    }),
    
    getOverdueStatistics: publicProcedure.query(async () => {
      return await db.getOverdueStatistics();
    }),
    
    listByStatus: publicProcedure
      .input(z.object({ status: z.enum(["active", "completed", "overdue"]).optional() }))
      .query(async ({ input }) => {
        return await db.getRentalContractsByStatus(input.status);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getRentalContractById(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        vehicleId: z.number(),
        clientFirstName: z.string().min(1).max(100),
        clientLastName: z.string().min(1).max(100),
        clientNationality: z.string().max(100).optional(),
        clientPhone: z.string().max(20).optional(),
        clientAddress: z.string().optional(),
        drivingLicenseNumber: z.string().min(1).max(100),
        licenseIssueDate: z.date().optional(),
        licenseExpiryDate: z.date(),
        rentalStartDate: z.date(),
        rentalEndDate: z.date(),
        rentalDays: z.number().int().positive(),
        dailyRate: z.string(),
        totalAmount: z.string(),
        discount: z.string().optional(),
        finalAmount: z.string(),
        signatureData: z.string().optional(),
        fuelLevel: z.enum(["Empty", "1/4", "1/2", "3/4", "Full"]).optional(),
        pickupKm: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if vehicle already has an active contract
        const activeContracts = await db.getActiveContractsByVehicleId(input.vehicleId);
        if (activeContracts && activeContracts.length > 0) {
          throw new Error(`Vehicle is already rented. Active contract exists until ${new Date(activeContracts[0].rentalEndDate).toLocaleDateString()}.`);
        }
        
        // Check if client exists by license number
        let client = await db.getClientByLicenseNumber(input.drivingLicenseNumber);
        
        // If client doesn't exist, create new client record
        if (!client) {
          client = await db.createClient({
            firstName: input.clientFirstName,
            lastName: input.clientLastName,
            nationality: input.clientNationality,
            phone: input.clientPhone,
            address: input.clientAddress,
            drivingLicenseNumber: input.drivingLicenseNumber,
            licenseIssueDate: input.licenseIssueDate,
            licenseExpiryDate: input.licenseExpiryDate,
          });
        }
        
        // Create contract with client ID
        // Pass null for optional fields so Drizzle inserts NULL
        // Generate sequential contract number
        const existingContracts = await db.getAllRentalContracts();
        const maxNumber = existingContracts.reduce((max, contract) => {
          const match = contract.contractNumber.match(/CTR-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
          }
          return max;
        }, 0);
        const nextNumber = maxNumber + 1;
        const contractNumber = `CTR-${String(nextNumber).padStart(3, '0')}`;
        
        return await db.createRentalContract({
          vehicleId: input.vehicleId,
          clientId: client.id,
          clientFirstName: input.clientFirstName,
          clientLastName: input.clientLastName,
          clientNationality: input.clientNationality || null,
          clientPhone: input.clientPhone || null,
          clientAddress: input.clientAddress || null,
          drivingLicenseNumber: input.drivingLicenseNumber,
          licenseExpiryDate: input.licenseExpiryDate,
          rentalStartDate: input.rentalStartDate,
          rentalEndDate: input.rentalEndDate,
          rentalDays: input.rentalDays,
          dailyRate: input.dailyRate,
          totalAmount: input.totalAmount,
          discount: input.discount || "0.00",
          finalAmount: input.finalAmount,
          contractNumber,
          signatureData: input.signatureData || null,
          fuelLevel: input.fuelLevel || "Full",
        });
      }),
    
    getDamageMarks: publicProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDamageMarksByContractId(input.contractId);
      }),
    
    addDamageMark: publicProcedure
      .input(z.object({
        contractId: z.number(),
        xPosition: z.string(),
        yPosition: z.string(),
        description: z.string().max(500).optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createDamageMark(input);
      }),
    
    renew: publicProcedure
      .input(z.object({
        contractId: z.number(),
        additionalDays: z.number().int().positive(),
        newEndDate: z.date(),
      }))
      .mutation(async ({ input }) => {
        return await db.renewRentalContract(input);
      }),
    
    markAsReturned: publicProcedure
      .input(z.object({ 
        contractId: z.number(),
        returnKm: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        return await db.markContractAsReturned(input.contractId, input.returnKm);
      }),
    
    delete: publicProcedure
      .input(z.object({ contractId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteRentalContract(input.contractId);
      }),
    
    updateStatus: publicProcedure
      .input(z.object({
        contractId: z.number(),
        status: z.enum(["active", "completed", "overdue"]),
      }))
      .mutation(async ({ input }) => {
        return await db.updateContractStatus(input.contractId, input.status);
      }),
    
    bulkUpdateStatus: publicProcedure
      .input(z.object({
        contractIds: z.array(z.number()),
        status: z.enum(["active", "completed", "overdue"]),
      }))
      .mutation(async ({ input }) => {
        return await db.bulkUpdateContractStatus(input.contractIds, input.status);
      }),
  }),

  // Client Management Router
  clients: router({
    list: publicProcedure.query(async () => {
      return await db.getAllClients();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getClientById(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        nationality: z.string().max(100).optional(),
        phone: z.string().max(20).optional(),
        address: z.string().optional(),
        drivingLicenseNumber: z.string().min(1).max(100),
        licenseIssueDate: z.date().optional(),
        licenseExpiryDate: z.date(),
        email: z.string().email().max(320).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createClient(input);
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        nationality: z.string().max(100).optional(),
        phone: z.string().max(20).optional(),
        address: z.string().optional(),
        drivingLicenseNumber: z.string().max(100).optional(),
        licenseIssueDate: z.date().optional(),
        licenseExpiryDate: z.date().optional(),
        email: z.string().email().max(320).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return await db.updateClient(id, updates);
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteClient(input.id);
        return { success: true };
      }),
    
    getByLicenseNumber: publicProcedure
      .input(z.object({ licenseNumber: z.string() }))
      .query(async ({ input }) => {
        return await db.getClientByLicenseNumber(input.licenseNumber);
      }),
    
    getContracts: publicProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRentalContractsByClientId(input.clientId);
      }),
  }),

  // Profitability Analytics Router
  analytics: router({
    vehicleProfitability: publicProcedure.query(async () => {
      return await db.getVehicleProfitabilityAnalytics();
    }),
    
    vehicleFinancialDetails: publicProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVehicleFinancialDetails(input.vehicleId);
      }),
  }),

  // Export Router
  export: router({
    profitabilityExcel: publicProcedure.query(async ({ ctx }) => {
      const XLSX = await import('xlsx');
      const vehicles = await db.getVehicleProfitabilityAnalytics();
      
      // Prepare data for Excel
      const data = vehicles.map((v: any) => ({
        'Plate Number': v.plateNumber,
        'Brand': v.brand,
        'Model': v.model,
        'Year': v.year,
        'Total Revenue': `$${v.totalRevenue.toFixed(2)}`,
        'Maintenance Cost': `$${v.totalMaintenanceCost.toFixed(2)}`,
        'Insurance Cost': `$${v.insuranceCost.toFixed(2)}`,
        'Net Profit': `$${v.netProfit.toFixed(2)}`,
        'Profit Margin': `${v.profitMargin.toFixed(1)}%`,
        'Number of Rentals': v.rentalCount
      }));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Plate Number
        { wch: 12 }, // Brand
        { wch: 12 }, // Model
        { wch: 6 },  // Year
        { wch: 15 }, // Total Revenue
        { wch: 18 }, // Maintenance Cost
        { wch: 15 }, // Insurance Cost
        { wch: 12 }, // Net Profit
        { wch: 14 }, // Profit Margin
        { wch: 18 }  // Number of Rentals
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Profitability Report');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Set response headers
      ctx.res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      ctx.res.setHeader('Content-Disposition', `attachment; filename="profitability-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
      ctx.res.send(buffer);
      
      return { success: true };
    }),
    
    profitabilityPDF: publicProcedure.query(async ({ ctx }) => {
      const PDFDocument = (await import('pdfkit')).default;
      const vehicles = await db.getVehicleProfitabilityAnalytics();
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Set response headers
      ctx.res.setHeader('Content-Type', 'application/pdf');
      ctx.res.setHeader('Content-Disposition', `attachment; filename="profitability-report-${new Date().toISOString().split('T')[0]}.pdf"`);
      
      // Pipe PDF to response
      doc.pipe(ctx.res);
      
      // Add title
      doc.fontSize(20).text('Vehicle Profitability Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);
      
      // Calculate totals
      const totals = vehicles.reduce((acc: { revenue: number; maintenance: number; insurance: number; profit: number }, v: any) => ({
        revenue: acc.revenue + v.totalRevenue,
        maintenance: acc.maintenance + v.totalMaintenanceCost,
        insurance: acc.insurance + v.insuranceCost,
        profit: acc.profit + v.netProfit
      }), { revenue: 0, maintenance: 0, insurance: 0, profit: 0 });
      
      // Add summary section
      doc.fontSize(14).text('Fleet Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Total Revenue: $${totals.revenue.toFixed(2)}`);
      doc.text(`Total Maintenance: $${totals.maintenance.toFixed(2)}`);
      doc.text(`Total Insurance: $${totals.insurance.toFixed(2)}`);
      doc.text(`Net Profit: $${totals.profit.toFixed(2)}`);
      doc.text(`Profit Margin: ${((totals.profit / totals.revenue) * 100).toFixed(1)}%`);
      doc.moveDown(2);
      
      // Add vehicle details table
      doc.fontSize(14).text('Vehicle Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9);
      
      // Table header
      const tableTop = doc.y;
      doc.text('Vehicle', 50, tableTop, { width: 100 });
      doc.text('Revenue', 150, tableTop, { width: 70, align: 'right' });
      doc.text('Maintenance', 220, tableTop, { width: 70, align: 'right' });
      doc.text('Insurance', 290, tableTop, { width: 70, align: 'right' });
      doc.text('Net Profit', 360, tableTop, { width: 70, align: 'right' });
      doc.text('Margin', 430, tableTop, { width: 60, align: 'right' });
      doc.text('Rentals', 490, tableTop, { width: 50, align: 'right' });
      
      doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();
      doc.moveDown(0.5);
      
      // Table rows
      vehicles.forEach((v: any, i: number) => {
        const y = doc.y;
        
        // Check if we need a new page
        if (y > 700) {
          doc.addPage();
          doc.fontSize(9);
        }
        
        doc.text(`${v.plateNumber} (${v.brand} ${v.model})`, 50, doc.y, { width: 100 });
        doc.text(`$${v.totalRevenue.toFixed(2)}`, 150, y, { width: 70, align: 'right' });
        doc.text(`$${v.totalMaintenanceCost.toFixed(2)}`, 220, y, { width: 70, align: 'right' });
        doc.text(`$${v.insuranceCost.toFixed(2)}`, 290, y, { width: 70, align: 'right' });
        doc.text(`$${v.netProfit.toFixed(2)}`, 360, y, { width: 70, align: 'right' });
        doc.text(`${v.profitMargin.toFixed(1)}%`, 430, y, { width: 60, align: 'right' });
        doc.text(`${v.rentalCount}`, 490, y, { width: 50, align: 'right' });
        
        doc.moveDown(0.5);
      });
      
      // Finalize PDF
      doc.end();
      
      return { success: true };
    })
  }),
});

export type AppRouter = typeof appRouter;
