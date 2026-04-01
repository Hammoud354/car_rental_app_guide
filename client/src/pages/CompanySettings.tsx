import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Building2, Home, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { countries } from "@/lib/countries";
import { getCurrencyCodeForCountry } from "@/lib/countryCurrencyMap";
import { getVATRateByCountry, getExchangeRateByCountry } from "@/lib/vatRates";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function CompanySettings() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: profile, isLoading, refetch } = trpc.company.getProfile.useQuery();
  const updateProfile = trpc.company.updateProfile.useMutation();
  const uploadLogoMutation = trpc.company.uploadLogo.useMutation();

  const [formData, setFormData] = useState({
    companyName: "",
    registrationNumber: "",
    taxId: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    logoUrl: "",
    contractTemplateUrl: "",
    defaultCurrency: "USD" as "USD" | "LOCAL",
    exchangeRate: "1.0000",
    localCurrencyCode: "LBP",
    vatRate: "11",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string>("");

  useEffect(() => {
    if (profile) {
      const derivedCurrencyCode = profile.country
        ? getCurrencyCodeForCountry(profile.country) || profile.localCurrencyCode || "USD"
        : profile.localCurrencyCode || "USD";

      setFormData({
        companyName: profile.companyName || "",
        registrationNumber: profile.registrationNumber || "",
        taxId: profile.taxId || "",
        address: profile.address || "",
        city: profile.city || "",
        country: profile.country || "",
        phone: profile.phone || "",
        email: profile.email || "",
        website: profile.website || "",
        logoUrl: profile.logoUrl || "",
        contractTemplateUrl: profile.contractTemplateUrl || "",
        defaultCurrency: (profile.defaultCurrency as "USD" | "LOCAL") || "USD",
        exchangeRate: profile.exchangeRate?.toString() || "1.0000",
        localCurrencyCode: derivedCurrencyCode,
        vatRate: profile.vatRate?.toString() || "11",
      });
      if (profile.logoUrl) {
        setLogoPreview(profile.logoUrl);
      }
      if (profile.contractTemplateUrl) {
        setTemplatePreview(profile.contractTemplateUrl);
      }
    }
  }, [profile]);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 2MB.", variant: "destructive" });
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setLogoFile(file);
    setLogoPreview(dataUrl);
    setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
  };

  const handleTemplateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Contract template must be under 5MB.", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);
      const dataUrl = await readFileAsDataUrl(file);
      setTemplateFile(file);
      setTemplatePreview(dataUrl);

      // Save to database immediately
      const companyName = formData.companyName?.trim() || 'My Company';
      const updateData: any = {
        ...formData,
        companyName,
        contractTemplateUrl: dataUrl,
        exchangeRate: parseFloat(formData.exchangeRate) || 1,
        vatRate: parseFloat(formData.vatRate) || 11,
      };
      await updateProfile.mutateAsync(updateData);
      setFormData(prev => ({ ...prev, contractTemplateUrl: dataUrl }));
      await refetch();

      toast({ title: "Success", description: "Contract template uploaded successfully!" });
    } catch (error) {
      console.error('Template upload error:', error);
      toast({ title: "Upload Failed", description: "Failed to save template. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    // Logo data URL is already stored in formData.logoUrl when the file was selected
    return formData.logoUrl || null;
  };

  const uploadTemplate = async (): Promise<string | null> => {
    // Template data URL is already stored in formData.contractTemplateUrl when the file was selected
    return formData.contractTemplateUrl || null;
  };

  const handleSubmit = async () => {

    try {
      // Upload logo if changed
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      // Upload contract template if changed
      let contractTemplateUrl = formData.contractTemplateUrl;
      if (templateFile) {
        const uploadedUrl = await uploadTemplate();
        if (uploadedUrl) {
          contractTemplateUrl = uploadedUrl;
        }
      }

      console.log('[handleSubmit] vatRate formData:', formData.vatRate);
      const updateData: any = {
        ...formData,
        logoUrl,
        contractTemplateUrl,
        exchangeRate: parseFloat(formData.exchangeRate) || 1,
        vatRate: parseFloat(formData.vatRate) || 11,
      };
      console.log('[handleSubmit] final exchangeRate:', updateData.exchangeRate);
      await updateProfile.mutateAsync(updateData);

      await refetch();
      
      toast({
        title: "Success",
        description: "Company profile updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("companySettings.title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure your company branding and information for contracts and documents
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Company Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
            <CardDescription>
              Upload your company logo. This will appear on all contracts and documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {logoPreview ? (
                <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  <img src={logoPreview} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted shrink-0">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 w-full">
                <Label htmlFor="logo" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors w-fit">
                    <Upload className="h-4 w-4" />
                    Choose Logo
                  </div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  Recommended: PNG or SVG, max 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Basic information about your company.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              How clients can reach your company.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between px-3 py-2",
                        !formData.country && "text-muted-foreground"
                      )}
                    >
                      <span className="flex-1 text-left">
                        {formData.country
                          ? countries.find((c) => c.name === formData.country)?.name
                          : "Select country..."}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search countries..." className="border-b border-gray-200 focus:border-gray-300" />
                      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">No country found.</CommandEmpty>
                      <CommandList className="max-h-[300px] w-full">
                        <CommandGroup>
                          {countries.map((country) => (
                            <CommandItem
                              key={country.code}
                              value={country.name}
                              onSelect={(currentValue) => {
                                // Always select the country (don't toggle off)
                                const newCurrencyCode = getCurrencyCodeForCountry(currentValue);
                                const newVATRate = getVATRateByCountry(currentValue);
                                const newExchangeRate = getExchangeRateByCountry(currentValue);
                                setFormData({
                                  ...formData,
                                  country: currentValue,
                                  localCurrencyCode: newCurrencyCode || formData.localCurrencyCode,
                                  vatRate: newVATRate.toString(),
                                  exchangeRate: newExchangeRate.toString(),
                                });
                                // Close the popover after selection
                                setCountryPopoverOpen(false);
                              }}
                              className="cursor-pointer px-4 py-2.5 hover:bg-gray-100 data-[selected]:bg-gray-50"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.country === country.name
                                    ? "opacity-100 text-gray-700"
                                    : "opacity-0"
                                )}
                              />
                              <span className="text-sm">{country.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Template */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Template</CardTitle>
            <CardDescription>
              Upload your custom contract template and configure field positions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {templatePreview ? (
                <div className="w-full sm:w-48 h-48 sm:h-64 border-2 border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  <img src={templatePreview} alt="Contract Template" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-full sm:w-48 h-40 sm:h-64 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted shrink-0">
                  <div className="text-center p-4">
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No template uploaded</p>
                  </div>
                </div>
              )}
              <div className="flex-1 w-full space-y-4">
                <div>
                  <Label htmlFor="contractTemplate" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors w-fit">
                      <Upload className="h-4 w-4" />
                      Choose Template
                    </div>
                  </Label>
                  <Input
                    id="contractTemplate"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleTemplateChange}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload a high-resolution image of your contract template (PNG, JPG)
                  </p>
                </div>
                {(templatePreview || profile?.contractTemplateUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setLocation('/contract-template-mapper')}
                  >
                    Configure Field Positions
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>
              Configure your default operating currency and exchange rates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultCurrency">Default Operating Currency</Label>
                <select
                  id="defaultCurrency"
                  value={formData.defaultCurrency}
                  onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="USD">USD — US Dollar</option>
                  {formData.localCurrencyCode && formData.localCurrencyCode !== "USD" && (
                    <option value="LOCAL">{formData.localCurrencyCode} — Local Currency</option>
                  )}
                  {(!formData.localCurrencyCode || formData.localCurrencyCode === "USD") && (
                    <option value="LOCAL">Local Currency</option>
                  )}
                </select>
              </div>
              <div>
                <Label htmlFor="localCurrencyCode">Local Currency Code</Label>
                <Input
                  id="localCurrencyCode"
                  value={formData.localCurrencyCode}
                  onChange={(e) => setFormData({ ...formData, localCurrencyCode: e.target.value })}
                  placeholder="e.g., LBP"
                  maxLength={3}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="exchangeRate">Exchange Rate</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.0001"
                  value={formData.exchangeRate}
                  onChange={(e) => {
                    console.log('[ExchangeRate Input] Raw value:', e.target.value, 'Type:', typeof e.target.value);
                    setFormData({ ...formData, exchangeRate: e.target.value });
                  }}
                  placeholder="1.0000"
                />
                <p className="text-xs text-muted-foreground mt-1">Local currency to USD conversion rate</p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="vatRate">VAT Rate (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.vatRate}
                  onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                  placeholder="11"
                />
                <p className="text-xs text-muted-foreground mt-1">Value Added Tax percentage applied to invoices (e.g., 5 for UAE, 11 for Lebanon, 20 for UK)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end items-center">
          <Button
            onClick={handleSubmit}
            disabled={updateProfile.isPending || uploading}
          >
            {(updateProfile.isPending || uploading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
