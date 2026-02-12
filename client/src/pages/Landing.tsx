import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Building2, FileText, BarChart3, Shield, Clock, Users, User, LogOut } from "lucide-react";
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

export default function Landing() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Signed out successfully");
      window.location.href = "/";
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-gray-900" />
            <span className="text-xl font-semibold text-gray-900">Car Rental Management System</span>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {user.name || user.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/profit-loss")}>
                    Profit & Loss
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/signin")}
                >
                  Sign In
                </Button>
                <Button 
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                  onClick={() => setLocation("/signup")}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Fleet Management<br />for Modern Agencies
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Streamline your rental operations with comprehensive vehicle tracking,
              contract management, and real-time analytics. Built for agencies who
              demand efficiency and control.
            </p>
            <Button 
              size="lg" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg"
              onClick={() => setLocation("/dashboard")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <Building2 className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fleet Control</h3>
              <p className="text-gray-600">
                Track vehicle status, maintenance schedules, and insurance expiry dates
                in one centralized dashboard.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <FileText className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Contract Management</h3>
              <p className="text-gray-600">
                Generate rental contracts, track payments, and manage client relationships
                with automated workflows.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <BarChart3 className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
              <p className="text-gray-600">
                Monitor revenue, vehicle profitability, and operational metrics with
                real-time reporting.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <Shield className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with role-based access control and automatic
                data backups.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <Clock className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Time-Saving Automation</h3>
              <p className="text-gray-600">
                Automate routine tasks like contract generation, payment reminders,
                and maintenance alerts.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <Users className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Client Management</h3>
              <p className="text-gray-600">
                Maintain comprehensive client profiles with rental history, documents,
                and communication logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to transform your fleet operations?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join agencies worldwide who trust Car Rental Management System to manage their fleet efficiently.
          </p>
          <Button 
            size="lg" 
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg"
            onClick={() => setLocation("/dashboard")}
          >
            Explore Dashboard
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>© 2026 Car Rental Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
