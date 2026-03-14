import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wrench, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

interface MaintenanceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  plateNumber: string;
  category: string;
  mileage: number | null;
  year: number;
  status: string;
}

export function MaintenanceModal({ isOpen, onOpenChange }: MaintenanceModalProps) {
  // Get vehicles in maintenance status
  const { data: vehiclesInMaintenance, isLoading } = trpc.fleet.list.useQuery(
    undefined,
    { enabled: isOpen }
  );

  // Filter to only show vehicles in maintenance
  const maintenanceVehicles = vehiclesInMaintenance?.filter((v: Vehicle) => v.status === "Maintenance") || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-red-600" />
            Vehicles in Maintenance
          </DialogTitle>
          <DialogDescription>
            View all vehicles currently undergoing maintenance or repairs. Click on a vehicle to see detailed information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : maintenanceVehicles.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">No vehicles in maintenance. All systems operational!</p>
            </div>
          ) : (
            maintenanceVehicles.map((vehicle: Vehicle, index: number) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-red-50 border-red-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      <Wrench className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                          In Maintenance
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Plate: <span className="font-medium">{vehicle.plateNumber}</span>
                      </p>
                      
                      {/* Vehicle Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <p className="font-medium">{vehicle.category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Year:</span>
                          <p className="font-medium">{vehicle.year}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mileage:</span>
                          <p className="font-medium">{vehicle.mileage} km</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p className="font-medium text-red-600">{vehicle.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-red-200">
                  <Link href={`/maintenance?vehicle=${vehicle.id}`}>
                    <Button size="sm" variant="outline" className="flex-1 border-red-300 text-red-700 hover:bg-red-100">
                      View Maintenance History
                    </Button>
                  </Link>
                  <Link href={`/fleet-management?vehicle=${vehicle.id}`}>
                    <Button size="sm" variant="outline" className="flex-1 border-red-300 text-red-700 hover:bg-red-100">
                      Vehicle Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
