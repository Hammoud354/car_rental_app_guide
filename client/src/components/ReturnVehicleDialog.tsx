import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ReturnVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: number;
  contractNumber: string;
  pickupKm?: number | null;
  pickupFuelLevel?: string | null;
  kmLimit?: number | null;
  overLimitKmRate?: number | null;
  onSuccess?: () => void;
}

export function ReturnVehicleDialog({
  open,
  onOpenChange,
  contractId,
  contractNumber,
  pickupKm,
  pickupFuelLevel,
  kmLimit,
  overLimitKmRate = 0.5,
  onSuccess,
}: ReturnVehicleDialogProps) {
  const { toast } = useToast();
  const [returnKm, setReturnKm] = useState<string>("");
  const [returnFuelLevel, setReturnFuelLevel] = useState<string>("");
  const [returnNotes, setReturnNotes] = useState<string>("");
  const [damageInspection, setDamageInspection] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  
  // Auto-populate returnKm with pickupKm when dialog opens, and reset when closed
  useEffect(() => {
    if (open && pickupKm) {
      setReturnKm(pickupKm.toString());
      setValidationError("");
    } else if (!open) {
      // Reset form when dialog closes
      setReturnKm("");
      setReturnFuelLevel("");
      setReturnNotes("");
      setDamageInspection("");
      setValidationError("");
    }
  }, [open, pickupKm]);
  
  // Real-time validation for return odometer
  useEffect(() => {
    if (returnKm && pickupKm) {
      const returnKmNum = parseInt(returnKm);
      if (!isNaN(returnKmNum) && returnKmNum <= pickupKm) {
        setValidationError(`Return odometer must be greater than pickup odometer (${pickupKm.toLocaleString()} km)`);
      } else if (validationError && validationError.includes("Return odometer")) {
        // Clear validation error if it was about odometer and now it's valid
        setValidationError("");
      }
    }
  }, [returnKm, pickupKm]);
  
  // Calculate over-limit KM fee
  const calculateOverLimitFee = () => {
    if (!returnKm || !pickupKm || !kmLimit) return 0;
    const returnKmNum = parseInt(returnKm);
    if (isNaN(returnKmNum)) return 0;
    const kmDriven = returnKmNum - pickupKm;
    if (kmDriven <= kmLimit) return 0;
    const overLimitKm = kmDriven - kmLimit;
    return overLimitKm * (overLimitKmRate || 0.5);
  };
  
  const overLimitFee = calculateOverLimitFee();

  const markAsReturnedMutation = trpc.contracts.markAsReturned.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Vehicle Returned Successfully",
        description: `Contract ${contractNumber} has been marked as completed.`,
      });
      
      // Show maintenance alert if applicable
      if (data.maintenanceAlert && data.maintenanceAlert.isDue) {
        toast({
          title: "⚠️ Maintenance Due",
          description: `${data.maintenanceAlert.vehiclePlate} (${data.maintenanceAlert.vehicleModel}) requires maintenance. Current: ${data.maintenanceAlert.currentKm} km, Due: ${data.maintenanceAlert.maintenanceDueKm} km`,
          variant: "destructive",
        });
      }
      
      // Reset form and close dialog
      setReturnKm("");
      setReturnFuelLevel("");
      setReturnNotes("");
      setDamageInspection("");
      setValidationError("");
      onOpenChange(false);
      
      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark vehicle as returned",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    // Reset validation error
    setValidationError("");

    // Validate return odometer
    if (returnKm && pickupKm) {
      const returnKmNum = parseInt(returnKm);
      if (isNaN(returnKmNum)) {
        setValidationError("Return odometer must be a valid number");
        return;
      }
      if (returnKmNum <= pickupKm) {
        setValidationError(`Return odometer (${returnKmNum} km) must be greater than pickup odometer (${pickupKm} km)`);
        return;
      }
    }

    // Validate fuel level is selected
    if (!returnFuelLevel) {
      setValidationError("Please select the return fuel level");
      return;
    }

    // Submit the return
    markAsReturnedMutation.mutate({
      contractId,
      returnKm: returnKm ? parseInt(returnKm) : undefined,
      returnFuelLevel: returnFuelLevel as "Empty" | "1/4" | "1/2" | "3/4" | "Full",
      returnNotes: returnNotes || undefined,
      damageInspection: damageInspection || undefined,
      overLimitKmFee: overLimitFee > 0 ? overLimitFee : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Return Vehicle - {contractNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Return Odometer */}
          <div className="space-y-2">
            <Label htmlFor="returnKm">Return Odometer (km)</Label>
            <Input
              id="returnKm"
              type="number"
              placeholder="Enter return odometer reading"
              value={returnKm}
              onChange={(e) => setReturnKm(e.target.value)}
              min={pickupKm || 0}
            />
            {pickupKm && (
              <p className="text-xs text-muted-foreground">
                Pickup odometer: {pickupKm.toLocaleString()} km
              </p>
            )}
          </div>

          {/* Return Fuel Level */}
          <div className="space-y-2">
            <Label htmlFor="returnFuelLevel">Return Fuel Level *</Label>
            <Select value={returnFuelLevel} onValueChange={setReturnFuelLevel}>
              <SelectTrigger id="returnFuelLevel">
                <SelectValue placeholder="Select fuel level at return" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Empty">Empty</SelectItem>
                <SelectItem value="1/4">1/4</SelectItem>
                <SelectItem value="1/2">1/2</SelectItem>
                <SelectItem value="3/4">3/4</SelectItem>
                <SelectItem value="Full">Full</SelectItem>
              </SelectContent>
            </Select>
            {pickupFuelLevel && (
              <p className="text-xs text-muted-foreground">
                Pickup fuel level: {pickupFuelLevel}
              </p>
            )}
          </div>

          {/* Damage Inspection */}
          <div className="space-y-2">
            <Label htmlFor="damageInspection">Damage Inspection *</Label>
            <Textarea
              id="damageInspection"
              placeholder="Inspect vehicle for any damages, scratches, dents, or issues. Enter 'No damage' if vehicle is in good condition."
              value={damageInspection}
              onChange={(e) => setDamageInspection(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* KM Limit Warning */}
          {kmLimit && returnKm && pickupKm && (
            <div className={`p-3 rounded-md text-sm ${
              parseInt(returnKm) - pickupKm > kmLimit 
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}>
              <p className="font-semibold mb-1">
                {parseInt(returnKm) - pickupKm > kmLimit ? '⚠️ KM Limit Exceeded' : '✓ Within KM Limit'}
              </p>
              <p>KM Driven: {(parseInt(returnKm) - pickupKm).toLocaleString()} km</p>
              <p>KM Limit: {kmLimit.toLocaleString()} km</p>
              {overLimitFee > 0 && (
                <p className="font-bold mt-1">Over-Limit Fee: ${overLimitFee.toFixed(2)}</p>
              )}
            </div>
          )}

          {/* Return Notes */}
          <div className="space-y-2">
            <Label htmlFor="returnNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="returnNotes"
              placeholder="Any additional notes about the return..."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {validationError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={markAsReturnedMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={markAsReturnedMutation.isPending}
          >
            {markAsReturnedMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Mark as Returned
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
