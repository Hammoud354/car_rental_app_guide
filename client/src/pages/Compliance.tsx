import MinimalLayout from "@/components/MinimalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, FileCheck, Scale } from "lucide-react";

export default function Compliance() {
  return (
    <MinimalLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono text-primary uppercase tracking-widest">Module 04</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Compliance & Security</h1>
          <p className="text-muted-foreground max-w-2xl">
            Ensuring legal adherence and data protection across all operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-primary" />
                Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-bold text-sm">GDPR & CCPA Compliance</h4>
                    <p className="text-xs text-muted-foreground">Automated data retention policies and "Right to be Forgotten" workflows.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-bold text-sm">End-to-End Encryption</h4>
                    <p className="text-xs text-muted-foreground">AES-256 encryption for all sensitive customer data at rest and in transit.</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 text-primary" />
                Legal Framework
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-bold text-sm">Digital Contracts</h4>
                    <p className="text-xs text-muted-foreground">Legally binding e-signatures with audit trails for every rental agreement.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-bold text-sm">Liability Management</h4>
                    <p className="text-xs text-muted-foreground">Clear terms of service and insurance coverage integration to mitigate operator risk.</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MinimalLayout>
  );
}
