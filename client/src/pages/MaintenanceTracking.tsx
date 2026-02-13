import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Calendar, Gauge, Wrench, Plus, ChevronRight, Clock, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import SidebarLayout from "@/components/SidebarLayout";

export default function MaintenanceTracking() {
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

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

    // Check date-based maintenance
    const dateOverdue = vehicle.nextMaintenanceDate && new Date(vehicle.nextMaintenanceDate) < now;
    const dateUpcoming = vehicle.nextMaintenanceDate && 
      new Date(vehicle.nextMaintenanceDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Check km-based maintenance
    const kmOverdue = vehicle.nextMaintenanceKm && currentMileage >= vehicle.nextMaintenanceKm;
    const kmUpcoming = vehicle.nextMaintenanceKm && 
      currentMileage >= (vehicle.nextMaintenanceKm - 500); // 500km before

    if (dateOverdue || kmOverdue) {
      return { status: "overdue", color: "destructive", label: "Overdue" };
    }
    if (dateUpcoming || kmUpcoming) {
      return { status: "upcoming", color: "warning", label: "Due Soon" };
    }
    return { status: "ok", color: "default", label: "On Schedule" };
  };

  const overdueVehicles = vehicles?.filter(v => getMaintenanceStatus(v).status === "overdue") || [];
  const upcomingVehicles = vehicles?.filter(v => getMaintenanceStatus(v).status === "upcoming") || [];

  return (
    <SidebarLayout>
      <div className="container mx-auto py-8 input-client">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 input-client">
          <Link href="/">
            <span className="hover:text-foreground cursor-pointer input-client">Overview</span>
          </Link>
          <ChevronRight className="h-4 w-4 input-client" />
          <span className="text-foreground font-medium input-client">Maintenance Tracking</span>
        </div>

      <div className="mb-8 flex justify-between items-start input-client">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 input-client">
            <Wrench className="h-8 w-8 input-client" />
            Maintenance Tracking & Alerts
          </h1>
          <p className="text-muted-foreground mt-2 input-client">
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
          className="gap-2 input-client"
        >
          <MessageCircle className="h-4 w-4 input-client" />
          Send WhatsApp Alert
        </Button>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 input-client">
        <Card className="border-destructive/50 input-client">
          <CardHeader className="pb-3 input-client">
            <CardTitle className="text-lg flex items-center gap-2 input-client">
              <AlertTriangle className="h-5 w-5 text-destructive input-client" />
              Overdue Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-destructive input-client">{overdueVehicles.length}</div>
            <p className="text-sm text-muted-foreground mt-1 input-client">
              {overdueVehicles.length === 1 ? "vehicle needs" : "vehicles need"} immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50 input-client">
          <CardHeader className="pb-3 input-client">
            <CardTitle className="text-lg flex items-center gap-2 input-client">
              <Clock className="h-5 w-5 text-yellow-600 input-client" />
              Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-600 input-client">{upcomingVehicles.length}</div>
            <p className="text-sm text-muted-foreground mt-1 input-client">
              {upcomingVehicles.length === 1 ? "vehicle is" : "vehicles are"} due within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 input-client">
            <CardTitle className="text-lg flex items-center gap-2 input-client">
              <Gauge className="h-5 w-5 input-client" />
              Total Fleet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold input-client">{vehicles?.length || 0}</div>
            <p className="text-sm text-muted-foreground mt-1 input-client">
              vehicles being tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Vehicles Section */}
      {overdueVehicles.length > 0 && (
        <div className="mb-8 input-client">
          <h2 className="text-2xl font-bold mb-4 text-destructive flex items-center gap-2 input-client">
            <AlertTriangle className="h-6 w-6 input-client" />
            Overdue Maintenance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 input-client">
            {overdueVehicles.map((vehicle) => (
              <VehicleMaintenanceCard
                key={vehicle.id}
                vehicle={vehicle}
                status={getMaintenanceStatus(vehicle)}
                onScheduleClick={() => {
                  setSelectedVehicle(vehicle.id);
                  setIsScheduleDialogOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Vehicles Section */}
      {upcomingVehicles.length > 0 && (
        <div className="mb-8 input-client">
          <h2 className="text-2xl font-bold mb-4 text-yellow-600 flex items-center gap-2 input-client">
            <Clock className="h-6 w-6 input-client" />
            Due Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 input-client">
            {upcomingVehicles.map((vehicle) => (
              <VehicleMaintenanceCard
                key={vehicle.id}
                vehicle={vehicle}
                status={getMaintenanceStatus(vehicle)}
                onScheduleClick={() => {
                  setSelectedVehicle(vehicle.id);
                  setIsScheduleDialogOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Vehicles Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 input-client">All Vehicles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 input-client">
          {vehicles?.map((vehicle) => (
            <VehicleMaintenanceCard
              key={vehicle.id}
              vehicle={vehicle}
              status={getMaintenanceStatus(vehicle)}
              onScheduleClick={() => {
                setSelectedVehicle(vehicle.id);
                setIsScheduleDialogOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-md input-client">
          <DialogHeader>
            <DialogTitle>Update Maintenance Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSchedule} className="space-y-4 input-client">
            {selectedVehicle && (
              <>
                <div className="space-y-2 input-client">
                  <Label htmlFor="nextMaintenanceDate">Next Maintenance Date</Label>
                  <Input
                    id="nextMaintenanceDate"
                    name="nextMaintenanceDate"
                    type="date"
                    defaultValue={
                      vehicles?.find(v => v.id === selectedVehicle)?.nextMaintenanceDate
                        ? new Date(vehicles.find(v => v.id === selectedVehicle)!.nextMaintenanceDate!).toISOString().split('T')[0]
                        : ""
                    }
                  />
                </div>

                <div className="space-y-2 input-client">
                  <Label htmlFor="nextMaintenanceKm">Next Maintenance at (km)</Label>
                  <Input
                    id="nextMaintenanceKm"
                    name="nextMaintenanceKm"
                    type="number"
                    defaultValue={vehicles?.find(v => v.id === selectedVehicle)?.nextMaintenanceKm || ""}
                  />
                </div>

                <div className="space-y-2 input-client">
                  <Label htmlFor="maintenanceIntervalKm">Maintenance Interval (km)</Label>
                  <Input
                    id="maintenanceIntervalKm"
                    name="maintenanceIntervalKm"
                    type="number"
                    required
                    defaultValue={vehicles?.find(v => v.id === selectedVehicle)?.maintenanceIntervalKm || 5000}
                  />
                  <p className="text-sm text-muted-foreground input-client">
                    Maintenance every X kilometers
                  </p>
                </div>

                <div className="space-y-2 input-client">
                  <Label htmlFor="maintenanceIntervalMonths">Maintenance Interval (months)</Label>
                  <Input
                    id="maintenanceIntervalMonths"
                    name="maintenanceIntervalMonths"
                    type="number"
                    required
                    defaultValue={vehicles?.find(v => v.id === selectedVehicle)?.maintenanceIntervalMonths || 6}
                  />
                  <p className="text-sm text-muted-foreground input-client">
                    Maintenance every X months
                  </p>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateScheduleMutation.isPending}>
                {updateScheduleMutation.isPending ? "Saving..." : "Save Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </SidebarLayout>
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

  return (
    <Card className={status.status === "overdue" ? "border-destructive" : status.status === "upcoming" ? "border-yellow-500" : ""}>
      <CardHeader className="pb-3 input-client">
        <div className="flex items-start justify-between input-client">
          <div>
            <CardTitle className="text-lg input-client">{vehicle.brand} {vehicle.model}</CardTitle>
            <CardDescription>{vehicle.plateNumber}</CardDescription>
          </div>
          <Badge variant={status.color as any}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 input-client">
        <div className="space-y-2 text-sm input-client">
          <div className="flex items-center justify-between input-client">
            <span className="text-muted-foreground flex items-center gap-1 input-client">
              <Gauge className="h-4 w-4 input-client" />
              Current Mileage
            </span>
            <span className="font-medium input-client">{vehicle.mileage?.toLocaleString() || 0} km</span>
          </div>
          
          <div className="flex items-center justify-between input-client">
            <span className="text-muted-foreground flex items-center gap-1 input-client">
              <Gauge className="h-4 w-4 input-client" />
              Next at
            </span>
            <span className="font-medium input-client">
              {vehicle.nextMaintenanceKm ? `${vehicle.nextMaintenanceKm.toLocaleString()} km` : "Not set"}
            </span>
          </div>

          <div className="flex items-center justify-between input-client">
            <span className="text-muted-foreground flex items-center gap-1 input-client">
              <Calendar className="h-4 w-4 input-client" />
              Next Date
            </span>
            <span className="font-medium input-client">{formatDate(vehicle.nextMaintenanceDate)}</span>
          </div>

          <div className="flex items-center justify-between input-client">
            <span className="text-muted-foreground input-client">Interval</span>
            <span className="font-medium input-client">
              {vehicle.maintenanceIntervalKm || 5000} km / {vehicle.maintenanceIntervalMonths || 6} months
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2 input-client">
          <Button variant="outline" size="sm" className="flex-1 input-client" onClick={onScheduleClick}>
            <Wrench className="h-4 w-4 mr-1 input-client" />
            Update Schedule
          </Button>
          <Link href="/maintenance">
            <Button variant="outline" size="sm">
              View History
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
