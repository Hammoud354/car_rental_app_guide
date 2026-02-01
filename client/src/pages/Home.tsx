import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Car, Calendar, Shield, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <div className="space-y-16 pb-16">
        {/* Hero Section */}
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="max-w-3xl mx-auto text-center space-y-6 px-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Rent Your Perfect
              <span className="block text-primary">Car Today</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from our premium fleet of vehicles. Easy booking, flexible rates, and 24/7 support.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={() => window.location.href = '/fleet'}
              >
                Browse Cars <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8"
                onClick={() => window.location.href = '/booking'}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Wide Selection</h3>
              <p className="text-muted-foreground">
                Choose from economy to luxury vehicles that fit your needs and budget
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Flexible Booking</h3>
              <p className="text-muted-foreground">
                Book by the day, week, or month with easy online reservations
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Fully Insured</h3>
              <p className="text-muted-foreground">
                All vehicles come with comprehensive insurance for your peace of mind
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6 p-8 rounded-2xl border border-border/50 bg-card/30">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Hit the Road?
            </h2>
            <p className="text-lg text-muted-foreground">
              Start your journey today. Browse our available vehicles and book in minutes.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => window.location.href = '/fleet'}
            >
              View Available Cars <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
