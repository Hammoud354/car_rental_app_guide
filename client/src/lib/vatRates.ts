/**
 * VAT rates by country
 * Used to automatically set the correct VAT rate based on company country
 */

export const VAT_RATES_BY_COUNTRY: Record<string, number> = {
  // Middle East
  "United Arab Emirates": 5,
  "UAE": 5,
  "Saudi Arabia": 15,
  "Qatar": 5,
  "Kuwait": 0,
  "Bahrain": 0,
  "Oman": 0,
  "Lebanon": 11,
  "Jordan": 16,
  "Egypt": 14,
  "Israel": 17,
  "Palestine": 16,
  "Iraq": 0,
  "Syria": 0,
  "Yemen": 0,
  "Turkey": 18,
  
  // Europe
  "United Kingdom": 20,
  "France": 20,
  "Germany": 19,
  "Italy": 22,
  "Spain": 21,
  "Netherlands": 21,
  "Belgium": 21,
  "Austria": 20,
  "Poland": 23,
  "Sweden": 25,
  "Denmark": 25,
  "Finland": 24,
  "Greece": 24,
  "Portugal": 23,
  "Ireland": 23,
  "Czech Republic": 21,
  "Hungary": 27,
  "Romania": 19,
  "Bulgaria": 20,
  "Croatia": 25,
  "Slovenia": 22,
  "Slovakia": 20,
  "Lithuania": 21,
  "Latvia": 21,
  "Estonia": 20,
  "Luxembourg": 17,
  "Malta": 18,
  "Cyprus": 19,
  
  // Asia
  "India": 18,
  "Pakistan": 17,
  "Bangladesh": 15,
  "Sri Lanka": 8,
  "Thailand": 7,
  "Vietnam": 10,
  "Philippines": 12,
  "Indonesia": 10,
  "Malaysia": 6,
  "Singapore": 8,
  "Japan": 10,
  "South Korea": 10,
  "China": 13,
  "Taiwan": 5,
  "Hong Kong": 0,
  "Macau": 0,
  "Mongolia": 10,
  "Kazakhstan": 12,
  "Uzbekistan": 12,
  "Turkmenistan": 15,
  "Tajikistan": 18,
  "Kyrgyzstan": 12,
  "Afghanistan": 0,
  "Iran": 9,
  
  // Americas
  "United States": 0, // No federal VAT, varies by state
  "Canada": 5, // GST
  "Mexico": 16,
  "Brazil": 0, // Complex system, varies
  "Argentina": 21,
  "Chile": 19,
  "Colombia": 19,
  "Peru": 18,
  "Venezuela": 16,
  "Ecuador": 12,
  "Bolivia": 13,
  "Paraguay": 10,
  "Uruguay": 22,
  "Costa Rica": 13,
  "Panama": 7,
  "Guatemala": 12,
  "Honduras": 15,
  "El Salvador": 13,
  "Nicaragua": 15,
  "Dominican Republic": 18,
  "Jamaica": 16,
  "Trinidad and Tobago": 15,
  "Bahamas": 7.5,
  "Belize": 12.5,
  
  // Africa
  "South Africa": 15,
  "Nigeria": 7.5,
  "Kenya": 16,
  "Ghana": 15,
  "Ethiopia": 15,
  "Morocco": 20,
  "Algeria": 19,
  "Tunisia": 19,
  "Libya": 0,
  "Sudan": 0,
  "Tanzania": 18,
  "Uganda": 18,
  "Rwanda": 18,
  "Cameroon": 19.25,
  "Ivory Coast": 18,
  "Senegal": 18,
  "Mali": 18,
  "Burkina Faso": 18,
  "Niger": 19,
  "Chad": 18,
  "Zambia": 16,
  "Zimbabwe": 15,
  "Botswana": 14,
  "Namibia": 15,
  "Angola": 14,
  "Mozambique": 17,
  "Malawi": 16,
  "Lesotho": 14,
  "Mauritius": 15,
  "Seychelles": 0,
  
  // Oceania
  "Australia": 10,
  "New Zealand": 15,
  "Fiji": 9,
  "Papua New Guinea": 10,
  "Solomon Islands": 10,
  "Samoa": 15,
  "Vanuatu": 12.5,
  "Kiribati": 0,
  "Marshall Islands": 0,
  "Micronesia": 0,
  "Nauru": 0,
  "Palau": 0,
  "Tuvalu": 0,
};

/**
 * Get VAT rate for a specific country
 * @param country - Country name
 * @param defaultRate - Default VAT rate if country not found (default: 11)
 * @returns VAT rate as a percentage
 */
export function getVATRateByCountry(country: string | null | undefined, defaultRate: number = 11): number {
  if (!country) return defaultRate;
  
  // Try exact match first
  if (VAT_RATES_BY_COUNTRY[country]) {
    return VAT_RATES_BY_COUNTRY[country];
  }
  
  // Try case-insensitive match
  const lowerCountry = country.toLowerCase();
  for (const [key, rate] of Object.entries(VAT_RATES_BY_COUNTRY)) {
    if (key.toLowerCase() === lowerCountry) {
      return rate;
    }
  }
  
  // Return default if not found
  return defaultRate;
}

/**
 * Get all available countries with their VAT rates
 * @returns Array of countries sorted alphabetically
 */
export function getAllCountriesWithVAT(): Array<{ country: string; rate: number }> {
  return Object.entries(VAT_RATES_BY_COUNTRY)
    .map(([country, rate]) => ({ country, rate }))
    .sort((a, b) => a.country.localeCompare(b.country));
}
