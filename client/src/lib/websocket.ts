import type { WSEvent } from "../../../server/websocket";

export type { WSEvent };

type Listener = (event: WSEvent) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  private shouldConnect = false;
  private url = "";

  connect() {
    this.shouldConnect = true;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${window.location.host}/ws`;
    this._connect();
  }

  private _connect() {
    if (!this.shouldConnect) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[WS] Connected");
        this.reconnectDelay = 1000;
        this._startPing();
      };

      this.ws.onmessage = (e) => {
        try {
          const event: WSEvent = JSON.parse(e.data);
          if (event.type === "pong") return;
          for (const listener of Array.from(this.listeners)) listener(event);
        } catch {}
      };

      this.ws.onclose = () => {
        console.log("[WS] Disconnected — reconnecting in", this.reconnectDelay, "ms");
        this._stopPing();
        if (this.shouldConnect) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
            this._connect();
          }, this.reconnectDelay);
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (err) {
      console.warn("[WS] Failed to create connection", err);
    }
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this._stopPing();
    this.ws?.close();
    this.ws = null;
  }

  private _startPing() {
    this._stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);
  }

  private _stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const realtimeClient = new RealtimeClient();
