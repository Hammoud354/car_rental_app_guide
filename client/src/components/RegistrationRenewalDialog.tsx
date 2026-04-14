import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle, Calendar, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RegistrationRenewalDialogProps {
  vehicle: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RegistrationRenewalDialog({ vehicle, open, onOpenChange, onSuccess }: RegistrationRenewalDialogProps) {
  const utils = trpc.useUtils();

  const defaultExpiry = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    newExpiryDate: defaultExpiry(),
    registrationFee: vehicle?.registrationFee || "",
  });

  const renewMutation = trpc.fleet.renewRegistration.useMutation({
    onSuccess: () => {
      toast.success("Registration renewed successfully!");
      utils.fleet.list.invalidate();
      utils.fleet.getExpiringRegistration.invalidate();
      utils.fleet.getExpiredRegistration.invalidate();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to renew registration");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registrationFee || parseFloat(formData.registrationFee) < 0) {
      toast.error("Please enter a valid registration fee");
      return;
    }
    if (!formData.newExpiryDate) {
      toast.error("Please select a new expiry date");
      return;
    }
    renewMutation.mutate({
      vehicleId: vehicle.id,
      newExpiryDate: new Date(formData.newExpiryDate),
      registrationFee: formData.registrationFee,
    });
  };

  const getDaysUntilExpiry = () => {
    if (!vehicle?.registrationExpiryDate) return null;
    const today = new Date();
    const expiryDate = new Date(vehicle.registrationExpiryDate);
    return Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Renew Vehicle Registration</DialogTitle>
          <DialogDescription>
            {vehicle?.plateNumber} - {vehicle?.brand} {vehicle?.model}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {vehicle?.registrationExpiryDate && (
            <Alert variant={isExpired ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isExpired ? (
                  <>
                    <strong>Registration Expired:</strong> {Math.abs(daysUntilExpiry!)} days ago
                    <br />
                    <span className="text-xs">Expired on {new Date(vehicle.registrationExpiryDate).toLocaleDateString()}</span>
                  </>
                ) : isExpiringSoon ? (
                  <>
                    <strong>Expiring Soon:</strong> {daysUntilExpiry} days remaining
                    <br />
                    <span className="text-xs">Expires on {new Date(vehicle.registrationExpiryDate).toLocaleDateString()}</span>
                  </>
                ) : (
                  <>Current registration expires on {new Date(vehicle.registrationExpiryDate).toLocaleDateString()}</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {vehicle?.registrationFee && (
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Previous registration fee: <strong>${parseFloat(vehicle.registrationFee).toFixed(2)}</strong></span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="newExpiryDate">New Expiry Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newExpiryDate"
                  type="date"
                  value={formData.newExpiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, newExpiryDate: e.target.value }))}
                  className="pl-10"
                  required
                  data-testid="input-registration-expiry"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="registrationFee">Registration Fee ($) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="registrationFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.registrationFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, registrationFee: e.target.value }))}
                  className="pl-10"
                  placeholder="0.00"
                  required
                  data-testid="input-registration-fee"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Enter the fee for this renewal period</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={renewMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={renewMutation.isPending} data-testid="button-renew-registration">
              {renewMutation.isPending ? "Renewing..." : "Renew Registration"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
