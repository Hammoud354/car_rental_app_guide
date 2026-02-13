import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, FileText, Users, BarChart3, Wrench, DollarSign, 
  Clock, Check, ArrowRight, MessageCircle,
  LogIn, UserPlus
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  
  const fadingTexts = [
    "Streamline your rental operations with ease",
    "Track every vehicle, contract, and client in one place",
    "Make data-driven decisions with real-time analytics",
    "Built for agencies who demand efficiency and control"
  ];

  // Enhanced fading text animation with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentTextIndex((prev) => (prev + 1) % fadingTexts.length);
        setIsAnimating(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleContactUs = () => {
    const message = encodeURIComponent(
      "Hello! I'm interested in learning more about the Car Rental Management System.\n\n" +
      "Please tell me about:\n" +
      "1. My business name:\n" +
      "2. Number of vehicles I manage:\n" +
      "3. Monthly rental volume:\n" +
      "4. Specific features I need:\n"
    );
    window.open(`https://wa.me/96176354131?text=${message}`, "_blank");
  };

  const handleSignUp = () => {
    const message = encodeURIComponent(
      "Hello! I'd like to sign up for the Car Rental Management System.\n\n" +
      "My details:\n" +
      "1. Company name:\n" +
      "2. Number of vehicles:\n" +
      "3. Monthly rental volume:\n" +
      "4. Interested in tier: (Starter $50 / Professional $70 / Enterprise $85)\n" +
      "5. Specific features needed:\n" +
      "6. Preferred payment method:\n"
    );
    window.open(`https://wa.me/96176354131?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <span className="font-semibold">Car Rental Management</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleContactUs}>
              <MessageCircle className="h-4 w-4 mr-1.5" />
              Contact
            </Button>
            <Link href="/login">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-1.5" />
                Sign In
              </Button>
            </Link>
            <Button size="sm" onClick={handleSignUp}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Enhanced Fading Text */}
      <section className="container py-10 md:py-12">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
            Car Rental
            <br />
            <span className="text-primary">Management System</span>
          </h1>
          
          {/* Enhanced Fading Text Animation */}
          <div className="h-20 flex items-center justify-center">
            <p 
              className={`text-lg md:text-xl text-muted-foreground max-w-2xl transition-all duration-700 ${
                isAnimating 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-4 scale-95'
              }`}
            >
              {fadingTexts[currentTextIndex]}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link href="/demo">
              <Button size="lg" className="text-base px-6 group">
                See Demo
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-base px-6" onClick={handleContactUs}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Us
            </Button>
          </div>

          <p className="text-sm text-muted-foreground animate-in fade-in duration-700 delay-500">
            <Clock className="inline h-4 w-4 mr-1" />
            Try our 10-minute demo with full access
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-8 md:py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything You Need</h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed for car rental agencies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Car,
              title: "Fleet Management",
              description: "Track all vehicles, availability, and maintenance schedules in one place"
            },
            {
              icon: FileText,
              title: "Contract Management",
              description: "Create and track rental contracts with automated notifications"
            },
            {
              icon: Users,
              title: "Client Database",
              description: "Maintain comprehensive client records with rental history"
            },
            {
              icon: DollarSign,
              title: "P&L Analysis",
              description: "Track profitability per vehicle with detailed revenue and costs"
            },
            {
              icon: BarChart3,
              title: "Analytics & Insights",
              description: "Real-time dashboards showing utilization and revenue trends"
            },
            {
              icon: Wrench,
              title: "Maintenance Tracking",
              description: "Log repairs, schedule maintenance, and track costs"
            }
          ].map((feature, i) => (
            <Card 
              key={i} 
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardHeader className="pb-2 pt-4">
                <feature.icon className="h-8 w-8 text-primary mb-1.5" />
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <CardDescription className="text-sm">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-8 md:py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Simple Pricing</h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="text-lg">Starter</CardTitle>
              <div className="mt-2">
                <span className="text-2xl font-bold">$50</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-0.5 text-sm">For small agencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-5 flex-1 flex flex-col">
              <ul className="space-y-2.5 flex-1">
                {[
                  "Up to 15 vehicles",
                  "Unlimited contracts",
                  "Up to 100 clients",
                  "Basic reporting",
                  "Invoice generation",
                  "WhatsApp integration",
                  "Email support (48h)"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-4" variant="outline" onClick={handleSignUp}>
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card className="border-primary shadow-lg relative animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="text-lg">Professional</CardTitle>
              <div className="mt-2">
                <span className="text-2xl font-bold">$70</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-0.5 text-sm">For growing agencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-5 flex-1 flex flex-col">
              <ul className="space-y-2.5 flex-1">
                {[
                  "Up to 50 vehicles",
                  "Unlimited clients",
                  "P&L analysis",
                  "Advanced analytics",
                  "Damage inspection",
                  "Contract amendments",
                  "Excel export",
                  "Priority support (24h)"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-4" onClick={handleSignUp}>
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col delay-200">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="text-lg">Enterprise</CardTitle>
              <div className="mt-2">
                <span className="text-2xl font-bold">$85</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-0.5 text-sm">For large agencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-5 flex-1 flex flex-col">
              <ul className="space-y-2.5 flex-1">
                {[
                  "Unlimited vehicles",
                  "Unlimited clients",
                  "Multi-user access",
                  "Custom reports",
                  "API access",
                  "White-label option",
                  "Dedicated account manager",
                  "24/7 priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-4" onClick={handleSignUp}>
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Redesigned CTA Section */}
      <section className="container py-16 md:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
          <div className="relative px-6 py-12 md:py-16 text-center">
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-2">
                <span className="text-sm font-medium text-primary">Start Your Journey</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Transform Your
                <br />
                <span className="text-primary">Rental Operations?</span>
              </h2>
              
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                Join agencies worldwide who trust our platform to streamline their operations and boost profitability
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link href="/demo">
                  <Button size="lg" className="text-base px-8 group">
                    Try Demo Now
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-base px-8" onClick={handleContactUs}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Talk to Us
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                No credit card required • 10-minute demo • Full feature access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 Car Rental Management System. All rights reserved.</p>
          <p className="mt-2">Built for agencies who demand efficiency and control.</p>
        </div>
      </footer>
    </div>
  );
}
