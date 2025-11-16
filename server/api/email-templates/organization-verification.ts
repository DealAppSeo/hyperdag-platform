import { config } from '../../config';

/**
 * Email template for organization verification
 */
export function generateOrganizationVerificationEmail(options: {
  organizationName: string;
  verificationToken: string;
}): { subject: string; html: string; text: string } {
  const verificationUrl = `${config.FRONTEND_URL}/organizations/verify/${options.verificationToken}`;
  
  const subject = `Verify Your Non-Profit Organization on HyperDAG`;
  
  const html = `
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
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #7f8c8d; font-size: 12px;">
          <p>This is an automated message from the HyperDAG platform. If you did not submit this organization, please disregard this email.</p>
          <p>© ${new Date().getFullYear()} HyperDAG. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
  
  const text = `
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

This is an automated message from the HyperDAG platform. If you did not submit this organization, please disregard this email.
© ${new Date().getFullYear()} HyperDAG. All rights reserved.
  `;
  
  return { subject, html, text };
}

/**
 * Email template for organization approval notification
 */
export function generateOrganizationApprovalEmail(options: {
  organizationName: string;
  sbtId: string;
}): { subject: string; html: string; text: string } {
  const dashboardUrl = `${config.FRONTEND_URL}/organizations/dashboard`;
  
  const subject = `Your Organization Has Been Verified on HyperDAG`;
  
  const html = `
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
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #7f8c8d; font-size: 12px;">
          <p>This is an automated message from the HyperDAG platform.</p>
          <p>© ${new Date().getFullYear()} HyperDAG. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
  
  const text = `
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

This is an automated message from the HyperDAG platform.
© ${new Date().getFullYear()} HyperDAG. All rights reserved.
  `;
  
  return { subject, html, text };
}

/**
 * Email template for referral reward notification
 */
export function generateReferralRewardEmail(options: {
  referrerName: string;
  organizationName: string;
  tokenAmount: number;
}): { subject: string; html: string; text: string } {
  const subject = `You've Earned a Referral Reward on HyperDAG`;
  
  const html = `
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
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #7f8c8d; font-size: 12px;">
          <p>This is an automated message from the HyperDAG platform.</p>
          <p>© ${new Date().getFullYear()} HyperDAG. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
  
  const text = `
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

This is an automated message from the HyperDAG platform.
© ${new Date().getFullYear()} HyperDAG. All rights reserved.
  `;
  
  return { subject, html, text };
}