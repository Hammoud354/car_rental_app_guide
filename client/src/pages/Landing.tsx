import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { Car, FileText, BarChart3, Shield, Clock, Users } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  
  // Sign In state
  const [signInUsername, setSignInUsername] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  
  // Sign Up state
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpCountryCode, setSignUpCountryCode] = useState("+961");
  const [signUpCountry, setSignUpCountry] = useState("Lebanon");
  const [signUpError, setSignUpError] = useState("");
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      setAuthDialogOpen(false);
      setLocation("/dashboard");
    },
    onError: (err) => {
      setSignInError(err.message);
    },
  });

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      setAuthDialogOpen(false);
      setLocation("/dashboard");
    },
    onError: (err) => {
      try {
        const errorData = JSON.parse(err.message);
        if (Array.isArray(errorData)) {
          const fieldErrors = errorData.map((e: any) => {
            const field = e.path?.[0] || 'Field';
            return `${field}: ${e.message}`;
          }).join(', ');
          setSignUpError(fieldErrors);
        } else {
          setSignUpError(err.message);
        }
      } catch {
        setSignUpError(err.message);
      }
    },
  });

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");
    loginMutation.mutate({ username: signInUsername, password: signInPassword });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError("");
    signUpMutation.mutate({
      username: signUpUsername,
      password: signUpPassword,
      name: signUpName,
      email: signUpEmail,
      phone: signUpPhone,
      countryCode: signUpCountryCode,
      country: signUpCountry,
    });
  };

  const countryCodes = [
    { code: "+1", name: "USA/Canada" },
    { code: "+961", name: "Lebanon" },
    { code: "+971", name: "UAE" },
    { code: "+966", name: "Saudi Arabia" },
    { code: "+20", name: "Egypt" },
    { code: "+962", name: "Jordan" },
  ];

  const countries = [
    "Lebanon",
    "United Arab Emirates",
    "United States",
    "Saudi Arabia",
    "Egypt",
    "Jordan",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-8 w-8 text-gray-900" />
            <span className="text-xl font-semibold text-gray-900">Rental.OS</span>
          </div>
          
          <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                Sign In / Sign Up
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Welcome to Rental.OS</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-username">Username</Label>
                      <Input
                        id="signin-username"
                        type="text"
                        value={signInUsername}
                        onChange={(e) => setSignInUsername(e.target.value)}
                        placeholder="Enter username"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                      />
                    </div>

                    {signInError && (
                      <p className="text-sm text-red-600">{signInError}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full bg-gray-900 hover:bg-gray-800"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username">Username</Label>
                      <Input
                        id="signup-username"
                        type="text"
                        value={signUpUsername}
                        onChange={(e) => setSignUpUsername(e.target.value)}
                        placeholder="Choose a username"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <div className="flex gap-2">
                        <Select value={signUpCountryCode} onValueChange={setSignUpCountryCode}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countryCodes.map((cc) => (
                              <SelectItem key={cc.code} value={cc.code}>
                                {cc.code} {cc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="tel"
                          value={signUpPhone}
                          onChange={(e) => setSignUpPhone(e.target.value)}
                          placeholder="Phone number"
                          required
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Country (Where will you manage your fleet?)</Label>
                      <Select value={signUpCountry} onValueChange={setSignUpCountry}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {signUpError && (
                      <p className="text-sm text-red-600">{signUpError}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={signUpMutation.isPending}
                      className="w-full bg-gray-900 hover:bg-gray-800"
                    >
                      {signUpMutation.isPending ? "Creating account..." : "Sign up"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Fleet Management<br />for Modern Agencies
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Streamline your rental operations with comprehensive vehicle tracking,
              contract management, and real-time analytics. Built for agencies who
              demand efficiency and control.
            </p>
            <Button 
              size="lg" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg"
              onClick={() => setAuthDialogOpen(true)}
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <Car className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fleet Control</h3>
              <p className="text-gray-600">
                Track vehicle status, maintenance schedules, and insurance expiry dates
                in one centralized dashboard.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <FileText className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Contract Management</h3>
              <p className="text-gray-600">
                Generate rental contracts, track payments, and manage client relationships
                with automated workflows.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <BarChart3 className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
              <p className="text-gray-600">
                Monitor revenue, vehicle profitability, and operational metrics with
                real-time reporting.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <Shield className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with role-based access control and automatic
                data backups.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <Clock className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Time-Saving Automation</h3>
              <p className="text-gray-600">
                Automate routine tasks like contract generation, payment reminders,
                and maintenance alerts.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <Users className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Client Management</h3>
              <p className="text-gray-600">
                Maintain comprehensive client profiles with rental history, documents,
                and communication logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to transform your fleet operations?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join agencies worldwide who trust Rental.OS to manage their fleet efficiently.
          </p>
          <Button 
            size="lg" 
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg"
            onClick={() => setAuthDialogOpen(true)}
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>© 2026 Rental.OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
