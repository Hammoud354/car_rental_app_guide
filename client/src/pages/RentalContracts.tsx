import { useState } from "react";
import CarDamageInspection from "@/components/CarDamageInspection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Car, FileText, LayoutDashboard, Plus, Wrench } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function RentalContracts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [showInspection, setShowInspection] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  
  const { data: vehicles = [] } = trpc.fleet.list.useQuery();
  const { data: contracts = [] } = trpc.contracts.list.useQuery();
  
  const createContract = trpc.contracts.create.useMutation({
    onSuccess: () => {
      toast.success("Contract created successfully");
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create contract: ${error.message}`);
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
      drivingLicenseNumber: formData.get("drivingLicenseNumber") as string,
      licenseIssueDate: formData.get("licenseIssueDate") ? new Date(formData.get("licenseIssueDate") as string) : undefined,
      licenseExpiryDate: new Date(formData.get("licenseExpiryDate") as string),
      rentalStartDate: new Date(formData.get("rentalStartDate") as string),
      rentalEndDate: new Date(formData.get("rentalEndDate") as string),
    };
    
    setContractData(data);
    setIsCreateDialogOpen(false);
    setShowInspection(true);
  };

  const handleInspectionComplete = (damageMarks: any[], signatureData: string) => {
    if (!contractData) return;
    
    createContract.mutate({
      ...contractData,
      signatureData,
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
              />
            </div>
          ) : (
          <>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rental Contracts</h1>
              <p className="text-gray-600 mt-1">Manage rental agreements and client information</p>
            </div>
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
                  <div>
                    <Label htmlFor="vehicleId">Vehicle *</Label>
                    <Select name="vehicleId" required onValueChange={setSelectedVehicleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles
                          .filter((v) => v.status === "Available")
                          .map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                              {vehicle.plateNumber} - {vehicle.brand} {vehicle.model} ({vehicle.year})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Client Information */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Client Information</h3>
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
                        <Label htmlFor="licenseIssueDate">Issue Date</Label>
                        <Input id="licenseIssueDate" name="licenseIssueDate" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="licenseExpiryDate">Expiry Date *</Label>
                        <Input id="licenseExpiryDate" name="licenseExpiryDate" type="date" required />
                      </div>
                    </div>
                  </div>

                  {/* Rental Period */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Rental Period</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rentalStartDate">Start Date *</Label>
                        <Input id="rentalStartDate" name="rentalStartDate" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="rentalEndDate">Return Date *</Label>
                        <Input id="rentalEndDate" name="rentalEndDate" type="date" required />
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

          {/* Contracts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((contract: any) => {
              const vehicle = vehicles.find((v) => v.id === contract.vehicleId);
              return (
                <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">
                        {contract.clientFirstName} {contract.clientLastName}
                      </span>
                      <FileText className="h-5 w-5 text-blue-600" />
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
      </div>
    </div>
  );
}
