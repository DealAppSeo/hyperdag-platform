/**
 * Notification Service
 * 
 * Handles all notification delivery through multiple channels:
 * - Email (via email-service)
 * - SMS (via sms-service)
 * - Push notifications (future)
 * 
 * Includes redundancy to ensure notifications reach users
 */

import { emailService } from './email-service';
import { smsService } from './sms-service';
import { formatNewUserNotification, formatAdminSmsNotification } from '../utils/referral-utils';
import { formatPhoneNumberForTwilio } from '../utils/phone-utils';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Admin notification config
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL || 'dealappseo@gmail.com',
  'sean@ccanaheim.com'
];
const ADMIN_PHONE = process.env.ADMIN_PHONE || '';

class NotificationService {
  /**
   * Send a notification about new user registration to administrators
   * 
   * @param user The newly registered user object
   * @returns Promise indicating success of notification delivery
   */
  async sendAdminNewUserNotification(user: any): Promise<boolean> {
    try {
      // Format notification content
      const notification = formatNewUserNotification(user);
      
      // Email notification to all admin emails (primary channel)
      let allEmailsSent = true;
      
      for (const adminEmail of ADMIN_EMAILS) {
        console.log(`[notification-service] Sending admin notification to: ${adminEmail}`);
        
        const emailSuccess = await emailService.sendEmail({
          to: adminEmail,
          subject: notification.subject,
          html: notification.htmlContent,
          text: notification.textContent
        });
        
        if (!emailSuccess) {
          console.error(`[notification-service] Failed to send admin notification to ${adminEmail}`);
          allEmailsSent = false;
        }
      }
      
      const emailSent = allEmailsSent;
      
      // SMS notification (secondary channel)
      let smsSent = false;
      if (ADMIN_PHONE) {
        const formattedPhone = formatPhoneNumberForTwilio(ADMIN_PHONE);
        if (formattedPhone) {
          const smsText = formatAdminSmsNotification(user);
          smsSent = await smsService.sendSms(formattedPhone, smsText);
        }
      }
      
      // Log the notification attempt
      console.log(`[notification-service] Admin notification for new user ${user.username}: Email=${emailSent ? 'sent' : 'failed'}, SMS=${smsSent ? 'sent' : 'not configured'}`);
      
      // Return true if at least one channel was successful
      return emailSent || smsSent;
    } catch (error) {
      console.error('[notification-service] Error sending admin notification:', error);
      return false;
    }
  }
  
  /**
   * Send a welcome message to a new user
   * 
   * @param user The newly registered user
   * @returns Promise indicating success of notification delivery
   */
  async sendWelcomeMessage(user: any): Promise<boolean> {
    try {
      const username = user.username || 'there';
      
      // Email welcome message
      const emailSent = await emailService.sendEmail({
        to: user.email,
        subject: 'Welcome to HyperDAG - Where Privacy Meets Opportunity',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Welcome to HyperDAG!</h2>
            <p>Hi ${username},</p>
            <p>We're excited to have you join the HyperDAG community. You've taken the first step toward a privacy-first professional network where you control your data and credentials.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Your Referral Code:</strong> ${user.referralCode || 'Will be generated soon'}</p>
              <p><strong>Share this code with others to earn rewards!</strong></p>
            </div>
            
            <p>Here's what you can do next:</p>
            <ol>
              <li>Complete your profile to unlock personalized opportunities</li>
              <li>Connect your wallet for enhanced security and verification</li>
              <li>Explore available grants and projects that match your skills</li>
            </ol>
            
            <p><a href="https://hyperdag.org/dashboard" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 15px;">Go to Dashboard</a></p>
            
            <p>If you have any questions, just reply to this email.</p>
            
            <p>Welcome to the future of privacy-first networking!</p>
            
            <p>The HyperDAG Team</p>
          </div>
        `,
        text: `
Welcome to HyperDAG!

Hi ${username},

We're excited to have you join the HyperDAG community. You've taken the first step toward a privacy-first professional network where you control your data and credentials.

Your Referral Code: ${user.referralCode || 'Will be generated soon'}
Share this code with others to earn rewards!

Here's what you can do next:
1. Complete your profile to unlock personalized opportunities
2. Connect your wallet for enhanced security and verification
3. Explore available grants and projects that match your skills

Go to Dashboard: https://hyperdag.org/dashboard

If you have any questions, just reply to this email.

Welcome to the future of privacy-first networking!

The HyperDAG Team
        `
      });
      
      // SMS welcome (if phone number provided and verified)
      let smsSent = false;
      if (user.phoneNumber) {
        const formattedPhone = formatPhoneNumberForTwilio(user.phoneNumber);
        if (formattedPhone) {
          const welcomeText = `Welcome to HyperDAG, ${username}! Your journey to privacy-first networking begins now. Visit hyperdag.org/dashboard to complete your profile.`;
          smsSent = await smsService.sendSms(formattedPhone, welcomeText);
        }
      }
      
      console.log(`[notification-service] Welcome notification for ${user.username}: Email=${emailSent ? 'sent' : 'failed'}, SMS=${smsSent ? 'sent' : 'not applicable'}`);
      
      return emailSent || smsSent;
    } catch (error) {
      console.error('[notification-service] Error sending welcome notification:', error);
      return false;
    }
  }
  
  /**
   * Send verification code to user
   * 
   * @param user User object
   * @param code Verification code
   * @param method Verification method (email or sms)
   * @returns Promise indicating success
   */
  async sendVerificationCode(user: any, code: string, method: 'email' | 'sms' = 'email'): Promise<boolean> {
    try {
      if (method === 'email' && user.email) {
        return await emailService.sendEmail({
          to: user.email,
          subject: 'Your HyperDAG Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4f46e5;">HyperDAG Verification</h2>
              <p>Hi ${user.username || 'there'},</p>
              <p>Here is your verification code:</p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</p>
              </div>
              
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this message.</p>
              
              <p>The HyperDAG Team</p>
            </div>
          `,
          text: `
HyperDAG Verification

Hi ${user.username || 'there'},

Here is your verification code:

${code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this message.

The HyperDAG Team
          `
        });
      } else if (method === 'sms' && user.phoneNumber) {
        const formattedPhone = formatPhoneNumberForTwilio(user.phoneNumber);
        if (formattedPhone) {
          const smsText = `Your HyperDAG verification code: ${code}. Valid for 10 minutes.`;
          return await smsService.sendSms(formattedPhone, smsText);
        }
      }
      
      return false;
    } catch (error) {
      console.error(`[notification-service] Error sending verification code via ${method}:`, error);
      return false;
    }
  }
  
  /**
   * Send password reset link to user
   * 
   * @param user User object
   * @param resetToken Password reset token
   * @returns Promise indicating success
   */
  async sendPasswordResetLink(user: any, resetCode: string): Promise<boolean> {
    try {
      if (!user.email) return false;
      
      return await emailService.sendEmail({
        to: user.email,
        subject: 'Reset Your HyperDAG Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Reset Your Password</h2>
            <p>Hi ${user.username || 'there'},</p>
            <p>We received a request to reset your password. Here is your password reset code:</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${resetCode}</p>
            </div>
            
            <p>Enter this code on the password reset page to create a new password. This code will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this message or contact support if you have concerns.</p>
            
            <p>The HyperDAG Team</p>
          </div>
        `,
        text: `
Reset Your Password

Hi ${user.username || 'there'},

We received a request to reset your password. Here is your password reset code:

${resetCode}

Enter this code on the password reset page to create a new password. This code will expire in 1 hour.

If you didn't request a password reset, please ignore this message or contact support if you have concerns.

The HyperDAG Team
        `
      });
    } catch (error) {
      console.error('[notification-service] Error sending password reset email:', error);
      return false;
    }
  }
  
  /**
   * Send security alert to user
   * 
   * @param user User object
   * @param alertType Type of security alert
   * @param details Additional details about the alert
   * @returns Promise indicating success
   */
  async sendSecurityAlert(
    user: any, 
    alertType: 'login_attempt' | 'password_changed' | 'account_locked' | 'wallet_connected', 
    details: any
  ): Promise<boolean> {
    try {
      if (!user.email) return false;
      
      let subject, message;
      
      switch (alertType) {
        case 'login_attempt':
          subject = 'Unusual Login Attempt Detected';
          message = `We detected a login attempt from a new device or location (${details.location || 'Unknown'}). If this was you, no action is needed. Otherwise, please secure your account immediately.`;
          break;
        case 'password_changed':
          subject = 'Your Password Was Changed';
          message = 'Your HyperDAG password was recently changed. If you made this change, no action is needed. If you did not change your password, please contact support immediately.';
          break;
        case 'account_locked':
          subject = 'Your Account Has Been Locked';
          message = `Your HyperDAG account has been temporarily locked due to ${details.reason || 'security concerns'}. Please contact support to resolve this issue.`;
          break;
        case 'wallet_connected':
          subject = 'New Wallet Connected to Your Account';
          message = `A new wallet (${details.wallet || 'Unknown'}) was connected to your HyperDAG account. If you authorized this connection, no action is needed. Otherwise, please secure your account immediately.`;
          break;
        default:
          subject = 'Security Alert';
          message = 'There has been a security-related activity on your HyperDAG account. Please review your recent account activity.';
      }
      
      return await emailService.sendEmail({
        to: user.email,
        subject: `Security Alert: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e11d48;">Security Alert</h2>
            <p>Hi ${user.username || 'there'},</p>
            <p>${message}</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>IP Address:</strong> ${details.ip || 'Not available'}</p>
              <p><strong>Device:</strong> ${details.device || 'Not available'}</p>
            </div>
            
            <p><a href="https://hyperdag.org/account/security" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 15px;">Review Account Security</a></p>
            
            <p>If you did not perform this action, please secure your account immediately.</p>
            
            <p>The HyperDAG Security Team</p>
          </div>
        `,
        text: `
Security Alert: ${subject}

Hi ${user.username || 'there'},

${message}

Time: ${new Date().toLocaleString()}
IP Address: ${details.ip || 'Not available'}
Device: ${details.device || 'Not available'}

Review your account security: https://hyperdag.org/account/security

If you did not perform this action, please secure your account immediately.

The HyperDAG Security Team
        `
      });
    } catch (error) {
      console.error('[notification-service] Error sending security alert:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();

// Add missing methods needed by the routes
notificationService.getUnreadCount = async (userId: number): Promise<number> => {
  try {
    const result = await db.execute(
      sql`SELECT COUNT(*) FROM notifications 
          WHERE user_id = ${userId} AND read = false`
    );
    return parseInt(result?.rows?.[0]?.count || '0', 10);
  } catch (error) {
    console.error('[notification-service] Error getting unread count:', error);
    return 0;
  }
};

notificationService.createNotification = async (
  userId: number,
  title: string,
  message: string,
  type: string = NotificationType.INFO
): Promise<any> => {
  try {
    const [notification] = await db.execute(
      sql`INSERT INTO notifications (user_id, type, title, message, created_at) 
          VALUES (${userId}, ${type}, ${title}, ${message}, NOW())
          RETURNING *`
    ).then(result => result.rows || []);
    
    return notification;
  } catch (error) {
    console.error('[notification-service] Error creating notification:', error);
    throw error;
  }
};

// Define NotificationType enum in case it's needed
enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SYSTEM = 'system',
  GRANT = 'grant',
  PROJECT = 'project',
  MESSAGE = 'message',
  REPUTATION = 'reputation',
  TEAM = 'team'
}