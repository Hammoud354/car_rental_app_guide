import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";
import { parse as parseCookies } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { getUserById } from "./db";

export type WSEvent =
  | { type: "vehicle_status_changed"; vehicleId: number; status: string; plateNumber?: string; brand?: string; model?: string; userId: number }
  | { type: "contract_created"; contractId: number; contractNumber: string; clientName: string; userId: number }
  | { type: "contract_completed"; contractId: number; contractNumber: string; userId: number }
  | { type: "contract_overdue"; contractId: number; contractNumber: string; userId: number }
  | { type: "invoice_created"; invoiceId: number; invoiceNumber: string; userId: number }
  | { type: "notification"; title: string; message: string; userId: number }
  | { type: "stats_updated"; userId: number }
  | { type: "ping" }
  | { type: "pong" };

interface AuthenticatedClient {
  ws: WebSocket;
  userId: number;
  role: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<AuthenticatedClient> = new Set();

  attach(server: Server) {
    // Use noServer mode so we manually control which upgrade requests we handle.
    // This prevents intercepting Vite HMR WebSocket connections (/?token=...).
    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (req, socket, head) => {
      const url = req.url || "";
      const pathname = url.split("?")[0];
      if (pathname === "/ws") {
        this.wss!.handleUpgrade(req, socket as any, head, (ws) => {
          this.wss!.emit("connection", ws, req);
        });
      }
      // All other paths (Vite HMR etc.) are left untouched
    });

    this.wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
      const cookies = parseCookies(req.headers.cookie || "");
      const sessionCookie = cookies[COOKIE_NAME];

      if (!sessionCookie || !sessionCookie.startsWith("user-")) {
        ws.close(4001, "Unauthorized");
        return;
      }

      const userId = parseInt(sessionCookie.replace("user-", ""), 10);
      if (isNaN(userId)) {
        ws.close(4001, "Unauthorized");
        return;
      }

      const user = await getUserById(userId).catch(() => null);
      if (!user) {
        ws.close(4001, "Unauthorized");
        return;
      }

      const client: AuthenticatedClient = { ws, userId, role: (user as any).role || "user" };
      this.clients.add(client);
      console.log(`[WS] Connected userId=${userId} role=${client.role} (${this.clients.size} total)`);

      this.sendToClient(client, { type: "pong" });

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "ping") this.sendToClient(client, { type: "pong" });
        } catch {}
      });

      ws.on("close", () => {
        this.clients.delete(client);
        console.log(`[WS] Disconnected userId=${userId} (${this.clients.size} total)`);
      });

      ws.on("error", () => this.clients.delete(client));
    });

    console.log("[WS] WebSocket server ready at /ws");
  }

  private sendToClient(client: AuthenticatedClient, event: WSEvent) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try { client.ws.send(JSON.stringify(event)); } catch {}
    }
  }

  broadcast(event: WSEvent & { userId: number }) {
    for (const client of Array.from(this.clients)) {
      if (client.userId === event.userId || client.role === "super_admin") {
        this.sendToClient(client, event);
      }
    }
  }

  broadcastToAll(event: WSEvent) {
    for (const client of Array.from(this.clients)) {
      this.sendToClient(client, event);
    }
  }

  get connectedCount() { return this.clients.size; }
}

export const wsManager = new WebSocketManager();
