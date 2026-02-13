/**
 * Tests for AI-powered maintenance schedule generator
 */

import { describe, it, expect } from 'vitest';
import { generateMaintenanceSchedule } from './aiMaintenanceGenerator';
import type { Vehicle } from '../drizzle/schema';

describe('AI Maintenance Schedule Generator', () => {
  it('should generate maintenance schedule for a new vehicle', async () => {
    const testVehicle: Partial<Vehicle> = {
      id: 1,
      userId: 1,
      plateNumber: 'TEST123',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2023,
      color: 'White',
      category: 'Compact',
      status: 'Available',
      dailyRate: '50.00',
      mileage: 15000,
      engineType: 'Gasoline',
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      engineSize: '1.8L',
      purchaseDate: new Date('2023-01-15'),
      averageDailyKm: 50,
      usagePattern: 'Mixed',
      climate: 'Moderate',
      lastServiceDate: new Date('2024-06-01'),
      lastServiceKm: 10000,
      aiMaintenanceEnabled: true,
    };

    const schedule = await generateMaintenanceSchedule(testVehicle as Vehicle);

    // Verify schedule structure
    expect(schedule).toBeDefined();
    expect(schedule.tasks).toBeDefined();
    expect(Array.isArray(schedule.tasks)).toBe(true);
    expect(schedule.summary).toBeDefined();
    expect(typeof schedule.summary).toBe('string');
    expect(schedule.totalEstimatedAnnualCost).toBeDefined();
    expect(typeof schedule.totalEstimatedAnnualCost).toBe('number');

    // Verify we got a reasonable number of tasks
    expect(schedule.tasks.length).toBeGreaterThanOrEqual(3);
    expect(schedule.tasks.length).toBeLessThanOrEqual(20);

    console.log(`\n✅ Generated ${schedule.tasks.length} maintenance tasks`);
    console.log(`📊 Total estimated annual cost: $${schedule.totalEstimatedAnnualCost}`);
    console.log(`📝 Summary: ${schedule.summary}\n`);
  }, 30000); // 30 second timeout for LLM call

  it('should generate tasks with all required fields', async () => {
    const testVehicle: Partial<Vehicle> = {
      id: 2,
      userId: 1,
      plateNumber: 'TEST456',
      brand: 'Honda',
      model: 'Civic',
      year: 2020,
      color: 'Blue',
      category: 'Compact',
      status: 'Available',
      dailyRate: '45.00',
      mileage: 45000,
      engineType: 'Gasoline',
      transmission: 'Manual',
      fuelType: 'Gasoline',
      engineSize: '2.0L',
      purchaseDate: new Date('2020-03-10'),
      averageDailyKm: 80,
      usagePattern: 'City',
      climate: 'Hot',
      lastServiceDate: new Date('2024-01-15'),
      lastServiceKm: 40000,
      aiMaintenanceEnabled: true,
    };

    const schedule = await generateMaintenanceSchedule(testVehicle as Vehicle);

    // Verify each task has required fields
    schedule.tasks.forEach((task, index) => {
      expect(task.taskName, `Task ${index + 1} should have taskName`).toBeDefined();
      expect(task.description, `Task ${index + 1} should have description`).toBeDefined();
      expect(task.priority, `Task ${index + 1} should have priority`).toBeDefined();
      expect(['Critical', 'Important', 'Recommended', 'Optional']).toContain(task.priority);
      expect(task.category, `Task ${index + 1} should have category`).toBeDefined();
      expect(task.estimatedCost, `Task ${index + 1} should have estimatedCost`).toBeGreaterThanOrEqual(0);
      expect(task.estimatedDuration, `Task ${index + 1} should have estimatedDuration`).toBeGreaterThan(0);
      expect(task.triggerType, `Task ${index + 1} should have triggerType`).toBeDefined();
      expect(['Mileage', 'Time', 'Both']).toContain(task.triggerType);
      expect(task.aiReasoning, `Task ${index + 1} should have aiReasoning`).toBeDefined();
    });

    console.log('\n✅ All tasks have required fields\n');
  }, 30000);

  it('should include different priority levels', async () => {
    const testVehicle: Partial<Vehicle> = {
      id: 3,
      userId: 1,
      plateNumber: 'TEST789',
      brand: 'BMW',
      model: 'X5',
      year: 2018,
      color: 'Black',
      category: 'SUV',
      status: 'Available',
      dailyRate: '120.00',
      mileage: 85000,
      engineType: 'Diesel',
      transmission: 'Automatic',
      fuelType: 'Diesel',
      engineSize: '3.0L',
      purchaseDate: new Date('2018-06-20'),
      averageDailyKm: 100,
      usagePattern: 'Highway',
      climate: 'Cold',
      lastServiceDate: new Date('2023-08-10'),
      lastServiceKm: 75000,
      aiMaintenanceEnabled: true,
    };

    const schedule = await generateMaintenanceSchedule(testVehicle as Vehicle);

    // Count tasks by priority
    const priorityCounts = {
      Critical: 0,
      Important: 0,
      Recommended: 0,
      Optional: 0,
    };

    schedule.tasks.forEach(task => {
      priorityCounts[task.priority]++;
    });

    console.log('\n📊 Priority Distribution:');
    console.log(`   Critical: ${priorityCounts.Critical}`);
    console.log(`   Important: ${priorityCounts.Important}`);
    console.log(`   Recommended: ${priorityCounts.Recommended}`);
    console.log(`   Optional: ${priorityCounts.Optional}\n`);

    // Should have at least 2 different priority levels
    const uniquePriorities = Object.values(priorityCounts).filter(count => count > 0).length;
    expect(uniquePriorities).toBeGreaterThanOrEqual(2);

    console.log(`✅ Found ${uniquePriorities} different priority levels\n`);
  }, 30000);

  it('should generate appropriate tasks for high-mileage vehicles', async () => {
    const testVehicle: Partial<Vehicle> = {
      id: 4,
      userId: 1,
      plateNumber: 'HIGH001',
      brand: 'Mercedes',
      model: 'E-Class',
      year: 2015,
      color: 'Silver',
      category: 'Luxury',
      status: 'Available',
      dailyRate: '150.00',
      mileage: 150000, // High mileage
      engineType: 'Gasoline',
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      engineSize: '2.5L',
      purchaseDate: new Date('2015-04-12'),
      averageDailyKm: 120,
      usagePattern: 'Mixed',
      climate: 'Moderate',
      lastServiceDate: new Date('2023-12-01'),
      lastServiceKm: 145000,
      aiMaintenanceEnabled: true,
    };

    const schedule = await generateMaintenanceSchedule(testVehicle as Vehicle);

    // High mileage vehicles should have more Important/Critical tasks
    const highPriorityTasks = schedule.tasks.filter(
      task => task.priority === 'Critical' || task.priority === 'Important'
    );

    console.log(`\n🚗 High-mileage vehicle (150,000 km)`);
    console.log(`   Total tasks: ${schedule.tasks.length}`);
    console.log(`   High-priority tasks: ${highPriorityTasks.length}`);
    console.log(`   Estimated annual cost: $${schedule.totalEstimatedAnnualCost}\n`);

    expect(highPriorityTasks.length).toBeGreaterThanOrEqual(1);
  }, 30000);

  it('should include various maintenance categories', async () => {
    const testVehicle: Partial<Vehicle> = {
      id: 5,
      userId: 1,
      plateNumber: 'CAT001',
      brand: 'Ford',
      model: 'F-150',
      year: 2021,
      color: 'Red',
      category: 'Truck',
      status: 'Available',
      dailyRate: '80.00',
      mileage: 30000,
      engineType: 'Gasoline',
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      engineSize: '5.0L',
      purchaseDate: new Date('2021-09-01'),
      averageDailyKm: 60,
      usagePattern: 'Mixed',
      climate: 'Hot',
      lastServiceDate: new Date('2024-05-01'),
      lastServiceKm: 25000,
      aiMaintenanceEnabled: true,
    };

    const schedule = await generateMaintenanceSchedule(testVehicle as Vehicle);

    // Collect unique categories
    const categories = new Set(schedule.tasks.map(task => task.category));

    console.log('\n🔧 Maintenance Categories:');
    categories.forEach(cat => {
      const count = schedule.tasks.filter(t => t.category === cat).length;
      console.log(`   ${cat}: ${count} tasks`);
    });
    console.log('');

    // Should have multiple categories
    expect(categories.size).toBeGreaterThanOrEqual(3);

    console.log(`✅ Found ${categories.size} different maintenance categories\n`);
  }, 30000);

  it('should handle vehicles with minimal information gracefully', async () => {
    const minimalVehicle: Partial<Vehicle> = {
      id: 6,
      userId: 1,
      plateNumber: 'MIN001',
      brand: 'Generic',
      model: 'Car',
      year: 2022,
      color: 'White',
      category: 'Economy',
      status: 'Available',
      dailyRate: '35.00',
      mileage: 5000,
      // Minimal AI fields - most are undefined
      aiMaintenanceEnabled: true,
    };

    const schedule = await generateMaintenanceSchedule(minimalVehicle as Vehicle);

    // Should still generate a valid schedule
    expect(schedule).toBeDefined();
    expect(schedule.tasks.length).toBeGreaterThanOrEqual(3);
    expect(schedule.summary).toBeDefined();

    console.log('\n✅ Successfully generated schedule for vehicle with minimal data');
    console.log(`   Generated ${schedule.tasks.length} tasks\n`);
  }, 30000);
});
