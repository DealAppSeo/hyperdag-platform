/**
 * SMS Service (Legacy Compatibility Layer)
 * 
 * This service provides backward compatibility for existing SMS functionality
 * while leveraging the comprehensive TwilioService for enhanced features.
 * 
 * For new implementations, use TwilioService directly from './twilio-service.js'
 */

import { getTwilioService, sendSMS } from './twilio-service.js';
import { logger } from '../utils/logger.js';

export class SmsService {
  private twilioService = getTwilioService();

  constructor() {
    if (this.twilioService.isAvailable()) {
      logger.info('[sms-service] Twilio is fully configured and available (via TwilioService)');
    } else {
      logger.warn('[sms-service] Twilio is not properly configured. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
    }
  }

  /**
   * Send an SMS message (Legacy compatibility method)
   * 
   * @param to Recipient phone number
   * @param message Text message to send
   * @returns Promise<boolean> indicating success
   */
  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      return await sendSMS(to, message);
    } catch (error) {
      logger.error('[sms-service] Error sending SMS:', error);
      return false;
    }
  }

  /**
   * Check if SMS service is available
   * 
   * @returns boolean indicating if Twilio is configured
   */
  isAvailable(): boolean {
    return this.twilioService.isAvailable();
  }

  /**
   * Get the underlying Twilio service for advanced operations
   * 
   * @returns TwilioService instance
   */
  getTwilioService() {
    return this.twilioService;
  }
}

export const smsService = new SmsService();

/**
 * Helper function to send an SMS using the SMS service
 * @param phoneNumber Phone number to send to
 * @param message Message to send
 * @returns Promise<boolean> indicating success
 */
export async function sendSms(phoneNumber: string, message: string): Promise<boolean> {
  return await smsService.sendSms(phoneNumber, message);
}