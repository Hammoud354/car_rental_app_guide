import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldX } from "lucide-react";

interface InsuranceStatusBadgeProps {
  insuranceExpiryDate?: Date | string | null;
  className?: string;
}

export function InsuranceStatusBadge({ insuranceExpiryDate, className }: InsuranceStatusBadgeProps) {
  if (!insuranceExpiryDate) {
    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        <ShieldX className="h-3 w-3" />
        No Insurance
      </Badge>
    );
  }

  const today = new Date();
  const expiryDate = new Date(insuranceExpiryDate);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Expired
    return (
      <Badge variant="destructive" className={`gap-1 ${className}`}>
        <ShieldX className="h-3 w-3" />
        Expired {Math.abs(diffDays)}d ago
      </Badge>
    );
  } else if (diffDays <= 30) {
    // Expiring soon (within 30 days)
    return (
      <Badge variant="default" className={`gap-1 bg-yellow-500 hover:bg-yellow-600 ${className}`}>
        <ShieldAlert className="h-3 w-3" />
        Expires in {diffDays}d
      </Badge>
    );
  } else {
    // Active
    return (
      <Badge variant="outline" className={`gap-1 border-green-500 text-green-700 ${className}`}>
        <Shield className="h-3 w-3" />
        Active
      </Badge>
    );
  }
}

export function getInsuranceStatus(insuranceExpiryDate?: Date | string | null): "expired" | "expiring_soon" | "active" | "none" {
  if (!insuranceExpiryDate) return "none";

  const today = new Date();
  const expiryDate = new Date(insuranceExpiryDate);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring_soon";
  return "active";
}
