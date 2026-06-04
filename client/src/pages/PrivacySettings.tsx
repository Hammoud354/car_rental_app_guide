import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Shield, ShieldCheck, ShieldOff, ShieldAlert, Lock, Eye, EyeOff,
  Clock, CheckCircle2, XCircle, ChevronRight, Bell, BellOff,
  Loader2, History, UserCheck, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PRIVACY_MODES = [
  {
    id: "full_access",
    label: "Full Access",
    description: "Administrators can access all company data at any time.",
    icon: ShieldCheck,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    selectedBorder: "border-green-500",
    selectedBg: "bg-green-50",
  },
  {
    id: "partial_access",
    label: "Partial Access",
    description: "Choose which modules are visible to administrators.",
    icon: Eye,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    selectedBorder: "border-blue-500",
    selectedBg: "bg-blue-50",
  },
  {
    id: "temporary_access",
    label: "Temporary Access",
    description: "Grant access for a limited time window that expires automatically.",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    selectedBorder: "border-amber-500",
    selectedBg: "bg-amber-50",
  },
  {
    id: "approval_required",
    label: "Approval Required",
    description: "Administrators must request access and you approve or reject each request.",
    icon: UserCheck,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    selectedBorder: "border-purple-500",
    selectedBg: "bg-purple-50",
  },
  {
    id: "full_privacy",
    label: "Full Privacy Mode",
    description: "Administrators cannot access your operational data. Only account and subscription details remain visible.",
    icon: Lock,
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
    selectedBorder: "border-gray-700",
    selectedBg: "bg-gray-50",
  },
  {
    id: "emergency_access",
    label: "Emergency Access Only",
    description: "Administrators can only enter for critical issues. You are notified immediately every time.",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    selectedBorder: "border-red-500",
    selectedBg: "bg-red-50",
  },
];

const MODULE_LIST = [
  { id: "vehicles", label: "Vehicles" },
  { id: "reservations", label: "Reservations" },
  { id: "customers", label: "Customers" },
  { id: "invoices", label: "Invoices" },
  { id: "maintenance", label: "Maintenance" },
  { id: "financial", label: "Financial Reports" },
  { id: "analytics", label: "Analytics" },
];

const TEMP_PRESETS = [
  { label: "24 hours", hours: 24 },
  { label: "48 hours", hours: 48 },
  { label: "7 days", hours: 168 },
];

function statusBadge(status: string) {
  if (status === "pending") return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pending</Badge>;
  if (status === "approved") return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Approved</Badge>;
  if (status === "rejected") return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Rejected</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function PrivacySettings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: settings, isLoading, refetch } = trpc.privacy.getSettings.useQuery();
  const { data: pendingRequests, refetch: refetchRequests } = trpc.privacy.getPendingRequests.useQuery();
  const updateSettings = trpc.privacy.updateSettings.useMutation();
  const respondToRequest = trpc.privacy.respondToRequest.useMutation();

  const [selectedMode, setSelectedMode] = useState("full_access");
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [tempPreset, setTempPreset] = useState<number | null>(null);
  const [customExpiry, setCustomExpiry] = useState("");
  const [notifyOnAccess, setNotifyOnAccess] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setSelectedMode(settings.mode || "full_access");
      setAllowedModules(Array.isArray(settings.allowedModules) ? settings.allowedModules : []);
      setNotifyOnAccess(settings.notifyOnAccess !== false);
      if (settings.tempAccessExpiry) {
        setCustomExpiry(new Date(settings.tempAccessExpiry).toISOString().slice(0, 16));
      }
    }
  }, [settings]);

  const handlePreset = (hours: number) => {
    const expiry = new Date(Date.now() + hours * 3600 * 1000);
    setCustomExpiry(expiry.toISOString().slice(0, 16));
    setTempPreset(hours);
  };

  const toggleModule = (id: string) => {
    setAllowedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tempExpiry = selectedMode === "temporary_access" && customExpiry
        ? new Date(customExpiry).toISOString()
        : null;
      await updateSettings.mutateAsync({
        mode: selectedMode,
        allowedModules: selectedMode === "partial_access" ? allowedModules : [],
        tempAccessExpiry: tempExpiry,
        notifyOnAccess,
      });
      toast({ title: "Privacy settings saved", description: "Your access control settings have been updated." });
      refetch();
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRespond = async (requestId: number, status: "approved" | "rejected", expiresAt?: string) => {
    try {
      await respondToRequest.mutateAsync({ requestId, status, expiresAt: expiresAt || null });
      toast({
        title: status === "approved" ? "Access approved" : "Request rejected",
        description: status === "approved" ? "The administrator has been notified." : "The request has been rejected.",
      });
      setRejectingId(null);
      setRejectReason("");
      refetchRequests();
    } catch (err: any) {
      toast({ title: "Failed to respond", description: err.message, variant: "destructive" });
    }
  };

  const currentModeInfo = PRIVACY_MODES.find(m => m.id === selectedMode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Privacy & Admin Access</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control how and when administrators can access your company data</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLocation("/access-history")}
          data-testid="button-view-access-history"
        >
          <History className="h-3.5 w-3.5 mr-1.5" />
          Access History
        </Button>
      </div>

      {/* Current Status Banner */}
      {!isLoading && currentModeInfo && (
        <div className={cn("rounded-xl border p-4 flex items-center gap-3", currentModeInfo.bg, currentModeInfo.border)}>
          <currentModeInfo.icon className={cn("h-5 w-5 flex-shrink-0", currentModeInfo.color)} />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Current mode: {currentModeInfo.label}
            </p>
            {selectedMode === "temporary_access" && settings?.tempAccessExpiry && (
              <p className="text-xs text-gray-500 mt-0.5">
                Expires: {format(new Date(settings.tempAccessExpiry), "MMM d, yyyy 'at' HH:mm")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            Access Mode
          </CardTitle>
          <CardDescription>Choose how administrators can access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRIVACY_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  data-testid={`mode-select-${mode.id}`}
                  onClick={() => setSelectedMode(mode.id)}
                  className={cn(
                    "text-left rounded-xl border-2 p-4 transition-all duration-150 hover:shadow-sm",
                    isSelected
                      ? cn("border-2", mode.selectedBorder, mode.selectedBg, "shadow-sm")
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("rounded-lg p-2 mt-0.5", isSelected ? mode.bg : "bg-gray-100")}>
                      <Icon className={cn("h-4 w-4", isSelected ? mode.color : "text-gray-500")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold", isSelected ? "text-gray-900" : "text-gray-700")}>
                        {mode.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{mode.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className={cn("h-4 w-4 flex-shrink-0 mt-0.5", mode.color)} />}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Partial Access — Module Selector */}
      {selectedMode === "partial_access" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Visible Modules
            </CardTitle>
            <CardDescription>Select which modules administrators can view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MODULE_LIST.map((mod) => (
                <div
                  key={mod.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors",
                    allowedModules.includes(mod.id)
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => toggleModule(mod.id)}
                >
                  <Checkbox
                    id={`mod-${mod.id}`}
                    checked={allowedModules.includes(mod.id)}
                    onCheckedChange={() => toggleModule(mod.id)}
                    data-testid={`checkbox-module-${mod.id}`}
                  />
                  <Label htmlFor={`mod-${mod.id}`} className="text-sm font-medium cursor-pointer">
                    {mod.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Temporary Access — Duration Picker */}
      {selectedMode === "temporary_access" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Access Duration
            </CardTitle>
            <CardDescription>Set when the administrator's access will expire automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {TEMP_PRESETS.map((p) => (
                <Button
                  key={p.hours}
                  size="sm"
                  variant={tempPreset === p.hours ? "default" : "outline"}
                  onClick={() => handlePreset(p.hours)}
                  data-testid={`btn-preset-${p.hours}h`}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Custom date &amp; time</Label>
              <input
                type="datetime-local"
                value={customExpiry}
                onChange={(e) => { setCustomExpiry(e.target.value); setTempPreset(null); }}
                className="w-full border border-[#1e3a8a] border-[1.5px] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="input-custom-expiry"
              />
              {customExpiry && (
                <p className="text-xs text-gray-500">
                  Expires: {format(new Date(customExpiry), "EEEE, MMM d yyyy 'at' HH:mm")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Preference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-600" />
            Notifications
          </CardTitle>
          <CardDescription>Control when you receive access alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors",
              notifyOnAccess ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => setNotifyOnAccess(!notifyOnAccess)}
          >
            <div className="flex items-center gap-3">
              {notifyOnAccess ? (
                <Bell className="h-4 w-4 text-blue-600" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium">Notify me when access occurs</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive an email whenever an admin accesses your account
                </p>
              </div>
            </div>
            <Checkbox
              checked={notifyOnAccess}
              onCheckedChange={(checked) => setNotifyOnAccess(!!checked)}
              data-testid="checkbox-notify-on-access"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          data-testid="button-save-privacy"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Save Privacy Settings
        </Button>
      </div>

      {/* Pending Access Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-purple-600" />
              Pending Access Requests
              <Badge variant="outline" className="ml-1 text-purple-600 border-purple-300 bg-purple-50">
                {pendingRequests.filter((r: any) => r.status === "pending").length}
              </Badge>
            </CardTitle>
            <CardDescription>Review and respond to administrator access requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((req: any) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                  data-testid={`access-request-${req.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {req.adminName || req.adminUsername || "Administrator"}
                        </p>
                        {statusBadge(req.status)}
                        <span className="text-xs text-gray-400">
                          {format(new Date(req.requestedAt), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                      {req.reason && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Reason:</span> {req.reason}
                        </p>
                      )}
                    </div>
                    {req.status === "pending" && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => handleRespond(req.id, "approved", new Date(Date.now() + 24 * 3600 * 1000).toISOString())}
                          data-testid={`button-approve-request-${req.id}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => setRejectingId(req.id)}
                          data-testid={`button-reject-request-${req.id}`}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1.5" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                  {rejectingId === req.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder="Optional: explain why you're rejecting this request..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="text-sm"
                        data-testid="textarea-reject-reason"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRespond(req.id, "rejected")}
                          data-testid={`button-confirm-reject-${req.id}`}
                        >
                          Confirm Rejection
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRejectingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link to Access History */}
      <button
        onClick={() => setLocation("/access-history")}
        className="w-full rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between hover:border-blue-200 hover:bg-blue-50/30 transition-colors group"
        data-testid="button-access-history-link"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-gray-100 group-hover:bg-blue-100">
            <History className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">Access History</p>
            <p className="text-xs text-gray-500">View all admin access sessions and activity logs</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
      </button>
    </div>
  );
}
