import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, superAdminProcedure, router } from "./_core/trpc";
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
        password: z.string().min(3),
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
        countryCode: z.string(),
        country: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const bcrypt = await import('bcrypt');
        
        // Convert username to lowercase for case-insensitive comparison
        const usernameLower = input.username.toLowerCase();
        
        // Check if username already exists (case-insensitive)
        const existingUser = await db.getUserByUsername(usernameLower);
        if (existingUser) {
          throw new Error('Username already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Create new user
        const newUser = await db.createUser({
          username: usernameLower,
          password: hashedPassword,
          name: input.name,
          email: input.email,
          phone: `${input.countryCode}${input.phone}`,
          country: input.country,
        });

        // Populate car makers and models for the user's country
        try {
          await db.populateCarMakersForCountry(input.country, newUser.id);
        } catch (error) {
          console.error('Failed to populate car makers:', error);
          // Continue even if population fails
        }

        // Auto-login after signup
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, `user-${newUser.id}`, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          success: true,
          user: newUser,
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
        insuranceCost: z.string().optional(),
        purchaseCost: z.string().optional(),
        insuranceExpiryDate: z.date().optional(),
        registrationExpiryDate: z.date().optional(),
        photoUrl: z.string().optional(),
        notes: z.string().optional(),
        targetUserId: z.number().optional(), // For Super Admin to assign vehicle to specific user
      }))
      .mutation(async ({ input, ctx }) => {
        const isAdmin = await db.isSuperAdmin(ctx.user?.id || 1);
        
        // Super Admin must provide targetUserId, regular users use their own ID
        let userId: number;
        if (isAdmin) {
          if (!input.targetUserId || input.targetUserId === 0) {
            throw new Error("Super Admin must select a specific user to create vehicle for");
          }
          userId = input.targetUserId;
        } else {
          userId = ctx.user?.id || 1;
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
          insuranceCost: z.string().optional(),
          purchaseCost: z.string().optional(),
          insuranceExpiryDate: z.date().optional(),
          registrationExpiryDate: z.date().optional(),
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
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createMaintenanceRecord({ ...input, userId: ctx.user?.id || 1 });
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
      .mutation(async ({ input, ctx }) => {
        // Check if vehicle already has an active contract
        const activeContracts = await db.getActiveContractsByVehicleId(input.vehicleId, ctx.user.id);
        if (activeContracts && activeContracts.length > 0) {
          throw new Error(`Vehicle is already rented. Active contract exists until ${new Date(activeContracts[0].rentalEndDate).toLocaleDateString()}.`);
        }
        
        // Check if client exists by license number
        let client = await db.getClientByLicenseNumber(input.drivingLicenseNumber, ctx.user.id);
        
        // If client doesn't exist, create new client record
        if (!client) {
          client = await db.createClient({
            userId: ctx.user.id,
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
        const existingContracts = await db.getAllRentalContracts(ctx.user.id);
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
          userId: ctx.user.id,
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
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate return odometer is greater than pickup odometer
        if (input.returnKm) {
          const contract = await db.getRentalContractById(input.contractId, ctx.user.id);
          if (contract && contract.pickupKm && input.returnKm <= contract.pickupKm) {
            throw new Error(`Return odometer (${input.returnKm} km) must be greater than pickup odometer (${contract.pickupKm} km)`);
          }
        }
        return await db.markContractAsReturned(
          input.contractId, 
          input.returnKm,
          input.returnFuelLevel,
          input.returnNotes,
          input.damageInspection,
          input.overLimitKmFee
        );
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
  }),

  // Client Management Router
  clients: router({
    list: publicProcedure
      .input(z.object({ filterUserId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getAllClients(ctx.user?.id || 1, input?.filterUserId || ctx.filterUserId);
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
        nationality: z.string().max(100).optional(),
        phone: z.string().max(20).optional(),
        address: z.string().optional(),
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
        
        // Super Admin must provide targetUserId, regular users use their own ID
        let userId: number;
        if (isAdmin) {
          if (!input.targetUserId || input.targetUserId === 0) {
            throw new Error("Super Admin must select a specific user to create client for");
          }
          userId = input.targetUserId;
        } else {
          userId = ctx.user?.id || 1;
        }
        
        const { targetUserId: _, ...clientData } = input;
        return await db.createClient({ ...clientData, userId });
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
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        // Validate license expiry date is in the future if provided
        if (updates.licenseExpiryDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day
          if (updates.licenseExpiryDate < today) {
            throw new Error('License expiry date must be in the future');
          }
        }
        return await db.updateClient(id, ctx.user?.id || 1, updates);
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
      const XLSX = await import('xlsx');
      const vehicles = await db.getVehicleProfitabilityAnalytics(ctx.user.id);
      
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
        companyName: z.string(),
        logo: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        taxId: z.string().optional(),
        website: z.string().optional(),
        termsAndConditions: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const settings = await db.upsertCompanySettings({
          userId: ctx.user?.id || 1,
          ...input,
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
        email: z.string().email().optional(),
        website: z.string().optional(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const profile = await db.upsertCompanyProfile({
          userId: ctx.user.id,
          ...input,
        });
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
        const users = await db.listAllUsers();
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
  }),
});

export type AppRouter = typeof appRouter;
