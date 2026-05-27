
import { createPortal } from "react-dom";
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
import { Plus, Edit, Trash2, Wrench, Calendar, Car, Search, X, Upload, Download, AlertTriangle, Sun, Pencil, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
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
import { useTranslation } from "react-i18next";

export default function FleetManagement() {
  const { t } = useTranslation();
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
    nextKm: "",
    notes: "",
  });
  const [maintenanceEntryDate, setMaintenanceEntryDate] = useState<Date>(new Date());
  const [maintenanceExitDate, setMaintenanceExitDate] = useState<Date | undefined>(undefined);
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

  // Purchase details state
  const [purchaseType, setPurchaseType] = useState<"Cash" | "Installments" | "">("");
  const [editPurchaseType, setEditPurchaseType] = useState<"Cash" | "Installments" | "">("");
  const [showPurchaseSection, setShowPurchaseSection] = useState(false);
  const [showEditPurchaseSection, setShowEditPurchaseSection] = useState(false);
  const [addPurchaseCost, setAddPurchaseCost] = useState<number>(0);
  const [addDownPayment, setAddDownPayment] = useState<number>(0);
  const [addInterestRate, setAddInterestRate] = useState<number>(0);
  const [addNumInstallments, setAddNumInstallments] = useState<number>(0);
  const [addMonthlyManual, setAddMonthlyManual] = useState<number | null>(null);
  const [editPurchaseCost, setEditPurchaseCost] = useState<number>(0);
  const [editDownPayment, setEditDownPayment] = useState<number>(0);
  const [editInterestRate, setEditInterestRate] = useState<number>(0);
  const [editNumInstallments, setEditNumInstallments] = useState<number>(0);
  const [editMonthlyManual, setEditMonthlyManual] = useState<number | null>(null);

  // Sold/archive state
  const [activeTab, setActiveTab] = useState<"active" | "sold">("active");
  const [isSellConfirmOpen, setIsSellConfirmOpen] = useState(false);
  const [pendingSellData, setPendingSellData] = useState<any>(null);
  const [editStatusValue, setEditStatusValue] = useState<string>("");
  const [editSaleDate, setEditSaleDate] = useState<Date | undefined>();

  // Add vehicle portal – AI section toggle
  const [showAddAiSection, setShowAddAiSection] = useState(false);

  // High season periods state
  const [isHighSeasonDialogOpen, setIsHighSeasonDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [hsName, setHsName] = useState("");
  const [hsStartDate, setHsStartDate] = useState<Date | undefined>();
  const [hsEndDate, setHsEndDate] = useState<Date | undefined>();

  const { data: vehicles, isLoading } = trpc.fleet.list.useQuery(
    selectedTargetUserId ? { filterUserId: selectedTargetUserId } : undefined
  );
  const { data: soldVehicles, isLoading: soldLoading } = trpc.fleet.listSold.useQuery(
    selectedTargetUserId ? { filterUserId: selectedTargetUserId } : undefined
  );

  const { data: highSeasonPeriods, refetch: refetchHighSeason } = trpc.highSeason.list.useQuery(
    selectedTargetUserId ? { filterUserId: selectedTargetUserId } : {}
  );
  const createHighSeasonMutation = trpc.highSeason.create.useMutation({
    onSuccess: () => { toast.success("High season period added"); refetchHighSeason(); resetHsForm(); setIsHighSeasonDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateHighSeasonMutation = trpc.highSeason.update.useMutation({
    onSuccess: () => { toast.success("High season period updated"); refetchHighSeason(); resetHsForm(); setIsHighSeasonDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteHighSeasonMutation = trpc.highSeason.delete.useMutation({
    onSuccess: () => { toast.success("High season period deleted"); refetchHighSeason(); },
    onError: (e) => toast.error(e.message),
  });

  const resetHsForm = () => { setHsName(""); setHsStartDate(undefined); setHsEndDate(undefined); setEditingPeriod(null); };

  const handleHighSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hsStartDate || !hsEndDate) { toast.error("Please select both start and end dates"); return; }
    if (hsEndDate < hsStartDate) { toast.error("End date must be after start date"); return; }
    const startStr = hsStartDate.toISOString().split("T")[0];
    const endStr = hsEndDate.toISOString().split("T")[0];
    if (editingPeriod) {
      updateHighSeasonMutation.mutate({ id: editingPeriod.id, name: hsName, startDate: startStr, endDate: endStr });
    } else {
      createHighSeasonMutation.mutate({ name: hsName, startDate: startStr, endDate: endStr });
    }
  };
  
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
  
  // Initialize insurance, registration, sale dates and status when vehicle is selected for editing
  useEffect(() => {
    if (selectedVehicle) {
      setEditInsuranceStartDate(selectedVehicle.insurancePolicyStartDate ? new Date(selectedVehicle.insurancePolicyStartDate) : undefined);
      setEditInsuranceExpiryDate(selectedVehicle.insuranceExpiryDate ? new Date(selectedVehicle.insuranceExpiryDate) : undefined);
      setEditRegistrationExpiryDate(selectedVehicle.registrationExpiryDate ? new Date(selectedVehicle.registrationExpiryDate) : undefined);
      setEditStatusValue(selectedVehicle.status || "");
      setEditSaleDate((selectedVehicle as any).saleDate ? new Date((selectedVehicle as any).saleDate) : undefined);
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

  const filteredSoldVehicles = soldVehicles?.filter((vehicle) => {
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
      toast.success(t("fleet.vehicleAdded"));
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
      toast.success(t("fleet.vehicleUpdated"));
      utils.fleet.list.invalidate();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update vehicle: ${error.message}`);
    },
  });

  const deleteMutation = trpc.fleet.delete.useMutation({
    onSuccess: () => {
      toast.success(t("fleet.vehicleDeleted"));
      utils.fleet.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete vehicle: ${error.message}`);
    },
  });
  
  const createCustomMakerMutation = trpc.carMakers.createCustomMaker.useMutation({
    onSuccess: (newMaker) => {
      toast.success(t("fleet.customMakerAdded"));
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
      toast.success(t("fleet.customModelAdded"));
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
      toast.error(t("fleet.selectMakerAndModel"));
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
      highSeasonDailyRate: (formData.get("highSeasonDailyRate") as string)?.trim() || undefined,
      highSeasonWeeklyRate: (formData.get("highSeasonWeeklyRate") as string)?.trim() || undefined,
      highSeasonMonthlyRate: (formData.get("highSeasonMonthlyRate") as string)?.trim() || undefined,
      mileage: formData.get("mileage") ? parseInt(formData.get("mileage") as string) : undefined,
      vin: formData.get("vin") as string || undefined,
      insurancePolicyNumber: formData.get("insurancePolicyNumber") as string || undefined,
      insuranceProvider: formData.get("insuranceProvider") as string || undefined,
      insurancePolicyStartDate: insuranceStartDate,
      insuranceExpiryDate: insuranceExpiryDate,
      insuranceAnnualPremium: (formData.get("insuranceAnnualPremium") as string)?.trim() || undefined,
      insuranceCost: (formData.get("insuranceCost") as string)?.trim() || undefined,
      purchaseCost: (formData.get("purchaseCost") as string)?.trim() || undefined,
      purchaseType: (purchaseType || undefined) as any,
      downPayment: (formData.get("downPayment") as string)?.trim() || undefined,
      interestRate: (formData.get("interestRate") as string)?.trim() || undefined,
      monthlyInstallmentAmount: (formData.get("monthlyInstallmentAmount") as string)?.trim() || undefined,
      numberOfInstallments: formData.get("numberOfInstallments") ? parseInt(formData.get("numberOfInstallments") as string) : undefined,
      remainingBalance: (formData.get("remainingBalance") as string)?.trim() || undefined,
      sellerName: (formData.get("sellerName") as string)?.trim() || undefined,
      vehicleRegistrationNumber: (formData.get("vehicleRegistrationNumber") as string)?.trim() || undefined,
      registrationExpiryDate: registrationExpiryDate || (formData.get("registrationExpiryDate") ? new Date(formData.get("registrationExpiryDate") as string) : undefined),
      registrationFee: (formData.get("registrationFee") as string)?.trim() || undefined,
      nextMaintenanceDate: formData.get("nextMaintenanceDate") ? new Date(formData.get("nextMaintenanceDate") as string) : undefined,
      notes: formData.get("notes") as string || undefined,
      targetUserId: selectedTargetUserId || undefined, // For Super Admin to assign to specific user
      // AI Maintenance fields
      engineType: formData.get("engineType") as string || undefined,
      transmissionType: formData.get("transmissionType") as string || undefined,
      fuelType: formData.get("fuelType") as string || undefined,
      purchaseDate: purchaseDate,
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
    
    const selectedMaker = carMakers?.find(m => m.id === editSelectedMakerId);
    const selectedModel = editCarModels?.find(m => m.id === editSelectedModelId);
    
    if (!selectedMaker || !selectedModel) {
      toast.error(t("fleet.selectMakerAndModel"));
      return;
    }

    const newStatus = (formData.get("status") as string) || selectedVehicle.status;

    const vehicleData: any = {
      plateNumber: formData.get("plateNumber") as string,
      brand: selectedMaker.name,
      model: selectedModel.modelName,
      year: parseInt(formData.get("year") as string),
      color: formData.get("color") as string,
      category: formData.get("category") as any,
      status: newStatus as any,
      dailyRate: formData.get("dailyRate") as string,
      weeklyRate: (formData.get("weeklyRate") as string)?.trim() || undefined,
      monthlyRate: (formData.get("monthlyRate") as string)?.trim() || undefined,
      highSeasonDailyRate: (formData.get("highSeasonDailyRate") as string)?.trim() || undefined,
      highSeasonWeeklyRate: (formData.get("highSeasonWeeklyRate") as string)?.trim() || undefined,
      highSeasonMonthlyRate: (formData.get("highSeasonMonthlyRate") as string)?.trim() || undefined,
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
      purchaseType: (editPurchaseType || undefined) as any,
      downPayment: (formData.get("downPayment") as string)?.trim() || undefined,
      interestRate: (formData.get("interestRate") as string)?.trim() || undefined,
      monthlyInstallmentAmount: (formData.get("monthlyInstallmentAmount") as string)?.trim() || undefined,
      numberOfInstallments: formData.get("numberOfInstallments") ? parseInt(formData.get("numberOfInstallments") as string) : undefined,
      remainingBalance: (formData.get("remainingBalance") as string)?.trim() || undefined,
      sellerName: (formData.get("sellerName") as string)?.trim() || undefined,
      vehicleRegistrationNumber: (formData.get("vehicleRegistrationNumber") as string)?.trim() || undefined,
      salePrice: (formData.get("salePrice") as string)?.trim() || undefined,
      saleDate: editSaleDate,
      buyerName: (formData.get("buyerName") as string)?.trim() || undefined,
      saleNotes: (formData.get("saleNotes") as string)?.trim() || undefined,
      registrationFee: (formData.get("registrationFee") as string)?.trim() || undefined,
      notes: formData.get("notes") as string || undefined,
    };

    // Show confirmation when marking as sold for the first time
    if (newStatus === "Sold" && selectedVehicle.status !== "Sold") {
      setPendingSellData(vehicleData);
      setIsSellConfirmOpen(true);
      return;
    }

    updateMutation.mutate({ id: selectedVehicle.id, data: vehicleData });
  };

  const confirmSale = () => {
    if (pendingSellData && selectedVehicle) {
      updateMutation.mutate({ id: selectedVehicle.id, data: pendingSellData });
    }
    setIsSellConfirmOpen(false);
    setPendingSellData(null);
  };

  const handleDeleteVehicle = (id: number) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      deleteMutation.mutate({ id });
    }
  };

  const sendToMaintenanceMutation = trpc.fleet.sendToMaintenance.useMutation({
    onSuccess: () => {
      toast.success(t("fleet.sendToMaintenance"));
      utils.fleet.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || t("fleet.failedSendMaintenance"));
    },
  });

  const removeFromMaintenanceMutation = trpc.fleet.removeFromMaintenance.useMutation({
    onSuccess: () => {
      toast.success(t("fleet.vehicleMarkedAvailable"));
      utils.fleet.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove vehicle from maintenance");
    },
  });

  const addMaintenanceRecordMutation = trpc.fleet.addMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast.success(t("fleet.sendToMaintenance"));
      utils.fleet.list.invalidate();
      setIsMaintenanceDialogOpen(false);
      setMaintenanceVehicle(null);
      setMaintenanceForm({ garage: "", type: "", mileage: "", nextKm: "", notes: "" });
      setMaintenanceEntryDate(new Date());
      setMaintenanceExitDate(undefined);
    },
    onError: (error: any) => {
      toast.error(error.message || t("fleet.failedSendMaintenance"));
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
      case "Sold":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "";
    }
  };

  return (
    <>
      {/* Sell Confirmation Modal */}
      <AlertDialog open={isSellConfirmOpen} onOpenChange={(open) => { if (!open) { setIsSellConfirmOpen(false); setPendingSellData(null); } }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <AlertDialogTitle>Confirm Vehicle Sale</AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription className="space-y-3">
            <p className="text-sm">
              This vehicle will be removed from active fleet operations and moved to archived vehicles.
              All historical records — contracts, maintenance, and revenue — will remain preserved.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-900">
              <p className="font-semibold">{selectedVehicle?.plateNumber} — {selectedVehicle?.brand} {selectedVehicle?.model}</p>
              {pendingSellData?.salePrice && <p className="mt-1">Sale Price: <span className="font-medium">${parseFloat(pendingSellData.salePrice).toLocaleString()}</span></p>}
              {pendingSellData?.buyerName && <p>Buyer: <span className="font-medium">{pendingSellData.buyerName}</span></p>}
              {pendingSellData?.saleDate && <p>Sale Date: <span className="font-medium">{new Date(pendingSellData.saleDate).toLocaleDateString()}</span></p>}
            </div>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsSellConfirmOpen(false); setPendingSellData(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSale}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Confirm Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              {t("fleet.sendToMaintenance")}
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
              <Label htmlFor="maint-garage">{t("fleet.garageWorkshop")} *</Label>
              <Input
                id="maint-garage"
                placeholder="e.g. Al Baraka Garage"
                value={maintenanceForm.garage}
                onChange={(e) => setMaintenanceForm(f => ({ ...f, garage: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="maint-type">{t("fleet.maintenanceType")} *</Label>
              <Select
                value={maintenanceForm.type}
                onValueChange={(val) => setMaintenanceForm(f => ({ ...f, type: val }))}
              >
                <SelectTrigger id="maint-type">
                  <SelectValue placeholder={t("maintenance.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {["Routine", "Repair", "Inspection", "Emergency", "Oil Change", "Brake Pads Change", "Oil + Filter"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="maint-mileage">{t("fleet.currentMileageKm")}</Label>
                <Input
                  id="maint-mileage"
                  type="number"
                  placeholder="e.g. 45000"
                  value={maintenanceForm.mileage}
                  onChange={(e) => setMaintenanceForm(f => ({ ...f, mileage: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="maint-next-km">{t("fleet.nextMaintenanceAt")} <span className="text-muted-foreground font-normal text-xs">({t("common.optional")})</span></Label>
                <Input
                  id="maint-next-km"
                  type="number"
                  placeholder="e.g. 50000"
                  value={maintenanceForm.nextKm}
                  onChange={(e) => setMaintenanceForm(f => ({ ...f, nextKm: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t("fleet.entryDateRequired")} *</Label>
                <ModernDatePicker
                  date={maintenanceEntryDate}
                  onDateChange={(d) => d && setMaintenanceEntryDate(d)}
                  maxYear={new Date().getFullYear() + 2}
                />
              </div>
              <div>
                <Label>{t("fleet.expectedExitDate")}</Label>
                <ModernDatePicker
                  date={maintenanceExitDate}
                  onDateChange={(d) => setMaintenanceExitDate(d)}
                  placeholder={t("common.optional")}
                  maxYear={new Date().getFullYear() + 2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maint-notes">{t("fleet.notesOptional")}</Label>
              <Textarea
                id="maint-notes"
                placeholder={t("fleet.describeIssue")}
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
                  kmDueMaintenance: maintenanceForm.nextKm ? parseInt(maintenanceForm.nextKm) : undefined,
                  garageEntryDate: maintenanceEntryDate,
                  garageExitDate: maintenanceExitDate,
                  performedAt: maintenanceEntryDate,
                  markInMaintenance: true,
                });
              }}
            >
              {addMaintenanceRecordMutation.isPending ? t("common.sending") : t("fleet.confirmSendToGarage")}
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
              {populateMakersMutation.isPending ? t("common.loading") : t("fleet.populateCarMakers")}
            </Button>
          </div>
        ) : null}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("fleet.title")}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t("fleet.subtitle")}</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/maintenance">
              <Button variant="outline" size="sm">
                <Wrench className="mr-1.5 h-3.5 w-3.5" />
                {t("nav.maintenance")}
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
                  toast.error(t("fleet.noVehiclesToExport"));
                }
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            {/* Add Vehicle button — subscription check preserved */}
            <Button
              size="sm"
              onClick={async (e) => {
                e.preventDefault();
                try {
                  const subscription = await utils.subscription.getCurrentPlan.fetch();
                  if (subscription && vehicles) {
                    const vehicleCount = vehicles.length;
                    const limit = subscription.tier?.maxVehicles;
                    if (limit !== null && vehicleCount >= limit) {
                      setSubscriptionLimitError({ show: true, message: `You have reached your vehicle limit`, limit, current: vehicleCount });
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
              {t("fleet.addVehicle")}
            </Button>

            {/* Add Vehicle portal workspace */}
            {isAddDialogOpen && createPortal(
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsAddDialogOpen(false);
                    setSelectedMakerId(null);
                    setSelectedModelId(null);
                  }
                }}
              >
                <div className="relative flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ width: "90vw", height: "90vh" }}>

                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Car className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{t("fleet.addVehicle")}</h2>
                        <p className="text-blue-200 text-xs">{t("fleet.subtitle")}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsAddDialogOpen(false); setSelectedMakerId(null); setSelectedModelId(null); }}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body + Footer */}
                  <form onSubmit={handleAddVehicle} className="flex flex-col flex-1 min-h-0">
                    <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-y-auto sm:overflow-hidden">

                      {/* Left column — Basic Info + Pricing */}
                      <div className="w-full sm:w-[52%] border-b sm:border-b-0 sm:border-r border-gray-100 sm:overflow-y-auto p-6 space-y-5">

                        {/* Basic Info */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Car className="w-4 h-4 text-blue-700" />
                            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{t("fleet.basicInfo")}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="plateNumber">{t("fleet.plateNumber")} *</Label>
                              <Input id="plateNumber" name="plateNumber" required className="input-client mt-1" />
                            </div>
                            <div>
                              <Label htmlFor="vin">VIN</Label>
                              <Input id="vin" name="vin" maxLength={17} className="mt-1" />
                            </div>
                            <div>
                              <Label>{t("fleet.makerBrand")} *</Label>
                              <Popover open={makerOpen} onOpenChange={setMakerOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" role="combobox" aria-expanded={makerOpen} className="w-full justify-between mt-1 overflow-hidden">
                                    {selectedMakerId ? carMakers?.find((m) => m.id === selectedMakerId)?.name : t("fleet.selectMaker")}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[220px] p-0" style={{ zIndex: 9999 }}>
                                  <Command>
                                    <CommandInput placeholder={t("fleet.searchMaker")} />
                                    <CommandList>
                                      <CommandEmpty>{t("common.noData")}</CommandEmpty>
                                      <CommandGroup>
                                        {carMakers?.map((maker) => (
                                          <CommandItem key={maker.id} value={maker.name} onSelect={() => { setSelectedMakerId(maker.id); setSelectedModelId(null); setMakerOpen(false); }}>
                                            <Check className={cn("mr-2 h-4 w-4", selectedMakerId === maker.id ? "opacity-100" : "opacity-0")} />
                                            {maker.name}
                                          </CommandItem>
                                        ))}
                                        <CommandItem onSelect={() => { setMakerOpen(false); setIsCustomMakerDialogOpen(true); }} className="border-t mt-2 pt-2 text-primary font-medium">
                                          <Plus className="mr-2 h-4 w-4" />{t("fleet.addMaker")}
                                        </CommandItem>
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div>
                              <Label>{t("common.model")} *</Label>
                              <Popover open={modelOpen} onOpenChange={setModelOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" role="combobox" aria-expanded={modelOpen} className="w-full justify-between mt-1 overflow-hidden" disabled={!selectedMakerId}>
                                    {selectedModelId ? carModels?.find((m) => m.id === selectedModelId)?.modelName : t("fleet.selectModel")}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[220px] p-0" style={{ zIndex: 9999 }}>
                                  <Command>
                                    <CommandInput placeholder={t("fleet.searchModel")} />
                                    <CommandList>
                                      <CommandEmpty>{t("common.noData")}</CommandEmpty>
                                      <CommandGroup>
                                        {carModels?.map((model) => (
                                          <CommandItem key={model.id} value={model.modelName} onSelect={() => { setSelectedModelId(model.id); setModelOpen(false); }}>
                                            <Check className={cn("mr-2 h-4 w-4", selectedModelId === model.id ? "opacity-100" : "opacity-0")} />
                                            {model.modelName}
                                          </CommandItem>
                                        ))}
                                        <CommandItem onSelect={() => { setModelOpen(false); setCustomModelMakerId(selectedMakerId); setIsCustomModelDialogOpen(true); }} className="border-t mt-2 pt-2 text-primary font-medium">
                                          <Plus className="mr-2 h-4 w-4" />{t("fleet.addModel")}
                                        </CommandItem>
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div>
                              <Label htmlFor="year">{t("common.year")} *</Label>
                              <Input id="year" name="year" type="number" min="1900" max="2100" required className="input-client mt-1" />
                            </div>
                            <div>
                              <Label htmlFor="mileage">{t("fleet.mileage")}</Label>
                              <Input id="mileage" name="mileage" type="number" min="0" className="mt-1" />
                            </div>
                            <div>
                              <Label htmlFor="color">{t("common.color")} *</Label>
                              <Input id="color" name="color" required className="input-client mt-1" />
                            </div>
                            <div>
                              <Label htmlFor="category">{t("common.category")} *</Label>
                              <Select name="category" required>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder={t("fleet.selectCategory")} />
                                </SelectTrigger>
                                <SelectContent style={{ zIndex: 9999 }}>
                                  <SelectItem value="Economy">{t("fleet.economy")}</SelectItem>
                                  <SelectItem value="Compact">{t("fleet.compact")}</SelectItem>
                                  <SelectItem value="Intermediate">{t("fleet.intermediate")}</SelectItem>
                                  <SelectItem value="Standard">{t("fleet.standard")}</SelectItem>
                                  <SelectItem value="Full-size">{t("fleet.fullSize")}</SelectItem>
                                  <SelectItem value="Luxury">{t("fleet.luxury")}</SelectItem>
                                  <SelectItem value="SUV">{t("fleet.suv")}</SelectItem>
                                  <SelectItem value="Minivan">{t("fleet.minivan")}</SelectItem>
                                  <SelectItem value="Pickup Truck">{t("fleet.pickupTruck")}</SelectItem>
                                  <SelectItem value="Cargo Van">{t("fleet.cargoVan")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-4 h-4 text-blue-700" />
                            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{t("fleet.pricingFinancials")}</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor="dailyRate">{t("fleet.dailyRate")} *</Label>
                              <Input id="dailyRate" name="dailyRate" type="number" step="0.01" min="0" required className="input-client mt-1" />
                            </div>
                            <div>
                              <Label htmlFor="weeklyRate">{t("fleet.weeklyRate")}</Label>
                              <Input id="weeklyRate" name="weeklyRate" type="number" step="0.01" min="0" className="mt-1" />
                            </div>
                            <div>
                              <Label htmlFor="monthlyRate">{t("fleet.monthlyRate")}</Label>
                              <Input id="monthlyRate" name="monthlyRate" type="number" step="0.01" min="0" className="mt-1" />
                            </div>
                          </div>
                        </div>

                        {/* High Season Pricing */}
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-amber-800">{t("fleet.highSeasonPricing")}</span>
                            <span className="text-xs text-amber-600">({t("common.optional")})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor="highSeasonDailyRate" className="text-xs">{t("fleet.hsDaily")}</Label>
                              <Input id="highSeasonDailyRate" name="highSeasonDailyRate" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1" />
                            </div>
                            <div>
                              <Label htmlFor="highSeasonWeeklyRate" className="text-xs">{t("fleet.hsWeekly")}</Label>
                              <Input id="highSeasonWeeklyRate" name="highSeasonWeeklyRate" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1" />
                            </div>
                            <div>
                              <Label htmlFor="highSeasonMonthlyRate" className="text-xs">{t("fleet.hsMonthly")}</Label>
                              <Input id="highSeasonMonthlyRate" name="highSeasonMonthlyRate" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1" />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Right column — Insurance / Registration / Maintenance / Purchase / AI */}
                      <div className="flex-1 sm:overflow-y-auto p-6 bg-gray-50/40 space-y-4">

                        {/* Insurance */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                          <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wide">{t("fleet.insurance")}</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="insuranceProvider">{t("fleet.provider")}</Label>
                              <Input id="insuranceProvider" name="insuranceProvider" placeholder="e.g., State Farm" className="mt-1" />
                            </div>
                            <div>
                              <Label htmlFor="insurancePolicyNumber">{t("fleet.policyNumber")}</Label>
                              <Input id="insurancePolicyNumber" name="insurancePolicyNumber" className="mt-1" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">{t("fleet.policyStartDate")}</Label>
                              <div className="mt-1">
                                <ModernDatePicker date={insuranceStartDate} onDateChange={setInsuranceStartDate} placeholder={t("common.selectDate")} />
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">{t("fleet.expiryAutoSet")}</p>
                            </div>
                            <div>
                              <Label className="text-xs">{t("fleet.expiryAuto")}</Label>
                              <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 min-h-[38px] flex items-center">
                                <p className="text-sm text-gray-600">
                                  {insuranceStartDate
                                    ? new Date(new Date(insuranceStartDate).setFullYear(new Date(insuranceStartDate).getFullYear() + 1)).toLocaleDateString()
                                    : <span className="text-gray-400 text-xs">{t("common.selectDate")}</span>}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="insuranceAnnualPremium">{t("fleet.annualPremium")}</Label>
                            <Input id="insuranceAnnualPremium" name="insuranceAnnualPremium" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1" />
                          </div>
                        </div>

                        {/* Registration */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                          <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wide">{t("fleet.registration")}</h4>
                          <div>
                            <Label htmlFor="vehicleRegistrationNumber">{t("fleet.registrationNumber")}</Label>
                            <Input id="vehicleRegistrationNumber" name="vehicleRegistrationNumber" placeholder="e.g. REG-2024-001234" className="mt-1" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">{t("fleet.expiryDate")}</Label>
                              <div className="mt-1">
                                <ModernDatePicker date={registrationExpiryDate} onDateChange={setRegistrationExpiryDate} placeholder={t("common.selectDate")} />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="registrationFee">{t("fleet.annualFee")}</Label>
                              <Input id="registrationFee" name="registrationFee" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1" />
                            </div>
                          </div>
                        </div>

                        {/* Next Maintenance */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <Label className="font-semibold text-sm text-gray-900 uppercase tracking-wide">{t("fleet.nextMaintenance")}</Label>
                          <div className="mt-2">
                            <ModernDatePicker date={nextMaintenanceDate} onDateChange={setNextMaintenanceDate} placeholder={t("common.selectDate")} />
                          </div>
                        </div>

                        {/* Purchase Details — collapsible */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowPurchaseSection(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">{t("fleet.purchaseDetails")}</span>
                              <span className="text-xs text-blue-500">({t("common.optional")})</span>
                            </div>
                            {showPurchaseSection ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
                          </button>
                          {showPurchaseSection && (
                            <div className="p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>{t("fleet.purchaseType")}</Label>
                                  <Select onValueChange={(v) => setPurchaseType(v as any)}>
                                    <SelectTrigger className="mt-1"><SelectValue placeholder={t("fleet.cash") + " or " + t("fleet.installments")} /></SelectTrigger>
                                    <SelectContent style={{ zIndex: 9999 }}>
                                      <SelectItem value="Cash">{t("fleet.cash")}</SelectItem>
                                      <SelectItem value="Installments">{t("fleet.installments")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="purchaseCost">{t("fleet.purchasePrice")}</Label>
                                  <Input id="purchaseCost" name="purchaseCost" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1"
                                    onChange={(e) => { setAddPurchaseCost(parseFloat(e.target.value) || 0); setAddMonthlyManual(null); }} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="downPayment">{t("fleet.downPayment")}</Label>
                                  <Input id="downPayment" name="downPayment" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1"
                                    onChange={(e) => { setAddDownPayment(parseFloat(e.target.value) || 0); setAddMonthlyManual(null); }} />
                                </div>
                                <div>
                                  <Label htmlFor="sellerName">{t("fleet.sellerDealer")}</Label>
                                  <Input id="sellerName" name="sellerName" placeholder="e.g. ABC Motors" className="mt-1" />
                                </div>
                              </div>
                              <div>
                                <Label>{t("fleet.purchaseDate")}</Label>
                                <div className="mt-1">
                                  <ModernDatePicker date={purchaseDate} onDateChange={setPurchaseDate} placeholder={t("common.selectDate")} />
                                </div>
                              </div>
                              {purchaseType === "Installments" && (() => {
                                const loanAmount = Math.max(0, addPurchaseCost - addDownPayment);
                                const remaining = loanAmount * (1 + addInterestRate / 100);
                                const computedMonthly = addNumInstallments > 0 ? remaining / addNumInstallments : 0;
                                const monthlyDisplay = addMonthlyManual !== null ? addMonthlyManual : computedMonthly;
                                return (
                                  <div className="space-y-3 pt-3 border-t border-dashed border-blue-200">
                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{t("fleet.financingDetails")}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label htmlFor="interestRate">{t("fleet.interestRate")}</Label>
                                        <Input id="interestRate" name="interestRate" type="number" step="0.01" min="0" max="100" placeholder="e.g. 8.5" className="mt-1"
                                          onChange={(e) => { setAddInterestRate(parseFloat(e.target.value) || 0); setAddMonthlyManual(null); }} />
                                      </div>
                                      <div>
                                        <Label htmlFor="numberOfInstallments">{t("fleet.numInstallments")}</Label>
                                        <Input id="numberOfInstallments" name="numberOfInstallments" type="number" min="1" step="1" placeholder="e.g. 36" className="mt-1"
                                          onChange={(e) => { setAddNumInstallments(parseInt(e.target.value) || 0); setAddMonthlyManual(null); }} />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label htmlFor="monthlyInstallmentAmount">
                                          {t("fleet.monthlyInstallment")}
                                          {addMonthlyManual === null && <span className="ml-1.5 text-[10px] font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">auto</span>}
                                        </Label>
                                        <Input id="monthlyInstallmentAmount" name="monthlyInstallmentAmount" type="number" step="0.01" min="0" placeholder="0.00"
                                          value={monthlyDisplay.toFixed(2)} onChange={(e) => setAddMonthlyManual(parseFloat(e.target.value) || 0)}
                                          className={`mt-1 ${addMonthlyManual === null ? "bg-gray-50 text-gray-700" : ""}`} />
                                      </div>
                                      <div>
                                        <Label htmlFor="remainingBalance">{t("fleet.remainingBalance")}</Label>
                                        <div className="relative mt-1">
                                          <Input id="remainingBalance" name="remainingBalance" type="number" step="0.01" min="0" readOnly
                                            value={remaining.toFixed(2)} className="bg-gray-50 text-gray-700 cursor-default pr-14" />
                                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">auto</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {/* AI Maintenance — collapsible */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowAddAiSection(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-800">{t("fleet.aiMaintenanceData")}</span>
                              <span className="text-xs text-gray-400">{t("fleet.aiMaintenanceOptional")}</span>
                            </div>
                            {showAddAiSection ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                          </button>
                          {showAddAiSection && (
                            <div className="p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="engineType">{t("fleet.engineType")}</Label>
                                  <Select name="engineType">
                                    <SelectTrigger className="mt-1"><SelectValue placeholder={t("common.selectDate")} /></SelectTrigger>
                                    <SelectContent style={{ zIndex: 9999 }}>
                                      <SelectItem value="Gasoline">{t("fleet.gasoline")}</SelectItem>
                                      <SelectItem value="Diesel">{t("fleet.diesel")}</SelectItem>
                                      <SelectItem value="Hybrid">{t("fleet.hybrid")}</SelectItem>
                                      <SelectItem value="Electric">{t("fleet.electric")}</SelectItem>
                                      <SelectItem value="Plug-in Hybrid">{t("fleet.pluginHybrid")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="transmissionType">{t("fleet.transmission")}</Label>
                                  <Select name="transmissionType">
                                    <SelectTrigger className="mt-1"><SelectValue placeholder={t("common.selectDate")} /></SelectTrigger>
                                    <SelectContent style={{ zIndex: 9999 }}>
                                      <SelectItem value="Manual">{t("fleet.manual")}</SelectItem>
                                      <SelectItem value="Automatic">{t("fleet.automatic")}</SelectItem>
                                      <SelectItem value="CVT">{t("fleet.cvt")}</SelectItem>
                                      <SelectItem value="DCT">{t("fleet.dct")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="fuelType">{t("fleet.fuelPolicy")}</Label>
                                  <Select name="fuelType">
                                    <SelectTrigger className="mt-1"><SelectValue placeholder={t("common.selectDate")} /></SelectTrigger>
                                    <SelectContent style={{ zIndex: 9999 }}>
                                      <SelectItem value="Regular">{t("fleet.regular")}</SelectItem>
                                      <SelectItem value="Premium">{t("fleet.premium")}</SelectItem>
                                      <SelectItem value="Diesel">{t("fleet.diesel")}</SelectItem>
                                      <SelectItem value="Electric">{t("fleet.electric")}</SelectItem>
                                      <SelectItem value="Hybrid">{t("fleet.hybrid")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="averageDailyKm">{t("fleet.avgDailyKm")}</Label>
                                  <Input id="averageDailyKm" name="averageDailyKm" type="number" min="0" step="1" placeholder="e.g., 50" className="mt-1" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="primaryUse">{t("fleet.primaryUse")}</Label>
                                  <Select name="primaryUse">
                                    <SelectTrigger className="mt-1"><SelectValue placeholder={t("common.selectDate")} /></SelectTrigger>
                                    <SelectContent style={{ zIndex: 9999 }}>
                                      <SelectItem value="Rental">{t("fleet.rental")}</SelectItem>
                                      <SelectItem value="Fleet">{t("nav.fleet")}</SelectItem>
                                      <SelectItem value="Personal">{t("fleet.personal")}</SelectItem>
                                      <SelectItem value="Commercial">{t("fleet.commercial")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="operatingClimate">{t("fleet.operatingClimate")}</Label>
                                  <Select name="operatingClimate">
                                    <SelectTrigger className="mt-1"><SelectValue placeholder={t("common.selectDate")} /></SelectTrigger>
                                    <SelectContent style={{ zIndex: 9999 }}>
                                      <SelectItem value="Hot">{t("fleet.hot")}</SelectItem>
                                      <SelectItem value="Cold">{t("fleet.cold")}</SelectItem>
                                      <SelectItem value="Moderate">{t("fleet.moderate")}</SelectItem>
                                      <SelectItem value="Humid">{t("fleet.humid")}</SelectItem>
                                      <SelectItem value="Arid">{t("fleet.arid")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>{t("fleet.lastServiceDate")}</Label>
                                  <div className="mt-1">
                                    <ModernDatePicker date={editLastServiceDate} onDateChange={setEditLastServiceDate} placeholder={t("common.selectDate")} />
                                  </div>
                                </div>
                                <div>
                                  <Label>{t("fleet.purchaseDateAI")}</Label>
                                  <div className="mt-1">
                                    <ModernDatePicker date={editPurchaseDate} onDateChange={setEditPurchaseDate} placeholder={t("common.selectDate")} />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="serviceHistory">{t("fleet.serviceHistoryNotes")}</Label>
                                <Textarea id="serviceHistory" name="serviceHistory" rows={2} placeholder="e.g., Recent oil change, new tires..." className="mt-1" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <Label htmlFor="notes" className="font-semibold text-sm text-gray-700">{t("common.notes")}</Label>
                          <Textarea id="notes" name="notes" rows={3} className="mt-2" />
                        </div>

                      </div>
                    </div>

                    {/* Sticky footer */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] flex-shrink-0">
                      <p className="text-xs text-gray-400">{t("fleet.requiredFields")}</p>
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); setSelectedMakerId(null); setSelectedModelId(null); }}>
                          {t("common.cancel")}
                        </Button>
                        <Button type="submit" className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white">
                          {createMutation.isPending ? t("common.loading") : t("fleet.addVehicle")}
                        </Button>
                      </div>
                    </div>
                  </form>

                </div>
              </div>,
              document.body
            )}
          
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t("fleet.searchPlaceholder")}
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

        {/* High Season Date Ranges Panel */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Sun className="h-4 w-4 text-amber-500 shrink-0" />
                <h2 className="font-semibold text-sm text-amber-800">High Season Periods</h2>
              </div>
              <p className="text-xs text-amber-600 mt-0.5">Vehicles with high season rates are priced automatically during these dates</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 text-xs shrink-0"
              onClick={() => { resetHsForm(); setIsHighSeasonDialogOpen(true); }}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Period
            </Button>
          </div>
          {highSeasonPeriods && highSeasonPeriods.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {highSeasonPeriods.map((period) => (
                <div key={period.id} className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs">
                  <Sun className="h-3 w-3 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-900">{period.name}</span>
                    <span className="text-amber-600 ml-2">{period.startDate} → {period.endDate}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPeriod(period);
                      setHsName(period.name);
                      setHsStartDate(new Date(period.startDate));
                      setHsEndDate(new Date(period.endDate));
                      setIsHighSeasonDialogOpen(true);
                    }}
                    className="text-amber-400 hover:text-amber-600 ml-1"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this high season period?")) deleteHighSeasonMutation.mutate({ id: period.id }); }}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-600">No high season periods set. Add date ranges to enable automatic high season pricing.</p>
          )}
        </div>

        {/* Tab strip */}
        <div className="flex items-center gap-0 border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "active"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Active Fleet
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === "active" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
              {filteredVehicles?.length ?? 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("sold")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "sold"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Sold / Archived
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === "sold" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
              {soldVehicles?.length ?? 0}
            </span>
          </button>
        </div>

        {activeTab === "active" && isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-500">Loading vehicles...</p>
          </div>
        ) : activeTab === "active" && filteredVehicles && filteredVehicles.length > 0 ? (
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
                      <span className="text-xs text-gray-400">{t("common.category")}</span>
                      <p className="font-medium text-gray-700">{vehicle.category}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">{t("common.color")}</span>
                      <p className="font-medium text-gray-700">{vehicle.color}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">{t("fleet.dailyRate")}</span>
                      <p className="font-medium text-gray-700">${vehicle.dailyRate}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">{t("fleet.mileage")}</span>
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
                        setEditPurchaseCost(parseFloat((vehicle as any).purchaseCost || "0"));
                        setEditDownPayment(parseFloat((vehicle as any).downPayment || "0"));
                        setEditInterestRate(parseFloat((vehicle as any).interestRate || "0"));
                        setEditNumInstallments(parseInt((vehicle as any).numberOfInstallments || "0"));
                        setEditMonthlyManual(parseFloat((vehicle as any).monthlyInstallmentAmount || "0") || null);
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
                          setMaintenanceForm({ garage: "", type: "", mileage: vehicle.mileage?.toString() || "", nextKm: "", notes: "" });
                          setMaintenanceEntryDate(new Date());
                          setIsMaintenanceDialogOpen(true);
                        }}
                        title={t("fleet.sendToMaintenance")}
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
                        title={t("common.manage")}
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
        ) : activeTab === "active" && searchQuery ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Search className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No Results Found</h3>
            <p className="text-sm text-gray-400 mb-4">No vehicles match "{searchQuery}"</p>
            <Button onClick={() => setSearchQuery("")} variant="outline" size="sm">
              Clear Search
            </Button>
          </div>
        ) : activeTab === "active" ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Car className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No Vehicles Yet</h3>
            <p className="text-sm text-gray-400 mb-4">Start by adding your first vehicle to the fleet.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add First Vehicle
            </Button>
          </div>
        ) : null}

        {/* Sold / Archived Tab */}
        {activeTab === "sold" && (
          soldLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-sm text-gray-500">Loading archived vehicles...</p>
            </div>
          ) : filteredSoldVehicles && filteredSoldVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSoldVehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-gray-50 rounded-xl border border-gray-200 opacity-90 hover:opacity-100 transition-opacity">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-600">{vehicle.plateNumber}</h3>
                        <p className="text-sm text-gray-400">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">Sold</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3">
                      {(vehicle as any).saleDate && (
                        <div>
                          <span className="text-xs text-gray-400">Sale Date</span>
                          <p className="font-medium text-gray-600">{new Date((vehicle as any).saleDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {(vehicle as any).salePrice && (
                        <div>
                          <span className="text-xs text-gray-400">Sale Price</span>
                          <p className="font-medium text-gray-600">${parseFloat((vehicle as any).salePrice).toLocaleString()}</p>
                        </div>
                      )}
                      {(vehicle as any).buyerName && (
                        <div className="col-span-2">
                          <span className="text-xs text-gray-400">Buyer</span>
                          <p className="font-medium text-gray-600">{(vehicle as any).buyerName}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-gray-400">Category</span>
                        <p className="font-medium text-gray-600">{vehicle.category}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Color</span>
                        <p className="font-medium text-gray-600">{vehicle.color}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Link href={`/vehicle/${vehicle.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-xs text-gray-600">
                          <Car className="mr-1.5 h-3 w-3" />
                          View History
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-blue-600 hover:bg-blue-50"
                        onClick={() => { setSelectedVehicle(vehicle as any); setEditPurchaseCost(parseFloat((vehicle as any).purchaseCost || "0")); setEditDownPayment(parseFloat((vehicle as any).downPayment || "0")); setEditInterestRate(parseFloat((vehicle as any).interestRate || "0")); setEditNumInstallments(parseInt((vehicle as any).numberOfInstallments || "0")); setEditMonthlyManual(parseFloat((vehicle as any).monthlyInstallmentAmount || "0") || null); setIsEditDialogOpen(true); }}
                      >
                        <Edit className="h-3 w-3" />
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
              <p className="text-sm text-gray-400 mb-4">No sold vehicles match "{searchQuery}"</p>
              <Button onClick={() => setSearchQuery("")} variant="outline" size="sm">Clear Search</Button>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <DollarSign className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No Sold Vehicles</h3>
              <p className="text-sm text-gray-400">Vehicles you mark as "Sold" will appear here for archive reference.</p>
            </div>
          )
        )}

        {/* Edit Dialog */}
        {selectedVehicle && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>{t("fleet.editVehicle")}</DialogTitle>
                <DialogDescription>{t("fleet.subtitle")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditVehicle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-plateNumber">{t("fleet.plateNumber")} *</Label>
                    <Input id="edit-plateNumber" name="plateNumber" defaultValue={selectedVehicle.plateNumber} required className="input-client" />
                  </div>
                  <div>
                    <Label htmlFor="edit-vin">VIN</Label>
                    <Input id="edit-vin" name="vin" defaultValue={selectedVehicle.vin || ""} maxLength={17} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>{t("fleet.makerBrand")} *</Label>
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
                            : t("fleet.selectMaker")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder={t("fleet.searchMaker")} />
                          <CommandList>
                            <CommandEmpty>{t("common.noData")}</CommandEmpty>
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
                                {t("fleet.addMaker")}
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>{t("common.model")} *</Label>
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
                            : t("fleet.selectModel")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder={t("fleet.searchModel")} />
                          <CommandList>
                            <CommandEmpty>{t("common.noData")}</CommandEmpty>
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
                                {t("fleet.addModel")}
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="edit-year">{t("common.year")} *</Label>
                    <Input id="edit-year" name="year" type="number" defaultValue={selectedVehicle.year} min="1900" max="2100" required className="input-client" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-color">{t("common.color")} *</Label>
                    <Input id="edit-color" name="color" defaultValue={selectedVehicle.color} required className="input-client" />
                  </div>
                  <div>
                    <Label htmlFor="edit-category">{t("common.category")} *</Label>
                    <Select name="category" defaultValue={selectedVehicle.category} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Economy">{t("fleet.economy")}</SelectItem>
                        <SelectItem value="Compact">{t("fleet.compact")}</SelectItem>
                        <SelectItem value="Intermediate">{t("fleet.intermediate")}</SelectItem>
                        <SelectItem value="Standard">{t("fleet.standard")}</SelectItem>
                        <SelectItem value="Full-size">{t("fleet.fullSize")}</SelectItem>
                        <SelectItem value="Luxury">{t("fleet.luxury")}</SelectItem>
                        <SelectItem value="SUV">{t("fleet.suv")}</SelectItem>
                        <SelectItem value="Minivan">{t("fleet.minivan")}</SelectItem>
                        <SelectItem value="Pickup Truck">{t("fleet.pickupTruck")}</SelectItem>
                        <SelectItem value="Cargo Van">{t("fleet.cargoVan")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-status">{t("common.status")}</Label>
                    <Select name="status" defaultValue={selectedVehicle.status} onValueChange={setEditStatusValue}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">{t("fleet.available")}</SelectItem>
                        <SelectItem value="Rented">{t("fleet.rented")}</SelectItem>
                        <SelectItem value="Maintenance">{t("nav.maintenance")}</SelectItem>
                        <SelectItem value="Out of Service">{t("fleet.outOfService")}</SelectItem>
                        <SelectItem value="Sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-mileage">{t("fleet.mileage")}</Label>
                  <Input id="edit-mileage" name="mileage" type="number" defaultValue={selectedVehicle.mileage || 0} min="0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-dailyRate">{t("fleet.dailyRate")} *</Label>
                    <Input id="edit-dailyRate" name="dailyRate" type="number" step="0.01" defaultValue={selectedVehicle.dailyRate} min="0" required className="input-client" />
                  </div>
                  <div>
                    <Label htmlFor="edit-weeklyRate">{t("fleet.weeklyRate")}</Label>
                    <Input id="edit-weeklyRate" name="weeklyRate" type="number" step="0.01" defaultValue={selectedVehicle.weeklyRate || ""} min="0" />
                  </div>
                  <div>
                    <Label htmlFor="edit-monthlyRate">{t("fleet.monthlyRate")}</Label>
                    <Input id="edit-monthlyRate" name="monthlyRate" type="number" step="0.01" defaultValue={selectedVehicle.monthlyRate || ""} min="0" />
                  </div>
                </div>

                {/* High Season Pricing */}
                <div className="space-y-3 p-4 border border-amber-200 rounded-lg bg-amber-50/50">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <h4 className="font-medium text-sm text-amber-800">{t("fleet.highSeasonPricing")} ({t("common.optional")})</h4>
                  </div>
                  <p className="text-xs text-amber-600">{t("fleet.highSeasonPeriodsSubtitle")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="edit-highSeasonDailyRate">{t("fleet.hsDaily")}</Label>
                      <Input id="edit-highSeasonDailyRate" name="highSeasonDailyRate" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={(selectedVehicle as any).highSeasonDailyRate || ""} />
                    </div>
                    <div>
                      <Label htmlFor="edit-highSeasonWeeklyRate">{t("fleet.hsWeekly")}</Label>
                      <Input id="edit-highSeasonWeeklyRate" name="highSeasonWeeklyRate" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={(selectedVehicle as any).highSeasonWeeklyRate || ""} />
                    </div>
                    <div>
                      <Label htmlFor="edit-highSeasonMonthlyRate">{t("fleet.hsMonthly")}</Label>
                      <Input id="edit-highSeasonMonthlyRate" name="highSeasonMonthlyRate" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={(selectedVehicle as any).highSeasonMonthlyRate || ""} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium text-sm">{t("fleet.insurance")}</h4>
                  
                  <div>
                    <Label htmlFor="edit-insuranceProvider">{t("fleet.provider")}</Label>
                    <Input id="edit-insuranceProvider" name="insuranceProvider" placeholder="e.g., State Farm, Geico" defaultValue={selectedVehicle.insuranceProvider || ""} />
                  </div>

                  <div>
                    <Label htmlFor="edit-insurancePolicyNumber">{t("fleet.policyNumber")}</Label>
                    <Input id="edit-insurancePolicyNumber" name="insurancePolicyNumber" defaultValue={selectedVehicle.insurancePolicyNumber || ""} />
                  </div>

                  <div>
                    <Label>{t("fleet.policyStartDate")}</Label>
                    <ModernDatePicker
                      date={editInsuranceStartDate}
                      onDateChange={setEditInsuranceStartDate}
                      placeholder={t("common.selectDate")}
                    />
                  </div>

                  <div>
                    <Label>{t("fleet.expiryDate")}</Label>
                    <ModernDatePicker
                      date={editInsuranceExpiryDate}
                      onDateChange={setEditInsuranceExpiryDate}
                      placeholder={t("common.selectDate")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-insuranceAnnualPremium">{t("fleet.annualPremium")}</Label>
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

                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium text-sm">{t("fleet.registration")}</h4>
                  <div>
                    <Label htmlFor="edit-vehicleRegistrationNumber">{t("fleet.registrationNumber")}</Label>
                    <Input id="edit-vehicleRegistrationNumber" name="vehicleRegistrationNumber" placeholder="e.g. REG-2024-001234" defaultValue={(selectedVehicle as any).vehicleRegistrationNumber || ""} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>{t("fleet.expiryDate")}</Label>
                      <ModernDatePicker
                        date={editRegistrationExpiryDate}
                        onDateChange={setEditRegistrationExpiryDate}
                        placeholder={t("common.selectDate")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-registrationFee">{t("fleet.annualFee")}</Label>
                      <Input id="edit-registrationFee" name="registrationFee" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={(selectedVehicle as any).registrationFee || ""} />
                      <p className="text-xs text-muted-foreground mt-1">{t("fleet.expiryAutoSet")}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Purchase Details */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowEditPurchaseSection(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">{t("fleet.purchaseDetails")}</span>
                      <span className="text-xs text-blue-600 font-normal">({t("common.optional")})</span>
                    </div>
                    {showEditPurchaseSection ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
                  </button>

                  {showEditPurchaseSection && (
                    <div className="p-4 space-y-4 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>{t("fleet.purchaseType")}</Label>
                          <Select
                            defaultValue={(selectedVehicle as any).purchaseType || undefined}
                            onValueChange={(v) => setEditPurchaseType(v as any)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("fleet.cash") + " or " + t("fleet.installments")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">{t("fleet.cash")}</SelectItem>
                              <SelectItem value="Installments">{t("fleet.installments")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit-purchaseCost">{t("fleet.purchasePrice")}</Label>
                          <Input id="edit-purchaseCost" name="purchaseCost" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={selectedVehicle.purchaseCost || ""}
                            onChange={(e) => setEditPurchaseCost(parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-downPayment">{t("fleet.downPayment")}</Label>
                          <Input id="edit-downPayment" name="downPayment" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={(selectedVehicle as any).downPayment || ""}
                            onChange={(e) => setEditDownPayment(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div>
                          <Label htmlFor="edit-sellerName">{t("fleet.sellerDealer")}</Label>
                          <Input id="edit-sellerName" name="sellerName" placeholder="e.g. ABC Motors" defaultValue={(selectedVehicle as any).sellerName || ""} />
                        </div>
                      </div>

                      <div>
                        <Label>{t("fleet.purchaseDate")}</Label>
                        <ModernDatePicker
                          date={editPurchaseDate}
                          onDateChange={setEditPurchaseDate}
                          placeholder={t("common.selectDate")}
                        />
                      </div>

                      {(editPurchaseType === "Installments" || (!(editPurchaseType) && (selectedVehicle as any).purchaseType === "Installments")) && (() => {
                          const loanAmount = Math.max(0, editPurchaseCost - editDownPayment);
                          const remaining = loanAmount * (1 + editInterestRate / 100);
                          const computedMonthly = editNumInstallments > 0 ? remaining / editNumInstallments : 0;
                          const monthlyDisplay = editMonthlyManual !== null ? editMonthlyManual : computedMonthly;
                          return (
                            <div className="space-y-4 pt-3 border-t border-dashed border-blue-200">
                              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{t("fleet.financingDetails")}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-interestRate">{t("fleet.interestRate")}</Label>
                                  <Input id="edit-interestRate" name="interestRate" type="number" step="0.01" min="0" max="100" placeholder="e.g. 8.5"
                                    defaultValue={(selectedVehicle as any).interestRate || ""}
                                    onChange={(e) => { setEditInterestRate(parseFloat(e.target.value) || 0); setEditMonthlyManual(null); }} />
                                </div>
                                <div>
                                  <Label htmlFor="edit-numberOfInstallments">{t("fleet.numInstallments")}</Label>
                                  <Input id="edit-numberOfInstallments" name="numberOfInstallments" type="number" min="1" step="1" placeholder="e.g. 36"
                                    defaultValue={(selectedVehicle as any).numberOfInstallments || ""}
                                    onChange={(e) => { setEditNumInstallments(parseInt(e.target.value) || 0); setEditMonthlyManual(null); }} />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-monthlyInstallmentAmount">
                                    {t("fleet.monthlyInstallment")}
                                    {editMonthlyManual === null && <span className="ml-1.5 text-[10px] font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">auto</span>}
                                  </Label>
                                  <Input
                                    id="edit-monthlyInstallmentAmount"
                                    name="monthlyInstallmentAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={monthlyDisplay.toFixed(2)}
                                    onChange={(e) => setEditMonthlyManual(parseFloat(e.target.value) || 0)}
                                    className={editMonthlyManual === null ? "bg-gray-50 text-gray-700" : ""}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-remainingBalance">{t("fleet.remainingBalance")}</Label>
                                  <div className="relative">
                                    <Input
                                      id="edit-remainingBalance"
                                      name="remainingBalance"
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      readOnly
                                      value={remaining.toFixed(2)}
                                      className="bg-gray-50 text-gray-700 cursor-default pr-20"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">auto</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  )}
                </div>

                {/* Sale Details — visible when status is Sold */}
                {(editStatusValue === "Sold" || (editStatusValue === "" && selectedVehicle?.status === "Sold")) && (
                  <div className="space-y-4 p-4 border border-purple-200 rounded-lg bg-purple-50/40">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      <h4 className="text-sm font-semibold text-purple-900">{t("fleet.saleDetails")}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-salePrice">{t("fleet.salePrice")}</Label>
                        <Input id="edit-salePrice" name="salePrice" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={(selectedVehicle as any).salePrice || ""} />
                      </div>
                      <div>
                        <Label htmlFor="edit-buyerName">{t("fleet.buyerName")}</Label>
                        <Input id="edit-buyerName" name="buyerName" placeholder="e.g. John Smith" defaultValue={(selectedVehicle as any).buyerName || ""} />
                      </div>
                    </div>
                    <div>
                      <Label>{t("fleet.saleDate")}</Label>
                      <ModernDatePicker
                        date={editSaleDate}
                        onDateChange={setEditSaleDate}
                        placeholder={t("common.selectDate")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-saleNotes">{t("fleet.saleNotes")}</Label>
                      <Textarea id="edit-saleNotes" name="saleNotes" rows={2} placeholder="e.g. Sold via auction, cash payment..." defaultValue={(selectedVehicle as any).saleNotes || ""} />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="edit-notes">{t("common.notes")}</Label>
                  <Textarea id="edit-notes" name="notes" rows={3} defaultValue={selectedVehicle.notes || ""} />
                </div>

                <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                    {updateMutation.isPending ? t("common.loading") : t("fleet.updateVehicle")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* High Season Period Dialog */}
      <Dialog open={isHighSeasonDialogOpen} onOpenChange={(open) => { if (!open) resetHsForm(); setIsHighSeasonDialogOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPeriod ? t("fleet.editHighSeasonPeriod") : t("fleet.addHighSeasonPeriod")}</DialogTitle>
            <DialogDescription>{t("fleet.highSeasonSubtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHighSeasonSubmit} className="space-y-4">
            <div>
              <Label htmlFor="hs-name">{t("fleet.periodName")} *</Label>
              <Input
                id="hs-name"
                value={hsName}
                onChange={(e) => setHsName(e.target.value)}
                placeholder="e.g., Summer 2025, Christmas Holiday"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t("fleet.startDate")} *</Label>
                <ModernDatePicker date={hsStartDate} onDateChange={setHsStartDate} placeholder={t("common.selectDate")} />
              </div>
              <div>
                <Label>{t("fleet.endDate")} *</Label>
                <ModernDatePicker date={hsEndDate} onDateChange={setHsEndDate} placeholder={t("common.selectDate")} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => { resetHsForm(); setIsHighSeasonDialogOpen(false); }}>{t("common.cancel")}</Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={createHighSeasonMutation.isPending || updateHighSeasonMutation.isPending}>
                {createHighSeasonMutation.isPending || updateHighSeasonMutation.isPending ? t("common.loading") : (editingPeriod ? t("common.saveChanges") : t("fleet.addPeriod"))}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Maker Dialog */}
      <Dialog open={isCustomMakerDialogOpen} onOpenChange={setIsCustomMakerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("fleet.addCustomMaker")}</DialogTitle>
            <DialogDescription>{t("fleet.addMakerSubtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!customMakerName.trim()) {
              toast.error(t("fleet.enterMakerName"));
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
                <Label htmlFor="custom-maker-name">{t("fleet.makerName")} *</Label>
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
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createCustomMakerMutation.isPending}>
                {createCustomMakerMutation.isPending ? t("common.loading") : t("fleet.addMaker")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Custom Model Dialog */}
      <Dialog open={isCustomModelDialogOpen} onOpenChange={setIsCustomModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("fleet.addCustomModel")}</DialogTitle>
            <DialogDescription>{t("fleet.addModelSubtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!customModelName.trim()) {
              toast.error(t("fleet.enterModelName"));
              return;
            }
            if (!customModelMakerId) {
              toast.error(t("fleet.selectMakerFirst"));
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
                <Label htmlFor="custom-model-maker">{t("fleet.makerBrand")} *</Label>
                <Select 
                  value={customModelMakerId?.toString() || ""}
                  onValueChange={(value) => setCustomModelMakerId(parseInt(value))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("fleet.selectMaker")} />
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
                <Label htmlFor="custom-model-name">{t("fleet.modelName")} *</Label>
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
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createCustomModelMutation.isPending}>
                {createCustomModelMutation.isPending ? t("common.loading") : t("fleet.addModel")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
    </>
  );
}
