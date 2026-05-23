import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Phone, Mail, MapPin, Star, Search, Plus, Edit, Trash2,
  ExternalLink, MessageCircle, X, Wrench, DollarSign,
  Eye, FileDown, Users, CheckCircle, Filter,
} from "lucide-react";
import { format } from "date-fns";

type GarageStatus = "Active" | "Inactive";

interface GarageForm {
  garageName: string;
  contactPerson: string;
  phoneNumber: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  servicesOffered: string;
  notes: string;
  status: GarageStatus;
  googleMapsLink: string;
  vatNumber: string;
  paymentTerms: string;
  isPreferred: boolean;
}

const EMPTY_FORM: GarageForm = {
  garageName: "",
  contactPerson: "",
  phoneNumber: "",
  whatsappNumber: "",
  email: "",
  address: "",
  city: "",
  servicesOffered: "",
  notes: "",
  status: "Active",
  googleMapsLink: "",
  vatNumber: "",
  paymentTerms: "",
  isPreferred: false,
};

function ModalOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>,
    document.body
  );
}

function GarageFormModal({
  open,
  onClose,
  title,
  form,
  setForm,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  form: GarageForm;
  setForm: (f: GarageForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const set = (key: keyof GarageForm) => (val: string | boolean) =>
    setForm({ ...form, [key]: val });

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-800 to-blue-700 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10">
              <Building2 className="h-5 w-5 text-white" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="text-xs text-blue-200">Fill in the garage details below</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Basic Info */}
          <div className="rounded-xl border border-gray-200 p-4 bg-white">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-gray-600">Garage Name *</Label>
                <Input value={form.garageName} onChange={e => set("garageName")(e.target.value)} placeholder="e.g., Downtown Auto Center" className="mt-1 h-9 text-sm input-client" />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Contact Person</Label>
                <Input value={form.contactPerson} onChange={e => set("contactPerson")(e.target.value)} placeholder="e.g., Ahmad Hassan" className="mt-1 h-9 text-sm input-client" />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Email</Label>
                <Input type="email" value={form.email} onChange={e => set("email")(e.target.value)} placeholder="garage@example.com" className="mt-1 h-9 text-sm input-client" />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-gray-200 p-4 bg-white">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">Phone Number</Label>
                <Input value={form.phoneNumber} onChange={e => set("phoneNumber")(e.target.value)} placeholder="+961 1 234 567" className="mt-1 h-9 text-sm input-client" />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">WhatsApp Number</Label>
                <Input value={form.whatsappNumber} onChange={e => set("whatsappNumber")(e.target.value)} placeholder="+961 70 123 456" className="mt-1 h-9 text-sm input-client" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-gray-600">Google Maps Link</Label>
                <Input value={form.googleMapsLink} onChange={e => set("googleMapsLink")(e.target.value)} placeholder="https://maps.google.com/..." className="mt-1 h-9 text-sm input-client" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-xl border border-gray-200 p-4 bg-white">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-gray-600">Address</Label>
                <Input value={form.address} onChange={e => set("address")(e.target.value)} placeholder="Street, Building, Area" className="mt-1 h-9 text-sm input-client" />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">City</Label>
                <Input value={form.city} onChange={e => set("city")(e.target.value)} placeholder="e.g., Beirut" className="mt-1 h-9 text-sm input-client" />
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="rounded-xl border border-gray-200 p-4 bg-white">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Business Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">VAT Number</Label>
                <Input value={form.vatNumber} onChange={e => set("vatNumber")(e.target.value)} placeholder="VAT-123456" className="mt-1 h-9 text-sm input-client" />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Payment Terms</Label>
                <Input value={form.paymentTerms} onChange={e => set("paymentTerms")(e.target.value)} placeholder="e.g., Net 30 days" className="mt-1 h-9 text-sm input-client" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-gray-600">Services Offered</Label>
                <Textarea value={form.servicesOffered} onChange={e => set("servicesOffered")(e.target.value)} rows={2} placeholder="e.g., Oil change, Brake service, Electrical, Bodywork..." className="mt-1 text-sm input-client" />
              </div>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="rounded-xl border border-gray-200 p-4 bg-white">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status & Notes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">Status</Label>
                <Select value={form.status} onValueChange={v => set("status")(v)}>
                  <SelectTrigger className="mt-1 h-9 text-sm input-client"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ zIndex: 9999 }}>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPreferred}
                    onChange={e => set("isPreferred")(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-500" /> Mark as Preferred
                  </span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-gray-600">Notes</Label>
                <Textarea value={form.notes} onChange={e => set("notes")(e.target.value)} rows={2} placeholder="Internal notes about this garage..." className="mt-1 text-sm input-client" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button variant="outline" size="sm" className="h-8 text-xs px-4" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="h-8 text-xs px-5 bg-blue-800 hover:bg-blue-900"
            onClick={onSubmit}
            disabled={isPending || !form.garageName.trim()}
          >
            {isPending ? "Saving..." : "Save Garage"}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function DeleteConfirm({ open, name, onClose, onConfirm, isPending }: {
  open: boolean; name: string; onClose: () => void; onConfirm: () => void; isPending: boolean;
}) {
  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-base font-bold text-gray-900 text-center mb-1">Delete Garage</h2>
        <p className="text-sm text-gray-500 text-center mb-5">
          Remove <span className="font-semibold text-gray-700">{name}</span>? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 h-9" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function ViewDrawer({ garage, onClose, onEdit }: { garage: any; onClose: () => void; onEdit: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-end bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full sm:w-[420px] h-full sm:h-full sm:max-h-screen overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-800 to-blue-700 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">
              <Building2 className="h-4 w-4 text-white" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white truncate max-w-[220px]">{garage.garageName}</h2>
              <p className="text-[10px] text-blue-200">{garage.city || "No city set"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs border-white/20 text-white hover:bg-white/10 hover:text-white" onClick={onEdit}>
              <Edit className="h-3 w-3 mr-1" /> Edit
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${garage.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${garage.status === "Active" ? "bg-emerald-500" : "bg-gray-400"}`} />
              {garage.status}
            </span>
            {garage.isPreferred && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                <Star className="h-3 w-3" /> Preferred
              </span>
            )}
          </div>

          {/* Stats */}
          {(garage.totalJobs != null) && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-gray-100 p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{garage.totalJobs}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Jobs</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3 text-center">
                <p className="text-lg font-bold text-gray-900">${Number(garage.totalSpent || 0).toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Total Spent</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3 text-center">
                <p className="text-xs font-semibold text-gray-700">
                  {garage.lastServiceDate ? format(new Date(garage.lastServiceDate), "MMM d") : "–"}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Last Job</p>
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</h4>
            {garage.contactPerson && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-700">{garage.contactPerson}</span>
              </div>
            )}
            {garage.phoneNumber && (
              <a href={`tel:${garage.phoneNumber}`} className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800 group">
                <Phone className="h-3.5 w-3.5" />
                <span className="group-hover:underline">{garage.phoneNumber}</span>
              </a>
            )}
            {garage.whatsappNumber && (
              <a
                href={`https://wa.me/${garage.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 group"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="group-hover:underline">{garage.whatsappNumber}</span>
              </a>
            )}
            {garage.email && (
              <a href={`mailto:${garage.email}`} className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800 group">
                <Mail className="h-3.5 w-3.5" />
                <span className="group-hover:underline truncate">{garage.email}</span>
              </a>
            )}
          </div>

          {/* Location */}
          {(garage.address || garage.city || garage.googleMapsLink) && (
            <div className="rounded-xl border border-gray-100 p-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</h4>
              {(garage.address || garage.city) && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                  <span>{[garage.address, garage.city].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {garage.googleMapsLink && (
                <a href={garage.googleMapsLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-800">
                  <ExternalLink className="h-3.5 w-3.5" /> View on Google Maps
                </a>
              )}
            </div>
          )}

          {/* Services */}
          {garage.servicesOffered && (
            <div className="rounded-xl border border-gray-100 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Services Offered</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{garage.servicesOffered}</p>
            </div>
          )}

          {/* Business */}
          {(garage.vatNumber || garage.paymentTerms) && (
            <div className="rounded-xl border border-gray-100 p-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business</h4>
              {garage.vatNumber && <p className="text-sm text-gray-700"><span className="text-gray-500">VAT:</span> {garage.vatNumber}</p>}
              {garage.paymentTerms && <p className="text-sm text-gray-700"><span className="text-gray-500">Payment:</span> {garage.paymentTerms}</p>}
            </div>
          )}

          {/* Notes */}
          {garage.notes && (
            <div className="rounded-xl border border-gray-100 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{garage.notes}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 pt-1">
            {garage.phoneNumber && (
              <a href={`tel:${garage.phoneNumber}`} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Call Garage</span>
                <Phone className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </a>
            )}
            {garage.whatsappNumber && (
              <a href={`https://wa.me/${garage.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
                <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">WhatsApp</span>
                <MessageCircle className="h-4 w-4 text-emerald-400 group-hover:text-emerald-600" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Garages() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [preferredFilter, setPreferredFilter] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [form, setForm] = useState<GarageForm>(EMPTY_FORM);

  const { data: garages = [], isLoading } = trpc.garages.list.useQuery();

  const createMutation = trpc.garages.create.useMutation({
    onSuccess: () => {
      toast.success("Garage added successfully");
      utils.garages.list.invalidate();
      setAddOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.garages.update.useMutation({
    onSuccess: () => {
      toast.success("Garage updated");
      utils.garages.list.invalidate();
      setEditId(null);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.garages.delete.useMutation({
    onSuccess: () => {
      toast.success("Garage deleted");
      utils.garages.list.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return garages.filter((g: any) => {
      const q = search.toLowerCase();
      const matchSearch = !q || g.garageName.toLowerCase().includes(q) || (g.city || "").toLowerCase().includes(q) || (g.contactPerson || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || g.status === statusFilter;
      const matchPreferred = !preferredFilter || g.isPreferred;
      return matchSearch && matchStatus && matchPreferred;
    });
  }, [garages, search, statusFilter, preferredFilter]);

  const stats = useMemo(() => {
    const total = garages.length;
    const active = garages.filter((g: any) => g.status === "Active").length;
    const preferred = garages.filter((g: any) => g.isPreferred).length;
    const totalJobs = garages.reduce((sum: number, g: any) => sum + Number(g.totalJobs || 0), 0);
    return { total, active, preferred, totalJobs };
  }, [garages]);

  function openAdd() { setForm(EMPTY_FORM); setAddOpen(true); }
  function openEdit(g: any) {
    setForm({
      garageName: g.garageName || "",
      contactPerson: g.contactPerson || "",
      phoneNumber: g.phoneNumber || "",
      whatsappNumber: g.whatsappNumber || "",
      email: g.email || "",
      address: g.address || "",
      city: g.city || "",
      servicesOffered: g.servicesOffered || "",
      notes: g.notes || "",
      status: (g.status as GarageStatus) || "Active",
      googleMapsLink: g.googleMapsLink || "",
      vatNumber: g.vatNumber || "",
      paymentTerms: g.paymentTerms || "",
      isPreferred: g.isPreferred || false,
    });
    setEditId(g.id);
  }

  function handleSubmitAdd() {
    if (!form.garageName.trim()) { toast.error("Garage name is required"); return; }
    createMutation.mutate(form);
  }
  function handleSubmitEdit() {
    if (!editId || !form.garageName.trim()) return;
    updateMutation.mutate({ id: editId, ...form });
  }

  const viewingGarage = viewId ? garages.find((g: any) => g.id === viewId) : null;
  const deletingGarage = deleteId ? garages.find((g: any) => g.id === deleteId) : null;

  async function handleExport() {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Garages");
      ws.columns = [
        { header: "Garage Name", key: "garageName", width: 25 },
        { header: "Contact Person", key: "contactPerson", width: 20 },
        { header: "Phone", key: "phoneNumber", width: 18 },
        { header: "WhatsApp", key: "whatsappNumber", width: 18 },
        { header: "Email", key: "email", width: 25 },
        { header: "City", key: "city", width: 15 },
        { header: "Address", key: "address", width: 30 },
        { header: "Services", key: "servicesOffered", width: 30 },
        { header: "Status", key: "status", width: 10 },
        { header: "Preferred", key: "isPreferred", width: 12 },
        { header: "VAT Number", key: "vatNumber", width: 18 },
        { header: "Payment Terms", key: "paymentTerms", width: 20 },
        { header: "Total Jobs", key: "totalJobs", width: 12 },
        { header: "Total Spent ($)", key: "totalSpent", width: 15 },
        { header: "Notes", key: "notes", width: 30 },
      ];
      ws.getRow(1).font = { bold: true };
      filtered.forEach((g: any) => ws.addRow({
        ...g,
        isPreferred: g.isPreferred ? "Yes" : "No",
        totalJobs: Number(g.totalJobs || 0),
        totalSpent: Number(g.totalSpent || 0).toFixed(2),
      }));
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "garages.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Garages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your service centers and garage partnerships</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport}>
            <FileDown className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" className="h-8 text-xs bg-blue-800 hover:bg-blue-900" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Garage
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Garages", value: stats.total, icon: Building2, color: "bg-blue-100 text-blue-700" },
          { label: "Active", value: stats.active, icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
          { label: "Preferred", value: stats.preferred, icon: Star, color: "bg-amber-100 text-amber-700" },
          { label: "Total Jobs", value: stats.totalJobs, icon: Wrench, color: "bg-violet-100 text-violet-700" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 p-5 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, city, or contact..."
            className="pl-9 h-9 text-sm input-client"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="h-9 text-sm w-full sm:w-36 input-client">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={preferredFilter ? "default" : "outline"}
          size="sm"
          className={`h-9 text-xs gap-1.5 ${preferredFilter ? "bg-amber-500 hover:bg-amber-600 text-white border-0" : ""}`}
          onClick={() => setPreferredFilter(!preferredFilter)}
        >
          <Star className="h-3.5 w-3.5" /> Preferred Only
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {garages.length === 0 ? "No garages yet" : "No garages match your filters"}
          </p>
          {garages.length === 0 && (
            <Button size="sm" className="mt-4 h-8 text-xs bg-blue-800 hover:bg-blue-900" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Your First Garage
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Garage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jobs / Spent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((g: any) => (
                  <tr key={g.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 flex-shrink-0">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {g.garageName}
                            {g.isPreferred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                          </p>
                          {g.servicesOffered && (
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">{g.servicesOffered}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{g.contactPerson || "–"}</td>
                    <td className="px-4 py-3.5">
                      {g.phoneNumber ? (
                        <div className="flex items-center gap-2">
                          <a href={`tel:${g.phoneNumber}`} className="text-blue-700 hover:text-blue-800 hover:underline">{g.phoneNumber}</a>
                          {g.whatsappNumber && (
                            <a href={`https://wa.me/${g.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-3.5 w-3.5 text-emerald-500 hover:text-emerald-600" />
                            </a>
                          )}
                        </div>
                      ) : "–"}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{g.city || "–"}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-gray-700 font-medium">{Number(g.totalJobs || 0)} jobs</div>
                      <div className="text-xs text-gray-400">${Number(g.totalSpent || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${g.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${g.status === "Active" ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {g.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600" onClick={() => setViewId(g.id)} title="View details">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600" onClick={() => openEdit(g)} title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600" onClick={() => setDeleteId(g.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((g: any) => (
              <div key={g.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      {g.garageName}
                      {g.isPreferred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                    </p>
                    {g.city && <p className="text-xs text-gray-500 mt-0.5">{g.city}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${g.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${g.status === "Active" ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {g.status}
                  </span>
                </div>
                {g.phoneNumber && (
                  <div className="flex items-center gap-3 mb-3">
                    <a href={`tel:${g.phoneNumber}`} className="flex items-center gap-1.5 text-sm text-blue-700">
                      <Phone className="h-3.5 w-3.5" /> {g.phoneNumber}
                    </a>
                    {g.whatsappNumber && (
                      <a href={`https://wa.me/${g.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-emerald-700">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span>{Number(g.totalJobs || 0)} jobs</span>
                  <span>·</span>
                  <span>${Number(g.totalSpent || 0).toLocaleString()} spent</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setViewId(g.id)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(g)}>
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={() => setDeleteId(g.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-right">{filtered.length} of {garages.length} garages</p>
        </>
      )}

      {/* Add Modal */}
      <GarageFormModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setForm(EMPTY_FORM); }}
        title="Add New Garage"
        form={form}
        setForm={setForm}
        onSubmit={handleSubmitAdd}
        isPending={createMutation.isPending}
      />

      {/* Edit Modal */}
      <GarageFormModal
        open={editId !== null}
        onClose={() => { setEditId(null); setForm(EMPTY_FORM); }}
        title="Edit Garage"
        form={form}
        setForm={setForm}
        onSubmit={handleSubmitEdit}
        isPending={updateMutation.isPending}
      />

      {/* Delete Confirm */}
      <DeleteConfirm
        open={deleteId !== null}
        name={deletingGarage?.garageName || ""}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
        isPending={deleteMutation.isPending}
      />

      {/* View Drawer */}
      {viewingGarage && (
        <ViewDrawer
          garage={viewingGarage}
          onClose={() => setViewId(null)}
          onEdit={() => { openEdit(viewingGarage); setViewId(null); }}
        />
      )}
    </div>
  );
}
