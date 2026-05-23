import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { printElement, exportElementToPDF, exportContractTemplateToPDF, exportTemplateOverlayToPDF } from "@/lib/printUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserFilter } from "@/contexts/UserFilterContext";
import { Building2, FileText, LayoutDashboard, Plus, Wrench, Eye, Users, Check, ChevronsUpDown, Home, Settings, BarChart3, Download, Car, User, Calendar, DollarSign, Shield, Gauge, Clock, X, ChevronRight, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { createSanitizedPdfClone, cleanupSanitizedClone, validateNoModernCss } from "@/lib/pdfSanitizerEngine";
import { parseTemplate, formatTemplateDate, formatTemplateCurrency, getDefaultTemplate } from "@/lib/templateParser";
import { generateThumbnail } from "@/lib/thumbnailGenerator";
import { WORLD_NATIONALITIES } from "@shared/nationalities";
import { exportContractsToCSV } from "@shared/csvExport";
import { useTranslation } from "react-i18next";

export default function RentalContracts() {
  const { t } = useTranslation();
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
  const [rentalStartDate, setRentalStartDate] = useState<Date>(new Date());
  const [rentalEndDate, setRentalEndDate] = useState<Date>();
  const [pickupTime, setPickupTime] = useState<string>("");

  // Second driver states
  const [secondDriverClientId, setSecondDriverClientId] = useState<string>("");
  const [secondDriverComboboxOpen, setSecondDriverComboboxOpen] = useState(false);
  const [secondDriverLicenseIssueDate, setSecondDriverLicenseIssueDate] = useState<Date | undefined>();
  const [secondDriverLicenseExpiryDate, setSecondDriverLicenseExpiryDate] = useState<Date | undefined>();
  
  // Pricing states
  const [rentalDays, setRentalDays] = useState<number>(1);
  const [dailyRate, setDailyRate] = useState<number>(0);
  const [isHighSeason, setIsHighSeason] = useState<boolean>(false);
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
  const [lateFeePercentage, setLateFeePercentage] = useState<string>("");
  const [fuelPolicy, setFuelPolicy] = useState<"Full-to-Full" | "Same-to-Same" | "Pre-purchase">("Full-to-Full");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [vehicleComboboxOpen, setVehicleComboboxOpen] = useState(false);
  const [nationalityComboboxOpen, setNationalityComboboxOpen] = useState(false);
  const [selectedNationality, setSelectedNationality] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"active" | "completed" | "overdue" | undefined>("active");
  const [contractSearch, setContractSearch] = useState("");
  const [selectedContracts, setSelectedContracts] = useState<number[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<"completed" | "overdue" | null>(null);
  const [returnInspectionOpen, setReturnInspectionOpen] = useState(false);
  const [selectedContractForReturn, setSelectedContractForReturn] = useState<number | null>(null);
  const [postCompletionModal, setPostCompletionModal] = useState<{
    contract: any;
    vehicle: any;
    invoiceDestination: string;
  } | null>(null);

  // Auto-print state: set after inspection-complete contract creation to trigger print then open invoice
  const [autoPrintData, setAutoPrintData] = useState<{
    contract: any;
    vehicle: any;
    damageMarks: any[];
    invoiceDestination: string;
  } | null>(null);
  
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
  
  // Fetch company profile for VAT and exchange rates
  const { data: companyProfile } = trpc.company.getProfile.useQuery();
  const vatRate = companyProfile?.vatRate ? Number(companyProfile.vatRate) : 11;
  const exchangeRate = companyProfile?.exchangeRate ? Number(companyProfile.exchangeRate) : 1.0;
  const { data: allInvoices = [] } = trpc.invoices.list.useQuery();
  const { data: highSeasonPeriodsList = [] } = trpc.highSeason.list.useQuery(
    selectedTargetUserId ? { filterUserId: selectedTargetUserId } : undefined
  );
  const { data: selectedContractDamageMarks = [] } = trpc.contracts.getDamageMarks.useQuery(
    { contractId: selectedContract?.id ?? 0 },
    { enabled: !!selectedContract }
  );
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
      // Capture contract data before clearing state
      const completedContract = contracts.find(c => c.id === selectedContractForReturn);
      const completedVehicle = completedContract ? vehicles.find(v => v.id === completedContract.vehicleId) : null;

      // Close dialog and reset state
      setReturnInspectionOpen(false);
      setSelectedContractForReturn(null);
      setReturnKm(0);
      
      toast.success("Contract marked as completed");
      
      // Show maintenance alert if due
      if (data.maintenanceAlert && data.maintenanceAlert.isDue) {
        const alert = data.maintenanceAlert;
        toast.warning(
          `⚠️ MAINTENANCE DUE: ${alert.vehiclePlate} (${alert.vehicleModel}) has reached ${alert.currentKm} km. Maintenance was due at ${alert.maintenanceDueKm} km (${alert.kmOverdue} km overdue).`,
          { duration: 10000 }
        );
      }
      
      if (data.invoice) {
        toast.success("Invoice automatically generated!", {
          description: `Invoice ${data.invoice.invoiceNumber} has been created for this contract.`,
          duration: 4000,
        });
      }

      utils.contracts.listByStatus.invalidate();
      utils.contracts.list.invalidate();
      utils.fleet.list.invalidate();
      utils.invoices.list.invalidate();

      // Show post-completion action sheet instead of immediately redirecting
      const destination = data.invoice?.id
        ? `/invoices?invoice=${data.invoice.id}`
        : "/dashboard";
      if (completedContract) {
        setPostCompletionModal({ contract: completedContract, vehicle: completedVehicle, invoiceDestination: destination });
      } else {
        setTimeout(() => setLocation(destination), 800);
      }
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
  
  // Auto-set start date to today and pickup time to current system time whenever the dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      const now = new Date();
      setRentalStartDate(now);
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setPickupTime(`${hh}:${mm}`);
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
  
  // Load daily rate when vehicle is selected and adjust based on rental duration + high season
  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
      if (vehicle) {
        // Check if rental start date falls within any high season period
        let inHighSeason = false;
        if (rentalStartDate && highSeasonPeriodsList.length > 0) {
          const startTs = rentalStartDate.getTime();
          inHighSeason = highSeasonPeriodsList.some((period: any) => {
            const periodStart = new Date(period.startDate).getTime();
            const periodEnd = new Date(period.endDate).getTime();
            // Add one day to end date to make it inclusive
            return startTs >= periodStart && startTs <= periodEnd + 86400000;
          });
        }
        setIsHighSeason(inHighSeason);

        let rate = 0;

        if (inHighSeason) {
          // High season tiered pricing
          if (rentalDays >= 30 && vehicle.highSeasonMonthlyRate) {
            rate = parseFloat(vehicle.highSeasonMonthlyRate);
          } else if (rentalDays >= 7 && vehicle.highSeasonWeeklyRate) {
            rate = parseFloat(vehicle.highSeasonWeeklyRate);
          } else if (vehicle.highSeasonDailyRate) {
            rate = parseFloat(vehicle.highSeasonDailyRate);
          }
          // If no high season rate is set for this tier, fall back to normal rate
          if (!rate) inHighSeason = false;
        }

        if (!inHighSeason) {
          // Normal tiered pricing based on rental duration
          if (rentalDays >= 30 && vehicle.monthlyRate) {
            rate = parseFloat(vehicle.monthlyRate);
          } else if (rentalDays >= 7 && vehicle.weeklyRate) {
            rate = parseFloat(vehicle.weeklyRate);
          } else if (vehicle.dailyRate) {
            rate = parseFloat(vehicle.dailyRate);
          }
        }

        setDailyRate(rate);
      }
    }
  }, [selectedVehicleId, vehicles, rentalDays, rentalStartDate, highSeasonPeriodsList]);
  
  const createContract = trpc.contracts.create.useMutation({
    onSuccess: () => {
      utils.contracts.list.invalidate();
      utils.contracts.listByStatus.invalidate();
      utils.fleet.list.invalidate();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create contract: ${error.message}`);
    },
  });

  const addDamageMark = trpc.contracts.addDamageMark.useMutation();
  
  const renewContract = trpc.contracts.renew.useMutation({
    onSuccess: () => {
      toast.success(t("contracts.contractRenewed"));
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
      utils.contracts.list.invalidate();
      utils.contracts.getById.invalidate();
      utils.fleet.list.invalidate(); // Refresh vehicle statuses so deleted contract frees the car
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
  const { data: whatsappTemplate } = trpc.whatsappTemplates.get.useQuery(
    { templateType: 'contract_created' },
    { enabled: isDetailsDialogOpen && !!selectedContract }
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      clientMotherFullName: formData.get("clientMotherFullName") as string || undefined,
      clientFatherFullName: formData.get("clientFatherFullName") as string || undefined,
      clientNationality: formData.get("clientNationality") as string || undefined,
      clientPhone: formData.get("clientPhone") as string || undefined,
      clientAddress: formData.get("clientAddress") as string || undefined,
      clientPassportNumber: formData.get("clientPassportNumber") as string || undefined,
      clientPlaceOfBirth: formData.get("clientPlaceOfBirth") as string || undefined,
      clientDateOfBirth: formData.get("clientDateOfBirth") as string || undefined,
      clientRegistrationNumber: formData.get("clientRegistrationNumber") as string || undefined,
      clientPlaceOfRegistration: formData.get("clientPlaceOfRegistration") as string || undefined,
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
      pickupTime: pickupTime || undefined,
      // Insurance fields
      insurancePackage,
      insuranceCost: insuranceCost.toFixed(2),
      insuranceDailyRate: insuranceDailyRate.toFixed(2),
      // Deposit fields
      depositAmount: depositAmount.toFixed(2),
      depositStatus,
      // Late fee
      ...(lateFeePercentage !== "" && { lateFeePercentage: lateFeePercentage }),
      // Fuel policy
      fuelPolicy,
      // Second driver
      ...(secondDriverClientId ? (() => {
        const c = clients.find(cl => cl.id.toString() === secondDriverClientId);
        return {
          secondDriverName: c?.name || undefined,
          secondDriverDateOfBirth: (c as any)?.dateOfBirth ? new Date((c as any).dateOfBirth) : undefined,
          secondDriverLicenseIssueDate: secondDriverLicenseIssueDate,
          secondDriverLicenseExpiryDate: secondDriverLicenseExpiryDate,
        };
      })() : {}),
      targetUserId: selectedTargetUserId || undefined,
    };
    
    // Check for scheduling conflict BEFORE opening the inspection form
    try {
      const conflict = await utils.contracts.checkConflict.fetch({
        vehicleId: data.vehicleId,
        rentalStartDate: data.rentalStartDate,
        rentalEndDate: data.rentalEndDate,
      });
      if (conflict.hasConflict && conflict.conflictingContract) {
        const c = conflict.conflictingContract as any;
        toast.error(
          `This vehicle already has a contract (${c.contractNumber}) from ${new Date(c.rentalStartDate).toLocaleDateString()} to ${new Date(c.rentalEndDate).toLocaleDateString()}. Please choose different dates or a different vehicle.`
        );
        return;
      }
    } catch {
      // If the pre-check fails for any reason, the server will catch it at create time
    }

    setContractData(data);
    setIsCreateDialogOpen(false);
    setShowInspection(true);
  };

  // Auto-print effect: triggered after inspection-complete contract creation
  useEffect(() => {
    if (!autoPrintData) return;
    const { contract: c, vehicle: v, damageMarks: dm, invoiceDestination } = autoPrintData;

    const triggerAutoPrint = async () => {
      // Wait for the ContractPDFTemplate portal to render
      await new Promise(r => setTimeout(r, 800));

      try {
        toast.info("Opening print dialog for contract…");
        printElement("contract-pdf-template", `Contract ${c.contractNumber || c.id}`);
      } catch (err) {
        console.error("Auto-print failed:", err);
      }

      // Navigate to invoice after print dialog opens
      setAutoPrintData(null);
      setTimeout(() => setLocation(invoiceDestination), 1200);
    };

    triggerAutoPrint();
  }, [autoPrintData]);

  const handleInspectionComplete = (damageMarks: any[], signatureData: string, fuelLevel: string) => {
    if (!contractData) return;

    createContract.mutate({
      ...contractData,
      signatureData,
      fuelLevel,
    }, {
      onSuccess: (contract) => {
        // Save damage marks as fire-and-forget (don't block navigation)
        damageMarks.forEach(mark => {
          addDamageMark.mutate({
            contractId: contract.id,
            xPosition: mark.x.toString(),
            yPosition: mark.y.toString(),
            view: mark.view,
            description: mark.description,
            symbol: mark.symbol ?? "X",
          });
        });

        setShowInspection(false);
        setContractData(null);
        setIsCreateDialogOpen(false);

        // Refresh contracts list
        utils.contracts.listByStatus.invalidate();
        utils.contracts.list.invalidate();
        utils.fleet.list.invalidate();

        const vehicle = vehicles.find(v => v.id === (contract as any).vehicleId);
        const invoiceDestination = (contract as any).invoice?.id
          ? `/invoices?invoice=${(contract as any).invoice.id}`
          : "/invoices";

        toast.success(`Contract ${contract.contractNumber} created! Preparing contract print…`);

        // Trigger auto-print then open invoice
        setAutoPrintData({ contract, vehicle, damageMarks, invoiceDestination });
      },
      onError: (error) => {
        console.error("Error creating contract:", error);
        toast.error(`Failed to create contract: ${error.message}`);
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
    <>
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
                onBack={() => {
                  setShowInspection(false);
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
                  insurancePackage: insurancePackage,
                  insuranceCost: insuranceCost,
                  insuranceDailyRate: insuranceDailyRate,
                  depositAmount: depositAmount,
                  depositStatus: depositStatus,
                  fuelPolicy: fuelPolicy,
                } : undefined}
              />
            </div>
          ) : (
          <>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("contracts.title")}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage rental agreements and client information</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (!contracts || contracts.length === 0) {
                    toast.error(t("contracts.noContractsToExport"));
                    return;
                  }
                  exportContractsToCSV(contracts, vehicles);
                  toast.success(`Exported ${contracts.length} contracts`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              
              {/* ── Trigger Button ─────────────────────────────────────────── */}
              <Button
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Contract
              </Button>

              {/* ── Full-Width Workspace Portal ───────────────────────────── */}
              {isCreateDialogOpen && createPortal(
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5"
                  onClick={(e) => { if (e.target === e.currentTarget) setIsCreateDialogOpen(false); }}
                >
                  <div
                    className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-[90vw] max-w-[1400px]"
                    style={{ height: "min(90vh, 940px)" }}
                  >

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-gradient-to-r from-blue-900 to-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/15 rounded-xl p-2">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h2 className="text-white font-bold text-base leading-tight">New Rental Contract</h2>
                          <p className="text-blue-200 text-xs">Fill in all required fields to continue to the vehicle inspection</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-white/60 hover:text-white transition-colors rounded-lg p-1.5 hover:bg-white/10"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Stepper */}
                    <div className="flex items-center gap-0 px-6 py-2.5 bg-blue-50/70 border-b border-blue-100/60 shrink-0">
                      {[
                        { n: 1, label: "Vehicle" },
                        { n: 2, label: "Client Details" },
                        { n: 3, label: "Dates & Pricing" },
                        { n: 4, label: "Car Inspection" },
                      ].map((step, i, arr) => (
                        <div key={step.n} className="flex items-center">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step.n < 4 ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-400"
                            }`}>
                              {step.n < 4 ? <Check className="w-3 h-3" /> : step.n}
                            </div>
                            <span className={`text-xs font-medium ${step.n < 4 ? "text-blue-800" : "text-gray-400"}`}>{step.label}</span>
                          </div>
                          {i < arr.length - 1 && (
                            <div className={`mx-3 h-px w-10 ${step.n < 4 ? "bg-blue-300" : "bg-gray-200"}`} />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                      {/* ── Two-Column Body ─────────────────────────────────── */}
                      <div className="flex-1 overflow-y-auto sm:overflow-hidden min-h-0 sm:flex sm:flex-row">

                        {/* ═══ LEFT COLUMN ════════════════════════════════════ */}
                        <div className="w-full sm:flex sm:flex-col sm:w-[52%] border-b sm:border-b-0 sm:border-r border-gray-100 sm:overflow-y-auto bg-white">
                          <div className="p-5 space-y-5">

                            {/* Vehicle Selection */}
                            <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-slate-50 to-white">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-600">
                                  <Car className="w-3.5 h-3.5" />
                                </span>
                                <h3 className="font-semibold text-xs text-gray-700 tracking-wider uppercase">Vehicle Selection</h3>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="vehiclePlateNumber" className="text-xs font-medium text-gray-500 mb-1.5 block">Plate Number *</Label>
                                  <input type="hidden" name="vehicleId" value={selectedVehicleId} required />
                                  <Popover open={vehicleComboboxOpen} onOpenChange={setVehicleComboboxOpen}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={vehicleComboboxOpen}
                                        className="w-full justify-between font-normal h-9 text-sm border-[#1e3a8a]/30"
                                      >
                            {selectedVehicleId
                              ? (() => {
                                  const vehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
                                  if (!vehicle) return "Select plate...";
                                  return (
                                    <span className="flex items-center gap-1.5 truncate">
                                      <span className="text-xs">🟢</span>
                                      <span className="font-semibold text-xs">{vehicle.plateNumber}</span>
                                    </span>
                                  );
                                })()
                              : <span className="text-gray-400 text-xs">Select plate...</span>}
                                        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[340px] p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="Search by plate number..." />
                                        <CommandList>
                                          <CommandEmpty>No vehicle found.</CommandEmpty>
                                          <CommandGroup>
                                            {vehicles.filter(v => v.status === "Available").map((vehicle) => (
                                              <CommandItem
                                                key={vehicle.id}
                                                value={`${vehicle.plateNumber} ${vehicle.brand} ${vehicle.model}`}
                                                onSelect={() => {
                                                  setSelectedVehicleId(vehicle.id.toString());
                                                  (document.getElementById("vehicleModel") as HTMLInputElement).value = `${vehicle.brand} ${vehicle.model}`;
                                                  setVehicleComboboxOpen(false);
                                                }}
                                              >
                                                <Check className={`mr-2 h-4 w-4 ${selectedVehicleId === vehicle.id.toString() ? "opacity-100" : "opacity-0"}`} />
                                                <span className="flex items-center gap-2 flex-1">
                                                  <span>🟢</span>
                                                  <span className="font-semibold">{vehicle.plateNumber}</span>
                                                  <span className="text-sm text-muted-foreground">- {vehicle.brand} {vehicle.model}</span>
                                                </span>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  {selectedVehicleId && vehicles.find(v => v.id.toString() === selectedVehicleId)?.status !== "Available" && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><span>⚠️</span> Not available</p>
                                  )}
                                </div>
                                <div>
                                  <Label htmlFor="vehicleModel" className="text-xs font-medium text-gray-500 mb-1.5 block">Car Model *</Label>
                                  <Input
                                    id="vehicleModel"
                                    name="vehicleModel"
                                    placeholder="Select plate first"
                                    readOnly
                                    className="h-9 text-sm bg-gray-50 cursor-not-allowed input-client"
                                  />
                                </div>
                              </div>
                              {selectedVehicleId && (() => {
                                const vehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
                                if (!vehicle) return null;
                                return (
                                  <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                    <span className="text-xs text-green-700 font-medium">
                                      {vehicle.brand} {vehicle.model} · Available{lastOdometerReading ? ` · Last odometer: ${lastOdometerReading.toLocaleString()} km` : ""}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Client Information */}
                            <div className="rounded-xl border border-gray-200 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-700">
                                  <User className="w-3.5 h-3.5" />
                                </span>
                                <h3 className="font-semibold text-xs text-gray-700 tracking-wider uppercase">Client Information</h3>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="ml-auto h-6 text-xs text-blue-600 px-2"
                                  onClick={() => window.location.href = '/clients'}
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  Manage
                                </Button>
                              </div>
                              <div className="mb-3">
                                <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Select Existing Client (Optional)</Label>
                                <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={clientComboboxOpen}
                                      className="w-full justify-between font-normal h-9 text-sm border-[#1e3a8a]/30"
                                    >
                                      {selectedClientId
                                        ? (() => {
                                            const client = clients.find((c) => c.id.toString() === selectedClientId);
                                            return client ? `${client.name} - ${client.driverLicenseNumber || "No license"}` : "Choose a client...";
                                          })()
                                        : <span className="text-gray-400 text-xs">Search or choose a client...</span>}
                                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[420px] p-0" align="start">
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
                                              (document.getElementById("clientFirstName") as HTMLInputElement).value = "";
                                              (document.getElementById("clientLastName") as HTMLInputElement).value = "";
                                              setSelectedNationality("");
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
                                          {clients.map((client) => {
                                            const nameParts = (client.name || "").trim().split(" ");
                                            const firstName = nameParts[0] || "";
                                            const lastName = nameParts.slice(1).join(" ") || "";
                                            return (
                                              <CommandItem
                                                key={client.id}
                                                value={`${client.name} ${client.driverLicenseNumber || ""}`}
                                                onSelect={() => {
                                                  setSelectedClientId(client.id.toString());
                                                  setClientComboboxOpen(false);
                                                  (document.getElementById("clientFirstName") as HTMLInputElement).value = firstName;
                                                  (document.getElementById("clientLastName") as HTMLInputElement).value = lastName;
                                                  (document.getElementById("clientMotherFullName") as HTMLInputElement).value = client.motherFullName || "";
                                                  (document.getElementById("clientFatherFullName") as HTMLInputElement).value = client.fatherName || "";
                                                  setSelectedNationality(client.nationality || "");
                                                  (document.getElementById("clientPhone") as HTMLInputElement).value = client.phone || "";
                                                  (document.getElementById("clientAddress") as HTMLInputElement).value = client.address || "";
                                                  (document.getElementById("clientPassportNumber") as HTMLInputElement).value = client.passportNumber || "";
                                                  (document.getElementById("clientPlaceOfBirth") as HTMLInputElement).value = client.placeOfBirth || "";
                                                  (document.getElementById("clientDateOfBirth") as HTMLInputElement).value = client.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : "";
                                                  (document.getElementById("clientRegistrationNumber") as HTMLInputElement).value = client.idNumber || "";
                                                  (document.getElementById("clientPlaceOfRegistration") as HTMLInputElement).value = client.placeOfRegistration || "";
                                                  (document.getElementById("drivingLicenseNumber") as HTMLInputElement).value = client.driverLicenseNumber || "";
                                                  setLicenseIssueDate(client.licenseIssueDate ? new Date(client.licenseIssueDate) : undefined);
                                                  setLicenseExpiryDate(client.licenseExpiryDate ? new Date(client.licenseExpiryDate) : undefined);
                                                }}
                                              >
                                                <Check className={`mr-2 h-4 w-4 ${selectedClientId === client.id.toString() ? "opacity-100" : "opacity-0"}`} />
                                                {client.name} - {client.driverLicenseNumber || "No license"}
                                              </CommandItem>
                                            );
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="clientFirstName" className="text-xs font-medium text-gray-500 mb-1.5 block">First Name *</Label>
                                  <Input id="clientFirstName" name="clientFirstName" required className="h-9 text-sm input-client" />
                                </div>
                                <div>
                                  <Label htmlFor="clientLastName" className="text-xs font-medium text-gray-500 mb-1.5 block">Last Name *</Label>
                                  <Input id="clientLastName" name="clientLastName" required className="h-9 text-sm input-client" />
                                </div>
                                <div>
                                  <Label htmlFor="clientMotherFullName" className="text-xs font-medium text-gray-500 mb-1.5 block">Mother's Full Name</Label>
                                  <Input id="clientMotherFullName" name="clientMotherFullName" className="h-9 text-sm input-client" placeholder="Optional" />
                                </div>
                                <div>
                                  <Label htmlFor="clientFatherFullName" className="text-xs font-medium text-gray-500 mb-1.5 block">Father's Full Name</Label>
                                  <Input id="clientFatherFullName" name="clientFatherFullName" className="h-9 text-sm input-client" placeholder="Optional" />
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Nationality</Label>
                                  <Popover open={nationalityComboboxOpen} onOpenChange={setNationalityComboboxOpen}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={nationalityComboboxOpen}
                                        className="w-full justify-between h-9 text-sm border-[#1e3a8a]/30 font-normal"
                                      >
                                        {selectedNationality || <span className="text-gray-400 text-xs">Select nationality...</span>}
                                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
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
                                                <Check className={`mr-2 h-4 w-4 ${selectedNationality === nat ? "opacity-100" : "opacity-0"}`} />
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
                                <div>
                                  <Label htmlFor="clientPhone" className="text-xs font-medium text-gray-500 mb-1.5 block">Phone Number</Label>
                                  <Input id="clientPhone" name="clientPhone" type="tel" placeholder="+1 234 567 8900" className="h-9 text-sm input-client" />
                                </div>
                                <div>
                                  <Label htmlFor="clientPassportNumber" className="text-xs font-medium text-gray-500 mb-1.5 block">Passport / ID Number</Label>
                                  <Input id="clientPassportNumber" name="clientPassportNumber" className="h-9 text-sm input-client" placeholder="ID or Passport" />
                                </div>
                                <div className="col-span-2">
                                  <Label htmlFor="clientAddress" className="text-xs font-medium text-gray-500 mb-1.5 block">Address</Label>
                                  <Input id="clientAddress" name="clientAddress" placeholder="Street, City, ZIP" className="h-9 text-sm input-client" />
                                </div>
                                <div>
                                  <Label htmlFor="clientRegistrationNumber" className="text-xs font-medium text-gray-500 mb-1.5 block">Registration Number</Label>
                                  <Input id="clientRegistrationNumber" name="clientRegistrationNumber" placeholder="e.g., 267" className="h-9 text-sm input-client" />
                                </div>
                                <div>
                                  <Label htmlFor="clientPlaceOfRegistration" className="text-xs font-medium text-gray-500 mb-1.5 block">Place of Registration</Label>
                                  <Input id="clientPlaceOfRegistration" name="clientPlaceOfRegistration" placeholder="e.g., Beirut" className="h-9 text-sm input-client" />
                                </div>
                                <div>
                                  <Label htmlFor="clientDateOfBirth" className="text-xs font-medium text-gray-500 mb-1.5 block">Date of Birth</Label>
                                  <Input id="clientDateOfBirth" name="clientDateOfBirth" type="date" className="h-9 text-sm input-client" />
                                </div>
                                <div>
                                  <Label htmlFor="clientPlaceOfBirth" className="text-xs font-medium text-gray-500 mb-1.5 block">Place of Birth</Label>
                                  <Input id="clientPlaceOfBirth" name="clientPlaceOfBirth" placeholder="City, Country" className="h-9 text-sm input-client" />
                                </div>
                              </div>
                            </div>

                            {/* Driving License */}
                            <div className="rounded-xl border border-gray-200 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-violet-100 text-violet-700">
                                  <FileText className="w-3.5 h-3.5" />
                                </span>
                                <h3 className="font-semibold text-xs text-gray-700 tracking-wider uppercase">Driving License</h3>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="drivingLicenseNumber" className="text-xs font-medium text-gray-500 mb-1.5 block">License Number *</Label>
                                  <Input id="drivingLicenseNumber" name="drivingLicenseNumber" required className="h-9 text-sm input-client" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <DateDropdownSelector
                                    id="licenseIssueDate"
                                    label="Issue Date"
                                    value={licenseIssueDate}
                                    onChange={setLicenseIssueDate}
                                    maxDate={new Date()}
                                  />
                                  <DateDropdownSelector
                                    id="licenseExpiryDate"
                                    label="Expiry Date *"
                                    value={licenseExpiryDate}
                                    onChange={setLicenseExpiryDate}
                                    required
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Second Driver */}
                            <div className="rounded-xl border border-dashed border-gray-300 overflow-hidden">
                              <div className="px-4 py-3 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-600">Second Driver</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Optional</span>
                              </div>
                              <div className="px-4 pb-4 space-y-3 border-t border-dashed border-gray-200 bg-gray-50/40">
                                <div className="pt-3">
                                  <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Select Client as Second Driver</Label>
                                  <Popover open={secondDriverComboboxOpen} onOpenChange={setSecondDriverComboboxOpen}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between h-9 text-sm font-normal border-[#1e3a8a]/30"
                                        type="button"
                                      >
                                        {secondDriverClientId
                                          ? (() => {
                                              const c = clients.find(cl => cl.id.toString() === secondDriverClientId);
                                              return c ? c.name : "Select client";
                                            })()
                                          : <span className="text-gray-400 text-xs">Select second driver...</span>}
                                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="Search clients..." />
                                        <CommandList>
                                          <CommandEmpty>No client found.</CommandEmpty>
                                          <CommandGroup>
                                            <CommandItem
                                              value="__clear__"
                                              onSelect={() => {
                                                setSecondDriverClientId("");
                                                setSecondDriverLicenseIssueDate(undefined);
                                                setSecondDriverLicenseExpiryDate(undefined);
                                                setSecondDriverComboboxOpen(false);
                                              }}
                                            >
                                              <span className="text-muted-foreground italic">— Remove second driver —</span>
                                            </CommandItem>
                                            {clients.map((cl) => (
                                              <CommandItem
                                                key={cl.id}
                                                value={`${cl.name} ${cl.driverLicenseNumber || ""}`}
                                                onSelect={() => {
                                                  setSecondDriverClientId(cl.id.toString());
                                                  if ((cl as any).licenseIssueDate) setSecondDriverLicenseIssueDate(new Date((cl as any).licenseIssueDate));
                                                  if ((cl as any).licenseExpiryDate) setSecondDriverLicenseExpiryDate(new Date((cl as any).licenseExpiryDate));
                                                  setSecondDriverComboboxOpen(false);
                                                }}
                                              >
                                                <Check className={`mr-2 h-4 w-4 ${secondDriverClientId === cl.id.toString() ? "opacity-100" : "opacity-0"}`} />
                                                <div>
                                                  <div className="font-medium">{cl.name}</div>
                                                  {cl.driverLicenseNumber && <div className="text-xs text-muted-foreground">{cl.driverLicenseNumber}</div>}
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                {secondDriverClientId && (() => {
                                  const c = clients.find(cl => cl.id.toString() === secondDriverClientId);
                                  if (!c) return null;
                                  return (
                                    <div className="space-y-3 rounded-lg border border-gray-200 p-3 bg-white">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Full Name</Label>
                                          <Input value={c.name} readOnly className="h-9 text-sm bg-gray-50 input-client" />
                                        </div>
                                        <div>
                                          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Date of Birth</Label>
                                          <Input value={(c as any).dateOfBirth ? new Date((c as any).dateOfBirth).toLocaleDateString() : "—"} readOnly className="h-9 text-sm bg-gray-50 input-client" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <DateDropdownSelector id="secondDriverLicenseIssueDate" label="License Issue Date" value={secondDriverLicenseIssueDate} onChange={setSecondDriverLicenseIssueDate} />
                                        <DateDropdownSelector id="secondDriverLicenseExpiryDate" label="License Expiry Date" value={secondDriverLicenseExpiryDate} onChange={setSecondDriverLicenseExpiryDate} />
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* ═══ RIGHT COLUMN ═══════════════════════════════════ */}
                        <div className="w-full sm:flex sm:flex-col sm:flex-1 sm:overflow-y-auto bg-gray-50/40">
                          <div className="p-5 space-y-4">

                            {/* Rental Period */}
                            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-700">
                                  <Calendar className="w-3.5 h-3.5" />
                                </span>
                                <h3 className="font-semibold text-xs text-gray-700 tracking-wider uppercase">Rental Period</h3>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                {/* Start Date */}
                                <div>
                                  <DateDropdownSelector id="rentalStartDate" label="Start Date *" value={rentalStartDate} onChange={setRentalStartDate} required />
                                  <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Past dates allowed
                                  </p>
                                </div>

                                {/* Pickup Time */}
                                <div>
                                  <Label htmlFor="pickupTime" className="text-sm font-medium">Pickup Time</Label>
                                  <Input id="pickupTime" type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="h-9 text-sm input-client mt-1.5" />
                                  <p className="text-[10px] text-muted-foreground mt-1">Exact hour car was picked up</p>
                                </div>

                                {/* Rental Days */}
                                <div>
                                  <Label htmlFor="rentalDays" className="text-sm font-medium">Rental Days *</Label>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <Button type="button" variant="outline" size="sm" className="h-9 w-9 shrink-0 p-0 text-lg font-bold" onClick={() => setRentalDays(Math.max(1, rentalDays - 1))}>−</Button>
                                    <Input id="rentalDays" name="rentalDays" type="number" min="1" value={rentalDays} onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))} className="text-center font-semibold text-sm h-9 input-client" required />
                                    <Button type="button" variant="outline" size="sm" className="h-9 w-9 shrink-0 p-0 text-lg font-bold" onClick={() => setRentalDays(rentalDays + 1)}>+</Button>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-1">End date calculated automatically</p>
                                </div>

                                {/* Return Date */}
                                <div>
                                  <Label className="text-sm font-medium">Return Date (Auto)</Label>
                                  <div className="h-9 flex items-center px-3 rounded-md bg-gray-50 border border-dashed border-gray-300 mt-1.5">
                                    {rentalEndDate
                                      ? <span className="font-semibold text-gray-800 text-sm">{rentalEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                      : <span className="text-gray-400 text-xs italic">Set start date & days above</span>}
                                  </div>
                                  {rentalEndDate && rentalStartDate && (
                                    <p className="text-[10px] text-blue-500 mt-1">
                                      {rentalDays} day{rentalDays !== 1 ? 's' : ''} · {rentalStartDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} → {rentalEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Odometer */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-600">
                                  <Gauge className="w-3.5 h-3.5" />
                                </span>
                                <h3 className="font-semibold text-xs text-gray-700 tracking-wider uppercase">Pickup Odometer</h3>
                              </div>
                              <Label htmlFor="pickupKm" className="text-xs font-medium text-gray-500 mb-1.5 block">Odometer Reading (KM) *</Label>
                              <Input
                                id="pickupKm"
                                name="pickupKm"
                                type="number"
                                min={(() => { const v = vehicles.find(v => v.id.toString() === selectedVehicleId); return v?.mileage || 0; })()}
                                value={pickupKm}
                                onChange={(e) => setPickupKm(parseInt(e.target.value) || 0)}
                                placeholder="Enter current odometer reading"
                                required
                                className="h-9 text-sm input-client"
                              />
                              {(() => {
                                const v = vehicles.find(v => v.id.toString() === selectedVehicleId);
                                const reg = v?.mileage || 0;
                                if (lastOdometerReading && lastOdometerReading > 0) return <p className="text-xs text-muted-foreground mt-1">Auto-filled from last contract ({lastOdometerReading.toLocaleString()} km). Min: {reg.toLocaleString()} km.</p>;
                                if (reg > 0) return <p className="text-xs text-muted-foreground mt-1">Min: {reg.toLocaleString()} km (registered mileage).</p>;
                                return null;
                              })()}
                            </div>

                            {/* Pricing */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-green-100 text-green-700">
                                  <DollarSign className="w-3.5 h-3.5" />
                                </span>
                                <h3 className="font-semibold text-xs text-gray-700 tracking-wider uppercase">Pricing</h3>
                                {isHighSeason && (
                                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-semibold border border-orange-200">🌞 High Season</span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <Label htmlFor="dailyRate" className="text-xs font-medium text-gray-500 mb-1.5 block">Daily Rate ($) *</Label>
                                  <Input id="dailyRate" name="dailyRate" type="number" step="0.01" min="0" value={dailyRate} onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)} required className={`h-9 text-sm input-client ${isHighSeason ? "border-orange-400 bg-orange-50" : ""}`} />
                                  {isHighSeason && <p className="text-[10px] text-orange-600 mt-1">High season rate applied</p>}
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Discount ($)</Label>
                                  <Input id="discount" name="discount" type="number" step="0.01" min="0" max={totalAmount} value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="h-9 text-sm input-client" />
                                </div>
                              </div>
                              <div className="rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 p-3 text-white">
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="text-blue-200">Subtotal ({rentalDays} day{rentalDays !== 1 ? 's' : ''} × ${dailyRate.toFixed(2)})</span>
                                  <span className="font-medium">${totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="text-blue-200">VAT ({vatRate}%)</span>
                                  <span className="font-medium">${(totalAmount * (vatRate / 100)).toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                  <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-blue-200">Discount</span>
                                    <span className="font-medium text-green-300">−${discount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-white/20">
                                  <span className="text-sm font-bold">Total with VAT</span>
                                  <span className="text-lg font-bold">${(finalAmount + (finalAmount * (vatRate / 100))).toFixed(2)}</span>
                                </div>
                                {exchangeRate !== 1.0 && (
                                  <div className="flex justify-between text-xs mt-1.5 text-blue-200">
                                    <span>In local currency (×{exchangeRate.toFixed(4)})</span>
                                    <span className="font-medium text-white">{((finalAmount + (finalAmount * (vatRate / 100))) * exchangeRate).toFixed(2)} {companyProfile?.localCurrencyCode || ""}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Insurance, Deposit & Fuel */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700">
                                  <Shield className="w-3.5 h-3.5" />
                                </span>
                                <h3 className="font-semibold text-xs text-gray-700 tracking-wider uppercase">Insurance, Deposit & Fuel</h3>
                              </div>
                              <InsuranceDepositSelector
                                rentalDays={rentalDays}
                                onInsuranceChange={(pkg, cost, dailyRate) => { setInsurancePackage(pkg); setInsuranceCost(cost); setInsuranceDailyRate(dailyRate); }}
                                onDepositChange={(amount, status) => { setDepositAmount(amount); setDepositStatus(status); }}
                                onFuelPolicyChange={(policy) => { setFuelPolicy(policy); }}
                              />
                            </div>

                            {/* Late Return Fee */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-orange-100 text-orange-700">
                                  <Clock className="w-3.5 h-3.5" />
                                </span>
                                <h3 className="font-semibold text-xs text-gray-700 tracking-wider uppercase">Late Return Fee</h3>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <Label className="text-xs font-medium text-gray-500 mb-1.5 block">
                                    Late Fee % per day <span className="text-gray-400 font-normal">(optional — defaults to 150%)</span>
                                  </Label>
                                  <div className="relative">
                                    <input type="number" min="0" max="1000" step="0.5" placeholder="150" value={lateFeePercentage} onChange={(e) => setLateFeePercentage(e.target.value)} className="w-full h-9 rounded-md border border-[#1e3a8a]/40 px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                  </div>
                                </div>
                                {lateFeePercentage !== "" && (
                                  <div className="text-xs text-gray-500 mt-5 shrink-0">= {((parseFloat(lateFeePercentage) || 0) / 100).toFixed(2)}× daily rate / day</div>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>

                      {/* Sticky Footer */}
                      <div className="flex items-center justify-between px-3 sm:px-6 py-3.5 border-t border-gray-100 bg-white shrink-0">
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Next: photograph vehicle damage marks before confirming</span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <Button type="button" variant="outline" size="sm" className="h-8 text-xs px-4" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" className="h-8 text-xs px-4 bg-blue-800 hover:bg-blue-900 gap-1.5 whitespace-nowrap" disabled={createContract.isPending}>
                            {createContract.isPending ? "Creating..." : (
                              <>
                                <span className="sm:hidden">Continue</span>
                                <span className="hidden sm:inline">Continue to Car Inspection</span>
                              </>
                            )}
                            {!createContract.isPending && <ChevronRight className="w-3.5 h-3.5" />}
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
          
          {/* Bulk Actions Bar */}
          {selectedContracts.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
          
          {/* Status Filter Tabs + Contract Number Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "overdue" ? "default" : "outline"}
                onClick={() => setStatusFilter("overdue")}
              >
                Overdue
              </Button>
              <Button
                size="sm"
                variant={!statusFilter ? "default" : "outline"}
                onClick={() => setStatusFilter(undefined)}
              >
                All
              </Button>
            </div>
            <div className="relative sm:ml-auto sm:w-64">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
              <Input
                className="pl-8 h-9 text-sm"
                placeholder="Search by contract #..."
                value={contractSearch}
                onChange={(e) => setContractSearch(e.target.value)}
                data-testid="input-contract-search"
              />
              {contractSearch && (
                <button
                  onClick={() => setContractSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Select All Checkbox */}
          {(() => {
            const searchTerm = contractSearch.trim();
            const filteredContracts = searchTerm
              ? (contracts as any[]).filter(c => {
                  const num = c.contractNumber?.match(/CTR-(\d+)/i);
                  if (/^\d+$/.test(searchTerm) && num) {
                    return parseInt(num[1], 10) === parseInt(searchTerm, 10);
                  }
                  return c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase());
                })
              : contracts as any[];
            return (
              <>
                {filteredContracts.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="select-all"
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedContracts.length === filteredContracts.length && filteredContracts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContracts(filteredContracts.map((c: any) => c.id));
                        } else {
                          setSelectedContracts([]);
                        }
                      }}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Select All ({filteredContracts.length}{contractSearch.trim() ? ` of ${contracts.length}` : ""})
                    </label>
                  </div>
                )}
                {contractSearch.trim() && filteredContracts.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No contract found matching <span className="font-mono font-semibold text-gray-600">"{contractSearch}"</span></p>
                    <button onClick={() => setContractSearch("")} className="mt-2 text-xs text-blue-500 hover:underline">Clear search</button>
                  </div>
                )}

                {/* Contracts List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContracts.map((contract: any) => {
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
                          {contract.clientName || `${contract.clientFirstName || ""} ${contract.clientLastName || ""}`.trim() || "—"}
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
                      {contract.contractNumber && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Contract</span>
                          <span className="font-mono text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                            {contract.contractNumber}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-gray-600">Vehicle</div>
                        <div className="font-semibold">
                          {vehicle ? `${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model}` : "Unknown"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">License Number</div>
                        <div className="font-mono">{contract.clientDriverLicense}</div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                {!contractSearch.trim() && contracts.length === 0 && (
                  <Card className="p-12 text-center">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Contracts Yet</h3>
                    <p className="text-gray-500 mb-6">Create your first rental contract to get started</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Contract
                    </Button>
                  </Card>
                )}
              </>
            );
          })()}
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
                    <div className="bg-white border border-gray-300 p-6 rounded-lg flex flex-wrap items-center justify-between gap-4">
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
                        <div className="font-semibold">{selectedContract.clientName || `${selectedContract.clientFirstName || ""} ${selectedContract.clientLastName || ""}`.trim() || "—"}</div>
                      </div>
                      {selectedContract.clientFatherFullName && (
                        <div>
                          <div className="text-sm text-muted-foreground">Father's Name</div>
                          <div>{selectedContract.clientFatherFullName}</div>
                        </div>
                      )}
                      {selectedContract.clientMotherFullName && (
                        <div>
                          <div className="text-sm text-muted-foreground">Mother's Name</div>
                          <div>{selectedContract.clientMotherFullName}</div>
                        </div>
                      )}
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
                      {selectedContract.clientPassport && (
                        <div>
                          <div className="text-sm text-muted-foreground">Passport/ID Number</div>
                          <div className="font-mono">{selectedContract.clientPassport}</div>
                        </div>
                      )}
                      {selectedContract.clientRegistrationNumber && (
                        <div>
                          <div className="text-sm text-muted-foreground">Registration Number</div>
                          <div className="font-mono">{selectedContract.clientRegistrationNumber}</div>
                        </div>
                      )}
                      {selectedContract.clientDateOfBirth && (
                        <div>
                          <div className="text-sm text-muted-foreground">Date of Birth</div>
                          <div>{new Date(selectedContract.clientDateOfBirth).toLocaleDateString()}</div>
                        </div>
                      )}
                      {selectedContract.clientPlaceOfBirth && (
                        <div>
                          <div className="text-sm text-muted-foreground">Place of Birth</div>
                          <div>{selectedContract.clientPlaceOfBirth}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-muted-foreground">License Number</div>
                        <div className="font-mono">{selectedContract.clientDriverLicense}</div>
                      </div>
                      {selectedContract.licenseExpiryDate && (
                        <div>
                          <div className="text-sm text-muted-foreground">License Expiry</div>
                          <div>{new Date(selectedContract.licenseExpiryDate).toLocaleDateString()}</div>
                        </div>
                      )}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card p-4 rounded-lg border border-border">
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
                          <div className="col-span-2 border-t border-border/50 pt-4 mt-4">
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
            <DialogFooter className="flex-shrink-0 border-t border-gray-700 pt-4 pb-2">
              {/* Button grid layout - 2 columns, equal sizing */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* Left side action buttons */}
                <Button 
                  onClick={() => {
                    if (!selectedContract) {
                      toast.error(t("contracts.noContractSelected"));
                      return;
                    }
                    const success = printElement("contract-content", `Contract ${selectedContract.contractNumber || selectedContract.id}`);
                    if (!success) {
                      toast.error("Contract content not found");
                    }
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
                      toast.error(t("contracts.noContractSelected"));
                      return;
                    }
                    
                    try {
                      toast.info("Generating PDF with inspection diagram...");
                      const success = await exportContractTemplateToPDF(
                        `Contract_${selectedContract.contractNumber || selectedContract.id}.pdf`
                      );
                      if (success) {
                        toast.success("PDF exported successfully!");
                      } else {
                        toast.error("PDF generation failed. Please try again.");
                      }
                    } catch (error: any) {
                      console.error("PDF export error:", error);
                      toast.error(`Failed to export PDF: ${error.message || "Unknown error"}`);
                    }
                  }} 
                  variant="outline"
                  className="h-10 w-full"
                  size="default"
                >
                  📄 Export to PDF
                </Button>
                {companyProfile && (
                  <Button
                    onClick={async () => {
                      if (!selectedContract) { toast.error(t("contracts.noContractSelected")); return; }
                      if (!companyProfile.contractTemplateUrl) {
                        toast.error("No template uploaded. Go to Company Settings → Contract Template to upload one.");
                        return;
                      }
                      if (!companyProfile.contractTemplateFieldMap) {
                        toast.error("Field positions not configured. Go to Company Settings → Configure Field Positions first.");
                        return;
                      }
                      const vehicle = vehicles.find(v => v.id === selectedContract.vehicleId);
                      const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("en-GB") : "";
                      const contractData: Record<string, string> = {
                        clientName: selectedContract.clientName || "",
                        clientMotherFullName: selectedContract.clientMotherFullName || "",
                        clientFatherFullName: selectedContract.clientFatherFullName || "",
                        clientNationality: selectedContract.clientNationality || "",
                        clientPhone: selectedContract.clientPhone || "",
                        clientAddress: selectedContract.clientAddress || "",
                        clientEmail: selectedContract.clientEmail || "",
                        clientDateOfBirth: fmtDate(selectedContract.clientDateOfBirth),
                        clientPlaceOfBirth: selectedContract.clientPlaceOfBirth || "",
                        clientPassportNumber: selectedContract.clientPassport || "",
                        clientRegistrationNumber: selectedContract.clientRegistrationNumber || "",
                        clientPlaceOfRegistration: selectedContract.clientPlaceOfRegistration || "",
                        clientLicenseNumber: selectedContract.clientDriverLicense || "",
                        clientLicenseIssueDate: fmtDate(selectedContract.licenseIssueDate),
                        clientLicenseExpiryDate: fmtDate(selectedContract.licenseExpiryDate),
                        vehiclePlate: vehicle?.plateNumber || "",
                        vehicleMake: vehicle?.brand || "",
                        vehicleModel: vehicle?.model || "",
                        vehicleYear: vehicle?.year?.toString() || "",
                        vehicleType: selectedContract.vehicleType || vehicle?.category || "",
                        vehicleColor: selectedContract.vehicleColor || vehicle?.color || "",
                        vehicleFuelType: selectedContract.vehicleFuelType || vehicle?.fuelType || "",
                        vehicleVIN: selectedContract.vehicleVIN || vehicle?.vin || "",
                        contractNumber: selectedContract.contractNumber || selectedContract.id?.toString() || "",
                        startDate: fmtDate(selectedContract.rentalStartDate),
                        endDate: fmtDate(selectedContract.rentalEndDate),
                        pickupTime: selectedContract.pickupTime || "",
                        returnTime: selectedContract.returnTime || "",
                        rentalDays: selectedContract.rentalDays?.toString() || "",
                        dailyRate: selectedContract.dailyRate?.toString() || "",
                        totalAmount: selectedContract.totalAmount?.toString() || "",
                        deposit: selectedContract.depositAmount?.toString() || "",
                        companyName: companyProfile.companyName || "",
                        companyPhone: companyProfile.phone || "",
                        companyAddress: companyProfile.address || "",
                      };
                      toast.info("Generating template PDF...");
                      const ok = await exportTemplateOverlayToPDF(
                        companyProfile.contractTemplateUrl!,
                        companyProfile.contractTemplateFieldMap as Record<string, any>,
                        contractData,
                        `Contract_${selectedContract.contractNumber || selectedContract.id}.pdf`
                      );
                      if (ok) toast.success("Template PDF exported!");
                      else toast.error("Failed to export PDF.");
                    }}
                    variant="outline"
                    className="h-10 w-full"
                    size="default"
                  >
                    🖼️ Print with Template
                  </Button>
                )}
                <Button 
                  onClick={async () => {
                    if (!selectedContract) {
                      toast.error(t("contracts.noContractSelected"));
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
                        const html2canvas = (await import("html2canvas")).default;
                        const { default: jsPDF } = await import("jspdf");
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
                        if (!companyProfile?.phone) {
                          toast.error("Company phone number not set in settings");
                          return;
                        }
                        const phoneNumber = companyProfile.phone.replace(/[\s\-\(\)]/g, '');                        
                        // Get custom template or use default
                        const template = whatsappTemplate?.messageTemplate || getDefaultTemplate('contract_created');
                        
                        // Parse template with actual data
                        const message = parseTemplate(template, {
                          contractNumber: selectedContract.contractNumber,
                          clientName: selectedContract.clientName || "",
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
                        window.location.href = `/invoices?invoice=${contractInvoice.id}`;
                      }} 
                      variant="outline"
                      className="h-10 w-full overflow-hidden"
                      size="default"
                      title={`View Invoice (${contractInvoice.invoiceNumber})`}
                    >
                      <span className="truncate">View Invoice ({contractInvoice.invoiceNumber})</span>
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
                      className="bg-blue-600 hover:bg-blue-700"
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
                        {contract.clientName} - {vehicle?.brand} {vehicle?.model}
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
            // Capture contract + vehicle before clearing
            const completedContract = selectedContract;
            const completedVehicle = vehicles.find(v => v.id === selectedContract.id);

            refetch();
            setIsDetailsDialogOpen(false);
            const contractId = completedContract.id;
            setSelectedContract(null);

            // Generate invoice in background
            let destination = "/dashboard";
            try {
              const invoice = await generateInvoice.mutateAsync({ contractId });
              if (invoice?.id) destination = `/invoices?invoice=${invoice.id}`;
            } catch (error) {
              console.error("Failed to generate invoice:", error);
            }

            // Show post-completion action sheet
            setPostCompletionModal({ contract: completedContract, vehicle: completedVehicle, invoiceDestination: destination });
          }}
        />
      )}

      {/* PDF Template — portalled directly into document.body so html2canvas has no parent CSS interference */}
      {(selectedContract || postCompletionModal?.contract || autoPrintData?.contract) && createPortal(
        (() => {
          const c = selectedContract || postCompletionModal?.contract || autoPrintData!.contract;
          const vehicle = vehicles.find((v) => v.id === c.vehicleId) || postCompletionModal?.vehicle || autoPrintData?.vehicle;
          const marksForPdf = autoPrintData ? autoPrintData.damageMarks : selectedContractDamageMarks;
          return (
            <ContractPDFTemplate
              contract={{
                ...c,
                clientName: c.clientName,
                clientMotherFullName: c.clientMotherFullName,
                clientNationality: c.clientNationality,
                clientRegistrationNumber: c.clientRegistrationNumber,
                clientPlaceOfRegistration: c.clientPlaceOfRegistration,
                clientPassport: c.clientPassport,
                clientDateOfBirth: c.clientDateOfBirth,
                clientPlaceOfBirth: c.clientPlaceOfBirth,
                clientPhone: c.clientPhone || undefined,
                clientAddress: c.clientAddress || undefined,
                drivingLicenseNumber: c.clientDriverLicense || "",
                licenseIssueDate: c.licenseIssueDate,
                licenseExpiryDate: c.licenseExpiryDate || "",
              }}
              vehicle={vehicle ? { ...vehicle, fuelType: vehicle.fuelType } : null}
              companyProfile={companyProfile || null}
              damageMarks={marksForPdf}
            />
          );
        })(),
        document.body
      )}

      {/* Post-completion action sheet */}
      {postCompletionModal && (
        <Dialog open onOpenChange={() => { setPostCompletionModal(null); setLocation(postCompletionModal.invoiceDestination); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                ✅ Contract Completed
              </DialogTitle>
              <DialogDescription className="text-sm">
                Contract <strong>{postCompletionModal.contract?.contractNumber}</strong> for{" "}
                <strong>{postCompletionModal.contract?.clientName}</strong> has been completed.
                What would you like to do next?
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2">
              {/* Print with Template */}
              <Button
                variant="outline"
                className="h-12 justify-start gap-3 text-sm"
                onClick={async () => {
                  if (!companyProfile?.contractTemplateUrl) {
                    toast.error("No template uploaded. Configure one in Company Settings.");
                    return;
                  }
                  if (!companyProfile?.contractTemplateFieldMap) {
                    toast.error("Field positions not set. Use 'Configure Field Positions' in Company Settings.");
                    return;
                  }
                  const c = postCompletionModal.contract;
                  const v = postCompletionModal.vehicle;
                  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("en-GB") : "";
                  const data: Record<string, string> = {
                    clientName: c.clientName || "",
                    clientMotherFullName: c.clientMotherFullName || "",
                    clientFatherFullName: c.clientFatherFullName || "",
                    clientNationality: c.clientNationality || "",
                    clientPhone: c.clientPhone || "",
                    clientAddress: c.clientAddress || "",
                    clientEmail: c.clientEmail || "",
                    clientDateOfBirth: fmtDate(c.clientDateOfBirth),
                    clientPlaceOfBirth: c.clientPlaceOfBirth || "",
                    clientPassportNumber: c.clientPassport || "",
                    clientRegistrationNumber: c.clientRegistrationNumber || "",
                    clientPlaceOfRegistration: c.clientPlaceOfRegistration || "",
                    clientLicenseNumber: c.clientDriverLicense || "",
                    clientLicenseIssueDate: fmtDate(c.licenseIssueDate),
                    clientLicenseExpiryDate: fmtDate(c.licenseExpiryDate),
                    vehiclePlate: v?.plateNumber || "",
                    vehicleMake: v?.brand || "",
                    vehicleModel: v?.model || "",
                    vehicleYear: v?.year?.toString() || "",
                    vehicleColor: c.vehicleColor || v?.color || "",
                    vehicleFuelType: c.vehicleFuelType || v?.fuelType || "",
                    vehicleVIN: c.vehicleVIN || v?.vin || "",
                    contractNumber: c.contractNumber || c.id?.toString() || "",
                    startDate: fmtDate(c.rentalStartDate),
                    endDate: fmtDate(c.rentalEndDate),
                    pickupTime: c.pickupTime || "",
                    returnTime: c.returnTime || "",
                    rentalDays: c.rentalDays?.toString() || "",
                    dailyRate: c.dailyRate?.toString() || "",
                    totalAmount: c.totalAmount?.toString() || "",
                    deposit: c.depositAmount?.toString() || "",
                    companyName: companyProfile.companyName || "",
                    companyPhone: companyProfile.phone || "",
                    companyAddress: companyProfile.address || "",
                  };
                  toast.info("Generating template PDF…");
                  const ok = await exportTemplateOverlayToPDF(
                    companyProfile.contractTemplateUrl!,
                    companyProfile.contractTemplateFieldMap as Record<string, any>,
                    data,
                    `Contract_${c.contractNumber || c.id}.pdf`
                  );
                  if (ok) toast.success("Template PDF exported!");
                  else toast.error("Failed to export PDF.");
                }}
              >
                <span className="text-xl">🖼️</span>
                <div className="text-left">
                  <div className="font-medium">Print with Template</div>
                  <div className="text-xs text-muted-foreground">Overlay on your pre-printed form</div>
                </div>
              </Button>

              {/* Print Standard A4 */}
              <Button
                variant="outline"
                className="h-12 justify-start gap-3 text-sm"
                onClick={async () => {
                  toast.info("Generating A4 PDF…");
                  const ok = await exportContractTemplateToPDF(
                    `Contract_${postCompletionModal.contract?.contractNumber || postCompletionModal.contract?.id}.pdf`
                  );
                  if (ok) toast.success(t("contracts.contractPdfDownloaded"));
                  else toast.error("Could not generate PDF.");
                }}
              >
                <span className="text-xl">📄</span>
                <div className="text-left">
                  <div className="font-medium">Print Standard A4</div>
                  <div className="text-xs text-muted-foreground">Formatted contract layout</div>
                </div>
              </Button>

              {/* Send via WhatsApp */}
              <Button
                variant="outline"
                className="h-12 justify-start gap-3 text-sm"
                onClick={async () => {
                  const c = postCompletionModal.contract;
                  const v = postCompletionModal.vehicle || vehicles.find((vv: any) => vv.id === c.vehicleId);
                  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("en-GB") : "";

                  // Build contract data for template overlay (if configured)
                  const hasTemplate = !!(companyProfile?.contractTemplateUrl && companyProfile?.contractTemplateFieldMap);

                  toast.info("Generating PDF…");

                  let pdfBase64: string | null = null;
                  try {
                    if (hasTemplate) {
                      // Generate template overlay PDF
                      const data: Record<string, string> = {
                        clientName: c.clientName || "",
                        clientMotherFullName: c.clientMotherFullName || "",
                        clientFatherFullName: c.clientFatherFullName || "",
                        clientNationality: c.clientNationality || "",
                        clientPhone: c.clientPhone || "",
                        clientAddress: c.clientAddress || "",
                        clientEmail: c.clientEmail || "",
                        clientDateOfBirth: fmtDate(c.clientDateOfBirth),
                        clientPlaceOfBirth: c.clientPlaceOfBirth || "",
                        clientPassportNumber: c.clientPassport || "",
                        clientRegistrationNumber: c.clientRegistrationNumber || "",
                        clientPlaceOfRegistration: c.clientPlaceOfRegistration || "",
                        clientLicenseNumber: c.clientDriverLicense || "",
                        clientLicenseIssueDate: fmtDate(c.licenseIssueDate),
                        clientLicenseExpiryDate: fmtDate(c.licenseExpiryDate),
                        vehiclePlate: v?.plateNumber || "",
                        vehicleMake: v?.brand || "",
                        vehicleModel: v?.model || "",
                        vehicleYear: v?.year?.toString() || "",
                        vehicleColor: c.vehicleColor || v?.color || "",
                        vehicleFuelType: c.vehicleFuelType || v?.fuelType || "",
                        vehicleVIN: c.vehicleVIN || v?.vin || "",
                        contractNumber: c.contractNumber || c.id?.toString() || "",
                        startDate: fmtDate(c.rentalStartDate),
                        endDate: fmtDate(c.rentalEndDate),
                        pickupTime: c.pickupTime || "",
                        returnTime: c.returnTime || "",
                        rentalDays: c.rentalDays?.toString() || "",
                        dailyRate: c.dailyRate?.toString() || "",
                        totalAmount: c.totalAmount?.toString() || "",
                        deposit: c.depositAmount?.toString() || "",
                        companyName: companyProfile?.companyName || "",
                        companyPhone: companyProfile?.phone || "",
                        companyAddress: companyProfile?.address || "",
                      };
                      const result = await exportTemplateOverlayToPDF(
                        companyProfile!.contractTemplateUrl!,
                        companyProfile!.contractTemplateFieldMap as Record<string, any>,
                        data,
                        `Contract_${c.contractNumber || c.id}.pdf`,
                        true
                      );
                      if (typeof result === "string") pdfBase64 = result;
                    } else {
                      // Fallback: standard A4 PDF
                      const result = await exportContractTemplateToPDF(
                        `Contract_${c.contractNumber || c.id}.pdf`,
                        true
                      );
                      if (typeof result === "string") pdfBase64 = result;
                    }
                  } catch (err) {
                    console.error("PDF generation error:", err);
                  }

                  let pdfUrl: string | null = null;
                  if (pdfBase64) {
                    try {
                      toast.info("Uploading PDF…");
                      const uploadResult = await uploadPdfMutation.mutateAsync({
                        base64Data: pdfBase64,
                        filename: `Contract-${c.contractNumber || c.id}.pdf`,
                      });
                      pdfUrl = uploadResult.url;
                    } catch (err) {
                      console.error("PDF upload error:", err);
                    }
                  }

                  const message =
                    `✅ *Contract Completed*\n` +
                    `Contract: *${c.contractNumber}*\n` +
                    `Client: ${c.clientName}\n` +
                    `Vehicle: ${v?.brand || ""} ${v?.model || ""} — ${v?.plateNumber || ""}\n` +
                    `Period: ${fmtDate(c.rentalStartDate)} → ${fmtDate(c.rentalEndDate)}\n` +
                    `Total: $${c.totalAmount || c.finalAmount || "0"}` +
                    (pdfUrl ? `\n\n📄 Contract PDF:\n${pdfUrl}` : "") +
                    `\n\nThank you for choosing ${companyProfile?.companyName || "us"}! 🚗`;

                  const phone = (c.clientPhone || "").replace(/[\s\-\(\)]/g, "");
                  const waUrl = phone
                    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
                    : `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(waUrl, "_blank");
                }}
              >
                <span className="text-xl">💬</span>
                <div className="text-left">
                  <div className="font-medium">Send via WhatsApp</div>
                  <div className="text-xs text-muted-foreground">Generates PDF & sends link to client</div>
                </div>
              </Button>
            </div>

            <DialogFooter>
              <Button
                className="w-full"
                onClick={() => {
                  const dest = postCompletionModal.invoiceDestination;
                  setPostCompletionModal(null);
                  setLocation(dest);
                }}
              >
                Continue →
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
