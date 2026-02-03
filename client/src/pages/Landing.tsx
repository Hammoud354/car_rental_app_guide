import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { Car, FileText, BarChart3, Zap } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  
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
  const [signUpCountryCode, setSignUpCountryCode] = useState("+961"); // Default to Lebanon
  const [signUpCountry, setSignUpCountry] = useState("Lebanon");
  const [signUpError, setSignUpError] = useState("");
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      setLocation("/dashboard");
    },
    onError: (err) => {
      setSignInError(err.message);
    },
  });

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      // After successful sign-up, automatically log in
      setLocation("/dashboard");
    },
    onError: (err) => {
      setSignUpError(err.message);
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
    { code: "+44", name: "UK" },
    { code: "+33", name: "France" },
    { code: "+49", name: "Germany" },
  ];

  const countries = [
    "Lebanon",
    "United Arab Emirates",
    "United States",
    "Saudi Arabia",
    "Egypt",
    "Jordan",
    "United Kingdom",
    "France",
    "Germany",
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 opacity-60" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Fade in animation */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-7xl md:text-8xl font-semibold tracking-tight mb-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
              Fleet Management.
              <br />
              Reimagined.
            </h1>
          </div>
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto font-light">
              A powerful platform designed for rental agencies to streamline operations, manage contracts, and track fleet performance.
            </p>
          </div>

          {/* Sign In / Sign Up Tabs */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <Card className="max-w-md mx-auto p-8 bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-2xl">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                {/* Sign In Tab */}
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="signin-username" className="text-sm font-medium text-gray-700">
                        Username
                      </Label>
                      <Input
                        id="signin-username"
                        type="text"
                        value={signInUsername}
                        onChange={(e) => setSignInUsername(e.target.value)}
                        placeholder="Enter username"
                        className="h-12 bg-white border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter password"
                        className="h-12 bg-white border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        required
                      />
                    </div>

                    {signInError && (
                      <p className="text-sm text-red-600 text-center">{signInError}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-all duration-200"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>
                
                {/* Sign Up Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username" className="text-sm font-medium text-gray-700">
                        Username
                      </Label>
                      <Input
                        id="signup-username"
                        type="text"
                        value={signUpUsername}
                        onChange={(e) => setSignUpUsername(e.target.value)}
                        placeholder="Choose a username"
                        className="h-12 bg-white border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create a password"
                        className="h-12 bg-white border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium text-gray-700">
                        Full Name
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Enter your full name"
                        className="h-12 bg-white border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="h-12 bg-white border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <div className="flex gap-2">
                        <Select value={signUpCountryCode} onValueChange={setSignUpCountryCode}>
                          <SelectTrigger className="w-32 h-12 bg-white border-gray-300">
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
                          id="signup-phone"
                          type="tel"
                          value={signUpPhone}
                          onChange={(e) => setSignUpPhone(e.target.value)}
                          placeholder="1234567890"
                          className="h-12 flex-1 bg-white border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-country" className="text-sm font-medium text-gray-700">
                        Country (Where will you manage your fleet?)
                      </Label>
                      <Select value={signUpCountry} onValueChange={setSignUpCountry}>
                        <SelectTrigger className="h-12 bg-white border-gray-300">
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
                      <p className="text-sm text-red-600 text-center">{signUpError}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={signUpMutation.isPending}
                      className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-all duration-200"
                    >
                      {signUpMutation.isPending ? "Creating account..." : "Sign up"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-gray-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
            <div className="animate-in fade-in slide-in-from-left duration-1000">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6">
                <Car className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-5xl font-semibold mb-6 tracking-tight">
                Fleet at your fingertips.
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed font-light">
                Track every vehicle in real-time. Monitor status, maintenance schedules, and availability with intuitive dashboards designed for efficiency.
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-right duration-1000">
              <div className="aspect-video rounded-3xl bg-gradient-to-br from-blue-100 to-blue-50 shadow-2xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
            <div className="order-2 md:order-1 animate-in fade-in slide-in-from-left duration-1000">
              <div className="aspect-video rounded-3xl bg-gradient-to-br from-purple-100 to-purple-50 shadow-2xl" />
            </div>
            <div className="order-1 md:order-2 animate-in fade-in slide-in-from-right duration-1000">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 mb-6">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-5xl font-semibold mb-6 tracking-tight">
                Contracts made simple.
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed font-light">
                Create, manage, and track rental agreements effortlessly. Digital contracts with automated workflows keep your operations running smoothly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="animate-in fade-in slide-in-from-left duration-1000">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 mb-6">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-5xl font-semibold mb-6 tracking-tight">
                Insights that matter.
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed font-light">
                Make data-driven decisions with comprehensive analytics. Track revenue, utilization rates, and operational metrics in real-time.
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-right duration-1000">
              <div className="aspect-video rounded-3xl bg-gradient-to-br from-green-100 to-green-50 shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Performance Section */}
      <section className="py-32 px-6 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="animate-in fade-in slide-in-from-bottom duration-1000">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl mb-6">
              <Zap className="h-8 w-8" />
            </div>
            <h2 className="text-6xl font-semibold mb-6 tracking-tight">
              Built for speed.
            </h2>
            <p className="text-2xl text-gray-400 mb-16 font-light">
              Lightning-fast performance meets intuitive design. Manage your entire fleet operation without compromise.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20">
              <div className="space-y-2">
                <div className="text-5xl font-semibold">10x</div>
                <div className="text-gray-400 font-light">Faster workflows</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-semibold">100%</div>
                <div className="text-gray-400 font-light">Digital contracts</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-semibold">24/7</div>
                <div className="text-gray-400 font-light">Real-time tracking</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© 2026 Rental.OS. Fleet management reimagined.</p>
        </div>
      </footer>
    </div>
  );
}
