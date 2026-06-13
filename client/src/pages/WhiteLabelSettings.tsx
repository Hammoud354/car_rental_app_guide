import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Palette, Eye, EyeOff, Upload, X, Crown, Sparkles, Building2,
  Globe, LogIn, FileText, LayoutDashboard, CheckCircle2, ImageIcon, Wand2
} from "lucide-react";
import { AnimatedLogo } from "@/components/AnimatedLogo";

const DEFAULT_PRIMARY = "#2563eb";
const DEFAULT_ACCENT = "#1e40af";
const DEFAULT_SIDEBAR = "#ffffff";

const PRESETS = [
  { name: "Corporate Blue",      primary: "#2563eb", accent: "#1e40af", sidebar: "#ffffff" },
  { name: "Luxury Black & Gold", primary: "#d4a017", accent: "#b8860b", sidebar: "#111111" },
  { name: "Premium Silver",      primary: "#64748b", accent: "#475569", sidebar: "#f8fafc" },
  { name: "Minimal White",       primary: "#111827", accent: "#374151", sidebar: "#fafafa" },
];

function isColorDark(hex: string) {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

type PreviewTab = "dashboard" | "login" | "invoice";

function ColorPicker({ label, value, onChange, id }: { label: string; value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-gray-600">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm h-9"
          maxLength={7}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function UploadZone({
  label, hint, value, onUpload, onRemove, uploading, accept, preview = "logo"
}: {
  label: string; hint: string; value: string; onUpload: (f: File) => void;
  onRemove: () => void; uploading: boolean; accept: string; preview?: "logo" | "favicon" | "bg";
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-gray-600">{label}</Label>
      {value ? (
        <div className="relative inline-flex">
          <img
            src={value}
            alt={label}
            className={
              preview === "favicon" ? "h-10 w-10 object-contain rounded border border-gray-200 bg-gray-50 p-1"
              : preview === "bg" ? "h-20 w-full object-cover rounded-lg border border-gray-200"
              : "h-14 w-auto max-w-[180px] object-contain rounded-lg border border-gray-200 bg-gray-50 p-2"
            }
          />
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-sm"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all group"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto" />
          ) : (
            <>
              <Upload className="h-5 w-5 text-gray-300 group-hover:text-blue-400 mx-auto mb-1 transition-colors" />
              <p className="text-xs text-gray-500">{hint}</p>
            </>
          )}
        </div>
      )}
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
    </div>
  );
}

export default function WhiteLabelSettings() {
  const { data: accessData, isLoading: accessLoading } = trpc.company.hasWhiteLabelAccess.useQuery();
  const { data: profile, isLoading: profileLoading } = trpc.company.getProfile.useQuery();
  const utils = trpc.useUtils();

  const [platformName, setPlatformName] = useState("");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [sidebarColor, setSidebarColor] = useState(DEFAULT_SIDEBAR);
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [loginWelcomeText, setLoginWelcomeText] = useState("");
  const [loginLogoUrl, setLoginLogoUrl] = useState("");
  const [loginBgUrl, setLoginBgUrl] = useState("");
  const [hidePoweredBy, setHidePoweredBy] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("dashboard");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingLoginLogo, setUploadingLoginLogo] = useState(false);
  const [uploadingLoginBg, setUploadingLoginBg] = useState(false);

  useEffect(() => {
    if (profile) {
      setPlatformName(profile.platformName ?? "");
      setPrimaryColor(profile.primaryColor ?? DEFAULT_PRIMARY);
      setAccentColor(profile.secondaryColor ?? DEFAULT_ACCENT);
      setSidebarColor((profile as any).sidebarColor ?? DEFAULT_SIDEBAR);
      setLogoUrl(profile.logoUrl ?? "");
      setFaviconUrl((profile as any).faviconUrl ?? "");
      setLoginWelcomeText((profile as any).loginWelcomeText ?? "");
      setLoginLogoUrl((profile as any).loginLogoUrl ?? "");
      setLoginBgUrl((profile as any).loginBgUrl ?? "");
      setHidePoweredBy(profile.hidePoweredBy ?? false);
    }
  }, [profile]);

  const uploadLogoMutation = trpc.company.uploadLogo.useMutation({
    onSuccess: (data) => { setLogoUrl(data.url); toast.success("Logo uploaded"); setUploadingLogo(false); },
    onError: (e) => { toast.error(e.message); setUploadingLogo(false); },
  });

  const uploadMutation = trpc.company.uploadLogo.useMutation();

  const doUpload = (file: File, setter: (u: string) => void, setUploading: (v: boolean) => void) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      uploadMutation.mutate(
        { fileName: file.name, fileData: base64, contentType: file.type },
        {
          onSuccess: (d) => { setter(d.url); setUploading(false); toast.success("Uploaded"); },
          onError: (e) => { toast.error(e.message); setUploading(false); },
        }
      );
    };
    reader.readAsDataURL(file);
  };

  const updateMutation = trpc.company.updateWhiteLabel.useMutation({
    onSuccess: () => {
      toast.success("Brand settings saved");
      utils.company.getProfile.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    updateMutation.mutate({
      platformName: platformName || undefined,
      primaryColor,
      secondaryColor: accentColor,
      sidebarColor,
      logoUrl: logoUrl || undefined,
      faviconUrl: faviconUrl || undefined,
      loginWelcomeText: loginWelcomeText || undefined,
      loginLogoUrl: loginLogoUrl || undefined,
      loginBgUrl: loginBgUrl || undefined,
      hidePoweredBy,
    });
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
    setSidebarColor(preset.sidebar);
  };

  const sidebarDark = isColorDark(sidebarColor);
  const textColor = sidebarDark ? "#f9fafb" : "#111827";
  const subtextColor = sidebarDark ? "#9ca3af" : "#6b7280";
  const navActiveBg = primaryColor;
  const navHoverBg = sidebarDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const borderColor = sidebarDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";

  if (accessLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!accessData?.access) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 border border-yellow-200 mb-2">
          <Crown className="h-8 w-8 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">White Label Settings</h1>
        <p className="text-gray-500">Upgrade to Enterprise to unlock full white-label branding for your agency.</p>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-left space-y-3">
          <p className="font-semibold text-blue-900">Enterprise Features</p>
          {["Custom platform name & logo", "Brand colors & sidebar theme", "Custom favicon", "Login page branding"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-blue-800">
              <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />{f}
            </div>
          ))}
        </div>
        <Button onClick={() => window.location.href = "/subscription-plans"} className="bg-blue-600 hover:bg-blue-700 text-white">
          View Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">White Label Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Customize the platform branding for your business</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
        {/* ── LEFT: Settings ── */}
        <div className="space-y-4">

          {/* Theme Presets */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl p-2 bg-violet-50"><Wand2 className="h-4 w-4 text-violet-600" /></div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Theme Presets</h2>
                <p className="text-xs text-gray-400">One-click brand themes — customise after applying</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => {
                const dark = isColorDark(p.sidebar);
                return (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-center"
                    style={{ backgroundColor: p.sidebar }}
                  >
                    <div className="flex gap-1">
                      <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: p.primary }} />
                      <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: p.accent }} />
                    </div>
                    <span className="text-[10px] font-medium leading-tight" style={{ color: dark ? "#e5e7eb" : "#374151" }}>
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Identity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl p-2 bg-blue-50"><Building2 className="h-4 w-4 text-blue-600" /></div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Brand Identity</h2>
                <p className="text-xs text-gray-400">Platform name and logo shown in the sidebar</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Platform Name</Label>
              <Input
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder="e.g. Dima Rent a Car"
                data-testid="input-platform-name"
              />
              <p className="text-xs text-gray-400">Replaces "FleetWizards" in the sidebar and page title</p>
            </div>
            <UploadZone
              label="Sidebar Logo"
              hint="Click to upload — PNG, JPG or SVG · Max 2MB"
              value={logoUrl}
              onUpload={(f) => { setUploadingLogo(true); doUpload(f, setLogoUrl, setUploadingLogo); }}
              onRemove={() => setLogoUrl("")}
              uploading={uploadingLogo}
              accept="image/*"
              preview="logo"
            />
          </div>

          {/* Brand Colors */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl p-2 bg-purple-50"><Palette className="h-4 w-4 text-purple-600" /></div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Brand Colors</h2>
                <p className="text-xs text-gray-400">Applied to navigation, buttons, and interactive elements</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ColorPicker label="Primary Color" value={primaryColor} onChange={setPrimaryColor} id="primary-color" />
              <ColorPicker label="Accent Color"  value={accentColor}  onChange={setAccentColor}  id="accent-color" />
              <ColorPicker label="Sidebar Background" value={sidebarColor} onChange={setSidebarColor} id="sidebar-color" />
            </div>
          </div>

          {/* Favicon */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl p-2 bg-amber-50"><Globe className="h-4 w-4 text-amber-600" /></div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Favicon</h2>
                <p className="text-xs text-gray-400">Icon shown in the browser tab</p>
              </div>
            </div>
            <UploadZone
              label="Browser Tab Icon"
              hint="PNG or ICO · Recommended 32×32 px"
              value={faviconUrl}
              onUpload={(f) => doUpload(f, setFaviconUrl, setUploadingFavicon)}
              onRemove={() => setFaviconUrl("")}
              uploading={uploadingFavicon}
              accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/*"
              preview="favicon"
            />
          </div>

          {/* Login Page Branding */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl p-2 bg-emerald-50"><LogIn className="h-4 w-4 text-emerald-600" /></div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Login Page Branding</h2>
                <p className="text-xs text-gray-400">Customise the sign-in screen for your clients</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Welcome Message</Label>
              <Input
                value={loginWelcomeText}
                onChange={(e) => setLoginWelcomeText(e.target.value)}
                placeholder={`Welcome to ${platformName || "Your Agency"} Management Portal`}
              />
              <p className="text-xs text-gray-400">Displayed as the headline on your login panel</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UploadZone
                label="Login Page Logo"
                hint="Displayed on the login panel"
                value={loginLogoUrl}
                onUpload={(f) => doUpload(f, setLoginLogoUrl, setUploadingLoginLogo)}
                onRemove={() => setLoginLogoUrl("")}
                uploading={uploadingLoginLogo}
                accept="image/*"
                preview="logo"
              />
              <UploadZone
                label="Background Image"
                hint="Full panel background — JPG recommended"
                value={loginBgUrl}
                onUpload={(f) => doUpload(f, setLoginBgUrl, setUploadingLoginBg)}
                onRemove={() => setLoginBgUrl("")}
                uploading={uploadingLoginBg}
                accept="image/*"
                preview="bg"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl p-2 bg-green-50"><EyeOff className="h-4 w-4 text-green-600" /></div>
              <h2 className="text-sm font-semibold text-gray-900">Branding Visibility</h2>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">Hide "Powered by FleetWizards"</p>
                <p className="text-xs text-gray-400 mt-0.5">Remove FleetWizards attribution from the sidebar footer</p>
              </div>
              <Switch checked={hidePoweredBy} onCheckedChange={setHidePoweredBy} data-testid="toggle-hide-powered-by" />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm"
            data-testid="button-save-white-label"
          >
            {updateMutation.isPending ? "Saving…" : "Save Brand Settings"}
          </Button>
        </div>

        {/* ── RIGHT: Preview + Status ── */}
        <div className="space-y-4 xl:sticky xl:top-6">

          {/* Live Preview Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl p-1.5 bg-orange-50"><Eye className="h-4 w-4 text-orange-500" /></div>
                <span className="text-sm font-semibold text-gray-900">Live Preview</span>
              </div>
              {/* Tab switcher */}
              <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                {(["dashboard", "login", "invoice"] as PreviewTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPreviewTab(tab)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      previewTab === tab ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab === "dashboard" ? <LayoutDashboard className="h-3.5 w-3.5" /> : tab === "login" ? <LogIn className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard Preview */}
            {previewTab === "dashboard" && (
              <div className="border-b border-gray-100 overflow-hidden" style={{ height: 240 }}>
                <div className="flex h-full">
                  {/* Sidebar */}
                  <div className="w-48 flex flex-col p-3 space-y-2 flex-shrink-0 transition-colors" style={{ backgroundColor: sidebarColor, borderRight: `1px solid ${borderColor}` }}>
                    <div className="pb-2" style={{ borderBottom: `1px solid ${borderColor}` }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="logo" className="h-7 w-auto object-contain max-w-[120px]" />
                      ) : platformName ? (
                        <div>
                          <div className="text-[11px] font-bold" style={{ color: textColor }}>{platformName}</div>
                          <div className="text-[8px] font-semibold tracking-widest uppercase" style={{ color: subtextColor }}>Rental Management</div>
                        </div>
                      ) : (
                        <AnimatedLogo size="sm" />
                      )}
                    </div>
                    {["Dashboard", "Fleet", "Contracts", "Clients"].map((label, i) => (
                      <div
                        key={label}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium"
                        style={i === 0
                          ? { backgroundColor: navActiveBg, color: "#fff" }
                          : { color: textColor, backgroundColor: "transparent" }
                        }
                      >
                        <div className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: i === 0 ? "rgba(255,255,255,0.25)" : (sidebarDark ? "rgba(255,255,255,0.12)" : "#e5e7eb") }} />
                        {label}
                      </div>
                    ))}
                    {!hidePoweredBy && (
                      <div className="mt-auto pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
                        <p className="text-[8px] text-center" style={{ color: subtextColor }}>Powered by FleetWizards</p>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-3 bg-[#fbfbfd] space-y-2">
                    <div className="h-4 rounded-md bg-gray-200 w-28" />
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {[primaryColor, accentColor, "#6b7280", "#d1d5db"].map((c, i) => (
                        <div key={i} className="h-10 rounded-lg flex items-center justify-center border" style={{ backgroundColor: c + "18", borderColor: c + "40" }}>
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 mt-1">
                      <div className="h-2 rounded bg-gray-100 w-full" />
                      <div className="h-2 rounded bg-gray-100 w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Login Preview */}
            {previewTab === "login" && (
              <div className="overflow-hidden" style={{ height: 240 }}>
                <div className="flex h-full">
                  {/* Left branding panel */}
                  <div className="w-1/2 relative flex flex-col justify-between p-4 overflow-hidden"
                    style={{ background: loginBgUrl ? `url(${loginBgUrl}) center/cover` : `linear-gradient(135deg, ${primaryColor}dd, ${accentColor})` }}>
                    {loginBgUrl && <div className="absolute inset-0 bg-black/40" />}
                    <div className="relative z-10">
                      {loginLogoUrl ? (
                        <img src={loginLogoUrl} alt="login logo" className="h-7 w-auto object-contain" />
                      ) : (
                        <span className="text-white font-bold text-xs">{platformName || "FleetWizards"}</span>
                      )}
                    </div>
                    <div className="relative z-10 space-y-1">
                      <p className="text-white font-bold text-xs leading-snug">
                        {loginWelcomeText || `Manage your fleet with confidence.`}
                      </p>
                    </div>
                  </div>
                  {/* Right form panel */}
                  <div className="w-1/2 flex flex-col justify-center p-4 bg-white space-y-2">
                    <div className="h-3 rounded bg-gray-800 w-24 font-bold" />
                    <div className="space-y-1.5 mt-1">
                      <div className="h-6 rounded-lg border border-gray-200 bg-gray-50 w-full" />
                      <div className="h-6 rounded-lg border border-gray-200 bg-gray-50 w-full" />
                    </div>
                    <div className="h-6 rounded-lg w-full" style={{ backgroundColor: primaryColor }} />
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Preview */}
            {previewTab === "invoice" && (
              <div className="p-4 bg-[#fbfbfd]" style={{ height: 240 }}>
                <div className="bg-white rounded-xl border border-gray-200 p-3 h-full flex flex-col justify-between shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      {logoUrl ? (
                        <img src={logoUrl} alt="logo" className="h-6 w-auto object-contain" />
                      ) : (
                        <div className="text-xs font-bold text-gray-800">{platformName || "FleetWizards"}</div>
                      )}
                      <div className="text-[9px] text-gray-400">INVOICE #001</div>
                    </div>
                    <div className="px-2 py-0.5 rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: primaryColor }}>
                      Paid
                    </div>
                  </div>
                  <div className="space-y-1 py-2 border-y border-gray-100">
                    {["Daily Rate × 3", "Insurance", "Tax (11%)"].map((item, i) => (
                      <div key={i} className="flex justify-between text-[9px]">
                        <span className="text-gray-500">{item}</span>
                        <span className="text-gray-700 font-medium">${[180, 30, 23][i]}.00</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-gray-400">Total</span>
                    <span className="text-xs font-bold" style={{ color: primaryColor }}>$233.00</span>
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 py-3 flex items-center gap-4 bg-gray-50 border-t border-gray-100">
              {[primaryColor, accentColor, sidebarColor].map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-md border border-gray-200 shadow-inner flex-shrink-0" style={{ backgroundColor: c }} />
                  <span className="text-[10px] text-gray-500 font-mono">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Badges */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Configuration</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  ok: !!logoUrl,
                  label: "Sidebar Logo",
                  yes: "Logo uploaded",
                  no: "No logo set",
                  icon: <ImageIcon className="h-3.5 w-3.5" />,
                  color: "emerald",
                },
                {
                  ok: primaryColor !== DEFAULT_PRIMARY || accentColor !== DEFAULT_ACCENT,
                  label: "Brand Colors",
                  yes: "Colors customized",
                  no: "Using default colors",
                  icon: <Palette className="h-3.5 w-3.5" />,
                  color: "violet",
                },
                {
                  ok: hidePoweredBy,
                  label: "White Label",
                  yes: "Attribution hidden",
                  no: "Powered by visible",
                  icon: <Eye className="h-3.5 w-3.5" />,
                  color: "blue",
                },
                {
                  ok: !!faviconUrl,
                  label: "Favicon",
                  yes: "Custom favicon",
                  no: "No favicon uploaded",
                  icon: <Globe className="h-3.5 w-3.5" />,
                  color: "amber",
                },
                {
                  ok: !!(loginWelcomeText || loginLogoUrl),
                  label: "Login Branding",
                  yes: "Login page branded",
                  no: "Default login page",
                  icon: <LogIn className="h-3.5 w-3.5" />,
                  color: "rose",
                },
              ].map((item) => {
                const colors: Record<string, string> = {
                  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  violet: "bg-violet-50 text-violet-700 border-violet-200",
                  blue: "bg-blue-50 text-blue-700 border-blue-200",
                  amber: "bg-amber-50 text-amber-700 border-amber-200",
                  rose: "bg-rose-50 text-rose-700 border-rose-200",
                };
                const grayClass = "bg-gray-50 text-gray-500 border-gray-200";
                const cls = item.ok ? colors[item.color] : grayClass;
                return (
                  <div key={item.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${cls}`}>
                    <div className="flex-shrink-0">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{item.label}</span>
                        {item.ok && <CheckCircle2 className="h-3 w-3 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] opacity-75">{item.ok ? item.yes : item.no}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
