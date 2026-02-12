import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Calendar, Gauge, Wrench, Plus, ChevronRight, Clock } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

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
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/">
          <span className="hover:text-foreground cursor-pointer">Overview</span>
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Maintenance Tracking</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wrench className="h-8 w-8" />
          Maintenance Tracking & Alerts
        </h1>
        <p className="text-muted-foreground mt-2">
          Track maintenance schedules and get alerts for upcoming service
        </p>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Overdue Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-destructive">{overdueVehicles.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {overdueVehicles.length === 1 ? "vehicle needs" : "vehicles need"} immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-600">{upcomingVehicles.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {upcomingVehicles.length === 1 ? "vehicle is" : "vehicles are"} due within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Total Fleet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{vehicles?.length || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              vehicles being tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Vehicles Section */}
      {overdueVehicles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Overdue Maintenance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-yellow-600 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Due Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <h2 className="text-2xl font-bold mb-4">All Vehicles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Maintenance Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSchedule} className="space-y-4">
            {selectedVehicle && (
              <>
                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="nextMaintenanceKm">Next Maintenance at (km)</Label>
                  <Input
                    id="nextMaintenanceKm"
                    name="nextMaintenanceKm"
                    type="number"
                    defaultValue={vehicles?.find(v => v.id === selectedVehicle)?.nextMaintenanceKm || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenanceIntervalKm">Maintenance Interval (km)</Label>
                  <Input
                    id="maintenanceIntervalKm"
                    name="maintenanceIntervalKm"
                    type="number"
                    required
                    defaultValue={vehicles?.find(v => v.id === selectedVehicle)?.maintenanceIntervalKm || 5000}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maintenance every X kilometers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenanceIntervalMonths">Maintenance Interval (months)</Label>
                  <Input
                    id="maintenanceIntervalMonths"
                    name="maintenanceIntervalMonths"
                    type="number"
                    required
                    defaultValue={vehicles?.find(v => v.id === selectedVehicle)?.maintenanceIntervalMonths || 6}
                  />
                  <p className="text-sm text-muted-foreground">
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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{vehicle.brand} {vehicle.model}</CardTitle>
            <CardDescription>{vehicle.plateNumber}</CardDescription>
          </div>
          <Badge variant={status.color as any}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              Current Mileage
            </span>
            <span className="font-medium">{vehicle.mileage?.toLocaleString() || 0} km</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              Next at
            </span>
            <span className="font-medium">
              {vehicle.nextMaintenanceKm ? `${vehicle.nextMaintenanceKm.toLocaleString()} km` : "Not set"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Next Date
            </span>
            <span className="font-medium">{formatDate(vehicle.nextMaintenanceDate)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Interval</span>
            <span className="font-medium">
              {vehicle.maintenanceIntervalKm || 5000} km / {vehicle.maintenanceIntervalMonths || 6} months
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onScheduleClick}>
            <Wrench className="h-4 w-4 mr-1" />
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
