import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart, Activity, ClipboardCheck, AlertTriangle, MapPin, Shield } from "lucide-react";

export default function Operations() {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono text-primary uppercase tracking-widest">Module 03</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Operations & Analytics</h1>
          <p className="text-muted-foreground max-w-2xl">
            The intelligence layer. This module optimizes daily workflows, ensures compliance, and provides actionable business insights.
          </p>
        </div>

        <Tabs defaultValue="workflows" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/20 p-1 rounded-lg mb-8">
            <TabsTrigger value="workflows" className="font-mono text-xs md:text-sm">WORKFLOW AUTOMATION</TabsTrigger>
            <TabsTrigger value="analytics" className="font-mono text-xs md:text-sm">BUSINESS INTELLIGENCE</TabsTrigger>
            <TabsTrigger value="compliance" className="font-mono text-xs md:text-sm">RISK & COMPLIANCE</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Digital Inspection Protocol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-md bg-background/50 border border-border/50">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">1</div>
                    <div>
                      <h4 className="font-bold text-sm">Pre-Rental Scan</h4>
                      <p className="text-xs text-muted-foreground">Guided photo capture of all 4 sides + interior before handover.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-md bg-background/50 border border-border/50">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">2</div>
                    <div>
                      <h4 className="font-bold text-sm">Odometer & Fuel Sync</h4>
                      <p className="text-xs text-muted-foreground">Automated reading via OCR or telematics to prevent disputes.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-md bg-background/50 border border-border/50">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">3</div>
                    <div>
                      <h4 className="font-bold text-sm">Customer Sign-off</h4>
                      <p className="text-xs text-muted-foreground">Digital signature on the inspection report locks in the condition.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Incident Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-md border border-l-4 border-l-orange-500 bg-background/50">
                      <h4 className="font-bold text-sm mb-1">Damage Claims Pipeline</h4>
                      <p className="text-xs text-muted-foreground">Centralized tracking from report &rarr; assessment &rarr; repair &rarr; billing. Ensures no revenue leakage from unbilled damages.</p>
                    </div>
                    <div className="p-4 rounded-md border border-l-4 border-l-blue-500 bg-background/50">
                      <h4 className="font-bold text-sm mb-1">Toll & Fine Processing</h4>
                      <p className="text-xs text-muted-foreground">Automated matching of toll usage to rental contracts for immediate chargeback to the customer.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                    <Activity className="h-4 w-4" /> UTILIZATION RATE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">87.4%</div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[87.4%]" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Peak efficiency reached on weekends.</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                    <BarChart className="h-4 w-4" /> REV PER UNIT (RPU)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">$42.50</div>
                  <div className="flex items-end gap-1 h-8">
                    <div className="w-1/5 bg-primary/30 h-[40%]" />
                    <div className="w-1/5 bg-primary/50 h-[60%]" />
                    <div className="w-1/5 bg-primary/70 h-[50%]" />
                    <div className="w-1/5 bg-primary/90 h-[80%]" />
                    <div className="w-1/5 bg-primary h-[100%]" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Trending up +5% MoM.</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                    <PieChart className="h-4 w-4" /> FLEET HEALTH
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">92%</div>
                  <div className="flex gap-1">
                    <div className="h-2 w-[92%] bg-green-500 rounded-l-full" />
                    <div className="h-2 w-[5%] bg-orange-500" />
                    <div className="h-2 w-[3%] bg-red-500 rounded-r-full" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Active / Maint / Down</p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Predictive Demand Forecasting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced analytics use historical data and seasonal trends to predict fleet demand. This allows operators to optimize fleet distribution across locations and adjust pricing strategies proactively to maximize revenue.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Geofencing & Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <div>
                        <span className="font-bold text-sm block">Operating Zones</span>
                        <span className="text-xs text-muted-foreground">Define allowed areas for vehicle operation. Alerts triggered on exit.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <div>
                        <span className="font-bold text-sm block">Speed Limiting</span>
                        <span className="text-xs text-muted-foreground">Remote monitoring of vehicle speed to ensure safe usage.</span>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    Security & Fraud
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <div>
                        <span className="font-bold text-sm block">Identity Verification</span>
                        <span className="text-xs text-muted-foreground">AI-powered document scanning and biometric matching.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <div>
                        <span className="font-bold text-sm block">Payment Security</span>
                        <span className="text-xs text-muted-foreground">3D Secure transactions and fraud detection algorithms.</span>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
