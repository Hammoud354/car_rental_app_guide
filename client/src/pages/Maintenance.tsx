import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Wrench, MapPin, Gauge, DollarSign, Car, Edit, Trash2, CheckCircle, Calendar, Search, AlertTriangle, Clock, ChevronRight, Activity } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ModernDatePicker } from "@/components/ModernDatePicker";
import { useTranslation } from "react-i18next";

const MAINTENANCE_TYPES = ["Routine", "Repair", "Inspection", "Emergency", "Oil Change", "Brake Pads Change", "Oil + Filter"] as const;

function getTypeStyle(type: string) {
  const styles: Record<string, { bg: string; text: string; dot: string }> = {
    "Routine": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    "Repair": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    "Inspection": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    "Emergency": { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
    "Oil Change": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    "Brake Pads Change": { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
    "Oil + Filter": { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  };
  return styles[type] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
}

function getStatusStyle(status: string) {
  if (status === "Maintenance") return { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", dot: "bg-orange-500" };
  if (status === "Out of Service") return { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500" };
  return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" };
}

export default function Maintenance() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [viewingHistory, setViewingHistory] = useState<number | null>(null);
  const [autoFilledKm, setAutoFilledKm] = useState<number | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [performedAtDate, setPerformedAtDate] = useState<Date>();
  const [garageEntryDate, setGarageEntryDate] = useState<Date>();
  const [garageExitDate, setGarageExitDate] = useState<Date>();
  const [editPerformedAtDate, setEditPerformedAtDate] = useState<Date>();
  const [editGarageEntryDate, setEditGarageEntryDate] = useState<Date>();
  const [editGarageExitDate, setEditGarageExitDate] = useState<Date>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [markInMaintenance, setMarkInMaintenance] = useState(true);

  const { data: vehicles } = trpc.fleet.listAvailableForMaintenance.useQuery();
  const { data: maintenanceRecords, refetch: refetchRecords } = trpc.fleet.getMaintenanceRecords.useQuery(
    { vehicleId: viewingHistory || 0 },
    { enabled: viewingHistory !== null }
  );
  
  const { data: lastReturnKm } = trpc.fleet.getLastReturnKm.useQuery(
    { vehicleId: selectedVehicleId || 0 },
    { enabled: selectedVehicleId !== null }
  );
  
  useEffect(() => {
    setAutoFilledKm(lastReturnKm || null);
  }, [lastReturnKm]);

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter(v => {
      const matchesSearch = searchQuery === "" || 
        v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${v.brand} ${v.model}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const summaryStats = useMemo(() => {
    if (!vehicles) return { total: 0, inMaintenance: 0, available: 0, totalCost: 0 };
    const inMaintenance = vehicles.filter(v => v.status === "Maintenance").length;
    const totalCost = vehicles.reduce((sum, v) => sum + (parseFloat((v as any).totalMaintenanceCost || "0")), 0);
    return { total: vehicles.length, inMaintenance, available: vehicles.length - inMaintenance, totalCost };
  }, [vehicles]);

  const addMaintenanceMutation = trpc.fleet.addMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast.success("Maintenance record added successfully");
      refetchRecords();
      utils.fleet.listAvailableForMaintenance.invalidate();
      setIsAddDialogOpen(false);
      setSelectedVehicleId(null);
      setPerformedAtDate(undefined);
      setGarageEntryDate(undefined);
      setGarageExitDate(undefined);
      setMarkInMaintenance(true);
    },
    onError: (error) => {
      toast.error(`Failed to add maintenance record: ${error.message}`);
    },
  });

  const updateMaintenanceMutation = trpc.fleet.updateMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast.success("Maintenance record updated");
      refetchRecords();
      setEditingRecordId(null);
      setEditFormData({});
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const sendToMaintenanceMutation = trpc.fleet.sendToMaintenance.useMutation({
    onSuccess: () => {
      toast.success("Vehicle sent to maintenance — blocked from rentals");
      utils.fleet.listAvailableForMaintenance.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send vehicle to maintenance");
    },
  });

  const removeFromMaintenanceMutation = trpc.fleet.removeFromMaintenance.useMutation({
    onSuccess: () => {
      toast.success("Vehicle marked as Available");
      utils.fleet.listAvailableForMaintenance.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove vehicle from maintenance");
    },
  });

  const deleteMaintenanceMutation = trpc.fleet.deleteMaintenanceRecord.useMutation({
    onSuccess: () => {
      toast.success("Record deleted");
      refetchRecords();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleEditRecord = (record: any) => {
    setEditingRecordId(record.id);
    setEditFormData({
      maintenanceType: record.maintenanceType,
      description: record.description,
      cost: record.cost || "",
      performedAt: new Date(record.performedAt).toISOString().split('T')[0],
      performedBy: record.performedBy || "",
      garageLocation: record.garageLocation || "",
      mileageAtService: record.mileageAtService || "",
      kmDueMaintenance: record.kmDueMaintenance || "",
      garageEntryDate: record.garageEntryDate ? new Date(record.garageEntryDate).toISOString().split('T')[0] : "",
      garageExitDate: record.garageExitDate ? new Date(record.garageExitDate).toISOString().split('T')[0] : "",
    });
    setEditPerformedAtDate(new Date(record.performedAt));
    setEditGarageEntryDate(record.garageEntryDate ? new Date(record.garageEntryDate) : undefined);
    setEditGarageExitDate(record.garageExitDate ? new Date(record.garageExitDate) : undefined);
  };

  const handleSaveEdit = () => {
    if (!editingRecordId) return;
    updateMaintenanceMutation.mutate({
      id: editingRecordId,
      maintenanceType: editFormData.maintenanceType,
      description: editFormData.description,
      cost: editFormData.cost || undefined,
      performedAt: editPerformedAtDate || new Date(editFormData.performedAt),
      performedBy: editFormData.performedBy || undefined,
      garageLocation: editFormData.garageLocation || undefined,
      mileageAtService: editFormData.mileageAtService ? parseInt(editFormData.mileageAtService) : undefined,
      garageEntryDate: editGarageEntryDate || undefined,
      garageExitDate: editGarageExitDate || undefined,
    });
  };

  const handleDeleteRecord = (recordId: number) => {
    if (confirm("Are you sure you want to delete this maintenance record?")) {
      deleteMaintenanceMutation.mutate({ id: recordId });
    }
  };

  const handleAddMaintenance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedVehicleId) {
      toast.error(t("maintenance.selectVehicleError"));
      return;
    }
    if (!performedAtDate) {
      toast.error("Please select a date performed");
      return;
    }

    const cost = formData.get("cost") as string;
    const mileageAtService = formData.get("mileageAtService") as string;
    const kmDueMaintenance = formData.get("kmDueMaintenance") as string;

    addMaintenanceMutation.mutate({
      vehicleId: selectedVehicleId,
      maintenanceType: formData.get("maintenanceType") as any,
      description: formData.get("description") as string,
      cost: cost && cost.trim() ? parseFloat(cost).toString() : undefined,
      performedAt: performedAtDate,
      performedBy: (formData.get("performedBy") as string) || undefined,
      garageLocation: (formData.get("garageLocation") as string) || undefined,
      mileageAtService: mileageAtService && mileageAtService.trim() ? parseInt(mileageAtService) : undefined,
      kmDueMaintenance: kmDueMaintenance && kmDueMaintenance.trim() ? parseInt(kmDueMaintenance) : undefined,
      garageEntryDate: garageEntryDate || undefined,
      garageExitDate: garageExitDate || undefined,
      markInMaintenance,
    });
  };

  const viewingVehicle = vehicles?.find(v => v.id === viewingHistory);

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("nav.maintenance")}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t("maintenance.subtitle")}</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setSelectedVehicleId(null);
                setPerformedAtDate(undefined);
                setGarageEntryDate(undefined);
                setGarageExitDate(undefined);
                setMarkInMaintenance(true);
              }
            }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm" size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">New Maintenance Record</DialogTitle>
                <DialogDescription>Record maintenance work performed on a vehicle.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMaintenance} className="space-y-4 mt-2">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Vehicle *</Label>
                  <Select
                    value={selectedVehicleId?.toString() || ""}
                    onValueChange={(value) => setSelectedVehicleId(parseInt(value))}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.plateNumber} — {vehicle.brand} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Type *</Label>
                    <Select name="maintenanceType" required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {MAINTENANCE_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Date Performed *</Label>
                    <div className="mt-1">
                      <ModernDatePicker date={performedAtDate} onDateChange={setPerformedAtDate} placeholder="Select date" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700">Description *</Label>
                  <Textarea name="description" rows={2} required placeholder="Describe the work performed..." className="mt-1 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Garage / Location</Label>
                    <Input name="garageLocation" placeholder="e.g., Downtown Auto" className="mt-1 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Performed By</Label>
                    <Input name="performedBy" placeholder="Technician name" className="mt-1 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Garage Entry</Label>
                    <div className="mt-1">
                      <ModernDatePicker date={garageEntryDate} onDateChange={setGarageEntryDate} placeholder="Entry date" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Garage Exit</Label>
                    <div className="mt-1">
                      <ModernDatePicker date={garageExitDate} onDateChange={setGarageExitDate} placeholder="Exit date" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">
                      KM Reading
                      {autoFilledKm && <span className="text-[10px] text-gray-400 ml-1">(auto)</span>}
                    </Label>
                    <Input
                      name="mileageAtService"
                      type="number"
                      min="0"
                      placeholder="45000"
                      defaultValue={autoFilledKm || undefined}
                      key={autoFilledKm || 'empty'}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Cost ($)</Label>
                    <Input name="cost" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Next Service KM</Label>
                    <Input name="kmDueMaintenance" type="number" min="0" placeholder="50000" className="mt-1 text-sm" />
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markInMaintenance}
                      onChange={(e) => setMarkInMaintenance(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-orange-800">Vehicle is in the garage</span>
                      <p className="text-xs text-orange-600 mt-0.5">
                        Block this vehicle from being rented until maintenance is complete
                      </p>
                    </div>
                  </label>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={addMaintenanceMutation.isPending}>
                    {addMaintenanceMutation.isPending ? "Adding..." : "Add Record"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Vehicles", value: summaryStats.total, icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "In Maintenance", value: summaryStats.inMaintenance, icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Available", value: summaryStats.available, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Total Cost", value: `$${summaryStats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-violet-600", bg: "bg-violet-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by plate, brand, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Maintenance">In Maintenance</SelectItem>
              <SelectItem value="Rented">Rented</SelectItem>
              <SelectItem value="Out of Service">Out of Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Grid */}
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Car className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No vehicles found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => {
              const statusStyle = getStatusStyle(vehicle.status);
              const totalCost = parseFloat((vehicle as any).totalMaintenanceCost || "0");
              
              return (
                <div key={vehicle.id} className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-base font-bold text-gray-900 truncate">{vehicle.plateNumber}</h3>
                        </div>
                        <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {vehicle.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5" />
                        {(vehicle.mileage || 0).toLocaleString()} km
                      </span>
                      {totalCost > 0 && (
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <DollarSign className="h-3.5 w-3.5" />
                          ${totalCost.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => setViewingHistory(vehicle.id)}
                      >
                        <Wrench className="mr-1 h-3.5 w-3.5" />
                        History
                      </Button>
                      {vehicle.status === "Maintenance" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            if (confirm(`Mark ${vehicle.plateNumber} as Available?`)) {
                              removeFromMaintenanceMutation.mutate({ vehicleId: vehicle.id });
                            }
                          }}
                          disabled={removeFromMaintenanceMutation.isPending}
                        >
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          {removeFromMaintenanceMutation.isPending ? "..." : "Mark Available"}
                        </Button>
                      ) : vehicle.status === "Available" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8 border-orange-200 text-orange-700 hover:bg-orange-50"
                          onClick={() => {
                            setSelectedVehicleId(vehicle.id);
                            setMarkInMaintenance(true);
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                          Send to Garage
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Record Dialog */}
        {editingRecordId && (
          <Dialog open={editingRecordId !== null} onOpenChange={() => { setEditingRecordId(null); setEditFormData({}); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Edit Maintenance Record</DialogTitle>
                <DialogDescription>Update the record details below.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Type *</Label>
                    <Select value={editFormData.maintenanceType} onValueChange={(v) => setEditFormData({...editFormData, maintenanceType: v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MAINTENANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Date Performed *</Label>
                    <div className="mt-1">
                      <ModernDatePicker date={editPerformedAtDate} onDateChange={setEditPerformedAtDate} placeholder="Select date" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700">Description *</Label>
                  <Textarea
                    rows={2}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    placeholder="Describe the work performed..."
                    className="mt-1 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Garage / Location</Label>
                    <Input
                      value={editFormData.garageLocation}
                      onChange={(e) => setEditFormData({...editFormData, garageLocation: e.target.value})}
                      placeholder="Downtown Auto Center"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Performed By</Label>
                    <Input
                      value={editFormData.performedBy}
                      onChange={(e) => setEditFormData({...editFormData, performedBy: e.target.value})}
                      placeholder="Technician name"
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Garage Entry</Label>
                    <div className="mt-1">
                      <ModernDatePicker date={editGarageEntryDate} onDateChange={setEditGarageEntryDate} placeholder="Entry date" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Garage Exit</Label>
                    <div className="mt-1">
                      <ModernDatePicker date={editGarageExitDate} onDateChange={setEditGarageExitDate} placeholder="Exit date" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">KM Reading</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editFormData.mileageAtService}
                      onChange={(e) => setEditFormData({...editFormData, mileageAtService: e.target.value})}
                      placeholder="45000"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editFormData.cost}
                      onChange={(e) => setEditFormData({...editFormData, cost: e.target.value})}
                      placeholder="0.00"
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => { setEditingRecordId(null); setEditFormData({}); }}>Cancel</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveEdit} disabled={updateMaintenanceMutation.isPending}>
                  {updateMaintenanceMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* History Dialog */}
        {viewingHistory && (
          <Dialog open={viewingHistory !== null} onOpenChange={() => setViewingHistory(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-gray-400" />
                  {viewingVehicle?.plateNumber} — {viewingVehicle?.brand} {viewingVehicle?.model}
                </DialogTitle>
                <DialogDescription>All maintenance records for this vehicle.</DialogDescription>
              </DialogHeader>

              {maintenanceRecords && maintenanceRecords.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">Total Maintenance Cost</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">
                      ${maintenanceRecords.reduce((sum, r) => sum + (r.cost ? parseFloat(r.cost.toString()) : 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{maintenanceRecords.length} record{maintenanceRecords.length !== 1 ? 's' : ''}</p>
                </div>
              )}

              <div className="space-y-3 mt-2">
                {maintenanceRecords && maintenanceRecords.length > 0 ? (
                  maintenanceRecords.map((record) => {
                    const style = getTypeStyle(record.maintenanceType);
                    return (
                      <div key={record.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {record.maintenanceType}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(record.performedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditRecord(record)} className="h-7 w-7 p-0">
                              <Edit className="h-3.5 w-3.5 text-gray-400" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteRecord(record.id)} className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-800 font-medium mb-3">{record.description}</p>

                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500">
                          {record.garageLocation && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{record.garageLocation}</span>
                          )}
                          {record.mileageAtService && (
                            <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{record.mileageAtService.toLocaleString()} km</span>
                          )}
                          {record.cost && (
                            <span className="flex items-center gap-1 font-medium text-gray-700"><DollarSign className="h-3 w-3" />${record.cost}</span>
                          )}
                          {record.performedBy && (
                            <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{record.performedBy}</span>
                          )}
                          {record.kmDueMaintenance && (
                            <span className="flex items-center gap-1"><Activity className="h-3 w-3" />Next: {record.kmDueMaintenance.toLocaleString()} km</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <Wrench className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">{t("maintenance.noRecordsYet")}</p>
                    <p className="text-xs text-gray-400 mt-1">Add a record using the button above</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
