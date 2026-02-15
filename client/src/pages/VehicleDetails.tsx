import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import SidebarLayout from "@/components/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Car, Calendar, DollarSign, FileText, Wrench, Plus, Trash2, Edit } from "lucide-react";
import { VehicleImageUpload, VehicleImageGallery } from "@/components/VehicleImageUpload";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function VehicleDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const vehicleId = parseInt(params.id || "0");
  const { toast } = useToast();

  const { data: vehicle, isLoading } = trpc.fleet.getById.useQuery({ id: vehicleId });
  const { data: maintenanceRecords = [], refetch: refetchMaintenance } = 
    trpc.fleet.getMaintenanceRecords.useQuery({ vehicleId });

  const createMaintenance = trpc.fleet.addMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast({ title: "Maintenance record added successfully" });
      refetchMaintenance();
      resetMaintenanceForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMaintenance = trpc.fleet.deleteMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast({ title: "Maintenance record deleted" });
      refetchMaintenance();
    },
  });

  const updateMaintenance = trpc.fleet.updateMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast({ title: "Maintenance record updated successfully" });
      refetchMaintenance();
      setEditingRecordId(null);
      resetMaintenanceForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Maintenance form state
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [maintenanceType, setMaintenanceType] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [performedBy, setPerformedBy] = useState("");
  const [garageLocation, setGarageLocation] = useState("");
  const [mileageAtService, setMileageAtService] = useState("");
  const [kmDueMaintenance, setKmDueMaintenance] = useState("");

  const resetMaintenanceForm = () => {
    setEditingRecordId(null);
    setMaintenanceType("");
    setDescription("");
    setCost("");
    setServiceDate(new Date().toISOString().split("T")[0]);
    setPerformedBy("");
    setGarageLocation("");
    setMileageAtService("");
    setKmDueMaintenance("");
  };

  const handleEditRecord = (record: any) => {
    setEditingRecordId(record.id);
    setMaintenanceType(record.maintenanceType);
    setDescription(record.description || "");
    setCost(record.cost || "");
    setServiceDate(new Date(record.performedAt).toISOString().split("T")[0]);
    setPerformedBy(record.performedBy || "");
    setGarageLocation(record.garageLocation || "");
    setMileageAtService(record.mileageAtService?.toString() || "");
    setKmDueMaintenance(record.kmDueForNextMaintenance?.toString() || "");
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddMaintenance = () => {
    if (!maintenanceType || !cost || !serviceDate) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (editingRecordId) {
      // Update existing record
      updateMaintenance.mutate({
        id: editingRecordId,
        maintenanceType: maintenanceType as "Routine" | "Repair" | "Inspection" | "Emergency" | "Oil Change" | "Brake Pads Change" | "Oil + Filter",
        description: description || undefined,
        cost: cost || undefined,
        performedAt: new Date(serviceDate),
        performedBy: performedBy || undefined,
        garageLocation: garageLocation || undefined,
        mileageAtService: mileageAtService ? parseInt(mileageAtService) : undefined,
        kmDueForNextMaintenance: kmDueMaintenance ? parseInt(kmDueMaintenance) : undefined,
      });
    } else {
      // Create new record
      createMaintenance.mutate({
        vehicleId,
        maintenanceType: maintenanceType as "Routine" | "Repair" | "Inspection" | "Emergency" | "Oil Change" | "Brake Pads Change" | "Oil + Filter",
        description: description || "",
        cost: cost || undefined,
        performedAt: new Date(serviceDate),
        performedBy: performedBy || undefined,
        garageLocation: garageLocation || undefined,
        mileageAtService: mileageAtService ? parseInt(mileageAtService) : undefined,
        kmDueMaintenance: kmDueMaintenance ? parseInt(kmDueMaintenance) : undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  if (!vehicle) {
    return (
      <SidebarLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Vehicle Not Found</h2>
          <Button onClick={() => setLocation("/fleet-management")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fleet
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  const statusColors = {
    Available: "bg-green-500",
    Rented: "bg-blue-500",
    Maintenance: "bg-yellow-500",
    "Out of Service": "bg-red-500",
  };

  const totalMaintenanceCost = maintenanceRecords.reduce((sum: number, record: any) => sum + (parseFloat(record.cost as string) || 0), 0);
  const lastService = maintenanceRecords.length > 0 
    ? maintenanceRecords.sort((a: any, b: any) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0]
    : null;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/fleet-management")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-muted-foreground">
                {vehicle.year} • {vehicle.plateNumber}
              </p>
            </div>
          </div>
          <Badge className={statusColors[vehicle.status as keyof typeof statusColors]}>
            {vehicle.status}
          </Badge>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance Records</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Vehicle Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Specifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Color</p>
                        <p className="font-medium">{vehicle.color}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">{vehicle.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">VIN</p>
                        <p className="font-medium">{vehicle.vin || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mileage</p>
                        <p className="font-medium">{vehicle.mileage?.toLocaleString() || "0"} km</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Pricing & Insurance */}
              <div className="space-y-6">
                {/* Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Rate</p>
                      <p className="text-2xl font-bold">${vehicle.dailyRate}</p>
                    </div>
                    {vehicle.weeklyRate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Weekly Rate</p>
                        <p className="text-xl font-semibold">${vehicle.weeklyRate}</p>
                      </div>
                    )}
                    {vehicle.monthlyRate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Rate</p>
                        <p className="text-xl font-semibold">${vehicle.monthlyRate}</p>
                      </div>
                    )}
                    {vehicle.purchaseCost && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground">Purchase Cost</p>
                        <p className="text-lg font-medium">${vehicle.purchaseCost}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Insurance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Insurance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Policy Number</p>
                      <p className="font-medium">{vehicle.insurancePolicyNumber || "N/A"}</p>
                    </div>
                    {vehicle.insuranceExpiryDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Expiry Date</p>
                        <p className="font-medium">
                          {new Date(vehicle.insuranceExpiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {vehicle.insuranceCost && (
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Cost</p>
                        <p className="font-medium">${vehicle.insuranceCost}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes */}
                {vehicle.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {vehicle.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Maintenance Records Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Add Maintenance Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {editingRecordId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      {editingRecordId ? "Edit Maintenance Record" : "Add Maintenance Record"}
                    </CardTitle>
                    {editingRecordId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetMaintenanceForm}
                        className="mt-2"
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maintenanceType">Type *</Label>
                        <Select value={maintenanceType} onValueChange={setMaintenanceType}>
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

                      <div className="space-y-2">
                        <Label htmlFor="cost">Cost ($) *</Label>
                        <Input
                          id="cost"
                          type="number"
                          step="0.01"
                          value={cost}
                          onChange={(e) => setCost(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serviceDate">Service Date *</Label>
                        <Input
                          id="serviceDate"
                          type="date"
                          value={serviceDate}
                          onChange={(e) => setServiceDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mileageAtService">Mileage (km)</Label>
                        <Input
                          id="mileageAtService"
                          type="number"
                          value={mileageAtService}
                          onChange={(e) => setMileageAtService(e.target.value)}
                          placeholder="Current mileage"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="performedBy">Performed By</Label>
                        <Input
                          id="performedBy"
                          value={performedBy}
                          onChange={(e) => setPerformedBy(e.target.value)}
                          placeholder="Mechanic/Garage name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="garageLocation">Garage Location</Label>
                        <Input
                          id="garageLocation"
                          value={garageLocation}
                          onChange={(e) => setGarageLocation(e.target.value)}
                          placeholder="City or address"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="kmDueMaintenance">Next Service (km)</Label>
                        <Input
                          id="kmDueMaintenance"
                          type="number"
                          value={kmDueMaintenance}
                          onChange={(e) => setKmDueMaintenance(e.target.value)}
                          placeholder="KM for next service"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Details about the maintenance work..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={handleAddMaintenance} 
                      disabled={createMaintenance.isPending || updateMaintenance.isPending}
                      className="w-full"
                    >
                      {(createMaintenance.isPending || updateMaintenance.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingRecordId ? "Updating..." : "Adding..."}
                        </>
                      ) : (
                        <>
                          {editingRecordId ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                          {editingRecordId ? "Update Maintenance Record" : "Add Maintenance Record"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Summary Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Maintenance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Services</p>
                      <p className="text-2xl font-bold">{maintenanceRecords.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="text-2xl font-bold">${totalMaintenanceCost.toFixed(2)}</p>
                    </div>
                    {lastService && (
                      <>
                        <div className="pt-3 border-t">
                          <p className="text-sm text-muted-foreground">Last Service</p>
                          <p className="font-medium">
                            {new Date(lastService.performedAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{lastService.maintenanceType}</p>
                        </div>
                        {lastService.mileageAtService && (
                          <div>
                            <p className="text-sm text-muted-foreground">Last Service Mileage</p>
                            <p className="font-medium">{lastService.mileageAtService.toLocaleString()} km</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Maintenance History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Maintenance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maintenanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No maintenance records yet</p>
                    <p className="text-sm">Add your first maintenance record above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {maintenanceRecords
                      .sort((a: any, b: any) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
                      .map((record: any) => (
                        <div
                          key={record.id}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">{record.maintenanceType}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(record.performedAt).toLocaleDateString()}
                              </span>
                              <span className="font-semibold text-primary">
                                ${record.cost?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                            {record.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {record.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm">
                              {record.mileageAtService && (
                                <span className="text-muted-foreground">
                                  📍 {record.mileageAtService.toLocaleString()} km
                                </span>
                              )}
                              {record.performedBy && (
                                <span className="text-muted-foreground">
                                  👤 {record.performedBy}
                                </span>
                              )}
                              {record.garageLocation && (
                                <span className="text-muted-foreground">
                                  📍 {record.garageLocation}
                                </span>
                              )}
                              {record.kmDueMaintenance && (
                                <span className="text-muted-foreground">
                                  ⏭️ Next at {record.kmDueMaintenance.toLocaleString()} km
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRecord(record)}
                              className="text-primary hover:text-primary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Delete this maintenance record?")) {
                                  deleteMaintenance.mutate({ id: record.id });
                                }
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All Photos</TabsTrigger>
                    <TabsTrigger value="exterior">Exterior</TabsTrigger>
                    <TabsTrigger value="interior">Interior</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="space-y-4">
                    <VehicleImageGallery vehicleId={vehicleId} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <VehicleImageUpload
                        vehicleId={vehicleId}
                        imageType="exterior"
                      />
                      <VehicleImageUpload
                        vehicleId={vehicleId}
                        imageType="interior"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="exterior" className="space-y-4">
                    <VehicleImageGallery vehicleId={vehicleId} imageType="exterior" />
                    <VehicleImageUpload
                      vehicleId={vehicleId}
                      imageType="exterior"
                    />
                  </TabsContent>
                  
                  <TabsContent value="interior" className="space-y-4">
                    <VehicleImageGallery vehicleId={vehicleId} imageType="interior" />
                    <VehicleImageUpload
                      vehicleId={vehicleId}
                      imageType="interior"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
