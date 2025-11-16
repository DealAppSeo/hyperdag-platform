import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from '../db.js';
import { users, sbtCredentials, reputationActivities } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey: string;
}

export class SupabaseService {
  private client: SupabaseClient;
  private serviceClient: SupabaseClient;
  private isInitialized = false;

  constructor(config: SupabaseConfig) {
    // Public client for client-side operations
    this.client = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    // Service client for admin operations
    this.serviceClient = createClient(config.url, config.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      const { data, error } = await this.serviceClient.from('users').select('count').limit(1);
      if (error && !error.message.includes('relation "users" does not exist')) {
        throw error;
      }

      // Enable Row Level Security and create policies
      await this.setupSecurity();
      
      // Setup real-time subscriptions
      await this.setupRealtimeSubscriptions();
      
      this.isInitialized = true;
      console.log('[INFO][[supabase] Service initialized successfully]');
    } catch (error) {
      console.error('[ERROR][[supabase] Failed to initialize:', error);
      throw error;
    }
  }

  private async setupSecurity(): Promise<void> {
    try {
      // Enable RLS on main tables
      const tables = ['users', 'sbt_credentials', 'reputation_activities', 'grant_sources'];
      
      for (const table of tables) {
        await this.serviceClient.rpc('enable_rls', { table_name: table }).catch(() => {
          // Table might not exist yet, that's ok
        });
      }

      // Create security policies
      await this.createSecurityPolicies();
    } catch (error) {
      console.warn('[WARN][[supabase] Security setup failed:', error.message);
    }
  }

  private async createSecurityPolicies(): Promise<void> {
    const policies = [
      // Users can read their own data
      `CREATE POLICY "Users can view own profile" ON users 
       FOR SELECT USING (auth.uid()::text = id::text)`,
       
      // Users can update their own data
      `CREATE POLICY "Users can update own profile" ON users 
       FOR UPDATE USING (auth.uid()::text = id::text)`,
       
      // SBT credentials policies
      `CREATE POLICY "Users can view own credentials" ON sbt_credentials 
       FOR SELECT USING (auth.uid()::text = user_id::text)`,
       
      `CREATE POLICY "Users can create own credentials" ON sbt_credentials 
       FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
       
      // Reputation activities policies
      `CREATE POLICY "Users can view own reputation" ON reputation_activities 
       FOR SELECT USING (auth.uid()::text = user_id::text)`,
       
      // Grant sources are publicly readable
      `CREATE POLICY "Grant sources are publicly readable" ON grant_sources 
       FOR SELECT TO public USING (true)`
    ];

    for (const policy of policies) {
      await this.serviceClient.rpc('exec_sql', { sql: policy }).catch(() => {
        // Policy might already exist
      });
    }
  }

  private async setupRealtimeSubscriptions(): Promise<void> {
    // Subscribe to SBT credential changes
    this.client
      .channel('sbt-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sbt_credentials' },
        (payload) => this.handleSBTUpdate(payload)
      )
      .subscribe();

    // Subscribe to reputation changes
    this.client
      .channel('reputation-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reputation_activities' },
        (payload) => this.handleReputationUpdate(payload)
      )
      .subscribe();

    // Subscribe to grant opportunities
    this.client
      .channel('grant-updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'grant_sources' },
        (payload) => this.handleNewGrant(payload)
      )
      .subscribe();
  }

  private handleSBTUpdate(payload: any): void {
    console.log('[INFO][[supabase] SBT credential updated:', payload.new?.id);
    // Emit to connected clients or trigger notifications
  }

  private handleReputationUpdate(payload: any): void {
    console.log('[INFO][[supabase] Reputation updated for user:', payload.new?.user_id);
    // Trigger reputation score recalculation
  }

  private handleNewGrant(payload: any): void {
    console.log('[INFO][[supabase] New grant opportunity:', payload.new?.name);
    // Trigger AI matching for relevant users
  }

  // Enhanced Authentication Methods
  async createUser(email: string, password: string, metadata?: any): Promise<any> {
    const { data, error } = await this.serviceClient.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: false
    });

    if (error) throw error;
    return data.user;
  }

  async signInWithEmail(email: string, password: string): Promise<any> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signInWithProvider(provider: 'google' | 'github' | 'discord'): Promise<any> {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.BASE_URL}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getSession(): Promise<any> {
    const { data: { session } } = await this.client.auth.getSession();
    return session;
  }

  // Real-time SBT Credential Management
  async createSBTCredential(userId: number, credentialData: any): Promise<any> {
    // Create in local database first
    const [credential] = await db.insert(sbtCredentials).values({
      userId,
      ...credentialData
    }).returning();

    // Sync to Supabase for real-time capabilities
    const { data, error } = await this.serviceClient
      .from('sbt_credentials')
      .insert({
        id: credential.id,
        user_id: userId,
        type: credentialData.type,
        title: credentialData.title,
        description: credentialData.description,
        status: credentialData.status || 'pending',
        evidence: credentialData.evidence,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.warn('[WARN][[supabase] Failed to sync SBT credential:', error);
    }

    return credential;
  }

  async updateSBTCredential(credentialId: number, updates: any): Promise<any> {
    // Update local database
    const [updated] = await db.update(sbtCredentials)
      .set(updates)
      .where(eq(sbtCredentials.id, credentialId))
      .returning();

    // Sync to Supabase
    const { error } = await this.serviceClient
      .from('sbt_credentials')
      .update(updates)
      .eq('id', credentialId);

    if (error) {
      console.warn('[WARN][[supabase] Failed to sync SBT update:', error);
    }

    return updated;
  }

  // Real-time Reputation Management
  async updateReputation(userId: number, activity: any): Promise<void> {
    // Create in local database
    await db.insert(reputationActivities).values({
      userId,
      ...activity
    });

    // Trigger real-time update
    const { error } = await this.serviceClient
      .from('reputation_activities')
      .insert({
        user_id: userId,
        type: activity.type,
        points: activity.points,
        description: activity.description,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.warn('[WARN][[supabase] Failed to sync reputation:', error);
    }
  }

  // Storage Management
  async uploadCredentialEvidence(file: Buffer, fileName: string, userId: number): Promise<string> {
    const filePath = `credentials/${userId}/${Date.now()}_${fileName}`;
    
    const { data, error } = await this.serviceClient.storage
      .from('sbt-evidence')
      .upload(filePath, file, {
        contentType: 'application/octet-stream',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = this.serviceClient.storage
      .from('sbt-evidence')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async deleteCredentialEvidence(filePath: string): Promise<void> {
    const { error } = await this.serviceClient.storage
      .from('sbt-evidence')
      .remove([filePath]);

    if (error) throw error;
  }

  // Edge Functions Integration
  async invokeEdgeFunction(functionName: string, payload: any): Promise<any> {
    const { data, error } = await this.serviceClient.functions.invoke(functionName, {
      body: payload
    });

    if (error) throw error;
    return data;
  }

  // Analytics and Insights
  async getRealtimeMetrics(): Promise<any> {
    const { data, error } = await this.serviceClient
      .from('analytics_view')
      .select('*')
      .limit(100);

    if (error) throw error;
    return data;
  }

  async subscribeToUserActivity(userId: number, callback: (activity: any) => void): Promise<void> {
    this.client
      .channel(`user-${userId}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'reputation_activities',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.serviceClient.from('users').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.client.removeAllChannels();
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }
}

// Global instance
let supabaseService: SupabaseService | null = null;

export function initializeSupabase(config: SupabaseConfig): SupabaseService {
  if (!supabaseService) {
    supabaseService = new SupabaseService(config);
  }
  return supabaseService;
}

export function getSupabaseService(): SupabaseService | null {
  return supabaseService;
}