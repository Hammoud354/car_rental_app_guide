import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import SidebarLayout from "@/components/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Car, Calendar, DollarSign, FileText } from "lucide-react";
import { VehicleImageUpload, VehicleImageGallery } from "@/components/VehicleImageUpload";
import { Loader2 } from "lucide-react";

export default function VehicleDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const vehicleId = parseInt(params.id || "0");

  const { data: vehicle, isLoading } = trpc.fleet.getById.useQuery({ id: vehicleId });

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  if (!vehicle) {
    return (
      <SidebarLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Vehicle Not Found</h2>
          <Button onClick={() => setLocation("/fleet-management")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fleet
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  const statusColors = {
    Available: "bg-green-500",
    Rented: "bg-blue-500",
    Maintenance: "bg-yellow-500",
    "Out of Service": "bg-red-500",
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/fleet-management")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-muted-foreground">
                {vehicle.year} • {vehicle.plateNumber}
              </p>
            </div>
          </div>
          <Badge className={statusColors[vehicle.status as keyof typeof statusColors]}>
            {vehicle.status}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Vehicle Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images Section */}
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
                      <VehicleImageUpload
                        vehicleId={vehicleId}
                        imageType="exterior"
                      />
                      <VehicleImageUpload
                        vehicleId={vehicleId}
                        imageType="interior"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="exterior" className="space-y-4">
                    <VehicleImageGallery vehicleId={vehicleId} imageType="exterior" />
                    <VehicleImageUpload
                      vehicleId={vehicleId}
                      imageType="exterior"
                    />
                  </TabsContent>
                  
                  <TabsContent value="interior" className="space-y-4">
                    <VehicleImageGallery vehicleId={vehicleId} imageType="interior" />
                    <VehicleImageUpload
                      vehicleId={vehicleId}
                      imageType="interior"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium">{vehicle.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{vehicle.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">VIN</p>
                    <p className="font-medium">{vehicle.vin || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mileage</p>
                    <p className="font-medium">{vehicle.mileage?.toLocaleString() || "0"} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pricing & Insurance */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Rate</p>
                  <p className="text-2xl font-bold">${vehicle.dailyRate}</p>
                </div>
                {vehicle.weeklyRate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Weekly Rate</p>
                    <p className="text-xl font-semibold">${vehicle.weeklyRate}</p>
                  </div>
                )}
                {vehicle.monthlyRate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Rate</p>
                    <p className="text-xl font-semibold">${vehicle.monthlyRate}</p>
                  </div>
                )}
                {vehicle.purchaseCost && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground">Purchase Cost</p>
                    <p className="text-lg font-medium">${vehicle.purchaseCost}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insurance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Policy Number</p>
                  <p className="font-medium">{vehicle.insurancePolicyNumber || "N/A"}</p>
                </div>
                {vehicle.insuranceExpiryDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">
                      {new Date(vehicle.insuranceExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {vehicle.insuranceCost && (
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Cost</p>
                    <p className="font-medium">${vehicle.insuranceCost}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {vehicle.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {vehicle.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
