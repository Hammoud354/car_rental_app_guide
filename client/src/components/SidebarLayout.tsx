import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, FileText, Wrench, Users, User, LogOut, 
  TrendingUp, CalendarDays, Settings, Receipt, Car,
  PanelLeftClose, PanelLeftOpen, DollarSign, Sparkles, Menu, X, Crown, Wallet, Building2, Paintbrush, Shield
} from "lucide-react";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

interface NavSection {
  label: string;
  displayLabel: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: companyProfile } = trpc.company.getProfile.useQuery();
  const { t } = useTranslation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Signed out successfully");
      window.location.href = "/";
    },
  });

  // All sections expanded by default
  const { data: whiteLabelAccess } = trpc.company.hasWhiteLabelAccess.useQuery();

  // Apply brand colors from company profile as CSS variables
  useEffect(() => {
    if (companyProfile?.primaryColor) {
      const hex = companyProfile.primaryColor;
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      document.documentElement.style.setProperty("--primary", `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`);
    }
  }, [companyProfile?.primaryColor]);

  // Apply favicon dynamically when branding changes
  useEffect(() => {
    const faviconUrl = (companyProfile as any)?.faviconUrl;
    if (faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [(companyProfile as any)?.faviconUrl]);

  // Compute sidebar theme based on sidebarColor
  const sidebarBg = (companyProfile as any)?.sidebarColor || "#ffffff";
  const sidebarIsDark = (() => {
    const h = sidebarBg.replace("#", "");
    if (h.length < 6) return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();
  const sidebarTextColor   = sidebarIsDark ? "#f9fafb" : "#111827";
  const sidebarSubtext     = sidebarIsDark ? "#9ca3af" : "#6b7280";
  const sidebarBorderColor = sidebarIsDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const sidebarNavHoverBg  = sidebarIsDark ? "rgba(255,255,255,0.07)" : "#eff6ff";
  const sidebarNavHoverText= sidebarIsDark ? "#ffffff" : "#1d4ed8";

  const [expandedSections] = useState<Set<string>>(new Set(["main", "management", "clients-invoices", "admin"]));
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Auto-collapse on mobile devices
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return true;
    }
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navSections: NavSection[] = [
    {
      label: "main",
      displayLabel: t("sections.main"),
      items: [
        { href: "/dashboard", label: t("nav.dashboard"), icon: BarChart3 },
        { href: "/profit-loss", label: t("nav.profitLoss"), icon: DollarSign },
        { href: "/analysis", label: t("nav.analysis"), icon: TrendingUp },
      ],
    },
    {
      label: "management",
      displayLabel: t("sections.management"),
      items: [
        { href: "/fleet-management", label: t("nav.fleet"), icon: Car },
        { href: "/reservations", label: t("nav.reservations"), icon: CalendarDays },
        { href: "/rental-contracts", label: t("nav.contracts"), icon: FileText },
        { href: "/maintenance", label: t("nav.maintenance"), icon: Wrench },
        { href: "/garages", label: "Garages", icon: Building2 },
        { href: "/ai-maintenance", label: t("nav.aiMaintenance"), icon: Sparkles },
      ],
    },
    {
      label: "clients-invoices",
      displayLabel: t("sections.clientsInvoices"),
      items: [
        { href: "/clients", label: t("nav.clients"), icon: Users },
        { href: "/invoices", label: t("nav.invoices"), icon: Receipt },
      ],
    },
    ...(user?.role === "super_admin" ? [{
      label: "admin",
      displayLabel: t("sections.admin"),
      items: [
        { href: "/admin/analytics", label: t("nav.ceoDashboard"), icon: Crown },
        { href: "/admin/payment-requests", label: "Whish Payments", icon: Wallet },
        { href: "/admin/numbering", label: t("nav.numberingManagement"), icon: FileText },
        { href: "/admin/user-management", label: t("nav.userManagement"), icon: Users },
        { href: "/admin/audit-logs", label: t("nav.auditLogs"), icon: FileText },
      ],
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex relative">
      {/* Mobile Header with Hamburger Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 shadow-sm">
        <Link href="/dashboard">
          <div className="flex items-center">
            {companyProfile?.logoUrl ? (
              <img src={companyProfile.logoUrl} alt="logo" className="h-8 w-auto max-w-[120px] object-contain" />
            ) : companyProfile?.platformName ? (
              <span className="text-sm font-bold text-gray-900">{companyProfile.platformName}</span>
            ) : companyProfile?.companyName ? (
              <span className="text-sm font-bold text-gray-900">{companyProfile.companyName}</span>
            ) : (
              <AnimatedLogo size="sm" />
            )}
          </div>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={cn(
          "flex flex-col transition-all duration-300 shadow-sm",
          "md:relative fixed inset-y-0 left-0 z-40",
          "md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20 md:w-20" : "w-72 md:w-72"
        )}
        style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${sidebarBorderColor}` }}
      >
        {/* Logo & Toggle Button */}
        <div className="p-6 relative" style={{ borderBottom: `1px solid ${sidebarBorderColor}` }}>
          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-colors shadow-sm z-10"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-gray-600" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-gray-600" />
            )}
          </button>
          <Link href="/dashboard">
            <div className={cn(
              "flex items-center cursor-pointer group",
              isCollapsed ? "justify-center" : ""
            )}>
              {isCollapsed ? (
                companyProfile?.logoUrl ? (
                  <img src={companyProfile.logoUrl} alt="logo" className="h-14 w-14 object-contain rounded" />
                ) : (
                  <span className="text-lg font-extrabold text-blue-600">
                    {companyProfile?.platformName ? companyProfile.platformName.slice(0, 2).toUpperCase() : "FM"}
                  </span>
                )
              ) : companyProfile?.logoUrl ? (
                <div className="flex flex-col gap-0.5">
                  <img src={companyProfile.logoUrl} alt="logo" className="h-16 w-auto max-w-[200px] object-contain" />
                  {companyProfile?.platformName && (
                    <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">Rental Management</span>
                  )}
                </div>
              ) : companyProfile?.platformName ? (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{companyProfile.platformName}</span>
                  <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">Rental Management</span>
                </div>
              ) : companyProfile?.companyName ? (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{companyProfile.companyName}</span>
                  <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">Rental Management</span>
                </div>
              ) : (
                <AnimatedLogo size="md" showSubtext />
              )}
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          {navSections.map((section) => {
            const isExpanded = expandedSections.has(section.label);
            return (
              <div key={section.label} className="mb-6">
                {/* Section Header - Always visible and more prominent */}
                {!isCollapsed && (
                  <div className="px-3 mb-3">
                    <h3 className="text-xs font-bold tracking-wider uppercase" style={{ color: sidebarSubtext }}>
                      {section.displayLabel}
                    </h3>
                    <div className="h-0.5 mt-2 rounded-full" style={{ background: `linear-gradient(to right, ${companyProfile?.primaryColor || "#2563eb"}, transparent)` }} />
                  </div>
                )}

                {/* Section Items - Always expanded */}
                {(isCollapsed || isExpanded) && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = location === item.href;
                      const Icon = item.icon;
                      const activeBg = companyProfile?.primaryColor || "#2563eb";
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                              isCollapsed ? "justify-center" : "gap-3",
                            )}
                            style={isActive
                              ? { backgroundColor: activeBg, color: "#ffffff" }
                              : { color: sidebarTextColor }
                            }
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                (e.currentTarget as HTMLElement).style.backgroundColor = sidebarNavHoverBg;
                                (e.currentTarget as HTMLElement).style.color = sidebarNavHoverText;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                (e.currentTarget as HTMLElement).style.backgroundColor = "";
                                (e.currentTarget as HTMLElement).style.color = sidebarTextColor;
                              }
                            }}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" style={{ color: isActive ? "#ffffff" : sidebarSubtext }} />
                            {!isCollapsed && <span>{item.label}</span>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Language Selector */}
        <div className="px-3 pb-1">
          <LanguageSelector isCollapsed={isCollapsed} />
        </div>

        {/* User Profile */}
        {user && (
          <div className="p-4" style={{ borderTop: `1px solid ${sidebarBorderColor}`, backgroundColor: sidebarIsDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)" }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  className={cn(
                    "w-full hover:opacity-90 border shadow-sm",
                    isCollapsed ? "justify-center px-2" : "justify-start"
                  )}
                  style={{ borderColor: sidebarBorderColor, color: sidebarTextColor, backgroundColor: sidebarIsDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)" }}
                  size="sm"
                  title={isCollapsed ? user.name || user.username : undefined}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0",
                    !isCollapsed && "mr-2"
                  )}
                    style={{ backgroundColor: companyProfile?.primaryColor || "#2563eb" }}
                  >
                    {(user.name || user.username || "U").charAt(0).toUpperCase()}
                  </div>
                  {!isCollapsed && <span className="truncate font-medium">{user.name || user.username}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>{t("user.myAccount")}</DropdownMenuLabel>
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {t("user.userId")}: {user.id}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/my-profile")}>
                  <User className="h-4 w-4 mr-2" />
                  {t("user.myProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/company-settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  {t("user.companySettings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/privacy-settings")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy &amp; Access
                </DropdownMenuItem>
                {whiteLabelAccess?.access && (
                  <DropdownMenuItem onClick={() => setLocation("/white-label")}>
                    <Paintbrush className="h-4 w-4 mr-2" />
                    {t("whiteLabel.navLabel")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("user.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 mt-16 md:mt-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
