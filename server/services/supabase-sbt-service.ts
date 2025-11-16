import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from '../db.js';
import { sbtCredentials, reputationActivities, users } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

export interface SBTCredential {
  id: number;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected';
  issuedAt: string;
  evidenceUrl?: string;
}

export interface ReputationUpdate {
  type: string;
  points: number;
  description: string;
  timestamp: string;
}

export class SupabaseSBTService {
  private isConnected = false;
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Supabase client with your credentials
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('[INFO][[supabase-sbt] Supabase client initialized');
      }

      // Test database connection
      await db.select().from(users).limit(1);
      this.isConnected = true;
      console.log('[INFO][[supabase-sbt] Service initialized with database connection');
    } catch (error) {
      console.warn('[WARN][[supabase-sbt] Database connection failed:', error);
      this.isConnected = false;
    }
  }

  async healthCheck(): Promise<{ success: boolean; status: string; connection: boolean }> {
    return {
      success: this.isConnected,
      status: this.isConnected ? 'healthy' : 'disconnected',
      connection: this.isConnected
    };
  }

  async getUserCredentials(userId: number): Promise<SBTCredential[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      const credentials = await db
        .select()
        .from(sbtCredentials)
        .where(eq(sbtCredentials.userId, userId));

      return credentials.map(cred => ({
        id: cred.id,
        type: cred.type,
        title: cred.title,
        description: cred.description,
        status: cred.status as 'pending' | 'verified' | 'rejected',
        issuedAt: cred.issuedAt?.toISOString() || new Date().toISOString(),
        evidenceUrl: cred.evidence || undefined
      }));
    } catch (error) {
      console.error('Failed to fetch user credentials:', error);
      return [];
    }
  }

  async validateUserAuthRequirements(userId: number): Promise<{
    hasProfile: boolean;
    has2FA: boolean;
    hasWallet: boolean;
    canCreateSBT: boolean;
    errors: string[];
  }> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return {
          hasProfile: false,
          has2FA: false,
          hasWallet: false,
          canCreateSBT: false,
          errors: ['User not found']
        };
      }

      const hasProfile = !!(user.email && user.username && user.interests && user.interests.length > 0);
      const has2FA = !!(user.phoneNumber || user.telegramId);
      const hasWallet = !!(user.connectedWallets && user.connectedWallets.length > 0);
      const canCreateSBT = hasProfile && has2FA && hasWallet;

      const errors: string[] = [];
      if (!hasProfile) errors.push('Profile incomplete: missing email, username, or interests');
      if (!has2FA) errors.push('2FA not enabled: connect phone number or Telegram');
      if (!hasWallet) errors.push('No wallet connected: connect a Web3 wallet');

      return {
        hasProfile,
        has2FA,
        hasWallet,
        canCreateSBT,
        errors
      };
    } catch (error) {
      console.error('Failed to validate user auth requirements:', error);
      return {
        hasProfile: false,
        has2FA: false,
        hasWallet: false,
        canCreateSBT: false,
        errors: ['Failed to validate authentication requirements']
      };
    }
  }

  async createSBTCredential(userId: number, credentialData: {
    type: string;
    title: string;
    description: string;
    evidence?: string;
  }): Promise<SBTCredential> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    // Validate authentication requirements
    const authValidation = await this.validateUserAuthRequirements(userId);
    if (!authValidation.canCreateSBT) {
      throw new Error(`Authentication requirements not met: ${authValidation.errors.join(', ')}`);
    }

    try {
      const [newCredential] = await db
        .insert(sbtCredentials)
        .values({
          userId,
          type: credentialData.type,
          title: credentialData.title,
          description: credentialData.description,
          evidence: credentialData.evidence || '',
          status: 'pending',
          issuedAt: new Date(),
          zkProof: null,
          ipfsHash: null,
          isMonetizable: false,
          pricePerAccess: null,
          maxAccesses: null,
          accessCount: 0
        })
        .returning();

      return {
        id: newCredential.id,
        type: newCredential.type,
        title: newCredential.title,
        description: newCredential.description,
        status: newCredential.status as 'pending' | 'verified' | 'rejected',
        issuedAt: newCredential.issuedAt?.toISOString() || new Date().toISOString(),
        evidenceUrl: newCredential.evidence || undefined
      };
    } catch (error) {
      console.error('Failed to create SBT credential:', error);
      throw new Error('Failed to create credential');
    }
  }

  async updateCredentialStatus(credentialId: number, status: 'pending' | 'verified' | 'rejected', verificationNotes?: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      await db
        .update(sbtCredentials)
        .set({ 
          status,
          evidence: verificationNotes ? `${verificationNotes}` : undefined
        })
        .where(eq(sbtCredentials.id, credentialId));
    } catch (error) {
      console.error('Failed to update credential status:', error);
      throw new Error('Failed to update credential');
    }
  }

  async updateReputation(userId: number, activity: {
    type: string;
    points: number;
    description: string;
    metadata?: any;
  }): Promise<{ newTotalScore: number }> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      // Create reputation activity record
      await db.insert(reputationActivities).values({
        userId,
        type: activity.type,
        points: activity.points,
        description: activity.description,
        verifiedBy: null,
        projectId: null,
        zkProofId: null
      });

      // Get current user reputation
      const [user] = await db
        .select({ reputationScore: users.reputationScore })
        .from(users)
        .where(eq(users.id, userId));

      const currentScore = user?.reputationScore || 0;
      const newScore = currentScore + activity.points;

      // Update user's total reputation score
      await db
        .update(users)
        .set({ reputationScore: newScore })
        .where(eq(users.id, userId));

      return { newTotalScore: newScore };
    } catch (error) {
      console.error('Failed to update reputation:', error);
      throw new Error('Failed to update reputation');
    }
  }

  async getUserReputationScore(userId: number): Promise<{ totalScore: number; recentActivity: ReputationUpdate[] }> {
    if (!this.isConnected) {
      return { totalScore: 0, recentActivity: [] };
    }

    try {
      // Get user's total score
      const [user] = await db
        .select({ reputationScore: users.reputationScore })
        .from(users)
        .where(eq(users.id, userId));

      // Get recent activity
      const activities = await db
        .select()
        .from(reputationActivities)
        .where(eq(reputationActivities.userId, userId))
        .limit(5);

      const recentActivity = activities.map(activity => ({
        type: activity.type,
        points: activity.points,
        description: activity.description,
        timestamp: new Date().toISOString()
      }));

      return {
        totalScore: user?.reputationScore || 0,
        recentActivity
      };
    } catch (error) {
      console.error('Failed to get reputation score:', error);
      return { totalScore: 0, recentActivity: [] };
    }
  }

  async uploadCredentialEvidence(file: Buffer, fileName: string, userId: number, credentialData: {
    type: string;
    title: string;
    description: string;
  }): Promise<{ credential: SBTCredential; evidenceUrl: string }> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      // For now, we'll store a reference to the file rather than actual upload
      // In a full implementation, this would upload to Supabase Storage
      const evidenceUrl = `evidence/${userId}/${Date.now()}_${fileName}`;
      
      const credential = await this.createSBTCredential(userId, {
        ...credentialData,
        evidence: evidenceUrl
      });

      return {
        credential,
        evidenceUrl
      };
    } catch (error) {
      console.error('Failed to upload evidence:', error);
      throw new Error('Failed to upload evidence');
    }
  }
}

// Singleton instance
let supabaseSBTService: SupabaseSBTService | null = null;

export function getSupabaseSBTService(): SupabaseSBTService {
  if (!supabaseSBTService) {
    supabaseSBTService = new SupabaseSBTService();
  }
  return supabaseSBTService;
}

export function initializeSupabaseSBT(): SupabaseSBTService {
  return getSupabaseSBTService();
}