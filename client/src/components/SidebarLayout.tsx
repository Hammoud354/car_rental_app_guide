import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Building2, BarChart3, FileText, Wrench, Users, User, LogOut, 
  TrendingUp, CalendarDays, Settings, Receipt, ChevronDown, ChevronRight,
  PanelLeftClose, PanelLeftOpen, DollarSign
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

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["main", "management"]));
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSection = (sectionLabel: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionLabel)) {
        newSet.delete(sectionLabel);
      } else {
        newSet.add(sectionLabel);
      }
      return newSet;
    });
  };

  const navSections: NavSection[] = [
    {
      label: "main",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
        { href: "/profit-loss", label: "Profit & Loss", icon: DollarSign },
        { href: "/analysis", label: "Analysis", icon: TrendingUp },
      ],
    },
    {
      label: "management",
      items: [
        { href: "/fleet-management", label: "Fleet", icon: BarChart3 },
        { href: "/rental-contracts", label: "Contracts", icon: FileText },
        { href: "/reservations", label: "Reservations", icon: CalendarDays },
        { href: "/maintenance", label: "Maintenance", icon: Wrench },
      ],
    },
    {
      label: "data",
      items: [
        { href: "/clients", label: "Clients", icon: Users },
        { href: "/invoices", label: "Invoices", icon: Receipt },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex">
      {/* Left Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
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
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    {companyProfile?.companyName || "Car Rental"}
                  </span>
                  <span className="text-xs text-gray-500">Management System</span>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => {
            const isExpanded = expandedSections.has(section.label);
            return (
              <div key={section.label} className="mb-4">
                {/* Section Header */}
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(section.label)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                  >
                    <span>{section.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                )}

                {/* Section Items */}
                {(isCollapsed || isExpanded) && (
                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => {
                      const isActive = location === item.href;
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            className={cn(
                              "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                              isCollapsed ? "justify-center" : "gap-3",
                              isActive
                                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            )}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <Icon className={cn("h-5 w-5", isActive ? "text-blue-700" : "text-gray-500")} />
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
          <div className="p-4 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full",
                    isCollapsed ? "justify-center px-2" : "justify-start"
                  )} 
                  size="sm"
                  title={isCollapsed ? user.name || user.username : undefined}
                >
                  <User className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && <span className="truncate">{user.name || user.username}</span>}
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
          <div className="max-w-7xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
