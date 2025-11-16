import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from './email-service';

export interface ProfileCompletionStatus {
  overall: number;
  basicInfo: boolean;
  skills: boolean;
  interests: boolean;
  bio: boolean;
  socialConnections: boolean;
  collaborationPreference: boolean;
  missingFields: string[];
  nextSteps: string[];
}

export class ProfileCompletionService {
  /**
   * Calculate profile completion percentage and status
   */
  static calculateCompletionStatus(user: any): ProfileCompletionStatus {
    const checks = {
      basicInfo: !!(user.username && user.email),
      skills: !!(user.skills && user.skills.length >= 3),
      interests: !!(user.interests && user.interests.length >= 2),
      bio: !!(user.bio && user.bio.length >= 10),
      socialConnections: this.hasSocialConnections(user),
      collaborationPreference: user.openToCollaboration !== null
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const overall = Math.round((completed / total) * 100);

    const missingFields = Object.entries(checks)
      .filter(([_, isComplete]) => !isComplete)
      .map(([field]) => field);

    const nextSteps = this.generateNextSteps(missingFields, overall);

    return {
      overall,
      ...checks,
      missingFields,
      nextSteps
    };
  }

  /**
   * Check if user has any social connections
   */
  private static hasSocialConnections(user: any): boolean {
    const socialFields = [
      'githubVerified', 'discordVerified', 'telegramVerified',
      'xVerified', 'linkedinVerified', 'youtubeVerified'
    ];
    return socialFields.some(field => user[field]);
  }

  /**
   * Generate personalized next steps based on completion status
   */
  private static generateNextSteps(missingFields: string[], overall: number): string[] {
    const stepMap: Record<string, string> = {
      basicInfo: 'Complete your basic profile information',
      skills: 'Add at least 3 skills to unlock AI matching',
      interests: 'Select your interests for better recommendations',
      bio: 'Write a brief bio to help others understand your background',
      socialConnections: 'Connect at least one social account for verification',
      collaborationPreference: 'Set your collaboration preferences'
    };

    // Prioritize steps based on impact
    const priority = ['skills', 'interests', 'bio', 'socialConnections', 'collaborationPreference', 'basicInfo'];
    
    return priority
      .filter(field => missingFields.includes(field))
      .map(field => stepMap[field])
      .slice(0, 3); // Return top 3 priorities
  }

  /**
   * Send profile completion nudge email
   */
  static async sendCompletionNudge(userId: number, daysSinceRegistration: number): Promise<boolean> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.email) return false;

      const status = this.calculateCompletionStatus(user);
      
      // Don't send if profile is already complete
      if (status.overall >= 90) return false;

      const emailTemplate = this.getEmailTemplate(daysSinceRegistration, status);
      
      const success = await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      });

      if (success) {
        console.log(`Profile completion nudge sent to user ${user.username} (${status.overall}% complete)`);
      }

      return success;
    } catch (error) {
      console.error('Error sending profile completion nudge:', error);
      return false;
    }
  }

  /**
   * Get appropriate email template based on days since registration
   */
  private static getEmailTemplate(days: number, status: ProfileCompletionStatus) {
    const templates = {
      1: {
        subject: "🚀 Complete your HyperDAG profile for personalized opportunities",
        html: this.generateWelcomeEmail(status),
        text: `Hi! Complete your HyperDAG profile to unlock AI-powered recommendations. You're ${status.overall}% done!`
      },
      3: {
        subject: "💡 Your skills + our AI = perfect matches",
        html: this.generateSkillsEmail(status),
        text: `Our AI is ready to find opportunities that match your exact skills. Complete your profile to get started!`
      },
      7: {
        subject: "📈 Complete profiles get 3x more opportunities",
        html: this.generateOpportunityEmail(status),
        text: `Users with complete profiles receive 3x more collaboration invites and grant matches. Don't miss out!`
      },
      14: {
        subject: "⏰ Last chance: Unlock AI team matching",
        html: this.generateFinalEmail(status),
        text: `Final reminder - complete your profile to access our powerful AI team matching system!`
      }
    };

    return templates[days as keyof typeof templates] || templates[14];
  }

  /**
   * Generate welcome email HTML
   */
  private static generateWelcomeEmail(status: ProfileCompletionStatus): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to HyperDAG! 🚀</h2>
        
        <p>You're off to a great start with your HyperDAG profile at <strong>${status.overall}% complete</strong>!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Complete your profile to unlock:</h3>
          <ul>
            <li>✨ AI-powered grant recommendations</li>
            <li>🤝 Smart team matching for collaborations</li>
            <li>🎯 Personalized project opportunities</li>
            <li>🏆 Higher reputation scores</li>
          </ul>
        </div>

        <h4>Your next steps:</h4>
        <ol>
          ${status.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ol>

        <a href="https://hyperdag.org/profile" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Complete Profile Now
        </a>

        <p style="color: #6b7280; font-size: 14px;">
          The more complete your profile, the better our AI can match you with perfect opportunities!
        </p>
      </div>
    `;
  }

  /**
   * Generate skills-focused email HTML
   */
  private static generateSkillsEmail(status: ProfileCompletionStatus): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Your Skills + Our AI = Perfect Matches 💡</h2>
        
        <p>Our AI matching system is waiting to find opportunities that fit your exact skillset!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Profile Progress: ${status.overall}%</strong></p>
          <div style="background: #e5e7eb; height: 8px; border-radius: 4px;">
            <div style="background: #2563eb; height: 8px; border-radius: 4px; width: ${status.overall}%;"></div>
          </div>
        </div>

        <h4>Complete these to unlock AI recommendations:</h4>
        <ul>
          ${status.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ul>

        <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong>💡 Pro Tip:</strong> Users with 3+ skills listed get matched with 5x more relevant opportunities!
        </div>

        <a href="https://hyperdag.org/profile" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Add Your Skills
        </a>
      </div>
    `;
  }

  /**
   * Generate opportunity-focused email HTML
   */
  private static generateOpportunityEmail(status: ProfileCompletionStatus): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Don't Miss Out on 3x More Opportunities! 📈</h2>
        
        <p>Users with complete profiles receive significantly more collaboration invites and grant matches.</p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h4 style="margin-top: 0;">📊 Profile Impact Stats:</h4>
          <ul style="margin-bottom: 0;">
            <li><strong>3x more</strong> collaboration invites</li>
            <li><strong>5x more</strong> grant matches</li>
            <li><strong>2x higher</strong> project success rate</li>
          </ul>
        </div>

        <p>You're currently at <strong>${status.overall}% complete</strong>. Just a few more steps to unlock full potential!</p>

        <h4>Priority actions:</h4>
        <ol>
          ${status.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ol>

        <a href="https://hyperdag.org/profile" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Complete Profile Today
        </a>
      </div>
    `;
  }

  /**
   * Generate final nudge email HTML
   */
  private static generateFinalEmail(status: ProfileCompletionStatus): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⏰ Final Reminder: Unlock AI Team Matching</h2>
        
        <p>This is your last automated reminder to complete your HyperDAG profile.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h4 style="margin-top: 0;">🚨 What you're missing:</h4>
          <ul>
            <li>AI-powered team member suggestions</li>
            <li>Automatic grant opportunity alerts</li>
            <li>Priority access to high-value projects</li>
            <li>Enhanced reputation scoring</li>
          </ul>
        </div>

        <p>Profile completion: <strong>${status.overall}%</strong></p>

        <h4>Final steps:</h4>
        <ol>
          ${status.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ol>

        <a href="https://hyperdag.org/profile" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Complete Now (2 minutes)
        </a>

        <p style="color: #6b7280; font-size: 14px;">
          After this, you'll only receive milestone celebration emails when you achieve new reputation levels.
        </p>
      </div>
    `;
  }

  /**
   * Process all users for profile completion nudges
   */
  static async processAllUsers(): Promise<void> {
    try {
      const allUsers = await db.select().from(users);
      
      for (const user of allUsers) {
        if (!user.createdAt) continue;
        
        const daysSinceRegistration = Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send nudges on specific days
        if ([1, 3, 7, 14].includes(daysSinceRegistration)) {
          await this.sendCompletionNudge(user.id, daysSinceRegistration);
          
          // Add small delay to avoid overwhelming email services
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error processing profile completion nudges:', error);
    }
  }
}