import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Car, FileText, LayoutDashboard, Plus, Users, Wrench } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { DateDropdownSelector } from "@/components/DateDropdownSelector";

export default function Clients() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [licenseIssueDate, setLicenseIssueDate] = useState<Date>();
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<Date>();

  const { data: clients = [], refetch } = trpc.clients.list.useQuery();
  
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Client added successfully");
      refetch();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add client: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createClient.mutate({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      nationality: formData.get("nationality") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      address: formData.get("address") as string || undefined,
      drivingLicenseNumber: formData.get("drivingLicenseNumber") as string,
      licenseIssueDate,
      licenseExpiryDate: licenseExpiryDate!,
      email: formData.get("email") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 p-6 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Car className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold">RENTAL.OS</h1>
          </div>
          <p className="text-xs text-gray-300">v2.0.26 SYSTEM READY</p>
        </div>

        <nav className="space-y-2 flex-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:bg-blue-800"
            onClick={() => window.location.href = '/dashboard'}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Overview
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:bg-blue-800"
            onClick={() => window.location.href = '/fleet'}
          >
            <Car className="mr-2 h-4 w-4" />
            Fleet Management
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:bg-blue-800"
            onClick={() => window.location.href = '/maintenance'}
          >
            <Wrench className="mr-2 h-4 w-4" />
            Maintenance
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:bg-blue-800"
            onClick={() => window.location.href = '/contracts'}
          >
            <FileText className="mr-2 h-4 w-4" />
            Contracts
          </Button>
          <Button 
            variant="default" 
            className="w-full justify-start bg-orange-600 hover:bg-orange-700"
          >
            <Users className="mr-2 h-4 w-4" />
            Clients
          </Button>
        </nav>

        <div className="mt-auto pt-4 border-t border-blue-800">
          <div className="text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400">● ONLINE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">CLIENT MANAGEMENT</h2>
            <p className="text-gray-400">Manage customer information and rental history</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" name="firstName" required className="bg-gray-700 border-gray-600" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" name="lastName" required className="bg-gray-700 border-gray-600" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input id="nationality" name="nationality" placeholder="e.g., American, Canadian" className="bg-gray-700 border-gray-600" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="e.g., +1 234 567 8900" className="bg-gray-700 border-gray-600" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="client@example.com" className="bg-gray-700 border-gray-600" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" placeholder="Street, City, State, ZIP" className="bg-gray-700 border-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Driving License */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="font-semibold mb-4">Driving License</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="drivingLicenseNumber">License Number *</Label>
                      <Input id="drivingLicenseNumber" name="drivingLicenseNumber" required className="bg-gray-700 border-gray-600" />
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
                        label="Expiry Date *"
                        value={licenseExpiryDate}
                        onChange={setLicenseExpiryDate}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="border-t border-gray-700 pt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" placeholder="Additional information about the client" className="bg-gray-700 border-gray-600" />
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

        {/* Clients List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="bg-gray-800 border-gray-700 hover:border-orange-500 transition-colors">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{client.firstName} {client.lastName}</span>
                  <Users className="h-5 w-5 text-orange-500" />
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

        {clients.length === 0 && (
          <Card className="bg-gray-800 border-gray-700 p-12 text-center">
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Clients Yet</h3>
            <p className="text-gray-400 mb-4">Add your first client to start managing customer information</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              Add First Client
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
