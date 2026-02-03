import { useState, useEffect } from "react";
import MinimalLayout from "@/components/MinimalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Building2, FileText, LayoutDashboard, Plus, Users, Wrench, Edit, Trash2, Eye, Search, Settings } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { DateDropdownSelector } from "@/components/DateDropdownSelector";

export default function Clients() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isContractsDialogOpen, setIsContractsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state for create
  const [createLicenseIssueDate, setCreateLicenseIssueDate] = useState<Date>();
  const [createLicenseExpiryDate, setCreateLicenseExpiryDate] = useState<Date>();
  
  // Form state for edit
  const [editLicenseIssueDate, setEditLicenseIssueDate] = useState<Date>();
  const [editLicenseExpiryDate, setEditLicenseExpiryDate] = useState<Date>();

  const { data: clients = [], refetch } = trpc.clients.list.useQuery();
  const { data: clientContracts = [], refetch: refetchContracts } = trpc.clients.getContracts.useQuery(
    { clientId: selectedClient?.id || 0 },
    { enabled: !!selectedClient && isContractsDialogOpen }
  );
  
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Client added successfully");
      refetch();
      setIsCreateDialogOpen(false);
      setCreateLicenseIssueDate(undefined);
      setCreateLicenseExpiryDate(undefined);
    },
    onError: (error) => {
      toast.error(`Failed to add client: ${error.message}`);
    },
  });

  const updateClient = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Client updated successfully");
      refetch();
      setIsEditDialogOpen(false);
      setSelectedClient(null);
    },
    onError: (error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Client deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createClient.mutate({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      nationality: formData.get("nationality") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      address: formData.get("address") as string || undefined,
      drivingLicenseNumber: formData.get("drivingLicenseNumber") as string,
      licenseIssueDate: createLicenseIssueDate,
      licenseExpiryDate: createLicenseExpiryDate!,
      email: formData.get("email") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleEditClick = (client: any) => {
    setSelectedClient(client);
    setEditLicenseIssueDate(client.licenseIssueDate ? new Date(client.licenseIssueDate) : undefined);
    setEditLicenseExpiryDate(client.licenseExpiryDate ? new Date(client.licenseExpiryDate) : undefined);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient) return;
    
    const formData = new FormData(e.currentTarget);
    
    updateClient.mutate({
      id: selectedClient.id,
      firstName: formData.get("firstName") as string || undefined,
      lastName: formData.get("lastName") as string || undefined,
      nationality: formData.get("nationality") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      address: formData.get("address") as string || undefined,
      drivingLicenseNumber: formData.get("drivingLicenseNumber") as string || undefined,
      licenseIssueDate: editLicenseIssueDate,
      licenseExpiryDate: editLicenseExpiryDate,
      email: formData.get("email") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleDeleteClick = (clientId: number, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      deleteClient.mutate({ id: clientId });
    }
  };

  const handleViewDetails = (client: any) => {
    setSelectedClient(client);
    setIsDetailsDialogOpen(true);
  };

  // Filter clients based on search
  const filteredClients = clients.filter((client: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(searchLower) ||
      client.lastName.toLowerCase().includes(searchLower) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.drivingLicenseNumber && client.drivingLicenseNumber.toLowerCase().includes(searchLower)) ||
      (client.nationality && client.nationality.toLowerCase().includes(searchLower))
    );
  });

  return (
    <MinimalLayout>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">CLIENT MANAGEMENT</h2>
            <p className="text-gray-600">Manage customer information and rental history</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" name="firstName" required className="" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" name="lastName" required className="" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input id="nationality" name="nationality" placeholder="e.g., American, Canadian" className="" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="e.g., +1 234 567 8900" className="" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="client@example.com" className="" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" placeholder="Street, City, State, ZIP" className="" />
                    </div>
                  </div>
                </div>

                {/* Driving License */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="font-semibold mb-4">Driving License</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="drivingLicenseNumber">License Number *</Label>
                      <Input id="drivingLicenseNumber" name="drivingLicenseNumber" required className="" />
                    </div>
                    <div>
                      <DateDropdownSelector
                        id="licenseIssueDate"
                        label="Issue Date"
                        value={createLicenseIssueDate}
                        onChange={setCreateLicenseIssueDate}
                      />
                    </div>
                    <div>
                      <DateDropdownSelector
                        id="licenseExpiryDate"
                        label="Expiry Date *"
                        value={createLicenseExpiryDate}
                        onChange={setCreateLicenseExpiryDate}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="border-t border-gray-700 pt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" placeholder="Additional information about the client" className="" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    Add Client
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone, license number, or nationality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{filteredClients.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{searchTerm ? "Yes" : "No"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client: any) => (
            <Card key={client.id} className="bg-white border-gray-200 hover:border-gray-400 transition-colors">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center justify-between">
                  <span>{client.firstName} {client.lastName}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDetails(client)}
                      className="h-8 w-8 p-0 hover:bg-blue-700"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedClient(client);
                        setIsContractsDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 hover:bg-blue-700"
                      title="View Contracts"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(client)}
                      className="h-8 w-8 p-0 hover:bg-blue-700"
                      title="Edit Client"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(client.id, `${client.firstName} ${client.lastName}`)}
                      className="h-8 w-8 p-0 hover:bg-red-700 text-red-400"
                      title="Delete Client"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                {client.nationality && (
                  <div className="text-sm">
                    <span className="text-gray-400">Nationality:</span> {client.nationality}
                  </div>
                )}
                {client.phone && (
                  <div className="text-sm">
                    <span className="text-gray-400">Phone:</span> {client.phone}
                  </div>
                )}
                {client.email && (
                  <div className="text-sm">
                    <span className="text-gray-400">Email:</span> {client.email}
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-gray-400">License:</span> {client.drivingLicenseNumber}
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">License Expiry:</span>{" "}
                  {new Date(client.licenseExpiryDate).toLocaleDateString()}
                </div>
                {client.address && (
                  <div className="text-sm">
                    <span className="text-gray-400">Address:</span> {client.address}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <Card className="bg-white border-gray-200 p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? "No Clients Found" : "No Clients Yet"}
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Add your first client to start managing customer information"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Add First Client
              </Button>
            )}
          </Card>
        )}

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-firstName">First Name *</Label>
                    <Input 
                      id="edit-firstName" 
                      name="firstName" 
                      defaultValue={selectedClient.firstName}
                      required 
                      className="" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-lastName">Last Name *</Label>
                    <Input 
                      id="edit-lastName" 
                      name="lastName" 
                      defaultValue={selectedClient.lastName}
                      required 
                      className="" 
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-nationality">Nationality</Label>
                    <Input 
                      id="edit-nationality" 
                      name="nationality" 
                      defaultValue={selectedClient.nationality || ""}
                      placeholder="e.g., American, Canadian" 
                      className="" 
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <Input 
                      id="edit-phone" 
                      name="phone" 
                      type="tel" 
                      defaultValue={selectedClient.phone || ""}
                      placeholder="e.g., +1 234 567 8900" 
                      className="" 
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input 
                      id="edit-email" 
                      name="email" 
                      type="email" 
                      defaultValue={selectedClient.email || ""}
                      placeholder="client@example.com" 
                      className="" 
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input 
                      id="edit-address" 
                      name="address" 
                      defaultValue={selectedClient.address || ""}
                      placeholder="Street, City, State, ZIP" 
                      className="" 
                    />
                  </div>
                </div>
              </div>

              {/* Driving License */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-semibold mb-4">Driving License</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="edit-drivingLicenseNumber">License Number *</Label>
                    <Input 
                      id="edit-drivingLicenseNumber" 
                      name="drivingLicenseNumber" 
                      defaultValue={selectedClient.drivingLicenseNumber}
                      required 
                      className="" 
                    />
                  </div>
                  <div>
                    <DateDropdownSelector
                      id="edit-licenseIssueDate"
                      label="Issue Date"
                      value={editLicenseIssueDate}
                      onChange={setEditLicenseIssueDate}
                    />
                  </div>
                  <div>
                    <DateDropdownSelector
                      id="edit-licenseExpiryDate"
                      label="Expiry Date *"
                      value={editLicenseExpiryDate}
                      onChange={setEditLicenseExpiryDate}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="border-t border-gray-700 pt-4">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input 
                  id="edit-notes" 
                  name="notes" 
                  defaultValue={selectedClient.notes || ""}
                  placeholder="Additional information about the client" 
                  className="" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  Update Client
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Full Name</Label>
                  <p className="font-medium text-white">{selectedClient.firstName} {selectedClient.lastName}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Nationality</Label>
                  <p className="font-medium text-white">{selectedClient.nationality || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Email</Label>
                  <p className="font-medium text-white">{selectedClient.email || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Phone</Label>
                  <p className="font-medium text-white">{selectedClient.phone || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-400">Address</Label>
                  <p className="font-medium text-white">{selectedClient.address || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-gray-400">License Number</Label>
                  <p className="font-mono text-sm text-white">{selectedClient.drivingLicenseNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-400">License Expiry</Label>
                  <p className="font-medium text-white">{new Date(selectedClient.licenseExpiryDate).toLocaleDateString()}</p>
                </div>
                {selectedClient.licenseIssueDate && (
                  <div>
                    <Label className="text-gray-400">License Issue Date</Label>
                    <p className="font-medium text-white">{new Date(selectedClient.licenseIssueDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedClient.notes && (
                  <div className="col-span-2">
                    <Label className="text-gray-400">Notes</Label>
                    <p className="font-medium text-white whitespace-pre-wrap">{selectedClient.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Contracts Dialog */}
      <Dialog open={isContractsDialogOpen} onOpenChange={setIsContractsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Rental History - {selectedClient?.firstName} {selectedClient?.lastName}
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              {clientContracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No rental contracts found for this client</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientContracts.map((contract: any) => (
                    <Card key={contract.id} className="">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-gray-400 text-xs">Contract Number</Label>
                            <p className="font-mono text-sm text-orange-400">{contract.contractNumber}</p>
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">Status</Label>
                            <p className="font-medium text-sm">
                              <span className={`inline-block px-2 py-1 rounded text-xs ${
                                contract.status === 'active' ? 'bg-green-900 text-green-300' :
                                contract.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                                'bg-red-900 text-red-300'
                              }`}>
                                {contract.status.toUpperCase()}
                              </span>
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">Rental Period</Label>
                            <p className="text-sm">
                              {new Date(contract.rentalStartDate).toLocaleDateString()} - {new Date(contract.rentalEndDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">Total Amount</Label>
                            <p className="font-bold text-sm text-green-400">${contract.finalAmount}</p>
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">Rental Days</Label>
                            <p className="text-sm">{contract.rentalDays} days</p>
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">Daily Rate</Label>
                            <p className="text-sm">${contract.dailyRate}/day</p>
                          </div>
                          {contract.pickupKm && (
                            <div>
                              <Label className="text-gray-400 text-xs">Pickup KM</Label>
                              <p className="text-sm">{contract.pickupKm.toLocaleString()} km</p>
                            </div>
                          )}
                          {contract.returnKm && (
                            <div>
                              <Label className="text-gray-400 text-xs">Return KM</Label>
                              <p className="text-sm">{contract.returnKm.toLocaleString()} km</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <div className="pt-4 border-t border-gray-700">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Label className="text-gray-400 text-xs">Total Contracts</Label>
                    <p className="text-2xl font-bold text-white">{clientContracts.length}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs">Active Contracts</Label>
                    <p className="text-2xl font-bold text-green-400">
                      {clientContracts.filter((c: any) => c.status === 'active').length}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs">Total Revenue</Label>
                    <p className="text-2xl font-bold text-orange-400">
                      ${clientContracts.reduce((sum: number, c: any) => sum + Number(c.finalAmount || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContractsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MinimalLayout>
  );
}
