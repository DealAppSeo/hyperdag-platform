/**
 * Email Service
 * 
 * This service handles sending emails via Mailgun.
 * It provides a consistent interface for the rest of the application.
 */

import FormData from 'form-data';
import Mailgun from 'mailgun.js';

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

export class EmailService {
  private mailgun: any;
  private domain: string;
  private defaultSender: string;
  private isMailgunConfigured: boolean;

  constructor() {
    // Check Mailgun configuration
    this.domain = process.env.MAILGUN_DOMAIN || '';
    const mailgunApiKey = process.env.MAILGUN_API_KEY || '';
    this.defaultSender = process.env.EMAIL_SENDER || `HyperDAG <noreply@${this.domain}>`;
    
    this.isMailgunConfigured = !!this.domain && !!mailgunApiKey;
    
    if (this.isMailgunConfigured) {
      const mailgunClient = new Mailgun(FormData);
      this.mailgun = mailgunClient.client({ 
        username: 'api', 
        key: mailgunApiKey,
        url: 'https://api.mailgun.net' // Explicitly set Mailgun API URL
      });
      console.log('[email-service] Mailgun is configured and available');
      console.log(`[email-service] Using domain: ${this.domain}`);
      
      // Test domain verification on startup
      this.verifyDomain();
    } else {
      console.warn('[email-service] Mailgun is not configured. Check MAILGUN_DOMAIN and MAILGUN_API_KEY env variables.');
    }
  }

  private async verifyDomain() {
    try {
      const response = await fetch(`https://api.mailgun.net/v3/domains/${this.domain}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`
        }
      });
      
      if (response.ok) {
        const domain = await response.json();
        console.log(`[email-service] ✅ Domain verified: ${domain.domain?.name || this.domain}`);
        console.log(`[email-service] ✅ State: ${domain.domain?.state || 'unknown'}`);
      } else {
        console.error(`[email-service] ❌ Domain verification failed: ${response.status}`);
        console.error(`[email-service] Response: ${await response.text()}`);
      }
    } catch (error) {
      console.error('[email-service] Domain verification error:', error);
    }
  }

  /**
   * Send an email using Mailgun
   * 
   * @param params Email parameters
   * @returns Promise<boolean> indicating success
   */
  async sendEmail(params: EmailParams): Promise<boolean> {
    // Ensure required parameters
    if (!params.to || !params.subject || (!params.html && !params.text)) {
      console.error('[email-service] Missing required email parameters');
      return false;
    }

    // Set default sender if not provided
    const sender = params.from || this.defaultSender;
    
    console.log('============== EMAIL SENDING ATTEMPT ==============');
    console.log(`TO: ${params.to}`);
    console.log(`SUBJECT: ${params.subject}`);
    console.log(`FROM: ${sender}`);
    console.log(`MAILGUN CONFIGURED: ${this.isMailgunConfigured}`);
    console.log(`MAILGUN DOMAIN: ${this.domain}`);
    console.log('==================================================');
    
    // Use Mailgun for email delivery
    if (this.isMailgunConfigured) {
      try {
        const mailgunData: any = {
          from: sender,
          to: params.to,
          subject: params.subject,
          html: params.html || '',
          text: params.text || '',
        };
        
        if (params.replyTo) {
          mailgunData['h:Reply-To'] = params.replyTo;
        }
        
        // Add attachments if provided
        if (params.attachments && params.attachments.length > 0) {
          mailgunData['attachment'] = params.attachments;
        }
        
        console.log(`[email-service] Sending email via Mailgun to ${params.to}`);
        console.log(`[email-service] Using domain: ${this.domain}`);
        
        const result = await this.mailgun.messages.create(this.domain, mailgunData);
        console.log(`[email-service] Mailgun API response:`, JSON.stringify(result, null, 2));
        
        // Check if the result has an id which indicates successful queuing
        if (result && result.id) {
          console.log(`[email-service] Email successfully sent with Mailgun id: ${result.id}`);
          return true;
        } else {
          console.warn(`[email-service] Unexpected response from Mailgun:`, result);
          return false;
        }
      } catch (error) {
        console.error('[email-service] Mailgun sending failed:', error);
        return false;
      }
    } else {
      console.error('[email-service] Mailgun is not configured properly');
      return false;
    }
  }
  
  /**
   * Check if the email service is available
   * 
   * @returns boolean indicating if Mailgun is configured
   */
  isAvailable(): boolean {
    return this.isMailgunConfigured;
  }
  
  /**
   * Send an organization verification email
   * @param options Email options containing organization name and verification token
   * @returns Promise<boolean> indicating success
   */
  async sendOrganizationVerificationEmail(options: { 
    to: string; 
    organizationName: string; 
    verificationToken: string 
  }): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://hyperdag.org'}/organizations/verify/${options.verificationToken}`;
    
    return await this.sendEmail({
      to: options.to,
      subject: `Verify Your Non-Profit Organization on HyperDAG`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; color: #333;">
          <div style="background-color: #f7f9fc; padding: 15px; border-left: 4px solid #3498db;">
            <h2 style="color: #2c3e50; margin-top: 0;">Organization Verification Request</h2>
          </div>
          
          <div style="padding: 20px; border: 1px solid #eaeaea; margin-top: 15px; background-color: #fff;">
            <p>Hello,</p>
            <p>Thank you for submitting <strong>${options.organizationName}</strong> to the HyperDAG Non-Profit Directory.</p>
            
            <p>Please verify your organization by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Organization</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background-color: #f7f9fc; padding: 10px; word-break: break-all;">${verificationUrl}</p>
            
            <p>Once verified, your organization will go through our verification process. When approved, you'll receive a Soulbound Token (SBT) that establishes your organization's verified reputation on our platform.</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2e7d32;">Benefits of joining our directory:</h3>
              <ul style="padding-left: 20px;">
                <li>Receive token donations from HyperDAG users</li>
                <li>Build your reputation with transparent, verifiable credentials</li>
                <li>Maintain ownership and control of your organization's data</li>
                <li>Connect with donors who align with your mission</li>
              </ul>
            </div>
            
            <p>If you have any questions, please reply to this email.</p>
            
            <p>Best regards,<br>The HyperDAG Team</p>
          </div>
        </div>
      `,
      text: `
Organization Verification Request

Thank you for submitting ${options.organizationName} to the HyperDAG Non-Profit Directory.

Please verify your organization by visiting this link:
${verificationUrl}

Once verified, your organization will go through our verification process. When approved, you'll receive a Soulbound Token (SBT) that establishes your organization's verified reputation on our platform.

Benefits of joining our directory:
- Receive token donations from HyperDAG users
- Build your reputation with transparent, verifiable credentials
- Maintain ownership and control of your organization's data
- Connect with donors who align with your mission

If you have any questions, please reply to this email.

Best regards,
The HyperDAG Team
      `
    });
  }
  
  /**
   * Send an organization approval notification
   * @param options Email options containing organization name and SBT ID
   * @returns Promise<boolean> indicating success
   */
  async sendOrganizationApprovalEmail(options: { 
    to: string; 
    organizationName: string; 
    sbtId: string 
  }): Promise<boolean> {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://hyperdag.org'}/organizations/dashboard`;
    
    return await this.sendEmail({
      to: options.to,
      subject: `Your Organization Has Been Verified on HyperDAG`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; color: #333;">
          <div style="background-color: #f7f9fc; padding: 15px; border-left: 4px solid #4caf50;">
            <h2 style="color: #2c3e50; margin-top: 0;">Organization Verification Complete</h2>
          </div>
          
          <div style="padding: 20px; border: 1px solid #eaeaea; margin-top: 15px; background-color: #fff;">
            <p>Hello,</p>
            <p>Congratulations! <strong>${options.organizationName}</strong> has been verified and is now listed in the HyperDAG Non-Profit Directory.</p>
            
            <div style="background-color: #e8f5e9; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
              <p style="font-size: 18px; margin: 0; color: #2e7d32;">
                <strong>Your Soulbound Token (SBT) ID:</strong><br>
                <span style="font-family: monospace; background: #f1f8e9; padding: 5px; display: inline-block; margin-top: 10px; border: 1px solid #c5e1a5; border-radius: 3px;">${options.sbtId}</span>
              </p>
            </div>
            
            <p>This SBT serves as your organization's verifiable credential on the HyperDAG platform. It contains your verified reputation score and enables donors to securely contribute to your cause.</p>
            
            <p>You can now:</p>
            <ul style="padding-left: 20px;">
              <li>Receive token donations from HyperDAG users</li>
              <li>Build your reputation score through transparent operations</li>
              <li>Connect with donors who align with your mission</li>
              <li>Access your organization dashboard to monitor donations and reputation</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Access Your Dashboard</a>
            </div>
            
            <p>If you have any questions about managing your organization's profile or receiving donations, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The HyperDAG Team</p>
          </div>
        </div>
      `,
      text: `
Organization Verification Complete

Congratulations! ${options.organizationName} has been verified and is now listed in the HyperDAG Non-Profit Directory.

Your Soulbound Token (SBT) ID: ${options.sbtId}

This SBT serves as your organization's verifiable credential on the HyperDAG platform. It contains your verified reputation score and enables donors to securely contribute to your cause.

You can now:
- Receive token donations from HyperDAG users
- Build your reputation score through transparent operations
- Connect with donors who align with your mission
- Access your organization dashboard to monitor donations and reputation

Access Your Dashboard: ${dashboardUrl}

If you have any questions about managing your organization's profile or receiving donations, please don't hesitate to contact our support team.

Best regards,
The HyperDAG Team
      `
    });
  }
  
  /**
   * Check if email service is available and configured
   * @returns Promise<boolean> indicating if email service is working
   */
  async checkServiceStatus(): Promise<boolean> {
    return this.isAvailable();
  }

  /**
   * Send a referral reward notification
   * @param options Email options containing referrer name, organization name, and token amount
   * @returns Promise<boolean> indicating success
   */
  async sendReferralRewardEmail(options: { 
    to: string; 
    referrerName: string; 
    organizationName: string; 
    tokenAmount: number 
  }): Promise<boolean> {
    return await this.sendEmail({
      to: options.to,
      subject: `You've Earned a Referral Reward on HyperDAG`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; color: #333;">
          <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800;">
            <h2 style="color: #e65100; margin-top: 0;">Referral Reward Earned</h2>
          </div>
          
          <div style="padding: 20px; border: 1px solid #eaeaea; margin-top: 15px; background-color: #fff;">
            <p>Hello ${options.referrerName},</p>
            <p>Great news! The organization you referred, <strong>${options.organizationName}</strong>, has completed verification and is now listed in the HyperDAG Non-Profit Directory.</p>
            
            <div style="background-color: #fff3e0; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
              <p style="font-size: 18px; margin: 0; color: #e65100;">
                <strong>You've earned:</strong><br>
                <span style="font-size: 24px; display: block; margin-top: 10px;">${options.tokenAmount} HyperDAG Tokens</span>
              </p>
            </div>
            
            <p>These tokens have been added to your account balance. You can use them to:</p>
            <ul style="padding-left: 20px;">
              <li>Donate to verified non-profit organizations</li>
              <li>Access premium features on the platform</li>
              <li>Participate in governance decisions</li>
            </ul>
            
            <p>Thank you for helping grow the HyperDAG community and supporting worthy causes!</p>
            
            <p>Best regards,<br>The HyperDAG Team</p>
          </div>
        </div>
      `,
      text: `
Referral Reward Earned

Hello ${options.referrerName},

Great news! The organization you referred, ${options.organizationName}, has completed verification and is now listed in the HyperDAG Non-Profit Directory.

You've earned: ${options.tokenAmount} HyperDAG Tokens

These tokens have been added to your account balance. You can use them to:
- Donate to verified non-profit organizations
- Access premium features on the platform
- Participate in governance decisions

Thank you for helping grow the HyperDAG community and supporting worthy causes!

Best regards,
The HyperDAG Team
      `
    });
  }
  
  /**
   * Send an admin notification
   * @param options Notification options
   * @returns Promise<boolean> indicating success
   */
  async sendAdminNotification(options: { 
    subject: string; 
    message: string; 
    data?: any 
  }): Promise<boolean> {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    // Always include sean@ccanaheim.com as a recipient
    if (!adminEmails.includes('sean@ccanaheim.com')) {
      adminEmails.push('sean@ccanaheim.com');
    }
    
    if (adminEmails.length === 0) {
      console.warn("No admin emails configured for notifications");
      return false;
    }
    
    const dataString = options.data ? JSON.stringify(options.data, null, 2) : '';
    
    const promises = adminEmails.map(email => 
      this.sendEmail({
        to: email,
        subject: `[HyperDAG Admin] ${options.subject}`,
        text: `${options.message}
        
${dataString ? `Details:
${dataString}` : ''}

This is an automated notification from HyperDAG.`,
      })
    );
    
    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error sending admin notification:", error);
      return false;
    }
  }
}

/**
 * Send a verification code via email
 * @param email Email address to send to
 * @param code Verification code
 * @returns Promise<boolean> indicating success
 */
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const emailService = new EmailService();
  return await emailService.sendEmail({
    to: email,
    subject: 'Your HyperDAG Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">HyperDAG Verification</h2>
        <p>Here is your verification code:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</p>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this message.</p>
      </div>
    `,
    text: `HyperDAG Verification Code: ${code}\n\nThis code will expire in 10 minutes. If you didn't request this code, please ignore this message.`
  });
}

/**
 * Send a welcome email to a new user
 * @param email Email address to send to
 * @param username Username of the new user
 * @returns Promise<boolean> indicating success
 */
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  const emailService = new EmailService();
  return await emailService.sendEmail({
    to: email,
    subject: 'Welcome to HyperDAG - Where Privacy Meets Opportunity',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to HyperDAG!</h2>
        <p>Hi ${username},</p>
        <p>We're excited to have you join the HyperDAG community. You've taken the first step toward a privacy-first professional network where you control your data and credentials.</p>
        <p>Here's what you can do next:</p>
        <ol>
          <li>Complete your profile to unlock personalized opportunities</li>
          <li>Connect your wallet for enhanced security and verification</li>
          <li>Explore available grants and projects that match your skills</li>
        </ol>
        <p><a href="https://hyperdag.org/dashboard" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 15px;">Go to Dashboard</a></p>
        <p>Welcome to the future of privacy-first networking!</p>
        <p>The HyperDAG Team</p>
      </div>
    `,
    text: `Welcome to HyperDAG!\n\nHi ${username},\n\nWe're excited to have you join the HyperDAG community. You've taken the first step toward a privacy-first professional network where you control your data and credentials.\n\nHere's what you can do next:\n1. Complete your profile to unlock personalized opportunities\n2. Connect your wallet for enhanced security and verification\n3. Explore available grants and projects that match your skills\n\nGo to Dashboard: https://hyperdag.org/dashboard\n\nWelcome to the future of privacy-first networking!\n\nThe HyperDAG Team`
  });
}

/**
 * Send password change verification email
 * @param email Email address to send to
 * @param code Verification code
 * @returns Promise<boolean> indicating success
 */
export async function sendPasswordChangeVerificationEmail(email: string, code: string): Promise<boolean> {
  const emailService = new EmailService();
  return await emailService.sendEmail({
    to: email,
    subject: 'Verify Your Password Change Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Change Verification</h2>
        <p>We received a request to change your password. To verify this request, use the following code:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</p>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request a password change, please ignore this message.</p>
      </div>
    `,
    text: `Password Change Verification Code: ${code}\n\nThis code will expire in 10 minutes. If you didn't request a password change, please ignore this message.`
  });
}

/**
 * Send password reset email
 * @param email Email address to send to
 * @param code Reset code
 * @returns Promise<boolean> indicating success
 */
export async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  const emailService = new EmailService();
  return await emailService.sendEmail({
    to: email,
    subject: 'Reset Your HyperDAG Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset</h2>
        <p>We received a request to reset your password. Use the following code to reset your password:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</p>
        </div>
        <p>This code will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this message or contact support if you have concerns.</p>
      </div>
    `,
    text: `Password Reset Code: ${code}\n\nThis code will expire in 1 hour. If you didn't request a password reset, please ignore this message or contact support if you have concerns.`
  });
}

/**
 * Send admin notification for new user registration
 * @param username Username of the new user
 * @param persona User persona (optional)
 * @param referrer Username of referrer (optional)
 * @returns Promise<boolean> indicating success
 */
export async function sendAdminNewUserNotification(username: string, persona?: string, referrer?: string | null): Promise<boolean> {
  const emailService = new EmailService();
  
  // List of admin emails to notify
  const adminEmails = [
    process.env.ADMIN_EMAIL || 'dealappseo@gmail.com',
    'sean@ccanaheim.com'
  ];
  
  // Format dates for better readability
  const timestamp = new Date().toISOString();
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // More professional HTML email with better styling to avoid spam filters
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; color: #333;">
      <div style="background-color: #f7f9fc; padding: 15px; border-left: 4px solid #3498db;">
        <h2 style="color: #2c3e50; margin-top: 0;">HyperDAG Platform: New User Registration</h2>
      </div>
      
      <div style="padding: 20px; border: 1px solid #eaeaea; margin-top: 15px; background-color: #fff;">
        <p>Hello,</p>
        <p>This is an automated notification that a new user has registered on the HyperDAG platform.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea; width: 30%;"><strong>Username:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${username}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;"><strong>Persona:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${persona || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;"><strong>Referrer:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${referrer || 'None'}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Registration Time:</strong></td>
            <td style="padding: 10px;">${date}</td>
          </tr>
        </table>
        
        <p>Please review this new account in the admin dashboard when convenient.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #7f8c8d; font-size: 12px;">
          <p>This is an automated message from the HyperDAG platform. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} HyperDAG. All rights reserved.</p>
          <p>Timestamp: ${timestamp}</p>
        </div>
      </div>
    </div>
  `;
  
  // Plain text version with proper formatting
  const text = `HyperDAG Platform: New User Registration
  
Hello,

This is an automated notification that a new user has registered on the HyperDAG platform.

User Details:
- Username: ${username}
- Persona: ${persona || 'Not specified'}
- Referrer: ${referrer || 'None'}
- Registration Time: ${date}

Please review this new account in the admin dashboard when convenient.

---
This is an automated message from the HyperDAG platform. Please do not reply to this email.
© ${new Date().getFullYear()} HyperDAG. All rights reserved.
Timestamp: ${timestamp}`;

  // Send to all admin emails
  let allSucceeded = true;
  
  for (const adminEmail of adminEmails) {
    console.log(`[email-service] Sending admin notification to: ${adminEmail}`);
    
    const success = await emailService.sendEmail({
      to: adminEmail,
      subject: 'HyperDAG Platform: New User Registration',
      html,
      text
    });
    
    if (!success) {
      console.error(`[email-service] Failed to send admin notification to ${adminEmail}`);
      allSucceeded = false;
    }
  }
  
  return allSucceeded;
}

export const emailService = new EmailService();

/**
 * Send an email using the email service - accepts parameters as individual arguments
 * 
 * @param to Recipient email address
 * @param subject Email subject
 * @param message Email message (HTML content)
 * @param textVersion Plain text version (optional)
 * @returns Promise<boolean> indicating success
 */
export async function sendEmail(
  to: string, 
  subject: string, 
  message: string,
  textVersion?: string
): Promise<boolean>;

/**
 * Send an email using the email service - accepts parameters as an object
 * 
 * @param params Email parameters object
 * @returns Promise<boolean> indicating success
 */
export async function sendEmail(params: EmailParams): Promise<boolean>;

// Implementation
export async function sendEmail(
  toOrParams: string | EmailParams,
  subject?: string,
  message?: string,
  textVersion?: string
): Promise<boolean> {
  // If first parameter is a string, use the individual parameter format
  if (typeof toOrParams === 'string') {
    return await emailService.sendEmail({
      to: toOrParams,
      subject: subject!,
      html: message!,
      text: textVersion || message!.replace(/<[^>]*>/g, '') // Simple HTML to text conversion if not provided
    });
  } 
  // Otherwise, assume it's the params object format
  else {
    return await emailService.sendEmail(toOrParams);
  }
}

// Export status check function for redundant services
export async function checkEmailServiceStatus(): Promise<boolean> {
  return emailService.checkServiceStatus();
}