import { useState, useEffect } from "react";
import CarDamageInspection from "@/components/CarDamageInspection";
import { DateDropdownSelector } from "@/components/DateDropdownSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { Car, FileText, LayoutDashboard, Plus, Wrench, Eye, Users, Check, ChevronsUpDown, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function RentalContracts() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [showInspection, setShowInspection] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [additionalDays, setAdditionalDays] = useState<number>(1);
  
  // Date states
  const [licenseIssueDate, setLicenseIssueDate] = useState<Date>();
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<Date>();
  const [rentalStartDate, setRentalStartDate] = useState<Date>();
  const [rentalEndDate, setRentalEndDate] = useState<Date>();
  
  // Pricing states
  const [rentalDays, setRentalDays] = useState<number>(1);
  const [dailyRate, setDailyRate] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [vehicleComboboxOpen, setVehicleComboboxOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"active" | "completed" | "overdue" | undefined>("active");
  const [selectedContracts, setSelectedContracts] = useState<number[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<"completed" | "overdue" | null>(null);
  
  const { data: vehicles = [] } = trpc.fleet.list.useQuery();
  const { data: contracts = [] } = trpc.contracts.listByStatus.useQuery({ status: statusFilter });
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const utils = trpc.useUtils();
  
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
    onSuccess: () => {
      toast.success("Contract marked as completed");
      utils.contracts.listByStatus.invalidate();
      // Redirect to rental contracts page
      setLocation("/rental-contracts");
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
  
  // Auto-calculate final amount after discount
  useEffect(() => {
    const final = Math.max(0, totalAmount - discount);
    setFinalAmount(final);
  }, [totalAmount, discount]);
  
  // Load daily rate when vehicle is selected
  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
      if (vehicle && vehicle.dailyRate) {
        setDailyRate(parseFloat(vehicle.dailyRate));
      }
    }
  }, [selectedVehicleId, vehicles]);
  
  const createContract = trpc.contracts.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Contract created successfully! Contract Number: ${data.contractNumber}`);
      utils.contracts.list.invalidate(); // Refresh contract list
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
      utils.contracts.listByStatus.invalidate();
      setIsDetailsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to renew contract: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
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
        // Redirect to Fleet Management page
        setLocation("/fleet");
      },
    });
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
      <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col">
        <div className="p-6 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold">RENTAL.OS</h1>
              <p className="text-xs text-blue-300">v2.0.26 SYSTEM READY</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    item.href === "/rental-contracts"
                      ? "bg-orange-500 text-white"
                      : "text-blue-100 hover:bg-blue-800"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-blue-700">
          <div className="text-xs text-blue-300">
            <div className="font-semibold mb-1">SYSTEM STATUS</div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <span>ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rental Contracts</h1>
              <p className="text-gray-600 mt-1">Manage rental agreements and client information</p>
            </div>
            <div className="flex gap-3">
              <Link href="/">
                <Button variant="outline" className="font-mono">
                  <Home className="mr-2 h-4 w-4" />
                  HOME
                </Button>
              </Link>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  New Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Rental Contract</DialogTitle>
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
                                      <span>{vehicle.plateNumber}</span>
                                      <span className="text-xs text-muted-foreground">[{vehicle.status}]</span>
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
                                        <span>{vehicle.plateNumber}</span>
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
                        className="bg-muted cursor-not-allowed"
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
                                    (document.getElementById("clientNationality") as HTMLInputElement).value = "";
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
                                      (document.getElementById("clientNationality") as HTMLInputElement).value = client.nationality || "";
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clientFirstName">First Name *</Label>
                        <Input id="clientFirstName" name="clientFirstName" required />
                      </div>
                      <div>
                        <Label htmlFor="clientLastName">Last Name *</Label>
                        <Input id="clientLastName" name="clientLastName" required />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="clientNationality">Nationality</Label>
                        <Input id="clientNationality" name="clientNationality" placeholder="e.g., American, Canadian" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="clientPhone">Phone Number</Label>
                        <Input id="clientPhone" name="clientPhone" type="tel" placeholder="e.g., +1 234 567 8900" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="clientAddress">Address</Label>
                        <Input id="clientAddress" name="clientAddress" placeholder="Street, City, State, ZIP" />
                      </div>
                    </div>
                  </div>

                  {/* Driving License */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Driving License</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="drivingLicenseNumber">License Number *</Label>
                        <Input id="drivingLicenseNumber" name="drivingLicenseNumber" required />
                      </div>
                      <div>
                        <DateDropdownSelector
                          id="licenseIssueDate"
                          label="Issue Date"
                          value={licenseIssueDate}
                          onChange={setLicenseIssueDate}
                        />
                      </div>
                      <div>
                        <DateDropdownSelector
                          id="licenseExpiryDate"
                          label="Expiry Date"
                          value={licenseExpiryDate}
                          onChange={setLicenseExpiryDate}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rental Period */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Rental Period</h3>
                    <div className="grid grid-cols-2 gap-4">
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
                          className="mt-1"
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
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Pricing</h3>
                    <div className="grid grid-cols-2 gap-4">
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
                          className="bg-gray-50"
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
                          className="bg-gray-50 font-bold text-lg"
                        />
                      </div>
                    </div>
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
                  className="bg-green-600 hover:bg-green-700"
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
          <div className="flex gap-2 mb-6 border-b border-border pb-2">
            <Button
              variant={statusFilter === "active" ? "default" : "ghost"}
              onClick={() => setStatusFilter("active")}
              className="relative"
            >
              active
              {statusFilter === "active" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "ghost"}
              onClick={() => setStatusFilter("completed")}
            >
              completed
            </Button>
            <Button
              variant={statusFilter === "overdue" ? "default" : "ghost"}
              onClick={() => setStatusFilter("overdue")}
            >
              overdue
            </Button>
            <Button
              variant={!statusFilter ? "default" : "ghost"}
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
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              // Mark as completed mutation
                              markAsReturnedMutation.mutate({ contractId: contract.id });
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
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Contract
              </Button>
            </Card>
          )}
          </>
          )}
        </div>

        {/* Contract Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Contract Details</DialogTitle>
            </DialogHeader>
            {selectedContract && (() => {
              const vehicle = vehicles.find((v) => v.id === selectedContract.vehicleId);
              return (
                <div className="space-y-6">
                  {/* Contract Number */}
                  <div className="bg-orange-600/20 border border-orange-500 p-4 rounded-lg">
                    <div className="text-sm text-orange-400">Contract Number</div>
                    <div className="text-2xl font-bold font-mono text-orange-500">{selectedContract.contractNumber}</div>
                  </div>
                  {/* Client Information */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-orange-500">Client Information</h3>
                    <div className="grid grid-cols-2 gap-4 bg-gray-700 p-4 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-400">Full Name</div>
                        <div className="font-semibold">{selectedContract.clientFirstName} {selectedContract.clientLastName}</div>
                      </div>
                      {selectedContract.clientNationality && (
                        <div>
                          <div className="text-sm text-gray-400">Nationality</div>
                          <div>{selectedContract.clientNationality}</div>
                        </div>
                      )}
                      {selectedContract.clientPhone && (
                        <div>
                          <div className="text-sm text-gray-400">Phone</div>
                          <div>{selectedContract.clientPhone}</div>
                        </div>
                      )}
                      {selectedContract.clientAddress && (
                        <div className="col-span-2">
                          <div className="text-sm text-gray-400">Address</div>
                          <div>{selectedContract.clientAddress}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-gray-400">License Number</div>
                        <div className="font-mono">{selectedContract.drivingLicenseNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">License Expiry</div>
                        <div>{new Date(selectedContract.licenseExpiryDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-orange-500">Vehicle Information</h3>
                    <div className="grid grid-cols-2 gap-4 bg-gray-700 p-4 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-400">Plate Number</div>
                        <div className="font-semibold">{vehicle?.plateNumber || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Vehicle</div>
                        <div>{vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})` : "Unknown"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Category</div>
                        <div>{vehicle?.category || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Color</div>
                        <div>{vehicle?.color || "N/A"}</div>
                      </div>
                      {vehicle?.vin && (
                        <div className="col-span-2">
                          <div className="text-sm text-gray-400">VIN Number</div>
                          <div className="font-mono">{vehicle.vin}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rental Period & Pricing */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-orange-500">Rental Period & Pricing</h3>
                    <div className="grid grid-cols-2 gap-4 bg-gray-700 p-4 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-400">Start Date</div>
                        <div className="font-semibold">{new Date(selectedContract.rentalStartDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Return Date</div>
                        <div className="font-semibold">{new Date(selectedContract.rentalEndDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Rental Days</div>
                        <div>{selectedContract.rentalDays} days</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Daily Rate</div>
                        <div>${selectedContract.dailyRate}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Total Amount</div>
                        <div>${selectedContract.totalAmount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Discount</div>
                        <div>${selectedContract.discount || "0.00"}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-gray-400">Final Amount</div>
                        <div className="text-2xl font-bold text-orange-500">${selectedContract.finalAmount}</div>
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

                  {/* Signature */}
                  {selectedContract.signatureData && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-orange-500">Client Signature</h3>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <img src={selectedContract.signatureData} alt="Client Signature" className="max-w-full h-32 border border-gray-600 rounded" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <DialogFooter>
              <div className="flex w-full justify-between">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.print()} 
                    variant="outline"
                    className="print-contract"
                  >
                    🖨️ Print Contract
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedContract && window.confirm(`Are you sure you want to delete contract ${selectedContract.contractNumber}? This action cannot be undone.`)) {
                        deleteContract.mutate({ contractId: selectedContract.id });
                      }
                    }} 
                    variant="destructive"
                  >
                    🗑️ Delete Contract
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setAdditionalDays(1);
                      setIsRenewDialogOpen(true);
                    }} 
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Renew Contract
                  </Button>
                  <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Renew Contract Dialog */}
        <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
          <DialogContent className="bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Renew Contract</DialogTitle>
            </DialogHeader>
            {selectedContract && (() => {
              const currentEndDate = new Date(selectedContract.rentalEndDate);
              const newEndDate = new Date(currentEndDate);
              newEndDate.setDate(newEndDate.getDate() + additionalDays);
              const dailyRateNum = parseFloat(selectedContract.dailyRate);
              const additionalCost = dailyRateNum * additionalDays;
              
              return (
                <div className="space-y-4">
                  <div className="bg-gray-700 p-4 rounded-lg space-y-3">
                    <div>
                      <div className="text-sm text-gray-400">Current End Date</div>
                      <div className="font-semibold">{currentEndDate.toLocaleDateString()}</div>
                    </div>
                    <div>
                      <Label htmlFor="additionalDays">Additional Days</Label>
                      <Input
                        id="additionalDays"
                        type="number"
                        min="1"
                        value={additionalDays}
                        onChange={(e) => setAdditionalDays(parseInt(e.target.value) || 1)}
                        className="bg-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">New End Date</div>
                      <div className="font-semibold text-orange-500">{newEndDate.toLocaleDateString()}</div>
                    </div>
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <div className="text-sm text-gray-400">Daily Rate</div>
                      <div>${dailyRateNum.toFixed(2)}</div>
                      <div className="text-sm text-gray-400 mt-2">Additional Cost</div>
                      <div className="text-xl font-bold text-orange-500">${additionalCost.toFixed(2)}</div>
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
                      className="bg-orange-600 hover:bg-orange-700"
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
      </div>
    </div>
  );
}
