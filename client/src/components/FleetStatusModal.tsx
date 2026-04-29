import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Car, ArrowLeft, ExternalLink, Gauge, Fuel, CalendarDays, Shield, FileText, TrendingUp, Wrench, DollarSign, ReceiptText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { format, differenceInDays } from "date-fns";

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
  category: string;
  status: string;
  dailyRate: string | number;
  mileage?: number | null;
  fuelType?: string | null;
  insuranceExpiryDate?: string | Date | null;
  registrationExpiryDate?: string | Date | null;
}

interface FleetStatusModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
}

type StatusFilter = "All" | "Available" | "Rented" | "Maintenance";

const STATUS_TABS: StatusFilter[] = ["All", "Available", "Rented", "Maintenance"];

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Available:   { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  Rented:      { bg: "bg-blue-100",    text: "text-blue-800",    dot: "bg-blue-500"    },
  Maintenance: { bg: "bg-red-100",     text: "text-red-800",     dot: "bg-red-500"     },
};

function expiryInfo(date?: string | Date | null): { label: string; color: string } {
  if (!date) return { label: "N/A", color: "text-gray-400" };
  const days = differenceInDays(new Date(date), new Date());
  const formatted = format(new Date(date), "MMM d, yyyy");
  if (days < 0)   return { label: `${formatted} (expired)`,     color: "text-red-600 font-semibold" };
  if (days <= 14) return { label: `${formatted} (${days}d)`,    color: "text-orange-600 font-semibold" };
  if (days <= 30) return { label: `${formatted} (${days}d)`,    color: "text-yellow-600" };
  return { label: formatted, color: "text-gray-700" };
}

// Simple bar-chart rendered in SVG — no extra library
function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 280, H = 80, barW = Math.floor(W / data.length) - 4;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} className="overflow-visible">
      {data.map((d, i) => {
        const bh = Math.max((d.value / max) * H, 2);
        const x = i * (W / data.length) + 2;
        return (
          <g key={i}>
            <rect x={x} y={H - bh} width={barW} height={bh} rx={2} fill={color} opacity="0.85" />
            <text x={x + barW / 2} y={H + 13} textAnchor="middle" fontSize="8" fill="#9ca3af">{d.label}</text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={H - bh - 3} textAnchor="middle" fontSize="7.5" fill="#6b7280">
                ${d.value.toFixed(0)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function VehicleDetail({ vehicle, onBack }: { vehicle: Vehicle; onBack: () => void }) {
  const [, navigate] = useLocation();
  const { data: analysis, isLoading } = trpc.fleet.getVehicleAnalysis.useQuery(
    { vehicleId: vehicle.id },
    { staleTime: 30_000 }
  );

  const sc = statusConfig[vehicle.status] || statusConfig.Available;
  const insurance = expiryInfo(vehicle.insuranceExpiryDate);
  const registration = expiryInfo(vehicle.registrationExpiryDate);

  // Build last-6-months revenue chart from analysis.rentalContracts
  const monthlyRevenue = (() => {
    const buckets: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, "MMM");
      buckets[key] = 0;
    }
    (analysis?.rentalContracts || []).forEach((c: any) => {
      const key = format(new Date(c.startDate), "MMM");
      if (key in buckets) buckets[key] = (buckets[key] || 0) + (c.totalCost || 0);
    });
    return Object.entries(buckets).map(([label, value]) => ({ label, value }));
  })();

  const statCard = (icon: React.ReactNode, label: string, value: string, sub?: string) => (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-start gap-2">
      <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
      <div>
        <p className="text-[11px] text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-xs text-gray-500">{vehicle.plateNumber} · {vehicle.color} · {vehicle.category}</p>
        </div>
        <Badge className={`${sc.bg} ${sc.text} border-0 shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} inline-block mr-1`} />
          {vehicle.status}
        </Badge>
      </div>

      <div className="overflow-y-auto flex-1 space-y-4 pr-1">
        {/* Quick stats row */}
        <div className="grid grid-cols-2 gap-2">
          {statCard(<DollarSign className="h-4 w-4" />, "Daily Rate", `$${parseFloat(vehicle.dailyRate as string).toFixed(2)}`)}
          {statCard(<Gauge className="h-4 w-4" />, "Mileage", vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "—")}
          {statCard(<Fuel className="h-4 w-4" />, "Fuel Type", vehicle.fuelType || "—")}
          {statCard(<Car className="h-4 w-4" />, "Category", vehicle.category)}
        </div>

        {/* Expiry info */}
        <div className="border border-gray-100 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documents</p>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-gray-500">Insurance Expiry</p>
              <p className={`text-sm ${insurance.color}`}>{insurance.label}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-gray-500">Registration Expiry</p>
              <p className={`text-sm ${registration.color}`}>{registration.label}</p>
            </div>
          </div>
        </div>

        {/* Financials */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : analysis ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {statCard(<ReceiptText className="h-4 w-4" />, "Total Contracts", analysis.totalContracts.toString())}
              {statCard(<TrendingUp className="h-4 w-4" />, "Total Revenue", `$${analysis.totalRevenue.toFixed(2)}`)}
              {statCard(<Wrench className="h-4 w-4" />, "Maintenance Cost", `$${analysis.totalMaintenanceCost.toFixed(2)}`)}
              {statCard(
                <DollarSign className="h-4 w-4" />,
                "Net Profit",
                `$${analysis.netProfit.toFixed(2)}`,
              )}
            </div>

            {/* Revenue bar chart */}
            <div className="border border-gray-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Monthly Revenue (last 6 months)
              </p>
              {monthlyRevenue.every(d => d.value === 0) ? (
                <p className="text-xs text-gray-400 text-center py-4">No contract revenue recorded yet</p>
              ) : (
                <MiniBarChart data={monthlyRevenue} color="#3b82f6" />
              )}
            </div>

            {/* Recent contracts */}
            {analysis.rentalContracts.length > 0 && (
              <div className="border border-gray-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Recent Contracts
                </p>
                <div className="space-y-1.5">
                  {analysis.rentalContracts.slice(0, 4).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <div className="text-gray-600">
                        {format(new Date(c.startDate), "MMM d")} → {format(new Date(c.endDate), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">${c.totalCost.toFixed(0)}</span>
                        <Badge variant="outline" className={`text-[10px] py-0 h-4 ${
                          c.status === "active" ? "text-blue-700 border-blue-200" :
                          c.status === "completed" ? "text-emerald-700 border-emerald-200" :
                          "text-gray-500"
                        }`}>
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/vehicle/${vehicle.id}`)}
          data-testid={`button-view-vehicle-${vehicle.id}`}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Full Vehicle Page
        </Button>
      </div>
    </div>
  );
}

export function FleetStatusModal({ isOpen, onOpenChange, vehicles }: FleetStatusModalProps) {
  const [activeTab, setActiveTab] = useState<StatusFilter>("All");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const counts: Record<StatusFilter, number> = {
    All: vehicles.length,
    Available: vehicles.filter(v => v.status === "Available").length,
    Rented: vehicles.filter(v => v.status === "Rented").length,
    Maintenance: vehicles.filter(v => v.status === "Maintenance").length,
  };

  const filtered = activeTab === "All" ? vehicles : vehicles.filter(v => v.status === activeTab);

  const handleOpenChange = (open: boolean) => {
    if (!open) setSelectedVehicle(null);
    onOpenChange(open);
  };

  const tabColor: Record<StatusFilter, string> = {
    All:         "bg-gray-900 text-white",
    Available:   "bg-emerald-600 text-white",
    Rented:      "bg-blue-600 text-white",
    Maintenance: "bg-red-600 text-white",
  };

  const tabInactive: Record<StatusFilter, string> = {
    All:         "text-gray-600 hover:bg-gray-100",
    Available:   "text-emerald-700 hover:bg-emerald-50",
    Rented:      "text-blue-700 hover:bg-blue-50",
    Maintenance: "text-red-700 hover:bg-red-50",
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Fleet Status
          </DialogTitle>
          <DialogDescription>
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} in your fleet. Click any vehicle for details.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden px-5 pb-5">
          {selectedVehicle ? (
            <VehicleDetail
              vehicle={selectedVehicle}
              onBack={() => setSelectedVehicle(null)}
            />
          ) : (
            <>
              {/* Status filter tabs */}
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {STATUS_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      activeTab === tab ? tabColor[tab] : tabInactive[tab]
                    }`}
                    data-testid={`tab-fleet-${tab.toLowerCase()}`}
                  >
                    {tab} <span className="opacity-75">({counts[tab]})</span>
                  </button>
                ))}
              </div>

              {/* Vehicle list */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Car className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">No vehicles with status "{activeTab}"</p>
                </div>
              ) : (
                <div className="overflow-y-auto space-y-2 flex-1">
                  {filtered.map(v => {
                    const sc = statusConfig[v.status] || statusConfig.Available;
                    const insurance = expiryInfo(v.insuranceExpiryDate);
                    const registration = expiryInfo(v.registrationExpiryDate);
                    const hasAlert = insurance.color.includes("red") || insurance.color.includes("orange") ||
                                    registration.color.includes("red") || registration.color.includes("orange");
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVehicle(v)}
                        data-testid={`button-fleet-vehicle-${v.id}`}
                        className="w-full text-left border border-gray-100 rounded-xl p-3.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm text-gray-900 truncate">
                                {v.year} {v.make} {v.model}
                              </p>
                              {hasAlert && (
                                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400" title="Document expiring soon" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{v.plateNumber} · {v.color} · {v.category}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              ${parseFloat(v.dailyRate as string).toFixed(0)}/day
                              {v.mileage ? ` · ${v.mileage.toLocaleString()} km` : ""}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge className={`${sc.bg} ${sc.text} border-0 text-xs`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} inline-block mr-1`} />
                              {v.status}
                            </Badge>
                            <span className="text-[10px] text-gray-400 group-hover:text-blue-500 transition-colors">
                              View details →
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
