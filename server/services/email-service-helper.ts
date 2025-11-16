/**
 * Email Service Helper
 * 
 * This module provides helper functions for sending emails
 */

import { EmailService } from './email-service';

// Email Parameters Interface
interface EmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: any[];
}

/**
 * Send an email using the email service
 * @param to Recipient email address
 * @param subject Email subject
 * @param message Email message (HTML content)
 * @returns Promise<boolean> indicating success
 */
export async function sendEmail(to: string, subject: string, message: string): Promise<boolean> {
  const emailService = new EmailService();
  return await emailService.sendEmail({
    to,
    subject,
    html: message,
    text: message.replace(/<[^>]*>/g, '') // Simple HTML to text conversion
  });
}