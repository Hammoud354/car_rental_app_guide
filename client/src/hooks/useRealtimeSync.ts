import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { realtimeClient, type WSEvent } from "@/lib/websocket";
import { useAuth } from "@/_core/hooks/useAuth";

export function useRealtimeSync() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (!connectedRef.current) {
      realtimeClient.connect();
      connectedRef.current = true;
    }

    const unsubscribe = realtimeClient.on((event: WSEvent) => {
      switch (event.type) {
        case "vehicle_status_changed": {
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/fleet.list"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/fleet.getVehicle"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/contracts.listByStatus"] });
          const label = event.plateNumber
            ? `${event.plateNumber}${event.brand ? ` (${event.brand} ${event.model || ""})` : ""}`
            : `Vehicle #${event.vehicleId}`;
          const statusColors: Record<string, string> = {
            Available: "🟢",
            Rented: "🔴",
            Maintenance: "🟡",
            "Out of Service": "⚫",
          };
          const icon = statusColors[event.status] ?? "🔄";
          toast.info(`${icon} ${label} → ${event.status}`, { duration: 4000 });
          break;
        }

        case "contract_created": {
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/contracts.list"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/contracts.listByStatus"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/fleet.list"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/invoices.list"] });
          toast.success(`📋 Contract ${event.contractNumber} created for ${event.clientName}`, { duration: 4000 });
          break;
        }

        case "contract_completed": {
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/contracts.list"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/contracts.listByStatus"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/fleet.list"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/invoices.list"] });
          toast.success(`✅ Contract ${event.contractNumber} completed`, { duration: 4000 });
          break;
        }

        case "contract_overdue": {
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/contracts.listByStatus"] });
          toast.warning(`⚠️ Contract ${event.contractNumber} is now overdue`, { duration: 6000 });
          break;
        }

        case "invoice_created": {
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/invoices.list"] });
          toast.info(`🧾 Invoice ${event.invoiceNumber} generated`, { duration: 4000 });
          break;
        }

        case "notification": {
          toast.info(`🔔 ${event.title}`, { description: event.message, duration: 6000 });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/notifications"] });
          break;
        }

        case "stats_updated": {
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/fleet.list"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/contracts.listByStatus"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/invoices.list"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trpc/maintenance"] });
          break;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    return () => {
      if (connectedRef.current) {
        realtimeClient.disconnect();
        connectedRef.current = false;
      }
    };
  }, []);
}
