import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle, Calendar, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InsuranceRenewalDialogProps {
  vehicle: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InsuranceRenewalDialog({ vehicle, open, onOpenChange, onSuccess }: InsuranceRenewalDialogProps) {
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    policyStartDate: new Date().toISOString().split('T')[0],
    annualPremium: vehicle?.insuranceAnnualPremium || "",
    provider: vehicle?.insuranceProvider || "",
    policyNumber: vehicle?.insurancePolicyNumber || "",
  });

  const renewMutation = trpc.fleet.renewInsurance.useMutation({
    onSuccess: () => {
      toast.success("Insurance renewed successfully!");
      utils.fleet.list.invalidate();
      utils.fleet.getExpiringInsurance.invalidate();
      utils.fleet.getExpiredInsurance.invalidate();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to renew insurance");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.annualPremium || parseFloat(formData.annualPremium) <= 0) {
      toast.error("Please enter a valid annual premium");
      return;
    }

    renewMutation.mutate({
      vehicleId: vehicle.id,
      newPolicyStartDate: new Date(formData.policyStartDate),
      newAnnualPremium: formData.annualPremium,
      insuranceProvider: formData.provider || undefined,
      policyNumber: formData.policyNumber || undefined,
    });
  };

  // Calculate expiry date (1 year from start)
  const calculateExpiryDate = (startDate: string) => {
    const date = new Date(startDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toLocaleDateString();
  };

  // Calculate days until/since expiry
  const getDaysUntilExpiry = () => {
    if (!vehicle?.insuranceExpiryDate) return null;
    const today = new Date();
    const expiryDate = new Date(vehicle.insuranceExpiryDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Renew Insurance Policy</DialogTitle>
          <DialogDescription>
            {vehicle?.plateNumber} - {vehicle?.brand} {vehicle?.model}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Policy Status */}
          {vehicle?.insuranceExpiryDate && (
            <Alert variant={isExpired ? "destructive" : isExpiringSoon ? "default" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isExpired ? (
                  <>
                    <strong>Policy Expired:</strong> {Math.abs(daysUntilExpiry!)} days ago
                    <br />
                    <span className="text-xs">Expired on {new Date(vehicle.insuranceExpiryDate).toLocaleDateString()}</span>
                  </>
                ) : isExpiringSoon ? (
                  <>
                    <strong>Expiring Soon:</strong> {daysUntilExpiry} days remaining
                    <br />
                    <span className="text-xs">Expires on {new Date(vehicle.insuranceExpiryDate).toLocaleDateString()}</span>
                  </>
                ) : (
                  <>
                    Current policy expires on {new Date(vehicle.insuranceExpiryDate).toLocaleDateString()}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Previous Premium Reference */}
          {vehicle?.insuranceAnnualPremium && (
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Previous annual premium: <strong>${parseFloat(vehicle.insuranceAnnualPremium).toFixed(2)}</strong></span>
              </div>
            </div>
          )}

          {/* New Policy Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="policyStartDate">New Policy Start Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="policyStartDate"
                  type="date"
                  value={formData.policyStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, policyStartDate: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Policy will expire on: {calculateExpiryDate(formData.policyStartDate)}
              </p>
            </div>

            <div>
              <Label htmlFor="annualPremium">Annual Premium ($) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="annualPremium"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.annualPremium}
                  onChange={(e) => setFormData(prev => ({ ...prev, annualPremium: e.target.value }))}
                  className="pl-10"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="provider">Insurance Provider</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                placeholder="e.g., State Farm, Geico"
              />
            </div>

            <div>
              <Label htmlFor="policyNumber">Policy Number</Label>
              <Input
                id="policyNumber"
                value={formData.policyNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
                placeholder="Enter new policy number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={renewMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={renewMutation.isPending}>
              {renewMutation.isPending ? "Renewing..." : "Renew Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
