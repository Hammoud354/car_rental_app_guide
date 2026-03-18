import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, superAdminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { sql } from "drizzle-orm";
import {
  getNextContractNumber,
  getNextInvoiceNumber,
  migrateContractNumber,
  migrateInvoiceNumber,
  getNumberingStatus,
  getNumberingAuditTrail,
} from "./numbering";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
        rememberMe: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const bcrypt = await import('bcrypt');
        
        // Convert username to lowercase for case-insensitive comparison
        const usernameLower = input.username.toLowerCase();
        
        // Find user by username (case-insensitive)
        const user = await db.getUserByUsername(usernameLower);
        if (!user) {
          throw new Error('Invalid username or password');
        }

        // Verify password with bcrypt
        if (!user.password) {
          throw new Error('Invalid username or password');
        }
        const isValidPassword = await bcrypt.compare(input.password, user.password);
        if (!isValidPassword) {
          throw new Error('Invalid username or password');
        }

        // Create session cookie with appropriate expiration
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const maxAge = input.rememberMe 
          ? 30 * 24 * 60 * 60 * 1000  // 30 days if remember me is checked
          : 7 * 24 * 60 * 60 * 1000;   // 7 days otherwise
        
        ctx.res.cookie(COOKIE_NAME, `user-${user.id}`, {
          ...cookieOptions,
          maxAge,
        });

        // Auto-create company profile with country settings if it doesn't exist
        try {
          const existingProfile = await db.getCompanyProfile(user.id);
          if (!existingProfile && user.country) {
            const { getCountryData, countries } = await import("@shared/countries");
            const { COUNTRY_FINANCIAL_SETTINGS } = await import("@shared/vatRates");
            
            const countryCode = user.country;
            const countryData = getCountryData(countryCode);
            const countryEntry = countries.find(c => c.code === countryCode);
            const countryName = countryEntry?.name || countryData?.name || countryCode;
            const currencyCode = countryData?.currencyCode || "USD";
            const vatRate = countryData?.vatRate ?? COUNTRY_FINANCIAL_SETTINGS[countryName]?.vatRate ?? 0;
            const exchangeRate = COUNTRY_FINANCIAL_SETTINGS[countryName]?.exchangeRate ?? 1;
            
            await db.upsertCompanyProfile({
              userId: user.id,
              companyName: user.name || "My Company",
              country: countryName,
              phone: user.phone || undefined,
              email: user.email || undefined,
              localCurrencyCode: currencyCode,
              vatRate: vatRate,
              exchangeRate: exchangeRate,
              defaultCurrency: currencyCode === "USD" ? "USD" : "LOCAL",
            });
          }
        } catch (err) {
          console.error("[login] Failed to auto-create company profile:", err);
        }

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
          },
        };
      }),
    signUp: publicProcedure
      .input(z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string(),
        country: z.string(),
        countryName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const bcrypt = await import('bcrypt');
        
        const usernameLower = input.username.toLowerCase().trim();
        const emailLower = input.email.toLowerCase().trim();
        
        const existingUser = await db.getUserByUsername(usernameLower);
        if (existingUser) {
          throw new Error('Username already exists');
        }

        const existingEmail = await db.getUserByEmail(emailLower);
        if (existingEmail) {
          throw new Error('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);

        let newUser;
        try {
          newUser = await db.createUser({
            username: usernameLower,
            password: hashedPassword,
            name: input.name.trim(),
            email: emailLower,
            phone: input.phone.trim(),
            country: input.country,
          });
        } catch (error: any) {
          if (error.message?.includes('unique') || error.code === '23505') {
            throw new Error('Username or email already exists');
          }
          console.error('User creation failed:', error);
          throw new Error('Failed to create account. Please try again.');
        }

        try {
          await db.populateCarMakersForCountry(input.country, newUser.id);
        } catch (error) {
          console.error('Failed to populate car makers:', error);
        }

        return {
          success: true,
          user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    loginDemo: publicProcedure.mutation(async ({ ctx }) => {
      const { seedDemoData } = await import('./seedDemoData');
      
      // Find or create demo user
      let demoUser = await db.getUserByUsername('demo@system');
      
      if (!demoUser) {
        // Create demo user if it doesn't exist
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash('demo123', 10);
        
        demoUser = await db.createUser({
          username: 'demo@system',
          password: hashedPassword,
          name: 'Demo User',
          email: 'demo@fleetmaster.com',
          phone: '+1-555-0100',
          country: 'US',
        });
      }
      
      // Always ensure demo data exists
      await seedDemoData(demoUser.id);
      
      // Create session cookie with 10-minute expiration
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, `user-${demoUser.id}`, {
        ...cookieOptions,
        maxAge: 10 * 60 * 1000, // 10 minutes
      });
      
      return {
        success: true,
        user: {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          username: demoUser.username,
        },
      };
    }),
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const crypto = await import('crypto');
        
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if email exists or not for security
          return { success: true, message: 'If the email exists, a reset link will be sent' };
        }

        // Generate secure random token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Token expires in 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        // Save token to database
        await db.createPasswordResetToken(user.id, token, expiresAt);
        
        // TODO: Send email with reset link
        // For now, we'll just log it (in production, use nodemailer or notification API)
        const resetLink = `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        console.log(`[Password Reset] Reset link for ${user.email}: ${resetLink}`);
        
        return { success: true, message: 'If the email exists, a reset link will be sent', token };
      }),
    verifyResetToken: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .query(async ({ input }) => {
        const resetToken = await db.getPasswordResetToken(input.token);
        
        if (!resetToken) {
          throw new Error('Invalid or expired reset token');
        }
        
        if (resetToken.used) {
          throw new Error('This reset token has already been used');
        }
        
        if (new Date() > new Date(resetToken.expiresAt)) {
          throw new Error('This reset token has expired');
        }
        
        return { valid: true };
      }),
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const bcrypt = await import('bcryptjs');
        
        // Verify token
        const resetToken = await db.getPasswordResetToken(input.token);
        
        if (!resetToken) {
          throw new Error('Invalid or expired reset token');
        }
        
        if (resetToken.used) {
          throw new Error('This reset token has already been used');
        }
        
        if (new Date() > new Date(resetToken.expiresAt)) {
          throw new Error('This reset token has expired');
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        
        // Update user password
        await db.updateUserPassword(resetToken.userId, hashedPassword);
        
        // Mark token as used
        await db.markTokenAsUsed(resetToken.id);
        
        return { success: true, message: 'Password has been reset successfully' };
      }),
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new Error("User not found");
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        role: user.role,
        createdAt: user.createdAt,
        lastSignedIn: user.lastSignedIn,
      };
    }),
    updateMyProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string(),
        country: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const emailLower = input.email.toLowerCase().trim();

        const existingEmail = await db.getUserByEmail(emailLower);
        if (existingEmail && existingEmail.id !== ctx.user.id) {
          throw new Error("Email already used by another account");
        }

        await db.updateUser(ctx.user.id, {
          name: input.name.trim(),
          email: emailLower,
          phone: input.phone.trim(),
          country: input.country,
        });

        return { success: true };
      }),
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const bcrypt = await import('bcrypt');

        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.password) throw new Error("User not found");

        const isValid = await bcrypt.compare(input.currentPassword, user.password);
        if (!isValid) {
          throw new Error("Current password is incorrect");
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPassword(ctx.user.id, hashedPassword);

        return { success: true };
      }),
  }),

  // Fleet Management Router
  fleet: router({
    list: publicProcedure
      .input(z.object({ filterUserId: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        // Super Admin can filter by specific user, otherwise show own vehicles
        const targetUserId = input?.filterUserId || ctx.user?.id || 1;
        return await db.getAllVehicles(targetUserId, input?.filterUserId);
      }),
    
    getVehicleCount: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user?.id || 1;
        const database = await db.getDb();
        if (!database) return 0;
        const result = await database.execute(
          sql`SELECT COUNT(*) as count FROM vehicles WHERE "userId" = ${userId}`
        ) as any;
        const rows = result?.rows || (Array.isArray(result) && result[0]) || [];
        return rows.length > 0 ? Number(rows[0].count) : 0;
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getVehicleById(input.id, ctx.user?.id || 1);
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
        insuranceProvider: z.string().max(200).optional(),
        insurancePolicyStartDate: z.date().optional(),
        insuranceExpiryDate: z.date().optional(),
        insuranceAnnualPremium: z.string().optional(),
        insuranceCost: z.string().optional(), // Legacy field
        purchaseCost: z.string().optional(),
        registrationExpiryDate: z.date().optional(),
        nextMaintenanceDate: z.date().optional(),
        photoUrl: z.string().optional(),
        notes: z.string().optional(),
        targetUserId: z.number().optional(), // For Super Admin to assign vehicle to specific user
        // AI Maintenance fields
        engineType: z.string().optional(),
        transmissionType: z.string().optional(),
        fuelType: z.string().optional(),
        purchaseDate: z.date().optional(),
        averageDailyKm: z.number().int().optional(),
        primaryUse: z.string().optional(),
        operatingClimate: z.string().optional(),
        lastServiceDate: z.date().optional(),
        serviceHistory: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const isAdmin = await db.isSuperAdmin(ctx.user?.id || 1);
        
        // Super Admin must provide targetUserId, regular users use their own ID
        let userId: number;
        // Super Admin can create vehicles for themselves (default) or for selected user
        if (isAdmin && input.targetUserId && input.targetUserId !== 0) {
          userId = input.targetUserId; // Creating for another user
        } else {
          userId = ctx.user?.id || 1; // Creating for themselves
        }
        
        // Check subscription vehicle limit
        const vehicleLimit = await db.checkSubscriptionLimit(userId, "vehicles");
        if (!vehicleLimit.allowed) {
          const subscription = await db.getUserSubscription(userId);
          const tierName = subscription?.tier.displayName || "your plan";
          throw new Error(`Vehicle limit reached: You have ${vehicleLimit.current} vehicles but ${tierName} plan allows only ${vehicleLimit.limit}. Please upgrade your subscription to add more vehicles.`);
        }
        
        const { targetUserId: _, ...vehicleData } = input;
        return await db.createVehicle({ ...vehicleData, userId });
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
          insuranceProvider: z.string().max(200).optional(),
          insurancePolicyStartDate: z.date().optional(),
          insuranceExpiryDate: z.date().optional(),
          registrationExpiryDate: z.date().optional(),
          insuranceAnnualPremium: z.string().optional(),
          insuranceCost: z.string().optional(),
          purchaseCost: z.string().optional(),
          photoUrl: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateVehicle(input.id, ctx.user?.id || 1, input.data);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteVehicle(input.id, ctx.user?.id || 1);
        return { success: true };
      }),
    
    getMaintenanceRecords: publicProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getMaintenanceRecordsByVehicleId(input.vehicleId, ctx.user?.id || 1);
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
        markInMaintenance: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createMaintenanceRecord({ ...input, userId: ctx.user?.id || 1 });
      }),

    deleteMaintenanceRecord: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.deleteMaintenanceRecord(input.id, ctx.user?.id || 1);
      }),

    updateMaintenanceRecord: publicProcedure
      .input(z.object({
        id: z.number(),
        maintenanceType: z.enum(["Routine", "Repair", "Inspection", "Emergency", "Oil Change", "Brake Pads Change", "Oil + Filter"]).optional(),
        description: z.string().min(1).optional(),
        cost: z.string().optional(),
        performedAt: z.date().optional(),
        performedBy: z.string().optional(),
        garageLocation: z.string().optional(),
        mileageAtService: z.number().optional(),
        kmDueForNextMaintenance: z.number().optional(),
        garageEntryDate: z.date().optional(),
        garageExitDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        return await db.updateMaintenanceRecord(id, ctx.user?.id || 1, updates);
      }),

    getAnalysis: publicProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getVehicleAnalysis(input.vehicleId, ctx.user?.id || 1);
      }),
    
    getLastReturnKm: publicProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getLastReturnKm(input.vehicleId, ctx.user?.id || 1);
      }),

    sendToMaintenance: publicProcedure
      .input(z.object({ vehicleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.sendVehicleToMaintenance(input.vehicleId, ctx.user?.id || 1);
      }),

    removeFromMaintenance: publicProcedure
      .input(z.object({ vehicleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.removeVehicleFromMaintenance(input.vehicleId, ctx.user?.id || 1);
      }),

    listAvailableForMaintenance: publicProcedure
      .input(z.object({ filterUserId: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const targetUserId = input?.filterUserId || ctx.user?.id || 1;
        return await db.getAvailableVehiclesForMaintenance(targetUserId, input?.filterUserId);
      }),

    // Vehicle Images
    addImage: publicProcedure
      .input(z.object({
        vehicleId: z.number(),
        imageUrl: z.string(),
        imageType: z.enum(["exterior", "interior"]),
        displayOrder: z.number().int().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.addVehicleImage({ ...input, userId: ctx.user?.id || 1 });
      }),

    getImages: publicProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getVehicleImages(input.vehicleId, ctx.user?.id || 1);
      }),

    getImagesByType: publicProcedure
      .input(z.object({ 
        vehicleId: z.number(),
        imageType: z.enum(["exterior", "interior"]),
      }))
      .query(async ({ input, ctx }) => {
        return await db.getVehicleImagesByType(input.vehicleId, ctx.user?.id || 1, input.imageType);
      }),

    deleteImage: publicProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteVehicleImage(input.imageId, ctx.user?.id || 1);
        return { success: true };
      }),

    updateImageOrder: publicProcedure
      .input(z.object({ 
        imageId: z.number(),
        displayOrder: z.number().int(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateImageDisplayOrder(input.imageId, ctx.user?.id || 1, input.displayOrder);
        return { success: true };
      }),

    updateMaintenanceSchedule: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        nextMaintenanceDate: z.date().optional(),
        nextMaintenanceKm: z.number().optional(),
        maintenanceIntervalKm: z.number(),
        maintenanceIntervalMonths: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.updateVehicleMaintenanceSchedule(
          input.vehicleId,
          ctx.user.id,
          input.nextMaintenanceDate,
          input.nextMaintenanceKm,
          input.maintenanceIntervalKm,
          input.maintenanceIntervalMonths
        );
      }),

    checkMaintenanceAlerts: protectedProcedure.query(async ({ ctx }) => {
      const { checkMaintenanceDue, generateMaintenanceAlertMessage, getCompanyPhoneNumber } = await import("./maintenanceAlerts");
      const alerts = await checkMaintenanceDue(ctx.user.id);
      const companyPhone = await getCompanyPhoneNumber(ctx.user.id);
      const message = generateMaintenanceAlertMessage(alerts);
      return { alerts, message, companyPhone };
    }),

    sendMaintenanceAlertWhatsApp: protectedProcedure.mutation(async ({ ctx }) => {
      const { checkMaintenanceDue, generateMaintenanceAlertMessage, getCompanyPhoneNumber } = await import("./maintenanceAlerts");
      const alerts = await checkMaintenanceDue(ctx.user.id);
      
      if (alerts.length === 0) {
        return { success: false, message: "No maintenance alerts to send" };
      }

      const companyPhone = await getCompanyPhoneNumber(ctx.user.id);
      if (!companyPhone) {
        throw new Error("Company phone number not set in settings");
      }

      const message = generateMaintenanceAlertMessage(alerts);
      
      // Format phone number for WhatsApp
      const phoneNumber = companyPhone.replace(/[\s\-\(\)]/g, "");
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      return { success: true, whatsappUrl, alertCount: alerts.length };
    }),

    // Insurance Tracking
    getExpiringInsurance: protectedProcedure
      .input(z.object({ daysThreshold: z.number().default(30) }))
      .query(async ({ input, ctx }) => {
        return await db.getVehiclesWithExpiringInsurance(ctx.user.id, input.daysThreshold);
      }),

    getExpiredInsurance: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getVehiclesWithExpiredInsurance(ctx.user.id);
      }),

    renewInsurance: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        newPolicyStartDate: z.date(),
        newAnnualPremium: z.string(),
        insuranceProvider: z.string().optional(),
        policyNumber: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Calculate new expiry date (1 year from start date)
        const expiryDate = new Date(input.newPolicyStartDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        return await db.renewVehicleInsurance(
          input.vehicleId,
          ctx.user.id,
          input.newPolicyStartDate,
          expiryDate,
          input.newAnnualPremium,
          input.insuranceProvider,
          input.policyNumber
        );
      }),
  }),

  // Rental Contracts Router
  contracts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllRentalContracts(ctx.user.id, ctx.filterUserId);
    }),
    
    updateOverdueContracts: publicProcedure.mutation(async () => {
      // Update contracts that are active but have passed their return date
      return await db.updateOverdueContracts();
    }),
    
    getOverdueStatistics: protectedProcedure
      .input(z.object({ filterUserId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
      return await db.getOverdueStatistics(ctx.user.id, input?.filterUserId);
    }),
    
    getExpiring: protectedProcedure
      .input(z.object({ 
        daysAhead: z.number().int().positive().default(3),
        filterUserId: z.number().optional() 
      }).optional())
      .query(async ({ ctx, input }) => {
        const daysAhead = input?.daysAhead || 3;
        return await db.getExpiringContracts(ctx.user.id, daysAhead, input?.filterUserId);
      }),
    
    getDashboardStatistics: protectedProcedure
      .input(z.object({ filterUserId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
      const contracts = await db.getAllRentalContracts(ctx.user.id, input?.filterUserId);
      
      // Calculate actual revenue from all contracts
      const totalRevenue = contracts.reduce((sum, contract) => {
        return sum + (parseFloat(contract.finalAmount) || 0);
      }, 0);
      
      // Count active contracts
      const activeContracts = contracts.filter(c => c.status === 'active').length;
      
      // Count completed contracts
      const completedContracts = contracts.filter(c => c.status === 'completed').length;
      
      // Calculate revenue this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const revenueThisMonth = contracts
        .filter(c => new Date(c.rentalStartDate) >= firstDayOfMonth)
        .reduce((sum, contract) => sum + (parseFloat(contract.finalAmount) || 0), 0);
      
      return {
        totalRevenue,
        activeContracts,
        completedContracts,
        revenueThisMonth,
        totalContracts: contracts.length,
      };
    }),
    
    listByStatus: protectedProcedure
      .input(z.object({ 
        status: z.enum(["active", "completed", "overdue"]).optional(),
        filterUserId: z.number().optional() 
      }))
      .query(async ({ ctx, input }) => {
        return await db.getRentalContractsByStatus(ctx.user.id, input.status, input.filterUserId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
      return await db.getRentalContractById(input.id, ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        clientFirstName: z.string().min(1).max(100),
        clientLastName: z.string().max(100).optional(),
        clientNationality: z.string().max(100).optional(),
        clientPhone: z.string().max(20).optional(),
        clientAddress: z.string().optional(),
        drivingLicenseNumber: z.string().min(1).max(100),
        licenseIssueDate: z.date().optional(),
        licenseExpiryDate: z.date(),
        rentalStartDate: z.date(),
        rentalEndDate: z.date(),
        rentalDays: z.number().int().positive(),
        pickupTime: z.string().optional(),
        returnTime: z.string().optional(),
        dailyRate: z.string(),
        totalAmount: z.string(),
        discount: z.string().optional(),
        finalAmount: z.string(),
        signatureData: z.string().optional(),
        fuelLevel: z.enum(["Empty", "1/4", "1/2", "3/4", "Full"]).optional(),
        pickupKm: z.number().int().optional(),
        // Insurance fields
        insurancePackage: z.enum(["None", "Basic", "Premium", "Full Coverage"]).default("None"),
        insuranceCost: z.string().default("0.00"),
        insuranceDailyRate: z.string().default("0.00"),
        // Deposit fields
        depositAmount: z.string().default("0.00"),
        depositStatus: z.enum(["None", "Held", "Refunded", "Forfeited"]).default("None"),
        // Fuel policy
        fuelPolicy: z.enum(["Full-to-Full", "Same-to-Same", "Pre-purchase"]).default("Full-to-Full"),
        targetUserId: z.number().optional(), // For Super Admin to assign contract to specific user
      }))
      .mutation(async ({ input, ctx }) => {
        const isAdmin = await db.isSuperAdmin(ctx.user.id);
        
        // Super Admin must provide targetUserId, regular users use their own ID
        let userId: number;
        if (isAdmin) {
          if (!input.targetUserId || input.targetUserId === 0) {
            throw new Error("Super Admin must select a specific user to create contract for");
          }
          userId = input.targetUserId;
        } else {
          userId = ctx.user.id;
        }
        // Verify vehicle exists and belongs to user
        const vehicleData = await db.getVehicleById(input.vehicleId, userId);
        if (!vehicleData) {
          throw new Error("Vehicle not found or you do not have access to this vehicle.");
        }
        if (vehicleData.status === "Maintenance") {
          throw new Error("Vehicle is currently in maintenance and cannot be rented. Remove it from maintenance first.");
        }
        if (vehicleData.status === "Out of Service") {
          throw new Error("Vehicle is out of service and cannot be rented.");
        }
        
        // Check if vehicle already has an active contract
        const activeContracts = await db.getActiveContractsByVehicleId(input.vehicleId, userId);
        if (activeContracts && activeContracts.length > 0) {
          throw new Error(`Vehicle is already rented. Active contract exists until ${new Date(activeContracts[0].rentalEndDate).toLocaleDateString()}.`);
        }
        
        // Check if client exists by license number
        let client = await db.getClientByLicenseNumber(input.drivingLicenseNumber, userId);
        
        // If client doesn't exist, create new client record
        if (!client) {
          const fullName = input.clientLastName 
            ? `${input.clientFirstName} ${input.clientLastName}` 
            : input.clientFirstName;
          client = await db.createClient({
            userId,
            name: fullName,
            nationality: input.clientNationality,
            phone: input.clientPhone,
            address: input.clientAddress,
            driverLicenseNumber: input.drivingLicenseNumber,
          });
        }
        
        // Create contract with client ID
        // Pass null for optional fields so Drizzle inserts NULL
        // Generate sequential contract number
        const existingContracts = await db.getAllRentalContracts(userId);
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
        
        // Get vehicle details for contract snapshot
        const vehicle = await db.getVehicleById(input.vehicleId, userId);
        
        const clientFullName = input.clientLastName 
          ? `${input.clientFirstName} ${input.clientLastName}` 
          : input.clientFirstName;
        const contract = await db.createRentalContract({
          userId,
          vehicleId: input.vehicleId,
          clientId: client.id,
          clientName: clientFullName,
          clientNationality: input.clientNationality || null,
          clientPhone: input.clientPhone || null,
          clientAddress: input.clientAddress || null,
          clientDriverLicense: input.drivingLicenseNumber,
          rentalStartDate: input.rentalStartDate,
          rentalEndDate: input.rentalEndDate,
          rentalDays: input.rentalDays,
          pickupTime: input.pickupTime || null,
          returnTime: input.returnTime || null,
          dailyRate: input.dailyRate,
          totalAmount: input.totalAmount,
          discount: input.discount || "0.00",
          finalAmount: input.finalAmount,
          contractNumber,
          signatureData: input.signatureData || null,
          vehicleType: vehicle?.category || null,
          vehicleColor: vehicle?.color || null,
          vehicleFuelType: vehicle?.fuelType || null,
          vehicleVIN: vehicle?.vin || null,
          fuelLevel: input.fuelLevel || "Full",
          pickupKm: input.pickupKm || null,
          // Insurance fields
          insurancePackage: input.insurancePackage,
          insuranceCost: input.insuranceCost,
          insuranceDailyRate: input.insuranceDailyRate,
          // Deposit fields
          depositAmount: input.depositAmount,
          depositStatus: input.depositStatus,
          // Fuel policy
          fuelPolicy: input.fuelPolicy,
        });
        
        // Auto-generate invoice immediately when contract is created
        const invoice = await db.autoGenerateInvoice(contract.id, userId);
        
        // Update vehicle status to "Rented"
        const { updateVehicleStatus } = await import("./updateVehicleStatus");
        await updateVehicleStatus(input.vehicleId);
        
        return { ...contract, invoice };
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
      .mutation(async ({ input, ctx }) => {
        return await db.createDamageMark({ ...input, userId: ctx.user?.id || 1 });
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
    
    markAsReturned: protectedProcedure
      .input(z.object({ 
        contractId: z.number(),
        returnKm: z.number().optional(),
        returnFuelLevel: z.enum(["Empty", "1/4", "1/2", "3/4", "Full"]).optional(),
        returnNotes: z.string().optional(),
        damageInspection: z.string().optional(),
        overLimitKmFee: z.number().optional(),
        depositRefund: z.boolean().optional(),
        depositRefundNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate return odometer is greater than pickup odometer
        if (input.returnKm) {
          const contract = await db.getRentalContractById(input.contractId, ctx.user.id);
          if (contract && contract.pickupKm && input.returnKm <= contract.pickupKm) {
            throw new Error(`Return odometer (${input.returnKm} km) must be greater than pickup odometer (${contract.pickupKm} km)`);
          }
        }
        const result = await db.markContractAsReturned(
          input.contractId, 
          input.returnKm,
          input.returnFuelLevel,
          input.returnNotes,
          input.damageInspection,
          input.overLimitKmFee,
          input.depositRefund,
          input.depositRefundNotes
        );
        
        // Update vehicle status back to "Available" (or "Maintenance" if in maintenance)
        const contract = await db.getRentalContractById(input.contractId, ctx.user.id);
        if (contract) {
          const { updateVehicleStatus } = await import("./updateVehicleStatus");
          await updateVehicleStatus(contract.vehicleId);
          
          // Update vehicle mileage with return mileage
          if (input.returnKm) {
            await db.updateVehicleMileage(contract.vehicleId, input.returnKm);
          }
        }
        
        return result;
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

    getFutureReservations: publicProcedure
      .input(z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        return await db.getFutureReservations(input.month, input.year, ctx.user?.id || 1);
      }),
    
    // Get last odometer reading from completed contract for a vehicle
    getLastOdometerReading: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input, ctx }) => {
        const lastContract = await db.getLastCompletedContractForVehicle(input.vehicleId, ctx.user.id);
        return lastContract?.returnKm || null;
      }),
    
    // Contract Amendment Procedures
    getAmendments: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        const amendments = await import("./contractAmendments");
        return await amendments.getContractAmendments(input.contractId);
      }),
    
    amendDates: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        newStartDate: z.date(),
        newEndDate: z.date(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const amendments = await import("./contractAmendments");
        return await amendments.amendContractDates(
          input.contractId,
          ctx.user.id,
          input.newStartDate,
          input.newEndDate,
          input.reason
        );
      }),
    
    amendVehicle: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        newVehicleId: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const amendments = await import("./contractAmendments");
        return await amendments.amendContractVehicle(
          input.contractId,
          ctx.user.id,
          input.newVehicleId,
          input.reason
        );
      }),
    
    amendRate: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        newDailyRate: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const amendments = await import("./contractAmendments");
        return await amendments.amendContractRate(
          input.contractId,
          ctx.user.id,
          input.newDailyRate,
          input.reason
        );
      }),

    // Generate PDF with custom template
    generatePDF: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { generateContractPDF, formatContractDataForPDF } = await import("./contractPdfGenerator");
        
        // Get contract data
        const contract = await db.getRentalContractById(input.contractId, ctx.user.id);
        if (!contract) {
          throw new Error('Contract not found');
        }
        
        // Get related data
        const client = contract.clientId ? await db.getClientById(contract.clientId, ctx.user.id) : null;
        const vehicle = await db.getVehicleById(contract.vehicleId, ctx.user.id);
        const company = await db.getCompanyProfile(ctx.user.id);
        
        // Check if custom template is configured
        if (!company?.contractTemplateUrl || !company?.contractTemplateFieldMap) {
          throw new Error('Contract template not configured. Please upload a template and configure field mappings in Company Settings.');
        }
        
        // Format contract data
        const contractData = formatContractDataForPDF(contract, client, vehicle, company);
        
        // Generate PDF
        const pdfBytes = await generateContractPDF(
          company.contractTemplateUrl,
          company.contractTemplateFieldMap as Record<string, any>,
          contractData
        );
        
        // Convert Uint8Array to number array for transmission
        return {
          pdfData: Array.from(pdfBytes),
          fileName: `Contract_${contract.contractNumber || contract.id}.pdf`,
        };
      }),

  }),

  // Client Management Router
  clients: router({
    list: publicProcedure
      .input(z.object({ filterUserId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getAllClients(ctx.user?.id || 1, input?.filterUserId || ctx.filterUserId);
      }),
    
    getClientCount: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user?.id || 1;
        const database = await db.getDb();
        if (!database) return 0;
        const result = await database.execute(
          sql`SELECT COUNT(*) as count FROM clients WHERE "userId" = ${userId}`
        ) as any;
        const rows = result?.rows || (Array.isArray(result) && result[0]) || [];
        return rows.length > 0 ? Number(rows[0].count) : 0;
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getClientById(input.id, ctx.user?.id || 1);
      }),
    
    create: publicProcedure
      .input(z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        fatherName: z.string().min(1).max(200),
        motherFullName: z.string().min(1).max(200),
        nationality: z.string().max(100).optional(),
        phone: z.string().max(20).optional(),
        address: z.string().optional(),
        dateOfBirth: z.string().optional(), // Date string from HTML date input
        placeOfBirth: z.string().max(200).optional(),
        passportIdNumber: z.string().max(100).optional(),
        registrationNumber: z.string().max(100).optional(),
        drivingLicenseNumber: z.string().min(1).max(100),
        licenseIssueDate: z.date().optional(),
        licenseExpiryDate: z.date(),
        email: z.string().email().max(320).optional(),
        notes: z.string().optional(),
        targetUserId: z.number().optional(), // For Super Admin to assign client to specific user
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate license expiry date is in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        if (input.licenseExpiryDate < today) {
          throw new Error('License expiry date must be in the future');
        }
        
        const isAdmin = await db.isSuperAdmin(ctx.user?.id || 1);
        
        let userId: number;
        if (isAdmin) {
          userId = (input.targetUserId && input.targetUserId !== 0) ? input.targetUserId : (ctx.user?.id || 1);
        } else {
          userId = ctx.user?.id || 1;
        }
        
        const { targetUserId: _, dateOfBirth, ...clientData } = input;
        // Convert dateOfBirth string to Date if provided
        const dateOfBirthDate = dateOfBirth ? new Date(dateOfBirth) : undefined;
        return await db.createClient({ ...clientData, dateOfBirth: dateOfBirthDate, userId });
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        fatherName: z.string().min(1).max(200).optional(),
        motherFullName: z.string().min(1).max(200).optional(),
        nationality: z.string().max(100).optional(),
        phone: z.string().max(20).optional(),
        address: z.string().optional(),
        dateOfBirth: z.string().optional(), // Date string from HTML date input
        placeOfBirth: z.string().max(200).optional(),
        passportIdNumber: z.string().max(100).optional(),
        registrationNumber: z.string().max(100).optional(),
        drivingLicenseNumber: z.string().max(100).optional(),
        licenseIssueDate: z.date().optional(),
        licenseExpiryDate: z.date().optional(),
        email: z.string().email().max(320).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, dateOfBirth, ...updates } = input;
        console.log('[Router] clients.update called with:', { id, updates, userId: ctx.user?.id || 1 });
        
        // Convert dateOfBirth string to Date if provided
        const dateOfBirthDate = dateOfBirth ? new Date(dateOfBirth) : undefined;
        const finalUpdates = { ...updates, ...(dateOfBirthDate !== undefined ? { dateOfBirth: dateOfBirthDate } : {}) };
        
        // Validate license expiry date is in the future if provided
        if (finalUpdates.licenseExpiryDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day
          if (finalUpdates.licenseExpiryDate < today) {
            throw new Error('License expiry date must be in the future');
          }
        }
        
        const result = await db.updateClient(id, ctx.user?.id || 1, finalUpdates);
        console.log('[Router] clients.update result:', result);
        return result;
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteClient(input.id, ctx.user?.id || 1);
        return { success: true };
      }),
    
    getByLicenseNumber: publicProcedure
      .input(z.object({ licenseNumber: z.string() }))
      .query(async ({ input, ctx }) => {
        return await db.getClientByLicenseNumber(input.licenseNumber, 1);
      }),
    
    getContracts: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getRentalContractsByClientId(input.clientId, ctx.user.id);
      }),
  }),

  // Profitability Analytics Router
  analytics: router({
    vehicleProfitability: protectedProcedure.query(async ({ ctx }) => {
      return await db.getVehicleProfitabilityAnalytics(ctx.user.id);
    }),
    
    vehicleFinancialDetails: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getVehicleFinancialDetails(input.vehicleId, ctx.user.id);
      }),
  }),

  // Export Router
  export: router({
    profitabilityExcel: protectedProcedure.query(async ({ ctx }) => {
      const vehicles = await db.getVehicleProfitabilityAnalytics(ctx.user.id);
      
      // Return raw data for client-side Excel generation
      return vehicles.map((v: any) => ({
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        totalRevenue: v.totalRevenue,
        totalMaintenanceCost: v.totalMaintenanceCost,
        insuranceCost: v.insuranceCost,
        netProfit: v.netProfit,
        profitMargin: v.profitMargin,
        rentalCount: v.rentalCount
      }));
    }),
    
    profitabilityPDF: protectedProcedure.query(async ({ ctx }) => {
      const PDFDocument = (await import('pdfkit')).default;
      const vehicles = await db.getVehicleProfitabilityAnalytics(ctx.user.id);
      
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

  // Car Makers and Models Router
  carMakers: router({
    getByCountry: protectedProcedure
      .input(z.object({ country: z.string() }))
      .query(async ({ input, ctx }) => {
        return await db.getCarMakersByCountry(input.country, ctx.user.id);
      }),
    
    getModelsByMaker: protectedProcedure
      .input(z.object({ makerId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getCarModelsByMaker(input.makerId, ctx.user.id);
      }),
    
    createCustomMaker: publicProcedure
      .input(z.object({
        name: z.string(),
        country: z.string(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCarMaker({
          name: input.name,
          country: input.country,
          isCustom: true,
          userId: input.userId,
        });
      }),
    
    createCustomModel: publicProcedure
      .input(z.object({
        makerId: z.number(),
        modelName: z.string(),
        year: z.number().optional(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCarModel({
          makerId: input.makerId,
          modelName: input.modelName,
          year: input.year,
          isCustom: true,
          userId: input.userId,
        });
      }),
    
    populateForCountry: protectedProcedure
      .input(z.object({ country: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        
        // Check if user already has car makers
        const existingMakers = await db.getCarMakersByCountry(input.country, userId);
        if (existingMakers.length > 0) {
          return { success: true, message: `User already has ${existingMakers.length} car makers`, count: existingMakers.length };
        }
        
        // Populate car makers and models
        await db.populateCarMakersForCountry(input.country, userId);
        const newMakers = await db.getCarMakersByCountry(input.country, userId);
        return { success: true, message: `Successfully populated ${newMakers.length} car makers`, count: newMakers.length };
      }),
  }),
  settings: router({
    get: publicProcedure.query(async ({ ctx }) => {
      const settings = await db.getCompanySettings(ctx.user?.id || 1);
      return settings;
    }),
    update: publicProcedure
      .input(z.object({
        companyName: z.string().optional(),
        logo: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        taxId: z.string().optional(),
        website: z.string().optional(),
        termsAndConditions: z.string().optional(),
        exchangeRateLbpToUsd: z.number().positive().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get existing settings to preserve companyName if not provided
        const existing = await db.getCompanySettings(ctx.user?.id || 1);
        const settings = await db.upsertCompanySettings({
          userId: ctx.user?.id || 1,
          companyName: input.companyName || existing?.companyName || "My Company",
          ...input,
          exchangeRateLbpToUsd: input.exchangeRateLbpToUsd ? String(input.exchangeRateLbpToUsd) : undefined,
        });
        return settings;
      }),
  }),

  company: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getCompanyProfile(ctx.user.id);
      return profile;
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        companyName: z.string().min(1),
        registrationNumber: z.string().optional(),
        taxId: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
        email: z.union([z.string().email(), z.literal('')]).optional(),
        website: z.string().optional(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        contractTemplateUrl: z.string().optional(),
        contractTemplateFieldMap: z.any().optional(), // JSON field mapping
        defaultCurrency: z.enum(["USD", "LOCAL"]).optional(),
        exchangeRate: z.number().optional(),
        localCurrencyCode: z.string().optional(),
        vatRate: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log('[updateProfile mutation] Called with input:', { exchangeRate: input.exchangeRate, localCurrencyCode: input.localCurrencyCode, vatRate: input.vatRate });
        const profile = await db.upsertCompanyProfile({
          userId: ctx.user.id,
          ...input,
        });
        console.log('[updateProfile mutation] Result:', { exchangeRate: profile?.exchangeRate, localCurrencyCode: profile?.localCurrencyCode, vatRate: profile?.vatRate });
        return profile;
      }),

    uploadLogo: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.array(z.number()), // Uint8Array as number array
        contentType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        const buffer = new Uint8Array(input.fileData);
        const { url } = await storagePut(input.fileName, buffer, input.contentType);
        return { url };
      }),
  }),

  // Nationalities router for autocomplete
  nationalities: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllNationalities(ctx.user.id);
    }),
    
    add: protectedProcedure
      .input(z.object({
        nationality: z.string().min(1).max(100),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.addNationality(ctx.user.id, input.nationality);
      }),
  }),

  invoices: router({
    // Generate invoice for a completed contract
    generate: protectedProcedure
      .input(z.object({
        contractId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const invoice = await db.generateInvoiceForContract(input.contractId, ctx.user.id);
        return invoice;
      }),

    // Get invoice by ID with line items
    getById: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const invoice = await db.getInvoiceById(input.invoiceId, ctx.filterUserId || ctx.user.id);
        return invoice;
      }),

    // List all invoices for the user
    list: protectedProcedure
      .input(z.object({ filterUserId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const invoices = await db.listInvoices(input?.filterUserId || ctx.filterUserId || ctx.user.id);
        return invoices;
      }),

    // Update invoice payment status
    updatePaymentStatus: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        paymentStatus: z.enum(["pending", "paid", "overdue", "cancelled"]),
        paymentMethod: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const invoice = await db.updateInvoicePaymentStatus(
          input.invoiceId,
          ctx.user.id,
          input.paymentStatus,
          input.paymentMethod
        );
        return invoice;
      }),
  }),
  
  // Super Admin User Management
  admin: router({
    listUsers: superAdminProcedure
      .query(async () => {
        const users = await db.getAllUsers();
        return users;
      }),
    
    updateUserRole: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const updatedUser = await db.updateUserRole(input.userId, input.role, ctx.user.id);
        return updatedUser;
      }),
    
    deleteUser: superAdminProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.deleteUser(input.userId, ctx.user.id);
        return result;
      }),
    
    getAuditLogs: superAdminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const logs = await db.getAuditLogs(input?.limit, input?.offset);
        return logs;
      }),
    
    getAuditLogsByUser: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const logs = await db.getAuditLogsByUser(input.userId, input.limit);
        return logs;
      }),
    
    getAuditLogsByAction: superAdminProcedure
      .input(z.object({
        action: z.string(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const logs = await db.getAuditLogsByAction(input.action, input.limit);
        return logs;
      }),
    
    toggleUserInternal: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        isInternal: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        await dbInstance.execute(
          sql`UPDATE users SET "isInternal" = ${input.isInternal} WHERE id = ${input.userId}`
        );
        
        return { success: true, userId: input.userId, isInternal: input.isInternal };
      }),
    
    createUser: superAdminProcedure
      .input(z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().optional(),
        phone: z.string().optional(),
        country: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const bcrypt = await import('bcrypt');

        const usernameLower = input.username.toLowerCase().trim();
        const emailLower = input.email.toLowerCase().trim();

        const existingUser = await db.getUserByUsername(usernameLower);
        if (existingUser) {
          throw new Error("Username already exists");
        }

        const existingEmail = await db.getUserByEmail(emailLower);
        if (existingEmail) {
          throw new Error("Email already registered");
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);
        
        const newUser = await db.createUser({
          username: usernameLower,
          password: hashedPassword,
          name: input.name || input.username,
          email: emailLower,
          phone: input.phone || "",
          country: input.country || "",
        });
        
        await db.createAuditLog({
          actorId: ctx.user.id,
          actorUsername: ctx.user.username,
          actorRole: ctx.user.role,
          action: "user_created",
          targetUserId: newUser.id,
          targetUsername: newUser.username,
          details: `Created new user: ${input.username}`,
          newState: {
            username: input.username,
            email: input.email,
            name: input.name,
          },
        });
        
        return newUser;
      }),

    resetUserPassword: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      }))
      .mutation(async ({ input, ctx }) => {
        const bcrypt = await import('bcrypt');
        const targetUser = await db.getUserById(input.userId);
        if (!targetUser) throw new Error("User not found");
        if (targetUser.role === 'super_admin' && targetUser.id !== ctx.user.id) {
          throw new Error("Cannot reset another super admin's password");
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPassword(input.userId, hashedPassword);

        await db.createAuditLog({
          actorId: ctx.user.id,
          actorUsername: ctx.user.username,
          actorRole: ctx.user.role,
          action: "password_reset",
          targetUserId: input.userId,
          targetUsername: targetUser.username,
          details: `Password reset by super admin for user: ${targetUser.username}`,
        });

        return { success: true, message: `Password reset for ${targetUser.username}` };
      }),

    getPlatformAnalytics: superAdminProcedure
      .query(async () => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('Database not available');

        const [
          userStats,
          vehicleStats,
          clientStats,
          invoiceStats,
          maintenanceStats,
          subscriptionBreakdown,
          recentSignups,
          vehiclesByStatus,
          topUsers,
          monthlyGrowth,
        ] = await Promise.all([
          dbInstance.execute(sql`SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE role != 'super_admin') as regular,
            COUNT(*) FILTER (WHERE "isInternal" = true) as internal,
            COUNT(*) FILTER (WHERE "lastSignedIn" > NOW() - INTERVAL '7 days') as active_7d,
            COUNT(*) FILTER (WHERE "lastSignedIn" > NOW() - INTERVAL '30 days') as active_30d,
            COUNT(*) FILTER (WHERE "createdAt" > NOW() - INTERVAL '30 days') as new_30d
          FROM users WHERE role != 'super_admin' AND username != 'demo@system'`),
          dbInstance.execute(sql`SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'Available') as available,
            COUNT(*) FILTER (WHERE status = 'Rented') as rented,
            COUNT(*) FILTER (WHERE status = 'Maintenance') as in_maintenance,
            COUNT(*) FILTER (WHERE status = 'Out of Service') as out_of_service
          FROM vehicles WHERE "userId" NOT IN (SELECT id FROM users WHERE username = 'demo@system')`),
          dbInstance.execute(sql`SELECT COUNT(*) as total FROM clients WHERE "userId" NOT IN (SELECT id FROM users WHERE username = 'demo@system')`),
          dbInstance.execute(sql`SELECT 
            COUNT(*) as total,
            COALESCE(SUM("totalAmount"), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN "paymentStatus" = 'paid' THEN "totalAmount" ELSE 0 END), 0) as paid_revenue,
            COALESCE(SUM(CASE WHEN "paymentStatus" = 'pending' THEN "totalAmount" ELSE 0 END), 0) as pending_revenue,
            COALESCE(SUM(CASE WHEN "paymentStatus" = 'overdue' THEN "totalAmount" ELSE 0 END), 0) as overdue_revenue
          FROM invoices WHERE "userId" NOT IN (SELECT id FROM users WHERE username = 'demo@system')`),
          dbInstance.execute(sql`SELECT 
            COUNT(*) as total,
            COALESCE(SUM(cost), 0) as total_cost
          FROM "maintenanceRecords" WHERE "userId" NOT IN (SELECT id FROM users WHERE username = 'demo@system')`),
          dbInstance.execute(sql`SELECT 
            COALESCE(st."displayName", 'No Plan') as plan_name,
            COUNT(u.id) as user_count,
            COALESCE(st."monthlyPrice", '0') as price
          FROM users u
          LEFT JOIN "userSubscriptions" us ON u.id = us."userId"
          LEFT JOIN "subscriptionTiers" st ON us."tierId" = st.id
          WHERE u.role != 'super_admin' AND u.username != 'demo@system'
          GROUP BY st."displayName", st."monthlyPrice"
          ORDER BY user_count DESC`),
          dbInstance.execute(sql`SELECT id, username, name, email, "createdAt", "lastSignedIn"
          FROM users WHERE role != 'super_admin' AND username != 'demo@system'
          ORDER BY "createdAt" DESC LIMIT 10`),
          dbInstance.execute(sql`SELECT status, COUNT(*) as count FROM vehicles WHERE "userId" NOT IN (SELECT id FROM users WHERE username = 'demo@system') GROUP BY status ORDER BY count DESC`),
          dbInstance.execute(sql`SELECT 
            u.id, u.username, u.name,
            (SELECT COUNT(*) FROM vehicles v WHERE v."userId" = u.id) as vehicles,
            (SELECT COUNT(*) FROM clients c WHERE c."userId" = u.id) as clients,
            (SELECT COUNT(*) FROM invoices i WHERE i."userId" = u.id) as invoices,
            (SELECT COALESCE(SUM(i."totalAmount"), 0) FROM invoices i WHERE i."userId" = u.id) as revenue
          FROM users u WHERE u.role != 'super_admin' AND u.username != 'demo@system'
          ORDER BY revenue DESC LIMIT 10`),
          dbInstance.execute(sql`SELECT 
            TO_CHAR("createdAt", 'YYYY-MM') as month,
            COUNT(*) as signups
          FROM users WHERE role != 'super_admin' AND username != 'demo@system'
          GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
          ORDER BY month DESC LIMIT 12`),
        ]);

        return {
          users: ((userStats as any).rows || [])[0] || {},
          vehicles: ((vehicleStats as any).rows || [])[0] || {},
          clients: ((clientStats as any).rows || [])[0] || {},
          invoices: ((invoiceStats as any).rows || [])[0] || {},
          maintenance: ((maintenanceStats as any).rows || [])[0] || {},
          subscriptionBreakdown: (subscriptionBreakdown as any).rows || [],
          recentSignups: (recentSignups as any).rows || [],
          vehiclesByStatus: (vehiclesByStatus as any).rows || [],
          topUsers: (topUsers as any).rows || [],
          monthlyGrowth: (monthlyGrowth as any).rows || [],
        };
      }),

    getUserSubscriptions: superAdminProcedure
      .query(async () => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('Database not available');

        const result = await dbInstance.execute(
          sql`SELECT u.id as "userId", u.username, u.name, 
              us."tierId", us.status as "subStatus", us."startDate", us."renewalDate",
              st."tierName", st."displayName" as "tierDisplayName", st."monthlyPrice"
            FROM users u
            LEFT JOIN "userSubscriptions" us ON u.id = us."userId"
            LEFT JOIN "subscriptionTiers" st ON us."tierId" = st.id
            WHERE u.role != 'super_admin'
            ORDER BY u.id`
        );
        return (result as any).rows || [];
      }),
  }),

  // Excel Export Router
  dataExport: router({
    allData: publicProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user?.id || 1;
        
        // Fetch all data
        const [vehicles, contracts, clients, invoices] = await Promise.all([
          db.getAllVehicles(userId),
          db.getAllRentalContracts(userId),
          db.getAllClients(userId),
          db.listInvoices(userId),
        ]);
        
        // Fetch maintenance records for each vehicle
        const maintenancePromises = vehicles.map(v => 
          db.getMaintenanceRecordsByVehicleId(v.id, userId)
        );
        const maintenanceArrays = await Promise.all(maintenancePromises);
        const maintenanceRecords = maintenanceArrays.flat();
        
        return {
          vehicles,
          contracts,
          clients,
          maintenanceRecords,
          invoices,
        };
       }),
  }),

  // File Upload Router
  files: router({
    uploadPdf: protectedProcedure
      .input(z.object({
        base64Data: z.string(),
        filename: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { uploadPdfToS3 } = await import("./uploadPdf");
        
        // Convert base64 to buffer
        const base64WithoutPrefix = input.base64Data.replace(/^data:application\/pdf;base64,/, '');
        const pdfBuffer = Buffer.from(base64WithoutPrefix, 'base64');
        
        // Upload to S3
        const result = await uploadPdfToS3(pdfBuffer, input.filename, ctx.user.id);
        
        return result;
      }),
  }),

  // P&L (Profit & Loss) Financial Dashboard
  profitLoss: router({
    getFinancialOverview: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;

        // Get all financial data
        const [
          completedContracts,
          paidInvoices,
          maintenanceRecords,
          allVehicles
        ] = await Promise.all([
          db.getCompletedContracts(userId, startDate, endDate),
          db.getPaidInvoices(userId, startDate, endDate),
          db.getMaintenanceRecords(userId, startDate, endDate),
          db.getAllVehicles(userId)
        ]);

        // Calculate total revenue from completed contracts
        const contractRevenue = completedContracts.reduce((sum, contract) => {
          return sum + parseFloat(contract.finalAmount?.toString() || '0');
        }, 0);

        // Calculate total revenue from paid invoices
        const invoiceRevenue = paidInvoices.reduce((sum, invoice) => {
          return sum + parseFloat(invoice.totalAmount?.toString() || '0');
        }, 0);

        const totalRevenue = contractRevenue + invoiceRevenue;

        // Calculate total expenses
        const maintenanceCosts = maintenanceRecords.reduce((sum, record) => {
          return sum + parseFloat(record.cost?.toString() || '0');
        }, 0);

        const insuranceCosts = allVehicles.reduce((sum, vehicle) => {
          return sum + parseFloat(vehicle.insuranceCost?.toString() || '0');
        }, 0);

        const vehiclePurchaseCosts = allVehicles.reduce((sum, vehicle) => {
          return sum + parseFloat(vehicle.purchaseCost?.toString() || '0');
        }, 0);

        const totalExpenses = maintenanceCosts + insuranceCosts;

        // Calculate net profit/loss
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return {
          revenue: {
            total: totalRevenue,
            contracts: contractRevenue,
            invoices: invoiceRevenue,
          },
          expenses: {
            total: totalExpenses,
            maintenance: maintenanceCosts,
            insurance: insuranceCosts,
          },
          assets: {
            vehiclePurchaseCosts,
            totalVehicles: allVehicles.length,
          },
          profitLoss: {
            netProfit,
            profitMargin,
          },
        };
      }),

    getVehicleProfitability: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;

        const vehicles = await db.getAllVehicles(userId);
        const contracts = await db.getCompletedContracts(userId, startDate, endDate);
        const maintenanceRecords = await db.getMaintenanceRecords(userId, startDate, endDate);

        // Calculate profitability for each vehicle
        const vehicleProfitability = vehicles.map(vehicle => {
          // Revenue from this vehicle's contracts
          const vehicleContracts = contracts.filter(c => c.vehicleId === vehicle.id);
          const revenue = vehicleContracts.reduce((sum, contract) => {
            return sum + parseFloat(contract.finalAmount?.toString() || '0');
          }, 0);

          // Maintenance costs for this vehicle
          const vehicleMaintenance = maintenanceRecords.filter(m => m.vehicleId === vehicle.id);
          const maintenanceCost = vehicleMaintenance.reduce((sum, record) => {
            return sum + parseFloat(record.cost?.toString() || '0');
          }, 0);

          // Insurance cost
          const insuranceCost = parseFloat(vehicle.insuranceCost?.toString() || '0');

          // Total expenses
          const totalExpenses = maintenanceCost + insuranceCost;

          // Net profit
          const netProfit = revenue - totalExpenses;

          // ROI (Return on Investment) based on purchase cost
          const purchaseCost = parseFloat(vehicle.purchaseCost?.toString() || '0');
          const roi = purchaseCost > 0 ? (netProfit / purchaseCost) * 100 : 0;

          return {
            vehicleId: vehicle.id,
            plateNumber: vehicle.plateNumber,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            revenue,
            expenses: {
              maintenance: maintenanceCost,
              insurance: insuranceCost,
              total: totalExpenses,
            },
            netProfit,
            purchaseCost,
            roi,
            contractCount: vehicleContracts.length,
          };
        });

        // Sort by net profit (highest first)
        return vehicleProfitability.sort((a, b) => b.netProfit - a.netProfit);
      }),

    calculatePnL: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        // Get all invoices in date range
        const invoices = await db.getAllInvoices(userId);
        const filteredInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.invoiceDate);
          return invDate >= startDate && invDate <= endDate;
        });

        // Get contracts to map client names
        const allContracts = await db.getAllRentalContracts(userId);
        const contractMap = new Map(allContracts.map((c: any) => [c.id, c]));

        // Calculate revenue from invoices
        const revenueBreakdown = filteredInvoices.map(inv => {
          const contract = contractMap.get(inv.contractId);
          return {
            invoiceNumber: inv.invoiceNumber,
            clientName: contract?.clientName || 'Unknown Client',
            invoiceDate: inv.invoiceDate,
            amount: parseFloat(inv.totalAmount?.toString() || '0'),
          };
        });
        const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.amount, 0);

        // Get all maintenance records in date range
        const maintenanceRecords = await db.getMaintenanceRecords(userId, startDate, endDate);
        const expenseBreakdown: any[] = maintenanceRecords.map(record => ({
          category: 'Maintenance',
          description: record.description || 'Maintenance work',
          date: record.performedAt,
          amount: parseFloat(record.cost?.toString() || '0'),
        }));

        // Get all insurance policies in date range
        const insurancePolicies = await db.getAllInsurancePolicies(userId);
        const filteredPolicies = insurancePolicies.filter(policy => {
          const policyDate = new Date(policy.policyStartDate);
          return policyDate >= startDate && policyDate <= endDate;
        });

        filteredPolicies.forEach(policy => {
          expenseBreakdown.push({
            category: 'Insurance',
            description: `${policy.policyNumber || 'Insurance Policy'}`,
            date: policy.policyStartDate,
            amount: parseFloat(policy.annualPremium?.toString() || '0'),
          });
        });

        const totalExpenses = expenseBreakdown.reduce((sum, item) => sum + item.amount, 0);

        // Calculate vehicle utilization
        const contracts = await db.getCompletedContracts(userId, startDate, endDate);
        const vehicles = await db.getAllVehicles(userId);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalVehicleDays = vehicles.length * totalDays;
        const rentedDays = contracts.reduce((sum, contract) => {
          const start = new Date(contract.rentalStartDate);
          const end = new Date(contract.rentalEndDate);
          return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        const vehicleUtilization = totalVehicleDays > 0 ? (rentedDays / totalVehicleDays) * 100 : 0;

        return {
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          revenueBreakdown,
          expenseBreakdown,
          vehicleUtilization,
        };
      }),

    getRevenueByMonth: protectedProcedure
      .input(z.object({
        year: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const year = input.year || new Date().getFullYear();
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        const contracts = await db.getCompletedContracts(userId);
        const invoices = await db.getPaidInvoices(userId);

        // Only include months up to current month if it's the current year
        const monthsToShow = year === currentYear ? currentMonth + 1 : 12;
        const monthlyData = Array.from({ length: monthsToShow }, (_, i) => ({
          month: i + 1,
          monthName: new Date(year, i).toLocaleString('default', { month: 'long' }),
          revenue: 0,
          expenses: 0,
        }));

        // Add contract revenue
        contracts.forEach(contract => {
          const contractDate = new Date(contract.rentalEndDate);
          if (contractDate.getFullYear() === year) {
            const month = contractDate.getMonth();
            monthlyData[month].revenue += parseFloat(contract.finalAmount?.toString() || '0');
          }
        });

        // Add invoice revenue
        invoices.forEach(invoice => {
          const invoiceDate = new Date(invoice.createdAt);
          if (invoiceDate.getFullYear() === year) {
            const month = invoiceDate.getMonth();
            monthlyData[month].revenue += parseFloat(invoice.totalAmount?.toString() || '0');
          }
        });

        // Add maintenance expenses
        const maintenanceRecords = await db.getMaintenanceRecords(userId);
        maintenanceRecords.forEach(record => {
          const recordDate = new Date(record.performedAt);
          if (recordDate.getFullYear() === year) {
            const month = recordDate.getMonth();
            monthlyData[month].expenses += parseFloat(record.cost?.toString() || '0');
          }
        });

        return monthlyData;
      }),
  }),

  whatsappTemplates: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user.id;
        return await db.getWhatsappTemplates(userId);
      }),
    
    get: protectedProcedure
      .input(z.object({
        templateType: z.enum(['contract_created', 'contract_renewed', 'contract_completed', 'invoice_generated']),
      }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        return await db.getWhatsappTemplateByType(userId, input.templateType);
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        templateType: z.enum(['contract_created', 'contract_renewed', 'contract_completed', 'invoice_generated']),
        messageTemplate: z.string(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        return await db.upsertWhatsappTemplate(userId, input.templateType, input.messageTemplate, input.isActive ?? true);
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteWhatsappTemplate(input.id);
      }),
    
    uploadThumbnail: protectedProcedure
      .input(z.object({
        thumbnailData: z.string(), // Base64 encoded image
        filename: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import('./storage');
        
        // Convert base64 to buffer
        const base64Data = input.thumbnailData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const timestamp = Date.now();
        const key = `thumbnails/${ctx.user.id}/${timestamp}-${input.filename}`;
        
        // Upload to S3
        const result = await storagePut(key, buffer, 'image/jpeg');
        
        return { url: result.url };
      }),
  }),

  dashboard: router({
    getQuickStats: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's revenue from completed contracts
        const contracts = await db.getCompletedContracts(userId);
        const todayRevenue = contracts
          .filter(c => {
            const endDate = new Date(c.rentalEndDate);
            return endDate >= today && endDate < tomorrow;
          })
          .reduce((sum, c) => sum + parseFloat(c.finalAmount?.toString() || '0'), 0);

        // Get active contracts count
        const allContracts = await db.getAllRentalContracts(userId);
        const activeContractsCount = allContracts.filter((c: any) => c.status === 'active').length;

        // Get available vehicles count
        const vehicles = await db.getAllVehicles(userId);
        const availableVehiclesCount = vehicles.filter((v: any) => v.status === 'Available').length;

        return {
          todayRevenue,
          activeContractsCount,
          availableVehiclesCount,
          totalVehicles: vehicles.length,
        };
      }),

    getExpiringDocuments: protectedProcedure
      .input(z.object({ daysThreshold: z.number().default(30) }).optional())
      .query(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const daysThreshold = input?.daysThreshold || 30;
        const expiringDocuments: any[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const vehicles = await db.getAllVehicles(userId);
        
        vehicles.forEach((vehicle: any) => {
          if (vehicle.insuranceExpiryDate) {
            const expiryDate = new Date(vehicle.insuranceExpiryDate);
            const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining > 0 && daysRemaining <= daysThreshold) {
              expiringDocuments.push({
                documentType: 'Insurance Policy',
                vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
                clientName: null,
                expiryDate: vehicle.insuranceExpiryDate,
                daysRemaining,
                additionalInfo: vehicle.insurancePolicyNumber ? `Policy #${vehicle.insurancePolicyNumber}` : null,
              });
            }
          }

          if (vehicle.registrationExpiryDate) {
            const expiryDate = new Date(vehicle.registrationExpiryDate);
            const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining > 0 && daysRemaining <= daysThreshold) {
              expiringDocuments.push({
                documentType: 'Vehicle Registration',
                vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
                clientName: null,
                expiryDate: vehicle.registrationExpiryDate,
                daysRemaining,
                additionalInfo: null,
              });
            }
          }
        });

        const clients = await db.getAllClients(userId);
        
        clients.forEach((client: any) => {
          if (client.licenseExpiryDate) {
            const expiryDate = new Date(client.licenseExpiryDate);
            const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining > 0 && daysRemaining <= daysThreshold) {
              expiringDocuments.push({
                documentType: 'Driver License',
                vehicleName: null,
                clientName: `${client.firstName} ${client.lastName}`,
                expiryDate: client.licenseExpiryDate,
                daysRemaining,
                additionalInfo: client.drivingLicenseNumber ? `License #${client.drivingLicenseNumber}` : null,
              });
            }
          }
        });

        expiringDocuments.sort((a, b) => a.daysRemaining - b.daysRemaining);

        return expiringDocuments;
      }),
  }),

  bulkImport: router({
    importVehicles: protectedProcedure
      .input(z.object({
        vehicles: z.array(z.object({
          brand: z.string(),
          model: z.string(),
          year: z.string(),
          licensePlate: z.string(),
          vin: z.string().optional(),
          color: z.string().optional(),
          mileage: z.string().optional(),
          category: z.string().optional(),
          status: z.string().optional(),
          dailyRate: z.string().optional(),
          purchaseCost: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const results = [];
        
        for (const vehicle of input.vehicles) {
          try {
            const created = await db.createVehicle({
              userId,
              brand: vehicle.brand,
              model: vehicle.model,
              year: parseInt(vehicle.year),
              plateNumber: vehicle.licensePlate,
              vin: vehicle.vin || '',
              color: vehicle.color || 'White',
              mileage: vehicle.mileage ? parseInt(vehicle.mileage) : 0,
              category: (vehicle.category as any) || 'Midsize',
              status: (vehicle.status as any) || 'Available',
              dailyRate: vehicle.dailyRate || '0',
              purchaseCost: vehicle.purchaseCost || '0',
            });
            results.push({ success: true, licensePlate: vehicle.licensePlate });
          } catch (error: any) {
            results.push({ success: false, licensePlate: vehicle.licensePlate, error: error.message });
          }
        }
        
        return { results };
      }),
    
    importClients: protectedProcedure
      .input(z.object({
        clients: z.array(z.object({
          name: z.string(),
          email: z.string().optional(),
          phone: z.string().optional(),
          drivingLicenseNumber: z.string().optional(),
          nationality: z.string().optional(),
          address: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const results = [];
        
        for (const client of input.clients) {
          try {
            // Split name into first and last
            const nameParts = client.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            const created = await db.createClient({
              userId,
              firstName,
              lastName,
              fatherName: client.name,
              motherFullName: client.name,
              email: client.email,
              phone: client.phone,
              drivingLicenseNumber: client.drivingLicenseNumber || 'N/A',
              licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              nationality: client.nationality,
              address: client.address,
            });
            results.push({ success: true, name: client.name });
          } catch (error: any) {
            results.push({ success: false, name: client.name, error: error.message });
          }
        }
        
        return { results };
      }),
  }),

  // AI Maintenance Router
  aiMaintenance: router({
    generateSchedule: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { generateMaintenanceSchedule } = await import("./aiMaintenanceGenerator");
        
        // Get vehicle data
        const vehicle = await db.getVehicleById(input.vehicleId, ctx.user.id);
        if (!vehicle) {
          throw new Error("Vehicle not found");
        }
        
        // Generate AI schedule
        const schedule = await generateMaintenanceSchedule(vehicle, ctx.user.id);
        
        // Save tasks to database
        const savedTasks = [];
        for (const task of schedule.tasks) {
          const saved = await db.createMaintenanceTask({
            userId: ctx.user.id,
            vehicleId: input.vehicleId,
            taskName: task.taskName,
            description: task.description,
            priority: task.priority,
            category: task.category,
            estimatedCost: task.estimatedCost.toString(),
            estimatedDuration: task.estimatedDuration,
            triggerType: task.triggerType,
            triggerMileage: task.triggerMileage,
            triggerDate: task.triggerDate,
            intervalMileage: task.intervalMileage,
            intervalMonths: task.intervalMonths,
            aiGenerated: true,
            aiReasoning: task.aiReasoning,
            status: "Pending",
          });
          savedTasks.push(saved);
        }
        
        return {
          tasks: savedTasks,
          summary: schedule.summary,
          totalEstimatedAnnualCost: schedule.totalEstimatedAnnualCost,
        };
      }),
    
    getTasksByVehicle: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getMaintenanceTasksByVehicleId(input.vehicleId, ctx.user.id);
      }),
    
    getAllTasks: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getAllMaintenanceTasks(ctx.user.id);
      }),
    
    getUpcomingTasks: protectedProcedure
      .input(z.object({ daysAhead: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        return await db.getUpcomingMaintenanceTasks(ctx.user.id, input.daysAhead);
      }),
    
    getOverdueTasks: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getOverdueMaintenanceTasks(ctx.user.id);
      }),
    
    updateTask: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        updates: z.object({
          taskName: z.string().optional(),
          description: z.string().optional(),
          priority: z.enum(["Critical", "Important", "Recommended", "Optional"]).optional(),
          estimatedCost: z.string().optional(),
          estimatedDuration: z.number().optional(),
          triggerMileage: z.number().optional(),
          triggerDate: z.date().optional(),
          status: z.enum(["Pending", "Completed", "Skipped"]).optional(),
          userOverridden: z.boolean().optional(),
          overrideNotes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.updateMaintenanceTask(input.taskId, ctx.user.id, input.updates);
      }),
    
    completeTask: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        completedMileage: z.number().optional(),
        actualCost: z.string().optional(),
        maintenanceRecordId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.completeMaintenanceTask(input.taskId, ctx.user.id, {
          completedMileage: input.completedMileage,
          actualCost: input.actualCost,
          maintenanceRecordId: input.maintenanceRecordId,
        });
      }),
    
    deleteTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.deleteMaintenanceTask(input.taskId, ctx.user.id);
      }),

    getMaintenanceAlerts: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user.id;
        const allTasks = await db.getAllMaintenanceTasks(userId);
        const allVehicles = await db.getAllVehicles(userId);
        const now = new Date();

        const alerts: Array<{
          id: string;
          level: "critical" | "attention" | "canwait";
          title: string;
          description: string;
          vehicleId: number;
          vehicleName: string;
          plateNumber: string;
          taskId?: number;
          type: "overdue" | "upcoming" | "mileage" | "insurance";
        }> = [];

        for (const task of allTasks) {
          if (task.status === "Completed" || task.status === "Skipped") continue;
          const vehicle = allVehicles.find((v: any) => v.id === task.vehicleId);
          if (!vehicle) continue;
          const vehicleName = `${vehicle.brand} ${vehicle.model}`;

          if (task.triggerDate && new Date(task.triggerDate) < now) {
            alerts.push({
              id: `task-${task.id}`,
              level: task.priority === "Critical" ? "critical" : "attention",
              title: task.taskName,
              description: `Overdue ${task.priority?.toLowerCase()} task: ${task.description || task.taskName}`,
              vehicleId: vehicle.id,
              vehicleName,
              plateNumber: vehicle.plateNumber,
              taskId: task.id,
              type: "overdue",
            });
          } else if (task.triggerDate) {
            const daysUntil = Math.ceil((new Date(task.triggerDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 7) {
              alerts.push({
                id: `task-${task.id}`,
                level: task.priority === "Critical" ? "critical" : "attention",
                title: task.taskName,
                description: `Due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} - ${task.description || task.taskName}`,
                vehicleId: vehicle.id,
                vehicleName,
                plateNumber: vehicle.plateNumber,
                taskId: task.id,
                type: "upcoming",
              });
            } else if (daysUntil <= 30) {
              alerts.push({
                id: `task-${task.id}`,
                level: "canwait",
                title: task.taskName,
                description: `Due in ${daysUntil} days - ${task.description || task.taskName}`,
                vehicleId: vehicle.id,
                vehicleName,
                plateNumber: vehicle.plateNumber,
                taskId: task.id,
                type: "upcoming",
              });
            }
          }

          if (task.triggerMileage && vehicle.mileage) {
            const kmLeft = task.triggerMileage - vehicle.mileage;
            if (kmLeft <= 0) {
              alerts.push({
                id: `task-mileage-${task.id}`,
                level: task.priority === "Critical" ? "critical" : "attention",
                title: `${task.taskName} - Mileage exceeded`,
                description: `Service due at ${task.triggerMileage?.toLocaleString()} km, current: ${vehicle.mileage?.toLocaleString()} km`,
                vehicleId: vehicle.id,
                vehicleName,
                plateNumber: vehicle.plateNumber,
                taskId: task.id,
                type: "mileage",
              });
            } else if (kmLeft <= 1000) {
              alerts.push({
                id: `task-mileage-${task.id}`,
                level: "canwait",
                title: `${task.taskName} - ${kmLeft} km remaining`,
                description: `Service due at ${task.triggerMileage?.toLocaleString()} km, current: ${vehicle.mileage?.toLocaleString()} km`,
                vehicleId: vehicle.id,
                vehicleName,
                plateNumber: vehicle.plateNumber,
                taskId: task.id,
                type: "mileage",
              });
            }
          }
        }

        for (const vehicle of allVehicles) {
          const vehicleName = `${vehicle.brand} ${vehicle.model}`;
          if (vehicle.insuranceExpiryDate) {
            const daysUntilExpiry = Math.ceil((new Date(vehicle.insuranceExpiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 0) {
              alerts.push({
                id: `insurance-${vehicle.id}`,
                level: "critical",
                title: "Insurance Expired",
                description: `Insurance expired ${Math.abs(daysUntilExpiry)} days ago`,
                vehicleId: vehicle.id,
                vehicleName,
                plateNumber: vehicle.plateNumber,
                type: "insurance",
              });
            } else if (daysUntilExpiry <= 14) {
              alerts.push({
                id: `insurance-${vehicle.id}`,
                level: "attention",
                title: "Insurance Expiring Soon",
                description: `Insurance expires in ${daysUntilExpiry} days`,
                vehicleId: vehicle.id,
                vehicleName,
                plateNumber: vehicle.plateNumber,
                type: "insurance",
              });
            }
          }

          if (vehicle.nextMaintenanceDate) {
            const daysUntil = Math.ceil((new Date(vehicle.nextMaintenanceDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 0) {
              const existingAlert = alerts.find(a => a.vehicleId === vehicle.id && a.type === "overdue");
              if (!existingAlert) {
                alerts.push({
                  id: `next-maint-${vehicle.id}`,
                  level: "critical",
                  title: "Scheduled Maintenance Overdue",
                  description: `Was due ${Math.abs(daysUntil)} days ago`,
                  vehicleId: vehicle.id,
                  vehicleName,
                  plateNumber: vehicle.plateNumber,
                  type: "overdue",
                });
              }
            } else if (daysUntil <= 7) {
              alerts.push({
                id: `next-maint-${vehicle.id}`,
                level: "attention",
                title: "Scheduled Maintenance Coming Up",
                description: `Due in ${daysUntil} days`,
                vehicleId: vehicle.id,
                vehicleName,
                plateNumber: vehicle.plateNumber,
                type: "upcoming",
              });
            }
          }
        }

        alerts.sort((a, b) => {
          const levelOrder = { critical: 0, attention: 1, canwait: 2 };
          return levelOrder[a.level] - levelOrder[b.level];
        });

        return {
          alerts,
          summary: {
            critical: alerts.filter(a => a.level === "critical").length,
            attention: alerts.filter(a => a.level === "attention").length,
            canwait: alerts.filter(a => a.level === "canwait").length,
            total: alerts.length,
          },
        };
      }),

    sendTaskToMaintenance: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        garageLocation: z.string().optional(),
        performedBy: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const task = (await db.getAllMaintenanceTasks(userId)).find((t: any) => t.id === input.taskId);
        if (!task) throw new Error("Task not found");

        const vehicle = (await db.getAllVehicles(userId)).find((v: any) => v.id === task.vehicleId);
        if (!vehicle) throw new Error("Vehicle not found");

        const categoryToType: Record<string, string> = {
          "Engine": "Routine",
          "Brakes": "Brake Pads Change",
          "Tires": "Routine",
          "HVAC": "Routine",
          "Transmission": "Inspection",
          "Electrical": "Inspection",
          "Cooling": "Routine",
          "Oil": "Oil Change",
        };
        const maintenanceType = categoryToType[task.category || ""] || "Routine";

        let record;
        try {
          record = await db.createMaintenanceRecord({
            userId,
            vehicleId: task.vehicleId,
            maintenanceType: maintenanceType as any,
            description: `[AI Task] ${task.taskName}: ${task.description || ""}`,
            cost: task.estimatedCost || "0",
            performedAt: new Date(),
            performedBy: input.performedBy || "Pending",
            garageLocation: input.garageLocation || undefined,
            mileageAtService: vehicle.mileage || undefined,
            garageEntryDate: new Date(),
          });

          await db.sendVehicleToMaintenance(task.vehicleId, userId);

          await db.completeMaintenanceTask(input.taskId, userId, {
            maintenanceRecordId: record.id,
            completedMileage: vehicle.mileage || undefined,
            actualCost: task.estimatedCost || undefined,
          });
        } catch (error) {
          throw new Error(`Failed to create maintenance record: ${error instanceof Error ? error.message : "Unknown error"}`);
        }

        return { record, vehicleId: task.vehicleId };
      }),

    // Insurance Policy Management
    getVehicleInsurancePolicies: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getVehicleInsurancePolicies(input.vehicleId, ctx.user.id);
      }),

    getActiveInsurancePolicy: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getActiveInsurancePolicy(input.vehicleId, ctx.user.id);
      }),
  }),
  numbering: router({
    getNextContractNumber: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await getNextContractNumber(ctx.user.id);
      }),
    
    getNextInvoiceNumber: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await getNextInvoiceNumber(ctx.user.id);
      }),
    
    getStatus: protectedProcedure
      .query(async ({ ctx }) => {
        return await getNumberingStatus(ctx.user.id);
      }),
    
    getAuditTrail: protectedProcedure
      .input(z.object({
        numberType: z.enum(["contract", "invoice"]).optional(),
        limit: z.number().default(100),
      }))
      .query(async ({ input, ctx }) => {
        return await getNumberingAuditTrail(ctx.user.id, input.numberType, input.limit);
      }),
    
    migrateContractNumber: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        startingNumber: z.number().min(0),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await migrateContractNumber(
          input.userId,
          input.startingNumber,
          ctx.user.id,
          ctx.user.username || "admin",
          input.reason
        );
        return { success: true };
      }),
    
    migrateInvoiceNumber: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        startingNumber: z.number().min(0),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await migrateInvoiceNumber(
          input.userId,
          input.startingNumber,
          ctx.user.id,
          ctx.user.username || "admin",
          input.reason
        );
        return { success: true };
      }),
    
    getAllUsersNumberingStatus: superAdminProcedure
      .query(async ({ ctx }) => {
        return await db.getAllUsersWithNumberingStatus();
      }),
    
    getUserAuditTrail: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        limit: z.number().default(100),
      }))
      .query(async ({ input, ctx }) => {
        return await db.getUserNumberingAuditTrail(input.userId, input.limit);
      }),
  }),
  subscription: router({
    getAllPlans: publicProcedure.query(async () => {
      return await db.getAllSubscriptionTiers();
    }),
    getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSubscription(ctx.user.id);
    }),
    selectPlan: protectedProcedure
      .input(z.object({
        tierId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.initializeSubscriptionTiers();
        const result = await db.createUserSubscription(ctx.user.id, input.tierId, "User selected plan");
        if (!result) {
          throw new Error("Failed to activate subscription");
        }
        return { success: true, subscription: result };
      }),
  }),
  contractTemplate: router({
    uploadTemplate: protectedProcedure
      .input(z.object({
        templateName: z.string().min(1),
        templateUrl: z.string().url(),
        templateType: z.enum(["pdf", "image"]),
        templateWidth: z.number().positive(),
        templateHeight: z.number().positive(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createContractTemplate({
          userId: ctx.user.id,
          templateName: input.templateName,
          templateUrl: input.templateUrl,
          templateType: input.templateType,
          templateWidth: input.templateWidth,
          templateHeight: input.templateHeight,
        });
        return { success: true, templateId: result.insertId || 0 };
      }),
    
    getTemplate: protectedProcedure.query(async ({ ctx }) => {
      const template = await db.getContractTemplate(ctx.user.id);
      if (!template) {
        return null;
      }
      return template;
    }),
    
    saveFields: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        fields: z.array(z.object({
          fieldName: z.string(),
          fieldLabel: z.string(),
          fieldType: z.string().optional(),
          positionX: z.number(),
          positionY: z.number(),
          width: z.number(),
          height: z.number(),
          fontSize: z.number().optional(),
          fontFamily: z.string().optional(),
          textAlignment: z.enum(["left", "center", "right"]).optional(),
          fontColor: z.string().optional(),
          isRequired: z.boolean().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify template belongs to user
        const template = await db.getContractTemplate(ctx.user.id);
        if (!template || template.id !== input.templateId) {
          throw new Error("Template not found or access denied");
        }
        
        await db.updateTemplateFields(input.templateId, input.fields);
        return { success: true };
      }),
    
    saveGeneratedContract: protectedProcedure
      .input(z.object({
        rentalContractId: z.number(),
        templateId: z.number(),
        pdfUrl: z.string().url(),
        pdfFileName: z.string(),
        filledData: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.saveGeneratedContract({
          userId: ctx.user.id,
          rentalContractId: input.rentalContractId,
          templateId: input.templateId,
          pdfUrl: input.pdfUrl,
          pdfFileName: input.pdfFileName,
          filledData: input.filledData,
        });
        return { success: true };
      }),
    
    getGeneratedContract: protectedProcedure
      .input(z.object({
        rentalContractId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const contract = await db.getGeneratedContract(input.rentalContractId);
        if (!contract) {
          return null;
        }
        // Verify user owns this contract
        if (contract.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
        return contract;
      }),
  }),
});
export type AppRouter = typeof appRouter;
