/**
 * AI-Powered Maintenance Schedule Generator
 * 
 * This service uses LLM to analyze vehicle specifications and generate
 * intelligent, personalized maintenance schedules with priority classification.
 */

import { invokeLLM } from "./_core/llm";
import type { Vehicle } from "../drizzle/schema";

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
}

/**
 * Generate AI-powered maintenance schedule for a vehicle
 */
export async function generateMaintenanceSchedule(
  vehicle: Vehicle
): Promise<MaintenanceSchedule> {
  const currentDate = new Date();
  const vehicleAge = vehicle.year ? currentDate.getFullYear() - vehicle.year : 0;
  const mileage = vehicle.mileage || 0;
  
  // Calculate months since last service
  const monthsSinceService = vehicle.lastServiceDate 
    ? Math.floor((currentDate.getTime() - new Date(vehicle.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;
  
  // Calculate km since last service
  const kmSinceService = vehicle.lastServiceKm 
    ? mileage - vehicle.lastServiceKm
    : null;

  const prompt = `You are an expert automotive maintenance advisor. Analyze the following vehicle and generate a comprehensive, personalized maintenance schedule.

**Vehicle Information:**
- Make & Model: ${vehicle.brand} ${vehicle.model}
- Year: ${vehicle.year} (${vehicleAge} years old)
- Current Mileage: ${mileage.toLocaleString()} km
- Engine Type: ${vehicle.engineType || "Not specified"}
- Transmission: ${vehicle.transmission || "Not specified"}
- Fuel Type: ${vehicle.fuelType || "Not specified"}
- Engine Size: ${vehicle.engineSize || "Not specified"}
- Category: ${vehicle.category}
- Usage Pattern: ${vehicle.usagePattern || "Mixed"}
- Average Daily Usage: ${vehicle.averageDailyKm || "Not specified"} km/day
- Climate: ${vehicle.climate || "Moderate"}
- Last Service: ${vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate).toLocaleDateString() : "Unknown"} ${monthsSinceService !== null ? `(${monthsSinceService} months ago)` : ""}
- Mileage at Last Service: ${vehicle.lastServiceKm ? vehicle.lastServiceKm.toLocaleString() + " km" : "Unknown"} ${kmSinceService !== null ? `(${kmSinceService.toLocaleString()} km ago)` : ""}

**Instructions:**
Generate a maintenance schedule with tasks classified by priority:
- **Critical**: Safety-critical items that must be addressed immediately (e.g., brake failure, tire damage)
- **Important**: Items that affect reliability and should be done soon (e.g., oil change overdue, worn brake pads)
- **Recommended**: Preventive maintenance to optimize performance (e.g., scheduled service, filter replacement)
- **Optional**: Enhancement items that improve comfort or longevity (e.g., interior detailing, paint protection)

For each task, provide:
1. Task name (concise, e.g., "Engine Oil Change")
2. Detailed description (what needs to be done and why)
3. Priority level (Critical/Important/Recommended/Optional)
4. Category (Engine/Brakes/Tires/Fluids/Electrical/Body/Interior/etc.)
5. Estimated cost in USD
6. Estimated duration in minutes
7. Trigger type (Mileage/Time/Both)
8. Trigger mileage (if mileage-based)
9. Trigger date (if time-based, as YYYY-MM-DD)
10. Interval mileage (how often to repeat in km)
11. Interval months (how often to repeat in months)
12. AI reasoning (brief explanation of why this task is recommended at this priority)

Consider:
- Vehicle age and typical wear patterns
- Manufacturer maintenance schedules for this make/model
- Current mileage and usage intensity
- Climate effects (hot climates = more AC maintenance, cold = battery/coolant focus)
- Usage pattern (city driving = more brake wear, highway = less frequent service)
- Time since last service

Return ONLY valid JSON in this exact format:
{
  "tasks": [
    {
      "taskName": "Engine Oil Change",
      "description": "Replace engine oil and oil filter to maintain engine lubrication and prevent wear",
      "priority": "Important",
      "category": "Engine",
      "estimatedCost": 50,
      "estimatedDuration": 30,
      "triggerType": "Both",
      "triggerMileage": ${mileage + 5000},
      "triggerDate": "${new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
      "intervalMileage": 5000,
      "intervalMonths": 6,
      "aiReasoning": "Based on ${kmSinceService || 0} km since last service, oil change is due soon"
    }
  ],
  "summary": "Brief overview of the maintenance schedule and key priorities",
  "totalEstimatedAnnualCost": 500
}

Generate 8-15 tasks covering all major maintenance categories. Be specific and practical.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert automotive maintenance advisor. Provide accurate, practical maintenance recommendations in valid JSON format only."
        },
        {
          role: "user",
          content: prompt
        }
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
                    priority: { 
                      type: "string",
                      enum: ["Critical", "Important", "Recommended", "Optional"]
                    },
                    category: { type: "string" },
                    estimatedCost: { type: "number" },
                    estimatedDuration: { type: "number" },
                    triggerType: { 
                      type: "string",
                      enum: ["Mileage", "Time", "Both"]
                    },
                    triggerMileage: { type: ["number", "null"] },
                    triggerDate: { type: ["string", "null"] },
                    intervalMileage: { type: ["number", "null"] },
                    intervalMonths: { type: ["number", "null"] },
                    aiReasoning: { type: "string" }
                  },
                  required: [
                    "taskName",
                    "description",
                    "priority",
                    "category",
                    "estimatedCost",
                    "estimatedDuration",
                    "triggerType",
                    "aiReasoning"
                  ],
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
    if (!content) {
      throw new Error("No content in LLM response");
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const schedule: MaintenanceSchedule = JSON.parse(contentStr);
    
    // Convert string dates to Date objects
    schedule.tasks = schedule.tasks.map(task => ({
      ...task,
      triggerDate: task.triggerDate ? new Date(task.triggerDate) : undefined
    }));

    return schedule;
  } catch (error) {
    console.error("[AI Maintenance] Error generating schedule:", error);
    
    // Fallback to basic schedule if AI fails
    return generateFallbackSchedule(vehicle);
  }
}

/**
 * Generate a basic fallback schedule if AI fails
 */
function generateFallbackSchedule(vehicle: Vehicle): MaintenanceSchedule {
  const mileage = vehicle.mileage || 0;
  const currentDate = new Date();
  
  const tasks: MaintenanceTaskRecommendation[] = [
    {
      taskName: "Engine Oil Change",
      description: "Replace engine oil and oil filter",
      priority: "Important",
      category: "Engine",
      estimatedCost: 50,
      estimatedDuration: 30,
      triggerType: "Both",
      triggerMileage: mileage + 5000,
      triggerDate: new Date(currentDate.getTime() + 180 * 24 * 60 * 60 * 1000),
      intervalMileage: 5000,
      intervalMonths: 6,
      aiReasoning: "Standard maintenance interval"
    },
    {
      taskName: "Brake Inspection",
      description: "Inspect brake pads, rotors, and brake fluid",
      priority: "Recommended",
      category: "Brakes",
      estimatedCost: 30,
      estimatedDuration: 45,
      triggerType: "Both",
      triggerMileage: mileage + 10000,
      triggerDate: new Date(currentDate.getTime() + 365 * 24 * 60 * 60 * 1000),
      intervalMileage: 10000,
      intervalMonths: 12,
      aiReasoning: "Regular safety inspection"
    },
    {
      taskName: "Tire Rotation",
      description: "Rotate tires to ensure even wear",
      priority: "Recommended",
      category: "Tires",
      estimatedCost: 25,
      estimatedDuration: 30,
      triggerType: "Mileage",
      triggerMileage: mileage + 8000,
      intervalMileage: 8000,
      aiReasoning: "Extend tire life"
    }
  ];

  return {
    tasks,
    summary: "Basic maintenance schedule (AI generation unavailable)",
    totalEstimatedAnnualCost: 200
  };
}
