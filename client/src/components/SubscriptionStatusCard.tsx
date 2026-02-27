import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Users, Car } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export function SubscriptionStatusCard() {
  const { data: subscription, isLoading } = trpc.subscription.getCurrentPlan.useQuery();
  const { data: vehicleCount = 0 } = trpc.fleet.getVehicleCount.useQuery();
  const { data: clientCount = 0 } = trpc.clients.getClientCount.useQuery();

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading subscription...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="h-5 w-5" />
            No Active Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-amber-800">
            Select a subscription plan to unlock all features and manage your fleet.
          </p>
          <Link href="/subscription-plans">
            <Button className="w-full bg-amber-600 hover:bg-amber-700">
              Choose a Plan
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const tier = subscription?.tier;
  
  if (!tier) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="h-5 w-5" />
            Subscription Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-amber-800">
            Unable to load subscription details. Please try refreshing the page.
          </p>
          <Button className="w-full" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const tierColors: Record<string, { bg: string; border: string; badge: string }> = {
    starter: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800" },
    professional: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-800" },
    enterprise: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-800" },
  };

  const colors = tierColors[tier.name?.toLowerCase?.()] || tierColors.starter;

  return (
    <Card className={`${colors.border} ${colors.bg} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Subscription
          </CardTitle>
          <Badge className={colors.badge}>{tier.name}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-white/50 p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Car className="h-4 w-4" />
              <span>Vehicles</span>
            </div>
            <div className="mt-1 text-lg font-semibold">
              {tier.maxVehicles === null ? "Unlimited" : `${vehicleCount} of ${tier.maxVehicles}`}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {tier.maxVehicles !== null && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full" 
                    style={{ width: `${Math.min((vehicleCount / tier.maxVehicles) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-white/50 p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Clients</span>
            </div>
            <div className="mt-1 text-lg font-semibold">
              {tier.maxClients === null ? "Unlimited" : `${clientCount} of ${tier.maxClients}`}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {tier.maxClients !== null && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-purple-600 h-1.5 rounded-full" 
                    style={{ width: `${Math.min((clientCount / tier.maxClients) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium text-gray-700">Included Features:</p>
          <ul className="space-y-1">
            {tier.features && typeof tier.features === "string" ? (
              tier.features.split(",").map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-gray-600">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  {feature.trim()}
                </li>
              ))
            ) : Array.isArray(tier.features) ? (
              tier.features.map((feature: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-gray-600">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))
            ) : null}
          </ul>
        </div>

        <Link href="/subscription-plans">
          <Button variant="outline" className="w-full">
            Change Plan
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
