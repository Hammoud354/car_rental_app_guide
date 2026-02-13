import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, FileText, Users, BarChart3, Wrench, DollarSign, 
  Clock, Shield, Zap, Check, ArrowRight, MessageCircle,
  LogIn, UserPlus
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  
  const fadingTexts = [
    "Streamline your rental operations with ease",
    "Track every vehicle, contract, and client in one place",
    "Make data-driven decisions with real-time analytics",
    "Built for agencies who demand efficiency and control"
  ];

  // Fading text animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % fadingTexts.length);
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
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Car Rental Management System</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleContactUs}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
            <Link href="/login">
              <Button variant="outline">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Button onClick={handleSignUp}>
              <UserPlus className="h-4 w-4 mr-2" />
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Fading Text */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <Badge variant="outline" className="px-4 py-1.5">
            <Zap className="h-3 w-3 mr-1.5" />
            Professional Fleet Management Software
          </Badge>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Car Rental
            <br />
            <span className="text-primary">Management System</span>
          </h1>
          
          {/* Fading Text Animation */}
          <div className="h-16 flex items-center justify-center">
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl transition-opacity duration-1000 animate-in fade-in">
              {fadingTexts[currentTextIndex]}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/demo">
              <Button size="lg" className="text-lg px-8">
                See Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8" onClick={handleContactUs}>
              <MessageCircle className="mr-2 h-5 w-5" />
              Contact Us
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            <Clock className="inline h-4 w-4 mr-1" />
            Try our 10-minute demo with full access to dummy data
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Manage Your Fleet</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed specifically for car rental agencies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Car,
              title: "Fleet Management",
              description: "Track all your vehicles, availability, and maintenance schedules in one centralized dashboard"
            },
            {
              icon: FileText,
              title: "Contract Management",
              description: "Create, modify, and track rental contracts with automated reminders and expiry notifications"
            },
            {
              icon: Users,
              title: "Client Database",
              description: "Maintain comprehensive client records with rental history and contact information"
            },
            {
              icon: DollarSign,
              title: "P&L Analysis",
              description: "Track profitability per vehicle with detailed revenue, costs, and maintenance expenses"
            },
            {
              icon: BarChart3,
              title: "Analytics & Insights",
              description: "Real-time dashboards showing utilization rates, revenue trends, and performance metrics"
            },
            {
              icon: Wrench,
              title: "Maintenance Tracking",
              description: "Log repairs, schedule maintenance, and track costs to keep your fleet in top condition"
            }
          ].map((feature, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-16 md:py-24 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business size and needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$50</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-2">Perfect for small agencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {[
                  "Up to 15 vehicles",
                  "Unlimited contracts",
                  "Up to 100 clients",
                  "Basic reporting",
                  "Invoice generation",
                  "WhatsApp integration",
                  "Email support (48h)"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="outline" onClick={handleSignUp}>
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card className="border-primary shadow-lg relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Professional</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$70</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-2">Ideal for growing agencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
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
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={handleSignUp}>
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$85</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-2">For established agencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {[
                  "Unlimited vehicles",
                  "Custom branding",
                  "Multi-location support",
                  "API access",
                  "Custom reports",
                  "WhatsApp automation",
                  "Phone support",
                  "Onboarding call"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="outline" onClick={handleSignUp}>
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center mt-8 text-muted-foreground">
          All plans include a 7-day free trial. No credit card required.
        </p>
      </section>

      {/* CTA Section */}
      <section className="container py-16 md:py-24">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Operations?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Join agencies worldwide who trust our system to manage their fleet efficiently
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/demo">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Try 10-Minute Demo
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10" onClick={handleContactUs}>
                Talk to Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <span className="font-semibold">Car Rental Management System</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button onClick={handleContactUs} className="hover:text-foreground transition-colors">
                Contact Us
              </button>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <button onClick={handleSignUp} className="hover:text-foreground transition-colors">
                Sign Up
              </button>
            </div>
          </div>
          <div className="text-center mt-6 text-sm text-muted-foreground">
            © 2026 Car Rental Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
