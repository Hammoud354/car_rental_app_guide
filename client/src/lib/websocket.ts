import type { WSEvent } from "../../../server/websocket";

export type { WSEvent };

type Listener = (event: WSEvent) => void;

const MAX_RETRIES = 5;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;
  private maxDelay = 60000;
  private shouldConnect = false;
  private url = "";
  private failCount = 0;
  private everConnected = false;

  connect() {
    this.shouldConnect = true;
    this.failCount = 0;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${window.location.host}/ws`;
    this._connect();
  }

  private _connect() {
    if (!this.shouldConnect) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    if (this.failCount >= MAX_RETRIES && !this.everConnected) {
      // Production proxy doesn't support WS — give up silently, app works fine without it
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.everConnected = true;
        this.failCount = 0;
        this.reconnectDelay = 2000;
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
        this._stopPing();
        if (!this.shouldConnect) return;

        this.failCount++;

        // If we've never connected and hit the retry cap, stop silently
        if (!this.everConnected && this.failCount >= MAX_RETRIES) return;

        this.reconnectTimeout = setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
          this._connect();
        }, this.reconnectDelay);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {}
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
