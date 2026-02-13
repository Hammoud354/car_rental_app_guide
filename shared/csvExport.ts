/**
 * CSV Export Utilities
 * Converts data to CSV format and triggers download
 */

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  // Get headers from first object keys
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle null/undefined
        if (value === null || value === undefined) return "";
        // Handle dates
        if (value instanceof Date) return value.toISOString().split("T")[0];
        // Handle strings with commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(",")
    )
  ].join("\n");

  // Create blob and download
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

// Export vehicles to CSV
export function exportVehiclesToCSV(vehicles: any[]) {
  const exportData = vehicles.map(v => ({
    "Plate Number": v.plateNumber,
    "Brand": v.brand,
    "Model": v.model,
    "Year": v.year,
    "Color": v.color,
    "Category": v.category,
    "Status": v.status,
    "Daily Rate": v.dailyRate,
    "Weekly Rate": v.weeklyRate || "",
    "Monthly Rate": v.monthlyRate || "",
    "Mileage": v.mileage || "",
    "VIN": v.vin || "",
    "Insurance Policy": v.insurancePolicyNumber || "",
    "Insurance Cost": v.insuranceCost || "",
    "Purchase Cost": v.purchaseCost || "",
    "Notes": v.notes || "",
  }));
  
  exportToCSV(exportData, "vehicles");
}

// Export clients to CSV
export function exportClientsToCSV(clients: any[]) {
  const exportData = clients.map(c => ({
    "First Name": c.firstName,
    "Last Name": c.lastName,
    "Email": c.email || "",
    "Phone": c.phone || "",
    "Nationality": c.nationality || "",
    "License Number": c.drivingLicenseNumber || "",
    "License Issue Date": c.drivingLicenseIssueDate || "",
    "License Expiry Date": c.drivingLicenseExpiryDate || "",
    "Notes": c.notes || "",
  }));
  
  exportToCSV(exportData, "clients");
}

// Export contracts to CSV
export function exportContractsToCSV(contracts: any[]) {
  const exportData = contracts.map(c => ({
    "Contract ID": c.id,
    "Client Name": `${c.client?.firstName || ""} ${c.client?.lastName || ""}`.trim(),
    "Vehicle": `${c.vehicle?.brand || ""} ${c.vehicle?.model || ""} (${c.vehicle?.plateNumber || ""})`.trim(),
    "Start Date": c.startDate,
    "End Date": c.endDate,
    "Status": c.status,
    "Daily Rate": c.dailyRate,
    "Total Days": c.totalDays || "",
    "Base Amount": c.baseAmount || "",
    "Discount": c.discount || "",
    "Additional Charges": c.additionalCharges || "",
    "Final Amount": c.finalAmount || "",
    "Payment Status": c.paymentStatus || "",
    "Notes": c.notes || "",
  }));
  
  exportToCSV(exportData, "contracts");
}
