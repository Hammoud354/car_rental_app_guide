import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save, Loader2, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
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
        title: "Settings saved",
        description: "Your company settings have been updated successfully.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
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
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/">
          <span className="hover:text-foreground cursor-pointer">Overview</span>
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Settings</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Company Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your company information that will appear on rental contracts
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
            <CardDescription>
              Enter the URL of your company logo. This will appear on rental contracts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo">Logo URL</Label>
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
                    alt="Company Logo Preview"
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
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Basic information about your company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="phone">Phone</Label>
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
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxId">Tax ID / Registration Number</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) =>
                    setFormData({ ...formData, taxId: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
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
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>
              Configure the LBP to USD exchange rate for invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="exchangeRate">LBP to USD Exchange Rate</Label>
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
                This rate will be used to convert USD amounts to LBP on all invoices. Current rate: 1 USD = {formData.exchangeRateLbpToUsd.toLocaleString()} LBP
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
            <CardDescription>
              Default terms and conditions for rental contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.termsAndConditions}
              onChange={(e) =>
                setFormData({ ...formData, termsAndConditions: e.target.value })
              }
              rows={8}
              placeholder="Enter your terms and conditions..."
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
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
