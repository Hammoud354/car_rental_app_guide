import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserFilter } from "@/contexts/UserFilterContext";
import { Building2, FileText, LayoutDashboard, Plus, Users, Wrench, Edit, Trash2, Eye, Search, Settings, Check, ChevronsUpDown, AlertTriangle, Upload, Download } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { DateDropdownSelector } from "@/components/DateDropdownSelector";
import { ModernDatePicker } from "@/components/ModernDatePicker";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WORLD_NATIONALITIES } from "@shared/nationalities";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { exportClientsToCSV } from "@shared/csvExport";
import { useTranslation } from "react-i18next";

// Helper function to check license expiry status
const getLicenseExpiryStatus = (expiryDate: Date | string) => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(today.getMonth() + 3);

  if (expiry < today) {
    return { status: 'expired', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', messageKey: 'clients.licenseExpired' };
  } else if (expiry <= threeMonthsFromNow) {
    return { status: 'expiring', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', messageKey: 'clients.licenseExpiringSoon' };
  }
  return { status: 'valid', color: '', bgColor: '', borderColor: '', messageKey: '' };
};

export default function Clients() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const { selectedUserId: selectedTargetUserId, setSelectedUserId: setSelectedTargetUserId, isSuperAdmin } = useUserFilter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isContractsDialogOpen, setIsContractsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state for create
  const [createLicenseIssueDate, setCreateLicenseIssueDate] = useState<Date>();
  const [createLicenseExpiryDate, setCreateLicenseExpiryDate] = useState<Date>();
  const [createDateOfBirth, setCreateDateOfBirth] = useState<Date>();
  const [createNationalityOpen, setCreateNationalityOpen] = useState(false);
  const [createSelectedNationality, setCreateSelectedNationality] = useState<string>("");
  
  // Form state for edit
  const [editLicenseIssueDate, setEditLicenseIssueDate] = useState<Date>();
  const [editLicenseExpiryDate, setEditLicenseExpiryDate] = useState<Date>();
  const [editDateOfBirth, setEditDateOfBirth] = useState<Date>();
  const [editNationalityOpen, setEditNationalityOpen] = useState(false);
  const [editSelectedNationality, setEditSelectedNationality] = useState<string>("");

  // Fetch all users for Super Admin
  const { data: allUsers } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: isSuperAdmin,
  });
  
  const { data: clients = [] } = trpc.clients.list.useQuery(
    selectedTargetUserId ? { filterUserId: selectedTargetUserId } : undefined
  );
  const { data: clientContracts = [] } = trpc.clients.getContracts.useQuery(
    { clientId: selectedClient?.id || 0 },
    { enabled: !!selectedClient && isContractsDialogOpen }
  );
  // Use predefined world nationalities list
  const nationalities = WORLD_NATIONALITIES;
  
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success(t("clients.clientAdded"));
      utils.clients.list.invalidate();
      setIsCreateDialogOpen(false);
      setCreateLicenseIssueDate(undefined);
      setCreateLicenseExpiryDate(undefined);
      setCreateDateOfBirth(undefined);
      setCreateSelectedNationality("");
    },
    onError: (error) => {
      toast.error(`Failed to add client: ${error.message}`);
    },
  });

  const updateClient = trpc.clients.update.useMutation({
    onSuccess: async () => {
      toast.success(t("clients.clientUpdated"));
      // Invalidate both the list and individual client queries
      await utils.clients.list.invalidate();
      await utils.clients.getById.invalidate();
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      setEditLicenseIssueDate(undefined);
      setEditLicenseExpiryDate(undefined);
      setEditDateOfBirth(undefined);
      setEditSelectedNationality("");
    },
    onError: (error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success(t("clients.clientDeleted"));
      utils.clients.list.invalidate();
      setSelectedClient(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Super Admin must select a specific user to create client for
    if (isSuperAdmin && (!selectedTargetUserId || selectedTargetUserId === 0)) {
      toast.error("Please select a specific user to create this client for");
      return;
    }
    
    // Get and trim all form values
    const firstName = (formData.get("firstName") as string || "").trim();
    const lastName = (formData.get("lastName") as string || "").trim();
    const fatherName = (formData.get("fatherName") as string || "").trim();
    const motherFullName = (formData.get("motherFullName") as string || "").trim();
    const drivingLicenseNumber = (formData.get("drivingLicenseNumber") as string || "").trim();
    
    // Validate required fields
    if (!firstName) {
      toast.error(t("clients.firstNameRequired"));
      return;
    }
    if (!lastName) {
      toast.error(t("clients.lastNameRequired"));
      return;
    }
    if (!fatherName) {
      toast.error(t("clients.fatherNameRequired"));
      return;
    }
    if (!motherFullName) {
      toast.error(t("clients.motherNameRequired"));
      return;
    }
    if (!drivingLicenseNumber) {
      toast.error("Driving license number is required");
      return;
    }
    if (!createLicenseExpiryDate) {
      toast.error(t("clients.licenseExpiryDateRequired"));
      return;
    }
    if (!createLicenseIssueDate) {
      toast.error(t("clients.licenseIssueDateRequired"));
      return;
    }
    
    createClient.mutate({
      firstName,
      lastName,
      fatherName,
      motherFullName,
      nationality: createSelectedNationality || undefined,
      phone: (formData.get("phone") as string || "").trim() || undefined,
      address: (formData.get("address") as string || "").trim() || undefined,
      dateOfBirth: createDateOfBirth?.toISOString().split('T')[0],
      placeOfBirth: (formData.get("placeOfBirth") as string || "").trim() || undefined,
      passportIdNumber: (formData.get("passportIdNumber") as string || "").trim() || undefined,
      registrationNumber: (formData.get("registrationNumber") as string || "").trim() || undefined,
      placeOfRegistration: (formData.get("placeOfRegistration") as string || "").trim() || undefined,
      drivingLicenseNumber,
      licenseIssueDate: createLicenseIssueDate,
      licenseExpiryDate: createLicenseExpiryDate,
      email: (formData.get("email") as string || "").trim() || undefined,
      notes: (formData.get("notes") as string || "").trim() || undefined,
      targetUserId: selectedTargetUserId || undefined,
    });
  };

  const handleEditClick = (client: any) => {
    // Split name into first/last for the form
    const nameParts = (client.name || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Map DB column names → form field names
    const adapted = {
      ...client,
      firstName,
      lastName,
      fatherName: client.fatherName || "",
      motherFullName: client.motherFullName || "",
      placeOfBirth: client.placeOfBirth || "",
      drivingLicenseNumber: client.driverLicenseNumber || "",
      passportIdNumber: client.passportNumber || "",
      registrationNumber: client.idNumber || "",
    };

    setSelectedClient(adapted);
    setEditLicenseIssueDate(client.licenseIssueDate ? new Date(client.licenseIssueDate) : undefined);
    setEditLicenseExpiryDate(client.licenseExpiryDate ? new Date(client.licenseExpiryDate) : undefined);
    setEditDateOfBirth(client.dateOfBirth ? new Date(client.dateOfBirth) : undefined);
    setEditSelectedNationality(client.nationality || "");
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient) return;

    const formData = new FormData(e.currentTarget);
    
    // Get and trim all form values
    const firstName = (formData.get("firstName") as string || "").trim();
    const lastName = (formData.get("lastName") as string || "").trim();
    const fatherName = (formData.get("fatherName") as string || "").trim();
    const motherFullName = (formData.get("motherFullName") as string || "").trim();
    const drivingLicenseNumber = (formData.get("drivingLicenseNumber") as string || "").trim();
    
    // Validate required fields
    if (!firstName) {
      toast.error(t("clients.firstNameRequired"));
      return;
    }
    if (!lastName) {
      toast.error(t("clients.lastNameRequired"));
      return;
    }
    if (!fatherName) {
      toast.error(t("clients.fatherNameRequired"));
      return;
    }
    if (!motherFullName) {
      toast.error(t("clients.motherNameRequired"));
      return;
    }
    if (!drivingLicenseNumber) {
      toast.error("Driving license number is required");
      return;
    }
    if (!editLicenseExpiryDate) {
      toast.error(t("clients.licenseExpiryDateRequired"));
      return;
    }

    updateClient.mutate({
      id: selectedClient.id,
      firstName,
      lastName,
      fatherName,
      motherFullName,
      nationality: editSelectedNationality || undefined,
      phone: (formData.get("phone") as string || "").trim() || undefined,
      address: (formData.get("address") as string || "").trim() || undefined,
      dateOfBirth: editDateOfBirth?.toISOString().split('T')[0],
      placeOfBirth: (formData.get("placeOfBirth") as string || "").trim() || undefined,
      passportIdNumber: (formData.get("passportIdNumber") as string || "").trim() || undefined,
      registrationNumber: (formData.get("registrationNumber") as string || "").trim() || undefined,
      placeOfRegistration: (formData.get("placeOfRegistration") as string || "").trim() || undefined,
      drivingLicenseNumber,
      licenseIssueDate: editLicenseIssueDate,
      licenseExpiryDate: editLicenseExpiryDate,
      email: (formData.get("email") as string || "").trim() || undefined,
      notes: (formData.get("notes") as string || "").trim() || undefined,
    });
  };

  const filteredClients = clients.filter((client) =>
    (client.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.driverLicenseNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("clients.title")}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t("clients.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <BulkImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                type="clients"
                onImport={async (data) => {
                  const results = await Promise.all(
                    data.map(async (client) => {
                      try {
                        await createClient.mutateAsync(client);
                        return { success: true };
                      } catch (error: any) {
                        return { success: false, error: error.message };
                      }
                    })
                  );
                  utils.clients.list.invalidate();
                  return { results };
                }}
              />
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportClientsToCSV(clients)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the client's personal and license information
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" name="firstName" required className="input-client" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" name="lastName" required className="input-client" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="fatherName">Father's Name *</Label>
                        <Input id="fatherName" name="fatherName" required placeholder="Ahmed Hassan" className="input-client" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="nationality">{t("clients.nationality")}</Label>
                        <Popover open={createNationalityOpen} onOpenChange={setCreateNationalityOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={createNationalityOpen}
                              className="w-full justify-between"
                            >
                              {createSelectedNationality || "Select nationality..."}
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
                                        setCreateSelectedNationality(value);
                                        setCreateNationalityOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          createSelectedNationality === nat ? "opacity-100" : "opacity-0"
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
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="motherFullName">Mother's Full Name *</Label>
                        <Input id="motherFullName" name="motherFullName" required placeholder="Fatima Ahmed" className="input-client" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="phone">{t("common.phone")}</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="e.g., +1 234 567 8900" className="input-client" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="email">{t("common.email")}</Label>
                        <Input id="email" name="email" type="email" placeholder="client@example.com" className="input-client" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="address">{t("common.address")}</Label>
                        <Input id="address" name="address" placeholder="Street, City, State, ZIP" className="input-client" />
                      </div>
                      <div className="col-span-2">
                        <Label>{t("clients.dateOfBirth")}</Label>
                        <ModernDatePicker
                          date={createDateOfBirth}
                          onDateChange={setCreateDateOfBirth}
                          placeholder="Select date"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="placeOfBirth">{t("clients.placeOfBirth")}</Label>
                        <Input id="placeOfBirth" name="placeOfBirth" placeholder="City, Country" className="input-client w-full" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="registrationNumber">{t("clients.registrationNumber")}</Label>
                        <Input id="registrationNumber" name="registrationNumber" placeholder="Business/Company Registration" className="input-client" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="placeOfRegistration">{t("clients.placeOfRegistration")}</Label>
                        <Input id="placeOfRegistration" name="placeOfRegistration" placeholder="e.g., Beirut, Tripoli" className="input-client" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="passportIdNumber">{t("clients.passportNumber")}</Label>
                        <Input id="passportIdNumber" name="passportIdNumber" placeholder="Passport or National ID" className="input-client" />
                      </div>
                    </div>
                  </div>

                  {/* Driving License */}
                   <div className="border-t border-gray-700 pt-4">
                     <h3 className="font-semibold mb-4">{t("clients.drivingLicense")}</h3>
                     <div className="space-y-6">
                       <div>
                         <Label htmlFor="drivingLicenseNumber">{t("clients.drivingLicense")} *</Label>
                         <Input id="drivingLicenseNumber" name="drivingLicenseNumber" required className="input-client" />
                       </div>
                       <div className="pt-2">
                         <DateDropdownSelector
                           id="licenseIssueDate"
                           label="Issue Date"
                           value={createLicenseIssueDate}
                           onChange={setCreateLicenseIssueDate}
                           maxDate={new Date()}
                         />
                       </div>
                       <div className="pt-2">
                         <DateDropdownSelector
                           id="licenseExpiryDate"
                           label="Expiry Date *"
                           value={createLicenseExpiryDate}
                           onChange={setCreateLicenseExpiryDate}
                           required
                           minDate={new Date()}
                         />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="border-t border-gray-700 pt-4">
                    <Label htmlFor="notes">{t("common.notes")}</Label>
                    <Input id="notes" name="notes" placeholder="Additional information about the client" className="input-client" />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createClient.isPending}>
                      {createClient.isPending ? "Adding..." : "Add Client"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or license number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clients List */}
        <div className="grid gap-4">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {clients.length === 0 ? "No clients yet. Create your first client to get started." : "No clients match your search."}
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => {
              const licenseStatus = getLicenseExpiryStatus(client.licenseExpiryDate ?? new Date());
              return (
                <Card key={client.id} className={`${licenseStatus.bgColor} ${licenseStatus.borderColor} border`}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t("common.phone")}:</span>
                            <p>{client.phone || t("common.na")}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t("clients.drivingLicense")}:</span>
                            <p>{client.driverLicenseNumber || t("common.na")}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t("clients.licenseExpiryDate")}:</span>
                            <p className={licenseStatus.color}>
                              {client.licenseExpiryDate ? new Date(client.licenseExpiryDate).toLocaleDateString() : t("common.na")}
                              {licenseStatus.messageKey && ` - ${t(licenseStatus.messageKey)}`}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t("clients.nationality")}:</span>
                            <p>{client.nationality || t("common.na")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const nameParts = (client.name || "").trim().split(" ");
                            setSelectedClient({
                              ...client,
                              firstName: nameParts[0] || "",
                              lastName: nameParts.slice(1).join(" ") || "",
                              drivingLicenseNumber: client.driverLicenseNumber || "",
                              passportIdNumber: client.passportNumber || "",
                              registrationNumber: client.idNumber || "",
                            });
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this client?")) {
                              deleteClient.mutate({ id: client.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("clients.editClient")}</DialogTitle>
              <DialogDescription>
                Update the client's information
              </DialogDescription>
            </DialogHeader>
            {selectedClient && (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-firstName">First Name *</Label>
                      <Input id="edit-firstName" name="firstName" defaultValue={selectedClient.firstName} required className="input-client" />
                    </div>
                    <div>
                      <Label htmlFor="edit-lastName">Last Name *</Label>
                      <Input id="edit-lastName" name="lastName" defaultValue={selectedClient.lastName} required className="input-client" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-fatherName">Father's Name *</Label>
                      <Input id="edit-fatherName" name="fatherName" defaultValue={selectedClient.fatherName} required placeholder="Ahmed Hassan" className="input-client" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-nationality">{t("clients.nationality")}</Label>
                      <Popover open={editNationalityOpen} onOpenChange={setEditNationalityOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={editNationalityOpen}
                            className="w-full justify-between"
                          >
                            {editSelectedNationality || "Select nationality..."}
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
                                      setEditSelectedNationality(value);
                                      setEditNationalityOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        editSelectedNationality === nat ? "opacity-100" : "opacity-0"
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
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-motherFullName">Mother's Full Name *</Label>
                      <Input id="edit-motherFullName" name="motherFullName" defaultValue={selectedClient.motherFullName} required placeholder="Fatima Ahmed" className="input-client" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-phone">{t("common.phone")}</Label>
                      <Input id="edit-phone" name="phone" type="tel" defaultValue={selectedClient.phone || ""} placeholder="e.g., +1 234 567 8900" className="input-client" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-email">{t("common.email")}</Label>
                      <Input id="edit-email" name="email" type="email" defaultValue={selectedClient.email || ""} placeholder="client@example.com" className="input-client" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-address">{t("common.address")}</Label>
                      <Input id="edit-address" name="address" defaultValue={selectedClient.address || ""} placeholder="Street, City, State, ZIP" className="input-client" />
                    </div>
                    <div className="col-span-2">
                      <Label>{t("clients.dateOfBirth")}</Label>
                      <ModernDatePicker
                        date={editDateOfBirth}
                        onDateChange={setEditDateOfBirth}
                        placeholder="Select date"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-placeOfBirth">{t("clients.placeOfBirth")}</Label>
                      <Input id="edit-placeOfBirth" name="placeOfBirth" defaultValue={selectedClient.placeOfBirth || ""} placeholder="City, Country" className="input-client" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-registrationNumber">{t("clients.registrationNumber")}</Label>
                      <Input id="edit-registrationNumber" name="registrationNumber" defaultValue={selectedClient.registrationNumber || ""} placeholder="Business/Company Registration" className="input-client" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-placeOfRegistration">{t("clients.placeOfRegistration")}</Label>
                      <Input id="edit-placeOfRegistration" name="placeOfRegistration" defaultValue={selectedClient.placeOfRegistration || ""} placeholder="e.g., Beirut, Tripoli" className="input-client" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-passportIdNumber">{t("clients.passportNumber")}</Label>
                      <Input id="edit-passportIdNumber" name="passportIdNumber" defaultValue={selectedClient.passportIdNumber || ""} placeholder="Passport or National ID" className="input-client" />
                    </div>
                  </div>
                </div>

                {/* Driving License */}
                 <div className="border-t border-gray-700 pt-4">
                   <h3 className="font-semibold mb-4">{t("clients.drivingLicense")}</h3>
                   <div className="space-y-6">
                     <div>
                       <Label htmlFor="edit-drivingLicenseNumber">{t("clients.drivingLicense")} *</Label>
                       <Input id="edit-drivingLicenseNumber" name="drivingLicenseNumber" defaultValue={selectedClient.drivingLicenseNumber} required className="input-client" />
                     </div>
                     <div className="pt-2">
                       <DateDropdownSelector
                         id="edit-licenseIssueDate"
                         label="Issue Date"
                         value={editLicenseIssueDate}
                         onChange={setEditLicenseIssueDate}
                         maxDate={new Date()}
                       />
                     </div>
                     <div className="pt-2">
                       <DateDropdownSelector
                         id="edit-licenseExpiryDate"
                         label="Expiry Date *"
                         value={editLicenseExpiryDate}
                         onChange={setEditLicenseExpiryDate}
                         required
                         minDate={new Date()}
                       />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="border-t border-gray-700 pt-4">
                  <Label htmlFor="edit-notes">{t("common.notes")}</Label>
                  <Input id="edit-notes" name="notes" defaultValue={selectedClient.notes || ""} placeholder="Additional information about the client" className="input-client" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateClient.isPending}>
                    {updateClient.isPending ? "Updating..." : "Update Client"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("clients.clientDetails")}</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">{t("clients.firstName")}</span>
                    <p className="font-semibold">{selectedClient.firstName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.lastName")}</span>
                    <p className="font-semibold">{selectedClient.lastName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.fathersName")}</span>
                    <p className="font-semibold">{selectedClient.fatherName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.mothersFullName")}</span>
                    <p className="font-semibold">{selectedClient.motherFullName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.nationality")}</span>
                    <p className="font-semibold">{selectedClient.nationality || t("common.na")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("common.phone")}</span>
                    <p className="font-semibold">{selectedClient.phone || t("common.na")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("common.email")}</span>
                    <p className="font-semibold">{selectedClient.email || t("common.na")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("common.address")}</span>
                    <p className="font-semibold">{selectedClient.address || t("common.na")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.dateOfBirth")}</span>
                    <p className="font-semibold">{selectedClient.dateOfBirth ? new Date(selectedClient.dateOfBirth).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.placeOfBirth")}</span>
                    <p className="font-semibold">{selectedClient.placeOfBirth || t("common.na")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.passportNumber")}</span>
                    <p className="font-semibold">{selectedClient.passportIdNumber || t("common.na")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.registrationNumber")}</span>
                    <p className="font-semibold">{selectedClient.registrationNumber || t("common.na")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.placeOfRegistration")}</span>
                    <p className="font-semibold">{selectedClient.placeOfRegistration || t("common.na")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.drivingLicense")}</span>
                    <p className="font-semibold">{selectedClient.drivingLicenseNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.licenseIssueDate")}</span>
                    <p className="font-semibold">{selectedClient.licenseIssueDate ? new Date(selectedClient.licenseIssueDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("clients.licenseExpiryDate")}</span>
                    <p className="font-semibold">{selectedClient.licenseExpiryDate ? new Date(selectedClient.licenseExpiryDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("common.notes")}</span>
                    <p className="font-semibold">{selectedClient.notes || t("common.na")}</p>
                  </div>
                </div>

                {/* Contracts Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Associated Contracts</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsContractsDialogOpen(true)}
                    >
                      View All
                    </Button>
                  </div>
                  {clientContracts && clientContracts.length > 0 ? (
                    <div className="space-y-2">
                      {clientContracts.slice(0, 3).map((contract) => (
                        <div key={contract.id} className="p-2 bg-muted rounded text-sm">
                          <p className="font-semibold">Contract #{contract.id}</p>
                          <p className="text-muted-foreground">
                            {new Date(contract.rentalStartDate).toLocaleDateString()} - {new Date(contract.rentalEndDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No contracts associated with this client</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
