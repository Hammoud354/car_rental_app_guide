import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Car, BarChart3, Settings, FileText, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Overview", icon: BarChart3 },
    { href: "/fleet", label: "Fleet Management", icon: Car },
    { href: "/booking", label: "Booking System", icon: FileText },
    { href: "/operations", label: "Operations", icon: Settings },
    { href: "/compliance", label: "Compliance", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar/50 backdrop-blur-xl h-screen sticky top-0 z-30">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2 text-primary">
            <Car className="h-8 w-8" />
            <span className="font-mono font-bold text-xl tracking-tighter">RENTAL.OS</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground font-mono">v2.0.26 SYSTEM READY</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="font-mono">{item.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="bg-card/50 rounded-sm p-4 border border-border/50">
            <div className="text-xs font-mono text-muted-foreground mb-2">SYSTEM STATUS</div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-500">ONLINE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-40">
        <div className="flex items-center gap-2 text-primary">
          <Car className="h-6 w-6" />
          <span className="font-mono font-bold text-lg">RENTAL.OS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/95 backdrop-blur-sm pt-20 px-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 rounded-sm text-lg font-medium border-b border-border/50",
                    location === item.href ? "text-primary" : "text-foreground"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="font-mono">{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen bg-background relative">
        {/* Background Grid Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="relative z-10 container py-8 md:py-12 max-w-7xl mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
