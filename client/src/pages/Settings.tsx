import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save, Loader2, ChevronRight, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: settings, isLoading, refetch } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation();

  const [formData, setFormData] = useState({
    companyName: "",
    logo: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    taxId: "",
    website: "",
    termsAndConditions: "",
    exchangeRateLbpToUsd: 89700,
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || "",
        logo: settings.logo || "",
        address: settings.address || "",
        city: settings.city || "",
        country: settings.country || "",
        phone: settings.phone || "",
        email: settings.email || "",
        taxId: settings.taxId || "",
        website: settings.website || "",
        termsAndConditions: settings.termsAndConditions || "",
        exchangeRateLbpToUsd: Number(settings.exchangeRateLbpToUsd) || 89700,
      });

    }
  }, [settings]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      await updateSettings.mutateAsync({
        ...formData,
        exchangeRateLbpToUsd: formData.exchangeRateLbpToUsd,
      });

      toast({
        title: t("settings.settingsSaved"),
        description: t("settings.settingsSavedSubtitle"),
      });

      refetch();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Quick Links to Other Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("settings.additionalSettings")}</CardTitle>
          <CardDescription>
            {t("settings.additionalSettingsSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/whatsapp-settings">
            <Button variant="outline" className="w-full justify-start gap-2">
              <MessageCircle className="h-4 w-4" />
              {t("settings.whatsappTemplates")}
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("settings.companyLogo")}</CardTitle>
            <CardDescription>
              {t("settings.logoSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo">{t("settings.logoUrl")}</Label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                 
                />
              </div>
              {formData.logo && (
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                  <img
                    src={formData.logo}
                    alt={t("settings.logoPreview")}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("settings.companyInfo")}</CardTitle>
            <CardDescription>
              {t("settings.companyInfoSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">{t("settings.companyName")} *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                 
                />
              </div>
              <div>
                <Label htmlFor="phone">{t("common.phone")}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                 
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">{t("common.address")}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">{t("common.city")}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                 
                />
              </div>
              <div>
                <Label htmlFor="country">{t("common.country")}</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxId">{t("settings.taxId")}</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) =>
                    setFormData({ ...formData, taxId: e.target.value })
                  }
                 
                />
              </div>
              <div>
                <Label htmlFor="website">{t("settings.website")}</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("settings.currencySettings")}</CardTitle>
            <CardDescription>
              {t("settings.currencySubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="exchangeRate">{t("settings.exchangeRate")}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">1 USD =</span>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.exchangeRateLbpToUsd}
                  onChange={(e) =>
                    setFormData({ ...formData, exchangeRateLbpToUsd: Number(e.target.value) })
                  }
                  className="w-40"
                  required
                />
                <span className="text-sm text-gray-600">LBP</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {t("settings.currentRate", { rate: formData.exchangeRateLbpToUsd.toLocaleString() })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("settings.termsAndConditions")}</CardTitle>
            <CardDescription>
              {t("settings.termsSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.termsAndConditions}
              onChange={(e) =>
                setFormData({ ...formData, termsAndConditions: e.target.value })
              }
              rows={8}
              placeholder={t("settings.termsPlaceholder")}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={isUploading || updateSettings.isPending}
          >
            {isUploading || updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("settings.saveSettings")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
