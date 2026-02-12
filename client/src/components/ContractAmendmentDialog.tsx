import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, Car, DollarSign, FileText } from "lucide-react";

interface ContractAmendmentDialogProps {
  contractId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ContractAmendmentDialog({ contractId, open, onOpenChange, onSuccess }: ContractAmendmentDialogProps) {
  const [amendmentType, setAmendmentType] = useState<"date" | "vehicle" | "rate">("date");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newVehicleId, setNewVehicleId] = useState("");
  const [newDailyRate, setNewDailyRate] = useState("");
  const [reason, setReason] = useState("");

  const utils = trpc.useUtils();
  const { data: vehicles = [] } = trpc.fleet.list.useQuery();

  const amendDate = trpc.contracts.amendDates.useMutation({
    onSuccess: () => {
      toast.success("Contract dates amended successfully");
      utils.contracts.list.invalidate();
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to amend dates: ${error.message}`);
    },
  });

  const amendVehicle = trpc.contracts.amendVehicle.useMutation({
    onSuccess: () => {
      toast.success("Contract vehicle changed successfully");
      utils.contracts.list.invalidate();
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to change vehicle: ${error.message}`);
    },
  });

  const amendRate = trpc.contracts.amendRate.useMutation({
    onSuccess: () => {
      toast.success("Contract rate adjusted successfully");
      utils.contracts.list.invalidate();
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to adjust rate: ${error.message}`);
    },
  });

  const resetForm = () => {
    setNewStartDate("");
    setNewEndDate("");
    setNewVehicleId("");
    setNewDailyRate("");
    setReason("");
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the amendment");
      return;
    }

    switch (amendmentType) {
      case "date":
        if (!newStartDate || !newEndDate) {
          toast.error("Please provide both start and end dates");
          return;
        }
        amendDate.mutate({
          contractId,
          newStartDate: new Date(newStartDate),
          newEndDate: new Date(newEndDate),
          reason,
        });
        break;

      case "vehicle":
        if (!newVehicleId) {
          toast.error("Please select a vehicle");
          return;
        }
        amendVehicle.mutate({
          contractId,
          newVehicleId: parseInt(newVehicleId),
          reason,
        });
        break;

      case "rate":
        if (!newDailyRate || parseFloat(newDailyRate) <= 0) {
          toast.error("Please provide a valid daily rate");
          return;
        }
        amendRate.mutate({
          contractId,
          newDailyRate: parseFloat(newDailyRate),
          reason,
        });
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Amend Contract
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amendment Type Selector */}
          <div className="space-y-2">
            <Label>Amendment Type</Label>
            <Select value={amendmentType} onValueChange={(value: any) => setAmendmentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Change Dates
                  </div>
                </SelectItem>
                <SelectItem value="vehicle">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Change Vehicle
                  </div>
                </SelectItem>
                <SelectItem value="rate">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Adjust Rate
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Amendment Form */}
          {amendmentType === "date" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newStartDate">New Start Date</Label>
                <Input
                  id="newStartDate"
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEndDate">New End Date</Label>
                <Input
                  id="newEndDate"
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Vehicle Amendment Form */}
          {amendmentType === "vehicle" && (
            <div className="space-y-2">
              <Label htmlFor="newVehicle">New Vehicle</Label>
              <Select value={newVehicleId} onValueChange={setNewVehicleId}>
                <SelectTrigger id="newVehicle">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.brand} {vehicle.model} ({vehicle.plateNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Rate Amendment Form */}
          {amendmentType === "rate" && (
            <div className="space-y-2">
              <Label htmlFor="newDailyRate">New Daily Rate ($)</Label>
              <Input
                id="newDailyRate"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter new daily rate"
                value={newDailyRate}
                onChange={(e) => setNewDailyRate(e.target.value)}
              />
            </div>
          )}

          {/* Reason for Amendment */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Amendment *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this amendment is being made..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={amendDate.isPending || amendVehicle.isPending || amendRate.isPending}
          >
            {(amendDate.isPending || amendVehicle.isPending || amendRate.isPending) ? "Amending..." : "Amend Contract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
