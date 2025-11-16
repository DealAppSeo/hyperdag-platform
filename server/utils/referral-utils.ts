/**
 * Server-side utilities for referrals and notifications
 */

import { formatPhoneNumberForTwilio } from './phone-utils';

/**
 * Generate a referral code for new users
 * @param username Username to base the code on
 * @returns A referral code
 */
export function generateReferralCode(username: string = 'user'): string {
  const prefix = username.slice(0, 4).toUpperCase();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${random}`;
}

/**
 * Format admin notification content for a new user registration
 * @param user Newly registered user
 * @returns Formatted notification content
 */
export function formatNewUserNotification(user: any): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const now = new Date();
  const dateFormatted = now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
  
  // Format subject
  const subject = `New HyperDAG Registration: ${user.username}`;
  
  // Format HTML content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">New User Registration</h2>
      <p>A new user has registered on HyperDAG:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Email:</strong> ${user.email || 'Not provided'}</p>
        <p><strong>Registration Time:</strong> ${dateFormatted}</p>
        <p><strong>Referral Code:</strong> ${user.referralCode || 'None generated'}</p>
        <p><strong>Referred By:</strong> ${user.referredBy || 'Organic sign-up'}</p>
      </div>
      
      <p>You can view the full user details in the <a href="https://hyperdag.org/admin/users" style="color: #4f46e5;">Admin Dashboard</a>.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p>This is an automated notification from HyperDAG.</p>
      </div>
    </div>
  `;
  
  // Format plain text content
  const textContent = `
New User Registration on HyperDAG

A new user has registered:

Username: ${user.username}
Email: ${user.email || 'Not provided'}
Registration Time: ${dateFormatted}
Referral Code: ${user.referralCode || 'None generated'}
Referred By: ${user.referredBy || 'Organic sign-up'}

View full details in the Admin Dashboard: https://hyperdag.org/admin/users

This is an automated notification from HyperDAG.
  `;
  
  return {
    subject,
    htmlContent,
    textContent
  };
}

/**
 * Format welcome message content for SMS
 * @param user Newly registered user
 * @returns Formatted SMS content
 */
export function formatWelcomeSms(user: any): string {
  return `Welcome to HyperDAG, ${user.username}! Your journey to privacy-first professional networking begins now. Verify your email to activate your account.`;
}

/**
 * Generate admin SMS notification for new registration
 * @param user Newly registered user
 * @returns SMS notification content
 */
export function formatAdminSmsNotification(user: any): string {
  return `[HyperDAG Admin] New user registration: ${user.username} (${user.email || 'No email'}) at ${new Date().toLocaleString()}`;
}

/**
 * Generate a shorter referral code for SMS sharing
 * @param referralCode Original referral code
 * @returns Shortened referral code
 */
export function shortenReferralCodeForSms(referralCode: string): string {
  // Keep just enough characters to maintain uniqueness but save space in SMS
  return referralCode.slice(0, 6);
}

/**
 * Check if phone number is valid for notification
 * @param phoneNumber Phone number to validate
 * @returns Boolean indicating if number is valid
 */
export function isValidPhoneForNotification(phoneNumber: string | null | undefined): boolean {
  if (!phoneNumber) return false;
  
  // Convert to E.164 format
  const formattedNumber = formatPhoneNumberForTwilio(phoneNumber);
  
  // Basic check: at least 10 digits and proper format
  return !!formattedNumber && formattedNumber.length >= 10;
}