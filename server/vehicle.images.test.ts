import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Vehicle Images", () => {
  let testUserId: number;
  let testVehicleId: number;

  beforeAll(async () => {
    // Create test user
    const testUser = await db.createUser({
      username: `test_vehicle_images_${Date.now()}`,
      password: "test123",
      name: "Test User",
      role: "user",
    });
    testUserId = testUser.id;

    // Create test vehicle
    const testVehicle = await db.createVehicle({
      userId: testUserId,
      plateNumber: `IMG-${Date.now().toString().slice(-8)}`,
      brand: "Toyota",
      model: "Camry",
      year: 2023,
      color: "Black",
      category: "Midsize",
      status: "Available",
      dailyRate: "50.00",
    });
    testVehicleId = testVehicle.id;
  });

  it("should add exterior vehicle image", async () => {
    const image = await db.addVehicleImage({
      vehicleId: testVehicleId,
      userId: testUserId,
      imageUrl: "https://example.com/exterior1.jpg",
      imageType: "exterior",
      displayOrder: 0,
    });

    expect(image).toBeDefined();
    expect(image.vehicleId).toBe(testVehicleId);
    expect(image.imageType).toBe("exterior");
    expect(image.imageUrl).toBe("https://example.com/exterior1.jpg");
  });

  it("should add interior vehicle image", async () => {
    const image = await db.addVehicleImage({
      vehicleId: testVehicleId,
      userId: testUserId,
      imageUrl: "https://example.com/interior1.jpg",
      imageType: "interior",
      displayOrder: 0,
    });

    expect(image).toBeDefined();
    expect(image.vehicleId).toBe(testVehicleId);
    expect(image.imageType).toBe("interior");
  });

  it("should retrieve all vehicle images", async () => {
    const images = await db.getVehicleImages(testVehicleId, testUserId);

    expect(images).toBeDefined();
    expect(images.length).toBeGreaterThanOrEqual(2); // At least exterior and interior
  });

  it("should retrieve exterior images only", async () => {
    const exteriorImages = await db.getVehicleImagesByType(testVehicleId, testUserId, "exterior");

    expect(exteriorImages).toBeDefined();
    expect(exteriorImages.length).toBeGreaterThanOrEqual(1);
    exteriorImages.forEach(img => {
      expect(img.imageType).toBe("exterior");
    });
  });

  it("should retrieve interior images only", async () => {
    const interiorImages = await db.getVehicleImagesByType(testVehicleId, testUserId, "interior");

    expect(interiorImages).toBeDefined();
    expect(interiorImages.length).toBeGreaterThanOrEqual(1);
    interiorImages.forEach(img => {
      expect(img.imageType).toBe("interior");
    });
  });

  it("should add multiple images with display order", async () => {
    // Add multiple exterior images with different display orders
    await db.addVehicleImage({
      vehicleId: testVehicleId,
      userId: testUserId,
      imageUrl: "https://example.com/exterior2.jpg",
      imageType: "exterior",
      displayOrder: 1,
    });

    await db.addVehicleImage({
      vehicleId: testVehicleId,
      userId: testUserId,
      imageUrl: "https://example.com/exterior3.jpg",
      imageType: "exterior",
      displayOrder: 2,
    });

    const images = await db.getVehicleImagesByType(testVehicleId, testUserId, "exterior");
    expect(images.length).toBeGreaterThanOrEqual(3);
  });

  it("should update image display order", async () => {
    const images = await db.getVehicleImages(testVehicleId, testUserId);
    const firstImage = images[0];

    await db.updateImageDisplayOrder(firstImage.id, testUserId, 10);

    const updatedImages = await db.getVehicleImages(testVehicleId, testUserId);
    const updatedImage = updatedImages.find(img => img.id === firstImage.id);

    expect(updatedImage?.displayOrder).toBe(10);
  });

  it("should delete vehicle image", async () => {
    // Add a temporary image
    const tempImage = await db.addVehicleImage({
      vehicleId: testVehicleId,
      userId: testUserId,
      imageUrl: "https://example.com/temp.jpg",
      imageType: "exterior",
      displayOrder: 99,
    });

    // Delete it
    await db.deleteVehicleImage(tempImage.id, testUserId);

    // Verify it's deleted
    const images = await db.getVehicleImages(testVehicleId, testUserId);
    const deletedImage = images.find(img => img.id === tempImage.id);

    expect(deletedImage).toBeUndefined();
  });

  it("should handle vehicle with no images", async () => {
    // Create a new vehicle without images
    const newVehicle = await db.createVehicle({
      userId: testUserId,
      plateNumber: `NI-${Date.now().toString().slice(-8)}`,
      brand: "Honda",
      model: "Civic",
      year: 2023,
      color: "White",
      category: "Compact",
      status: "Available",
      dailyRate: "45.00",
    });

    const images = await db.getVehicleImages(newVehicle.id, testUserId);
    expect(images).toBeDefined();
    expect(images.length).toBe(0);
  });
});
