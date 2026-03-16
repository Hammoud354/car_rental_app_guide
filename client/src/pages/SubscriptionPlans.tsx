import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, CreditCard, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const HARDCODED_PLANS = [
  {
    id: 1,
    name: "starter",
    displayName: "Starter",
    description: "For small agencies getting started",
    monthlyPrice: 49,
    maxVehicles: 15,
    maxClients: 100,
    maxUsers: 1,
    features: [
      "Up to 15 vehicles",
      "Up to 100 clients",
      "Basic analytics & reporting",
      "Invoice generation",
      "Contract management",
      "Email support (48h)",
    ],
    stripePriceId: null as string | null,
  },
  {
    id: 2,
    name: "professional",
    displayName: "Professional",
    description: "For growing agencies that need more power",
    monthlyPrice: 79,
    maxVehicles: 50,
    maxClients: null,
    maxUsers: 5,
    features: [
      "Up to 50 vehicles",
      "Unlimited clients",
      "Advanced P&L analytics",
      "AI maintenance predictions",
      "Damage inspection tools",
      "Contract amendments",
      "Excel & PDF exports",
      "WhatsApp integration",
      "Priority support (24h)",
    ],
    stripePriceId: null as string | null,
  },
  {
    id: 3,
    name: "enterprise",
    displayName: "Enterprise",
    description: "For large fleets with complex operations",
    monthlyPrice: 129,
    maxVehicles: null,
    maxClients: null,
    maxUsers: null,
    features: [
      "Unlimited vehicles",
      "Unlimited clients",
      "Multi-user access & roles",
      "Custom reporting & API access",
      "White-label option",
      "WhatsApp integration",
      "Dedicated account manager",
      "24/7 priority support",
    ],
    stripePriceId: null as string | null,
  },
];

export default function SubscriptionPlans() {
  const [, setLocation] = useLocation();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const { data: currentPlan } = trpc.subscription.getCurrentPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleSelectPlan = async (plan: typeof HARDCODED_PLANS[0]) => {
    setIsLoading(true);
    setSelectedPlanId(plan.id);

    if (!isAuthenticated) {
      localStorage.setItem('selectedSubscriptionPlanId', plan.id.toString());
      toast.info("Please sign up first, then you'll be redirected to complete payment.");
      setTimeout(() => setLocation("/signup"), 1000);
      return;
    }

    if (plan.stripePriceId) {
      try {
        const response = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId: plan.stripePriceId, planName: plan.name }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (error) {
        console.error("Stripe checkout error:", error);
      }
    }

    toast.info("Stripe payment is not yet configured. The plan will be activated once Stripe is set up.");
    setIsLoading(false);
    setSelectedPlanId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(isAuthenticated ? "/dashboard" : "/")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose the plan that fits your business
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Start managing your fleet today. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {HARDCODED_PLANS.map((plan) => {
            const isCurrentPlan = currentPlan?.tier?.name === plan.name;
            const isProfessional = plan.name === "professional";

            return (
              <div key={plan.id} className="relative">
                {isProfessional && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-blue-600 text-white px-4 py-1 text-sm shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <Card
                  className={`h-full flex flex-col transition-all hover:shadow-lg ${
                    isProfessional
                      ? "border-blue-500 border-2 shadow-md"
                      : "border-gray-200"
                  }`}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl text-gray-900">{plan.displayName}</CardTitle>
                    <CardDescription className="text-gray-500">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-5xl font-extrabold text-gray-900">${plan.monthlyPrice}</span>
                      <span className="text-gray-400 ml-2 text-lg">/month</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-4 pb-4 border-b border-gray-100 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="font-medium">
                          {plan.maxVehicles === null ? "Unlimited" : `Up to ${plan.maxVehicles}`} vehicles
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="font-medium">
                          {plan.maxClients === null ? "Unlimited" : `Up to ${plan.maxClients}`} clients
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="font-medium">
                          {plan.maxUsers === null ? "Unlimited" : `Up to ${plan.maxUsers}`} team member{plan.maxUsers !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="mb-8 flex-1">
                      <h4 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide">Features included</h4>
                      <ul className="space-y-2.5">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isCurrentPlan ? (
                      <Button
                        disabled
                        className="w-full bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200"
                      >
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isLoading && selectedPlanId === plan.id}
                        className={`w-full h-12 text-base font-semibold ${
                          isProfessional
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {isLoading && selectedPlanId === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirecting to Stripe...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Subscribe — ${plan.monthlyPrice}/mo
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              No credit card required to start
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              Cancel anytime
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Payments are securely processed through Stripe. All plans are billed monthly.
          </p>
        </div>
      </div>
    </div>
  );
}
