import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Building2, BarChart3, FileText, Wrench, Users, User, LogOut, 
  TrendingUp, CalendarDays, Settings, Receipt, Car,
  PanelLeftClose, PanelLeftOpen, DollarSign, Sparkles, Menu, X
} from "lucide-react";
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
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Signed out successfully");
      window.location.href = "/";
    },
  });

  // All sections expanded by default
  const [expandedSections] = useState<Set<string>>(new Set(["main", "management", "clients-invoices"]));
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
      displayLabel: "MAIN",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
        { href: "/profit-loss", label: "Profit & Loss", icon: DollarSign },
        { href: "/analysis", label: "Analysis", icon: TrendingUp },
      ],
    },
    {
      label: "management",
      displayLabel: "MANAGEMENT",
      items: [
        { href: "/fleet-management", label: "Fleet", icon: Car },
        { href: "/reservations", label: "Reservations", icon: CalendarDays },
        { href: "/rental-contracts", label: "Contracts", icon: FileText },
        { href: "/maintenance", label: "Maintenance", icon: Wrench },
        { href: "/ai-maintenance", label: "AI Maintenance", icon: Sparkles },
      ],
    },
    {
      label: "clients-invoices",
      displayLabel: "CLIENTS & INVOICES",
      items: [
        { href: "/clients", label: "Clients", icon: Users },
        { href: "/invoices", label: "Invoices", icon: Receipt },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex relative">
      {/* Mobile Header with Hamburger Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 shadow-sm">
        <Link href="/">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1e40af] flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">
              {companyProfile?.companyName || "Car Rental"}
            </span>
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
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm",
        "md:relative fixed inset-y-0 left-0 z-40",
        "md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20 md:w-20" : "w-72 md:w-72"
      )}>
        {/* Logo & Toggle Button */}
        <div className="p-6 border-b border-gray-200 relative">
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
          <Link href="/">
            <div className={cn(
              "flex items-center cursor-pointer group",
              isCollapsed ? "justify-center" : "gap-3"
            )}>
              <div className="w-10 h-10 rounded-lg bg-[#1e40af] flex items-center justify-center group-hover:bg-[#1e3a8a] transition-colors shadow-md">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">
                    {companyProfile?.companyName || "Car Rental"}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Management System</span>
                </div>
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
                    <h3 className="text-xs font-bold text-gray-900 tracking-wider uppercase">
                      {section.displayLabel}
                    </h3>
                    <div className="h-0.5 bg-gradient-to-r from-blue-600 to-transparent mt-2 rounded-full" />
                  </div>
                )}

                {/* Section Items - Always expanded */}
                {(isCollapsed || isExpanded) && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = location === item.href;
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                              isCollapsed ? "justify-center" : "gap-3",
                              isActive
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                            )}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <Icon className={cn(
                              "h-5 w-5 transition-colors",
                              isActive ? "text-white" : "text-gray-500 group-hover:text-blue-600"
                            )} />
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

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full bg-white hover:bg-gray-100 border-gray-300 shadow-sm",
                    isCollapsed ? "justify-center px-2" : "justify-start"
                  )} 
                  size="sm"
                  title={isCollapsed ? user.name || user.username : undefined}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs",
                    !isCollapsed && "mr-2"
                  )}>
                    {(user.name || user.username || "U").charAt(0).toUpperCase()}
                  </div>
                  {!isCollapsed && <span className="truncate font-medium">{user.name || user.username}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  User ID: {user.id}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/company-settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Company Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
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
