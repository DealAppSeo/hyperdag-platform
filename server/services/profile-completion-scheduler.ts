import { ProfileCompletionService } from './profile-completion-service';
import { db } from '../db';
import { users } from '../../shared/schema';
import { sql } from 'drizzle-orm';

export class ProfileCompletionScheduler {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the automated profile completion nudge scheduler
   */
  static start(): void {
    if (this.isRunning) {
      console.log('[ProfileCompletionScheduler] Already running');
      return;
    }

    console.log('[ProfileCompletionScheduler] Starting automated profile completion nudges');
    
    // Run immediately on startup
    this.processProfileCompletionNudges();
    
    // Then run every 24 hours (reduced frequency)
    this.intervalId = setInterval(() => {
      this.processProfileCompletionNudges();
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    this.isRunning = true;
  }

  /**
   * Stop the scheduler
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[ProfileCompletionScheduler] Stopped');
  }

  /**
   * Process all users for profile completion nudges
   */
  private static async processProfileCompletionNudges(): Promise<void> {
    try {
      console.log('[ProfileCompletionScheduler] Processing profile completion nudges...');
      
      // Get users who registered 1, 3, 7, or 14 days ago
      const targetDays = [1, 3, 7, 14];
      let totalProcessed = 0;
      let totalSent = 0;

      for (const days of targetDays) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);

        // Get users who registered exactly N days ago
        const targetUsers = await db
          .select()
          .from(users)
          .where(
            sql`${users.createdAt} >= ${startDate} AND ${users.createdAt} <= ${endDate} AND ${users.email} IS NOT NULL`
          );

        console.log(`[ProfileCompletionScheduler] Found ${targetUsers.length} users registered ${days} days ago`);

        for (const user of targetUsers) {
          try {
            // Check if profile needs completion
            const status = ProfileCompletionService.calculateCompletionStatus(user);
            
            // Skip if profile is already complete (90%+)
            if (status.overall >= 90) {
              console.log(`[ProfileCompletionScheduler] Skipping ${user.username} - profile already ${status.overall}% complete`);
              continue;
            }

            // Send the nudge
            const success = await ProfileCompletionService.sendCompletionNudge(user.id, days);
            
            if (success) {
              totalSent++;
              console.log(`[ProfileCompletionScheduler] Sent day ${days} nudge to ${user.username} (${status.overall}% complete)`);
            } else {
              console.log(`[ProfileCompletionScheduler] Failed to send nudge to ${user.username}`);
            }

            totalProcessed++;

            // Small delay to avoid overwhelming email services
            await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (error) {
            console.error(`[ProfileCompletionScheduler] Error processing user ${user.username}:`, error);
          }
        }
      }

      console.log(`[ProfileCompletionScheduler] Completed: ${totalSent}/${totalProcessed} nudges sent successfully`);

      // Also send welcome nudges for very new users (< 24 hours)
      await this.processWelcomeNudges();

    } catch (error) {
      console.error('[ProfileCompletionScheduler] Error in processing:', error);
    }
  }

  /**
   * Process welcome nudges for users registered within the last 24 hours
   */
  private static async processWelcomeNudges(): Promise<void> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const newUsers = await db
        .select()
        .from(users)
        .where(
          sql`${users.createdAt} >= ${twentyFourHoursAgo} AND ${users.email} IS NOT NULL`
        );

      console.log(`[ProfileCompletionScheduler] Processing ${newUsers.length} new users for welcome nudges`);

      for (const user of newUsers) {
        const status = ProfileCompletionService.calculateCompletionStatus(user);
        
        // Only send welcome nudge if profile is less than 50% complete
        if (status.overall < 50) {
          const hoursAgo = Math.floor((Date.now() - user.createdAt!.getTime()) / (1000 * 60 * 60));
          
          // Send welcome nudge after 2-4 hours for new users
          if (hoursAgo >= 2 && hoursAgo <= 4) {
            const success = await ProfileCompletionService.sendCompletionNudge(user.id, 1);
            if (success) {
              console.log(`[ProfileCompletionScheduler] Sent welcome nudge to new user ${user.username}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('[ProfileCompletionScheduler] Error in welcome nudges:', error);
    }
  }

  /**
   * Get scheduler status
   */
  static getStatus(): { running: boolean; nextRun?: Date } {
    return {
      running: this.isRunning,
      nextRun: this.isRunning ? new Date(Date.now() + 6 * 60 * 60 * 1000) : undefined
    };
  }

  /**
   * Manually trigger profile completion processing (for testing)
   */
  static async triggerManual(): Promise<{ processed: number; sent: number }> {
    console.log('[ProfileCompletionScheduler] Manual trigger initiated');
    
    let processed = 0;
    let sent = 0;
    
    try {
      // Get all users with incomplete profiles
      const allUsers = await db.select().from(users).where(sql`${users.email} IS NOT NULL`);
      
      for (const user of allUsers) {
        if (!user.createdAt) continue;
        
        const daysSinceRegistration = Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only process users within the nudge window (1-14 days)
        if (daysSinceRegistration >= 1 && daysSinceRegistration <= 14) {
          const status = ProfileCompletionService.calculateCompletionStatus(user);
          
          if (status.overall < 90) {
            const success = await ProfileCompletionService.sendCompletionNudge(user.id, daysSinceRegistration);
            if (success) sent++;
            processed++;
            
            // Small delay between sends
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error) {
      console.error('[ProfileCompletionScheduler] Error in manual trigger:', error);
    }
    
    console.log(`[ProfileCompletionScheduler] Manual trigger completed: ${sent}/${processed} nudges sent`);
    return { processed, sent };
  }
}