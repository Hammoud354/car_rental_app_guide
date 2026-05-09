import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Car, Calendar, DollarSign, FileText, Wrench, Plus, Trash2, Edit, Shield, ClipboardList, Fuel, Settings2, TrendingUp, Tag } from "lucide-react";
import { VehicleImageUpload, VehicleImageGallery } from "@/components/VehicleImageUpload";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ModernDatePicker } from "@/components/ModernDatePicker";
import { useTranslation } from "react-i18next";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

function InfoSection({ title, icon: Icon, children, className }: { title: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VehicleDetails() {
  const { t } = useTranslation();
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

  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [maintenanceType, setMaintenanceType] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [serviceDate, setServiceDate] = useState<Date | undefined>(new Date());
  const [performedBy, setPerformedBy] = useState("");
  const [garageLocation, setGarageLocation] = useState("");
  const [mileageAtService, setMileageAtService] = useState("");
  const [kmDueMaintenance, setKmDueMaintenance] = useState("");

  const resetMaintenanceForm = () => {
    setEditingRecordId(null);
    setMaintenanceType("");
    setDescription("");
    setCost("");
    setServiceDate(new Date());
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
    setServiceDate(new Date(record.performedAt));
    setPerformedBy(record.performedBy || "");
    setGarageLocation(record.garageLocation || "");
    setMileageAtService(record.mileageAtService?.toString() || "");
    setKmDueMaintenance(record.kmDueMaintenance?.toString() || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddMaintenance = () => {
    if (!maintenanceType || !cost || !serviceDate) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingRecordId) {
      updateMaintenance.mutate({
        id: editingRecordId,
        maintenanceType: maintenanceType as any,
        description: description || undefined,
        cost: cost || undefined,
        performedAt: new Date(serviceDate),
        performedBy: performedBy || undefined,
        garageLocation: garageLocation || undefined,
        mileageAtService: mileageAtService ? parseInt(mileageAtService) : undefined,
        kmDueForNextMaintenance: kmDueMaintenance ? parseInt(kmDueMaintenance) : undefined,
      });
    } else {
      createMaintenance.mutate({
        vehicleId,
        maintenanceType: maintenanceType as any,
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Vehicle Not Found</h2>
        <Button onClick={() => setLocation("/fleet-management")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fleet
        </Button>
      </div>
    );
  }

  const v = vehicle as any;

  const statusColors: Record<string, string> = {
    Available: "bg-emerald-500",
    Rented: "bg-blue-500",
    Maintenance: "bg-yellow-500",
    "Out of Service": "bg-red-500",
    Sold: "bg-purple-500",
  };

  const totalMaintenanceCost = maintenanceRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.cost as string) || 0), 0);
  const lastService = maintenanceRecords.length > 0
    ? [...maintenanceRecords].sort((a: any, b: any) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0]
    : null;

  const hasPurchaseDetails = v.purchaseCost || v.purchaseType || v.sellerName || v.purchaseDate;
  const hasSaleDetails = v.status === "Sold" || v.salePrice || v.buyerName || v.saleDate;
  const hasHighSeasonRates = v.highSeasonDailyRate || v.highSeasonWeeklyRate || v.highSeasonMonthlyRate;
  const hasAiData = v.averageDailyKm || v.usagePattern || v.climate || v.nextMaintenanceDate || v.nextMaintenanceKm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/fleet-management")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-sm text-muted-foreground">
              {vehicle.year} · {vehicle.plateNumber}
              {v.vehicleRegistrationNumber && <span> · Reg# {v.vehicleRegistrationNumber}</span>}
            </p>
          </div>
        </div>
        <Badge className={statusColors[vehicle.status] || "bg-gray-400"}>
          {vehicle.status}
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance ({maintenanceRecords.length})</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">

          {/* Row 1: Vehicle Info + Rental Rates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InfoSection title="Vehicle Information" icon={Car}>
              <InfoRow label="Plate Number" value={vehicle.plateNumber} />
              <InfoRow label="Registration Number" value={v.vehicleRegistrationNumber} />
              <InfoRow label="VIN" value={vehicle.vin} />
              <InfoRow label="Year" value={vehicle.year} />
              <InfoRow label="Color" value={vehicle.color} />
              <InfoRow label="Category" value={vehicle.category} />
              <InfoRow label="Engine Type" value={v.engineType} />
              <InfoRow label="Fuel Type" value={v.fuelType} />
              <InfoRow label="Transmission" value={v.transmission} />
              <InfoRow label="Engine Size" value={v.engineSize} />
              <div className="col-span-2">
                <InfoRow label="Mileage" value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "0 km"} />
              </div>
            </InfoSection>

            <InfoSection title="Rental Rates" icon={DollarSign}>
              <InfoRow label="Daily Rate" value={vehicle.dailyRate ? `$${vehicle.dailyRate}` : undefined} />
              <InfoRow label="Weekly Rate" value={vehicle.weeklyRate ? `$${vehicle.weeklyRate}` : undefined} />
              <InfoRow label="Monthly Rate" value={vehicle.monthlyRate ? `$${vehicle.monthlyRate}` : undefined} />
              {hasHighSeasonRates && (
                <>
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mt-2 mb-2">High Season Rates</p>
                  </div>
                  <InfoRow label="HS Daily Rate" value={v.highSeasonDailyRate ? `$${v.highSeasonDailyRate}` : undefined} />
                  <InfoRow label="HS Weekly Rate" value={v.highSeasonWeeklyRate ? `$${v.highSeasonWeeklyRate}` : undefined} />
                  <InfoRow label="HS Monthly Rate" value={v.highSeasonMonthlyRate ? `$${v.highSeasonMonthlyRate}` : undefined} />
                </>
              )}
            </InfoSection>
          </div>

          {/* Row 2: Insurance + Registration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InfoSection title="Insurance" icon={Shield}>
              <InfoRow label="Provider" value={v.insuranceProvider} />
              <InfoRow label="Policy Number" value={vehicle.insurancePolicyNumber} />
              <InfoRow label="Start Date" value={v.insurancePolicyStartDate ? new Date(v.insurancePolicyStartDate).toLocaleDateString() : undefined} />
              <InfoRow
                label="Expiry Date"
                value={vehicle.insuranceExpiryDate ? new Date(vehicle.insuranceExpiryDate).toLocaleDateString() : undefined}
              />
              <InfoRow label="Annual Premium" value={v.insuranceAnnualPremium ? `$${v.insuranceAnnualPremium}` : undefined} />
              <InfoRow label="Insurance Cost" value={v.insuranceCost ? `$${v.insuranceCost}` : undefined} />
            </InfoSection>

            <InfoSection title="Registration" icon={ClipboardList}>
              <InfoRow label="Registration Number" value={v.vehicleRegistrationNumber} />
              <InfoRow
                label="Expiry Date"
                value={v.registrationExpiryDate ? new Date(v.registrationExpiryDate).toLocaleDateString() : undefined}
              />
              <InfoRow label="Annual Fee" value={v.registrationFee ? `$${v.registrationFee}` : undefined} />
            </InfoSection>
          </div>

          {/* Row 3: Purchase Details (if any) */}
          {hasPurchaseDetails && (
            <InfoSection title="Purchase Details" icon={Tag}>
              <InfoRow label="Purchase Type" value={v.purchaseType} />
              <InfoRow label="Purchase Cost" value={v.purchaseCost ? `$${parseFloat(v.purchaseCost).toLocaleString()}` : undefined} />
              <InfoRow label="Purchase Date" value={v.purchaseDate ? new Date(v.purchaseDate).toLocaleDateString() : undefined} />
              <InfoRow label="Seller Name" value={v.sellerName} />
              {v.purchaseType === "Installments" && (
                <>
                  <InfoRow label="Down Payment" value={v.downPayment ? `$${v.downPayment}` : undefined} />
                  <InfoRow label="Interest Rate" value={v.interestRate ? `${v.interestRate}%` : undefined} />
                  <InfoRow label="Monthly Installment" value={v.monthlyInstallmentAmount ? `$${v.monthlyInstallmentAmount}` : undefined} />
                  <InfoRow label="Number of Installments" value={v.numberOfInstallments} />
                  <InfoRow label="Remaining Balance" value={v.remainingBalance ? `$${v.remainingBalance}` : undefined} />
                </>
              )}
            </InfoSection>
          )}

          {/* Row 4: Sale Details (if sold) */}
          {hasSaleDetails && (
            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-purple-800">
                  <DollarSign className="h-4 w-4" />
                  Sale Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <InfoRow label="Sale Price" value={v.salePrice ? `$${parseFloat(v.salePrice).toLocaleString()}` : undefined} />
                  <InfoRow label="Sale Date" value={v.saleDate ? new Date(v.saleDate).toLocaleDateString() : undefined} />
                  <InfoRow label="Buyer Name" value={v.buyerName} />
                  {v.saleNotes && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-0.5">Sale Notes</p>
                      <p className="text-sm">{v.saleNotes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Row 5: Maintenance & Usage (if any) */}
          {(hasAiData || v.lastServiceDate || v.lastServiceKm) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(v.nextMaintenanceDate || v.nextMaintenanceKm || v.lastServiceDate || v.lastServiceKm) && (
                <InfoSection title="Maintenance Schedule" icon={Wrench}>
                  <InfoRow label="Next Maintenance Date" value={v.nextMaintenanceDate ? new Date(v.nextMaintenanceDate).toLocaleDateString() : undefined} />
                  <InfoRow label="Next Maintenance at (km)" value={v.nextMaintenanceKm ? `${v.nextMaintenanceKm.toLocaleString()} km` : undefined} />
                  <InfoRow label="Last Service Date" value={v.lastServiceDate ? new Date(v.lastServiceDate).toLocaleDateString() : undefined} />
                  <InfoRow label="Last Service (km)" value={v.lastServiceKm ? `${v.lastServiceKm.toLocaleString()} km` : undefined} />
                  <InfoRow label="Maintenance Interval" value={v.maintenanceIntervalKm ? `Every ${v.maintenanceIntervalKm.toLocaleString()} km` : undefined} />
                </InfoSection>
              )}
              {(v.averageDailyKm || v.usagePattern || v.climate) && (
                <InfoSection title="Usage Profile" icon={TrendingUp}>
                  <InfoRow label="Avg Daily KM" value={v.averageDailyKm ? `${v.averageDailyKm} km/day` : undefined} />
                  <InfoRow label="Primary Use" value={v.usagePattern} />
                  <InfoRow label="Operating Climate" value={v.climate} />
                </InfoSection>
              )}
            </div>
          )}

          {/* Maintenance Summary Stats */}
          {maintenanceRecords.length > 0 && (
            <InfoSection title="Maintenance Summary" icon={Settings2}>
              <InfoRow label="Total Services" value={maintenanceRecords.length} />
              <InfoRow label="Total Cost" value={`$${totalMaintenanceCost.toFixed(2)}`} />
              <InfoRow label="Last Service" value={lastService ? new Date(lastService.performedAt).toLocaleDateString() : undefined} />
              <InfoRow label="Last Service Type" value={(lastService as any)?.maintenanceType} />
              <InfoRow label="Last Service Mileage" value={(lastService as any)?.mileageAtService ? `${(lastService as any).mileageAtService.toLocaleString()} km` : undefined} />
            </InfoSection>
          )}

          {/* Notes */}
          {vehicle.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vehicle.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Maintenance Records Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add/Edit Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {editingRecordId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {editingRecordId ? "Edit Maintenance Record" : "Add Maintenance Record"}
                  </CardTitle>
                  {editingRecordId && (
                    <Button variant="ghost" size="sm" onClick={resetMaintenanceForm} className="mt-2">
                      Cancel Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type *</Label>
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
                      <Label>Cost ($) *</Label>
                      <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Service Date *</Label>
                      <ModernDatePicker date={serviceDate} onDateChange={setServiceDate} placeholder="Select service date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mileage (km)</Label>
                      <Input type="number" value={mileageAtService} onChange={(e) => setMileageAtService(e.target.value)} placeholder="Current mileage" />
                    </div>
                    <div className="space-y-2">
                      <Label>Performed By</Label>
                      <Input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} placeholder="Mechanic/Garage name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Garage Location</Label>
                      <Input value={garageLocation} onChange={(e) => setGarageLocation(e.target.value)} placeholder="City or address" />
                    </div>
                    <div className="space-y-2">
                      <Label>Next Service (km)</Label>
                      <Input type="number" value={kmDueMaintenance} onChange={(e) => setKmDueMaintenance(e.target.value)} placeholder="KM for next service" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details about the maintenance work..." rows={3} />
                  </div>
                  <Button onClick={handleAddMaintenance} disabled={createMaintenance.isPending || updateMaintenance.isPending} className="w-full">
                    {(createMaintenance.isPending || updateMaintenance.isPending) ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{editingRecordId ? "Updating..." : "Adding..."}</>
                    ) : (
                      <>{editingRecordId ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{editingRecordId ? "Update Record" : "Add Maintenance Record"}</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Summary
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
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">Last Service</p>
                      <p className="font-medium">{new Date((lastService as any).performedAt).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground mt-1">{(lastService as any).maintenanceType}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* History */}
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
                  {[...maintenanceRecords]
                    .sort((a: any, b: any) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
                    .map((record: any) => (
                      <div key={record.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">{record.maintenanceType}</Badge>
                            <span className="text-sm text-muted-foreground">{new Date(record.performedAt).toLocaleDateString()}</span>
                            <span className="font-semibold text-primary">${record.cost ? parseFloat(record.cost).toFixed(2) : "0.00"}</span>
                          </div>
                          {record.description && <p className="text-sm text-muted-foreground mb-2">{record.description}</p>}
                          <div className="flex flex-wrap gap-4 text-sm">
                            {record.mileageAtService && <span className="text-muted-foreground">📍 {record.mileageAtService.toLocaleString()} km</span>}
                            {record.performedBy && <span className="text-muted-foreground">👤 {record.performedBy}</span>}
                            {record.garageLocation && <span className="text-muted-foreground">🏪 {record.garageLocation}</span>}
                            {record.kmDueMaintenance && <span className="text-muted-foreground">⏭️ Next at {record.kmDueMaintenance.toLocaleString()} km</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditRecord(record)} className="text-primary hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { if (confirm("Delete this maintenance record?")) deleteMaintenance.mutate({ id: record.id }); }}
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
                    <VehicleImageUpload vehicleId={vehicleId} imageType="exterior" />
                    <VehicleImageUpload vehicleId={vehicleId} imageType="interior" />
                  </div>
                </TabsContent>
                <TabsContent value="exterior" className="space-y-4">
                  <VehicleImageGallery vehicleId={vehicleId} imageType="exterior" />
                  <VehicleImageUpload vehicleId={vehicleId} imageType="exterior" />
                </TabsContent>
                <TabsContent value="interior" className="space-y-4">
                  <VehicleImageGallery vehicleId={vehicleId} imageType="interior" />
                  <VehicleImageUpload vehicleId={vehicleId} imageType="interior" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
