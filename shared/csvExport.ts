/**
 * CSV Export Utilities
 * Converts data to CSV format and triggers download
 */

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  const headers = Object.keys(data[0]);

  const csvContent = [
    headers.join(","),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (value instanceof Date) return value.toISOString().split("T")[0];
        if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const fmt = (d: any) => d ? new Date(d).toLocaleDateString() : "";

// Export vehicles to CSV
export function exportVehiclesToCSV(vehicles: any[]) {
  const exportData = vehicles.map(v => ({
    "Plate Number": v.plateNumber || "",
    "Brand": v.brand || "",
    "Model": v.model || "",
    "Year": v.year || "",
    "Color": v.color || "",
    "Category": v.category || "",
    "Status": v.status || "",
    "Daily Rate": v.dailyRate || "",
    "Weekly Rate": v.weeklyRate || "",
    "Monthly Rate": v.monthlyRate || "",
    "Mileage": v.mileage || "",
    "VIN": v.vin || "",
    "Insurance Policy": v.insurancePolicyNumber || "",
    "Insurance Expiry": fmt(v.insuranceExpiryDate),
    "Insurance Cost": v.insuranceCost || "",
    "Purchase Cost": v.purchaseCost || "",
    "Registration Expiry": fmt(v.registrationExpiryDate),
    "Notes": v.notes || "",
  }));
  exportToCSV(exportData, "vehicles");
}

// Export clients to CSV — uses schema field names: name, fatherName, motherFullName, driverLicenseNumber, etc.
export function exportClientsToCSV(clients: any[]) {
  const exportData = clients.map(c => ({
    "Full Name": c.name || "",
    "Father's Name": c.fatherName || "",
    "Mother's Full Name": c.motherFullName || "",
    "Phone": c.phone || "",
    "Email": c.email || "",
    "Nationality": c.nationality || "",
    "Date of Birth": fmt(c.dateOfBirth),
    "Place of Birth": c.placeOfBirth || "",
    "Driver License Number": c.driverLicenseNumber || "",
    "License Issue Date": fmt(c.licenseIssueDate),
    "License Expiry Date": fmt(c.licenseExpiryDate),
    "Passport Number": c.passportNumber || "",
    "ID Number": c.idNumber || "",
    "Place of Registration": c.placeOfRegistration || "",
    "Address": c.address || "",
    "Notes": c.notes || "",
  }));
  exportToCSV(exportData, "clients");
}

// Export contracts to CSV — uses denormalized contract fields (no nested client/vehicle objects)
export function exportContractsToCSV(contracts: any[]) {
  const exportData = contracts.map(c => ({
    "Contract Number": c.contractNumber || c.id || "",
    "Client Name": c.clientName || "",
    "Client Phone": c.clientPhone || "",
    "Client Email": c.clientEmail || "",
    "Client Nationality": c.clientNationality || "",
    "Client License": c.clientDriverLicense || "",
    "Client Date of Birth": fmt(c.clientDateOfBirth),
    "Client Father's Name": c.clientFatherFullName || "",
    "Client Mother's Name": c.clientMotherFullName || "",
    "Client Passport": c.clientPassport || "",
    "Client ID": c.clientId2 || "",
    "Client Address": c.clientAddress || "",
    "Start Date": fmt(c.rentalStartDate || c.startDate),
    "End Date": fmt(c.rentalEndDate || c.endDate),
    "Rental Days": c.rentalDays || c.totalDays || "",
    "Daily Rate": c.dailyRate || "",
    "Total Amount": c.totalAmount || c.baseAmount || "",
    "Discount": c.discount || "",
    "Final Amount": c.finalAmount || "",
    "Status": c.status || "",
    "Payment Status": c.paymentStatus || "",
    "Pickup KM": c.pickupKm || "",
    "Return KM": c.returnKm || "",
    "Returned At": fmt(c.returnedAt),
    "Notes": c.notes || "",
  }));
  exportToCSV(exportData, "contracts");
}
