import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { InsuranceRenewalDialog } from "@/components/InsuranceRenewalDialog";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { ExpiringDocumentsModal } from "@/components/ExpiringDocumentsModal";
import { MaintenanceModal } from "@/components/MaintenanceModal";
import { Car, DollarSign, Wrench, AlertTriangle, Clock, Crown, FileSpreadsheet, TrendingUp, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUserFilter } from "@/contexts/UserFilterContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { generateExcelBuffer, downloadExcel } from "@/lib/excelUtils";

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

      const { vehicles = [], contracts = [], clients = [], maintenanceRecords = [], invoices = [] } = result.data || {};

      const fleetData = (vehicles || []).map(v => ({
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

      const contractsData = (contracts || []).map(c => ({
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

      const clientsData = (clients || []).map(c => ({
        "First Name": c.firstName,
        "Last Name": c.lastName,
        "Nationality": c.nationality || "",
        "Phone": c.phone || "",
        "Email": c.email || "",
        "License Number": c.drivingLicenseNumber,
        "License Expiry": c.licenseExpiryDate ? new Date(c.licenseExpiryDate).toLocaleDateString() : "",
        "Address": c.address || "",
      }));

      const maintenanceData = (maintenanceRecords || []).map(m => ({
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

      const invoicesData = (invoices || []).map(i => ({
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

      const buffer = await generateExcelBuffer([
        { name: "Fleet", type: "json", data: fleetData },
        { name: "Contracts", type: "json", data: contractsData },
        { name: "Clients", type: "json", data: clientsData },
        { name: "Maintenance", type: "json", data: maintenanceData },
        { name: "Invoices", type: "json", data: invoicesData },
      ]);
      downloadExcel(buffer, `CarRentalData_${new Date().toISOString().split("T")[0]}.xlsx`);

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
      variant="outline"
      size="sm"
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export Excel"}
    </Button>
  );
}

function InsuranceAlertWidget({ filterUserId }: { filterUserId: number | null }) {
  const { data: expiredVehicles, isLoading: loadingExpired } = trpc.fleet.getExpiredInsurance.useQuery(undefined, {
    enabled: !filterUserId,
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
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-900">Insurance Alerts</h3>
              <p className="text-xs text-orange-700">{totalIssues} vehicle{totalIssues > 1 ? 's' : ''} need attention</p>
            </div>
            <Link href="/fleet-management">
              <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-900 hover:bg-orange-100">
                View Fleet <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-red-600">{expired.length}</div>
              <div className="text-xs text-red-700">Expired</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-yellow-600">{expiring.length}</div>
              <div className="text-xs text-yellow-700">Expiring (30d)</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {expired.slice(0, 2).map((vehicle: any) => (
              <div key={vehicle.id} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-red-900 truncate">{vehicle.plateNumber} - {vehicle.brand} {vehicle.model}</div>
                  <div className="text-[11px] text-red-700">Expired: {new Date(vehicle.insuranceExpiryDate).toLocaleDateString()}</div>
                </div>
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 text-xs h-7 ml-2" onClick={() => handleRenewClick(vehicle)}>
                  Renew
                </Button>
              </div>
            ))}
            {expiring.slice(0, 2).map((vehicle: any) => {
              const daysLeft = Math.ceil((new Date(vehicle.insuranceExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={vehicle.id} className="flex items-center justify-between p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs text-yellow-900 truncate">{vehicle.plateNumber} - {vehicle.brand} {vehicle.model}</div>
                    <div className="text-[11px] text-yellow-700">{daysLeft} days remaining</div>
                  </div>
                  <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 text-xs h-7 ml-2" onClick={() => handleRenewClick(vehicle)}>
                    Renew
                  </Button>
                </div>
              );
            })}
            {(expired.length + expiring.length) > 4 && (
              <p className="text-xs text-orange-600 text-center pt-1">+{(expired.length + expiring.length) - 4} more vehicles need attention</p>
            )}
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
  
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">Contracts Expiring Soon</h3>
            <p className="text-xs text-blue-700">{expiringContracts.length} contract{expiringContracts.length > 1 ? 's' : ''} within 3 days</p>
          </div>
          <Link href="/rental-contracts">
            <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-900 hover:bg-blue-100">
              View All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="space-y-2">
          {expiringContracts.map((contract: any) => {
            const daysRemaining = getDaysRemaining(contract.rentalEndDate);
            const isUrgent = daysRemaining <= 1;
            return (
              <div key={contract.id} className={`flex items-center justify-between p-2.5 rounded-lg border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-white border-blue-200'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs">{contract.contractNumber}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isUrgent ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {daysRemaining === 0 ? 'Today' : `${daysRemaining}d left`}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 truncate">
                    {contract.clientFirstName} {contract.clientLastName}
                  </div>
                </div>
                <Link href={`/rental-contracts?contract=${contract.id}`}>
                  <Button size="sm" variant="ghost" className="text-xs h-7">View</Button>
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function OverdueWidget({ filterUserId }: { filterUserId: number | null }) {
  const { data: stats, isLoading } = trpc.contracts.getOverdueStatistics.useQuery({ filterUserId: filterUserId || undefined });
  
  if (isLoading || !stats || stats.count === 0) return null;
  
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900">Overdue Contracts</h3>
            <p className="text-xs text-red-700">Action required - contact clients immediately</p>
          </div>
          <Link href="/rental-contracts">
            <Button variant="ghost" size="sm" className="text-red-700 hover:text-red-900 hover:bg-red-100">
              View All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-white rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.count}</div>
            <div className="text-xs text-red-700">Overdue</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">${stats.totalLateFees}</div>
            <div className="text-xs text-red-700">Late Fees</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.avgDaysOverdue}</div>
            <div className="text-xs text-red-700">Avg Days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenanceAlertsWidget() {
  const { data: alertData, isLoading } = trpc.aiMaintenance.getMaintenanceAlerts.useQuery();
  
  if (isLoading || !alertData || alertData.summary.total === 0) return null;

  const levelConfig = {
    critical: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-600", text: "text-red-800", icon: "text-red-600", label: "Critical" },
    attention: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-500", text: "text-amber-800", icon: "text-amber-600", label: "Needs Attention" },
    canwait: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-500", text: "text-blue-800", icon: "text-blue-600", label: "Can Wait" },
  };

  return (
    <Card className="shadow-none border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Wrench className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-900">Maintenance Alerts</h3>
            <p className="text-xs text-orange-700">{alertData.summary.total} item{alertData.summary.total !== 1 ? "s" : ""} requiring attention</p>
          </div>
          <div className="flex gap-2">
            {alertData.summary.critical > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">{alertData.summary.critical} Critical</span>
            )}
            {alertData.summary.attention > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-white bg-amber-500 rounded-full">{alertData.summary.attention} Attention</span>
            )}
            {alertData.summary.canwait > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-white bg-blue-500 rounded-full">{alertData.summary.canwait} Later</span>
            )}
          </div>
          <Link href="/ai-maintenance">
            <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-900 hover:bg-orange-100">
              View All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {alertData.alerts.slice(0, 6).map((alert) => {
            const config = levelConfig[alert.level];
            return (
              <div key={alert.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${config.bg} ${config.border} border`}>
                <AlertTriangle className={`h-4 w-4 shrink-0 ${config.icon}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${config.text}`}>{alert.title}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded ${config.badge}`}>{config.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{alert.vehicleName} ({alert.plateNumber}) - {alert.description}</p>
                </div>
                <Link href="/maintenance">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Wrench className="h-3 w-3 mr-1" /> Fix
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenanceCardWithModal({ maintenanceCount }: { maintenanceCount: number }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-all hover:border-gray-300" 
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">In Maintenance</span>
          <div className="p-2 bg-red-50 rounded-lg">
            <Wrench className="h-4 w-4 text-red-500" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900">{maintenanceCount}</div>
        <p className="text-xs text-gray-400 mt-1">Click to view details</p>
      </div>
      <MaintenanceModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

function ExpiringDocumentsCardWithModal({ expiringDocsCount }: { expiringDocsCount: number }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-all hover:border-gray-300" 
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiring Docs</span>
          <div className="p-2 bg-amber-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900">{expiringDocsCount}</div>
        <p className="text-xs text-gray-400 mt-1">Click to view details</p>
      </div>
      <ExpiringDocumentsModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  
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
  const { data: companyProfile } = trpc.company.getProfile.useQuery();
  const selectPlanMutation = trpc.subscription.selectPlan.useMutation();

  useEffect(() => {
    const selectedPlanId = localStorage.getItem('selectedSubscriptionPlanId');
    if (selectedPlanId && user) {
      const planId = parseInt(selectedPlanId, 10);
      selectPlanMutation.mutate({ tierId: planId }, {
        onSuccess: () => {
          localStorage.removeItem('selectedSubscriptionPlanId');
          utils.subscription.getCurrentPlan.invalidate();
        },
        onError: (error) => {
          console.error('Failed to activate subscription plan:', error);
        },
      });
    }
  }, [user]);

  useEffect(() => {
    if (isSuperAdmin) {
      utils.fleet.list.invalidate();
      utils.contracts.getDashboardStatistics.invalidate();
      utils.contracts.getOverdueStatistics.invalidate();
    }
  }, [selectedUserId, isSuperAdmin, utils]);

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

  const actualRevenue = contractStats?.totalRevenue || 0;
  const revenueThisMonth = contractStats?.revenueThisMonth || 0;

  const available = vehicles?.filter(v => v.status === "Available").length || 0;
  const rented = vehicles?.filter(v => v.status === "Rented").length || 0;
  const maintenance = vehicles?.filter(v => v.status === "Maintenance").length || 0;

  const categories = vehicles?.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const maxCategoryCount = Math.max(...Object.values(categories), 1);

  const categoryColors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back{user?.name ? `, ${user.name}` : ''}. Here's your fleet overview.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdmin && allUsers && allUsers.length > 0 && (
            <Select
              value={selectedUserId === null ? "all" : selectedUserId.toString()}
              onValueChange={(value) => setSelectedUserId(value === "all" ? null : parseInt(value, 10))}
            >
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <Users className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {allUsers && Array.isArray(allUsers) && allUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name || u.username || u.email || `User ${u.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <SettingsIcon className="mr-1.5 h-3.5 w-3.5" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dashboard Widgets</DialogTitle>
                <DialogDescription>Toggle widgets to customize your dashboard view</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {[
                  { id: 'totalFleet' as const, icon: Car, label: 'Total Fleet' },
                  { id: 'totalRevenue' as const, icon: DollarSign, label: 'Total Revenue' },
                  { id: 'inMaintenance' as const, icon: Wrench, label: 'In Maintenance' },
                  { id: 'expiringDocs' as const, icon: AlertTriangle, label: 'Expiring Documents' },
                  { id: 'overdueAlert' as const, icon: Clock, label: 'Overdue Contracts Alert' },
                  { id: 'contractExpiryAlert' as const, icon: Clock, label: 'Contract Expiry Alert' },
                  { id: 'insuranceAlert' as const, icon: AlertTriangle, label: 'Insurance Expiry Alert' },
                  { id: 'fleetStatus' as const, icon: Eye, label: 'Fleet Status Chart' },
                  { id: 'fleetComposition' as const, icon: Eye, label: 'Fleet Composition' },
                ].map(({ id, icon: Icon, label }) => (
                  <div key={id} className="flex items-center justify-between">
                    <Label htmlFor={id} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                    <Switch id={id} checked={widgetVisibility[id]} onCheckedChange={() => toggleWidget(id)} />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <ExportToExcelButton />

          {user?.role === "super_admin" && (
            <Link href="/admin/users">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <Crown className="mr-1.5 h-3.5 w-3.5" />
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!selectedUserId && <SubscriptionStatusCard />}

      {widgetVisibility.overdueAlert && <OverdueWidget filterUserId={selectedUserId} />}
      {widgetVisibility.contractExpiryAlert && <ContractExpiryWidget filterUserId={selectedUserId} />}
      {widgetVisibility.insuranceAlert && <InsuranceAlertWidget filterUserId={selectedUserId} />}

      <MaintenanceAlertsWidget />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {widgetVisibility.totalFleet && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Fleet</span>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Car className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalFleet}</div>
            <p className="text-xs text-gray-400 mt-1">{available} available</p>
          </div>
        )}

        {widgetVisibility.totalRevenue && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Revenue</span>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">${actualRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-1">This month: ${revenueThisMonth.toFixed(2)}</p>
          </div>
        )}

        {widgetVisibility.inMaintenance && (
          <MaintenanceCardWithModal maintenanceCount={inMaintenance} />
        )}

        {widgetVisibility.expiringDocs && (
          <ExpiringDocumentsCardWithModal expiringDocsCount={expiringDocs} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {widgetVisibility.fleetStatus && (
          <Card className="shadow-none border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Fleet Status</CardTitle>
              <p className="text-xs text-gray-500">Current availability of vehicles</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-5">
                <div className="relative w-40 h-40">
                  {totalFleet > 0 ? (
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="18"
                        strokeDasharray={`${(available / totalFleet) * 251.2} 251.2`} strokeDashoffset="0" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="18"
                        strokeDasharray={`${(rented / totalFleet) * 251.2} 251.2`}
                        strokeDashoffset={`-${(available / totalFleet) * 251.2}`} />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="18"
                        strokeDasharray={`${(maintenance / totalFleet) * 251.2} 251.2`}
                        strokeDashoffset={`-${((available + rented) / totalFleet) * 251.2}`} />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="18" />
                    </svg>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-gray-900">{totalFleet}</span>
                      <span className="block text-[10px] text-gray-500">Total</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Available ({available})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Rented ({rented})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Maintenance ({maintenance})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {widgetVisibility.fleetComposition && (
          <Card className="shadow-none border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Fleet Composition</CardTitle>
              <p className="text-xs text-gray-500">Distribution by vehicle category</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(categories).map(([category, count], i) => (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{category}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${categoryColors[i % categoryColors.length]} h-2 rounded-full transition-all`}
                        style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {Object.keys(categories).length === 0 && (
                  <div className="text-center py-8">
                    <Car className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No vehicles in fleet yet</p>
                    <Link href="/fleet-management">
                      <Button variant="outline" size="sm" className="mt-3">Add Your First Vehicle</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
