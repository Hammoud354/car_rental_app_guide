import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Car, DollarSign, Wrench, AlertTriangle, LayoutDashboard, LogOut, FileText, Home, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

function OverdueWidget() {
  const { data: stats, isLoading } = trpc.contracts.getOverdueStatistics.useQuery();
  
  if (isLoading || !stats || stats.count === 0) return null;
  
  return (
    <Card className="bg-red-50 border-red-200 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-red-900">Overdue Contracts Alert</CardTitle>
          </div>
          <Link href="/rental-contracts">
            <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-red-200">
            <div className="text-3xl font-bold text-red-600">{stats.count}</div>
            <div className="text-sm text-red-700 mt-1">Overdue Contracts</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-red-200">
            <div className="text-3xl font-bold text-red-600">${stats.totalLateFees}</div>
            <div className="text-sm text-red-700 mt-1">Total Late Fees</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-red-200">
            <div className="text-3xl font-bold text-red-600">{stats.avgDaysOverdue}</div>
            <div className="text-sm text-red-700 mt-1">Avg Days Overdue</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-red-100 rounded-lg flex items-start gap-2">
          <Clock className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">
            <strong>Action Required:</strong> {stats.count} contract{stats.count > 1 ? 's' : ''} {stats.count > 1 ? 'are' : 'is'} overdue. Contact clients immediately to arrange returns and collect late fees.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: vehicles, isLoading } = trpc.fleet.list.useQuery();
  const { user, logout } = useAuth();
  const [location] = useLocation();

  // Calculate metrics from real data
  const totalFleet = vehicles?.length || 0;
  const inMaintenance = vehicles?.filter(v => v.status === "Maintenance").length || 0;
  const expiringDocs = vehicles?.filter(v => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return (
      (v.insuranceExpiryDate && new Date(v.insuranceExpiryDate) <= thirtyDaysFromNow) ||
      (v.registrationExpiryDate && new Date(v.registrationExpiryDate) <= thirtyDaysFromNow)
    );
  }).length || 0;

  // Calculate estimated revenue (daily rate * 30 days for available vehicles)
  const estimatedRevenue = vehicles?.reduce((sum, v) => {
    if (v.status === "Available" || v.status === "Rented") {
      return sum + (parseFloat(v.dailyRate) * 30);
    }
    return sum;
  }, 0) || 0;

  // Fleet status counts
  const available = vehicles?.filter(v => v.status === "Available").length || 0;
  const rented = vehicles?.filter(v => v.status === "Rented").length || 0;
  const maintenance = vehicles?.filter(v => v.status === "Maintenance").length || 0;

  // Fleet composition by category
  const categories = vehicles?.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const maxCategoryCount = Math.max(...Object.values(categories), 1);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/fleet-management", label: "Fleet", icon: Car },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/rental-contracts", label: "Contracts", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Car className="h-8 w-8" />
            <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">FleetMaster</h1>
            <p className="text-xs text-muted-foreground">Premium Car Rentals</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          {user ? (
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          ) : (
            <a
              href={getLoginUrl()}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign In</span>
            </a>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
              <p className="text-muted-foreground mt-1">Welcome back to FleetMaster. Here's what's happening today.</p>
            </div>
            <Link href="/">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors">
                <Home className="h-4 w-4" />
                <span className="font-medium">HOME</span>
              </button>
            </Link>
          </div>

          {/* Overdue Contracts Alert Widget */}
          <OverdueWidget />

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Fleet</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Car className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalFleet}</div>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Est.)</CardTitle>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">${(estimatedRevenue / 1000).toFixed(1)}k</div>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Maintenance</CardTitle>
                <div className="p-2 bg-red-100 rounded-lg">
                  <Wrench className="h-5 w-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{inMaintenance}</div>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Docs</CardTitle>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{expiringDocs}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fleet Status */}
            <Card className="bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Fleet Status</CardTitle>
                <p className="text-sm text-muted-foreground">Current availability of vehicles</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-6">
                  {/* Simple donut chart representation */}
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {/* Available (green) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeDasharray={`${(available / totalFleet) * 251.2} 251.2`}
                        strokeDashoffset="0"
                      />
                      {/* Rented (blue) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray={`${(rented / totalFleet) * 251.2} 251.2`}
                        strokeDashoffset={`-${(available / totalFleet) * 251.2}`}
                      />
                      {/* Maintenance (red) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray={`${(maintenance / totalFleet) * 251.2} 251.2`}
                        strokeDashoffset={`-${((available + rented) / totalFleet) * 251.2}`}
                      />
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Rented</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Maintenance</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fleet Composition */}
            <Card className="bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Fleet Composition</CardTitle>
                <p className="text-sm text-muted-foreground">Distribution by vehicle category</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categories).map(([category, count]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{category}</span>
                        <span className="font-medium text-foreground">{count}</span>
                      </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                          <div
                            className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(categories).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No vehicles in fleet yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
