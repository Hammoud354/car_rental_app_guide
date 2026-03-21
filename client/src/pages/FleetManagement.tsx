
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Wrench, Calendar, Car, Search, X, Upload, Download, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserFilter } from "@/contexts/UserFilterContext";
import { SearchableSelect } from "@/components/SearchableSelect";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { exportVehiclesToCSV } from "@shared/csvExport";
import { ModernDatePicker } from "@/components/ModernDatePicker";

export default function FleetManagement() {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const { selectedUserId: selectedTargetUserId, setSelectedUserId: setSelectedTargetUserId, isSuperAdmin } = useUserFilter();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Send to Maintenance dialog
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<any>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    garage: "",
    type: "",
    mileage: "",
    notes: "",
  });
  const [maintenanceEntryDate, setMaintenanceEntryDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriptionLimitError, setSubscriptionLimitError] = useState<{ show: boolean; message: string; limit?: number; current?: number }>({ show: false, message: "" });
  
  // Car maker and model state for Add form
  const [selectedMakerId, setSelectedMakerId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [makerOpen, setMakerOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  
  // Car maker and model state for Edit form
  const [editSelectedMakerId, setEditSelectedMakerId] = useState<number | null>(null);
  const [editSelectedModelId, setEditSelectedModelId] = useState<number | null>(null);
  const [editMakerOpen, setEditMakerOpen] = useState(false);
  const [editModelOpen, setEditModelOpen] = useState(false);
  
  // Custom maker/model dialog states
  const [isCustomMakerDialogOpen, setIsCustomMakerDialogOpen] = useState(false);
  const [isCustomModelDialogOpen, setIsCustomModelDialogOpen] = useState(false);
  const [customMakerName, setCustomMakerName] = useState("");
  const [customModelName, setCustomModelName] = useState("");
  const [customModelMakerId, setCustomModelMakerId] = useState<number | null>(null);
  
  // Insurance date states
  const [insuranceStartDate, setInsuranceStartDate] = useState<Date | undefined>();
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<Date | undefined>();
  const [editInsuranceStartDate, setEditInsuranceStartDate] = useState<Date | undefined>();
  const [editInsuranceExpiryDate, setEditInsuranceExpiryDate] = useState<Date | undefined>();
  
  // Registration expiry date states
  const [registrationExpiryDate, setRegistrationExpiryDate] = useState<Date | undefined>();
  const [editRegistrationExpiryDate, setEditRegistrationExpiryDate] = useState<Date | undefined>();

  // Additional date states
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<Date | undefined>();
  const [editNextMaintenanceDate, setEditNextMaintenanceDate] = useState<Date | undefined>();
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [editPurchaseDate, setEditPurchaseDate] = useState<Date | undefined>();
  const [lastServiceDate, setLastServiceDate] = useState<Date | undefined>();
  const [editLastServiceDate, setEditLastServiceDate] = useState<Date | undefined>();

  const { data: vehicles, isLoading } = trpc.fleet.list.useQuery(
    selectedTargetUserId ? { filterUserId: selectedTargetUserId } : undefined
  );
  
  // Fetch all users for Super Admin
  const { data: allUsers } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: isSuperAdmin,
  });
  
  // Fetch car makers (using Lebanon as default country - should be from user context)
  const { data: carMakers } = trpc.carMakers.getByCountry.useQuery({ country: "Lebanon" });
  
  // Fetch car models based on selected maker for Add form
  const { data: carModels } = trpc.carMakers.getModelsByMaker.useQuery(
    { makerId: selectedMakerId! },
    { enabled: selectedMakerId !== null }
  );
  
  // Fetch car models based on selected maker for Edit form
  const { data: editCarModels } = trpc.carMakers.getModelsByMaker.useQuery(
    { makerId: editSelectedMakerId! },
    { enabled: editSelectedMakerId !== null }
  );
  
  // Initialize edit form maker/model when vehicle is selected
  useEffect(() => {
    if (selectedVehicle && carMakers) {
      const maker = carMakers.find(m => m.name === selectedVehicle.brand);
      if (maker) {
        setEditSelectedMakerId(maker.id);
      }
    }
  }, [selectedVehicle, carMakers]);
  
  // Initialize edit form model when maker is set and models are loaded
  useEffect(() => {
    if (selectedVehicle && editCarModels && editSelectedMakerId) {
      const model = editCarModels.find(m => m.modelName === selectedVehicle.model);
      if (model) {
        setEditSelectedModelId(model.id);
      }
    }
  }, [selectedVehicle, editCarModels, editSelectedMakerId]);
  
  // Initialize insurance and registration dates when vehicle is selected for editing
  useEffect(() => {
    if (selectedVehicle) {
      setEditInsuranceStartDate(selectedVehicle.insurancePolicyStartDate ? new Date(selectedVehicle.insurancePolicyStartDate) : undefined);
      setEditInsuranceExpiryDate(selectedVehicle.insuranceExpiryDate ? new Date(selectedVehicle.insuranceExpiryDate) : undefined);
      setEditRegistrationExpiryDate(selectedVehicle.registrationExpiryDate ? new Date(selectedVehicle.registrationExpiryDate) : undefined);
    }
  }, [selectedVehicle]);
  
  // Reset insurance and registration dates when Add dialog closes
  useEffect(() => {
    if (!isAddDialogOpen) {
      setInsuranceStartDate(undefined);
      setInsuranceExpiryDate(undefined);
      setRegistrationExpiryDate(undefined);
    }
  }, [isAddDialogOpen]);
  
  // Filter vehicles based on search query
  const filteredVehicles = vehicles?.filter((vehicle) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      vehicle.plateNumber.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.brand.toLowerCase().includes(query)
    );
  });
  const createMutation = trpc.fleet.create.useMutation({
    onSuccess: () => {
      toast.success("Vehicle added successfully");
      utils.fleet.list.invalidate();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      if (error.message.includes("limit") || error.message.includes("subscription")) {
        const limitMatch = error.message.match(/(\d+)\s*vehicles?/);
        const currentMatch = error.message.match(/have\s+(\d+)/);
        setSubscriptionLimitError({
          show: true,
          message: error.message,
          limit: limitMatch ? parseInt(limitMatch[1]) : undefined,
          current: currentMatch ? parseInt(currentMatch[1]) : undefined,
        });
      } else {
        toast.error(`Failed to add vehicle: ${error.message}`);
      }
    },
  });

  const updateMutation = trpc.fleet.update.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      utils.fleet.list.invalidate();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update vehicle: ${error.message}`);
    },
  });

  const deleteMutation = trpc.fleet.delete.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      utils.fleet.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete vehicle: ${error.message}`);
    },
  });
  
  const createCustomMakerMutation = trpc.carMakers.createCustomMaker.useMutation({
    onSuccess: (newMaker) => {
      toast.success("Custom maker added successfully");
      setIsCustomMakerDialogOpen(false);
      setCustomMakerName("");
      setSelectedMakerId(newMaker.id);
      utils.carMakers.getByCountry.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to add custom maker: ${error.message}`);
    },
  });
  
  const createCustomModelMutation = trpc.carMakers.createCustomModel.useMutation({
    onSuccess: (newModel) => {
      toast.success("Custom model added successfully");
      setIsCustomModelDialogOpen(false);
      setCustomModelName("");
      setSelectedModelId(newModel.id);
      utils.carMakers.getModelsByMaker.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to add custom model: ${error.message}`);
    },
  });
  
  const populateMakersMutation = trpc.carMakers.populateForCountry.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      utils.carMakers.getByCountry.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to populate: ${error.message}`);
    },
  });

  const handleAddVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Get brand and model names from selected IDs
    const selectedMaker = carMakers?.find(m => m.id === selectedMakerId);
    const selectedModel = carModels?.find(m => m.id === selectedModelId);
    
    if (!selectedMaker || !selectedModel) {
      toast.error("Please select both car maker and model");
      return;
    }
    
    // Super Admin can create vehicles for themselves (default) or for selected user
    // No validation needed - will use selectedTargetUserId if set, otherwise defaults to current user
    
    createMutation.mutate({
      plateNumber: formData.get("plateNumber") as string,
      brand: selectedMaker.name,
      model: selectedModel.modelName,
      year: parseInt(formData.get("year") as string),
      color: formData.get("color") as string,
      category: formData.get("category") as any,
      status: (formData.get("status") as any) || "Available",
      dailyRate: formData.get("dailyRate") as string,
      weeklyRate: (formData.get("weeklyRate") as string)?.trim() || undefined,
      monthlyRate: (formData.get("monthlyRate") as string)?.trim() || undefined,
      mileage: formData.get("mileage") ? parseInt(formData.get("mileage") as string) : undefined,
      vin: formData.get("vin") as string || undefined,
      insurancePolicyNumber: formData.get("insurancePolicyNumber") as string || undefined,
      insuranceProvider: formData.get("insuranceProvider") as string || undefined,
      insurancePolicyStartDate: insuranceStartDate,
      insuranceExpiryDate: insuranceExpiryDate,
      insuranceAnnualPremium: (formData.get("insuranceAnnualPremium") as string)?.trim() || undefined,
      insuranceCost: (formData.get("insuranceCost") as string)?.trim() || undefined,
      purchaseCost: (formData.get("purchaseCost") as string)?.trim() || undefined,
      registrationExpiryDate: registrationExpiryDate || (formData.get("registrationExpiryDate") ? new Date(formData.get("registrationExpiryDate") as string) : undefined),
      nextMaintenanceDate: formData.get("nextMaintenanceDate") ? new Date(formData.get("nextMaintenanceDate") as string) : undefined,
      notes: formData.get("notes") as string || undefined,
      targetUserId: selectedTargetUserId || undefined, // For Super Admin to assign to specific user
      // AI Maintenance fields
      engineType: formData.get("engineType") as string || undefined,
      transmissionType: formData.get("transmissionType") as string || undefined,
      fuelType: formData.get("fuelType") as string || undefined,
      purchaseDate: formData.get("purchaseDate") ? new Date(formData.get("purchaseDate") as string) : undefined,
      averageDailyKm: formData.get("averageDailyKm") ? parseInt(formData.get("averageDailyKm") as string) : undefined,
      primaryUse: formData.get("primaryUse") as string || undefined,
      operatingClimate: formData.get("operatingClimate") as string || undefined,
      lastServiceDate: formData.get("lastServiceDate") ? new Date(formData.get("lastServiceDate") as string) : undefined,
      serviceHistory: formData.get("serviceHistory") as string || undefined,
    });
  };

  const handleEditVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Get brand and model names from selected IDs
    const selectedMaker = carMakers?.find(m => m.id === editSelectedMakerId);
    const selectedModel = editCarModels?.find(m => m.id === editSelectedModelId);
    
    if (!selectedMaker || !selectedModel) {
      toast.error("Please select both car maker and model");
      return;
    }
    
    updateMutation.mutate({
      id: selectedVehicle.id,
      data: {
        plateNumber: formData.get("plateNumber") as string,
        brand: selectedMaker.name,
        model: selectedModel.modelName,
        year: parseInt(formData.get("year") as string),
        color: formData.get("color") as string,
        category: formData.get("category") as any,
        dailyRate: formData.get("dailyRate") as string,
        weeklyRate: (formData.get("weeklyRate") as string)?.trim() || undefined,
        monthlyRate: (formData.get("monthlyRate") as string)?.trim() || undefined,
        mileage: formData.get("mileage") ? parseInt(formData.get("mileage") as string) : undefined,
        vin: formData.get("vin") as string || undefined,
        insurancePolicyNumber: formData.get("insurancePolicyNumber") as string || undefined,
        insuranceProvider: formData.get("insuranceProvider") as string || undefined,
        insurancePolicyStartDate: editInsuranceStartDate,
        insuranceExpiryDate: editInsuranceExpiryDate,
      registrationExpiryDate: editRegistrationExpiryDate,
        insuranceAnnualPremium: (formData.get("insuranceAnnualPremium") as string)?.trim() || undefined,
        insuranceCost: (formData.get("insuranceCost") as string)?.trim() || undefined,
        purchaseCost: (formData.get("purchaseCost") as string)?.trim() || undefined,
        notes: formData.get("notes") as string || undefined,
      },
    });
  };

  const handleDeleteVehicle = (id: number) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      deleteMutation.mutate({ id });
    }
  };

  const sendToMaintenanceMutation = trpc.fleet.sendToMaintenance.useMutation({
    onSuccess: () => {
      toast.success("Vehicle sent to maintenance — blocked from rentals");
      utils.fleet.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send vehicle to maintenance");
    },
  });

  const removeFromMaintenanceMutation = trpc.fleet.removeFromMaintenance.useMutation({
    onSuccess: () => {
      toast.success("Vehicle marked as Available");
      utils.fleet.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove vehicle from maintenance");
    },
  });

  const addMaintenanceRecordMutation = trpc.fleet.addMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast.success("Vehicle sent to maintenance — blocked from rentals");
      utils.fleet.list.invalidate();
      setIsMaintenanceDialogOpen(false);
      setMaintenanceVehicle(null);
      setMaintenanceForm({ garage: "", type: "", mileage: "", notes: "" });
      setMaintenanceEntryDate(new Date());
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send vehicle to maintenance");
    },
  });

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

  return (
    <>
      {/* Subscription Limit Error Modal */}
      <AlertDialog open={subscriptionLimitError.show} onOpenChange={(open) => {
        if (!open) {
          setSubscriptionLimitError({ show: false, message: "" });
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <AlertDialogTitle>Subscription Limit Reached</AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription className="space-y-3">
            <p className="text-base">
              You have reached the maximum number of vehicles allowed under your current subscription plan.
            </p>
            {subscriptionLimitError.limit && subscriptionLimitError.current && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-amber-900">
                  Current Usage: {subscriptionLimitError.current} / {subscriptionLimitError.limit} vehicles
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              To add more vehicles, please upgrade your subscription plan to a higher tier.
            </p>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <Link href="/subscription-plans">
              <AlertDialogAction className="bg-primary hover:bg-primary/90">Upgrade Plan</AlertDialogAction>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send to Maintenance Dialog */}
      <Dialog open={isMaintenanceDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsMaintenanceDialogOpen(false);
          setMaintenanceVehicle(null);
        }
      }}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              Send to Maintenance
            </DialogTitle>
            <DialogDescription>
              {maintenanceVehicle && (
                <span className="font-semibold text-foreground">
                  {maintenanceVehicle.plateNumber} — {maintenanceVehicle.brand} {maintenanceVehicle.model}
                </span>
              )}
              <br />
              Fill in the maintenance details. The vehicle will be blocked from new contracts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="maint-garage">Garage / Workshop *</Label>
              <Input
                id="maint-garage"
                placeholder="e.g. Al Baraka Garage"
                value={maintenanceForm.garage}
                onChange={(e) => setMaintenanceForm(f => ({ ...f, garage: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="maint-type">Maintenance Type *</Label>
              <Select
                value={maintenanceForm.type}
                onValueChange={(val) => setMaintenanceForm(f => ({ ...f, type: val }))}
              >
                <SelectTrigger id="maint-type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {["Routine", "Repair", "Inspection", "Emergency", "Oil Change", "Brake Pads Change", "Oil + Filter"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maint-mileage">Current Mileage (km)</Label>
              <Input
                id="maint-mileage"
                type="number"
                placeholder="e.g. 45000"
                value={maintenanceForm.mileage}
                onChange={(e) => setMaintenanceForm(f => ({ ...f, mileage: e.target.value }))}
              />
            </div>

            <div>
              <Label>Entry Date</Label>
              <ModernDatePicker
                value={maintenanceEntryDate}
                onChange={(d) => d && setMaintenanceEntryDate(d)}
                maxYear={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <Label htmlFor="maint-notes">Notes (optional)</Label>
              <Textarea
                id="maint-notes"
                placeholder="Describe the issue or work to be done..."
                rows={3}
                value={maintenanceForm.notes}
                onChange={(e) => setMaintenanceForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!maintenanceForm.garage.trim() || !maintenanceForm.type || addMaintenanceRecordMutation.isPending}
              onClick={() => {
                if (!maintenanceVehicle) return;
                addMaintenanceRecordMutation.mutate({
                  vehicleId: maintenanceVehicle.id,
                  maintenanceType: maintenanceForm.type as any,
                  description: maintenanceForm.notes.trim() || maintenanceForm.type,
                  garageLocation: maintenanceForm.garage.trim(),
                  mileageAtService: maintenanceForm.mileage ? parseInt(maintenanceForm.mileage) : undefined,
                  garageEntryDate: maintenanceEntryDate,
                  performedAt: maintenanceEntryDate,
                  markInMaintenance: true,
                });
              }}
            >
              {addMaintenanceRecordMutation.isPending ? "Sending..." : "Confirm & Send to Garage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        
        {!carMakers || carMakers.length === 0 ? (
          <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div>
              <h3 className="font-semibold text-amber-800 text-sm">No Car Makers Found</h3>
              <p className="text-xs text-amber-600 mt-0.5">Populate car makers and models before adding vehicles.</p>
            </div>
            <Button
              onClick={() => populateMakersMutation.mutate({ country: "Lebanon" })}
              size="sm"
              disabled={populateMakersMutation.isPending}
            >
              {populateMakersMutation.isPending ? "Populating..." : "Populate Car Makers"}
            </Button>
          </div>
        ) : null}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your vehicle inventory and track maintenance</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/maintenance">
              <Button variant="outline" size="sm">
                <Wrench className="mr-1.5 h-3.5 w-3.5" />
                Maintenance
              </Button>
            </Link>
            <BulkImportDialog
              open={isImportDialogOpen}
              onOpenChange={setIsImportDialogOpen}
              type="vehicles"
              onImport={async (data) => {
                const results = await Promise.all(
                  data.map(async (vehicle) => {
                    try {
                      await createMutation.mutateAsync(vehicle);
                      return { success: true };
                    } catch (error: any) {
                      return { success: false, error: error.message };
                    }
                  })
                );
                utils.fleet.list.invalidate();
                return { results };
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (vehicles && vehicles.length > 0) {
                  exportVehiclesToCSV(vehicles);
                } else {
                  toast.error("No vehicles to export");
                }
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setSelectedMakerId(null);
                setSelectedModelId(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  size="sm"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const subscription = await utils.subscription.getCurrentPlan.fetch();
                      if (subscription && vehicles) {
                        const vehicleCount = vehicles.length;
                        const limit = subscription.tier?.maxVehicles;
                        
                        // If limit is null, it means unlimited vehicles
                        if (limit !== null && vehicleCount >= limit) {
                          setSubscriptionLimitError({
                            show: true,
                            message: `You have reached your vehicle limit`,
                            limit,
                            current: vehicleCount
                          });
                          return;
                        }
                      }
                      setIsAddDialogOpen(true);
                    } catch (error) {
                      console.error('Error checking subscription:', error);
                      setIsAddDialogOpen(true);
                    }
                  }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
                <DialogDescription>Enter vehicle details to add it to your fleet.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plateNumber">Plate Number *</Label>
                    <Input id="plateNumber" name="plateNumber" required className="input-client" />
                  </div>
                  <div>
                    <Label htmlFor="vin">VIN</Label>
                    <Input id="vin" name="vin" maxLength={17} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Car Maker *</Label>
                    <Popover open={makerOpen} onOpenChange={setMakerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={makerOpen}
                          className="w-full justify-between"
                        >
                          {selectedMakerId
                            ? carMakers?.find((maker) => maker.id === selectedMakerId)?.name
                            : "Select maker..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search maker..." />
                          <CommandList>
                            <CommandEmpty>No maker found.</CommandEmpty>
                            <CommandGroup>
                              {carMakers?.map((maker) => (
                                <CommandItem
                                  key={maker.id}
                                  value={maker.name}
                                  onSelect={() => {
                                    setSelectedMakerId(maker.id);
                                    setSelectedModelId(null); // Reset model when maker changes
                                    setMakerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedMakerId === maker.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {maker.name}
                                </CommandItem>
                              ))}
                              <CommandItem
                                onSelect={() => {
                                  setMakerOpen(false);
                                  setIsCustomMakerDialogOpen(true);
                                }}
                                className="border-t mt-2 pt-2 text-primary font-medium"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Custom Maker
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Car Model *</Label>
                    <Popover open={modelOpen} onOpenChange={setModelOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={modelOpen}
                          className="w-full justify-between"
                          disabled={!selectedMakerId}
                        >
                          {selectedModelId
                            ? carModels?.find((model) => model.id === selectedModelId)?.modelName
                            : "Select model..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search model..." />
                          <CommandList>
                            <CommandEmpty>No model found.</CommandEmpty>
                            <CommandGroup>
                              {carModels?.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={model.modelName}
                                  onSelect={() => {
                                    setSelectedModelId(model.id);
                                    setModelOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedModelId === model.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {model.modelName}
                                </CommandItem>
                              ))}
                              <CommandItem
                                onSelect={() => {
                                  setModelOpen(false);
                                  setCustomModelMakerId(selectedMakerId);
                                  setIsCustomModelDialogOpen(true);
                                }}
                                className="border-t mt-2 pt-2 text-primary font-medium"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Custom Model
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Input id="year" name="year" type="number" min="1900" max="2100" required className="input-client" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color">Color *</Label>
                    <Input id="color" name="color" required className="input-client" />
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

                <div>
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input id="mileage" name="mileage" type="number" min="0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <Label htmlFor="dailyRate">Daily Rate ($) *</Label>
                    <Input id="dailyRate" name="dailyRate" type="number" step="0.01" min="0" required className="input-client" />
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="weeklyRate">Weekly Rate ($)</Label>
                    <Input id="weeklyRate" name="weeklyRate" type="number" step="0.01" min="0" />
                  </div>
                  <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="monthlyRate">Monthly Rate ($)</Label>
                    <Input id="monthlyRate" name="monthlyRate" type="number" step="0.01" min="0" />
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium text-sm">Insurance Information</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                      <Input id="insuranceProvider" name="insuranceProvider" placeholder="e.g., State Farm, Geico" />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                      <Input id="insurancePolicyNumber" name="insurancePolicyNumber" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <Label>Policy Start Date</Label>
                      <ModernDatePicker
                        date={insuranceStartDate}
                        onDateChange={setInsuranceStartDate}
                        placeholder="Select start date"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Expiry date will be automatically set to 1 year from start date</p>
                    </div>

                    <div className="col-span-1">
                      <Label>Policy Expiry Date (Auto-calculated)</Label>
                      <div className="p-2 bg-muted rounded border border-muted-foreground/20">
                        <p className="text-sm font-medium">
                          {insuranceStartDate 
                            ? new Date(new Date(insuranceStartDate).setFullYear(new Date(insuranceStartDate).getFullYear() + 1)).toLocaleDateString()
                            : 'Select a start date above'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Automatically calculated as 1 year from the policy start date</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="insuranceAnnualPremium">Annual Premium ($)</Label>
                    <Input id="insuranceAnnualPremium" name="insuranceAnnualPremium" type="number" step="0.01" min="0" placeholder="0.00" />
                    <p className="text-xs text-muted-foreground mt-1">You'll be prompted to renew when policy expires</p>
                  </div>
                </div>

                <div>
                  <Label>Registration Expiry Date</Label>
                  <ModernDatePicker
                    date={registrationExpiryDate}
                    onDateChange={setRegistrationExpiryDate}
                    placeholder="Select expiry date"
                  />
                </div>

                <div>
                  <Label>Next Maintenance Date</Label>
                  <ModernDatePicker
                    date={nextMaintenanceDate}
                    onDateChange={setNextMaintenanceDate}
                    placeholder="Select maintenance date"
                  />
                </div>

                <div>
                  <Label htmlFor="purchaseCost">Vehicle Purchase Cost ($)</Label>
                  <Input id="purchaseCost" name="purchaseCost" type="number" step="0.01" min="0" placeholder="0.00" className="input-client" />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>

                {/* AI Maintenance Fields */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold">AI Maintenance Data (Optional)</h3>
                    <span className="text-xs text-muted-foreground">Enables intelligent maintenance scheduling</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="engineType">Engine Type</Label>
                      <Select name="engineType">
                        <SelectTrigger>
                          <SelectValue placeholder="Select engine type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Gasoline">Gasoline</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                          <SelectItem value="Electric">Electric</SelectItem>
                          <SelectItem value="Plug-in Hybrid">Plug-in Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="transmissionType">Transmission</Label>
                      <Select name="transmissionType">
                        <SelectTrigger>
                          <SelectValue placeholder="Select transmission" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Automatic">Automatic</SelectItem>
                          <SelectItem value="CVT">CVT</SelectItem>
                          <SelectItem value="DCT">DCT (Dual Clutch)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="fuelType">Fuel Type</Label>
                      <Select name="fuelType">
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Premium">Premium</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Electric">Electric</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Purchase Date</Label>
                      <ModernDatePicker
                        date={editPurchaseDate}
                        onDateChange={setEditPurchaseDate}
                        placeholder="Select purchase date"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="averageDailyKm">Average Daily KM</Label>
                      <Input id="averageDailyKm" name="averageDailyKm" type="number" min="0" step="1" placeholder="e.g., 50" />
                    </div>
                    
                    <div>
                      <Label htmlFor="primaryUse">Primary Use</Label>
                      <Select name="primaryUse">
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary use" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Rental">Rental</SelectItem>
                          <SelectItem value="Fleet">Fleet</SelectItem>
                          <SelectItem value="Personal">Personal</SelectItem>
                          <SelectItem value="Commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="operatingClimate">Operating Climate</Label>
                      <Select name="operatingClimate">
                        <SelectTrigger>
                          <SelectValue placeholder="Select climate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hot">Hot</SelectItem>
                          <SelectItem value="Cold">Cold</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Humid">Humid</SelectItem>
                          <SelectItem value="Arid">Arid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Last Service Date</Label>
                      <ModernDatePicker
                        date={editLastServiceDate}
                        onDateChange={setEditLastServiceDate}
                        placeholder="Select last service date"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="serviceHistory">Service History Notes</Label>
                    <Textarea 
                      id="serviceHistory" 
                      name="serviceHistory" 
                      rows={2} 
                      placeholder="e.g., Recent oil change, new tires, brake service..."
                    />
                  </div>
                </div>

                <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                    {createMutation.isPending ? "Adding..." : "Add Vehicle"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by plate number or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-500">Loading vehicles...</p>
          </div>
        ) : filteredVehicles && filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{vehicle.plateNumber}</h3>
                      <p className="text-sm text-gray-500">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </p>
                    </div>
                    <Badge className={getStatusColor(vehicle.status)}>{vehicle.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
                    <div>
                      <span className="text-xs text-gray-400">Category</span>
                      <p className="font-medium text-gray-700">{vehicle.category}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Color</span>
                      <p className="font-medium text-gray-700">{vehicle.color}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Daily Rate</span>
                      <p className="font-medium text-gray-700">${vehicle.dailyRate}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Mileage</span>
                      <p className="font-medium text-gray-700">{vehicle.mileage || 0} km</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Link href={`/vehicle/${vehicle.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        <Car className="mr-1.5 h-3 w-3" />
                        Details
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-1.5 h-3 w-3" />
                      Edit
                    </Button>
                    {vehicle.status === "Available" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                        onClick={() => {
                          setMaintenanceVehicle(vehicle);
                          setMaintenanceForm({ garage: "", type: "", mileage: vehicle.mileage?.toString() || "", notes: "" });
                          setMaintenanceEntryDate(new Date());
                          setIsMaintenanceDialogOpen(true);
                        }}
                        title="Send to Maintenance"
                      >
                        <Wrench className="h-3 w-3" />
                      </Button>
                    ) : vehicle.status === "Maintenance" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                        onClick={() => {
                          if (confirm(`Mark ${vehicle.plateNumber} as Available?`)) {
                            removeFromMaintenanceMutation.mutate({ vehicleId: vehicle.id });
                          }
                        }}
                        disabled={removeFromMaintenanceMutation.isPending}
                        title="Remove from Maintenance"
                      >
                        <Wrench className="h-3 w-3" />
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Search className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No Results Found</h3>
            <p className="text-sm text-gray-400 mb-4">No vehicles match "{searchQuery}"</p>
            <Button onClick={() => setSearchQuery("")} variant="outline" size="sm">
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Car className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No Vehicles Yet</h3>
            <p className="text-sm text-gray-400 mb-4">Start by adding your first vehicle to the fleet.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add First Vehicle
            </Button>
          </div>
        )}

        {/* Edit Dialog */}
        {selectedVehicle && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Edit Vehicle</DialogTitle>
                <DialogDescription>Update vehicle information below.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditVehicle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-plateNumber">Plate Number *</Label>
                    <Input id="edit-plateNumber" name="plateNumber" defaultValue={selectedVehicle.plateNumber} required className="input-client" />
                  </div>
                  <div>
                    <Label htmlFor="edit-vin">VIN</Label>
                    <Input id="edit-vin" name="vin" defaultValue={selectedVehicle.vin || ""} maxLength={17} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Car Maker *</Label>
                    <Popover open={editMakerOpen} onOpenChange={setEditMakerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={editMakerOpen}
                          className="w-full justify-between"
                        >
                          {editSelectedMakerId
                            ? carMakers?.find((maker) => maker.id === editSelectedMakerId)?.name
                            : "Select maker..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search maker..." />
                          <CommandList>
                            <CommandEmpty>No maker found.</CommandEmpty>
                            <CommandGroup>
                              {carMakers?.map((maker) => (
                                <CommandItem
                                  key={maker.id}
                                  value={maker.name}
                                  onSelect={() => {
                                    setEditSelectedMakerId(maker.id);
                                    setEditSelectedModelId(null); // Reset model when maker changes
                                    setEditMakerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      editSelectedMakerId === maker.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {maker.name}
                                </CommandItem>
                              ))}
                              <CommandItem
                                onSelect={() => {
                                  setEditMakerOpen(false);
                                  setIsCustomMakerDialogOpen(true);
                                }}
                                className="border-t mt-2 pt-2 text-primary font-medium"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Custom Maker
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Car Model *</Label>
                    <Popover open={editModelOpen} onOpenChange={setEditModelOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={editModelOpen}
                          className="w-full justify-between"
                          disabled={!editSelectedMakerId}
                        >
                          {editSelectedModelId
                            ? editCarModels?.find((model) => model.id === editSelectedModelId)?.modelName
                            : "Select model..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search model..." />
                          <CommandList>
                            <CommandEmpty>No model found.</CommandEmpty>
                            <CommandGroup>
                              {editCarModels?.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={model.modelName}
                                  onSelect={() => {
                                    setEditSelectedModelId(model.id);
                                    setEditModelOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      editSelectedModelId === model.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {model.modelName}
                                </CommandItem>
                              ))}
                              <CommandItem
                                onSelect={() => {
                                  setEditModelOpen(false);
                                  setCustomModelMakerId(editSelectedMakerId);
                                  setIsCustomModelDialogOpen(true);
                                }}
                                className="border-t mt-2 pt-2 text-primary font-medium"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Custom Model
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="edit-year">Year *</Label>
                    <Input id="edit-year" name="year" type="number" defaultValue={selectedVehicle.year} min="1900" max="2100" required className="input-client" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-color">Color *</Label>
                    <Input id="edit-color" name="color" defaultValue={selectedVehicle.color} required className="input-client" />
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

                <div>
                  <Label htmlFor="edit-mileage">Mileage</Label>
                  <Input id="edit-mileage" name="mileage" type="number" defaultValue={selectedVehicle.mileage || 0} min="0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-dailyRate">Daily Rate ($) *</Label>
                    <Input id="edit-dailyRate" name="dailyRate" type="number" step="0.01" defaultValue={selectedVehicle.dailyRate} min="0" required className="input-client" />
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

                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium text-sm">Insurance Information</h4>
                  
                  <div>
                    <Label htmlFor="edit-insuranceProvider">Insurance Provider</Label>
                    <Input id="edit-insuranceProvider" name="insuranceProvider" placeholder="e.g., State Farm, Geico" defaultValue={selectedVehicle.insuranceProvider || ""} />
                  </div>

                  <div>
                    <Label htmlFor="edit-insurancePolicyNumber">Policy Number</Label>
                    <Input id="edit-insurancePolicyNumber" name="insurancePolicyNumber" defaultValue={selectedVehicle.insurancePolicyNumber || ""} />
                  </div>

                  <div>
                    <Label>Policy Start Date</Label>
                    <ModernDatePicker
                      date={editInsuranceStartDate}
                      onDateChange={setEditInsuranceStartDate}
                      placeholder="Select start date"
                    />
                  </div>

                  <div>
                    <Label>Policy Expiry Date</Label>
                    <ModernDatePicker
                      date={editInsuranceExpiryDate}
                      onDateChange={setEditInsuranceExpiryDate}
                      placeholder="Select expiry date"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-insuranceAnnualPremium">Annual Premium ($)</Label>
                    <Input 
                      id="edit-insuranceAnnualPremium" 
                      name="insuranceAnnualPremium" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00" 
                      defaultValue={selectedVehicle.insuranceAnnualPremium || ""}
                    />
                  </div>
                </div>

                <div>
                  <Label>Registration Expiry Date</Label>
                  <ModernDatePicker
                    date={editRegistrationExpiryDate}
                    onDateChange={setEditRegistrationExpiryDate}
                    placeholder="Select expiry date"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-purchaseCost">Vehicle Purchase Cost ($)</Label>
                  <Input id="edit-purchaseCost" name="purchaseCost" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={selectedVehicle.purchaseCost || ""} />
                </div>

                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea id="edit-notes" name="notes" rows={3} defaultValue={selectedVehicle.notes || ""} />
                </div>

                <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                    {updateMutation.isPending ? "Updating..." : "Update Vehicle"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Custom Maker Dialog */}
      <Dialog open={isCustomMakerDialogOpen} onOpenChange={setIsCustomMakerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Car Maker</DialogTitle>
            <DialogDescription>Add a new car manufacturer to the system.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!customMakerName.trim()) {
              toast.error("Please enter a maker name");
              return;
            }
            createCustomMakerMutation.mutate({
              name: customMakerName,
              country: "Lebanon", // Should be from user context
              userId: user?.id, // Pass current user's ID for data isolation
            });
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-maker-name">Maker Name *</Label>
                <Input 
                  id="custom-maker-name" 
                  value={customMakerName}
                  onChange={(e) => setCustomMakerName(e.target.value)}
                  placeholder="e.g., Tesla, BYD, Rivian"
                  required 
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCustomMakerDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomMakerMutation.isPending}>
                {createCustomMakerMutation.isPending ? "Adding..." : "Add Maker"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Custom Model Dialog */}
      <Dialog open={isCustomModelDialogOpen} onOpenChange={setIsCustomModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Car Model</DialogTitle>
            <DialogDescription>Add a new car model for the selected manufacturer.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!customModelName.trim()) {
              toast.error("Please enter a model name");
              return;
            }
            if (!customModelMakerId) {
              toast.error("Please select a maker first");
              return;
            }
            createCustomModelMutation.mutate({
              makerId: customModelMakerId,
              modelName: customModelName,
              userId: user?.id, // Pass current user's ID for data isolation
            });
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-model-maker">Car Maker *</Label>
                <Select 
                  value={customModelMakerId?.toString() || ""}
                  onValueChange={(value) => setCustomModelMakerId(parseInt(value))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select maker" />
                  </SelectTrigger>
                  <SelectContent>
                    {carMakers?.map((maker) => (
                      <SelectItem key={maker.id} value={maker.id.toString()}>
                        {maker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="custom-model-name">Model Name *</Label>
                <Input 
                  id="custom-model-name" 
                  value={customModelName}
                  onChange={(e) => setCustomModelName(e.target.value)}
                  placeholder="e.g., Model S, Seal, R1T"
                  required 
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCustomModelDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomModelMutation.isPending}>
                {createCustomModelMutation.isPending ? "Adding..." : "Add Model"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
    </>
  );
}
