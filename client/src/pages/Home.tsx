import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="relative rounded-xl overflow-hidden border border-border/50 group">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          <img 
            src="/images/hero-dashboard.jpg" 
            alt="Fleet Dashboard" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="relative z-20 p-8 md:p-12 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              SYSTEM ARCHITECTURE V1.0
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-tight">
              THE BLUEPRINT FOR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">MODERN FLEET OPS</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
              A comprehensive technical analysis of the essential components required to build a scalable, data-driven car rental platform in 2026.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground border-none">
                  OPEN DASHBOARD <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/fleet">
                <Button size="lg" variant="outline" className="font-mono bg-background/50 backdrop-blur-sm hover:bg-accent/50">
                  VIEW GUIDE
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "MARKET GROWTH", value: "+15.2%", sub: "YoY Projected", icon: TrendingUp, color: "text-green-500" },
            { label: "DIGITAL BOOKINGS", value: "73%", sub: "By 2029", icon: Activity, color: "text-blue-500" },
            { label: "MARKET CAP", value: "$243B", sub: "Global 2030", icon: Users, color: "text-purple-500" },
            { label: "CRITICAL REQ", value: "FLEET", sub: "Management Core", icon: AlertTriangle, color: "text-orange-500" },
          ].map((metric, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-md bg-background/50 border border-border/50">
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{metric.label}</span>
                </div>
                <div className="text-3xl font-bold font-mono tracking-tight mb-1">{metric.value}</div>
                <div className="text-xs text-muted-foreground font-mono border-l-2 border-primary/20 pl-2">
                  {metric.sub}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Core Modules Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/fleet">
            <div className="group cursor-pointer relative h-64 rounded-lg overflow-hidden border border-border/50 hover:border-primary transition-all duration-300">
              <img src="/images/fleet-lineup.jpg" alt="Fleet" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className="text-xs font-mono text-primary mb-2">MODULE 01</div>
                <h3 className="text-xl font-bold mb-2 group-hover:translate-x-2 transition-transform">Fleet Management</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">Complete vehicle lifecycle tracking, maintenance scheduling, and real-time status monitoring.</p>
              </div>
            </div>
          </Link>
          
          <Link href="/booking">
            <div className="group cursor-pointer relative h-64 rounded-lg overflow-hidden border border-border/50 hover:border-primary transition-all duration-300">
              <img src="/images/feature-booking.jpg" alt="Booking" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className="text-xs font-mono text-primary mb-2">MODULE 02</div>
                <h3 className="text-xl font-bold mb-2 group-hover:translate-x-2 transition-transform">Booking Engine</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">Seamless customer experience from vehicle discovery to digital contract signing.</p>
              </div>
            </div>
          </Link>
          
          <Link href="/operations">
            <div className="group cursor-pointer relative h-64 rounded-lg overflow-hidden border border-border/50 hover:border-primary transition-all duration-300">
              <img src="/images/feature-analytics.jpg" alt="Operations" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className="text-xs font-mono text-primary mb-2">MODULE 03</div>
                <h3 className="text-xl font-bold mb-2 group-hover:translate-x-2 transition-transform">Operations & Analytics</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">Data-driven insights, automated workflows, and comprehensive reporting tools.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
