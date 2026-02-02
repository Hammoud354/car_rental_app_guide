import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wrench, 
  Shield, 
  Car,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProfitabilityDashboard() {
  const { data: analytics, isLoading } = trpc.analytics.vehicleProfitability.useQuery();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const { data: vehicleDetails } = trpc.analytics.vehicleFinancialDetails.useQuery(
    { vehicleId: selectedVehicleId! },
    { enabled: selectedVehicleId !== null }
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No vehicle data available yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate fleet-wide totals
  const fleetTotals = analytics.reduce(
    (acc, vehicle) => ({
      revenue: acc.revenue + vehicle.totalRevenue,
      maintenance: acc.maintenance + vehicle.totalMaintenanceCost,
      insurance: acc.insurance + vehicle.insuranceCost,
      profit: acc.profit + vehicle.netProfit,
    }),
    { revenue: 0, maintenance: 0, insurance: 0, profit: 0 }
  );

  const fleetProfitMargin = fleetTotals.revenue > 0 
    ? (fleetTotals.profit / fleetTotals.revenue) * 100 
    : 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Profitability Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive financial analysis of your fleet performance
        </p>
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${fleetTotals.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {analytics.length} vehicles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Costs</CardTitle>
            <Wrench className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${fleetTotals.maintenance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total maintenance expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Insurance Costs</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${fleetTotals.insurance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total insurance expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {fleetTotals.profit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${fleetTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${fleetTotals.profit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fleetProfitMargin.toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Profitability Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Profitability Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Vehicle</th>
                  <th className="text-right p-3 font-semibold">Revenue</th>
                  <th className="text-right p-3 font-semibold">Maintenance</th>
                  <th className="text-right p-3 font-semibold">Insurance</th>
                  <th className="text-right p-3 font-semibold">Net Profit</th>
                  <th className="text-right p-3 font-semibold">Margin %</th>
                  <th className="text-center p-3 font-semibold">Rentals</th>
                  <th className="text-center p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {analytics
                  .sort((a, b) => b.netProfit - a.netProfit)
                  .map((vehicle) => (
                    <tr key={vehicle.vehicleId} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{vehicle.plateNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {vehicle.brand} {vehicle.model} ({vehicle.year})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right p-3 font-medium text-green-600">
                        ${vehicle.totalRevenue.toFixed(2)}
                      </td>
                      <td className="text-right p-3 text-orange-600">
                        ${vehicle.totalMaintenanceCost.toFixed(2)}
                      </td>
                      <td className="text-right p-3 text-blue-600">
                        ${vehicle.insuranceCost.toFixed(2)}
                      </td>
                      <td className={`text-right p-3 font-semibold ${vehicle.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {vehicle.netProfit >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          ${Math.abs(vehicle.netProfit).toFixed(2)}
                        </div>
                      </td>
                      <td className={`text-right p-3 ${vehicle.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {vehicle.profitMargin.toFixed(1)}%
                      </td>
                      <td className="text-center p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {vehicle.rentalCount}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Financial Details Dialog */}
      <Dialog open={selectedVehicleId !== null} onOpenChange={() => setSelectedVehicleId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {vehicleDetails && (
                <>
                  Financial Details - {vehicleDetails.vehicle.plateNumber} ({vehicleDetails.vehicle.brand} {vehicleDetails.vehicle.model})
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {vehicleDetails && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                    <div className="text-xl font-bold text-green-600 mt-1">
                      ${vehicleDetails.summary.totalRevenue.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Maintenance</div>
                    <div className="text-xl font-bold text-orange-600 mt-1">
                      ${vehicleDetails.summary.totalMaintenanceCost.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Insurance</div>
                    <div className="text-xl font-bold text-blue-600 mt-1">
                      ${vehicleDetails.summary.insuranceCost.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Net Profit</div>
                    <div className={`text-xl font-bold mt-1 ${vehicleDetails.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${vehicleDetails.summary.netProfit.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rental History */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Rental History ({vehicleDetails.contracts.length})</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-sm">Contract #</th>
                        <th className="text-left px-4 py-3 font-semibold text-sm">Start Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-sm">End Date</th>
                        <th className="text-right px-4 py-3 font-semibold text-sm">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleDetails.contracts.slice(0, 10).map((contract) => (
                        <tr key={contract.id} className="border-t hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-sm">{contract.contractNumber}</td>
                          <td className="px-4 py-3 text-sm">{new Date(contract.rentalStartDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm">{new Date(contract.rentalEndDate).toLocaleDateString()}</td>
                          <td className="text-right px-4 py-3 text-sm font-medium">${Number(contract.finalAmount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Maintenance History */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Maintenance History ({vehicleDetails.maintenanceRecords.length})</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-sm">Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-sm">Type</th>
                        <th className="text-left px-4 py-3 font-semibold text-sm">Description</th>
                        <th className="text-right px-4 py-3 font-semibold text-sm">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleDetails.maintenanceRecords.slice(0, 10).map((record) => (
                        <tr key={record.id} className="border-t hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-sm">{new Date(record.performedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 font-medium">
                              {record.maintenanceType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{record.description || '-'}</td>
                          <td className="text-right px-4 py-3 text-sm font-medium">${Number(record.cost).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
