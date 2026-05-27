import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Palette, Eye, EyeOff, Upload, X, Crown, Sparkles, Building2 } from "lucide-react";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { useTranslation } from "react-i18next";

const DEFAULT_PRIMARY = "#2563eb";
const DEFAULT_SECONDARY = "#1e40af";

export default function WhiteLabelSettings() {
  const { t } = useTranslation();
  const { data: accessData, isLoading: accessLoading } = trpc.company.hasWhiteLabelAccess.useQuery();
  const { data: profile, isLoading: profileLoading } = trpc.company.getProfile.useQuery();
  const utils = trpc.useUtils();

  const [platformName, setPlatformName] = useState("");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
  const [logoUrl, setLogoUrl] = useState("");
  const [hidePoweredBy, setHidePoweredBy] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setPlatformName(profile.platformName ?? "");
      setPrimaryColor(profile.primaryColor ?? DEFAULT_PRIMARY);
      setSecondaryColor(profile.secondaryColor ?? DEFAULT_SECONDARY);
      setLogoUrl(profile.logoUrl ?? "");
      setHidePoweredBy(profile.hidePoweredBy ?? false);
    }
  }, [profile]);

  const uploadLogoMutation = trpc.company.uploadLogo.useMutation({
    onSuccess: (data) => {
      setLogoUrl(data.url);
      toast.success(t("whiteLabel.logoUploaded"));
      setUploadingLogo(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setUploadingLogo(false);
    },
  });

  const updateMutation = trpc.company.updateWhiteLabel.useMutation({
    onSuccess: () => {
      toast.success(t("whiteLabel.saved"));
      utils.company.getProfile.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      uploadLogoMutation.mutate({
        fileName: file.name,
        fileData: base64,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateMutation.mutate({
      platformName: platformName || undefined,
      primaryColor,
      secondaryColor,
      logoUrl: logoUrl || undefined,
      hidePoweredBy,
    });
  };

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
        <h1 className="text-2xl font-bold text-gray-900">{t("whiteLabel.title")}</h1>
        <p className="text-gray-500">{t("whiteLabel.upgradeRequired")}</p>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-left space-y-3">
          <p className="font-semibold text-blue-900">{t("whiteLabel.enterpriseFeatures")}</p>
          {[
            t("whiteLabel.feature1"),
            t("whiteLabel.feature2"),
            t("whiteLabel.feature3"),
            t("whiteLabel.feature4"),
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-blue-800">
              <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
        <Button
          onClick={() => window.location.href = "/subscription-plans"}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {t("whiteLabel.viewPlans")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("whiteLabel.title")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("whiteLabel.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-5">
          {/* Platform Name */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-2 bg-blue-50">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">{t("whiteLabel.brandingSection")}</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform-name">{t("whiteLabel.platformName")}</Label>
              <Input
                id="platform-name"
                data-testid="input-platform-name"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder={t("whiteLabel.platformNamePlaceholder")}
              />
              <p className="text-xs text-gray-500">{t("whiteLabel.platformNameHint")}</p>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label>{t("whiteLabel.logo")}</Label>
              {logoUrl ? (
                <div className="relative inline-block">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 w-auto rounded-lg border border-gray-200 object-contain bg-gray-50 p-2"
                  />
                  <button
                    onClick={() => setLogoUrl("")}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                    title={t("whiteLabel.removeLogo")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                  data-testid="logo-upload-zone"
                >
                  {uploadingLogo ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">{t("whiteLabel.uploadLogo")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t("whiteLabel.uploadLogoHint")}</p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                data-testid="input-logo-file"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-2 bg-purple-50">
                <Palette className="h-4 w-4 text-purple-600" />
              </div>
              <h2 className="font-semibold text-gray-900">{t("whiteLabel.colorsSection")}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">{t("whiteLabel.primaryColor")}</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-12 rounded border border-gray-200 cursor-pointer p-0.5"
                    data-testid="input-primary-color"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono text-sm"
                    maxLength={7}
                    data-testid="input-primary-color-hex"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">{t("whiteLabel.secondaryColor")}</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-12 rounded border border-gray-200 cursor-pointer p-0.5"
                    data-testid="input-secondary-color"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="font-mono text-sm"
                    maxLength={7}
                    data-testid="input-secondary-color-hex"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">{t("whiteLabel.colorsHint")}</p>
          </div>

          {/* Branding options */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-2 bg-green-50">
                <EyeOff className="h-4 w-4 text-green-600" />
              </div>
              <h2 className="font-semibold text-gray-900">{t("whiteLabel.visibilitySection")}</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">{t("whiteLabel.hidePoweredBy")}</Label>
                <p className="text-xs text-gray-500">{t("whiteLabel.hidePoweredByHint")}</p>
              </div>
              <Switch
                checked={hidePoweredBy}
                onCheckedChange={setHidePoweredBy}
                data-testid="toggle-hide-powered-by"
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-save-white-label"
          >
            {updateMutation.isPending ? t("whiteLabel.saving") : t("whiteLabel.save")}
          </Button>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg p-2 bg-orange-50">
                <Eye className="h-4 w-4 text-orange-600" />
              </div>
              <h2 className="font-semibold text-gray-900">{t("whiteLabel.preview")}</h2>
            </div>

            {/* Sidebar preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <div className="flex h-64">
                {/* Mock sidebar */}
                <div className="w-52 bg-white border-r border-gray-200 flex flex-col p-4 space-y-3">
                  {/* Logo area */}
                  <div className="pb-3 border-b border-gray-100">
                    {logoUrl ? (
                      <img src={logoUrl} alt="logo" className="h-8 w-auto object-contain" />
                    ) : platformName ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{platformName}</span>
                        <span className="text-[9px] text-gray-400 font-semibold tracking-widest uppercase">Rental Management</span>
                      </div>
                    ) : (
                      <AnimatedLogo size="sm" />
                    )}
                  </div>

                  {/* Mock nav items */}
                  {["Dashboard", "Fleet", "Contracts", "Clients"].map((label, i) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium"
                      style={i === 0 ? { backgroundColor: primaryColor, color: "#fff" } : { color: "#374151" }}
                    >
                      <div
                        className="h-3 w-3 rounded-sm flex-shrink-0"
                        style={i === 0 ? { backgroundColor: "rgba(255,255,255,0.3)" } : { backgroundColor: "#e5e7eb" }}
                      />
                      {label}
                    </div>
                  ))}

                  {/* Powered by */}
                  {!hidePoweredBy && (
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      <p className="text-[9px] text-gray-400 text-center">Powered by FleetWizards</p>
                    </div>
                  )}
                </div>

                {/* Mock content area */}
                <div className="flex-1 p-4 space-y-2">
                  <div className="h-5 rounded bg-gray-200 w-32" />
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {[primaryColor, secondaryColor, "#6b7280", "#d1d5db"].map((c, i) => (
                      <div key={i} className="h-12 rounded-lg border border-gray-100" style={{ backgroundColor: c + "22", borderColor: c + "44" }}>
                        <div className="h-full flex items-center justify-center">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: c }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Color swatches */}
            <div className="mt-4 flex gap-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded border border-gray-200 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                <span className="text-xs text-gray-600">{t("whiteLabel.primaryColor")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded border border-gray-200 flex-shrink-0" style={{ backgroundColor: secondaryColor }} />
                <span className="text-xs text-gray-600">{t("whiteLabel.secondaryColor")}</span>
              </div>
            </div>
          </div>

          {/* Current branding info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">{t("whiteLabel.activeSettings")}</p>
            <div className="space-y-1 text-xs text-blue-700">
              <p>{t("whiteLabel.platformNameLabel")}: <span className="font-medium">{platformName || t("whiteLabel.notSet")}</span></p>
              <p>{t("whiteLabel.hidePoweredByLabel")}: <span className="font-medium">{hidePoweredBy ? t("whiteLabel.yes") : t("whiteLabel.no")}</span></p>
              <p>{t("whiteLabel.logoLabel")}: <span className="font-medium">{logoUrl ? t("whiteLabel.logoSet") : t("whiteLabel.notSet")}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
