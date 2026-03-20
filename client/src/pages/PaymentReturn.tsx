import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function PaymentReturn() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  const { data: currentPlan, refetch } = trpc.subscription.getCurrentPlan.useQuery();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const responseStatus = params.get("respStatus") || params.get("response_status");

    if (responseStatus === "A") {
      setStatus("success");
      refetch();
    } else if (responseStatus === "D" || responseStatus === "E") {
      setStatus("failed");
    } else {
      setTimeout(() => {
        refetch().then(({ data }) => {
          setStatus("success");
        }).catch(() => {
          setStatus("failed");
        });
      }, 2000);
    }
  }, [refetch]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-800">Verifying your payment...</h2>
          <p className="text-gray-500">Please wait while we confirm your subscription.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 max-w-md px-4">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-gray-500 text-lg">
              Your subscription has been activated.
              {currentPlan?.tier?.displayName && (
                <> You are now on the <strong>{currentPlan.tier.displayName}</strong> plan.</>
              )}
            </p>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 max-w-md px-4">
        <XCircle className="h-20 w-20 text-red-500 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Payment Failed</h1>
          <p className="text-gray-500 text-lg">
            Your payment could not be processed. No charges have been made.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => setLocation("/subscription-plans")}
          >
            Try Again
          </Button>
          <Button
            onClick={() => setLocation("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
