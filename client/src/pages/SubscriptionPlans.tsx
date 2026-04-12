import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Loader2, ArrowLeft, Wallet, Copy, CheckCircle2, Clock, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const WHISH_PHONE_NUMBER = "+961 76 354 131";

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
  },
];

export default function SubscriptionPlans() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<typeof HARDCODED_PLANS[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);
  const { isAuthenticated } = useAuth();

  const { data: currentPlan } = trpc.subscription.getCurrentPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: myPayments } = trpc.subscription.getMyWhishPayments.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const submitMutation = trpc.subscription.submitWhishPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment request submitted! We'll activate your subscription once verified.");
      setDialogOpen(false);
      setTransactionId("");
      setSelectedPlan(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit payment request");
    },
  });

  const handleSelectPlan = (plan: typeof HARDCODED_PLANS[0]) => {
    if (!isAuthenticated) {
      localStorage.setItem("selectedSubscriptionPlanId", plan.id.toString());
      toast.info("Please sign up first.");
      setTimeout(() => setLocation("/signup"), 1000);
      return;
    }
    setSelectedPlan(plan);
    setTransactionId("");
    setDialogOpen(true);
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(WHISH_PHONE_NUMBER.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (!selectedPlan || !transactionId.trim()) {
      toast.error("Please enter your Whish transaction ID");
      return;
    }
    submitMutation.mutate({
      tierId: selectedPlan.id,
      transactionId: transactionId.trim(),
      amount: selectedPlan.monthlyPrice,
    });
  };

  const pendingRequest = myPayments?.find((p: any) => p.status === "pending");
  const lastApproved = myPayments?.find((p: any) => p.status === "approved");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(currentPlan?.status === "active" ? "/dashboard" : "/")}
            className="text-gray-600 hover:text-gray-900"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {currentPlan?.status === "active" ? "Back to Dashboard" : "Back to Home"}
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose the plan that fits your business
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Start managing your fleet today. Choose the plan that works for your agency.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-2 text-sm">
            <Wallet className="h-4 w-4" />
            Pay securely via <strong>Whish Money</strong> — Lebanon's trusted digital wallet
          </div>
        </div>

        {pendingRequest && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-900">Payment under review</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Your Whish payment (TX: <span className="font-mono font-medium">{pendingRequest.transactionId}</span>) is being verified. We'll activate your subscription shortly.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {HARDCODED_PLANS.map((plan) => {
            const isCurrentPlan = currentPlan?.tier?.name === plan.name;
            const isProfessional = plan.name === "professional";
            const hasPendingForPlan = myPayments?.some(
              (p: any) => p.tierId === plan.id && p.status === "pending"
            );

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
                        data-testid={`button-current-plan-${plan.id}`}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                        Current Plan
                      </Button>
                    ) : hasPendingForPlan ? (
                      <Button
                        disabled
                        className="w-full bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed"
                        data-testid={`button-pending-plan-${plan.id}`}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Payment Under Review
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSelectPlan(plan)}
                        data-testid={`button-select-plan-${plan.id}`}
                        className={`w-full h-12 text-base font-semibold ${
                          isProfessional
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Pay via Whish — ${plan.monthlyPrice}/mo
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
              Secure Whish payment
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              Activated within 24 hours
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              Cancel anytime
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Payments are processed via Whish Money and verified manually within 24 hours.
          </p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              Pay via Whish Money
            </DialogTitle>
            <DialogDescription>
              Follow these steps to subscribe to the <strong>{selectedPlan?.displayName}</strong> plan for <strong>${selectedPlan?.monthlyPrice}/month</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-green-900">Step 1 — Send payment via Whish</p>
              <div className="flex items-center justify-between bg-white rounded-md border border-green-200 px-3 py-2">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Whish Number</p>
                  <p className="font-mono font-bold text-gray-900 text-lg">{WHISH_PHONE_NUMBER}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCopyNumber} data-testid="button-copy-whish">
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-800">Amount to send:</span>
                <span className="font-bold text-green-900 text-base">${selectedPlan?.monthlyPrice}.00</span>
              </div>
              <p className="text-xs text-green-700">
                Open your Whish app → Send Money → enter the number above → send <strong>${selectedPlan?.monthlyPrice}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txn-id" className="text-sm font-semibold">
                Step 2 — Enter your Whish Transaction ID
              </Label>
              <Input
                id="txn-id"
                placeholder="e.g. WH1234567890"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                data-testid="input-transaction-id"
              />
              <p className="text-xs text-gray-500">
                Find this in your Whish app under transaction history after sending the payment.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel-whish"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSubmit}
                disabled={!transactionId.trim() || submitMutation.isPending}
                data-testid="button-submit-whish"
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
