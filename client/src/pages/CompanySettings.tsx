import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Building2, Home } from "lucide-react";

export default function CompanySettings() {
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
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
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
      });
      if (profile.logoUrl) {
        setLogoPreview(profile.logoUrl);
      }
    }
  }, [profile]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return formData.logoUrl || null;

    try {
      setUploading(true);
      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = logoFile.name.split('.').pop();
      const fileName = `company-logo-${timestamp}.${fileExtension}`;
      
      // Upload to S3 using tRPC mutation
      const { url } = await uploadLogoMutation.mutateAsync({
        fileName,
        fileData: Array.from(buffer),
        contentType: logoFile.type,
      });
      
      return url;
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Upload logo if changed
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      await updateProfile.mutateAsync({
        ...formData,
        logoUrl,
      });

      toast({
        title: "Success",
        description: "Company profile updated successfully!",
      });

      refetch();
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
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Company Settings
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation('/dashboard')}
            title="Go to Dashboard"
          >
            <Home className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-muted-foreground mt-2">
          Configure your company branding and information that will appear on contracts and documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
            <CardDescription>
              Upload your company logo. This will appear on all contracts and documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              {logoPreview ? (
                <div className="w-32 h-32 border-2 border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <img src={logoPreview} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
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
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
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
              <div className="col-span-2">
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

        <div className="flex justify-end items-center">
          <Button
            type="submit"
            disabled={updateProfile.isPending || uploading}
          >
            {(updateProfile.isPending || uploading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
