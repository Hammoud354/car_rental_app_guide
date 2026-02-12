import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Shield, DollarSign, Fuel } from "lucide-react";

const INSURANCE_PACKAGES = {
  None: { label: "No Insurance", dailyRate: 0, coverage: "No coverage" },
  Basic: { label: "Basic Coverage", dailyRate: 10, coverage: "Up to $1,000" },
  Premium: { label: "Premium Coverage", dailyRate: 20, coverage: "Up to $5,000" },
  "Full Coverage": { label: "Full Coverage", dailyRate: 35, coverage: "Zero deductible" },
};

type InsurancePackage = keyof typeof INSURANCE_PACKAGES;
type DepositStatus = "None" | "Held" | "Refunded" | "Forfeited";
type FuelPolicy = "Full-to-Full" | "Same-to-Same" | "Pre-purchase";

interface Props {
  rentalDays: number;
  onInsuranceChange: (pkg: InsurancePackage, cost: number, dailyRate: number) => void;
  onDepositChange: (amount: number, status: DepositStatus) => void;
  onFuelPolicyChange: (policy: FuelPolicy) => void;
}

export function InsuranceDepositSelector({
  rentalDays,
  onInsuranceChange,
  onDepositChange,
  onFuelPolicyChange,
}: Props) {
  const [insurancePackage, setInsurancePackage] = useState<InsurancePackage>("None");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [fuelPolicy, setFuelPolicy] = useState<FuelPolicy>("Full-to-Full");

  const insuranceCost = INSURANCE_PACKAGES[insurancePackage].dailyRate * rentalDays;

  useEffect(() => {
    onInsuranceChange(
      insurancePackage,
      insuranceCost,
      INSURANCE_PACKAGES[insurancePackage].dailyRate
    );
  }, [insurancePackage, insuranceCost]);

  useEffect(() => {
    onDepositChange(depositAmount, depositAmount > 0 ? "Held" : "None");
  }, [depositAmount]);

  useEffect(() => {
    onFuelPolicyChange(fuelPolicy);
  }, [fuelPolicy]);

  return (
    <div className="space-y-6">
      {/* Insurance Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Insurance Package
          </CardTitle>
          <CardDescription>
            Choose the level of coverage for this rental
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="insurance">Package</Label>
            <Select
              value={insurancePackage}
              onValueChange={(value) => setInsurancePackage(value as InsurancePackage)}
            >
              <SelectTrigger id="insurance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INSURANCE_PACKAGES).map(([key, pkg]) => (
                  <SelectItem key={key} value={key}>
                    {pkg.label} - ${pkg.dailyRate}/day
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {insurancePackage !== "None" && (
            <div className="bg-muted p-4 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Rate:</span>
                <span className="font-medium">
                  ${INSURANCE_PACKAGES[insurancePackage].dailyRate}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rental Days:</span>
                <span className="font-medium">{rentalDays}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Insurance Cost:</span>
                <span className="text-primary">${insuranceCost.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Coverage: {INSURANCE_PACKAGES[insurancePackage].coverage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Security Deposit
          </CardTitle>
          <CardDescription>
            Refundable deposit held during rental period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="deposit">Deposit Amount ($)</Label>
            <Input
              id="deposit"
              type="number"
              min="0"
              step="50"
              value={depositAmount}
              onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter deposit amount"
            />
            {depositAmount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                ${depositAmount.toFixed(2)} will be held and refunded upon vehicle return
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fuel Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            Fuel Policy
          </CardTitle>
          <CardDescription>
            How fuel should be handled for this rental
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="fuelPolicy">Policy</Label>
            <Select
              value={fuelPolicy}
              onValueChange={(value) => setFuelPolicy(value as FuelPolicy)}
            >
              <SelectTrigger id="fuelPolicy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-to-Full">
                  Full-to-Full (Return with full tank)
                </SelectItem>
                <SelectItem value="Same-to-Same">
                  Same-to-Same (Return with same level)
                </SelectItem>
                <SelectItem value="Pre-purchase">
                  Pre-purchase (Pay for full tank upfront)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              {fuelPolicy === "Full-to-Full" && "Customer must return vehicle with a full tank of fuel"}
              {fuelPolicy === "Same-to-Same" && "Customer returns vehicle with same fuel level as pickup"}
              {fuelPolicy === "Pre-purchase" && "Customer pays for full tank upfront, no refund for unused fuel"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
