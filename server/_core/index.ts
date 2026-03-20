import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeSubscriptionTiers, seedSuperAdmin, getUserById, createUserSubscription, getAllSubscriptionTiers } from "../db";
import { createPayTabsPayment, isPaymentApproved, parseCartId, buildCartId } from "./paytabs";
import { COOKIE_NAME } from "@shared/const";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Cookie parser middleware
  app.use(cookieParser());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Vehicle image upload endpoint
  app.post("/api/upload-vehicle-image", async (req, res) => {
    try {
      const { image, fileName, vehicleId, imageType } = req.body;
      
      if (!image || !fileName || !vehicleId || !imageType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Import storage functions
      const { storagePut } = await import("../storage");
      
      // Extract base64 data
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExtension = fileName.split(".").pop() || "jpg";
      const fileKey = `vehicles/${vehicleId}/${imageType}/${timestamp}-${randomSuffix}.${fileExtension}`;
      
      // Upload to S3
      const mimeType = image.match(/data:(.*?);/)?.[1] || "image/jpeg";
      const result = await storagePut(fileKey, buffer, mimeType);
      
      res.json({ url: result.url });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
  
  // PayTabs: Create payment page
  app.post("/api/paytabs/create-payment", async (req, res) => {
    try {
      const sessionCookie = req.cookies?.[COOKIE_NAME];
      if (!sessionCookie?.startsWith("user-")) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = parseInt(sessionCookie.replace("user-", ""), 10);
      if (isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const user = await getUserById(userId);
      if (!user) return res.status(401).json({ error: "User not found" });

      const { tierId } = req.body;
      if (!tierId) return res.status(400).json({ error: "tierId is required" });

      await initializeSubscriptionTiers();
      const tiers = await getAllSubscriptionTiers();
      const tier = tiers.find((t) => t.id === tierId);
      if (!tier) return res.status(404).json({ error: "Plan not found" });

      const baseUrl =
        process.env.VITE_APP_URL ||
        `${req.protocol}://${req.get("host")}`;

      const cartId = buildCartId(tierId, userId);

      const payment = await createPayTabsPayment({
        cartId,
        cartDescription: `${tier.displayName} Plan - Monthly Subscription`,
        amount: parseFloat(tier.price),
        currency: "USD",
        callbackUrl: `${baseUrl}/api/paytabs/callback`,
        returnUrl: `${baseUrl}/payment-return`,
        customerName: user.name || user.username,
        customerEmail: user.email || `${user.username}@user.local`,
        customerPhone: user.phone || undefined,
      });

      res.json({ redirect: payment.redirect, tran_ref: payment.tran_ref });
    } catch (err: any) {
      console.error("[PayTabs] create-payment error:", err);
      res.status(500).json({ error: err.message || "Failed to create payment" });
    }
  });

  // PayTabs: Server-to-server callback (webhook)
  app.post("/api/paytabs/callback", async (req, res) => {
    try {
      const payload = req.body;
      console.log("[PayTabs] Callback received:", JSON.stringify(payload));

      if (!isPaymentApproved(payload)) {
        console.log("[PayTabs] Payment not approved:", payload?.payment_result);
        return res.status(200).json({ status: "declined" });
      }

      const parsed = parseCartId(payload.cart_id);
      if (!parsed) {
        console.error("[PayTabs] Could not parse cart_id:", payload.cart_id);
        return res.status(400).json({ error: "Invalid cart_id" });
      }

      const { userId, tierId } = parsed;
      await initializeSubscriptionTiers();
      await createUserSubscription(userId, tierId, `PayTabs payment approved — ref: ${payload.tran_ref}`);

      console.log(`[PayTabs] Subscription activated: user=${userId} tier=${tierId}`);
      res.status(200).json({ status: "ok" });
    } catch (err: any) {
      console.error("[PayTabs] callback error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "5000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    initializeSubscriptionTiers().catch(err =>
      console.error("[Startup] Failed to initialize subscription tiers:", err)
    );
    seedSuperAdmin().catch(err =>
      console.error("[Startup] Failed to seed super admin:", err)
    );
  });
}

startServer().catch(console.error);
