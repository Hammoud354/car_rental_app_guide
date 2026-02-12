/**
 * Insurance package configurations
 */

export const INSURANCE_PACKAGES = {
  None: {
    label: "No Insurance",
    dailyRate: 0,
    coverage: "No coverage - Customer assumes all risk",
    description: "Customer is fully responsible for all damages",
  },
  Basic: {
    label: "Basic Coverage",
    dailyRate: 10,
    coverage: "Covers minor damages up to $1,000",
    description: "Basic protection for minor incidents",
  },
  Premium: {
    label: "Premium Coverage",
    dailyRate: 20,
    coverage: "Covers damages up to $5,000",
    description: "Comprehensive protection for most incidents",
  },
  "Full Coverage": {
    label: "Full Coverage",
    dailyRate: 35,
    coverage: "Full protection - Zero deductible",
    description: "Complete peace of mind with zero liability",
  },
} as const;

export type InsurancePackage = keyof typeof INSURANCE_PACKAGES;

export function calculateInsuranceCost(
  packageType: InsurancePackage,
  rentalDays: number
): number {
  const dailyRate = INSURANCE_PACKAGES[packageType].dailyRate;
  return dailyRate * rentalDays;
}
