/**
 * Car makers and popular models by country
 * Data compiled from market research for 2024-2025
 */

export interface CarMakerData {
  name: string;
  country: string;
  popularModels: string[];
}

export const carMakersByCountry: Record<string, CarMakerData[]> = {
  "Lebanon": [
    { name: "Toyota", country: "Lebanon", popularModels: ["Hilux", "Land Cruiser", "Corolla", "Camry", "RAV4", "Yaris"] },
    { name: "Nissan", country: "Lebanon", popularModels: ["Sunny", "Patrol", "X-Trail", "Kicks", "Altima"] },
    { name: "Kia", country: "Lebanon", popularModels: ["Sportage", "Cerato", "Rio", "Sorento", "Picanto"] },
    { name: "Hyundai", country: "Lebanon", popularModels: ["Elantra", "Tucson", "Santa Fe", "Accent", "Creta"] },
    { name: "Suzuki", country: "Lebanon", popularModels: ["Swift", "Vitara", "Jimny", "Celerio", "Ertiga"] },
    { name: "Mitsubishi", country: "Lebanon", popularModels: ["Pajero", "Outlander", "Lancer", "ASX", "L200"] },
    { name: "Honda", country: "Lebanon", popularModels: ["Civic", "Accord", "CR-V", "HR-V", "City"] },
    { name: "Mazda", country: "Lebanon", popularModels: ["CX-5", "Mazda3", "CX-9", "Mazda6", "CX-3"] },
    { name: "Chevrolet", country: "Lebanon", popularModels: ["Tahoe", "Suburban", "Silverado", "Equinox", "Traverse"] },
    { name: "Ford", country: "Lebanon", popularModels: ["F-150", "Explorer", "Edge", "Escape", "Ranger"] },
  ],
  
  "United Arab Emirates": [
    { name: "Toyota", country: "United Arab Emirates", popularModels: ["Hilux", "Land Cruiser", "Corolla", "Camry", "RAV4", "Prado"] },
    { name: "Nissan", country: "United Arab Emirates", popularModels: ["Patrol", "Sunny", "X-Trail", "Altima", "Kicks", "Pathfinder"] },
    { name: "Mitsubishi", country: "United Arab Emirates", popularModels: ["Pajero", "Outlander", "ASX", "L200", "Eclipse Cross"] },
    { name: "MG", country: "United Arab Emirates", popularModels: ["ZS", "HS", "RX5", "5", "6"] },
    { name: "Hyundai", country: "United Arab Emirates", popularModels: ["Tucson", "Elantra", "Santa Fe", "Creta", "Accent"] },
    { name: "Ford", country: "United Arab Emirates", popularModels: ["F-150", "Explorer", "Edge", "Mustang", "Ranger"] },
    { name: "Kia", country: "United Arab Emirates", popularModels: ["Sportage", "Cerato", "Sorento", "Picanto", "Seltos"] },
    { name: "Land Rover", country: "United Arab Emirates", popularModels: ["Range Rover", "Discovery", "Defender", "Range Rover Sport", "Evoque"] },
    { name: "Chevrolet", country: "United Arab Emirates", popularModels: ["Tahoe", "Suburban", "Silverado", "Traverse", "Equinox"] },
    { name: "Mercedes-Benz", country: "United Arab Emirates", popularModels: ["C-Class", "E-Class", "GLE", "GLC", "S-Class"] },
    { name: "BMW", country: "United Arab Emirates", popularModels: ["X5", "3 Series", "5 Series", "X3", "7 Series"] },
    { name: "Tesla", country: "United Arab Emirates", popularModels: ["Model 3", "Model Y", "Model S", "Model X"] },
    { name: "Jetour", country: "United Arab Emirates", popularModels: ["T2", "X70", "Dashing"] },
  ],
  
  "United States": [
    { name: "Ford", country: "United States", popularModels: ["F-150", "F-250", "F-350", "Explorer", "Escape", "Mustang", "Edge", "Bronco", "Ranger", "Maverick", "Transit"] },
    { name: "Chevrolet", country: "United States", popularModels: ["Silverado", "Equinox", "Traverse", "Tahoe", "Suburban", "Malibu", "Blazer", "Trax"] },
    { name: "Toyota", country: "United States", popularModels: ["RAV4", "Camry", "Corolla", "Highlander", "Tacoma", "Tundra", "4Runner", "Prius", "Sienna"] },
    { name: "Honda", country: "United States", popularModels: ["CR-V", "Civic", "Accord", "Pilot", "HR-V", "Odyssey", "Ridgeline"] },
    { name: "Ram", country: "United States", popularModels: ["1500", "2500", "3500", "ProMaster"] },
    { name: "GMC", country: "United States", popularModels: ["Sierra", "Terrain", "Acadia", "Yukon", "Canyon"] },
    { name: "Tesla", country: "United States", popularModels: ["Model Y", "Model 3", "Model S", "Model X", "Cybertruck"] },
    { name: "Nissan", country: "United States", popularModels: ["Rogue", "Altima", "Sentra", "Pathfinder", "Kicks", "Frontier", "Murano"] },
    { name: "Jeep", country: "United States", popularModels: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Gladiator", "Renegade"] },
    { name: "Hyundai", country: "United States", popularModels: ["Tucson", "Elantra", "Santa Fe", "Palisade", "Kona", "Sonata"] },
    { name: "Kia", country: "United States", popularModels: ["Sportage", "Seltos", "Sorento", "Telluride", "Forte", "Soul"] },
    { name: "Subaru", country: "United States", popularModels: ["Outback", "Forester", "Crosstrek", "Ascent", "Impreza", "Legacy"] },
    { name: "Mazda", country: "United States", popularModels: ["CX-5", "CX-50", "Mazda3", "CX-9", "CX-30", "Mazda6"] },
    { name: "Volkswagen", country: "United States", popularModels: ["Tiguan", "Jetta", "Atlas", "Taos", "Passat", "ID.4"] },
    { name: "BMW", country: "United States", popularModels: ["X3", "X5", "3 Series", "5 Series", "X1", "4 Series"] },
    { name: "Mercedes-Benz", country: "United States", popularModels: ["GLE", "GLC", "C-Class", "E-Class", "GLA", "S-Class"] },
    { name: "Lexus", country: "United States", popularModels: ["RX", "NX", "ES", "GX", "UX", "IS"] },
  ],
  
  "Saudi Arabia": [
    { name: "Toyota", country: "Saudi Arabia", popularModels: ["Hilux", "Land Cruiser", "Camry", "Corolla", "RAV4", "Prado"] },
    { name: "Hyundai", country: "Saudi Arabia", popularModels: ["Elantra", "Tucson", "Santa Fe", "Accent", "Creta"] },
    { name: "Nissan", country: "Saudi Arabia", popularModels: ["Patrol", "Sunny", "X-Trail", "Altima", "Kicks"] },
    { name: "Kia", country: "Saudi Arabia", popularModels: ["Sportage", "Cerato", "Sorento", "Picanto", "Seltos"] },
    { name: "Chevrolet", country: "Saudi Arabia", popularModels: ["Tahoe", "Suburban", "Silverado", "Traverse", "Equinox"] },
    { name: "Ford", country: "Saudi Arabia", popularModels: ["F-150", "Explorer", "Edge", "Ranger", "Expedition"] },
    { name: "GMC", country: "Saudi Arabia", popularModels: ["Sierra", "Yukon", "Terrain", "Acadia"] },
  ],
  
  "Egypt": [
    { name: "Hyundai", country: "Egypt", popularModels: ["Elantra", "Tucson", "Creta", "Accent", "Santa Fe"] },
    { name: "Nissan", country: "Egypt", popularModels: ["Sunny", "Sentra", "X-Trail", "Kicks", "Patrol"] },
    { name: "Toyota", country: "Egypt", popularModels: ["Corolla", "Camry", "RAV4", "Hilux", "Land Cruiser"] },
    { name: "Kia", country: "Egypt", popularModels: ["Cerato", "Sportage", "Rio", "Picanto", "Sorento"] },
    { name: "Chevrolet", country: "Egypt", popularModels: ["Optra", "Aveo", "Cruze", "Captiva", "Tahoe"] },
    { name: "Peugeot", country: "Egypt", popularModels: ["301", "308", "3008", "2008", "5008"] },
    { name: "Renault", country: "Egypt", popularModels: ["Logan", "Duster", "Megane", "Captur", "Koleos"] },
  ],
  
  "Jordan": [
    { name: "Toyota", country: "Jordan", popularModels: ["Corolla", "Camry", "RAV4", "Hilux", "Land Cruiser"] },
    { name: "Hyundai", country: "Jordan", popularModels: ["Elantra", "Tucson", "Santa Fe", "Accent", "Creta"] },
    { name: "Kia", country: "Jordan", popularModels: ["Cerato", "Sportage", "Rio", "Sorento", "Picanto"] },
    { name: "Nissan", country: "Jordan", popularModels: ["Sunny", "X-Trail", "Patrol", "Kicks", "Altima"] },
    { name: "Mitsubishi", country: "Jordan", popularModels: ["Lancer", "Outlander", "Pajero", "ASX", "L200"] },
  ],
};

/**
 * Get all unique countries
 */
export function getAllCountries(): string[] {
  return Object.keys(carMakersByCountry);
}

/**
 * Get car makers for a specific country
 */
export function getCarMakersByCountry(country: string): CarMakerData[] {
  return carMakersByCountry[country] || [];
}

/**
 * Get all car makers (deduplicated across countries)
 */
export function getAllCarMakers(): string[] {
  const makers = new Set<string>();
  Object.values(carMakersByCountry).forEach(countryMakers => {
    countryMakers.forEach(maker => makers.add(maker.name));
  });
  return Array.from(makers).sort();
}
