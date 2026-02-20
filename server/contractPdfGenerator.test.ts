import { describe, it, expect } from "vitest";
import { formatContractDataForPDF } from "./contractPdfGenerator";

describe("Contract PDF Generator", () => {
  describe("formatContractDataForPDF", () => {
    const mockContract = {
      id: 1,
      contractNumber: "CTR-001",
      startDate: new Date("2026-02-20T00:00:00Z"),
      endDate: new Date("2026-02-25T00:00:00Z"),
      pickupLocation: "Main Office",
      returnLocation: "Main Office",
      dailyRate: "89.50", // String from database (DECIMAL type)
      totalAmount: "447.50", // String from database
      depositAmount: "500.00", // String from database
      vehicleId: 1,
      clientId: 1,
      userId: 1,
      status: "active",
      createdAt: new Date("2026-02-20T00:00:00Z"),
      updatedAt: new Date("2026-02-20T00:00:00Z"),
    };

    const mockClient = {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      nationality: "Lebanese",
      phone: "+961-1-123456",
      address: "Beirut, Lebanon",
      drivingLicenseNumber: "6789",
      licenseIssueDate: new Date("2020-01-01T00:00:00Z"),
      licenseExpiryDate: new Date("2030-01-01T00:00:00Z"),
      email: "john@example.com",
      userId: 1,
    };

    const mockVehicle = {
      id: 1,
      plateNumber: "654345 M",
      make: "Kia",
      model: "Rio",
      year: 2024,
      userId: 1,
    };

    const mockCompany = {
      id: 1,
      userId: 1,
      companyName: "Test Rental Company",
      address: "123 Main St",
      phone: "+961-1-999999",
      email: "info@rental.com",
    };

    it("should format contract data with string numeric values", () => {
      const result = formatContractDataForPDF(mockContract, mockClient, mockVehicle, mockCompany);

      expect(result.clientName).toBe("John Doe");
      expect(result.clientPhone).toBe("+961-1-123456");
      expect(result.clientAddress).toBe("Beirut, Lebanon");
      expect(result.clientLicenseNumber).toBe("6789");
      expect(result.vehiclePlate).toBe("654345 M");
      expect(result.vehicleMake).toBe("Kia");
      expect(result.vehicleModel).toBe("Rio");
      expect(result.vehicleYear).toBe("2024");
      expect(result.contractNumber).toBe("CTR-001");
      expect(result.companyName).toBe("Test Rental Company");
    });

    it("should convert string dailyRate to formatted currency", () => {
      const result = formatContractDataForPDF(mockContract, mockClient, mockVehicle, mockCompany);

      expect(result.dailyRate).toBe("$89.50");
    });

    it("should convert string totalAmount to formatted currency", () => {
      const result = formatContractDataForPDF(mockContract, mockClient, mockVehicle, mockCompany);

      expect(result.totalAmount).toBe("$447.50");
    });

    it("should convert string depositAmount to formatted currency", () => {
      const result = formatContractDataForPDF(mockContract, mockClient, mockVehicle, mockCompany);

      expect(result.deposit).toBe("$500.00");
    });

    it("should handle numeric dailyRate values", () => {
      const contractWithNumber = {
        ...mockContract,
        dailyRate: 89.50 as any, // Number instead of string
      };

      const result = formatContractDataForPDF(contractWithNumber, mockClient, mockVehicle, mockCompany);

      expect(result.dailyRate).toBe("$89.50");
    });

    it("should handle missing client data gracefully", () => {
      const result = formatContractDataForPDF(mockContract, null as any, mockVehicle, mockCompany);

      expect(result.clientName).toBe("");
      expect(result.clientPhone).toBe("");
      expect(result.clientAddress).toBe("");
      expect(result.clientLicenseNumber).toBe("");
    });

    it("should handle missing vehicle data gracefully", () => {
      const result = formatContractDataForPDF(mockContract, mockClient, null as any, mockCompany);

      expect(result.vehiclePlate).toBe("");
      expect(result.vehicleMake).toBe("");
      expect(result.vehicleModel).toBe("");
      expect(result.vehicleYear).toBe("");
    });

    it("should handle missing company data gracefully", () => {
      const result = formatContractDataForPDF(mockContract, mockClient, mockVehicle, null as any);

      expect(result.companyName).toBe("");
      expect(result.companyAddress).toBe("");
      expect(result.companyPhone).toBe("");
    });

    it("should format dates correctly", () => {
      const result = formatContractDataForPDF(mockContract, mockClient, mockVehicle, mockCompany);

      // Date formatting is locale-dependent, just verify it's a valid date string
      expect(result.startDate).toMatch(/\d+\/\d+\/2026/);
      expect(result.endDate).toMatch(/\d+\/\d+\/2026/);
    });

    it("should handle zero values in numeric fields", () => {
      const contractWithZero = {
        ...mockContract,
        dailyRate: "0",
        totalAmount: "0",
        depositAmount: "0",
      };

      const result = formatContractDataForPDF(contractWithZero, mockClient, mockVehicle, mockCompany);

      expect(result.dailyRate).toBe("$0.00");
      expect(result.totalAmount).toBe("$0.00");
      expect(result.deposit).toBe("$0.00");
    });

    it("should handle large numeric values", () => {
      const contractWithLargeValues = {
        ...mockContract,
        dailyRate: "999.99",
        totalAmount: "9999.99",
        depositAmount: "5000.00",
      };

      const result = formatContractDataForPDF(contractWithLargeValues, mockClient, mockVehicle, mockCompany);

      expect(result.dailyRate).toBe("$999.99");
      expect(result.totalAmount).toBe("$9999.99");
      expect(result.deposit).toBe("$5000.00");
    });

    it("should handle decimal precision correctly", () => {
      const contractWithPrecision = {
        ...mockContract,
        dailyRate: "89.555", // Should round to 2 decimals
        totalAmount: "447.556",
        depositAmount: "500.001",
      };

      const result = formatContractDataForPDF(contractWithPrecision, mockClient, mockVehicle, mockCompany);

      expect(result.dailyRate).toBe("$89.56"); // Rounded up
      expect(result.totalAmount).toBe("$447.56"); // Rounded up
      expect(result.deposit).toBe("$500.00"); // Rounded down
    });

    it("should use contract ID as fallback for contract number", () => {
      const contractWithoutNumber = {
        ...mockContract,
        contractNumber: null,
      };

      const result = formatContractDataForPDF(contractWithoutNumber, mockClient, mockVehicle, mockCompany);

      expect(result.contractNumber).toBe("1");
    });
  });
});
