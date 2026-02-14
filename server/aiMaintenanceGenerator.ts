/**
 * AI-Powered Maintenance Schedule Generator (Data-Driven)
 * 
 * This service uses LLM to analyze REAL operational data from contracts and
 * maintenance records to generate intelligent, personalized maintenance schedules.
 * 
 * Data Sources:
 * - Contract odometer readings (pickup/return) for usage patterns
 * - Maintenance history records for service patterns
 * - Vehicle age and current mileage
 */

import { invokeLLM } from "./_core/llm";
import type { Vehicle } from "../drizzle/schema";
import * as db from "./db";

export interface MaintenanceTaskRecommendation {
  taskName: string;
  description: string;
  priority: "Critical" | "Important" | "Recommended" | "Optional";
  category: string;
  estimatedCost: number;
  estimatedDuration: number; // in minutes
  triggerType: "Mileage" | "Time" | "Both";
  triggerMileage?: number;
  triggerDate?: Date;
  intervalMileage?: number;
  intervalMonths?: number;
  aiReasoning: string;
}

export interface MaintenanceSchedule {
  tasks: MaintenanceTaskRecommendation[];
  summary: string;
  totalEstimatedAnnualCost: number;
  dataQuality: "Excellent" | "Good" | "Fair" | "Insufficient";
  dataInsights: string;
}

interface VehicleUsageData {
  totalContracts: number;
  totalKmDriven: number;
  averageKmPerDay: number;
  averageKmPerContract: number;
  firstContractDate?: Date;
  lastContractDate?: Date;
  maintenanceRecords: number;
  lastMaintenanceDate?: Date;
  lastMaintenanceKm?: number;
  totalMaintenanceCost: number;
}

/**
 * Analyze vehicle usage from contract history
 */
async function analyzeVehicleUsage(vehicleId: number, userId: number): Promise<VehicleUsageData> {
  // Get all contracts for this vehicle
  const contracts = await db.getRentalContractsByVehicle(vehicleId, userId);
  
  let totalKmDriven = 0;
  let contractsWithOdometer = 0;
  let firstDate: Date | undefined;
  let lastDate: Date | undefined;
  
  for (const contract of contracts) {
    if (contract.pickupKm && contract.returnKm && contract.returnKm > contract.pickupKm) {
      totalKmDriven += (contract.returnKm - contract.pickupKm);
      contractsWithOdometer++;
    }
    
    const contractDate = new Date(contract.rentalStartDate);
    if (!firstDate || contractDate < firstDate) firstDate = contractDate;
    if (!lastDate || contractDate > lastDate) lastDate = contractDate;
  }
  
  // Calculate average daily usage
  let averageKmPerDay = 0;
  if (firstDate && lastDate && totalKmDriven > 0) {
    const daysBetween = Math.max(1, Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    averageKmPerDay = totalKmDriven / daysBetween;
  }
  // Get maintenance records
  const maintenanceRecords = await db.getMaintenanceRecordsByVehicleId(vehicleId, userId);
  const totalMaintenanceCost = maintenanceRecords.reduce((sum: number, record: any) => 
    sum + (parseFloat(record.cost as string) || 0), 0);
  
  const lastMaintenance = maintenanceRecords.length > 0 
    ? maintenanceRecords.sort((a: any, b: any) => 
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      )[0]
    : null;
  
  return {
    totalContracts: contracts.length,
    totalKmDriven,
    averageKmPerDay,
    averageKmPerContract: contractsWithOdometer > 0 ? totalKmDriven / contractsWithOdometer : 0,
    firstContractDate: firstDate,
    lastContractDate: lastDate,
    maintenanceRecords: maintenanceRecords.length,
    lastMaintenanceDate: lastMaintenance ? new Date(lastMaintenance.performedAt) : undefined,
    lastMaintenanceKm: lastMaintenance?.mileageAtService || undefined,
    totalMaintenanceCost,
  };
}

/**
 * Assess data quality for AI recommendations
 */
function assessDataQuality(usage: VehicleUsageData, vehicle: Vehicle): {
  quality: "Excellent" | "Good" | "Fair" | "Insufficient";
  insights: string;
} {
  const hasContracts = usage.totalContracts >= 3;
  const hasMaintenanceHistory = usage.maintenanceRecords >= 1;
  const hasUsageData = usage.totalKmDriven > 0;
  
  if (hasContracts && hasMaintenanceHistory && hasUsageData) {
    return {
      quality: "Excellent",
      insights: `Rich data available: ${usage.totalContracts} contracts, ${usage.maintenanceRecords} maintenance records, ${usage.totalKmDriven}km driven. AI can provide highly accurate recommendations.`
    };
  }
  
  if ((hasContracts || hasMaintenanceHistory) && hasUsageData) {
    return {
      quality: "Good",
      insights: `Moderate data: ${usage.totalContracts} contracts, ${usage.maintenanceRecords} maintenance records. AI recommendations are reliable but will improve with more data.`
    };
  }
  
  if (hasContracts || hasMaintenanceHistory || vehicle.mileage) {
    return {
      quality: "Fair",
      insights: `Limited data: ${usage.totalContracts} contracts, ${usage.maintenanceRecords} maintenance records. AI will provide basic recommendations based on vehicle age and mileage.`
    };
  }
  
  return {
    quality: "Insufficient",
    insights: "Insufficient operational data. Please complete a few rental contracts or add maintenance records to enable AI recommendations."
  };
}

/**
 * Generate AI-powered maintenance schedule using real operational data
 */
export async function generateMaintenanceSchedule(
  vehicle: Vehicle,
  userId: number
): Promise<MaintenanceSchedule> {
  // Analyze real usage data
  const usage = await analyzeVehicleUsage(vehicle.id, userId);
  const dataAssessment = assessDataQuality(usage, vehicle);
  
  // If insufficient data, return early with guidance
  if (dataAssessment.quality === "Insufficient") {
    return {
      tasks: [],
      summary: "Insufficient data for AI recommendations. Complete 3+ rental contracts or add maintenance records to enable intelligent scheduling.",
      totalEstimatedAnnualCost: 0,
      dataQuality: "Insufficient",
      dataInsights: dataAssessment.insights,
    };
  }
  
  const currentDate = new Date();
  const vehicleAge = vehicle.year ? currentDate.getFullYear() - vehicle.year : 0;
  const currentMileage = vehicle.mileage || 0;
  
  // Calculate km since last maintenance
  const kmSinceLastMaintenance = usage.lastMaintenanceKm 
    ? currentMileage - usage.lastMaintenanceKm
    : currentMileage;
  
  // Build comprehensive prompt with REAL data
  const prompt = `You are an automotive maintenance expert. Analyze this vehicle's REAL operational data and generate a personalized maintenance schedule.

VEHICLE INFORMATION:
- Make/Model: ${vehicle.brand} ${vehicle.model}
- Year: ${vehicle.year} (${vehicleAge} years old)
- Current Mileage: ${currentMileage.toLocaleString()} km
- Category: ${vehicle.category}

REAL USAGE DATA (from actual rental contracts):
- Total Contracts: ${usage.totalContracts}
- Total KM Driven: ${usage.totalKmDriven.toLocaleString()} km
- Average KM per Day: ${Math.round(usage.averageKmPerDay)} km
- Average KM per Contract: ${Math.round(usage.averageKmPerContract)} km
- First Contract: ${usage.firstContractDate?.toLocaleDateString() || 'N/A'}
- Last Contract: ${usage.lastContractDate?.toLocaleDateString() || 'N/A'}

MAINTENANCE HISTORY (real service records):
- Total Maintenance Records: ${usage.maintenanceRecords}
- Last Maintenance: ${usage.lastMaintenanceDate?.toLocaleDateString() || 'Never'}
- Last Maintenance KM: ${usage.lastMaintenanceKm?.toLocaleString() || 'N/A'} km
- KM Since Last Service: ${kmSinceLastMaintenance.toLocaleString()} km
- Total Maintenance Spent: $${usage.totalMaintenanceCost.toFixed(2)}

DATA QUALITY: ${dataAssessment.quality}
${dataAssessment.insights}

**PRIMARY FOCUS: ODOMETER-BASED MAINTENANCE**
Generate 8-15 maintenance tasks using ODOMETER READINGS as the PRIMARY baseline. Odometer is the most reliable indicator of vehicle wear.

**CRITICAL REQUIREMENTS:**
1. **ALWAYS use triggerType "Mileage" or "Both"** - Never use "Time" alone
2. **Calculate exact triggerMileage** based on current odometer + interval
3. **Use standard manufacturer intervals:**
   - Oil Change: every 5,000 km
   - Oil Filter: every 5,000 km
   - Air Filter: every 15,000 km
   - Brake Inspection: every 20,000 km
   - Brake Pads: every 40,000-60,000 km
   - Tire Rotation: every 10,000 km
   - Major Service: every 30,000 km
   - Transmission Fluid: every 60,000 km
4. Priority classification based on urgency (Critical/Important/Recommended/Optional)
5. Realistic cost estimates for ${vehicle.brand} ${vehicle.model}

**ANALYSIS FACTORS:**
- Current Mileage: ${currentMileage.toLocaleString()} km
- KM Since Last Service: ${kmSinceLastMaintenance.toLocaleString()} km
- Usage Intensity: ${Math.round(usage.averageKmPerDay)} km/day (${usage.averageKmPerDay > 100 ? 'HIGH' : usage.averageKmPerDay > 50 ? 'MODERATE' : 'LOW'} usage)
- Vehicle Age: ${vehicleAge} years
- Category: ${vehicle.category}

**EXAMPLE CALCULATION:**
If current mileage is 42,000 km and last oil change was at 40,000 km:
- Next oil change due at: 45,000 km (40,000 + 5,000)
- triggerMileage: 45000
- intervalMileage: 5000
- triggerType: "Mileage"

Return ONLY valid JSON matching this schema:
{
  "tasks": [
    {
      "taskName": "string",
      "description": "string",
      "priority": "Critical" | "Important" | "Recommended" | "Optional",
      "category": "Engine" | "Transmission" | "Brakes" | "Tires" | "Fluids" | "Electrical" | "Suspension" | "Body" | "Interior" | "Safety",
      "estimatedCost": number,
      "estimatedDuration": number (minutes),
      "triggerType": "Mileage" | "Time" | "Both",
      "triggerMileage": number (optional),
      "intervalMileage": number (optional),
      "intervalMonths": number (optional),
      "aiReasoning": "string explaining why this task is needed based on the data"
    }
  ],
  "summary": "Brief summary of the maintenance plan based on actual usage",
  "totalEstimatedAnnualCost": number
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert automotive maintenance advisor. Analyze real operational data and provide data-driven maintenance recommendations." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "maintenance_schedule",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    taskName: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["Critical", "Important", "Recommended", "Optional"] },
                    category: { type: "string" },
                    estimatedCost: { type: "number" },
                    estimatedDuration: { type: "number" },
                    triggerType: { type: "string", enum: ["Mileage", "Time", "Both"] },
                    triggerMileage: { type: "number" },
                    intervalMileage: { type: "number" },
                    intervalMonths: { type: "number" },
                    aiReasoning: { type: "string" }
                  },
                  required: ["taskName", "description", "priority", "category", "estimatedCost", "estimatedDuration", "triggerType", "aiReasoning"],
                  additionalProperties: false
                }
              },
              summary: { type: "string" },
              totalEstimatedAnnualCost: { type: "number" }
            },
            required: ["tasks", "summary", "totalEstimatedAnnualCost"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No content in LLM response");
    }

    const schedule = JSON.parse(content);
    
    return {
      ...schedule,
      dataQuality: dataAssessment.quality,
      dataInsights: dataAssessment.insights,
    };
  } catch (error) {
    console.error("AI maintenance generation error:", error);
    throw new Error(`Failed to generate maintenance schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
