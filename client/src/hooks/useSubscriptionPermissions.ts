import { trpc } from "@/lib/trpc";

export type SubscriptionStatus = 'active' | 'grace_period' | 'archived' | 'no_subscription';

export interface SubscriptionPermissions {
  status: SubscriptionStatus;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPrint: boolean;
  canExportPDF: boolean;
  daysRemaining: number | null;
  gracePeriodEndsAt: Date | null;
  renewalDate: Date | null;
  tierName: string | null;
  tierDisplayName: string | null;
}

const FULL_ACCESS: SubscriptionPermissions = {
  status: 'active',
  canCreate: true, canEdit: true, canDelete: true, canPrint: true, canExportPDF: true,
  daysRemaining: null, gracePeriodEndsAt: null, renewalDate: null,
  tierName: null, tierDisplayName: null,
};

export function useSubscriptionPermissions() {
  const { data, isLoading } = trpc.subscriptions.getPermissions.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  return { permissions: (data as SubscriptionPermissions | undefined) ?? FULL_ACCESS, isLoading };
}
