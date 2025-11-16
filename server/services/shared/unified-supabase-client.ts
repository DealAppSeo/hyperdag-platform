/**
 * Unified Supabase Client - Single Source of Truth
 * 
 * Eliminates duplicate Supabase client creation across services.
 * All services should import and use this shared client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

class UnifiedSupabaseClient {
  private static instance: UnifiedSupabaseClient;
  private client: SupabaseClient | null = null;
  private serviceClient: SupabaseClient | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): UnifiedSupabaseClient {
    if (!UnifiedSupabaseClient.instance) {
      UnifiedSupabaseClient.instance = new UnifiedSupabaseClient();
    }
    return UnifiedSupabaseClient.instance;
  }

  /**
   * Initialize Supabase clients (called once on server startup)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Unified Supabase] Already initialized');
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[Unified Supabase] ⚠️  Credentials not configured - some features will be unavailable');
      console.warn('[Unified Supabase] Set SUPABASE_URL and SUPABASE_ANON_KEY to enable:');
      console.warn('[Unified Supabase]   - Vector storage (Semantic RAG)');
      console.warn('[Unified Supabase]   - Real-time messaging (Trinity distributed)');
      console.warn('[Unified Supabase]   - SBT credentials sync');
      return;
    }

    try {
      // Public client (for client-side and authenticated operations)
      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: false, // Server-side, no session persistence needed
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      // Service client (for admin operations, if service key available)
      if (supabaseServiceKey) {
        this.serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
      }

      // Test connection
      const { error } = await this.client.from('_health').select('*').limit(1);
      if (error && !error.message.includes('does not exist')) {
        console.warn('[Unified Supabase] Connection test warning:', error.message);
      }

      this.isInitialized = true;
      console.log('[Unified Supabase] ✅ Initialized successfully');
      console.log('[Unified Supabase] 📋 Services enabled:');
      console.log('[Unified Supabase]    - Vector storage (Semantic RAG)');
      console.log('[Unified Supabase]    - Real-time messaging (Trinity Symphony)');
      console.log('[Unified Supabase]    - SBT credentials management');
      console.log('[Unified Supabase]    - Cross-deployment coordination');
    } catch (error) {
      console.error('[Unified Supabase] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get the public Supabase client (for normal operations)
   */
  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first or set SUPABASE_URL/SUPABASE_ANON_KEY');
    }
    return this.client;
  }

  /**
   * Get the service client (for admin operations)
   */
  getServiceClient(): SupabaseClient {
    if (!this.serviceClient) {
      console.warn('[Unified Supabase] Service client not available - using public client');
      return this.getClient();
    }
    return this.serviceClient;
  }

  /**
   * Check if Supabase is initialized and available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Get initialization status
   */
  getStatus(): {
    initialized: boolean;
    hasClient: boolean;
    hasServiceClient: boolean;
    configured: boolean;
  } {
    return {
      initialized: this.isInitialized,
      hasClient: this.client !== null,
      hasServiceClient: this.serviceClient !== null,
      configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        healthy: false,
        message: 'Supabase not configured or initialized'
      };
    }

    try {
      const { error } = await this.client!.from('_health').select('*').limit(1);
      if (error && !error.message.includes('does not exist')) {
        return {
          healthy: false,
          message: `Connection error: ${error.message}`
        };
      }

      return {
        healthy: true,
        message: 'Supabase connection healthy'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error}`
      };
    }
  }

  /**
   * Cleanup (called on server shutdown)
   */
  async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.removeAllChannels();
    }
    console.log('[Unified Supabase] 👋 Cleaned up connections');
  }
}

// Export singleton instance
export const unifiedSupabase = UnifiedSupabaseClient.getInstance();

// Convenience exports
export const getSupabaseClient = () => unifiedSupabase.getClient();
export const getSupabaseServiceClient = () => unifiedSupabase.getServiceClient();
export const isSupabaseAvailable = () => unifiedSupabase.isAvailable();
