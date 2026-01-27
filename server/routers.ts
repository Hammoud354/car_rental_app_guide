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
        maintenanceType: z.enum(["Routine", "Repair", "Inspection", "Emergency"]),
        description: z.string().min(1),
        cost: z.string().optional(),
        performedAt: z.date(),
        performedBy: z.string().max(200).optional(),
        garageLocation: z.string().max(300).optional(),
        mileageAtService: z.number().int().optional(),
        kmDueMaintenance: z.number().int().optional(),
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
        drivingLicenseNumber: z.string().min(1).max(100),
        licenseIssueDate: z.date().optional(),
        licenseExpiryDate: z.date(),
        rentalStartDate: z.date(),
        rentalEndDate: z.date(),
        signatureData: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createRentalContract(input);
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
  }),
});

export type AppRouter = typeof appRouter;
