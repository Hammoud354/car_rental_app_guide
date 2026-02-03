import MinimalLayout from "@/components/MinimalLayout";
import { Button } from "@/components/ui/button";
import { Car, FileText, Wrench, BarChart3, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <MinimalLayout>
      <div className="space-y-16 pb-16">
        {/* Hero Section */}
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="max-w-3xl mx-auto text-center space-y-6 px-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Streamline Your
              <span className="block text-primary">Fleet Operations</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete management system for rental agencies. Track vehicles, manage contracts, schedule maintenance, and monitor operations in one platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={() => window.location.href = '/profitability'}
              >
                View Profitability <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8"
                onClick={() => window.location.href = '/fleet-management'}
              >
                Manage Fleet
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Fleet Tracking</h3>
              <p className="text-muted-foreground">
                Real-time vehicle status, location tracking, and availability management
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Contract Management</h3>
              <p className="text-muted-foreground">
                Digital contracts, client records, and rental agreement tracking
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Maintenance Scheduling</h3>
              <p className="text-muted-foreground">
                Automated service reminders and maintenance history tracking
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Analytics & Reports</h3>
              <p className="text-muted-foreground">
                Revenue tracking, utilization rates, and operational insights
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6 p-8 rounded-2xl border border-border/50 bg-card/30">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Optimize Your Operations?
            </h2>
            <p className="text-lg text-muted-foreground">
              Access your dashboard to manage vehicles, track contracts, and monitor your rental business performance.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => window.location.href = '/dashboard'}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </MinimalLayout>
  );
}
