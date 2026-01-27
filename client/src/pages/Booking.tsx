import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CreditCard, Calendar, FileSignature, Zap, Search } from "lucide-react";

export default function Booking() {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono text-primary uppercase tracking-widest">Module 02</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Booking Engine Architecture</h1>
          <p className="text-muted-foreground max-w-2xl">
            The customer-facing interface designed for conversion. This module manages availability, pricing logic, and the secure transaction flow.
          </p>
        </div>

        {/* User Flow Visualization */}
        <div className="relative rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-8 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Smartphone className="h-64 w-64" />
          </div>
          
          <h3 className="text-lg font-mono font-bold mb-8 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Transaction Flow
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
            {[
              { step: "01", title: "Discovery", icon: Search, desc: "Location & Date Search, Advanced Filtering (Type, Price, Features)" },
              { step: "02", title: "Selection", icon: Calendar, desc: "Real-time Availability Check, Dynamic Pricing Calculation" },
              { step: "03", title: "Verification", icon: FileSignature, desc: "Identity Check, License Validation, Digital Contract Generation" },
              { step: "04", title: "Payment", icon: CreditCard, desc: "Secure Gateway, Deposit Hold, Multi-currency Support" },
              { step: "05", title: "Confirmation", icon: Smartphone, desc: "Digital Key / QR Code Issue, Booking Sync to App" },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="p-6 rounded-lg border border-border/50 bg-background/80 h-full hover:border-primary/50 transition-all duration-300">
                  <div className="text-4xl font-mono font-bold text-muted-foreground/20 mb-4 group-hover:text-primary/20 transition-colors">{item.step}</div>
                  <item.icon className="h-6 w-6 text-primary mb-3" />
                  <h4 className="font-bold mb-2">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-[2px] bg-border -translate-y-1/2 z-20" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-mono">Dynamic Pricing Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                  <div>
                    <span className="font-bold text-sm block">Demand-Based Rates</span>
                    <span className="text-xs text-muted-foreground">Algorithm adjusts prices based on fleet utilization and seasonal demand peaks.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                  <div>
                    <span className="font-bold text-sm block">Duration Discounts</span>
                    <span className="text-xs text-muted-foreground">Automated tiered pricing for daily, weekly, and monthly rental periods.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                  <div>
                    <span className="font-bold text-sm block">Geo-Fenced Pricing</span>
                    <span className="text-xs text-muted-foreground">Location-specific rates based on local market conditions and taxes.</span>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-mono">Digital Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="font-mono">Guest Checkout</Badge>
                <Badge variant="secondary" className="font-mono">E-Signatures</Badge>
                <Badge variant="secondary" className="font-mono">Apple Pay / Google Pay</Badge>
                <Badge variant="secondary" className="font-mono">Push Notifications</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                The modern user expects a frictionless experience. Key requirements include the ability to book without account creation (Guest Checkout), sign contracts digitally on a mobile device, and receive instant updates via push notifications.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
