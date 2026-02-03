import MinimalLayout from "@/components/MinimalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, DollarSign, Wrench, Shield, FileText } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analysis() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  
  const { data: vehicles, isLoading: vehiclesLoading } = trpc.fleet.list.useQuery();
  const { data: analysis, isLoading: analysisLoading } = trpc.fleet.getAnalysis.useQuery(
    { vehicleId: parseInt(selectedVehicleId) },
    { enabled: !!selectedVehicleId }
  );

  const isProfitable = analysis && analysis.netProfit > 0;
  const profitabilityPercentage = analysis && analysis.totalRevenue > 0
    ? ((analysis.netProfit / analysis.totalRevenue) * 100).toFixed(1)
    : "0";

  return (
    <MinimalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Analysis</h1>
          <p className="text-gray-600 mt-2">
            Analyze individual vehicle profitability, costs, and performance metrics
          </p>
        </div>

        {/* Vehicle Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose a vehicle from your fleet" />
              </SelectTrigger>
              <SelectContent>
                {vehiclesLoading ? (
                  <SelectItem value="loading" disabled>Loading vehicles...</SelectItem>
                ) : vehicles && vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.plateNumber}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No vehicles in fleet</SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Analysis Content */}
        {selectedVehicleId && (
          <>
            {analysisLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : analysis ? (
              <>
                {/* Profitability Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className={isProfitable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Net Profit/Loss</CardTitle>
                      {isProfitable ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${isProfitable ? "text-green-700" : "text-red-700"}`}>
                        ${analysis.netProfit.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {isProfitable ? "Profitable" : "Loss"} ({profitabilityPercentage}%)
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Total Revenue</CardTitle>
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        ${analysis.totalRevenue.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        From {analysis.totalContracts} rental{analysis.totalContracts !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Maintenance Costs</CardTitle>
                      <Wrench className="h-5 w-5 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        ${analysis.totalMaintenanceCost.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {analysis.maintenanceRecords.length} record{analysis.maintenanceRecords.length !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Insurance Cost</CardTitle>
                      <Shield className="h-5 w-5 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        ${analysis.insuranceCost.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Annual policy
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Maintenance Records */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Maintenance History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysis.maintenanceRecords.length > 0 ? (
                      <div className="space-y-3">
                        {analysis.maintenanceRecords.map((record) => (
                          <div key={record.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{record.type}</p>
                              <p className="text-sm text-gray-600">{record.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">${record.cost.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">{record.mileage.toLocaleString()} km</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No maintenance records found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Rental Contracts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Rental History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysis.rentalContracts.length > 0 ? (
                      <div className="space-y-3">
                        {analysis.rentalContracts.map((contract) => (
                          <div key={contract.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">Contract #{contract.id}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 capitalize">
                                Status: {contract.status}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">${contract.totalCost.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">
                                {Math.ceil((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No rental contracts found</p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No analysis data available for this vehicle</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!selectedVehicleId && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Select a vehicle to view its profitability analysis</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MinimalLayout>
  );
}
