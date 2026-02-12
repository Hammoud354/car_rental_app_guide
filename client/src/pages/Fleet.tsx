import SidebarLayout from "@/components/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, AlertCircle, Clock, Database, Camera, FileText } from "lucide-react";

export default function Fleet() {
  return (
    <SidebarLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono text-primary uppercase tracking-widest">Module 01</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Fleet Management Architecture</h1>
          <p className="text-muted-foreground max-w-2xl">
            The central nervous system of rental operations. This module handles the complete lifecycle of every vehicle asset from acquisition to disposal.
          </p>
        </div>

        {/* Data Structure Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-primary" />
                Vehicle Data Schema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-mono text-xs uppercase">Field Group</TableHead>
                      <TableHead className="font-mono text-xs uppercase">Key Attributes</TableHead>
                      <TableHead className="font-mono text-xs uppercase">Criticality</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Identification</TableCell>
                      <TableCell className="text-muted-foreground">Plate Number, VIN, Make, Model, Year, Color</TableCell>
                      <TableCell><Badge variant="outline" className="border-red-500/50 text-red-500">High</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Status & Location</TableCell>
                      <TableCell className="text-muted-foreground">Current Status (Available/Rented), GPS Coordinates, Branch ID</TableCell>
                      <TableCell><Badge variant="outline" className="border-red-500/50 text-red-500">High</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Financials</TableCell>
                      <TableCell className="text-muted-foreground">Daily/Weekly Rates, Depreciation Value, Purchase Cost</TableCell>
                      <TableCell><Badge variant="outline" className="border-orange-500/50 text-orange-500">Med</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Compliance</TableCell>
                      <TableCell className="text-muted-foreground">Insurance Policy #, Expiry Date, Registration Date</TableCell>
                      <TableCell><Badge variant="outline" className="border-red-500/50 text-red-500">High</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Media</TableCell>
                      <TableCell className="text-muted-foreground">Exterior Photos, Interior 360°, Damage Photos</TableCell>
                      <TableCell><Badge variant="outline" className="border-blue-500/50 text-blue-500">Low</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-primary" />
                Maintenance Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative pl-6 border-l border-border/50 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  <h4 className="text-sm font-bold mb-1">Preventive Triggers</h4>
                  <p className="text-xs text-muted-foreground">Automated alerts based on mileage (e.g., every 5k miles) or time intervals (e.g., every 3 months).</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-muted ring-4 ring-background" />
                  <h4 className="text-sm font-bold mb-1">Reactive Reporting</h4>
                  <p className="text-xs text-muted-foreground">Driver/Staff reported issues via mobile app immediately flag vehicle as "Maintenance Required".</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-muted ring-4 ring-background" />
                  <h4 className="text-sm font-bold mb-1">Cost Tracking</h4>
                  <p className="text-xs text-muted-foreground">All service records linked to vehicle ID for Total Cost of Ownership (TCO) calculation.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "GPS Tracking", desc: "Real-time location updates via telematics integration.", icon: CheckCircle2 },
            { title: "Digital Logs", desc: "Paperless service history and inspection reports.", icon: FileText },
            { title: "Photo Evidence", desc: "High-res image capture for condition verification.", icon: Camera },
            { title: "Downtime Ops", desc: "Automated status switching to prevent booking conflicts.", icon: Clock },
          ].map((feature, i) => (
            <div key={i} className="p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/10 transition-colors">
              <feature.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-mono font-bold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
