/**
 * Maps DATEV tax codes (Umsatzsteuerzahl) to actual tax percentages
 * According to DATEV standard tax key mapping
 */
export function mapDatevTaxCodeToPercentage(datevCode: string | null | undefined): string {
  if (!datevCode) return '0%';
  
  const code = datevCode.toString();
  
  const taxMapping: Record<string, string> = {
    '0': '0%',        // Keine Steuer
    '7': '7%',        // Vorsteuer 7%
    '9': '19%',       // Vorsteuer 19% 
    '94': '19%',      // Reverse-Charge 19%
    '95': '7%',       // Reverse-Charge 7%
  };
  
  return taxMapping[code] || `${code}%`; // Fallback to original if unknown
}

/**
 * Gets display text for DATEV tax codes including type information
 */
export function getDatevTaxDisplayText(datevCode: string | null | undefined): string {
  if (!datevCode) return 'Keine Steuer';
  
  const code = datevCode.toString();
  
  const taxDisplayMapping: Record<string, string> = {
    '0': 'Keine Steuer',
    '7': '7% Vorsteuer', 
    '9': '19% Vorsteuer',
    '94': '19% Reverse-Charge',
    '95': '7% Reverse-Charge',
  };
  
  return taxDisplayMapping[code] || `${code}% (Unbekannt)`;
}

/**
 * Maps percentage values back to DATEV tax codes for saving to database
 * Returns the most common DATEV code for a given percentage
 */
export function mapPercentageToDatevTaxCode(percentage: string | null | undefined): string {
  if (!percentage) return '0';
  
  const cleanPercentage = percentage.replace('%', '').trim();
  
  const reverseMapping: Record<string, string> = {
    '0': '0',        // Keine Steuer
    '7': '7',        // 7% -> Vorsteuer 7% (most common)
    '19': '9',       // 19% -> Vorsteuer 19% (most common)
  };
  
  return reverseMapping[cleanPercentage] || cleanPercentage;
}