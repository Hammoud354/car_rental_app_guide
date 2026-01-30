
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Wrench, Calendar, Car, LayoutDashboard, LogOut, FileText, Home } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function FleetManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const { data: vehicles, isLoading, refetch } = trpc.fleet.list.useQuery();
  const createMutation = trpc.fleet.create.useMutation({
    onSuccess: () => {
      toast.success("Vehicle added successfully");
      refetch();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add vehicle: ${error.message}`);
    },
  });

  const updateMutation = trpc.fleet.update.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      refetch();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update vehicle: ${error.message}`);
    },
  });

  const deleteMutation = trpc.fleet.delete.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete vehicle: ${error.message}`);
    },
  });

  const handleAddVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      plateNumber: formData.get("plateNumber") as string,
      brand: formData.get("brand") as string,
      model: formData.get("model") as string,
      year: parseInt(formData.get("year") as string),
      color: formData.get("color") as string,
      category: formData.get("category") as any,
      status: (formData.get("status") as any) || "Available",
      dailyRate: formData.get("dailyRate") as string,
      weeklyRate: formData.get("weeklyRate") as string || undefined,
      monthlyRate: formData.get("monthlyRate") as string || undefined,
      mileage: formData.get("mileage") ? parseInt(formData.get("mileage") as string) : undefined,
      vin: formData.get("vin") as string || undefined,
      insurancePolicyNumber: formData.get("insurancePolicyNumber") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleEditVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateMutation.mutate({
      id: selectedVehicle.id,
      data: {
        plateNumber: formData.get("plateNumber") as string,
        brand: formData.get("brand") as string,
        model: formData.get("model") as string,
        year: parseInt(formData.get("year") as string),
        color: formData.get("color") as string,
        category: formData.get("category") as any,
        status: formData.get("status") as any,
        dailyRate: formData.get("dailyRate") as string,
        weeklyRate: formData.get("weeklyRate") as string || undefined,
        monthlyRate: formData.get("monthlyRate") as string || undefined,
        mileage: formData.get("mileage") ? parseInt(formData.get("mileage") as string) : undefined,
        vin: formData.get("vin") as string || undefined,
        insurancePolicyNumber: formData.get("insurancePolicyNumber") as string || undefined,
        notes: formData.get("notes") as string || undefined,
      },
    });
  };

  const handleDeleteVehicle = (id: number) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Rented":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Maintenance":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Out of Service":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "";
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/fleet-management", label: "Fleet", icon: Car },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/rental-contracts", label: "Contracts", icon: FileText },
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
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-blue-700 text-white"
                      : "text-blue-100 hover:bg-blue-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
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
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2">Fleet</h1>
            <p className="text-lg text-muted-foreground font-light">Manage your vehicle inventory with ease</p>
          </div>
          
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline" className="rounded-full px-6 h-11">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="apple-button h-11">
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-mono">Add New Vehicle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plateNumber">Plate Number *</Label>
                    <Input id="plateNumber" name="plateNumber" required />
                  </div>
                  <div>
                    <Label htmlFor="vin">VIN</Label>
                    <Input id="vin" name="vin" maxLength={17} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <Input id="brand" name="brand" required />
                  </div>
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input id="model" name="model" required />
                  </div>
                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Input id="year" name="year" type="number" min="1900" max="2100" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color">Color *</Label>
                    <Input id="color" name="color" required />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Economy">Economy</SelectItem>
                        <SelectItem value="Compact">Compact</SelectItem>
                        <SelectItem value="Midsize">Midsize</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="Luxury">Luxury</SelectItem>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Truck">Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="Available">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Rented">Rented</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Out of Service">Out of Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mileage">Mileage</Label>
                    <Input id="mileage" name="mileage" type="number" min="0" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dailyRate">Daily Rate ($) *</Label>
                    <Input id="dailyRate" name="dailyRate" type="number" step="0.01" min="0" required />
                  </div>
                  <div>
                    <Label htmlFor="weeklyRate">Weekly Rate ($)</Label>
                    <Input id="weeklyRate" name="weeklyRate" type="number" step="0.01" min="0" />
                  </div>
                  <div>
                    <Label htmlFor="monthlyRate">Monthly Rate ($)</Label>
                    <Input id="monthlyRate" name="monthlyRate" type="number" step="0.01" min="0" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="insurancePolicyNumber">Insurance Policy Number</Label>
                  <Input id="insurancePolicyNumber" name="insurancePolicyNumber" />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding..." : "Add Vehicle"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading vehicles...</p>
          </div>
        ) : vehicles && vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="apple-card border-none">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-mono">{vehicle.plateNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </p>
                    </div>
                    <Badge className={getStatusColor(vehicle.status)}>{vehicle.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <p className="font-medium">{vehicle.category}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Color:</span>
                      <p className="font-medium">{vehicle.color}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Daily Rate:</span>
                      <p className="font-medium">${vehicle.dailyRate}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mileage:</span>
                      <p className="font-medium">{vehicle.mileage || 0} mi</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold mb-2">No Vehicles Yet</h3>
              <p className="text-muted-foreground mb-6">Start by adding your first vehicle to the fleet.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Vehicle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        {selectedVehicle && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-mono">Edit Vehicle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditVehicle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-plateNumber">Plate Number *</Label>
                    <Input id="edit-plateNumber" name="plateNumber" defaultValue={selectedVehicle.plateNumber} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-vin">VIN</Label>
                    <Input id="edit-vin" name="vin" defaultValue={selectedVehicle.vin || ""} maxLength={17} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-brand">Brand *</Label>
                    <Input id="edit-brand" name="brand" defaultValue={selectedVehicle.brand} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-model">Model *</Label>
                    <Input id="edit-model" name="model" defaultValue={selectedVehicle.model} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-year">Year *</Label>
                    <Input id="edit-year" name="year" type="number" defaultValue={selectedVehicle.year} min="1900" max="2100" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-color">Color *</Label>
                    <Input id="edit-color" name="color" defaultValue={selectedVehicle.color} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select name="category" defaultValue={selectedVehicle.category} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Economy">Economy</SelectItem>
                        <SelectItem value="Compact">Compact</SelectItem>
                        <SelectItem value="Midsize">Midsize</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="Luxury">Luxury</SelectItem>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Truck">Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select name="status" defaultValue={selectedVehicle.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Rented">Rented</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Out of Service">Out of Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-mileage">Mileage</Label>
                    <Input id="edit-mileage" name="mileage" type="number" defaultValue={selectedVehicle.mileage || 0} min="0" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-dailyRate">Daily Rate ($) *</Label>
                    <Input id="edit-dailyRate" name="dailyRate" type="number" step="0.01" defaultValue={selectedVehicle.dailyRate} min="0" required />
                  </div>
                  <div>
                    <Label htmlFor="edit-weeklyRate">Weekly Rate ($)</Label>
                    <Input id="edit-weeklyRate" name="weeklyRate" type="number" step="0.01" defaultValue={selectedVehicle.weeklyRate || ""} min="0" />
                  </div>
                  <div>
                    <Label htmlFor="edit-monthlyRate">Monthly Rate ($)</Label>
                    <Input id="edit-monthlyRate" name="monthlyRate" type="number" step="0.01" defaultValue={selectedVehicle.monthlyRate || ""} min="0" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-insurancePolicyNumber">Insurance Policy Number</Label>
                  <Input id="edit-insurancePolicyNumber" name="insurancePolicyNumber" defaultValue={selectedVehicle.insurancePolicyNumber || ""} />
                </div>

                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea id="edit-notes" name="notes" rows={3} defaultValue={selectedVehicle.notes || ""} />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Updating..." : "Update Vehicle"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      </main>
    </div>
  );
}
