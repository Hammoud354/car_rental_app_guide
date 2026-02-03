import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Building2, BarChart3, FileText, Calendar, Users, LogOut, Wrench } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MinimalLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/fleet-management", label: "Fleet", icon: BarChart3 },
    { href: "/rental-contracts", label: "Contracts", icon: FileText },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/clients", label: "Clients", icon: Users },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard">
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">Car Rental Management System</span>
              </div>
            </Link>

            {/* Center Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-100">
                  <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {user.name?.[0]?.toUpperCase() || 'M'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
