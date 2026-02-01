import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-8 px-4">
          {/* Simple Hero */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Car Rental
              <span className="block text-primary">Management</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Manage your fleet, bookings, and operations in one simple platform
            </p>
          </div>

          {/* Simple CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => window.location.href = '/dashboard'}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
              onClick={() => window.location.href = '/fleet'}
            >
              View Fleet
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
