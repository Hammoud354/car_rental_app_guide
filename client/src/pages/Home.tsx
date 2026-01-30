import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car, FileText, BarChart3, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <Layout>
      <div className="space-y-32 py-12">
        {/* Hero Section - Apple Style */}
        <section className="text-center max-w-5xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Introducing the future of fleet management</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            Effortless fleet
            <br />
            management.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            A beautifully simple platform to manage your rental fleet, track vehicles, and streamline operations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="apple-button text-base h-12 px-8"
              onClick={() => window.location.href = '/fleet'}
            >
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="apple-button-secondary text-base h-12 px-8"
              onClick={() => window.location.href = '/rental-contracts'}
            >
              View contracts
            </Button>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/fleet">
              <Card className="apple-card group cursor-pointer overflow-hidden h-full border-none">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Car className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Fleet Management</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Track your entire vehicle inventory with real-time status updates, maintenance schedules, and availability.
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/rental-contracts">
              <Card className="apple-card group cursor-pointer overflow-hidden h-full border-none">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Smart Contracts</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Create, manage, and track rental agreements with digital signatures and automated damage inspection.
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/fleet">
              <Card className="apple-card group cursor-pointer overflow-hidden h-full border-none">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Analytics</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Gain insights into fleet performance, revenue trends, and operational efficiency with powerful analytics.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-5xl mx-auto px-4">
          <div className="glass-effect rounded-3xl p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-semibold mb-2 bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  99.9%
                </div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-semibold mb-2 bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-semibold mb-2 bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  Fast
                </div>
                <div className="text-sm text-muted-foreground">Performance</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-semibold mb-2 bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  Secure
                </div>
                <div className="text-sm text-muted-foreground">Data</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center max-w-4xl mx-auto px-4 pb-12">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Ready to transform your fleet?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 font-light">
            Start managing your vehicles with elegance and efficiency.
          </p>
          <Button 
            size="lg" 
            className="apple-button text-base h-12 px-8"
            onClick={() => window.location.href = '/fleet'}
          >
            Get started today <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </div>
    </Layout>
  );
}
