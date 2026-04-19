import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";
import { 
  ArrowRight, MessageCircle, Globe, ChevronRight,
  LogIn, UserPlus, CheckCircle2, Star, BarChart3, FileText, 
  Users, DollarSign, Wrench, Car, Clock, TrendingUp,
  Activity, Phone, Mail, Menu, X
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [isInView, target]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

const features = [
  { icon: Car, titleKey: "landing.features.fleet.title", descKey: "landing.features.fleet.desc", accent: "bg-blue-600" },
  { icon: FileText, titleKey: "landing.features.contracts.title", descKey: "landing.features.contracts.desc", accent: "bg-indigo-600" },
  { icon: Users, titleKey: "landing.features.clients.title", descKey: "landing.features.clients.desc", accent: "bg-violet-600" },
  { icon: DollarSign, titleKey: "landing.features.financials.title", descKey: "landing.features.financials.desc", accent: "bg-emerald-600" },
  { icon: Wrench, titleKey: "landing.features.maintenance.title", descKey: "landing.features.maintenance.desc", accent: "bg-amber-600" },
  { icon: BarChart3, titleKey: "landing.features.intelligence.title", descKey: "landing.features.intelligence.desc", accent: "bg-rose-600" },
];

const stats = [
  { value: 10000, suffix: "+", labelKey: "landing.stats.vehiclesManaged", icon: Car },
  { value: 99, suffix: ".9%", labelKey: "landing.stats.systemUptime", icon: Activity },
  { value: 200, suffix: "+", labelKey: "landing.stats.rentalAgencies", icon: Globe },
  { value: 15, suffix: "M+", prefix: "$", labelKey: "landing.stats.revenueTracked", icon: TrendingUp },
];

const testimonials = [
  {
    name: "Ahmad Al-Hassan",
    role: "Managing Director",
    company: "Gulf Auto Rentals, UAE",
    text: "FleetWizards transformed our operations. We went from spreadsheets to managing 300+ vehicles with complete visibility. Revenue grew 40% in the first year.",
    avatar: "AH",
  },
  {
    name: "Sarah Mitchell",
    role: "CEO",
    company: "DriveEasy Rentals, UK",
    text: "The per-vehicle P&L tracking alone justified the investment. We identified unprofitable units and optimized our fleet — saving $120K annually.",
    avatar: "SM",
  },
  {
    name: "Mohammed Al-Rashid",
    role: "Operations Director",
    company: "Royal Cars, KSA",
    text: "From contract generation to invoice automation, everything is seamless. Our team spends 60% less time on paperwork now.",
    avatar: "MR",
  },
];

const plans = [
  {
    name: "Starter",
    price: "49",
    period: "/month",
    description: "For small agencies getting started",
    features: [
      "Up to 15 vehicles",
      "Unlimited contracts",
      "Up to 100 clients",
      "Basic analytics",
      "Invoice generation",
      "Email support",
    ],
    popular: false,
    ctaKey: "auth.signUp"
  },
  {
    name: "Professional",
    price: "79",
    period: "/month",
    description: "For growing agencies that need more power",
    features: [
      "Up to 50 vehicles",
      "Unlimited clients",
      "Advanced P&L analytics",
      "AI maintenance predictions",
      "Damage inspection tools",
      "Contract amendments",
      "Excel & PDF exports",
      "Priority support",
    ],
    popular: true,
    ctaKey: "auth.signUp"
  },
  {
    name: "Enterprise",
    price: "129",
    period: "/month",
    description: "For large fleets with complex operations",
    features: [
      "Unlimited vehicles",
      "Multi-user access & roles",
      "Custom reporting",
      "API access",
      "White-label option",
      "WhatsApp integration",
      "Dedicated account manager",
      "24/7 priority support",
    ],
    popular: false,
    ctaKey: "landing.pricing.contactSales"
  },
];

export default function Home() {
  const { t } = useTranslation();
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const isSuperAdmin = user?.role === "super_admin";

  const { data: currentPlan, isLoading: planLoading } = trpc.subscription.getCurrentPlan.useQuery(undefined, {
    enabled: isAuthenticated && !isSuperAdmin,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isSuperAdmin) {
      setLocation("/dashboard");
      return;
    }
    if (planLoading) return;
    if (currentPlan?.status === "active") {
      setLocation("/dashboard");
    }
    // No redirect for users without a subscription — let them see the landing page
  }, [isAuthenticated, loading, isSuperAdmin, currentPlan, planLoading, setLocation]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleContactUs = () => {
    const message = encodeURIComponent(
      "Hello! I'm interested in learning more about FleetWizards.\n\n" +
      "Please share:\n" +
      "1. Business name:\n" +
      "2. Fleet size:\n" +
      "3. Features needed:\n"
    );
    window.open(`https://wa.me/96176354131?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full"
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
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100" 
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          {/* Logo */}
          <button onClick={() => scrollTo("home")} className="flex-shrink-0">
            <AnimatedLogo size="md" showSubtext />
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { labelKey: "landing.nav.home", id: "home" },
              { labelKey: "landing.nav.aboutUs", id: "about" },
              { labelKey: "landing.nav.features", id: "features" },
              { labelKey: "landing.nav.contact", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors"
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>

          {/* Right: language selector + auth buttons + hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector compact />
            <Link href="/signin">
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-md shadow-emerald-700/20 px-5">
                <LogIn className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{t("auth.signIn")}</span>
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 font-medium px-5 text-sm">
                <span>{t("auth.signUp")}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 py-3 space-y-1">
            {[
              { labelKey: "landing.nav.home", id: "home" },
              { labelKey: "landing.nav.aboutUs", id: "about" },
              { labelKey: "landing.nav.features", id: "features" },
              { labelKey: "landing.nav.contact", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-blue-50/80 via-white to-white rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-indigo-50/60 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">{t("landing.hero.badge")}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6"
            >
              {t("landing.hero.titlePart1")}{" "}
              <br className="hidden sm:block" />
              {t("landing.hero.titleFor")}{" "}
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                {t("landing.hero.titleHighlight")}
              </span>{" "}
              {t("landing.hero.titlePart2")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {t("landing.hero.subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
            >
              <Link href="/signin">
                <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-emerald-700/25 group">
                  <LogIn className="h-4 w-4 mr-2" />
                  {t("auth.signIn")}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 px-8 h-12 text-base font-semibold group">
                  {t("auth.signUp")}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button 
                  size="lg" 
                  className="bg-red-800 hover:bg-red-900 text-white px-8 h-12 text-base font-bold shadow-lg shadow-red-900/30 group"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {t("auth.tryDemo")}
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xs text-gray-400 flex items-center justify-center gap-4"
            >
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> {t("landing.hero.freeDemo")}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> {t("landing.hero.payWhish")}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> {t("landing.hero.cancelAnytime")}</span>
            </motion.p>

          </div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="mt-16 mx-auto max-w-5xl"
          >
            <div className="relative rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-2xl shadow-gray-200/50 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100/80 border-b border-gray-200">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="flex-1 mx-8">
                  <div className="h-5 bg-white rounded-md border border-gray-200 max-w-xs mx-auto flex items-center justify-center">
                    <span className="text-[10px] text-gray-500 font-semibold tracking-wide">FleetWizards</span>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Fleet", value: "127", change: "+12%", color: "text-blue-600" },
                    { label: "Active Rentals", value: "89", change: "+8%", color: "text-emerald-600" },
                    { label: "Monthly Revenue", value: "$48.5K", change: "+23%", color: "text-violet-600" },
                    { label: "Fleet Utilization", value: "94%", change: "+5%", color: "text-amber-600" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-100 p-4">
                      <p className="text-xs text-gray-400 font-medium mb-1">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-xs font-semibold ${stat.color} mt-1`}>{stat.change} this month</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 bg-white rounded-lg border border-gray-100 p-4 h-40">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Revenue Trend</p>
                    <div className="flex items-end gap-1.5 h-24">
                      {[35, 45, 38, 55, 48, 62, 58, 70, 65, 78, 72, 85].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}%` }}
                          className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-100 p-4 h-40">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Fleet Status</p>
                    <div className="space-y-2.5 mt-2">
                      {[
                        { label: "Available", pct: 35, color: "bg-emerald-500" },
                        { label: "Rented", pct: 55, color: "bg-blue-500" },
                        { label: "Maintenance", pct: 10, color: "bg-amber-500" },
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                            <span>{item.label}</span>
                            <span>{item.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${item.pct}%` }}
                              className={`h-full ${item.color} rounded-full`}
                            />
                          </div>
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

      {/* About Us Section */}
      <section id="about" className="py-20 lg:py-28 bg-gradient-to-br from-blue-50/40 to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">{t("landing.about.badge")}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              {t("landing.about.title")}
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              {t("landing.about.description")}
            </p>
          </AnimatedSection>
          <AnimatedSection>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                    <CountUp target={stat.value} suffix={stat.suffix} prefix={stat.prefix || ""} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{t(stat.labelKey)}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                    <CountUp target={stat.value} suffix={stat.suffix} prefix={stat.prefix || ""} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{t(stat.labelKey)}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">{t("landing.features.badge")}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              {t("landing.features.title")}
            </h2>
            <p className="text-gray-500 text-lg">
              {t("landing.features.subtitle")}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <AnimatedSection key={i} delay={i * 0.08}>
                <div className="group relative p-6 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300">
                  <div className={`w-10 h-10 rounded-lg ${feature.accent} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{t(feature.descKey)}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">{t("landing.howItWorks.badge")}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              {t("landing.howItWorks.title")}
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", titleKey: "landing.howItWorks.step1.title", descKey: "landing.howItWorks.step1.desc", icon: UserPlus },
              { step: "02", titleKey: "landing.howItWorks.step2.title", descKey: "landing.howItWorks.step2.desc", icon: Car },
              { step: "03", titleKey: "landing.howItWorks.step3.title", descKey: "landing.howItWorks.step3.desc", icon: TrendingUp },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.15}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm mb-5">
                    <item.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-2">{t("landing.howItWorks.stepLabel")} {item.step}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t(item.titleKey)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(item.descKey)}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">{t("landing.testimonials.badge")}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              {t("landing.testimonials.title")}
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="p-6 rounded-xl border border-gray-100 bg-white h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-5">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-400">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 lg:py-28 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">{t("landing.pricing.badge")}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              {t("landing.pricing.title")}
            </h2>
            <p className="text-gray-500 text-lg">
              {t("landing.pricing.subtitle")}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className={`relative rounded-xl border p-6 h-full flex flex-col ${
                  plan.popular 
                    ? "border-blue-200 bg-white shadow-xl shadow-blue-100/50 ring-1 ring-blue-100" 
                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md transition-all"
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full tracking-wide uppercase">
                        {t("landing.pricing.mostPopular")}
                      </span>
                    </div>
                  )}
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{plan.description}</p>
                  </div>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                    <span className="text-sm text-gray-400 font-medium">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button
                      className={`w-full h-11 font-semibold ${
                        plan.popular
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {t(plan.ctaKey)}
                    </Button>
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="relative rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 p-10 sm:p-16 text-center overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                  {t("landing.cta.title")}
                </h2>
                <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
                  {t("landing.cta.subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/signup">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-blue-600/30">
                      {t("auth.signUp")}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button 
                      size="lg" 
                      className="bg-red-800 hover:bg-red-900 text-white px-8 h-12 text-base font-bold shadow-lg shadow-red-900/30"
                    >
                      {t("auth.tryDemo")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 lg:py-28 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">{t("landing.contact.badge")}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              {t("landing.contact.title")}
            </h2>
            <p className="text-gray-500 text-lg">
              {t("landing.contact.subtitle")}
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Phone */}
              <a
                href="tel:+96176354131"
                className="flex items-center gap-5 p-6 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t("landing.contact.phoneLabel")}</p>
                  <p className="text-base font-bold text-gray-900">+961 76 354 131</p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:info@fleetwizards.com"
                className="flex items-center gap-5 p-6 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <Mail className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t("landing.contact.emailLabel")}</p>
                  <p className="text-base font-bold text-gray-900">info@fleetwizards.com</p>
                </div>
              </a>
            </div>

            {/* WhatsApp CTA */}
            <div className="mt-8 text-center">
              <button
                onClick={handleContactUs}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-green-600/20 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                {t("landing.contact.whatsapp")}
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <AnimatedLogo size="sm" />
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <button onClick={handleContactUs} className="hover:text-gray-600 transition-colors cursor-pointer">{t("landing.footer.contact")}</button>
              <Link href="/signin"><span className="hover:text-gray-600 transition-colors cursor-pointer">{t("auth.signIn")}</span></Link>
              <Link href="/signup"><span className="hover:text-gray-600 transition-colors cursor-pointer">{t("auth.signUp")}</span></Link>
            </div>
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} FleetWizards. {t("landing.footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
