import { db } from "../db";
import { passwordResetTokens, users } from "@shared/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class PasswordRecoveryService {
  private mailgun: any;

  constructor() {
    if (!process.env.MAILGUN_API_KEY) {
      throw new Error("MAILGUN_API_KEY environment variable must be set");
    }
    
    const mg = new Mailgun(formData);
    this.mailgun = mg.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: 'https://api.mailgun.net'
    });
  }

  /**
   * Generate a secure OTP code
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a secure reset token
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create HTML email template for password reset
   */
  private createResetEmailTemplate(otpCode: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>HyperDAG Password Reset</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #000000; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #000000; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; color: #000000; }
          .otp-box { background: #f8fafc; border: 3px solid #667eea; color: #000000; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; color: #000000; }
          .security-notice { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; color: #000000; }
          .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #000000; border-top: 1px solid #e2e8f0; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>HyperDAG Security Team</p>
          </div>
          
          <div class="content">
            <h2>Hello${userName ? ` ${userName}` : ''}!</h2>
            
            <p>We received a request to reset your HyperDAG account password. Use the verification code below to complete your password reset:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 18px;">Your Verification Code</p>
              <div class="otp-code">${otpCode}</div>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Valid for 15 minutes</p>
            </div>
            
            <p><strong>Steps to reset your password:</strong></p>
            <ol>
              <li>Return to the HyperDAG password reset page</li>
              <li>Enter this 6-digit verification code</li>
              <li>Create your new secure password</li>
            </ol>
            
            <div class="security-notice">
              <strong>🛡️ Security Notice:</strong><br>
              • This code expires in 15 minutes<br>
              • Never share this code with anyone<br>
              • If you didn't request this reset, please ignore this email<br>
              • Contact support if you have concerns about your account security
            </div>
            
            <p>For your security, this password reset link will expire in 15 minutes. If you need a new code, you can request another reset from the login page.</p>
            
            <p>Best regards,<br>The HyperDAG Security Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated security message from HyperDAG.</p>
            <p>If you have questions, contact our support team.</p>
            <p style="font-size: 12px; margin-top: 20px;">
              HyperDAG - Secure Web3 & AI Ecosystem Platform<br>
              © 2025 HyperDAG. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Initiate password reset process
   */
  async initiatePasswordReset(
    email: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<{ success: boolean; message: string; resetToken?: string }> {
    try {
      // Check if user exists - only select needed columns to avoid schema issues
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        email: users.email
      })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        // Don't reveal that the email doesn't exist for security
        return {
          success: true,
          message: "If an account with this email exists, you will receive a password reset code shortly."
        };
      }

      // Generate OTP and reset token
      const otpCode = this.generateOTP();
      const resetToken = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Clean up any existing reset tokens for this email
      await db.delete(passwordResetTokens)
        .where(eq(passwordResetTokens.email, email));

      // Create new reset token
      await db.insert(passwordResetTokens).values({
        email,
        token: resetToken,
        otpCode,
        expiresAt,
        ipAddress,
        userAgent
      });

      // Send email with OTP
      const emailHtml = this.createResetEmailTemplate(otpCode, user.username);
      
      await this.mailgun.messages.create('hyperdag.org', {
        from: 'HyperDAG Security <noreply@hyperdag.org>',
        to: email,
        subject: '🔐 HyperDAG Password Reset - Verification Code',
        html: emailHtml,
        text: `Your HyperDAG password reset verification code is: ${otpCode}. This code expires in 15 minutes. If you didn't request this reset, please ignore this email.`
      });

      return {
        success: true,
        message: "A verification code has been sent to your email address.",
        resetToken
      };

    } catch (error) {
      console.error('Password reset initiation error:', error);
      return {
        success: false,
        message: "Unable to process password reset request. Please try again later."
      };
    }
  }

  /**
   * Verify OTP code and reset token
   */
  async verifyResetCode(
    resetToken: string, 
    otpCode: string
  ): Promise<{ success: boolean; message: string; email?: string }> {
    try {
      const now = new Date();
      
      // Find valid reset token
      const [resetRecord] = await db.select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, resetToken),
            eq(passwordResetTokens.otpCode, otpCode),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, now)
          )
        )
        .limit(1);

      if (!resetRecord) {
        return {
          success: false,
          message: "Invalid or expired verification code. Please request a new password reset."
        };
      }

      return {
        success: true,
        message: "Verification code confirmed. You can now set your new password.",
        email: resetRecord.email
      };

    } catch (error) {
      console.error('Reset code verification error:', error);
      return {
        success: false,
        message: "Unable to verify code. Please try again."
      };
    }
  }

  /**
   * Complete password reset with new password
   */
  async completePasswordReset(
    resetToken: string, 
    otpCode: string, 
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date();
      
      // Verify the reset token and OTP again
      const [resetRecord] = await db.select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, resetToken),
            eq(passwordResetTokens.otpCode, otpCode),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, now)
          )
        )
        .limit(1);

      if (!resetRecord) {
        return {
          success: false,
          message: "Invalid or expired reset session. Please start over."
        };
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user's password
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, resetRecord.email));

      // Mark reset token as used
      await db.update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetRecord.id));

      // Send confirmation email
      await this.sendPasswordChangeConfirmation(resetRecord.email);

      return {
        success: true,
        message: "Password successfully updated. You can now log in with your new password."
      };

    } catch (error) {
      console.error('Password reset completion error:', error);
      return {
        success: false,
        message: "Unable to update password. Please try again."
      };
    }
  }

  /**
   * Send password change confirmation email
   */
  private async sendPasswordChangeConfirmation(email: string): Promise<void> {
    try {
      const confirmationHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>HyperDAG Password Changed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .success-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; color: #166534; }
            .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Successfully Changed</h1>
              <p>HyperDAG Security Team</p>
            </div>
            
            <div class="content">
              <div class="success-box">
                <strong>🎉 Success!</strong><br>
                Your HyperDAG account password has been successfully updated.
              </div>
              
              <p>Your password was changed on ${new Date().toLocaleString()}.</p>
              
              <p><strong>What's next?</strong></p>
              <ul>
                <li>You can now log in with your new password</li>
                <li>Make sure to update any saved passwords</li>
                <li>Consider enabling two-factor authentication for enhanced security</li>
              </ul>
              
              <p><strong>Didn't make this change?</strong><br>
              If you didn't request this password change, please contact our support team immediately.</p>
              
              <p>Best regards,<br>The HyperDAG Security Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated security notification from HyperDAG.</p>
              <p style="font-size: 12px; margin-top: 20px;">
                HyperDAG - Secure Web3 & AI Ecosystem Platform<br>
                © 2025 HyperDAG. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.mailgun.messages.create('hyperdag.org', {
        from: 'HyperDAG Security <noreply@hyperdag.org>',
        to: email,
        subject: '✅ HyperDAG Password Successfully Changed',
        html: confirmationHtml,
        text: `Your HyperDAG account password has been successfully updated on ${new Date().toLocaleString()}. If you didn't make this change, please contact support immediately.`
      });

    } catch (error) {
      console.error('Failed to send password change confirmation:', error);
      // Don't throw error - password change was successful even if confirmation email failed
    }
  }

  /**
   * Clean up expired reset tokens (should be called periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      await db.delete(passwordResetTokens)
        .where(sql`${passwordResetTokens.expiresAt} < ${now}`);
    } catch (error) {
      console.error('Token cleanup error:', error);
    }
  }
}

export const passwordRecoveryService = new PasswordRecoveryService();