import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  maxVehicles: number | null;
  maxClients: number | null;
  maxUsers: number | null;
  features: Record<string, boolean>;
}

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  basicReporting: "Basic reporting",
  invoiceGeneration: "Invoice generation",
  whatsappIntegration: "WhatsApp integration",
  emailSupport: "Email support (48h)",
  pnlAnalysis: "P&L analysis",
  advancedAnalytics: "Advanced analytics",
  damageInspection: "Damage inspection",
  contractAmendments: "Contract amendments",
  excelExport: "Excel export",
  prioritySupport: "Priority support (24h)",
  multiUserAccess: "Multi-user access",
  customReports: "Custom reports",
  apiAccess: "API access",
  whiteLabel: "White-label option",
  dedicatedAccountManager: "Dedicated account manager",
  support24_7: "24/7 priority support",
};

export default function SubscriptionPlans() {
  const [, setLocation] = useLocation();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: plans = [], isLoading: plansLoading } = trpc.subscription.getAllPlans.useQuery();
  const { data: currentPlan } = trpc.subscription.getCurrentPlan.useQuery();

  const selectPlanMutation = trpc.subscription.selectPlan.useMutation({
    onSuccess: () => {
      toast.success("Subscription plan activated! Redirecting to dashboard...");
      setTimeout(() => setLocation("/dashboard"), 1500);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to activate subscription");
      setIsLoading(false);
    },
  });

  const handleSelectPlan = (planId: number) => {
    setIsLoading(true);
    setSelectedPlanId(planId);
    
    // Store the selected plan ID in localStorage for post-signup activation
    localStorage.setItem('selectedSubscriptionPlanId', planId.toString());
    
    // Try to select the plan if user is authenticated
    selectPlanMutation.mutate({ tierId: planId });
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  const sortedPlans = Array.isArray(plans) ? [...plans].filter(p => p && p.monthlyPrice).sort((a, b) => Number(a.monthlyPrice) - Number(b.monthlyPrice)) : [];
  const professionalPlan = sortedPlans.find(p => p && p.name === "professional");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose the plan that fits your business</h1>
          <p className="text-xl text-muted-foreground">
            Start with any plan and upgrade or downgrade anytime
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {sortedPlans.map((plan) => (
            <div key={plan.id} className="relative">
              {/* Most Popular Badge */}
              {plan.name === "professional" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
                </div>
              )}

              <Card
                className={`h-full flex flex-col transition-all ${
                  plan && plan.name === "professional"
                    ? "border-blue-500 border-2 shadow-lg"
                    : "border-border"
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                    <span className="text-muted-foreground ml-2">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Limits */}
                  <div className="mb-6 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>
                        {plan.maxVehicles === null ? "Unlimited" : `Up to ${plan.maxVehicles}`} vehicles
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>
                        {plan.maxClients === null ? "Unlimited" : `Up to ${plan.maxClients}`} clients
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>
                        {plan.maxUsers === null ? "Unlimited" : `Up to ${plan.maxUsers}`} team member{plan.maxUsers !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-8 flex-1">
                    <h4 className="font-semibold mb-3 text-sm">Features included:</h4>
                    <ul className="space-y-2">
                      {(() => {
                        // Handle features that might be a string, object, or array
                        let features: Record<string, boolean> = {};
                        
                        if (typeof plan.features === 'string') {
                          try {
                            features = JSON.parse(plan.features);
                          } catch (e) {
                            // If it's not valid JSON, treat it as empty
                            features = {};
                          }
                        } else if (typeof plan.features === 'object' && plan.features !== null) {
                          features = plan.features as Record<string, boolean>;
                        }
                        
                        return Object.entries(features)
                          .filter(([, enabled]) => enabled)
                          .map(([featureKey]) => (
                            <li key={featureKey} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{FEATURE_DISPLAY_NAMES[featureKey] || featureKey}</span>
                            </li>
                          ));
                      })()}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  {currentPlan?.tier?.id === plan.id ? (
                    <Button
                      disabled
                      className="w-full bg-gray-300 text-gray-600 cursor-not-allowed"
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isLoading}
                      className={`w-full ${
                        plan.name === "professional"
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-gray-200 hover:bg-gray-300 text-foreground"
                      }`}
                    >
                      {isLoading && selectedPlanId === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Activating...
                        </>
                      ) : (
                        "Get Started"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* FAQ or additional info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>All plans include 24/7 access to your account and data.</p>
        </div>
      </div>
    </div>
  );
}
