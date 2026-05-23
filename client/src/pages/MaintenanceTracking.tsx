import { createPortal } from "react-dom";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Calendar, Gauge, Wrench, ChevronRight, Clock, MessageCircle, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { ModernDatePicker } from "@/components/ModernDatePicker";
import { useTranslation } from "react-i18next";

export default function MaintenanceTracking() {
  const { t } = useTranslation();
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<Date>();

  const { data: vehicles, refetch } = trpc.fleet.list.useQuery();

  const updateScheduleMutation = trpc.fleet.updateMaintenanceSchedule.useMutation({
    onSuccess: () => {
      toast.success("Maintenance schedule updated");
      refetch();
      setIsScheduleDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    },
  });

  const sendAlertMutation = trpc.fleet.sendMaintenanceAlertWhatsApp.useMutation();

  const handleUpdateSchedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    const formData = new FormData(e.currentTarget);
    updateScheduleMutation.mutate({
      vehicleId: selectedVehicle,
      nextMaintenanceDate: formData.get("nextMaintenanceDate")
        ? new Date(formData.get("nextMaintenanceDate") as string)
        : undefined,
      nextMaintenanceKm: formData.get("nextMaintenanceKm")
        ? parseInt(formData.get("nextMaintenanceKm") as string)
        : undefined,
      maintenanceIntervalKm: parseInt(formData.get("maintenanceIntervalKm") as string),
      maintenanceIntervalMonths: parseInt(formData.get("maintenanceIntervalMonths") as string),
    });
  };

  const getMaintenanceStatus = (vehicle: any) => {
    const now = new Date();
    const currentMileage = vehicle.mileage || 0;
    const dateOverdue = vehicle.nextMaintenanceDate && new Date(vehicle.nextMaintenanceDate) < now;
    const dateUpcoming = vehicle.nextMaintenanceDate &&
      new Date(vehicle.nextMaintenanceDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const kmOverdue = vehicle.nextMaintenanceKm && currentMileage >= vehicle.nextMaintenanceKm;
    const kmUpcoming = vehicle.nextMaintenanceKm && currentMileage >= (vehicle.nextMaintenanceKm - 500);
    if (dateOverdue || kmOverdue) return { status: "overdue", color: "destructive", label: "Overdue" };
    if (dateUpcoming || kmUpcoming) return { status: "upcoming", color: "warning", label: "Due Soon" };
    return { status: "ok", color: "default", label: "On Schedule" };
  };

  const overdueVehicles = vehicles?.filter(v => getMaintenanceStatus(v).status === "overdue") || [];
  const upcomingVehicles = vehicles?.filter(v => getMaintenanceStatus(v).status === "upcoming") || [];

  const selectedVehicleData = vehicles?.find(v => v.id === selectedVehicle);

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/"><span className="hover:text-foreground cursor-pointer">Overview</span></Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{t("maintenance.title")}</span>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Maintenance Tracking & Alerts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track maintenance schedules and get alerts for upcoming service
          </p>
        </div>
        <Button
          onClick={async () => {
            try {
              const result = await sendAlertMutation.mutateAsync();
              if (result.success && result.whatsappUrl) {
                window.open(result.whatsappUrl, "_blank");
                toast.success(`Sending alert for ${result.alertCount} vehicle(s)`);
              } else {
                toast.info(result.message || "No maintenance alerts to send");
              }
            } catch (error: any) {
              toast.error(error.message || "Failed to send alert");
            }
          }}
          disabled={sendAlertMutation.isPending || (overdueVehicles.length === 0 && upcomingVehicles.length === 0)}
          className="gap-2 self-start"
          size="sm"
        >
          <MessageCircle className="h-4 w-4" />
          Send WhatsApp Alert
        </Button>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Overdue</span>
          </div>
          <div className="text-3xl font-bold text-red-600">{overdueVehicles.length}</div>
          <p className="text-xs text-gray-500 mt-1">{overdueVehicles.length === 1 ? "vehicle needs" : "vehicles need"} immediate attention</p>
        </div>

        <div className="bg-white rounded-xl border border-yellow-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Due Soon</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600">{upcomingVehicles.length}</div>
          <p className="text-xs text-gray-500 mt-1">{upcomingVehicles.length === 1 ? "vehicle is" : "vehicles are"} due within 30 days</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Gauge className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Total Fleet</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{vehicles?.length || 0}</div>
          <p className="text-xs text-gray-500 mt-1">vehicles being tracked</p>
        </div>
      </div>

      {/* Overdue */}
      {overdueVehicles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Overdue Maintenance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueVehicles.map((vehicle) => (
              <VehicleMaintenanceCard
                key={vehicle.id}
                vehicle={vehicle}
                status={getMaintenanceStatus(vehicle)}
                onScheduleClick={() => { setSelectedVehicle(vehicle.id); setIsScheduleDialogOpen(true); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingVehicles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 text-yellow-600 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Due Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingVehicles.map((vehicle) => (
              <VehicleMaintenanceCard
                key={vehicle.id}
                vehicle={vehicle}
                status={getMaintenanceStatus(vehicle)}
                onScheduleClick={() => { setSelectedVehicle(vehicle.id); setIsScheduleDialogOpen(true); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Vehicles */}
      <div>
        <h2 className="text-lg font-bold mb-4 text-gray-900">All Vehicles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles?.map((vehicle) => (
            <VehicleMaintenanceCard
              key={vehicle.id}
              vehicle={vehicle}
              status={getMaintenanceStatus(vehicle)}
              onScheduleClick={() => { setSelectedVehicle(vehicle.id); setIsScheduleDialogOpen(true); }}
            />
          ))}
        </div>
      </div>

      {/* ── Schedule Portal ──────────────────────────────────────── */}
      {isScheduleDialogOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5"
          onClick={(e) => { if (e.target === e.currentTarget) setIsScheduleDialogOpen(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-lg"
            style={{ height: "min(90vh, 600px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-900 to-blue-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 rounded-xl p-2">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">Update Maintenance Schedule</h2>
                  {selectedVehicleData && (
                    <p className="text-blue-200 text-xs mt-0.5">{selectedVehicleData.plateNumber} — {selectedVehicleData.brand} {selectedVehicleData.model}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleDialogOpen(false)}
                className="text-white/60 hover:text-white transition-colors rounded-lg p-1.5 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form id="schedule-form" onSubmit={handleUpdateSchedule} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
              <div className="p-5 space-y-4">
                {selectedVehicle && (
                  <>
                    {/* Schedule dates & km */}
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-700">
                          <Calendar className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="font-semibold text-xs text-gray-700 tracking-wider uppercase">Next Service</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Next Maintenance Date</Label>
                          <div className="mt-1">
                            <ModernDatePicker
                              date={nextMaintenanceDate}
                              onDateChange={setNextMaintenanceDate}
                              placeholder="Select maintenance date"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="nextMaintenanceKm" className="text-xs font-medium text-gray-600">Next Maintenance at (km)</Label>
                          <Input
                            id="nextMaintenanceKm"
                            name="nextMaintenanceKm"
                            type="number"
                            className="mt-1 h-9 text-sm input-client"
                            defaultValue={vehicles?.find(v => v.id === selectedVehicle)?.nextMaintenanceKm || ""}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Intervals */}
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-orange-100 text-orange-700">
                          <Gauge className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="font-semibold text-xs text-gray-700 tracking-wider uppercase">Intervals</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="maintenanceIntervalKm" className="text-xs font-medium text-gray-600">Interval (km)</Label>
                          <Input
                            id="maintenanceIntervalKm"
                            name="maintenanceIntervalKm"
                            type="number"
                            required
                            className="mt-1 h-9 text-sm input-client"
                            defaultValue={vehicles?.find(v => v.id === selectedVehicle)?.maintenanceIntervalKm || 5000}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Every X kilometers</p>
                        </div>
                        <div>
                          <Label htmlFor="maintenanceIntervalMonths" className="text-xs font-medium text-gray-600">Interval (months)</Label>
                          <Input
                            id="maintenanceIntervalMonths"
                            name="maintenanceIntervalMonths"
                            type="number"
                            required
                            className="mt-1 h-9 text-sm input-client"
                            defaultValue={vehicles?.find(v => v.id === selectedVehicle)?.maintenanceIntervalMonths || 6}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Every X months</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100 bg-white shrink-0">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs px-4" onClick={() => setIsScheduleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" form="schedule-form" size="sm" className="h-8 text-xs px-5 bg-blue-800 hover:bg-blue-900" disabled={updateScheduleMutation.isPending}>
                {updateScheduleMutation.isPending ? "Saving..." : "Save Schedule"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function VehicleMaintenanceCard({
  vehicle,
  status,
  onScheduleClick
}: {
  vehicle: any;
  status: { status: string; color: string; label: string };
  onScheduleClick: () => void;
}) {
  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const borderColor = status.status === "overdue" ? "border-red-200" : status.status === "upcoming" ? "border-yellow-200" : "border-gray-100";
  const badgeClass = status.status === "overdue"
    ? "bg-red-100 text-red-700 border-red-200"
    : status.status === "upcoming"
    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <div className={`bg-white rounded-xl border ${borderColor} p-5 hover:shadow-sm transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">{vehicle.brand} {vehicle.model}</h3>
          <p className="text-xs text-gray-500">{vehicle.plateNumber}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 flex items-center gap-1 text-xs"><Gauge className="h-3.5 w-3.5" />Current Mileage</span>
          <span className="font-medium text-xs">{vehicle.mileage?.toLocaleString() || 0} km</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 flex items-center gap-1 text-xs"><Gauge className="h-3.5 w-3.5" />Next at</span>
          <span className="font-medium text-xs">{vehicle.nextMaintenanceKm ? `${vehicle.nextMaintenanceKm.toLocaleString()} km` : "Not set"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 flex items-center gap-1 text-xs"><Calendar className="h-3.5 w-3.5" />Next Date</span>
          <span className="font-medium text-xs">{formatDate(vehicle.nextMaintenanceDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs">Interval</span>
          <span className="font-medium text-xs">{vehicle.maintenanceIntervalKm || 5000} km / {vehicle.maintenanceIntervalMonths || 6} mo</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={onScheduleClick}>
          <Wrench className="h-3.5 w-3.5 mr-1" />
          Update Schedule
        </Button>
        <Link href="/maintenance">
          <Button variant="outline" size="sm" className="text-xs h-8">
            History
          </Button>
        </Link>
      </div>
    </div>
  );
}
