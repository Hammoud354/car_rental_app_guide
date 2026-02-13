/**
 * CSV Import Utilities
 * Handles parsing and validation of CSV files for bulk data import
 */

export interface VehicleImportRow {
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  vin?: string;
  color?: string;
  mileage?: string;
  category?: string;
  status?: string;
  dailyRate?: string;
  purchaseCost?: string;
}

export interface ClientImportRow {
  name: string;
  email?: string;
  phone?: string;
  drivingLicenseNumber?: string;
  nationality?: string;
  address?: string;
}

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  warnings: string[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

/**
 * Parse CSV text into rows
 */
export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const rows: string[][] = [];
  
  for (const line of lines) {
    // Simple CSV parser (handles basic cases, not complex quoted fields)
    const fields = line.split(',').map(field => field.trim());
    rows.push(fields);
  }
  
  return rows;
}

/**
 * Validate and parse vehicle import data
 */
export function parseVehicleImport(csvText: string): ImportResult<VehicleImportRow> {
  const rows = parseCSV(csvText);
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  const data: VehicleImportRow[] = [];
  
  if (rows.length === 0) {
    return { success: false, data: [], errors: [{ row: 0, field: 'file', message: 'CSV file is empty' }], warnings: [] };
  }
  
  // Expect header row
  const headers = rows[0].map(h => h.toLowerCase());
  const requiredFields = ['brand', 'model', 'year', 'licenseplate'];
  
  // Check required headers
  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      errors.push({ row: 0, field, message: `Missing required column: ${field}` });
    }
  }
  
  if (errors.length > 0) {
    return { success: false, data: [], errors, warnings: [] };
  }
  
  // Parse data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const vehicle: VehicleImportRow = {
      brand: '',
      model: '',
      year: '',
      licensePlate: '',
    };
    
    headers.forEach((header, index) => {
      const value = row[index] || '';
      
      switch (header) {
        case 'brand':
          vehicle.brand = value;
          break;
        case 'model':
          vehicle.model = value;
          break;
        case 'year':
          vehicle.year = value;
          break;
        case 'licenseplate':
        case 'license_plate':
          vehicle.licensePlate = value;
          break;
        case 'vin':
          vehicle.vin = value;
          break;
        case 'color':
          vehicle.color = value;
          break;
        case 'mileage':
          vehicle.mileage = value;
          break;
        case 'category':
          vehicle.category = value;
          break;
        case 'status':
          vehicle.status = value;
          break;
        case 'dailyrate':
        case 'daily_rate':
          vehicle.dailyRate = value;
          break;
        case 'purchasecost':
        case 'purchase_cost':
          vehicle.purchaseCost = value;
          break;
      }
    });
    
    // Validate required fields
    if (!vehicle.brand) {
      errors.push({ row: i + 1, field: 'brand', message: 'Brand is required' });
    }
    if (!vehicle.model) {
      errors.push({ row: i + 1, field: 'model', message: 'Model is required' });
    }
    if (!vehicle.year) {
      errors.push({ row: i + 1, field: 'year', message: 'Year is required' });
    } else if (isNaN(parseInt(vehicle.year))) {
      errors.push({ row: i + 1, field: 'year', message: 'Year must be a number' });
    }
    if (!vehicle.licensePlate) {
      errors.push({ row: i + 1, field: 'licensePlate', message: 'License plate is required' });
    }
    
    // Validate optional numeric fields
    if (vehicle.mileage && isNaN(parseInt(vehicle.mileage))) {
      errors.push({ row: i + 1, field: 'mileage', message: 'Mileage must be a number' });
    }
    if (vehicle.dailyRate && isNaN(parseFloat(vehicle.dailyRate))) {
      errors.push({ row: i + 1, field: 'dailyRate', message: 'Daily rate must be a number' });
    }
    if (vehicle.purchaseCost && isNaN(parseFloat(vehicle.purchaseCost))) {
      errors.push({ row: i + 1, field: 'purchaseCost', message: 'Purchase cost must be a number' });
    }
    
    data.push(vehicle);
  }
  
  return {
    success: errors.length === 0,
    data,
    errors,
    warnings
  };
}

/**
 * Validate and parse client import data
 */
export function parseClientImport(csvText: string): ImportResult<ClientImportRow> {
  const rows = parseCSV(csvText);
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  const data: ClientImportRow[] = [];
  
  if (rows.length === 0) {
    return { success: false, data: [], errors: [{ row: 0, field: 'file', message: 'CSV file is empty' }], warnings: [] };
  }
  
  // Expect header row
  const headers = rows[0].map(h => h.toLowerCase());
  const requiredFields = ['name'];
  
  // Check required headers
  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      errors.push({ row: 0, field, message: `Missing required column: ${field}` });
    }
  }
  
  if (errors.length > 0) {
    return { success: false, data: [], errors, warnings: [] };
  }
  
  // Parse data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const client: ClientImportRow = {
      name: '',
    };
    
    headers.forEach((header, index) => {
      const value = row[index] || '';
      
      switch (header) {
        case 'name':
          client.name = value;
          break;
        case 'email':
          client.email = value;
          break;
        case 'phone':
          client.phone = value;
          break;
        case 'drivinglicensenumber':
        case 'driving_license_number':
        case 'license':
          client.drivingLicenseNumber = value;
          break;
        case 'nationality':
          client.nationality = value;
          break;
        case 'address':
          client.address = value;
          break;
      }
    });
    
    // Validate required fields
    if (!client.name) {
      errors.push({ row: i + 1, field: 'name', message: 'Name is required' });
    }
    
    // Validate email format if provided
    if (client.email && !client.email.includes('@')) {
      warnings.push(`Row ${i + 1}: Email format may be invalid`);
    }
    
    data.push(client);
  }
  
  return {
    success: errors.length === 0,
    data,
    errors,
    warnings
  };
}

/**
 * Generate sample CSV template for vehicles
 */
export function generateVehicleTemplate(): string {
  return `brand,model,year,licensePlate,vin,color,mileage,category,status,dailyRate,purchaseCost
Toyota,Camry,2022,ABC-1234,1HGBH41JXMN109186,White,15000,Midsize,Available,50,25000
Honda,Civic,2021,XYZ-5678,2HGFC2F59MH123456,Black,20000,Compact,Available,45,22000`;
}

/**
 * Generate sample CSV template for clients
 */
export function generateClientTemplate(): string {
  return `name,email,phone,drivingLicenseNumber,nationality,address
John Doe,john@example.com,+1234567890,DL123456,American,123 Main St
Jane Smith,jane@example.com,+0987654321,DL789012,Canadian,456 Oak Ave`;
}
