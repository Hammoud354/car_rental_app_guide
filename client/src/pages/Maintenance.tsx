import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Wrench, Calendar, MapPin, Gauge, DollarSign, Car, LayoutDashboard, LogOut } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Maintenance() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [viewingHistory, setViewingHistory] = useState<number | null>(null);

  const { data: vehicles } = trpc.fleet.list.useQuery();
  const { data: maintenanceRecords, refetch: refetchRecords } = trpc.fleet.getMaintenanceRecords.useQuery(
    { vehicleId: viewingHistory || 0 },
    { enabled: viewingHistory !== null }
  );

  const addMaintenanceMutation = trpc.fleet.addMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast.success("Maintenance record added successfully");
      refetchRecords();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add maintenance record: ${error.message}`);
    },
  });

  const handleAddMaintenance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedVehicleId) {
      toast.error("Please select a vehicle");
      return;
    }

    addMaintenanceMutation.mutate({
      vehicleId: selectedVehicleId,
      maintenanceType: formData.get("maintenanceType") as any,
      description: formData.get("description") as string,
      cost: formData.get("cost") as string || undefined,
      performedAt: new Date(formData.get("performedAt") as string),
      performedBy: formData.get("performedBy") as string || undefined,
      garageLocation: formData.get("garageLocation") as string || undefined,
      mileageAtService: formData.get("mileageAtService") ? parseInt(formData.get("mileageAtService") as string) : undefined,
      nextServiceDue: formData.get("nextServiceDue") ? new Date(formData.get("nextServiceDue") as string) : undefined,
    });
  };

  const getMaintenanceTypeColor = (type: string) => {
    switch (type) {
      case "Routine":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Repair":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Inspection":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Emergency":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "";
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/fleet-management", label: "Fleet", icon: Car },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-600 text-white flex flex-col">
        <div className="p-6 border-b border-blue-500">
          <div className="flex items-center gap-2">
            <Car className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">FleetMaster</h1>
              <p className="text-xs text-blue-200">Premium Car Rentals</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-700 text-white"
                      : "text-blue-100 hover:bg-blue-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-500">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-500 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Maintenance Tracking</h2>
              <p className="text-gray-600 mt-1">Track and manage vehicle maintenance records</p>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Maintenance Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Maintenance Record</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMaintenance} className="space-y-4">
                  <div>
                    <Label htmlFor="vehicleSelect">Select Vehicle *</Label>
                    <Select 
                      onValueChange={(value) => setSelectedVehicleId(parseInt(value))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles?.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.plateNumber} - {vehicle.brand} {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maintenanceType">Maintenance Type *</Label>
                      <Select name="maintenanceType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Routine">Routine</SelectItem>
                          <SelectItem value="Repair">Repair</SelectItem>
                          <SelectItem value="Inspection">Inspection</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="performedAt">Date Performed *</Label>
                      <Input id="performedAt" name="performedAt" type="date" required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea id="description" name="description" rows={3} required placeholder="Describe the maintenance work performed..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="garageLocation">Garage Location</Label>
                      <Input id="garageLocation" name="garageLocation" placeholder="e.g., Downtown Auto Center" />
                    </div>
                    <div>
                      <Label htmlFor="performedBy">Performed By</Label>
                      <Input id="performedBy" name="performedBy" placeholder="Technician name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="mileageAtService">Kilometer Reading</Label>
                      <Input id="mileageAtService" name="mileageAtService" type="number" min="0" placeholder="e.g., 45000" />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost ($)</Label>
                      <Input id="cost" name="cost" type="number" step="0.01" min="0" placeholder="0.00" />
                    </div>
                    <div>
                      <Label htmlFor="nextServiceDue">Next Service Due</Label>
                      <Input id="nextServiceDue" name="nextServiceDue" type="date" />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addMaintenanceMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                      {addMaintenanceMutation.isPending ? "Adding..." : "Add Record"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Vehicle List with Maintenance Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles?.map((vehicle) => (
              <Card key={vehicle.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold">{vehicle.plateNumber}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </p>
                    </div>
                    <Badge className={vehicle.status === "Maintenance" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"}>
                      {vehicle.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Gauge className="h-4 w-4" />
                      <span>Current: {vehicle.mileage || 0} km</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setViewingHistory(vehicle.id)}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    View Maintenance History
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Maintenance History Dialog */}
          {viewingHistory && (
            <Dialog open={viewingHistory !== null} onOpenChange={() => setViewingHistory(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Maintenance History - {vehicles?.find(v => v.id === viewingHistory)?.plateNumber}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {maintenanceRecords && maintenanceRecords.length > 0 ? (
                    maintenanceRecords.map((record) => (
                      <Card key={record.id} className="bg-gray-50">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <Badge className={getMaintenanceTypeColor(record.maintenanceType)}>
                              {record.maintenanceType}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(record.performedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-gray-900 font-medium mb-3">{record.description}</p>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {record.garageLocation && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>{record.garageLocation}</span>
                              </div>
                            )}
                            {record.mileageAtService && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Gauge className="h-4 w-4" />
                                <span>{record.mileageAtService} km</span>
                              </div>
                            )}
                            {record.cost && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <DollarSign className="h-4 w-4" />
                                <span>${record.cost}</span>
                              </div>
                            )}
                            {record.performedBy && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Wrench className="h-4 w-4" />
                                <span>{record.performedBy}</span>
                              </div>
                            )}
                            {record.nextServiceDue && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>Next: {new Date(record.nextServiceDue).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No maintenance records yet</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </main>
    </div>
  );
}
