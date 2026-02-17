import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { InsuranceRenewalDialog } from "@/components/InsuranceRenewalDialog";
import { Car, DollarSign, Wrench, AlertTriangle, Clock, Crown, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import SidebarLayout from "@/components/SidebarLayout";
import { Settings as SettingsIcon, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUserFilter } from "@/contexts/UserFilterContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

function ExportToExcelButton() {
  const [isExporting, setIsExporting] = useState(false);
  const exportData = trpc.dataExport.allData.useQuery(undefined, { enabled: false });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.info("Fetching data...");
      
      const result = await exportData.refetch();
      if (!result.data) {
        throw new Error("No data to export");
      }

      const { vehicles, contracts, clients, maintenanceRecords, invoices } = result.data;

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Add Fleet sheet
      const fleetData = vehicles.map(v => ({
        "Brand": v.brand,
        "Model": v.model,
        "Year": v.year,
        "Plate Number": v.plateNumber,
        "VIN": v.vin || "",
        "Category": v.category,
        "Status": v.status,
        "Daily Rate": v.dailyRate,
        "Weekly Rate": v.weeklyRate || "",
        "Monthly Rate": v.monthlyRate || "",
        "Color": v.color,
        "Mileage": v.mileage,
        "Insurance Policy Number": v.insurancePolicyNumber || "",
        "Insurance Expiry": v.insuranceExpiryDate ? new Date(v.insuranceExpiryDate).toLocaleDateString() : "",
        "Insurance Cost": v.insuranceCost || "",
        "Purchase Cost": v.purchaseCost || "",
        "Registration Expiry": v.registrationExpiryDate ? new Date(v.registrationExpiryDate).toLocaleDateString() : "",
      }));
      const fleetSheet = XLSX.utils.json_to_sheet(fleetData);
      XLSX.utils.book_append_sheet(workbook, fleetSheet, "Fleet");

      // Add Contracts sheet
      const contractsData = contracts.map(c => ({
        "Contract Number": c.contractNumber,
        "Client Name": `${c.clientFirstName || ""} ${c.clientLastName || ""}`.trim(),
        "Vehicle ID": c.vehicleId,
        "Start Date": c.rentalStartDate ? new Date(c.rentalStartDate).toLocaleDateString() : "",
        "End Date": c.rentalEndDate ? new Date(c.rentalEndDate).toLocaleDateString() : "",
        "Rental Days": c.rentalDays,
        "Daily Rate": c.dailyRate,
        "Total Amount": c.totalAmount,
        "Discount": c.discount,
        "Final Amount": c.finalAmount,
        "Status": c.status,
        "Returned At": c.returnedAt ? new Date(c.returnedAt).toLocaleDateString() : "",
        "Pickup KM": c.pickupKm || "",
        "Return KM": c.returnKm || "",
      }));
      const contractsSheet = XLSX.utils.json_to_sheet(contractsData);
      XLSX.utils.book_append_sheet(workbook, contractsSheet, "Contracts");

      // Add Clients sheet
      const clientsData = clients.map(c => ({
        "First Name": c.firstName,
        "Last Name": c.lastName,
        "Nationality": c.nationality || "",
        "Phone": c.phone || "",
        "Email": c.email || "",
        "License Number": c.drivingLicenseNumber,
        "License Expiry": c.licenseExpiryDate ? new Date(c.licenseExpiryDate).toLocaleDateString() : "",
        "Address": c.address || "",
      }));
      const clientsSheet = XLSX.utils.json_to_sheet(clientsData);
      XLSX.utils.book_append_sheet(workbook, clientsSheet, "Clients");

      // Add Maintenance sheet
      const maintenanceData = maintenanceRecords.map(m => ({
        "Vehicle ID": m.vehicleId,
        "Performed At": m.performedAt ? new Date(m.performedAt).toLocaleDateString() : "",
        "Maintenance Type": m.maintenanceType,
        "Description": m.description || "",
        "Cost": m.cost || "",
        "Mileage At Service": m.mileageAtService || "",
        "Performed By": m.performedBy || "",
        "Garage Location": m.garageLocation || "",
        "Garage Entry Date": m.garageEntryDate ? new Date(m.garageEntryDate).toLocaleDateString() : "",
        "Garage Exit Date": m.garageExitDate ? new Date(m.garageExitDate).toLocaleDateString() : "",
      }));
      const maintenanceSheet = XLSX.utils.json_to_sheet(maintenanceData);
      XLSX.utils.book_append_sheet(workbook, maintenanceSheet, "Maintenance");

      // Add Invoices sheet
      const invoicesData = invoices.map(i => ({
        "Invoice Number": i.invoiceNumber,
        "Contract ID": i.contractId,
        "Invoice Date": i.invoiceDate ? new Date(i.invoiceDate).toLocaleDateString() : "",
        "Due Date": i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "",
        "Subtotal": i.subtotal,
        "Tax Amount": i.taxAmount,
        "Total Amount": i.totalAmount,
        "Payment Status": i.paymentStatus,
        "Payment Method": i.paymentMethod || "",
        "Paid At": i.paidAt ? new Date(i.paidAt).toLocaleDateString() : "",
      }));
      const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
      XLSX.utils.book_append_sheet(workbook, invoicesSheet, "Invoices");

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CarRentalData_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto whitespace-nowrap"
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export to Excel"}
    </Button>
  );
}

function InsuranceAlertWidget({ filterUserId }: { filterUserId: number | null }) {
  const { data: expiredVehicles, isLoading: loadingExpired } = trpc.fleet.getExpiredInsurance.useQuery(undefined, {
    enabled: !filterUserId, // Only load for own data
  });
  const { data: expiringVehicles, isLoading: loadingExpiring } = trpc.fleet.getExpiringInsurance.useQuery(
    { daysThreshold: 30 },
    { enabled: !filterUserId }
  );
  
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  
  if (loadingExpired || loadingExpiring) return null;
  
  const expired = expiredVehicles || [];
  const expiring = expiringVehicles || [];
  const totalIssues = expired.length + expiring.length;
  
  if (totalIssues === 0) return null;
  
  const handleRenewClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsRenewalDialogOpen(true);
  };
  
  return (
    <>
      <Card className="bg-orange-50 border-orange-200 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-orange-900">Insurance Expiry Alert</CardTitle>
            </div>
            <Link href="/fleet-management">
              <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                View Fleet
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-white rounded-lg border border-orange-200">
              <div className="text-3xl font-bold text-red-600">{expired.length}</div>
              <div className="text-sm text-red-700 mt-1">Expired Policies</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-orange-200">
              <div className="text-3xl font-bold text-yellow-600">{expiring.length}</div>
              <div className="text-sm text-yellow-700 mt-1">Expiring Soon (30d)</div>
            </div>
          </div>
          
          {expired.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-red-900 mb-2">Expired Insurance:</h4>
              <div className="space-y-2">
                {expired.slice(0, 3).map((vehicle: any) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-red-900">{vehicle.plateNumber} - {vehicle.brand} {vehicle.model}</div>
                      <div className="text-xs text-red-700">Expired: {new Date(vehicle.insuranceExpiryDate).toLocaleDateString()}</div>
                    </div>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => handleRenewClick(vehicle)}>
                      Renew Now
                    </Button>
                  </div>
                ))}
                {expired.length > 3 && (
                  <p className="text-xs text-red-700 text-center">+{expired.length - 3} more expired</p>
                )}
              </div>
            </div>
          )}
          
          {expiring.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">Expiring Soon:</h4>
              <div className="space-y-2">
                {expiring.slice(0, 3).map((vehicle: any) => {
                  const daysLeft = Math.ceil((new Date(vehicle.insuranceExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={vehicle.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-yellow-900">{vehicle.plateNumber} - {vehicle.brand} {vehicle.model}</div>
                        <div className="text-xs text-yellow-700">{daysLeft} days remaining</div>
                      </div>
                      <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700" onClick={() => handleRenewClick(vehicle)}>
                        Renew
                      </Button>
                    </div>
                  );
                })}
                {expiring.length > 3 && (
                  <p className="text-xs text-yellow-700 text-center">+{expiring.length - 3} more expiring</p>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-orange-100 rounded-lg flex items-start gap-2">
            <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-800">
              <strong>Action Required:</strong> {totalIssues} vehicle{totalIssues > 1 ? 's' : ''} {totalIssues > 1 ? 'need' : 'needs'} insurance renewal. Renew policies to maintain legal compliance and coverage.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {selectedVehicle && (
        <InsuranceRenewalDialog
          vehicle={selectedVehicle}
          open={isRenewalDialogOpen}
          onOpenChange={setIsRenewalDialogOpen}
        />
      )}
    </>
  );
}

function ContractExpiryWidget({ filterUserId }: { filterUserId: number | null }) {
  const { data: expiringContracts, isLoading } = trpc.contracts.getExpiring.useQuery(
    { daysAhead: 3, filterUserId: filterUserId || undefined },
    { enabled: true }
  );
  
  if (isLoading || !expiringContracts || expiringContracts.length === 0) return null;
  
  const getDaysRemaining = (endDate: Date | string) => {
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining <= 1) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', badge: 'bg-red-100 text-red-800' };
    if (daysRemaining <= 2) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-100 text-orange-800' };
    return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', badge: 'bg-yellow-100 text-yellow-800' };
  };
  
  return (
    <Card className="bg-blue-50 border-blue-200 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-blue-900">Contracts Expiring Soon</CardTitle>
          </div>
          <Link href="/rental-contracts">
            <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {expiringContracts.map((contract: any) => {
            const daysRemaining = getDaysRemaining(contract.rentalEndDate);
            const colors = getUrgencyColor(daysRemaining);
            return (
              <div key={contract.id} className={`flex items-center justify-between p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold ${colors.text}">{contract.contractNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                      {daysRemaining === 0 ? 'Expires Today' : daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
                    </span>
                  </div>
                  <div className="text-sm ${colors.text}">
                    Client: {contract.clientFirstName} {contract.clientLastName}
                  </div>
                  <div className="text-xs text-gray-600">
                    End Date: {new Date(contract.rentalEndDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/rental-contracts?contract=${contract.id}`}>
                    <Button size="sm" variant="outline" className={`border-${daysRemaining <= 1 ? 'red' : daysRemaining <= 2 ? 'orange' : 'yellow'}-300`}>
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>Reminder:</strong> {expiringContracts.length} contract{expiringContracts.length > 1 ? 's' : ''} expiring within 3 days. Contact clients to arrange returns or extensions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function OverdueWidget({ filterUserId }: { filterUserId: number | null }) {
  const { data: stats, isLoading } = trpc.contracts.getOverdueStatistics.useQuery({ filterUserId: filterUserId || undefined });
  
  if (isLoading || !stats || stats.count === 0) return null;
  
  return (
    <Card className="bg-red-50 border-red-200 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-red-900">Overdue Contracts Alert</CardTitle>
          </div>
          <Link href="/rental-contracts">
            <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-red-200">
            <div className="text-3xl font-bold text-red-600">{stats.count}</div>
            <div className="text-sm text-red-700 mt-1">Overdue Contracts</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-red-200">
            <div className="text-3xl font-bold text-red-600">${stats.totalLateFees}</div>
            <div className="text-sm text-red-700 mt-1">Total Late Fees</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-red-200">
            <div className="text-3xl font-bold text-red-600">{stats.avgDaysOverdue}</div>
            <div className="text-sm text-red-700 mt-1">Avg Days Overdue</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-red-100 rounded-lg flex items-start gap-2">
          <Clock className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">
            <strong>Action Required:</strong> {stats.count} contract{stats.count > 1 ? 's' : ''} {stats.count > 1 ? 'are' : 'is'} overdue. Contact clients immediately to arrange returns and collect late fees.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // Widget visibility state
  const [widgetVisibility, setWidgetVisibility] = useState({
    totalFleet: true,
    totalRevenue: true,
    inMaintenance: true,
    expiringDocs: true,
    overdueAlert: true,
    contractExpiryAlert: true,
    insuranceAlert: true,
    fleetStatus: true,
    fleetComposition: true,
  });

  const toggleWidget = (widgetId: keyof typeof widgetVisibility) => {
    setWidgetVisibility(prev => ({ ...prev, [widgetId]: !prev[widgetId] }));
  };
  const { selectedUserId, setSelectedUserId, isSuperAdmin } = useUserFilter();
  const utils = trpc.useUtils();
  const { data: allUsers } = trpc.admin.listUsers.useQuery(undefined, { enabled: isSuperAdmin });
  const { data: vehicles, isLoading } = trpc.fleet.list.useQuery({ filterUserId: selectedUserId || undefined });
  const { data: contractStats } = trpc.contracts.getDashboardStatistics.useQuery({ filterUserId: selectedUserId || undefined });

  // Invalidate all queries when selectedUserId changes to force refetch with new filter
  useEffect(() => {
    if (isSuperAdmin) {
      utils.fleet.list.invalidate();
      utils.contracts.getDashboardStatistics.invalidate();
      utils.contracts.getOverdueStatistics.invalidate();
    }
  }, [selectedUserId, isSuperAdmin, utils]);

  // Calculate metrics from real data
  const totalFleet = vehicles?.length || 0;
  const inMaintenance = vehicles?.filter(v => v.status === "Maintenance").length || 0;
  const expiringDocs = vehicles?.filter(v => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return (
      (v.insuranceExpiryDate && new Date(v.insuranceExpiryDate) <= thirtyDaysFromNow) ||
      (v.registrationExpiryDate && new Date(v.registrationExpiryDate) <= thirtyDaysFromNow)
    );
  }).length || 0;

  // Use actual revenue from contracts
  const actualRevenue = contractStats?.totalRevenue || 0;
  const revenueThisMonth = contractStats?.revenueThisMonth || 0;

  // Fleet status counts
  const available = vehicles?.filter(v => v.status === "Available").length || 0;
  const rented = vehicles?.filter(v => v.status === "Rented").length || 0;
  const maintenance = vehicles?.filter(v => v.status === "Maintenance").length || 0;

  // Fleet composition by category
  const categories = vehicles?.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const maxCategoryCount = Math.max(...Object.values(categories), 1);



  return (
    <SidebarLayout>
      <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 mb-2">Dashboard Overview</h2>
              <p className="text-base sm:text-lg text-gray-600">Welcome back. Here's what's happening today.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Settings and Admin Controls Group */}
              <div className="flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="whitespace-nowrap">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Customize
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dashboard Widgets</DialogTitle>
                    <DialogDescription>
                      Toggle widgets on or off to customize your dashboard view
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="totalFleet" className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Total Fleet
                      </Label>
                      <Switch
                        id="totalFleet"
                        checked={widgetVisibility.totalFleet}
                        onCheckedChange={() => toggleWidget('totalFleet')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="totalRevenue" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Revenue
                      </Label>
                      <Switch
                        id="totalRevenue"
                        checked={widgetVisibility.totalRevenue}
                        onCheckedChange={() => toggleWidget('totalRevenue')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="inMaintenance" className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        In Maintenance
                      </Label>
                      <Switch
                        id="inMaintenance"
                        checked={widgetVisibility.inMaintenance}
                        onCheckedChange={() => toggleWidget('inMaintenance')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="expiringDocs" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Expiring Documents
                      </Label>
                      <Switch
                        id="expiringDocs"
                        checked={widgetVisibility.expiringDocs}
                        onCheckedChange={() => toggleWidget('expiringDocs')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="overdueAlert" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Overdue Contracts Alert
                      </Label>
                      <Switch
                        id="overdueAlert"
                        checked={widgetVisibility.overdueAlert}
                        onCheckedChange={() => toggleWidget('overdueAlert')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="contractExpiryAlert" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Contract Expiry Alert
                      </Label>
                      <Switch
                        id="contractExpiryAlert"
                        checked={widgetVisibility.contractExpiryAlert}
                        onCheckedChange={() => toggleWidget('contractExpiryAlert')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="insuranceAlert" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Insurance Expiry Alert
                      </Label>
                      <Switch
                        id="insuranceAlert"
                        checked={widgetVisibility.insuranceAlert}
                        onCheckedChange={() => toggleWidget('insuranceAlert')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fleetStatus" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Fleet Status Chart
                      </Label>
                      <Switch
                        id="fleetStatus"
                        checked={widgetVisibility.fleetStatus}
                        onCheckedChange={() => toggleWidget('fleetStatus')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fleetComposition" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Fleet Composition
                      </Label>
                      <Switch
                        id="fleetComposition"
                        checked={widgetVisibility.fleetComposition}
                        onCheckedChange={() => toggleWidget('fleetComposition')}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
                {isSuperAdmin && allUsers && allUsers.length > 0 && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <Select
                      value={selectedUserId === null ? "all" : selectedUserId.toString()}
                      onValueChange={(value) => setSelectedUserId(value === "all" ? null : parseInt(value, 10))}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {allUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.name || u.username || u.email || `User ${u.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* Action Buttons Group */}
              <div className="flex flex-wrap gap-2">
                <ExportToExcelButton />
                {user?.role === "super_admin" && (
                  <Link href="/admin/users" className="w-full sm:w-auto">
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white w-full sm:w-auto whitespace-nowrap">
                      <Crown className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Overdue Contracts Alert Widget */}
          {widgetVisibility.overdueAlert && <OverdueWidget filterUserId={selectedUserId} />}

          {/* Contract Expiry Alert Widget */}
          {widgetVisibility.contractExpiryAlert && <ContractExpiryWidget filterUserId={selectedUserId} />}

          {/* Insurance Expiry Alert Widget */}
          {widgetVisibility.insuranceAlert && <InsuranceAlertWidget filterUserId={selectedUserId} />}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {widgetVisibility.totalFleet && (
            <Card className="bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Fleet</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Car className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalFleet}</div>
              </CardContent>
            </Card>
            )}

            {widgetVisibility.totalRevenue && (

            <Card className="bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">${actualRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">This month: ${revenueThisMonth.toFixed(2)}</p>
              </CardContent>
            </Card>
            )}

            {widgetVisibility.inMaintenance && (

            <Card className="bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Maintenance</CardTitle>
                <div className="p-2 bg-red-100 rounded-lg">
                  <Wrench className="h-5 w-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{inMaintenance}</div>
              </CardContent>
            </Card>
            )}

            {widgetVisibility.expiringDocs && (

            <Card className="bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Docs</CardTitle>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{expiringDocs}</div>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fleet Status */}
            {widgetVisibility.fleetStatus && (
            <Card className="bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Fleet Status</CardTitle>
                <p className="text-sm text-muted-foreground">Current availability of vehicles</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-6">
                  {/* Simple donut chart representation */}
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {/* Available (green) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeDasharray={`${(available / totalFleet) * 251.2} 251.2`}
                        strokeDashoffset="0"
                      />
                      {/* Rented (blue) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray={`${(rented / totalFleet) * 251.2} 251.2`}
                        strokeDashoffset={`-${(available / totalFleet) * 251.2}`}
                      />
                      {/* Maintenance (red) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray={`${(maintenance / totalFleet) * 251.2} 251.2`}
                        strokeDashoffset={`-${((available + rented) / totalFleet) * 251.2}`}
                      />
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Rented</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Maintenance</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Fleet Composition */}
            {widgetVisibility.fleetComposition && (
            <Card className="bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Fleet Composition</CardTitle>
                <p className="text-sm text-muted-foreground">Distribution by vehicle category</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categories).map(([category, count]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{category}</span>
                        <span className="font-medium text-foreground">{count}</span>
                      </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                          <div
                            className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(categories).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No vehicles in fleet yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
            )}
          </div>
      </div>
    </SidebarLayout>
  );
}
