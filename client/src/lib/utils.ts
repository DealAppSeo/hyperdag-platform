import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets user referral count from API response
 */
export function getUserReferralCount(user: any): number {
  // Handle different response formats
  if (!user) return 0;
  
  // Direct referral count if available
  if (typeof user.referralCount === 'number') return user.referralCount;
  
  // Alternately check referral stats if present
  if (user.referralStats && typeof user.referralStats.level1 === 'number') {
    return user.referralStats.level1;
  }
  
  // Count relationships if available
  if (Array.isArray(user.referrals)) {
    return user.referrals.length;
  }
  
  return 0;
}

/**
 * Check if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
