import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Car, FileText, Users, BarChart3, Wrench, DollarSign, 
  ArrowRight, MessageCircle, Shield, Zap, Globe, ChevronRight,
  LogIn, UserPlus, CheckCircle2, Star
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FloatingShape({ className }: { className: string }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isInView && nodeRef.current) {
      let start = 0;
      const duration = 2000;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        if (nodeRef.current) nodeRef.current.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    }
  }, [isInView, target, suffix]);

  return <span ref={(el) => { (ref as any).current = el; nodeRef.current = el; }}>0{suffix}</span>;
}

const features = [
  {
    icon: Car,
    title: "Fleet Management",
    description: "Real-time tracking of your entire fleet with availability, location, and condition monitoring.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200"
  },
  {
    icon: FileText,
    title: "Smart Contracts",
    description: "Generate, manage, and track rental contracts with automated workflows and digital signatures.",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-600",
    borderColor: "border-violet-200"
  },
  {
    icon: Users,
    title: "Client Portal",
    description: "Comprehensive client database with rental history, preferences, and document management.",
    gradient: "from-emerald-500/10 to-green-500/10",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200"
  },
  {
    icon: DollarSign,
    title: "Financial Analytics",
    description: "Detailed P&L analysis per vehicle, revenue tracking, and profitability dashboards.",
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200"
  },
  {
    icon: BarChart3,
    title: "Real-Time Insights",
    description: "Live dashboards showing fleet utilization, revenue trends, and operational KPIs.",
    gradient: "from-rose-500/10 to-pink-500/10",
    iconColor: "text-rose-600",
    borderColor: "border-rose-200"
  },
  {
    icon: Wrench,
    title: "Maintenance Hub",
    description: "Schedule services, track repair costs, and get AI-powered maintenance predictions.",
    gradient: "from-slate-500/10 to-gray-500/10",
    iconColor: "text-slate-600",
    borderColor: "border-slate-200"
  }
];

const stats = [
  { value: 500, suffix: "+", label: "Vehicles Managed" },
  { value: 98, suffix: "%", label: "Uptime Guarantee" },
  { value: 50, suffix: "+", label: "Agencies Trust Us" },
  { value: 24, suffix: "/7", label: "Support Available" },
];

const testimonials = [
  {
    name: "Ahmad Hassan",
    role: "Fleet Manager, Dubai Auto Rentals",
    text: "FleetMaster transformed how we manage our 200+ vehicle fleet. The automation alone saves us 20 hours per week.",
    rating: 5,
  },
  {
    name: "Sarah Mitchell",
    role: "CEO, EasyRide Lebanon",
    text: "The P&L tracking per vehicle gave us insights we never had before. We increased profitability by 35% in 6 months.",
    rating: 5,
  },
  {
    name: "Mohammed Al-Rashid",
    role: "Operations Director, Royal Cars KSA",
    text: "From contract creation to invoice generation, everything is seamless. The best investment we have made for our agency.",
    rating: 5,
  },
];

const plans = [
  {
    name: "Starter",
    price: "$50",
    description: "Perfect for small agencies just getting started",
    features: [
      "Up to 15 vehicles",
      "Unlimited contracts",
      "Up to 100 clients",
      "Basic reporting",
      "Invoice generation",
      "WhatsApp integration",
      "Email support (48h)"
    ],
    popular: false,
    cta: "Start Free Trial"
  },
  {
    name: "Professional",
    price: "$70",
    description: "For growing agencies that need more power",
    features: [
      "Up to 50 vehicles",
      "Unlimited clients",
      "P&L analysis",
      "Advanced analytics",
      "Damage inspection",
      "Contract amendments",
      "Excel export",
      "Priority support (24h)"
    ],
    popular: true,
    cta: "Start Free Trial"
  },
  {
    name: "Enterprise",
    price: "$85",
    description: "For large agencies with complex needs",
    features: [
      "Unlimited vehicles",
      "Unlimited clients",
      "Multi-user access",
      "Custom reports",
      "API access",
      "White-label option",
      "Dedicated account manager",
      "24/7 priority support"
    ],
    popular: false,
    cta: "Contact Sales"
  },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleContactUs = () => {
    const message = encodeURIComponent(
      "Hello! I'm interested in learning more about FleetMaster.\n\n" +
      "Please tell me about:\n" +
      "1. My business name:\n" +
      "2. Number of vehicles I manage:\n" +
      "3. Monthly rental volume:\n" +
      "4. Specific features I need:\n"
    );
    window.open(`https://wa.me/96176354131?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                FleetMaster
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleContactUs} 
              className="hidden md:inline-flex text-gray-600 hover:text-gray-900"
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              Contact
            </Button>
            <Link href="/signin">
              <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 font-medium">
                <LogIn className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 font-medium px-4">
                <UserPlus className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Get Started</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-100/50 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-50 to-violet-50 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8"
            >
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">The #1 Car Rental Management Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            >
              <span className="text-gray-900">Manage Your Fleet</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 bg-clip-text text-transparent">
                Like Never Before
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              The all-in-one platform to streamline your car rental operations. 
              Track vehicles, manage contracts, and boost profitability with intelligent automation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold shadow-xl shadow-blue-600/25 group rounded-xl">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="px-8 py-6 text-base font-semibold border-gray-200 hover:bg-gray-50 group rounded-xl">
                  <Globe className="mr-2 h-5 w-5 text-gray-400" />
                  Live Demo
                  <ChevronRight className="ml-1 h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-6 text-sm text-gray-400"
            >
              No credit card required &bull; 14-day free trial &bull; Cancel anytime
            </motion.p>
          </div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-16 relative max-w-5xl mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-blue-600/20 rounded-2xl blur-2xl" />
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-white rounded-md border border-gray-200 text-xs text-gray-400">
                    fleetmaster.app/dashboard
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Vehicles", value: "156", change: "+12", color: "blue" },
                    { label: "Active Rentals", value: "89", change: "+5", color: "emerald" },
                    { label: "Monthly Revenue", value: "$45.2K", change: "+18%", color: "violet" },
                    { label: "Utilization", value: "87%", change: "+3%", color: "amber" },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                    >
                      <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">{stat.change}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-100 shadow-sm h-32">
                    <p className="text-xs text-gray-500 mb-3">Revenue Trend</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[40, 55, 45, 60, 50, 70, 65, 80, 75, 85, 90, 95].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 1 + i * 0.05, duration: 0.5 }}
                          className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-sm"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm h-32">
                    <p className="text-xs text-gray-500 mb-3">Fleet Status</p>
                    <div className="space-y-2">
                      {[
                        { label: "Available", pct: 45, color: "bg-emerald-500" },
                        { label: "Rented", pct: 42, color: "bg-blue-500" },
                        { label: "Service", pct: 13, color: "bg-amber-500" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-xs text-gray-600 flex-1">{item.label}</span>
                          <span className="text-xs font-medium text-gray-900">{item.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <AnimatedSection key={i} delay={i * 0.1} className="text-center">
                <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-sm font-medium text-blue-700 mb-4">
              <Shield className="h-3.5 w-3.5" /> Everything You Need
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Powerful Features for
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Modern Agencies</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Every tool you need to run a world-class car rental operation, all in one platform.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <AnimatedSection key={i} delay={i * 0.08}>
                <div className={`group relative p-6 rounded-2xl border ${feature.borderColor} bg-gradient-to-br ${feature.gradient} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full`}>
                  <div className={`w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Trusted by Agencies Worldwide
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              See what fleet managers are saying about FleetMaster
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Choose the plan that fits your business. No hidden fees.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className={`relative rounded-2xl p-6 h-full flex flex-col ${
                  plan.popular 
                    ? "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-600/25 scale-[1.02]" 
                    : "bg-white border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all"
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className={`text-lg font-bold mb-1 ${plan.popular ? "text-white" : "text-gray-900"}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm mb-4 ${plan.popular ? "text-blue-100" : "text-gray-500"}`}>
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-extrabold ${plan.popular ? "text-white" : "text-gray-900"}`}>
                        {plan.price}
                      </span>
                      <span className={`text-sm ${plan.popular ? "text-blue-200" : "text-gray-400"}`}>/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${plan.popular ? "text-blue-200" : "text-blue-600"}`} />
                        <span className={`text-sm ${plan.popular ? "text-blue-50" : "text-gray-600"}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="w-full">
                    <Button className={`w-full py-5 font-semibold rounded-xl ${
                      plan.popular 
                        ? "bg-white text-blue-600 hover:bg-blue-50" 
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 p-10 sm:p-16 text-center">
              <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              </div>
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
                  Ready to Transform Your Fleet Operations?
                </h2>
                <p className="text-lg text-blue-100 mb-10 leading-relaxed">
                  Join hundreds of agencies worldwide who trust FleetMaster to streamline their operations and maximize profitability.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup">
                    <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-6 text-base font-bold shadow-xl group rounded-xl">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" onClick={handleContactUs} className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold rounded-xl">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Talk to Sales
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <Car className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">FleetMaster</span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} FleetMaster. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <button onClick={handleContactUs} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Contact
              </button>
              <Link href="/demo" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Demo
              </Link>
              <Link href="/signin" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
