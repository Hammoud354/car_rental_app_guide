import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, User, Mail, Phone, Lock, MapPin } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    phone: "",
    countryCode: "+1",
    country: "United States",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      // Redirect to dashboard after successful registration
      setLocation("/dashboard");
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    signUpMutation.mutate({
      username: formData.username,
      password: formData.password,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      countryCode: formData.countryCode,
      country: formData.country,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 input-client">
      <Card className="w-full max-w-2xl shadow-2xl input-client">
        <CardHeader className="space-y-3 text-center input-client">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center input-client">
            <Building2 className="w-8 h-8 text-primary input-client" />
          </div>
          <CardTitle className="text-3xl font-bold input-client">Create Your Account</CardTitle>
          <CardDescription className="text-base input-client">
            Register your company to start managing your car rental operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 input-client">
            {errors.submit && (
              <Alert variant="destructive">
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 input-client">
              {/* Company Name */}
              <div className="space-y-2 md:col-span-2 input-client">
                <Label htmlFor="name" className="flex items-center gap-2 input-client">
                  <Building2 className="w-4 h-4 input-client" />
                  Company Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Company Ltd."
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive input-client">{errors.name}</p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2 input-client">
                <Label htmlFor="username" className="flex items-center gap-2 input-client">
                  <User className="w-4 h-4 input-client" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  className={errors.username ? "border-destructive" : ""}
                />
                {errors.username && (
                  <p className="text-sm text-destructive input-client">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2 input-client">
                <Label htmlFor="email" className="flex items-center gap-2 input-client">
                  <Mail className="w-4 h-4 input-client" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="company@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive input-client">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2 input-client">
                <Label htmlFor="phone" className="flex items-center gap-2 input-client">
                  <Phone className="w-4 h-4 input-client" />
                  Phone Number
                </Label>
                <div className="flex gap-2 input-client">
                  <Input
                    id="countryCode"
                    type="text"
                    placeholder="+1"
                    value={formData.countryCode}
                    onChange={(e) => handleChange("countryCode", e.target.value)}
                    className="w-20 input-client"
                  />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="1234567890"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className={`flex-1 ${errors.phone ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive input-client">{errors.phone}</p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2 input-client">
                <Label htmlFor="country" className="flex items-center gap-2 input-client">
                  <MapPin className="w-4 h-4 input-client" />
                  Country
                </Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="United States"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="space-y-2 input-client">
                <Label htmlFor="password" className="flex items-center gap-2 input-client">
                  <Lock className="w-4 h-4 input-client" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive input-client">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 input-client">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 input-client">
                  <Lock className="w-4 h-4 input-client" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive input-client">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold input-client"
              disabled={signUpMutation.isPending}
            >
              {signUpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin input-client" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground input-client">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="text-primary hover:underline font-medium input-client"
              >
                Sign in
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
