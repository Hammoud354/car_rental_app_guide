import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";

// Paths that belong to authenticated/private app sections — should not be indexed
const PROTECTED_PREFIXES = [
  "/dashboard", "/fleet", "/clients", "/rental-contracts",
  "/invoices", "/maintenance", "/ai-maintenance", "/vehicle/",
  "/booking", "/operations", "/compliance", "/settings",
  "/whatsapp-settings", "/company-settings", "/profitability",
  "/profit-loss", "/analysis", "/reservations", "/my-profile",
  "/contract-template-mapper", "/contract-management", "/admin/",
  "/demo",
];

function getRobotsTag(urlPath: string): string {
  const p = urlPath.split("?")[0];
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(prefix.endsWith("/") ? prefix : prefix + "/")
  );
  return isProtected ? "noindex, nofollow" : "index, follow";
}

export async function setupVite(app: Express, server: Server) {
  const viteModule = await import("vite");
  const createViteServer = viteModule.createServer;
  const viteConfigOrFn = (await import("../../vite.config")).default;

  // vite.config.ts may export either a plain object or a function (defineConfig(fn) form)
  const viteConfig = typeof viteConfigOrFn === "function"
    ? await (viteConfigOrFn as (env: { mode: string; command: string; isSsrBuild: boolean }) => unknown)({
        mode: "development",
        command: "serve",
        isSsrBuild: false,
      })
    : viteConfigOrFn;

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...(viteConfig as object),
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html", "X-Robots-Tag": getRobotsTag(url) }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "../..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve hashed assets (JS/CSS) with 1-year immutable cache
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
  }));

  // Serve everything else (favicon, robots.txt, etc.) with short cache, no-cache for HTML
  app.use(express.static(distPath, {
    maxAge: "1h",
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  }));

  // fall through to index.html — set route-aware X-Robots-Tag
  app.use("*", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("X-Robots-Tag", getRobotsTag(req.path));
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
