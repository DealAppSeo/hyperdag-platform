import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { productionLogger as logger } from '../utils/production-logger';

export interface SybilDetectionResult {
  risk: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  flags: string[];
  blockedActions: string[];
  requiresManualReview: boolean;
}

export interface UserActivityPattern {
  userId: number;
  ipAddresses: string[];
  deviceFingerprints: string[];
  behaviorScore: number;
  activityTimestamps: Date[];
  referralNetwork: number[];
}

export class AntiGamingService {
  private readonly MAX_REFERRALS_PER_IP = 1; // Only 1 referral per IP
  private readonly MAX_REFERRALS_PER_DEVICE = 1; // Only 1 referral per device
  private readonly MIN_ACTIVITY_INTERVAL = 30 * 1000; // 30 seconds between meaningful actions
  private readonly SUSPICIOUS_BEHAVIOR_THRESHOLD = 0.2; // Much lower threshold
  private readonly DBT_TRANSFER_LIMIT_PER_DAY = 10; // Drastically reduced from 100 to 10
  private readonly DBT_TRANSFER_LIMIT_PER_MONTH = 100; // Monthly limit
  private readonly MAX_ACCOUNTS_PER_IP_24H = 1; // Only 1 account per IP per 24 hours
  private readonly MAX_ACCOUNTS_PER_IP_WEEK = 2; // Maximum 2 accounts per IP per week

  // Detect potential Sybil attacks through pattern analysis
  async detectSybilNetwork(userId: number): Promise<SybilDetectionResult> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new Error('User not found');
      }

      const flags: string[] = [];
      let riskScore = 0;

      // Check IP address clustering
      const ipClusterRisk = await this.analyzeIPClustering(userId);
      if (ipClusterRisk.suspicious) {
        flags.push(`IP clustering detected: ${ipClusterRisk.sharedIPs} shared IPs`);
        riskScore += 0.3;
      }

      // Check device fingerprint clustering
      const deviceClusterRisk = await this.analyzeDeviceClustering(userId);
      if (deviceClusterRisk.suspicious) {
        flags.push(`Device clustering detected: ${deviceClusterRisk.sharedDevices} shared devices`);
        riskScore += 0.25;
      }

      // Check behavioral patterns
      const behaviorRisk = await this.analyzeBehaviorPatterns(userId);
      if (behaviorRisk.suspicious) {
        flags.push(`Automated behavior detected: ${behaviorRisk.reason}`);
        riskScore += 0.4;
      }

      // Check referral network manipulation
      const referralRisk = await this.analyzeReferralNetwork(userId);
      if (referralRisk.suspicious) {
        flags.push(`Referral manipulation detected: ${referralRisk.reason}`);
        riskScore += 0.5;
      }

      // Check rapid account creation patterns
      const creationRisk = await this.analyzeAccountCreationPatterns(userId);
      if (creationRisk.suspicious) {
        flags.push(`Suspicious account creation pattern: ${creationRisk.reason}`);
        riskScore += 0.3;
      }

      // Determine risk level and blocked actions
      const risk = this.calculateRiskLevel(riskScore);
      const blockedActions = this.determineBlockedActions(risk, user[0]);

      return {
        risk,
        confidence: Math.min(riskScore, 1.0),
        flags,
        blockedActions,
        requiresManualReview: risk === 'critical' || flags.length >= 3
      };

    } catch (error) {
      logger.error('Sybil detection failed:', error);
      return {
        risk: 'medium',
        confidence: 0.5,
        flags: ['Detection system error'],
        blockedActions: ['token_transfer'],
        requiresManualReview: true
      };
    }
  }

  // Analyze IP address clustering patterns
  private async analyzeIPClustering(userId: number): Promise<{ suspicious: boolean; sharedIPs: number }> {
    const userActivity = await db.select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.timestamp))
      .limit(100);

    const userIPs = [...new Set(userActivity.map(a => a.ipAddress).filter(Boolean))];
    
    // Find other users sharing same IPs
    let sharedIPCount = 0;
    for (const ip of userIPs) {
      const sameIPUsers = await db.select({ userId: userActivities.userId })
        .from(userActivities)
        .where(and(
          eq(userActivities.metadata, { ipAddress: ip }),
          gte(userActivities.timestamp, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
        ))
        .groupBy(userActivities.userId);

      if (sameIPUsers.length > this.MAX_REFERRALS_PER_IP) {
        sharedIPCount++;
      }
    }

    return {
      suspicious: sharedIPCount > 0,
      sharedIPs: sharedIPCount
    };
  }

  // Analyze device fingerprint clustering
  private async analyzeDeviceClustering(userId: number): Promise<{ suspicious: boolean; sharedDevices: number }> {
    const userActivityData = await db.select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.timestamp))
      .limit(50);

    const deviceFingerprints = [...new Set(userActivityData.map(a => a.metadata?.deviceFingerprint).filter(Boolean))];
    
    let sharedDeviceCount = 0;
    for (const fingerprint of deviceFingerprints) {
      const sameDeviceUsers = await db.select({ userId: userActivities.userId })
        .from(userActivities)
        .where(and(
          eq(userActivities.metadata, { deviceFingerprint: fingerprint }),
          gte(userActivities.timestamp, new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) // Last 3 days
        ))
        .groupBy(userActivities.userId);

      if (sameDeviceUsers.length > this.MAX_REFERRALS_PER_DEVICE) {
        sharedDeviceCount++;
      }
    }

    return {
      suspicious: sharedDeviceCount > 0,
      sharedDevices: sharedDeviceCount
    };
  }

  // Analyze behavioral patterns for automation detection
  private async analyzeBehaviorPatterns(userId: number): Promise<{ suspicious: boolean; reason: string }> {
    const recentActivity = await db.select()
      .from(userActivities)
      .where(and(
        eq(userActivities.userId, userId),
        gte(userActivities.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      ))
      .orderBy(asc(userActivities.timestamp));

    if (recentActivity.length < 5) {
      return { suspicious: false, reason: '' };
    }

    // Check for suspiciously regular timing patterns
    const intervals = [];
    for (let i = 1; i < recentActivity.length; i++) {
      const interval = recentActivity[i].timestamp.getTime() - recentActivity[i-1].timestamp.getTime();
      intervals.push(interval);
    }

    // Calculate coefficient of variation for intervals
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Very regular timing suggests automation
    if (coefficientOfVariation < 0.1 && intervals.length > 10) {
      return { suspicious: true, reason: 'Highly regular timing patterns suggest automation' };
    }

    // Check for rapid-fire activities below minimum interval
    const rapidActions = intervals.filter(interval => interval < this.MIN_ACTIVITY_INTERVAL).length;
    if (rapidActions > intervals.length * 0.5) {
      return { suspicious: true, reason: 'Too many rapid-fire actions detected' };
    }

    // Check for identical action sequences (copy-paste behavior)
    const actionSequences = this.extractActionSequences(recentActivity);
    const duplicateSequences = this.findDuplicateSequences(actionSequences);
    if (duplicateSequences > 3) {
      return { suspicious: true, reason: 'Repeated identical action sequences detected' };
    }

    return { suspicious: false, reason: '' };
  }

  // Analyze referral network for manipulation
  private async analyzeReferralNetwork(userId: number): Promise<{ suspicious: boolean; reason: string }> {
    const userReferrals = await db.select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    if (userReferrals.length === 0) {
      return { suspicious: false, reason: '' };
    }

    // Check if referrals are from the same IP/device clusters
    let suspiciousReferrals = 0;
    for (const referral of userReferrals) {
      const referralSybilCheck = await this.detectSybilNetwork(referral.referredId);
      if (referralSybilCheck.risk === 'high' || referralSybilCheck.risk === 'critical') {
        suspiciousReferrals++;
      }
    }

    const suspiciousRatio = suspiciousReferrals / userReferrals.length;
    if (suspiciousRatio > 0.6) {
      return { 
        suspicious: true, 
        reason: `${suspiciousReferrals}/${userReferrals.length} referrals flagged as suspicious accounts` 
      };
    }

    // Check for rapid referral creation
    const recentReferrals = userReferrals.filter(r => 
      r.createdAt && r.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    if (recentReferrals.length > 2) { // Reduced from 10 to 2
      return { suspicious: true, reason: `${recentReferrals.length} referrals created in 24 hours` };
    }

    return { suspicious: false, reason: '' };
  }

  // Analyze account creation patterns
  private async analyzeAccountCreationPatterns(userId: number): Promise<{ suspicious: boolean; reason: string }> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return { suspicious: false, reason: '' };

    const creationTime = user[0].createdAt;
    if (!creationTime) return { suspicious: false, reason: '' };

    // Check for burst account creation in same time window
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const similarTimeAccounts = await db.select()
      .from(users)
      .where(and(
        gte(users.createdAt, new Date(creationTime.getTime() - timeWindow)),
        gte(users.createdAt, new Date(creationTime.getTime() + timeWindow))
      ));

    if (similarTimeAccounts.length > 3) { // Reduced from 20 to 3
      return { 
        suspicious: true, 
        reason: `${similarTimeAccounts.length} accounts created within 1-hour window` 
      };
    }

    // Check if account was immediately active (bot-like behavior)
    const firstActivity = await db.select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(asc(userActivities.timestamp))
      .limit(1);

    if (firstActivity.length > 0) {
      const timeBetweenCreationAndActivity = firstActivity[0].timestamp.getTime() - creationTime.getTime();
      if (timeBetweenCreationAndActivity < 5000) { // Less than 5 seconds
        return { suspicious: true, reason: 'Account became immediately active after creation' };
      }
    }

    return { suspicious: false, reason: '' };
  }

  // Enforce anti-gaming restrictions
  async enforceAntiGamingRestrictions(userId: number, action: string): Promise<{ allowed: boolean; reason?: string }> {
    const sybilResult = await this.detectSybilNetwork(userId);
    
    // Block critical risk users from all token operations
    if (sybilResult.risk === 'critical') {
      return { 
        allowed: false, 
        reason: 'Account flagged for critical security risk - manual review required' 
      };
    }

    // Restrict specific actions based on risk level
    if (sybilResult.blockedActions.includes(action)) {
      return { 
        allowed: false, 
        reason: `Action blocked due to ${sybilResult.risk} security risk: ${sybilResult.flags.join(', ')}` 
      };
    }

    // Additional DBT transfer limits for unverified users
    if (action === 'token_transfer') {
      const isVerified = await this.isUserSBTVerified(userId);
      if (!isVerified) {
        const todayTransfers = await this.getTodayTokenTransfers(userId);
        const monthlyTransfers = await this.getMonthlyTokenTransfers(userId);
        
        if (todayTransfers >= this.DBT_TRANSFER_LIMIT_PER_DAY) {
          return { 
            allowed: false, 
            reason: 'Daily DBT transfer limit (10 tokens) exceeded. Complete SBT verification for unlimited access.' 
          };
        }
        
        if (monthlyTransfers >= this.DBT_TRANSFER_LIMIT_PER_MONTH) {
          return { 
            allowed: false, 
            reason: 'Monthly DBT transfer limit (100 tokens) exceeded. Complete SBT verification for unlimited access.' 
          };
        }
      }
    }

    return { allowed: true };
  }

  // Helper methods
  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  private determineBlockedActions(risk: string, user: any): string[] {
    const actions: string[] = [];
    
    if (risk === 'critical') {
      actions.push('token_transfer', 'referral_rewards', 'voting', 'grant_applications', 'token_earning');
    } else if (risk === 'high') {
      actions.push('token_transfer', 'referral_rewards', 'token_earning');
    } else if (risk === 'medium') {
      actions.push('referral_rewards', 'token_earning');
    }

    return actions;
  }

  private extractActionSequences(activities: any[]): string[][] {
    const sequences: string[][] = [];
    const windowSize = 5;
    
    for (let i = 0; i <= activities.length - windowSize; i++) {
      const sequence = activities.slice(i, i + windowSize).map(a => a.activityType);
      sequences.push(sequence);
    }
    
    return sequences;
  }

  private findDuplicateSequences(sequences: string[][]): number {
    const sequenceMap = new Map<string, number>();
    
    for (const sequence of sequences) {
      const key = sequence.join('|');
      sequenceMap.set(key, (sequenceMap.get(key) || 0) + 1);
    }
    
    return Array.from(sequenceMap.values()).filter(count => count > 1).length;
  }

  private async isUserSBTVerified(userId: number): Promise<boolean> {
    const sbtCount = await db.select({ count: count() })
      .from(sbtCredentials)
      .where(and(
        eq(sbtCredentials.userId, userId),
        eq(sbtCredentials.verificationStatus, 'verified')
      ));
    
    return sbtCount[0]?.count > 0;
  }

  private async getTodayTokenTransfers(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const transfers = await db.select({ total: sum(userActivities.metadata) })
      .from(userActivities)
      .where(and(
        eq(userActivities.userId, userId),
        eq(userActivities.activityType, 'token_transfer'),
        gte(userActivities.timestamp, today)
      ));
    
    return parseInt(transfers[0]?.total as string || '0');
  }
  
  private async getMonthlyTokenTransfers(userId: number): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const transfers = await db.select({ total: sum(userActivities.metadata) })
      .from(userActivities)
      .where(and(
        eq(userActivities.userId, userId),
        eq(userActivities.activityType, 'token_transfer'),
        gte(userActivities.timestamp, monthAgo)
      ));
    
    return parseInt(transfers[0]?.total as string || '0');
  }

  // New method to check account creation limits
  async checkAccountCreationLimits(ipAddress: string): Promise<{ allowed: boolean; reason?: string }> {
    // Check 24-hour limit
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAccounts24h = await db.select({ count: count() })
      .from(userActivities)
      .where(and(
        eq(userActivities.activityType, 'account_creation'),
        eq(userActivities.metadata, { ipAddress }),
        gte(userActivities.timestamp, last24Hours)
      ));

    if (recentAccounts24h[0]?.count >= this.MAX_ACCOUNTS_PER_IP_24H) {
      return { 
        allowed: false, 
        reason: 'Maximum 1 account per IP address per 24 hours exceeded' 
      };
    }

    // Check weekly limit
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentAccountsWeek = await db.select({ count: count() })
      .from(userActivities)
      .where(and(
        eq(userActivities.activityType, 'account_creation'),
        eq(userActivities.metadata, { ipAddress }),
        gte(userActivities.timestamp, lastWeek)
      ));

    if (recentAccountsWeek[0]?.count >= this.MAX_ACCOUNTS_PER_IP_WEEK) {
      return { 
        allowed: false, 
        reason: 'Maximum 2 accounts per IP address per week exceeded' 
      };
    }

    return { allowed: true };
  }
}

export const antiGamingService = new AntiGamingService();