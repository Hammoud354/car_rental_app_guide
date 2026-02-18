import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import CarDamageInspection from "@/components/CarDamageInspection";
import { ContractPDFTemplate } from "@/components/ContractPDFTemplate";
import { DateDropdownSelector } from "@/components/DateDropdownSelector";
import { ReturnVehicleDialog } from "@/components/ReturnVehicleDialog";
import { InsuranceDepositSelector } from "@/components/InsuranceDepositSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import html2pdf from 'html2pdf.js';
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserFilter } from "@/contexts/UserFilterContext";
import { Building2, FileText, LayoutDashboard, Plus, Wrench, Eye, Users, Check, ChevronsUpDown, Home, Settings, BarChart3, Download } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createSanitizedPdfClone, cleanupSanitizedClone, validateNoModernCss } from "@/lib/pdfSanitizerEngine";
import { parseTemplate, formatTemplateDate, formatTemplateCurrency, getDefaultTemplate } from "@/lib/templateParser";
import { generateThumbnail } from "@/lib/thumbnailGenerator";
import { WORLD_NATIONALITIES } from "@shared/nationalities";
import { exportContractsToCSV } from "@shared/csvExport";

export default function RentalContracts() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { selectedUserId: selectedTargetUserId, setSelectedUserId: setSelectedTargetUserId, isSuperAdmin } = useUserFilter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [showInspection, setShowInspection] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [additionalDays, setAdditionalDays] = useState<number>(1);
  
  // Date states
  const [licenseIssueDate, setLicenseIssueDate] = useState<Date>();
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<Date>();
  const [rentalStartDate, setRentalStartDate] = useState<Date>();
  const [rentalEndDate, setRentalEndDate] = useState<Date>();
  
  // Pricing states
  const [rentalDays, setRentalDays] = useState<number>(0);
  const [dailyRate, setDailyRate] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [pickupKm, setPickupKm] = useState<number>(0);
  
  // Insurance, Deposit, and Fuel Policy states
  const [insurancePackage, setInsurancePackage] = useState<"None" | "Basic" | "Premium" | "Full Coverage">("None");
  const [insuranceCost, setInsuranceCost] = useState<number>(0);
  const [insuranceDailyRate, setInsuranceDailyRate] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositStatus, setDepositStatus] = useState<"None" | "Held" | "Refunded" | "Forfeited">("None");
  const [fuelPolicy, setFuelPolicy] = useState<"Full-to-Full" | "Same-to-Same" | "Pre-purchase">("Full-to-Full");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [vehicleComboboxOpen, setVehicleComboboxOpen] = useState(false);
  const [nationalityComboboxOpen, setNationalityComboboxOpen] = useState(false);
  const [selectedNationality, setSelectedNationality] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"active" | "completed" | "overdue" | undefined>("active");
  const [selectedContracts, setSelectedContracts] = useState<number[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<"completed" | "overdue" | null>(null);
  const [returnInspectionOpen, setReturnInspectionOpen] = useState(false);
  const [selectedContractForReturn, setSelectedContractForReturn] = useState<number | null>(null);
  
  // Fetch last odometer reading when vehicle is selected
  const { data: lastOdometerReading } = trpc.contracts.getLastOdometerReading.useQuery(
    { vehicleId: parseInt(selectedVehicleId) },
    { enabled: !!selectedVehicleId && selectedVehicleId !== "" }
  );
  
  const [returnKm, setReturnKm] = useState<number>(0);
  
  // Fetch all users for Super Admin
  const { data: allUsers } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: isSuperAdmin,
  });
  
  const { data: vehicles = [] } = trpc.fleet.list.useQuery(
    selectedTargetUserId ? { filterUserId: selectedTargetUserId } : undefined
  );
  const { data: contracts = [], refetch } = trpc.contracts.listByStatus.useQuery({ 
    status: statusFilter,
    filterUserId: selectedTargetUserId || undefined 
  });
  const { data: clients = [] } = trpc.clients.list.useQuery(
    selectedTargetUserId ? { filterUserId: selectedTargetUserId } : undefined
  );
  const { data: companyProfile } = trpc.company.getProfile.useQuery();
  const { data: companySettings } = trpc.settings.get.useQuery();
  const { data: allInvoices = [] } = trpc.invoices.list.useQuery();
  const utils = trpc.useUtils();
  
  // Use predefined world nationalities list
  const nationalities = WORLD_NATIONALITIES;
  
  // Auto-populate pickup odometer when vehicle is selected
  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
      const registeredMileage = vehicle?.mileage || 0;
      
      // Use last odometer reading if available, otherwise use registered mileage
      if (lastOdometerReading && lastOdometerReading > 0) {
        setPickupKm(lastOdometerReading);
      } else if (registeredMileage > 0) {
        setPickupKm(registeredMileage);
      }
    }
  }, [selectedVehicleId, lastOdometerReading, vehicles]);
  
  // Find invoice for selected contract
  const contractInvoice = selectedContract 
    ? allInvoices.find(inv => inv.contractId === selectedContract.id)
    : null;
    
  // Debug logging
  useEffect(() => {
    if (selectedContract) {
      console.log('Selected contract:', selectedContract);
      console.log('All invoices:', allInvoices);
      console.log('Contract invoice:', contractInvoice);
    }
  }, [selectedContract, allInvoices, contractInvoice]);
  
  // Mutation to update overdue contracts
  const updateOverdueMutation = trpc.contracts.updateOverdueContracts.useMutation();  
  // Check for overdue contracts when component mounts or status filter changes
  useEffect(() => {
    updateOverdueMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.updated > 0) {
          console.log(`Updated ${result.updated} overdue contracts`);
          utils.contracts.listByStatus.invalidate();
        }
      },
    });
  }, [statusFilter]);
  
  const markAsReturnedMutation = trpc.contracts.markAsReturned.useMutation({
    onSuccess: (data) => {
      toast.success("Contract marked as completed");
      
      // Show maintenance alert if due
      if (data.maintenanceAlert && data.maintenanceAlert.isDue) {
        const alert = data.maintenanceAlert;
        toast.warning(
          `⚠️ MAINTENANCE DUE: ${alert.vehiclePlate} (${alert.vehicleModel}) has reached ${alert.currentKm} km. Maintenance was due at ${alert.maintenanceDueKm} km (${alert.kmOverdue} km overdue).`,
          { duration: 10000 }
        );
      }
      
      // Show invoice auto-generation success
      if (data.invoice) {
        toast.success("Invoice automatically generated!", {
          description: `Invoice ${data.invoice.invoiceNumber} has been created for this contract.`,
          duration: 5000,
        });
      }
      
      utils.contracts.listByStatus.invalidate();
      utils.contracts.list.invalidate();
      utils.fleet.list.invalidate();
      utils.invoices.list.invalidate();
      
      // Redirect to dashboard after contract completion
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    },
    onError: (error) => {
      toast.error("Failed to mark contract as returned: " + error.message);
    },
  });
  
  const bulkUpdateMutation = trpc.contracts.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.updatedCount} contract(s) updated successfully`);
      setSelectedContracts([]);
      utils.contracts.listByStatus.invalidate();
      utils.contracts.list.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update contracts: " + error.message);
    },
  });
  
  // Auto-set start date to today when dialog opens (but allow user to change to any date)
  useEffect(() => {
    if (isCreateDialogOpen && !rentalStartDate) {
      setRentalStartDate(new Date());
    }
  }, [isCreateDialogOpen]);
  
  // Auto-calculate return date when days change (only if start date exists)
  useEffect(() => {
    if (rentalStartDate && rentalDays > 0) {
      const returnDate = new Date(rentalStartDate);
      returnDate.setDate(returnDate.getDate() + rentalDays);
      setRentalEndDate(returnDate);
    }
  }, [rentalDays, rentalStartDate]);
  
  // Auto-calculate total amount
  useEffect(() => {
    const total = dailyRate * rentalDays;
    setTotalAmount(total);
  }, [dailyRate, rentalDays]);
  
  // Auto-calculate final amount after discount and insurance
  useEffect(() => {
    const final = Math.max(0, totalAmount - discount + insuranceCost);
    setFinalAmount(final);
  }, [totalAmount, discount, insuranceCost]);
  
  // Load daily rate when vehicle is selected and adjust based on rental duration
  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
      if (vehicle) {
        let rate = 0;
        
        // Tiered pricing based on rental duration
        if (rentalDays >= 30 && vehicle.monthlyRate) {
          // Use monthly rate for 30+ days
          rate = parseFloat(vehicle.monthlyRate);
        } else if (rentalDays >= 7 && vehicle.weeklyRate) {
          // Use weekly rate for 7-29 days
          rate = parseFloat(vehicle.weeklyRate);
        } else if (vehicle.dailyRate) {
          // Use daily rate for 1-6 days
          rate = parseFloat(vehicle.dailyRate);
        }
        
        setDailyRate(rate);
      }
    }
  }, [selectedVehicleId, vehicles, rentalDays]);
  
  const createContract = trpc.contracts.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Contract created successfully! Contract Number: ${data.contractNumber}`);
      utils.contracts.list.invalidate();
      utils.contracts.listByStatus.invalidate();
      utils.fleet.list.invalidate(); // Update vehicle availability
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create contract: ${error.message}`);
    },
  });
  
  const renewContract = trpc.contracts.renew.useMutation({
    onSuccess: () => {
      toast.success("Contract renewed successfully");
      utils.contracts.list.invalidate(); // Refresh contract list
      setIsRenewDialogOpen(false);
      setIsDetailsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to renew contract: ${error.message}`);
    },
  });

  const deleteContract = trpc.contracts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contract deleted successfully");
      utils.contracts.list.invalidate(); // Refresh contract list
      utils.contracts.getById.invalidate(); // Refresh contract details
      setIsDetailsDialogOpen(false);
      setSelectedContract(null);
    },
  });

  const generateInvoice = trpc.invoices.generate.useMutation({
    onSuccess: (data) => {
      if (data) {
        toast.success(`Invoice ${data.invoiceNumber} generated successfully!`);
        // Navigate to invoices page with the invoice dialog open
        window.location.href = `/invoices?invoice=${data.id}`;
      } else {
        toast.success("Invoice generated successfully!");
      }
      utils.invoices.list.invalidate(); // Refresh invoice list
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate invoice");
    },
  });

  const uploadPdfMutation = trpc.files.uploadPdf.useMutation();
  const uploadThumbnailMutation = trpc.whatsappTemplates.uploadThumbnail.useMutation();
  const generatePdfMutation = trpc.contracts.generatePDF.useMutation();
  const { data: whatsappTemplate } = trpc.whatsappTemplates.get.useQuery(
    { templateType: 'contract_created' },
    { enabled: isDetailsDialogOpen && !!selectedContract }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Super Admin must select a specific user to create contract for
    if (isSuperAdmin && (!selectedTargetUserId || selectedTargetUserId === 0)) {
      toast.error("Please select a specific user to create this contract for");
      return;
    }
    
    // Validate pickup odometer is entered
    if (!pickupKm || pickupKm <= 0) {
      toast.error("Please enter a valid pickup odometer reading (must be greater than 0)");
      return;
    }
    
    const data = {
      vehicleId: parseInt(formData.get("vehicleId") as string),
      clientFirstName: formData.get("clientFirstName") as string,
      clientLastName: formData.get("clientLastName") as string,
      clientNationality: formData.get("clientNationality") as string || undefined,
      clientPhone: formData.get("clientPhone") as string || undefined,
      clientAddress: formData.get("clientAddress") as string || undefined,
      drivingLicenseNumber: formData.get("drivingLicenseNumber") as string,
      licenseIssueDate,
      licenseExpiryDate: licenseExpiryDate!,
      rentalStartDate: rentalStartDate!,
      rentalEndDate: rentalEndDate!,
      rentalDays,
      dailyRate: dailyRate.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      discount: discount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      pickupKm,
      // Insurance fields
      insurancePackage,
      insuranceCost: insuranceCost.toFixed(2),
      insuranceDailyRate: insuranceDailyRate.toFixed(2),
      // Deposit fields
      depositAmount: depositAmount.toFixed(2),
      depositStatus,
      // Fuel policy
      fuelPolicy,
      targetUserId: selectedTargetUserId || undefined,
    };
    
    setContractData(data);
    setIsCreateDialogOpen(false);
    setShowInspection(true);
  };

  const handleInspectionComplete = (damageMarks: any[], signatureData: string, fuelLevel: string) => {
    if (!contractData) return;
    
    createContract.mutate({
      ...contractData,
      signatureData,
      fuelLevel,
    }, {
      onSuccess: (contract) => {
        // Save damage marks
        damageMarks.forEach(mark => {
          trpc.contracts.addDamageMark.useMutation().mutate({
            contractId: contract.id,
            xPosition: mark.x.toString(),
            yPosition: mark.y.toString(),
            description: mark.description,
          });
        });
        setShowInspection(false);
        setContractData(null);
        setIsCreateDialogOpen(false);
        toast.success("Contract created successfully!");
        // Redirect to Dashboard
        setLocation("/dashboard");
      },
    });
  };

  const navItems = [
    { href: "/dashboard", label: "HOME", icon: Home },
    { href: "/fleet-management", label: "Fleet", icon: BarChart3 },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/rental-contracts", label: "Contracts", icon: FileText },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <SidebarLayout>
          {showInspection ? (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Vehicle Inspection</h1>
                <p className="text-gray-600 mt-1">Mark any existing damages and collect client signature</p>
              </div>
              <CarDamageInspection
                onComplete={handleInspectionComplete}
                onCancel={() => {
                  setShowInspection(false);
                  setContractData(null);
                  setIsCreateDialogOpen(true);
                }}
                contractData={contractData ? {
                  clientName: `${contractData.clientFirstName} ${contractData.clientLastName}`,
                  clientLicense: contractData.drivingLicenseNumber,
                  clientPhone: contractData.clientPhone,
                  clientAddress: contractData.clientAddress,
                  vehiclePlate: vehicles.find(v => v.id === contractData.vehicleId)?.plateNumber || '',
                  vehicleBrand: vehicles.find(v => v.id === contractData.vehicleId)?.brand || '',
                  vehicleModel: vehicles.find(v => v.id === contractData.vehicleId)?.model || '',
                  vehicleColor: vehicles.find(v => v.id === contractData.vehicleId)?.color ?? undefined,
                  vehicleVin: vehicles.find(v => v.id === contractData.vehicleId)?.vin ?? undefined,
                  startDate: new Date(contractData.rentalStartDate),
                  endDate: new Date(contractData.rentalEndDate),
                  rentalDays: contractData.rentalDays,
                  dailyRate: parseFloat(contractData.dailyRate),
                  totalAmount: parseFloat(contractData.totalAmount),
                  discount: parseFloat(contractData.discount),
                  finalAmount: parseFloat(contractData.finalAmount),
                } : undefined}
              />
            </div>
          ) : (
          <>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Rental Contracts</h1>
              <p className="text-gray-600 mt-1">Manage rental agreements and client information</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (!contracts || contracts.length === 0) {
                    toast.error("No contracts to export");
                    return;
                  }
                  exportContractsToCSV(contracts);
                  toast.success(`Exported ${contracts.length} contracts`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gray-900 hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  New Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Rental Contract</DialogTitle>
                  <DialogDescription>Fill in the contract details to create a new rental agreement.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Vehicle Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehiclePlateNumber">Plate Number *</Label>
                      <input type="hidden" name="vehicleId" value={selectedVehicleId} required />
                      <Popover open={vehicleComboboxOpen} onOpenChange={setVehicleComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={vehicleComboboxOpen}
                            className="w-full justify-between font-normal"
                          >
                            {selectedVehicleId
                              ? (() => {
                                  const vehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
                                  if (!vehicle) return "Select plate number...";
                                  const statusEmoji = {
                                    Available: "🟢",
                                    Rented: "🔴",
                                    Maintenance: "🟡",
                                    "Out of Service": "⚫"
                                  };
                                  return (
                                    <span className="flex items-center gap-2">
                                      <span>{statusEmoji[vehicle.status]}</span>
                                      <span className="font-semibold">{vehicle.plateNumber}</span>
                                      <span className="text-sm text-muted-foreground">- {vehicle.brand} {vehicle.model}</span>
                                    </span>
                                  );
                                })()
                              : "Select plate number..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Search by plate number..." />
                            <CommandList>
                              <CommandEmpty>No vehicle found.</CommandEmpty>
                              <CommandGroup>
                                {vehicles.map((vehicle) => {
                                  const statusColors = {
                                    Available: "text-green-600",
                                    Rented: "text-red-600",
                                    Maintenance: "text-yellow-600",
                                    "Out of Service": "text-gray-500"
                                  };
                                  const statusEmoji = {
                                    Available: "🟢",
                                    Rented: "🔴",
                                    Maintenance: "🟡",
                                    "Out of Service": "⚫"
                                  };
                                  const isDisabled = vehicle.status !== "Available";
                                  return (
                                    <CommandItem
                                      key={vehicle.id}
                                      value={`${vehicle.plateNumber} ${vehicle.brand} ${vehicle.model}`}
                                      onSelect={() => {
                                        if (!isDisabled) {
                                          setSelectedVehicleId(vehicle.id.toString());
                                          // Auto-fill vehicle model
                                          (document.getElementById("vehicleModel") as HTMLInputElement).value = `${vehicle.brand} ${vehicle.model}`;
                                          setVehicleComboboxOpen(false);
                                        }
                                      }}
                                      disabled={isDisabled}
                                      className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          selectedVehicleId === vehicle.id.toString() ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      <span className="flex items-center gap-2 flex-1">
                                        <span>{statusEmoji[vehicle.status]}</span>
                                        <span className="font-semibold">{vehicle.plateNumber}</span>
                                        <span className="text-sm text-muted-foreground">- {vehicle.brand} {vehicle.model}</span>
                                        <span className={`text-xs font-semibold ${statusColors[vehicle.status]}`}>
                                          [{vehicle.status}]
                                        </span>
                                      </span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedVehicleId && vehicles.find(v => v.id.toString() === selectedVehicleId)?.status !== "Available" && (
                        <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>Vehicle not available</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Car Model *</Label>
                      <Input 
                        id="vehicleModel" 
                        name="vehicleModel" 
                        placeholder="Select plate number first"
                        readOnly
                        className="bg-muted cursor-not-allowed input-client"
                      />
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Client Information</h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/clients'}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        View Clients
                      </Button>
                    </div>
                    <div className="mb-4">
                      <Label htmlFor="clientSelector">Select Existing Client (Optional)</Label>
                      <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={clientComboboxOpen}
                            className="w-full justify-between font-normal"
                          >
                            {selectedClientId
                              ? (() => {
                                  const client = clients.find((c) => c.id.toString() === selectedClientId);
                                  return client ? `${client.firstName} ${client.lastName} - ${client.drivingLicenseNumber}` : "Choose a client...";
                                })()
                              : "Choose a client or type to search..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search clients by name or license..." />
                            <CommandList>
                              <CommandEmpty>No client found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="new"
                                  onSelect={() => {
                                    setSelectedClientId("");
                                    setClientComboboxOpen(false);
                                    // Clear form fields
                                    (document.getElementById("clientFirstName") as HTMLInputElement).value = "";
                                    (document.getElementById("clientLastName") as HTMLInputElement).value = "";
                                    setSelectedNationality(""); // Fix: Clear nationality state
                                    (document.getElementById("clientPhone") as HTMLInputElement).value = "";
                                    (document.getElementById("clientAddress") as HTMLInputElement).value = "";
                                    (document.getElementById("drivingLicenseNumber") as HTMLInputElement).value = "";
                                    setLicenseIssueDate(undefined);
                                    setLicenseExpiryDate(undefined);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add New Client
                                </CommandItem>
                                {clients.map((client) => (
                                  <CommandItem
                                    key={client.id}
                                    value={`${client.firstName} ${client.lastName} ${client.drivingLicenseNumber}`}
                                    onSelect={() => {
                                      const value = client.id.toString();
                                      setSelectedClientId(value);
                                      setClientComboboxOpen(false);
                                      // Auto-fill form fields
                                      (document.getElementById("clientFirstName") as HTMLInputElement).value = client.firstName;
                                      (document.getElementById("clientLastName") as HTMLInputElement).value = client.lastName;
                                      setSelectedNationality(client.nationality || ""); // Fix: Update nationality state
                                      (document.getElementById("clientPhone") as HTMLInputElement).value = client.phone || "";
                                      (document.getElementById("clientAddress") as HTMLInputElement).value = client.address || "";
                                      (document.getElementById("drivingLicenseNumber") as HTMLInputElement).value = client.drivingLicenseNumber;
                                      setLicenseIssueDate(client.licenseIssueDate ? new Date(client.licenseIssueDate) : undefined);
                                      setLicenseExpiryDate(new Date(client.licenseExpiryDate));
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        selectedClientId === client.id.toString() ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    {client.firstName} {client.lastName} - {client.drivingLicenseNumber}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clientFirstName">First Name *</Label>
                        <Input id="clientFirstName" name="clientFirstName" required className="input-client" />
                      </div>
                      <div>
                        <Label htmlFor="clientLastName">Last Name *</Label>
                        <Input id="clientLastName" name="clientLastName" required className="input-client" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="clientNationality">Nationality</Label>
                        <Popover open={nationalityComboboxOpen} onOpenChange={setNationalityComboboxOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={nationalityComboboxOpen}
                              className="w-full justify-between"
                            >
                              {selectedNationality || "Select nationality..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search nationality..." />
                              <CommandList>
                                <CommandEmpty>No nationality found.</CommandEmpty>
                                <CommandGroup>
                                  {nationalities.map((nat) => (
                                    <CommandItem
                                      key={nat}
                                      value={nat}
                                      onSelect={(value) => {
                                        setSelectedNationality(value);
                                        setNationalityComboboxOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          selectedNationality === nat ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      {nat}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <input type="hidden" id="clientNationality" name="clientNationality" value={selectedNationality} />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="clientPhone">Phone Number</Label>
                        <Input id="clientPhone" name="clientPhone" type="tel" placeholder="e.g., +1 234 567 8900" className="input-client" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="clientAddress">Address</Label>
                        <Input id="clientAddress" name="clientAddress" placeholder="Street, City, State, ZIP" className="input-client" />
                      </div>
                    </div>
                  </div>

                  {/* Driving License */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Driving License</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="drivingLicenseNumber">License Number *</Label>
                        <Input id="drivingLicenseNumber" name="drivingLicenseNumber" required className="input-client" />
                      </div>
                      <div>
                        <DateDropdownSelector
                          id="licenseIssueDate"
                          label="Issue Date"
                          value={licenseIssueDate}
                          onChange={setLicenseIssueDate}
                          maxDate={new Date()} // Only allow current or past dates
                        />
                      </div>
                      <div>
                        <DateDropdownSelector
                          id="licenseExpiryDate"
                          label="Expiry Date"
                          value={licenseExpiryDate}
                          onChange={setLicenseExpiryDate}
                          minDate={new Date()} // Minimum: today (future dates only)
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rental Period */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Rental Period</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <DateDropdownSelector
                          id="rentalStartDate"
                          label="Rental Start Date *"
                          value={rentalStartDate}
                          onChange={setRentalStartDate}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          You can select any date, including past dates
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="rentalDays">Number of Rental Days *</Label>
                        <Input
                          id="rentalDays"
                          name="rentalDays"
                          type="number"
                          min="1"
                          value={rentalDays}
                          onChange={(e) => setRentalDays(parseInt(e.target.value) || 1)}
                          className="mt-1 input-client"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          End date will be calculated automatically
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label>End Date (Auto-calculated)</Label>
                        <Input
                          type="text"
                          value={rentalEndDate ? rentalEndDate.toLocaleDateString() : ""}
                          readOnly
                          className="bg-gray-50 input-client"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Vehicle Inspection</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label htmlFor="pickupKm">Pickup Odometer (KM) *</Label>
                        <Input
                          id="pickupKm"
                          name="pickupKm"
                          type="number"
                          min={(() => {
                            const vehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
                            return vehicle?.mileage || 0;
                          })()}
                          value={pickupKm}
                          onChange={(e) => setPickupKm(parseInt(e.target.value) || 0)}
                          placeholder="Enter current odometer reading"
                          required
                        />
                        {(() => {
                          const vehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
                          const registeredMileage = vehicle?.mileage || 0;
                          if (lastOdometerReading && lastOdometerReading > 0) {
                            return (
                              <p className="text-xs text-muted-foreground mt-1">
                                Auto-filled from last completed contract ({lastOdometerReading.toLocaleString()} km). Minimum: {registeredMileage.toLocaleString()} km (registered mileage).
                              </p>
                            );
                          } else if (registeredMileage > 0) {
                            return (
                              <p className="text-xs text-muted-foreground mt-1">
                                Minimum: {registeredMileage.toLocaleString()} km (vehicle's registered mileage).
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    <h3 className="font-semibold mb-4">Pricing</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dailyRate">Daily Rate ($) *</Label>
                        <Input
                          id="dailyRate"
                          name="dailyRate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={dailyRate}
                          onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Total Amount ($)</Label>
                        <Input
                          type="text"
                          value={totalAmount.toFixed(2)}
                          readOnly
                          className="bg-gray-50 input-client"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discount">Discount ($)</Label>
                        <Input
                          id="discount"
                          name="discount"
                          type="number"
                          step="0.01"
                          min="0"
                          max={totalAmount}
                          value={discount}
                          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Final Amount ($)</Label>
                        <Input
                          type="text"
                          value={finalAmount.toFixed(2)}
                          readOnly
                          className="bg-gray-50 font-bold text-lg input-client"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Insurance, Deposit, and Fuel Policy */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Additional Options</h3>
                    <InsuranceDepositSelector
                      rentalDays={rentalDays}
                      onInsuranceChange={(pkg, cost, dailyRate) => {
                        setInsurancePackage(pkg);
                        setInsuranceCost(cost);
                        setInsuranceDailyRate(dailyRate);
                      }}
                      onDepositChange={(amount, status) => {
                        setDepositAmount(amount);
                        setDepositStatus(status);
                      }}
                      onFuelPolicyChange={(policy) => {
                        setFuelPolicy(policy);
                      }}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createContract.isPending}>
                      {createContract.isPending ? "Creating..." : "Continue to Car Inspection"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Bulk Actions Bar */}
          {selectedContracts.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-blue-900">
                  {selectedContracts.length} contract(s) selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedContracts([])}
                  className="text-blue-700 hover:text-blue-900"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setPendingBulkAction("completed");
                    setConfirmDialogOpen(true);
                  }}
                  disabled={bulkUpdateMutation.isPending}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Mark as completed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPendingBulkAction("overdue");
                    setConfirmDialogOpen(true);
                  }}
                  disabled={bulkUpdateMutation.isPending}
                >
                  Archive
                </Button>
              </div>
            </div>
          )}
          
          {/* Status Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === "overdue" ? "default" : "outline"}
              onClick={() => setStatusFilter("overdue")}
            >
              Overdue
            </Button>
            <Button
              variant={!statusFilter ? "default" : "outline"}
              onClick={() => setStatusFilter(undefined)}
            >
              All
            </Button>
          </div>

          {/* Select All Checkbox */}
          {contracts.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="select-all"
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={selectedContracts.length === contracts.length && contracts.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedContracts(contracts.map((c: any) => c.id));
                  } else {
                    setSelectedContracts([]);
                  }
                }}
              />
              <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                Select All ({contracts.length})
              </label>
            </div>
          )}
          
          {/* Contracts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((contract: any) => {
              const vehicle = vehicles.find((v) => v.id === contract.vehicleId);
              return (
                <Card key={contract.id} className={`hover:shadow-lg transition-shadow ${
                  selectedContracts.includes(contract.id) ? "ring-2 ring-primary" : ""
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={selectedContracts.includes(contract.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContracts([...selectedContracts, contract.id]);
                            } else {
                              setSelectedContracts(selectedContracts.filter(id => id !== contract.id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-lg">
                          {contract.clientFirstName} {contract.clientLastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          contract.status === "active" ? "bg-green-100 text-green-800" :
                          contract.status === "completed" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {contract.status || "active"}
                        </span>
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600">Vehicle</div>
                        <div className="font-semibold">
                          {vehicle ? `${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model}` : "Unknown"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">License Number</div>
                        <div className="font-mono">{contract.drivingLicenseNumber}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-sm text-gray-600">Start Date</div>
                          <div className="text-sm font-semibold">
                            {new Date(contract.rentalStartDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Return Date</div>
                          <div className="text-sm font-semibold">
                            {new Date(contract.rentalEndDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {contract.clientNationality && (
                        <div>
                          <div className="text-sm text-gray-600">Nationality</div>
                          <div>{contract.clientNationality}</div>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedContract(contract);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        {contract.status === "active" && (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              // Open full return vehicle dialog
                              setSelectedContract(contract);
                              setIsReturnDialogOpen(true);
                            }}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Mark as completed
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {contracts.length === 0 && (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Contracts Yet</h3>
              <p className="text-gray-500 mb-6">Create your first rental contract to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gray-900 hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-2" />
                Create Contract
              </Button>
            </Card>
          )}
          </>
          )}

        {/* Contract Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] max-h-[98vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Contract Details</DialogTitle>
              <DialogDescription>View and manage complete contract information.</DialogDescription>
            </DialogHeader>
            {selectedContract && (() => {
              const vehicle = vehicles.find((v) => v.id === selectedContract.vehicleId);
              return (
                <div id="contract-content" className="contract-details-content print-content space-y-6 pr-2 overflow-y-auto flex-1">
                  {/* Company Branding Header */}
                  {companyProfile && (
                    <div className="bg-white border border-gray-300 p-6 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {companyProfile.logoUrl && (
                          <img 
                            src={companyProfile.logoUrl} 
                            alt={companyProfile.companyName} 
                            className="h-16 w-16 object-contain"
                          />
                        )}
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{companyProfile.companyName}</div>
                          {companyProfile.registrationNumber && (
                            <div className="text-sm text-gray-600">Reg. No: {companyProfile.registrationNumber}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        {companyProfile.phone && <div>{companyProfile.phone}</div>}
                        {companyProfile.email && <div>{companyProfile.email}</div>}
                        {companyProfile.address && <div>{companyProfile.address}</div>}
                      </div>
                    </div>
                  )}
                  
                  {/* Contract Number */}
                  <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Contract Number</div>
                    <div className="text-2xl font-bold font-mono text-gray-900">{selectedContract.contractNumber}</div>
                  </div>
                  {/* Client Information */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">Client Information</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card p-4 rounded-lg border border-border">
                      <div>
                        <div className="text-sm text-muted-foreground">Full Name</div>
                        <div className="font-semibold">{selectedContract.clientFirstName} {selectedContract.clientLastName}</div>
                      </div>
                      {selectedContract.clientNationality && (
                        <div>
                          <div className="text-sm text-muted-foreground">Nationality</div>
                          <div>{selectedContract.clientNationality}</div>
                        </div>
                      )}
                      {selectedContract.clientPhone && (
                        <div>
                          <div className="text-sm text-muted-foreground">Phone</div>
                          <div>{selectedContract.clientPhone}</div>
                        </div>
                      )}
                      {selectedContract.clientAddress && (
                        <div className="col-span-2">
                          <div className="text-sm text-muted-foreground">Address</div>
                          <div>{selectedContract.clientAddress}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-muted-foreground">License Number</div>
                        <div className="font-mono">{selectedContract.drivingLicenseNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">License Expiry</div>
                        <div>{new Date(selectedContract.licenseExpiryDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">Vehicle Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card p-4 rounded-lg border border-border">
                      <div>
                        <div className="text-sm text-muted-foreground">Plate Number</div>
                        <div className="font-semibold">{vehicle?.plateNumber || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Vehicle</div>
                        <div>{vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})` : "Unknown"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Category</div>
                        <div>{vehicle?.category || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Color</div>
                        <div>{vehicle?.color || "N/A"}</div>
                      </div>
                      {vehicle?.vin && (
                        <div className="col-span-2">
                          <div className="text-sm text-muted-foreground">VIN Number</div>
                          <div className="font-mono">{vehicle.vin}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rental Period & Pricing */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">Rental Period & Pricing</h3>
                    <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-lg border border-border">
                      <div>
                        <div className="text-sm text-muted-foreground">Start Date</div>
                        <div className="font-semibold">{new Date(selectedContract.rentalStartDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Return Date</div>
                        <div className="font-semibold">{new Date(selectedContract.rentalEndDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Rental Days</div>
                        <div>{selectedContract.rentalDays} days</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Daily Rate</div>
                        <div>${selectedContract.dailyRate}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total Amount</div>
                        <div>${selectedContract.totalAmount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Discount</div>
                        <div>${selectedContract.discount || "0.00"}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Final Amount</div>
                        <div className="text-2xl font-bold text-gray-900">${selectedContract.finalAmount}</div>
                      </div>
                      {selectedContract.status === "overdue" && (
                        <>
                          <div className="col-span-2 border-t border-gray-600 pt-4">
                            <div className="text-sm text-red-400">Days Overdue</div>
                            <div className="text-xl font-bold text-red-500">
                              {Math.floor((new Date().getTime() - new Date(selectedContract.rentalEndDate).getTime()) / (1000 * 60 * 60 * 24))} days
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-sm text-red-400">Late Fee (100% of daily rate)</div>
                            <div className="text-2xl font-bold text-red-500">${selectedContract.lateFee || "0.00"}</div>
                          </div>
                          <div className="col-span-4 border-t border-border/50 pt-4 mt-4">
                            <div className="text-sm text-muted-foreground">Total Amount Due (Rental + Late Fee)</div>
                            <div className="text-3xl font-bold text-red-500">
                              ${(parseFloat(selectedContract.finalAmount) + parseFloat(selectedContract.lateFee || "0")).toFixed(2)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Return Information - only show for completed contracts */}
                  {selectedContract.status === 'completed' && selectedContract.returnedAt && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">Return Information</h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Returned On</div>
                          <div className="font-semibold text-gray-900">{new Date(selectedContract.returnedAt).toLocaleDateString()} {new Date(selectedContract.returnedAt).toLocaleTimeString()}</div>
                        </div>
                        {selectedContract.pickupKm && selectedContract.returnKm && (
                          <>
                            <div>
                              <div className="text-sm text-gray-600">Pickup Odometer</div>
                              <div className="font-semibold text-gray-900">{selectedContract.pickupKm.toLocaleString()} km</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Return Odometer</div>
                              <div className="font-semibold text-gray-900">{selectedContract.returnKm.toLocaleString()} km</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Total Distance</div>
                              <div className="text-lg font-bold text-green-600">{(selectedContract.returnKm - selectedContract.pickupKm).toLocaleString()} km</div>
                            </div>
                          </>
                        )}
                        {selectedContract.fuelLevel && selectedContract.returnFuelLevel && (
                          <>
                            <div>
                              <div className="text-sm text-gray-600">Pickup Fuel Level</div>
                              <div className="font-semibold text-gray-900">{selectedContract.fuelLevel}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Return Fuel Level</div>
                              <div className="font-semibold text-gray-900">{selectedContract.returnFuelLevel}</div>
                            </div>
                          </>
                        )}
                        {/* KM Limit and Over-Limit Fee */}
                        {selectedContract.kmLimit && selectedContract.pickupKm && selectedContract.returnKm && (
                          <>
                            <div>
                              <div className="text-sm text-gray-600">KM Limit</div>
                              <div className="font-semibold text-gray-900">{selectedContract.kmLimit.toLocaleString()} km</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">KM Driven</div>
                              <div className={`font-semibold ${
                                (selectedContract.returnKm - selectedContract.pickupKm) > selectedContract.kmLimit
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}>
                                {(selectedContract.returnKm - selectedContract.pickupKm).toLocaleString()} km
                                {(selectedContract.returnKm - selectedContract.pickupKm) > selectedContract.kmLimit && (
                                  <span className="text-xs ml-1">(+{((selectedContract.returnKm - selectedContract.pickupKm) - selectedContract.kmLimit).toLocaleString()} km over)</span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                        {selectedContract.overLimitKmFee && parseFloat(selectedContract.overLimitKmFee) > 0 && (
                          <div className="col-span-2 bg-red-50 border border-red-200 p-3 rounded-md">
                            <div className="text-sm text-red-600 font-semibold mb-1">⚠️ Over-Limit KM Fee</div>
                            <div className="text-xl font-bold text-red-700">${parseFloat(selectedContract.overLimitKmFee).toFixed(2)}</div>
                          </div>
                        )}
                        {selectedContract.damageInspection && (
                          <div className="col-span-2 border-t border-green-300 pt-3 mt-2">
                            <div className="text-sm text-gray-600 mb-1 font-semibold">🔍 Damage Inspection</div>
                            <div className="text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">{selectedContract.damageInspection}</div>
                          </div>
                        )}
                        {selectedContract.returnNotes && (
                          <div className="col-span-2 border-t border-green-300 pt-3 mt-2">
                            <div className="text-sm text-gray-600 mb-1">Additional Notes</div>
                            <div className="text-gray-900 whitespace-pre-wrap">{selectedContract.returnNotes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Signature */}
                  {selectedContract.signatureData && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">Client Signature</h3>
                      <div className="bg-card p-4 rounded-lg border border-border">
                        <img src={selectedContract.signatureData} alt="Client Signature" className="max-w-full h-32 border border-gray-600 rounded" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* Hidden PDF Template for Export */}
            {selectedContract && (() => {
              const vehicle = vehicles.find((v) => v.id === selectedContract.vehicleId);
              return (
                <div 
                  id="contract-pdf-template" 
                  style={{ 
                    position: 'absolute', 
                    left: '-9999px', 
                    top: '0',
                    width: '210mm', // A4 width
                    backgroundColor: 'white'
                  }}
                >
                  <ContractPDFTemplate 
                    contract={{
                      ...selectedContract,
                      clientName: `${selectedContract.clientFirstName} ${selectedContract.clientLastName}`
                    }} 
                    vehicle={vehicle || null}
                    companyProfile={companyProfile || null}
                  />
                </div>
              );
            })()}
            <DialogFooter className="flex-shrink-0 border-t border-gray-700 pt-4 pb-2">
              {/* Button grid layout - 2 columns, equal sizing */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* Left side action buttons */}
                <Button 
                  onClick={() => {
                    if (!selectedContract) {
                      toast.error("No contract selected");
                      return;
                    }
                    
                    const printContent = document.getElementById('contract-content');
                    if (!printContent) {
                      toast.error("Contract content not found");
                      return;
                    }
                    
                    // Create a new window for printing
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) {
                      toast.error("Please allow popups to print");
                      return;
                    }
                    
                    // Write the contract content to the new window with styles
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Contract ${selectedContract.contractNumber}</title>
                          <script src="https://cdn.tailwindcss.com"></script>
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { font-family: Arial, sans-serif; padding: 32px; background: white; }
                            @media print {
                              body { padding: 0; }
                              @page { margin: 0.5in; }
                            }
                            .border { border: 1px solid #e5e7eb; }
                            .rounded-lg { border-radius: 8px; }
                          </style>
                        </head>
                        <body>
                          ${printContent.innerHTML}
                        </body>
                      </html>
                    `);
                    
                    printWindow.document.close();
                    
                    // Wait for Tailwind CDN and content to load, then print
                    printWindow.onload = () => {
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 1000);
                    };
                  }} 
                  variant="outline"
                  className="h-10 w-full"
                  size="default"
                >
                  🖨️ Print Contract
                </Button>
                <Button 
                  onClick={async () => {
                    if (!selectedContract) {
                      toast.error("No contract selected");
                      return;
                    }
                    
                    try {
                      toast.info("Generating PDF with custom template...");
                      
                      // Call tRPC procedure to generate PDF
                      const result = await generatePdfMutation.mutateAsync({
                        contractId: selectedContract.id
                      });
                      
                      // Convert number array back to Uint8Array
                      const pdfBytes = new Uint8Array(result.pdfData);
                      
                      // Create blob and download
                      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = result.fileName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      
                      toast.success("PDF generated successfully!");
                    } catch (error: any) {
                      console.error("PDF export error:", error);
                      toast.error(`Failed to export PDF: ${error.message || 'Unknown error'}`);
                    }
                  }} 
                  variant="outline"
                  className="h-10 w-full"
                  size="default"
                >
                  📄 Export with Custom Template
                </Button>
                <Button 
                  onClick={async () => {
                    if (!selectedContract) {
                      toast.error("No contract selected");
                      return;
                    }
                    
                    // Get vehicle details from vehicles array
                    const vehicle = vehicles.find((v) => v.id === selectedContract.vehicleId);
                    if (!vehicle) {
                      toast.error("Vehicle information not found");
                      return;
                    }
                    
                    try {
                      toast.info("Generating PDF for WhatsApp... Please wait");
                      
                      // Get the contract content element
                      const contractElement = document.getElementById('contract-content');
                      if (!contractElement) {
                        toast.error("Contract content not found");
                        return;
                      }
                      
                      // Store original styles
                      const originalOverflow = contractElement.style.overflow;
                      const originalHeight = contractElement.style.height;
                      const originalMaxHeight = contractElement.style.maxHeight;
                      
                      // Temporarily make element fully visible for capture
                      contractElement.style.overflow = 'visible';
                      contractElement.style.height = 'auto';
                      contractElement.style.maxHeight = 'none';
                      
                      // Create an absolutely isolated clone with comprehensive diagnostics
                      console.log('🚀 Starting PDF export with absolute isolation...');
                      const safeClone = await createSanitizedPdfClone(contractElement);
                      
                      // Make the clone visible with same dimensions as original
                      safeClone.style.position = 'static';
                      safeClone.style.left = '0';
                      safeClone.style.top = '0';
                      safeClone.style.overflow = 'visible';
                      safeClone.style.height = 'auto';
                      safeClone.style.maxHeight = 'none';
                      
                      try {
                        // Wait a moment for styles to apply
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Use html2canvas to capture the SAFE CLONE (not the original)
                        const canvas = await html2canvas(safeClone, {
                          scale: 2,
                          useCORS: true,
                          logging: false,
                          backgroundColor: "#ffffff",
                        });
                        
                        // Restore original styles
                        contractElement.style.overflow = originalOverflow;
                        contractElement.style.height = originalHeight;
                        contractElement.style.maxHeight = originalMaxHeight;
                        
                        // Clean up the safe clone
                        cleanupSanitizedClone(safeClone);
                      
                        // Create PDF with jsPDF
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF({
                          orientation: 'portrait',
                          unit: 'mm',
                          format: 'a4'
                        });
                        
                        // Calculate dimensions to fit A4 page (with margins)
                        const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
                        const pdfHeight = pdf.internal.pageSize.getHeight() - 20;
                        const imgWidth = canvas.width;
                        const imgHeight = canvas.height;
                        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                        
                        // Check if content fits on one page
                        const scaledHeight = imgHeight * ratio;
                        
                        if (scaledHeight <= pdfHeight) {
                          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth * ratio, imgHeight * ratio);
                        } else {
                          // Need multiple pages
                          let yPosition = 0;
                          let pageCount = 0;
                          
                          while (yPosition < imgHeight) {
                            if (pageCount > 0) {
                              pdf.addPage();
                            }
                            
                            const sourceY = yPosition;
                            const sourceHeight = Math.min(imgHeight - yPosition, pdfHeight / ratio);
                            
                            const pageCanvas = document.createElement('canvas');
                            pageCanvas.width = imgWidth;
                            pageCanvas.height = sourceHeight;
                            const pageCtx = pageCanvas.getContext('2d');
                            
                            if (pageCtx) {
                              pageCtx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
                              const pageImgData = pageCanvas.toDataURL('image/png');
                              pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth * ratio, sourceHeight * ratio);
                            }
                            
                            yPosition += sourceHeight;
                            pageCount++;
                          }
                        }
                        
                        // Convert PDF to base64
                        const pdfBase64 = pdf.output('datauristring');
                        
                        toast.info("Uploading PDF to cloud storage...");
                        
                        // Upload PDF to S3
                        const uploadResult = await uploadPdfMutation.mutateAsync({
                          base64Data: pdfBase64,
                          filename: `Contract-${selectedContract.contractNumber}.pdf`,
                        });
                        
                        // Generate and upload thumbnail
                        toast.info("Generating thumbnail...");
                        const thumbnailDataUrl = await generateThumbnail(contractElement, 300, 400);
                        const thumbnailResult = await uploadThumbnailMutation.mutateAsync({
                          thumbnailData: thumbnailDataUrl,
                          filename: `Contract-${selectedContract.contractNumber}-thumb.jpg`,
                        });
                        
                        // Use company phone number from settings
                        if (!companySettings?.phone) {
                          toast.error("Company phone number not set in settings");
                          return;
                        }
                        const phoneNumber = companySettings.phone.replace(/[\s\-\(\)]/g, '');
                        
                        // Get custom template or use default
                        const template = whatsappTemplate?.messageTemplate || getDefaultTemplate('contract_created');
                        
                        // Parse template with actual data
                        const message = parseTemplate(template, {
                          contractNumber: selectedContract.contractNumber,
                          clientName: `${selectedContract.clientFirstName} ${selectedContract.clientLastName}`,
                          vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
                          startDate: formatTemplateDate(selectedContract.rentalStartDate),
                          endDate: formatTemplateDate(selectedContract.rentalEndDate),
                          totalAmount: formatTemplateCurrency(selectedContract.finalAmount),
                          pdfUrl: uploadResult.url,
                          thumbnailUrl: thumbnailResult.url,
                        });
                        
                        // Encode message for URL
                        const encodedMessage = encodeURIComponent(message);
                        
                        toast.success("PDF and thumbnail uploaded! Opening WhatsApp...");
                        
                        // Open WhatsApp with pre-filled message
                        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
                      } catch (innerError: any) {
                        // Clean up the safe clone even if there's an error
                        cleanupSanitizedClone(safeClone);
                        // Restore original styles
                        contractElement.style.overflow = originalOverflow;
                        contractElement.style.height = originalHeight;
                        contractElement.style.maxHeight = originalMaxHeight;
                        throw innerError;
                      }
                    } catch (error: any) {
                      console.error("WhatsApp PDF share error:", error);
                      toast.error(`Failed to share PDF: ${error.message || 'Unknown error'}`);
                    }
                  }} 
                  variant="outline"
                  className="h-10 w-full"
                  size="default"
                >
                  Share via WhatsApp
                </Button>
                {/* Invoice button - show for completed contracts */}
                {selectedContract?.status === 'completed' && (
                  contractInvoice ? (
                    <Button 
                      onClick={() => {
                        // Redirect to invoices page and open the invoice
                        window.location.href = `/invoices?invoice=${contractInvoice.id}`;
                      }} 
                      variant="outline"
                      className="h-10 w-full"
                      size="default"
                    >
                      View Invoice ({contractInvoice.invoiceNumber})
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {
                        if (selectedContract) {
                          generateInvoice.mutate({ contractId: selectedContract.id });
                        }
                      }} 
                      variant="outline"
                      className="h-10 w-full"
                      size="default"
                      disabled={generateInvoice.isPending}
                    >
                      {generateInvoice.isPending ? "Generating..." : "Generate Invoice"}
                    </Button>
                  )
                )}
                {/* Mark as Returned button - only show for active contracts */}
                {selectedContract?.status === 'active' && (
                  <Button 
                    onClick={() => setIsReturnDialogOpen(true)} 
                    variant="outline"
                    className="h-10 w-full"
                    size="default"
                  >
                    Mark as Returned
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    if (selectedContract && window.confirm(`Are you sure you want to delete contract ${selectedContract.contractNumber}? This action cannot be undone.`)) {
                      deleteContract.mutate({ contractId: selectedContract.id });
                    }
                  }}
                  variant="outline"
                  className="h-10 w-full"
                  size="default"
                  disabled={deleteContract.isPending}
                >
                  {deleteContract.isPending ? "Deleting..." : "Delete Contract"}
                </Button>                
                {/* Right side navigation buttons */}
                <Button 
                  onClick={() => {
                    setAdditionalDays(1);
                    setIsRenewDialogOpen(true);
                  }} 
                  variant="outline"
                  className="h-10 w-full"
                  size="default"
                >
                  Renew Contract
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailsDialogOpen(false)}
                  className="h-10 w-full"
                  size="default"
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Renew Contract Dialog */}
        <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renew Contract</DialogTitle>
              <DialogDescription>Create a new contract based on this existing contract.</DialogDescription>
            </DialogHeader>
            {selectedContract && (() => {
              const currentEndDate = new Date(selectedContract.rentalEndDate);
              const newEndDate = new Date(currentEndDate);
              newEndDate.setDate(newEndDate.getDate() + additionalDays);
              const dailyRateNum = parseFloat(selectedContract.dailyRate);
              const additionalCost = dailyRateNum * additionalDays;
              
              return (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3 border border-border">
                    <div>
                      <div className="text-sm text-muted-foreground">Current End Date</div>
                      <div className="font-semibold text-foreground">{currentEndDate.toLocaleDateString()}</div>
                    </div>
                    <div>
                      <Label htmlFor="additionalDays">Additional Days</Label>
                      <Input
                        id="additionalDays"
                        type="number"
                        min="1"
                        value={additionalDays}
                        onChange={(e) => setAdditionalDays(parseInt(e.target.value) || 1)}
                        className="input-client"
                      />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">New End Date</div>
                      <div className="font-semibold text-foreground">{newEndDate.toLocaleDateString()}</div>
                    </div>
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="text-sm text-muted-foreground">Daily Rate</div>
                      <div className="text-foreground">${dailyRateNum.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground mt-2">Additional Cost</div>
                      <div className="text-xl font-bold text-foreground">${additionalCost.toFixed(2)}</div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRenewDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        renewContract.mutate({
                          contractId: selectedContract.id,
                          additionalDays,
                          newEndDate,
                        });
                      }}
                      className="bg-gray-900 hover:bg-gray-800"
                    >
                      Confirm Renewal
                    </Button>
                  </DialogFooter>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
        
        {/* Bulk Action Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Bulk Action</DialogTitle>
              <DialogDescription>Confirm the action you want to perform on selected contracts.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                You are about to {pendingBulkAction === "completed" ? "mark as returned" : "archive"} {selectedContracts.length} contract(s).
              </p>
              <div className="max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-700 mb-2">Affected Contracts:</p>
                <ul className="space-y-1">
                  {selectedContracts.map(contractId => {
                    const contract = contracts.find((c: any) => c.id === contractId);
                    const vehicle = vehicles.find((v: any) => v.id === contract?.vehicleId);
                    return contract ? (
                      <li key={contractId} className="text-sm py-1.5 px-2 bg-white rounded border">
                        {contract.clientFirstName} {contract.clientLastName} - {vehicle?.brand} {vehicle?.model}
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmDialogOpen(false);
                  setPendingBulkAction(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className={pendingBulkAction === "completed" ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => {
                  if (pendingBulkAction) {
                    bulkUpdateMutation.mutate({
                      contractIds: selectedContracts,
                      status: pendingBulkAction,
                    });
                  }
                  setConfirmDialogOpen(false);
                  setPendingBulkAction(null);
                }}
                disabled={bulkUpdateMutation.isPending}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Return Inspection Dialog */}
        <Dialog open={returnInspectionOpen} onOpenChange={setReturnInspectionOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Return Inspection</DialogTitle>
              <DialogDescription>Document vehicle condition upon return.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Please enter the odometer reading at vehicle return to complete the contract.
              </p>
              <div>
                <Label htmlFor="returnKm">Return Odometer (KM) *</Label>
                <Input
                  id="returnKm"
                  type="number"
                  min="0"
                  value={returnKm}
                  onChange={(e) => setReturnKm(parseInt(e.target.value) || 0)}
                  placeholder="Enter current odometer reading"
                  required
                  className="input-client"
                />
                {selectedContractForReturn && (() => {
                  const contract = contracts.find(c => c.id === selectedContractForReturn);
                  if (contract && contract.pickupKm && returnKm > 0 && returnKm <= contract.pickupKm) {
                    return (
                      <p className="text-sm text-red-600 mt-1">
                        Return odometer ({returnKm} km) must be greater than pickup odometer ({contract.pickupKm} km)
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
              {selectedContractForReturn && (() => {
                const contract = contracts.find(c => c.id === selectedContractForReturn);
                if (contract && contract.pickupKm && returnKm > 0) {
                  const kmDriven = returnKm - contract.pickupKm;
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pickup KM:</span>
                          <span className="font-semibold">{contract.pickupKm} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Return KM:</span>
                          <span className="font-semibold">{returnKm} km</span>
                        </div>
                        <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                          <span className="text-gray-600">Total Driven:</span>
                          <span className="font-bold text-blue-600">{kmDriven} km</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReturnInspectionOpen(false);
                  setSelectedContractForReturn(null);
                  setReturnKm(0);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (selectedContractForReturn && returnKm > 0) {
                    const contract = contracts.find(c => c.id === selectedContractForReturn);
                    if (contract && contract.pickupKm && returnKm <= contract.pickupKm) {
                      toast.error(`Return odometer (${returnKm} km) must be greater than pickup odometer (${contract.pickupKm} km)`);
                      return;
                    }
                    markAsReturnedMutation.mutate({ 
                      contractId: selectedContractForReturn,
                      returnKm 
                    });
                    setReturnInspectionOpen(false);
                    setSelectedContractForReturn(null);
                    setReturnKm(0);
                  }
                }}
                disabled={returnKm <= 0 || markAsReturnedMutation.isPending || (() => {
                  const contract = contracts.find(c => c.id === selectedContractForReturn);
                  return !!(contract && contract.pickupKm && returnKm > 0 && returnKm <= contract.pickupKm);
                })()}
              >
                {markAsReturnedMutation.isPending ? "Completing..." : "Complete Contract"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Return Vehicle Dialog */}
      {selectedContract && (
        <ReturnVehicleDialog
          open={isReturnDialogOpen}
          onOpenChange={setIsReturnDialogOpen}
          contractId={selectedContract.id}
          contractNumber={selectedContract.contractNumber}
          pickupKm={selectedContract.pickupKm}
          pickupFuelLevel={selectedContract.fuelLevel}
          kmLimit={selectedContract.kmLimit}
          overLimitKmRate={selectedContract.overLimitKmRate ? parseFloat(selectedContract.overLimitKmRate) : 0.5}
          onSuccess={async () => {
            // Refresh contracts list
            refetch();
            // Close details dialog
            setIsDetailsDialogOpen(false);
            const contractId = selectedContract.id;
            setSelectedContract(null);
            
            // Generate invoice and navigate to it
            setTimeout(async () => {
              try {
                const invoice = await generateInvoice.mutateAsync({ contractId });
                // Navigate to invoices page with invoice dialog open
                if (invoice && invoice.id) {
                  window.location.href = `/invoices?invoice=${invoice.id}`;
                } else {
                  window.location.href = '/dashboard';
                }
              } catch (error) {
                console.error('Failed to generate invoice:', error);
                // Fallback to dashboard if invoice generation fails
                window.location.href = '/dashboard';
              }
            }, 1000); // Wait 1 second to show success message
          }}
        />
      )}
    </SidebarLayout>
  );
}
