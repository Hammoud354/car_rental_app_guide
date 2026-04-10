import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Phone, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
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
    country: "AE",
    countryName: "United Arab Emirates",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const phoneData = useMemo(() => {
    return COUNTRY_PHONE_DATA[formData.country] || { phoneCode: "+1", phoneDigits: 10 };
  }, [formData.country]);

  const phonePlaceholder = useMemo(() => {
    return "X".repeat(phoneData.phoneDigits);
  }, [phoneData]);

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      toast.success("Account created! Sign in to select your plan.");
      const countryData = getCountryData(formData.country);
      if (countryData) {
        localStorage.setItem('pendingCountryData', JSON.stringify(countryData));
      }
      localStorage.setItem('signupCountry', formData.country);
      localStorage.setItem('signupCountryName', formData.countryName);
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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col justify-between p-12 w-full">
          <Link href="/">
            <AnimatedLogo size="lg" darkBg />
          </Link>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
                Start managing your<br />fleet today.
              </h2>
              <p className="text-gray-400 text-base leading-relaxed max-w-sm">
                Create your account and start managing your fleet with full access to all features.
              </p>
            </div>
            <div className="space-y-4">
              {[
                "Full fleet & contract management",
                "Automated invoicing & P&L tracking",
                "AI-powered maintenance predictions",
                "Multi-language support"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} FleetMaster. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-sm py-6">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-6 text-center">
            <Link href="/">
              <AnimatedLogo size="lg" />
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Username</Label>
                <Input
                  type="text"
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  required
                  minLength={3}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Full Name</Label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Email</Label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Country</Label>
              <Select value={formData.country} onValueChange={handleCountryChange}>
                <SelectTrigger className="h-10 text-sm">
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

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 bg-gray-50 border rounded-md text-sm font-medium text-gray-600 whitespace-nowrap min-w-[65px] justify-center h-10" style={{ borderColor: '#1e3a8a', borderWidth: '1.5px' }}>
                  <Phone className="h-3 w-3 text-gray-400" />
                  {phoneData.phoneCode}
                </div>
                <Input
                  type="tel"
                  placeholder={phonePlaceholder}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
                  maxLength={phoneData.phoneDigits}
                  className="h-10 text-sm flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 chars"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                    className="h-10 text-sm pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Confirm</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                    className="h-10 text-sm pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 mt-2"
              disabled={signUpMutation.isPending}
            >
              {signUpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => setLocation("/signin")}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
