import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Wrench, Calendar, MapPin, Gauge, DollarSign, Car, LayoutDashboard, LogOut, FileText, Home, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import SidebarLayout from "@/components/SidebarLayout";

export default function Maintenance() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [viewingHistory, setViewingHistory] = useState<number | null>(null);
  const [autoFilledKm, setAutoFilledKm] = useState<number | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const { data: vehicles } = trpc.fleet.listAvailableForMaintenance.useQuery();
  const { data: maintenanceRecords, refetch: refetchRecords } = trpc.fleet.getMaintenanceRecords.useQuery(
    { vehicleId: viewingHistory || 0 },
    { enabled: viewingHistory !== null }
  );
  
  // Query for last return KM when vehicle is selected
  const { data: lastReturnKm } = trpc.fleet.getLastReturnKm.useQuery(
    { vehicleId: selectedVehicleId || 0 },
    { enabled: selectedVehicleId !== null }
  );
  
  // Auto-fill KM field when lastReturnKm is loaded
  useEffect(() => {
    if (lastReturnKm) {
      setAutoFilledKm(lastReturnKm);
    } else {
      setAutoFilledKm(null);
    }
  }, [lastReturnKm]);

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

  const updateMaintenanceMutation = trpc.fleet.updateMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast.success("Maintenance record updated successfully");
      refetchRecords();
      setEditingRecordId(null);
      setEditFormData({});
    },
    onError: (error) => {
      toast.error(`Failed to update maintenance record: ${error.message}`);
    },
  });

  const deleteMaintenanceMutation = trpc.fleet.deleteMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast.success("Maintenance record deleted");
      refetchRecords();
    },
    onError: (error) => {
      toast.error(`Failed to delete maintenance record: ${error.message}`);
    },
  });

  const handleEditRecord = (record: any) => {
    setEditingRecordId(record.id);
    setEditFormData({
      maintenanceType: record.maintenanceType,
      description: record.description,
      cost: record.cost || "",
      performedAt: new Date(record.performedAt).toISOString().split('T')[0],
      performedBy: record.performedBy || "",
      garageLocation: record.garageLocation || "",
      mileageAtService: record.mileageAtService || "",
      kmDueMaintenance: record.kmDueMaintenance || "",
      garageEntryDate: record.garageEntryDate ? new Date(record.garageEntryDate).toISOString().split('T')[0] : "",
      garageExitDate: record.garageExitDate ? new Date(record.garageExitDate).toISOString().split('T')[0] : "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingRecordId) return;
    
    updateMaintenanceMutation.mutate({
      id: editingRecordId,
      maintenanceType: editFormData.maintenanceType,
      description: editFormData.description,
      cost: editFormData.cost || undefined,
      performedAt: new Date(editFormData.performedAt),
      performedBy: editFormData.performedBy || undefined,
      garageLocation: editFormData.garageLocation || undefined,
      mileageAtService: editFormData.mileageAtService ? parseInt(editFormData.mileageAtService) : undefined,
      garageEntryDate: editFormData.garageEntryDate ? new Date(editFormData.garageEntryDate) : undefined,
      garageExitDate: editFormData.garageExitDate ? new Date(editFormData.garageExitDate) : undefined,
    });
  };

  const handleDeleteRecord = (recordId: number) => {
    if (confirm("Are you sure you want to delete this maintenance record?")) {
      deleteMaintenanceMutation.mutate({ id: recordId });
    }
  };

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
      kmDueMaintenance: formData.get("kmDueMaintenance") ? parseInt(formData.get("kmDueMaintenance") as string) : undefined,
      garageEntryDate: formData.get("garageEntryDate") ? new Date(formData.get("garageEntryDate") as string) : undefined,
      garageExitDate: formData.get("garageExitDate") ? new Date(formData.get("garageExitDate") as string) : undefined,
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
    { href: "/rental-contracts", label: "Contracts", icon: FileText },
  ];

  return (
    <SidebarLayout>
        <div className="max-w-7xl mx-auto space-y-8 input-client">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 input-client">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 input-client">Maintenance Tracking</h2>
              <p className="text-gray-600 mt-1 input-client">Track and manage vehicle maintenance records</p>
            </div>
            
            <div className="flex gap-3 input-client">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gray-900 hover:bg-gray-800 input-client">
                  <Plus className="mr-2 h-4 w-4 input-client" />
                  Add Maintenance Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto input-client">
                <DialogHeader>
                  <DialogTitle>Add Maintenance Record</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMaintenance} className="space-y-4 input-client">
                  <div>
                    <Label htmlFor="vehicleSelect">Select Vehicle *</Label>
                    <Select 
                      onValueChange={(value) => {
                        const vehicleId = parseInt(value);
                        setSelectedVehicleId(vehicleId);
                        // Auto-fill will happen via useEffect when lastReturnKm loads
                      }}
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

                  <div className="grid grid-cols-2 gap-4 input-client">
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
                          <SelectItem value="Oil Change">Oil Change</SelectItem>
                          <SelectItem value="Brake Pads Change">Brake Pads Change</SelectItem>
                          <SelectItem value="Oil + Filter">Oil + Filter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="performedAt">Date Performed *</Label>
                      <Input id="performedAt" name="performedAt" type="date" required className="input-client" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea id="description" name="description" rows={3} required placeholder="Describe the maintenance work performed..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4 input-client">
                    <div>
                      <Label htmlFor="garageLocation">Garage Location</Label>
                      <Input id="garageLocation" name="garageLocation" placeholder="e.g., Downtown Auto Center" className="input-client" />
                    </div>
                    <div>
                      <Label htmlFor="performedBy">Performed By</Label>
                      <Input id="performedBy" name="performedBy" placeholder="Technician name" className="input-client" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 input-client">
                    <div>
                      <Label htmlFor="garageEntryDate">Garage Entry Date</Label>
                      <Input id="garageEntryDate" name="garageEntryDate" type="date" className="input-client" />
                    </div>
                    <div>
                      <Label htmlFor="garageExitDate">Garage Exit Date</Label>
                      <Input id="garageExitDate" name="garageExitDate" type="date" className="input-client" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 input-client">
                    <div>
                      <Label htmlFor="mileageAtService">
                        Kilometer Reading
                        {autoFilledKm && <span className="text-xs text-muted-foreground ml-2 input-client">(Auto-filled from last rental)</span>}
                      </Label>
                      <Input 
                        id="mileageAtService" 
                        name="mileageAtService" 
                        type="number" 
                        min="0" 
                        placeholder="e.g., 45000"
                        defaultValue={autoFilledKm || undefined}
                        key={autoFilledKm || 'empty'} // Force re-render when autoFilledKm changes className="input-client"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost ($)</Label>
                      <Input id="cost" name="cost" type="number" step="0.01" min="0" placeholder="0.00" className="input-client" />
                    </div>
                    <div>
                      <Label htmlFor="kmDueMaintenance">KM Due for Maintenance</Label>
                      <Input id="kmDueMaintenance" name="kmDueMaintenance" type="number" min="0" placeholder="e.g., 50000" className="input-client" />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addMaintenanceMutation.isPending}>
                      {addMaintenanceMutation.isPending ? "Adding..." : "Add Record"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Vehicle List with Maintenance Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 input-client">
            {vehicles?.map((vehicle) => (
              <Card key={vehicle.id} className="bg-white shadow-sm hover:shadow-md transition-shadow input-client">
                <CardHeader>
                  <div className="flex justify-between items-start input-client">
                    <div>
                      <CardTitle className="text-lg font-bold input-client">{vehicle.plateNumber}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1 input-client">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </p>
                    </div>
                    <Badge className={vehicle.status === "Maintenance" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"}>
                      {vehicle.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 input-client">
                  <div className="text-sm space-y-2 input-client">
                    <div className="flex items-center gap-2 text-gray-600 input-client">
                      <Gauge className="h-4 w-4 input-client" />
                      <span>Current: {vehicle.mileage || 0} km</span>
                    </div>
                    {(vehicle as any).totalMaintenanceCost && parseFloat((vehicle as any).totalMaintenanceCost) > 0 && (
                      <div className="flex items-center gap-2 text-gray-900 font-semibold input-client">
                        <span className="text-blue-600 input-client">💰</span>
                        <span>Total Maintenance: ${(vehicle as any).totalMaintenanceCost}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full input-client"
                    onClick={() => setViewingHistory(vehicle.id)}
                  >
                    <Wrench className="mr-2 h-4 w-4 input-client" />
                    View Maintenance History
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Edit Maintenance Record Dialog */}
          {editingRecordId && (
            <Dialog open={editingRecordId !== null} onOpenChange={() => {
              setEditingRecordId(null);
              setEditFormData({});
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto input-client">
                <DialogHeader>
                  <DialogTitle>Edit Maintenance Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 input-client">
                  <div className="grid grid-cols-2 gap-4 input-client">
                    <div>
                      <Label htmlFor="edit-maintenanceType">Maintenance Type *</Label>
                      <Select 
                        value={editFormData.maintenanceType} 
                        onValueChange={(value) => setEditFormData({...editFormData, maintenanceType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Routine">Routine</SelectItem>
                          <SelectItem value="Repair">Repair</SelectItem>
                          <SelectItem value="Inspection">Inspection</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                          <SelectItem value="Oil Change">Oil Change</SelectItem>
                          <SelectItem value="Brake Pads Change">Brake Pads Change</SelectItem>
                          <SelectItem value="Oil + Filter">Oil + Filter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-performedAt">Date Performed *</Label>
                      <Input 
                        id="edit-performedAt" 
                        type="date" 
                        value={editFormData.performedAt} 
                        onChange={(e) => setEditFormData({...editFormData, performedAt: e.target.value})}
                        className="input-client" 
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Description *</Label>
                    <Textarea 
                      id="edit-description" 
                      rows={3} 
                      value={editFormData.description} 
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      placeholder="Describe the maintenance work performed..." 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 input-client">
                    <div>
                      <Label htmlFor="edit-garageLocation">Garage Location</Label>
                      <Input 
                        id="edit-garageLocation" 
                        value={editFormData.garageLocation} 
                        onChange={(e) => setEditFormData({...editFormData, garageLocation: e.target.value})}
                        placeholder="e.g., Downtown Auto Center" 
                        className="input-client" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-performedBy">Performed By</Label>
                      <Input 
                        id="edit-performedBy" 
                        value={editFormData.performedBy} 
                        onChange={(e) => setEditFormData({...editFormData, performedBy: e.target.value})}
                        placeholder="Technician name" 
                        className="input-client" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 input-client">
                    <div>
                      <Label htmlFor="edit-garageEntryDate">Garage Entry Date</Label>
                      <Input 
                        id="edit-garageEntryDate" 
                        type="date" 
                        value={editFormData.garageEntryDate} 
                        onChange={(e) => setEditFormData({...editFormData, garageEntryDate: e.target.value})}
                        className="input-client" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-garageExitDate">Garage Exit Date</Label>
                      <Input 
                        id="edit-garageExitDate" 
                        type="date" 
                        value={editFormData.garageExitDate} 
                        onChange={(e) => setEditFormData({...editFormData, garageExitDate: e.target.value})}
                        className="input-client" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 input-client">
                    <div>
                      <Label htmlFor="edit-mileageAtService">Kilometer Reading</Label>
                      <Input 
                        id="edit-mileageAtService" 
                        type="number" 
                        min="0" 
                        value={editFormData.mileageAtService} 
                        onChange={(e) => setEditFormData({...editFormData, mileageAtService: e.target.value})}
                        placeholder="e.g., 45000"
                        className="input-client"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-cost">Cost ($)</Label>
                      <Input 
                        id="edit-cost" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        value={editFormData.cost} 
                        onChange={(e) => setEditFormData({...editFormData, cost: e.target.value})}
                        placeholder="0.00" 
                        className="input-client" 
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingRecordId(null);
                      setEditFormData({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleSaveEdit}
                    disabled={updateMaintenanceMutation.isPending}
                  >
                    {updateMaintenanceMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Maintenance History Dialog */}
          {viewingHistory && (
            <Dialog open={viewingHistory !== null} onOpenChange={() => setViewingHistory(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto input-client">
                <DialogHeader>
                  <DialogTitle>
                    Maintenance History - {vehicles?.find(v => v.id === viewingHistory)?.plateNumber}
                  </DialogTitle>
                </DialogHeader>
                
                {/* Total Cost Summary */}
                {maintenanceRecords && maintenanceRecords.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 input-client">
                    <div className="flex items-center justify-between input-client">
                      <div className="flex items-center gap-2 input-client">
                        <span className="text-2xl input-client">💰</span>
                        <span className="text-sm font-medium text-gray-600 input-client">Total Maintenance Cost</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600 input-client">
                        ${maintenanceRecords.reduce((sum, record) => {
                          const cost = record.cost ? parseFloat(record.cost.toString()) : 0;
                          return sum + cost;
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 input-client">
                      Based on {maintenanceRecords.length} maintenance record{maintenanceRecords.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 input-client">
                  {maintenanceRecords && maintenanceRecords.length > 0 ? (
                    maintenanceRecords.map((record) => (
                      <Card key={record.id} className="bg-gray-50 input-client">
                        <CardContent className="pt-6 input-client">
                          <div className="flex justify-between items-start mb-4 input-client">
                            <Badge className={getMaintenanceTypeColor(record.maintenanceType)}>
                              {record.maintenanceType}
                            </Badge>
                            <div className="flex items-center gap-2 input-client">
                              <span className="text-sm text-gray-600 input-client">
                                {new Date(record.performedAt).toLocaleDateString()}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditRecord(record)}
                                className="h-8 w-8 p-0 input-client"
                              >
                                <Edit className="h-4 w-4 input-client" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRecord(record.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 input-client"
                              >
                                <Trash2 className="h-4 w-4 input-client" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-gray-900 font-medium mb-3 input-client">{record.description}</p>

                          <div className="grid grid-cols-2 gap-4 text-sm input-client">
                            {record.garageLocation && (
                              <div className="flex items-center gap-2 text-gray-600 input-client">
                                <MapPin className="h-4 w-4 input-client" />
                                <span>{record.garageLocation}</span>
                              </div>
                            )}
                            {record.mileageAtService && (
                              <div className="flex items-center gap-2 text-gray-600 input-client">
                                <Gauge className="h-4 w-4 input-client" />
                                <span>{record.mileageAtService} km</span>
                              </div>
                            )}
                            {record.cost && (
                              <div className="flex items-center gap-2 text-gray-600 input-client">
                                <DollarSign className="h-4 w-4 input-client" />
                                <span>${record.cost}</span>
                              </div>
                            )}
                            {record.performedBy && (
                              <div className="flex items-center gap-2 text-gray-600 input-client">
                                <Wrench className="h-4 w-4 input-client" />
                                <span>{record.performedBy}</span>
                              </div>
                            )}
                            {record.kmDueMaintenance && (
                              <div className="flex items-center gap-2 text-gray-600 input-client">
                                <Gauge className="h-4 w-4 input-client" />
                                <span>Next service at: {record.kmDueMaintenance} km</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 input-client">
                      <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4 input-client" />
                      <p className="text-gray-600 input-client">No maintenance records yet</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
    </SidebarLayout>
  );
}
