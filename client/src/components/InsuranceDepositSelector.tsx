import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Fuel, Banknote } from "lucide-react";

const INSURANCE_PACKAGES = {
  None: { label: "No Insurance", dailyRate: 0, coverage: "No coverage" },
  Basic: { label: "Basic Coverage", dailyRate: 10, coverage: "Up to $1,000" },
  Premium: { label: "Premium Coverage", dailyRate: 20, coverage: "Up to $5,000" },
  "Full Coverage": { label: "Full Coverage", dailyRate: 35, coverage: "Zero deductible" },
};

const FUEL_POLICY_LABELS: Record<FuelPolicy, string> = {
  "Full-to-Full": "Full-to-Full",
  "Same-to-Same": "Same-to-Same",
  "Pre-purchase": "Pre-purchase",
};

const FUEL_POLICY_DESC: Record<FuelPolicy, string> = {
  "Full-to-Full": "Customer returns vehicle with a full tank",
  "Same-to-Same": "Customer returns with the same fuel level as pickup",
  "Pre-purchase": "Customer pays for a full tank upfront",
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

export function InsuranceDepositSelector({ rentalDays, onInsuranceChange, onDepositChange, onFuelPolicyChange }: Props) {
  const [insurancePackage, setInsurancePackage] = useState<InsurancePackage>("None");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [fuelPolicy, setFuelPolicy] = useState<FuelPolicy>("Full-to-Full");

  const insuranceCost = INSURANCE_PACKAGES[insurancePackage].dailyRate * rentalDays;

  useEffect(() => { onInsuranceChange(insurancePackage, insuranceCost, INSURANCE_PACKAGES[insurancePackage].dailyRate); }, [insurancePackage, insuranceCost]);
  useEffect(() => { onDepositChange(depositAmount, depositAmount > 0 ? "Held" : "None"); }, [depositAmount]);
  useEffect(() => { onFuelPolicyChange(fuelPolicy); }, [fuelPolicy]);

  return (
    <div className="space-y-4">

      {/* Insurance */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Insurance Package</Label>
        </div>
        <Select value={insurancePackage} onValueChange={(v) => setInsurancePackage(v as InsurancePackage)}>
          <SelectTrigger className="h-9 text-sm input-client">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(INSURANCE_PACKAGES).map(([key, pkg]) => (
              <SelectItem key={key} value={key}>{pkg.label}{pkg.dailyRate > 0 ? ` — $${pkg.dailyRate}/day` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {insurancePackage !== "None" && (
          <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Daily rate</span><span className="font-medium">${INSURANCE_PACKAGES[insurancePackage].dailyRate}/day</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Rental days</span><span className="font-medium">{rentalDays}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-700 border-t border-emerald-200 pt-1">
              <span>Total cost</span><span>${insuranceCost.toFixed(2)}</span>
            </div>
            <p className="text-gray-500">Coverage: {INSURANCE_PACKAGES[insurancePackage].coverage}</p>
          </div>
        )}
      </div>

      {/* Deposit */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Banknote className="w-3.5 h-3.5 text-blue-600" />
          <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Security Deposit</Label>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number" min="0" step="50" placeholder="0" value={depositAmount || ""}
            onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
            className="w-full h-9 rounded-md border border-[#1e3a8a]/40 pl-6 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {depositAmount > 0 && (
          <p className="text-xs text-blue-600 mt-1">${depositAmount.toFixed(2)} held — refunded on return</p>
        )}
      </div>

      {/* Fuel Policy */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Fuel className="w-3.5 h-3.5 text-orange-600" />
          <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Fuel Policy</Label>
        </div>
        <Select value={fuelPolicy} onValueChange={(v) => setFuelPolicy(v as FuelPolicy)}>
          <SelectTrigger className="h-9 text-sm input-client">
            <SelectValue>{FUEL_POLICY_LABELS[fuelPolicy]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Full-to-Full">Full-to-Full (return with full tank)</SelectItem>
            <SelectItem value="Same-to-Same">Same-to-Same (return same level)</SelectItem>
            <SelectItem value="Pre-purchase">Pre-purchase (pay upfront)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">{FUEL_POLICY_DESC[fuelPolicy]}</p>
      </div>

    </div>
  );
}
