import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Phone } from "lucide-react";
import { countries, getCountryData, COUNTRY_PHONE_DATA } from "@shared/countries";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    fullName: "",
    phone: "",
    countryCode: "+971",
    country: "AE",
    countryName: "United Arab Emirates",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const phoneData = useMemo(() => {
    return COUNTRY_PHONE_DATA[formData.country] || { phoneCode: "+1", phoneDigits: 10 };
  }, [formData.country]);

  const phonePlaceholder = useMemo(() => {
    const digits = phoneData.phoneDigits;
    return "X".repeat(digits);
  }, [phoneData]);

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully! Please sign in with your credentials.");
      const countryData = getCountryData(formData.country);
      if (countryData) {
        localStorage.setItem('pendingCountryData', JSON.stringify(countryData));
      }
      setTimeout(() => setLocation("/signin"), 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create account");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const fullPhone = `${phoneData.phoneCode} ${formData.phone}`;

    signUpMutation.mutate({
      username: formData.username,
      password: formData.password,
      name: formData.fullName,
      email: formData.email,
      phone: fullPhone,
      country: formData.country,
      countryName: formData.countryName,
    });
  };

  const handleCountryChange = (value: string) => {
    const country = countries.find(c => c.code === value);
    if (country) {
      setFormData(prev => ({
        ...prev,
        country: country.code,
        countryName: country.name,
        phone: "",
      }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    if (value.length <= phoneData.phoneDigits) {
      setFormData(prev => ({ ...prev, phone: value }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-violet-50 p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-xl border-gray-200">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="text-xl sm:text-2xl">Create Account</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Sign up to get started with FleetMaster
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="username" className="text-xs sm:text-sm">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                required
                minLength={3}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="fullName" className="text-xs sm:text-sm">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="country" className="text-xs sm:text-sm">Country</Label>
              <Select value={formData.country} onValueChange={handleCountryChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 bg-gray-50 border border-[#1e3a8a] rounded-md text-sm font-medium text-gray-700 whitespace-nowrap min-w-[70px] justify-center" style={{ borderWidth: '1.5px' }}>
                  <Phone className="h-3.5 w-3.5 text-gray-500" />
                  {phoneData.phoneCode}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={phonePlaceholder}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
                  maxLength={phoneData.phoneDigits}
                  className="text-sm flex-1"
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {phoneData.phoneCode} followed by {phoneData.phoneDigits} digits
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                  className="pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                  className="pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-4 sm:mt-6 py-2 sm:py-2.5 text-sm sm:text-base"
              disabled={signUpMutation.isPending}
            >
              {signUpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-xs sm:text-sm"
                onClick={() => setLocation("/signin")}
              >
                Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
