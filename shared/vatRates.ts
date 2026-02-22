/**
 * VAT rates and official exchange rates by country
 * Used to automatically set the correct VAT rate and exchange rate based on company country
 * Exchange rates are relative to USD (1 USD = X local currency)
 */

export interface CountryFinancialSettings {
  vatRate: number;
  exchangeRate: number; // 1 USD = X local currency
}

export const COUNTRY_FINANCIAL_SETTINGS: Record<string, CountryFinancialSettings> = {
  // Middle East
  "United Arab Emirates": { vatRate: 5, exchangeRate: 3.6725 },
  "UAE": { vatRate: 5, exchangeRate: 3.6725 },
  "Saudi Arabia": { vatRate: 15, exchangeRate: 3.75 },
  "Qatar": { vatRate: 5, exchangeRate: 3.64 },
  "Kuwait": { vatRate: 0, exchangeRate: 0.3071 },
  "Bahrain": { vatRate: 0, exchangeRate: 0.377 },
  "Oman": { vatRate: 0, exchangeRate: 0.3845 },
  "Lebanon": { vatRate: 11, exchangeRate: 89500 },
  "Jordan": { vatRate: 16, exchangeRate: 0.709 },
  "Egypt": { vatRate: 14, exchangeRate: 30.9 },
  "Israel": { vatRate: 17, exchangeRate: 3.65 },
  "Palestine": { vatRate: 16, exchangeRate: 3.65 },
  "Iraq": { vatRate: 0, exchangeRate: 1310 },
  "Syria": { vatRate: 0, exchangeRate: 2512 },
  "Yemen": { vatRate: 0, exchangeRate: 250 },
  "Turkey": { vatRate: 18, exchangeRate: 32.5 },
  
  // Europe
  "United Kingdom": { vatRate: 20, exchangeRate: 0.79 },
  "France": { vatRate: 20, exchangeRate: 0.92 },
  "Germany": { vatRate: 19, exchangeRate: 0.92 },
  "Italy": { vatRate: 22, exchangeRate: 0.92 },
  "Spain": { vatRate: 21, exchangeRate: 0.92 },
  "Netherlands": { vatRate: 21, exchangeRate: 0.92 },
  "Belgium": { vatRate: 21, exchangeRate: 0.92 },
  "Austria": { vatRate: 20, exchangeRate: 0.92 },
  "Poland": { vatRate: 23, exchangeRate: 4.0 },
  "Sweden": { vatRate: 25, exchangeRate: 10.5 },
  "Denmark": { vatRate: 25, exchangeRate: 6.85 },
  "Finland": { vatRate: 24, exchangeRate: 0.92 },
  "Greece": { vatRate: 24, exchangeRate: 0.92 },
  "Portugal": { vatRate: 23, exchangeRate: 0.92 },
  "Ireland": { vatRate: 23, exchangeRate: 0.92 },
  "Czech Republic": { vatRate: 21, exchangeRate: 23.5 },
  "Hungary": { vatRate: 27, exchangeRate: 360 },
  "Romania": { vatRate: 19, exchangeRate: 4.97 },
  "Bulgaria": { vatRate: 20, exchangeRate: 1.8 },
  "Croatia": { vatRate: 25, exchangeRate: 6.95 },
  "Slovenia": { vatRate: 22, exchangeRate: 0.92 },
  "Slovakia": { vatRate: 20, exchangeRate: 0.92 },
  "Lithuania": { vatRate: 21, exchangeRate: 0.92 },
  "Latvia": { vatRate: 21, exchangeRate: 0.92 },
  "Estonia": { vatRate: 20, exchangeRate: 0.92 },
  "Luxembourg": { vatRate: 17, exchangeRate: 0.92 },
  "Malta": { vatRate: 18, exchangeRate: 0.92 },
  "Cyprus": { vatRate: 19, exchangeRate: 0.92 },
  
  // Asia
  "India": { vatRate: 18, exchangeRate: 83.5 },
  "Pakistan": { vatRate: 17, exchangeRate: 277 },
  "Bangladesh": { vatRate: 15, exchangeRate: 104 },
  "Sri Lanka": { vatRate: 8, exchangeRate: 329 },
  "Thailand": { vatRate: 7, exchangeRate: 35.5 },
  "Vietnam": { vatRate: 10, exchangeRate: 24200 },
  "Philippines": { vatRate: 12, exchangeRate: 56 },
  "Indonesia": { vatRate: 10, exchangeRate: 15650 },
  "Malaysia": { vatRate: 6, exchangeRate: 4.65 },
  "Singapore": { vatRate: 8, exchangeRate: 1.35 },
  "Japan": { vatRate: 10, exchangeRate: 149 },
  "South Korea": { vatRate: 10, exchangeRate: 1310 },
  "China": { vatRate: 13, exchangeRate: 7.24 },
  "Taiwan": { vatRate: 5, exchangeRate: 31.5 },
  "Hong Kong": { vatRate: 0, exchangeRate: 7.78 },
  "Macau": { vatRate: 0, exchangeRate: 8.03 },
  "Mongolia": { vatRate: 10, exchangeRate: 3400 },
  "Kazakhstan": { vatRate: 12, exchangeRate: 430 },
  "Uzbekistan": { vatRate: 12, exchangeRate: 12800 },
  "Turkmenistan": { vatRate: 15, exchangeRate: 3.5 },
  "Tajikistan": { vatRate: 18, exchangeRate: 10.5 },
  "Kyrgyzstan": { vatRate: 12, exchangeRate: 85 },
  "Afghanistan": { vatRate: 0, exchangeRate: 65 },
  "Iran": { vatRate: 9, exchangeRate: 42000 },
  
  // Americas
  "United States": { vatRate: 0, exchangeRate: 1.0 },
  "Canada": { vatRate: 5, exchangeRate: 1.36 },
  "Mexico": { vatRate: 16, exchangeRate: 17.05 },
  "Brazil": { vatRate: 0, exchangeRate: 4.97 },
  "Argentina": { vatRate: 21, exchangeRate: 835 },
  "Chile": { vatRate: 19, exchangeRate: 950 },
  "Colombia": { vatRate: 19, exchangeRate: 3900 },
  "Peru": { vatRate: 18, exchangeRate: 3.75 },
  "Venezuela": { vatRate: 16, exchangeRate: 2.65 },
  "Ecuador": { vatRate: 12, exchangeRate: 1.0 },
  "Bolivia": { vatRate: 13, exchangeRate: 6.9 },
  "Paraguay": { vatRate: 10, exchangeRate: 7100 },
  "Uruguay": { vatRate: 22, exchangeRate: 39 },
  "Costa Rica": { vatRate: 13, exchangeRate: 525 },
  "Panama": { vatRate: 7, exchangeRate: 1.0 },
  "Guatemala": { vatRate: 12, exchangeRate: 7.75 },
  "Honduras": { vatRate: 15, exchangeRate: 24.5 },
  "El Salvador": { vatRate: 13, exchangeRate: 8.75 },
  "Nicaragua": { vatRate: 15, exchangeRate: 36.5 },
  "Dominican Republic": { vatRate: 18, exchangeRate: 58 },
  "Jamaica": { vatRate: 16, exchangeRate: 155 },
  "Trinidad and Tobago": { vatRate: 15, exchangeRate: 6.75 },
  "Bahamas": { vatRate: 7.5, exchangeRate: 1.0 },
  "Belize": { vatRate: 12.5, exchangeRate: 2.0 },
  
  // Africa
  "South Africa": { vatRate: 15, exchangeRate: 18.5 },
  "Nigeria": { vatRate: 7.5, exchangeRate: 1230 },
  "Kenya": { vatRate: 16, exchangeRate: 130 },
  "Ghana": { vatRate: 15, exchangeRate: 12.5 },
  "Ethiopia": { vatRate: 15, exchangeRate: 52 },
  "Morocco": { vatRate: 20, exchangeRate: 10.1 },
  "Algeria": { vatRate: 19, exchangeRate: 134 },
  "Tunisia": { vatRate: 19, exchangeRate: 3.1 },
  "Libya": { vatRate: 0, exchangeRate: 4.85 },
  "Sudan": { vatRate: 0, exchangeRate: 580 },
  "Tanzania": { vatRate: 18, exchangeRate: 2550 },
  "Uganda": { vatRate: 18, exchangeRate: 3750 },
  "Rwanda": { vatRate: 18, exchangeRate: 1310 },
  "Cameroon": { vatRate: 19.25, exchangeRate: 615 },
  "Ivory Coast": { vatRate: 18, exchangeRate: 615 },
  "Senegal": { vatRate: 18, exchangeRate: 615 },
  "Mali": { vatRate: 18, exchangeRate: 615 },
  "Burkina Faso": { vatRate: 18, exchangeRate: 615 },
  "Niger": { vatRate: 19, exchangeRate: 615 },
  "Chad": { vatRate: 18, exchangeRate: 615 },
  "Zambia": { vatRate: 16, exchangeRate: 20.5 },
  "Zimbabwe": { vatRate: 15, exchangeRate: 950 },
  "Botswana": { vatRate: 14, exchangeRate: 13.5 },
  "Namibia": { vatRate: 15, exchangeRate: 18.5 },
  "Angola": { vatRate: 14, exchangeRate: 920 },
  "Mozambique": { vatRate: 17, exchangeRate: 63.5 },
  "Malawi": { vatRate: 16, exchangeRate: 1050 },
  "Lesotho": { vatRate: 14, exchangeRate: 18.5 },
  "Mauritius": { vatRate: 15, exchangeRate: 46 },
  "Seychelles": { vatRate: 0, exchangeRate: 13.5 },
  
  // Oceania
  "Australia": { vatRate: 10, exchangeRate: 1.53 },
  "New Zealand": { vatRate: 15, exchangeRate: 1.68 },
  "Fiji": { vatRate: 9, exchangeRate: 2.25 },
  "Papua New Guinea": { vatRate: 10, exchangeRate: 3.55 },
  "Solomon Islands": { vatRate: 10, exchangeRate: 8.35 },
  "Samoa": { vatRate: 15, exchangeRate: 2.7 },
  "Vanuatu": { vatRate: 12.5, exchangeRate: 118 },
  "Kiribati": { vatRate: 0, exchangeRate: 1.35 },
  "Marshall Islands": { vatRate: 0, exchangeRate: 1.0 },
  "Micronesia": { vatRate: 0, exchangeRate: 1.0 },
  "Nauru": { vatRate: 0, exchangeRate: 1.35 },
  "Palau": { vatRate: 0, exchangeRate: 1.0 },
  "Tuvalu": { vatRate: 0, exchangeRate: 1.35 },
};

/**
 * Get financial settings (VAT rate and exchange rate) for a specific country
 * @param country - Country name
 * @returns Object with vatRate and exchangeRate
 */
export function getFinancialSettingsByCountry(
  country: string | null | undefined
): CountryFinancialSettings {
  const defaultSettings: CountryFinancialSettings = { vatRate: 11, exchangeRate: 1.0 };
  
  if (!country) return defaultSettings;
  
  // Try exact match first
  if (COUNTRY_FINANCIAL_SETTINGS[country]) {
    return COUNTRY_FINANCIAL_SETTINGS[country];
  }
  
  // Try case-insensitive match
  const lowerCountry = country.toLowerCase();
  for (const [key, settings] of Object.entries(COUNTRY_FINANCIAL_SETTINGS)) {
    if (key.toLowerCase() === lowerCountry) {
      return settings;
    }
  }
  
  // Return default if not found
  return defaultSettings;
}

/**
 * Get VAT rate for a specific country
 * @param country - Country name
 * @param defaultRate - Default VAT rate if country not found (default: 11)
 * @returns VAT rate as a percentage
 */
export function getVATRateByCountry(country: string | null | undefined, defaultRate: number = 11): number {
  const settings = getFinancialSettingsByCountry(country);
  return settings.vatRate || defaultRate;
}

/**
 * Get exchange rate for a specific country (1 USD = X local currency)
 * @param country - Country name
 * @param defaultRate - Default exchange rate if country not found (default: 1.0)
 * @returns Exchange rate
 */
export function getExchangeRateByCountry(country: string | null | undefined, defaultRate: number = 1.0): number {
  const settings = getFinancialSettingsByCountry(country);
  return settings.exchangeRate || defaultRate;
}

/**
 * Get all available countries with their financial settings
 * @returns Array of countries sorted alphabetically
 */
export function getAllCountriesWithFinancialSettings(): Array<{ country: string; vatRate: number; exchangeRate: number }> {
  return Object.entries(COUNTRY_FINANCIAL_SETTINGS)
    .map(([country, settings]) => ({ country, ...settings }))
    .sort((a, b) => a.country.localeCompare(b.country));
}
