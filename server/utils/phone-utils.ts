/**
 * Utilities for phone number handling and formatting
 */

/**
 * Format a phone number to E.164 format for Twilio
 * E.164 format: [+][country code][subscriber number including area code]
 * Example: +14155552671
 * 
 * @param phoneNumber Phone number to format
 * @returns Formatted phone number or null if invalid
 */
export function formatPhoneNumberForTwilio(phoneNumber: string): string | null {
  if (!phoneNumber) return null;
  
  // Remove all non-numeric characters
  let digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats
  if (digitsOnly.length === 10) {
    // US number without country code - add +1
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // US number with country code but no plus - add plus
    return `+${digitsOnly}`;
  } else if (digitsOnly.length > 8) {
    // International number - assume it has country code but add plus if missing
    return phoneNumber.startsWith('+') ? phoneNumber : `+${digitsOnly}`;
  }
  
  // If we couldn't format it properly, return null
  return null;
}

/**
 * Validate if a phone number is properly formatted for SMS
 * 
 * @param phoneNumber Phone number to validate
 * @returns Boolean indicating if number is valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  // Format the number first
  const formatted = formatPhoneNumberForTwilio(phoneNumber);
  
  // Check if we got a valid formatted number
  if (!formatted) return false;
  
  // E.164 format validation: + followed by 10-15 digits
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  return e164Regex.test(formatted);
}

/**
 * Mask a phone number for display (privacy protection)
 * 
 * @param phoneNumber Phone number to mask
 * @returns Masked phone number
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Get formatted number first
  const formatted = formatPhoneNumberForTwilio(phoneNumber);
  if (!formatted) return phoneNumber;
  
  // Mask middle part of the number, preserving country code and last 4 digits
  const parts = formatted.match(/^\+(\d+)(\d{4})$/);
  if (!parts) return phoneNumber;
  
  const countryAndArea = parts[1].slice(0, -4);
  const lastFour = parts[2];
  
  // Replace middle digits with asterisks
  const masked = `+${countryAndArea}${'*'.repeat(4)}${lastFour}`;
  return masked;
}